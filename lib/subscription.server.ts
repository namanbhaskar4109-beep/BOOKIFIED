import { auth } from '@clerk/nextjs/server';
import {
  PlanType,
  PLAN_LIMITS,
  PlanLimits,
  getCurrentBillingPeriodStart,
} from '@/lib/subscription-constants';
import { connectToDatabase } from '@/database/mongoose';
import Book from '@/database/models/book.model';
import VoiceSession from '@/database/models/voice-session.model';
import { SessionCheckResult } from '@/types';

/**
 * Server-side helper to get the authenticated user's current subscription plan
 * using Clerk's has() method.
 */
export async function getUserPlan(): Promise<PlanType> {
  try {
    const { has, userId } = await auth();

    if (!userId) {
      return 'free';
    }

    if (has) {
      if (has({ plan: 'pro' })) {
        return 'pro';
      }

      if (has({ plan: 'standard' })) {
        return 'standard';
      }
    }

    // Check user publicMetadata for verified active paid subscription
    const { currentUser } = await import('@clerk/nextjs/server');
    const user = await currentUser();
    const metaPlan = user?.publicMetadata?.plan as PlanType | undefined;
    const subStatus = user?.publicMetadata?.subscriptionStatus as string | undefined;

    if (subStatus === 'active' && metaPlan && (metaPlan === 'pro' || metaPlan === 'standard')) {
      return metaPlan;
    }

    return 'free';
  } catch (error) {
    console.error('Error checking user plan with Clerk has():', error);
    return 'free';
  }
}

/**
 * Server-side helper to get the limits for the authenticated user's current plan.
 */
export async function getUserPlanLimits(): Promise<PlanLimits & { plan: PlanType }> {
  const plan = await getUserPlan();
  return {
    ...PLAN_LIMITS[plan],
    plan,
  };
}

/**
 * Check if the user is allowed to upload another book based on their plan limits.
 */
export async function checkBookUploadLimit(clerkId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  maxBooks: number;
  plan: PlanType;
  error?: string;
}> {
  await connectToDatabase();

  const { plan, maxBooks, name } = await getUserPlanLimits();
  const currentCount = await Book.countDocuments({ clerkId });

  if (currentCount >= maxBooks) {
    return {
      allowed: false,
      currentCount,
      maxBooks,
      plan,
      error: `You have reached your book limit (${maxBooks} book${maxBooks === 1 ? '' : 's'}) on the ${name} plan. Upgrade your plan to add more books.`,
    };
  }

  return {
    allowed: true,
    currentCount,
    maxBooks,
    plan,
  };
}

/**
 * Check if the user is allowed to start another voice session in the current calendar month.
 */
export async function checkSessionLimit(clerkId: string): Promise<SessionCheckResult> {
  await connectToDatabase();

  const { plan, maxSessionsPerMonth, maxDurationPerSession, name } = await getUserPlanLimits();
  const billingPeriodStart = getCurrentBillingPeriodStart();

  const currentCount = await VoiceSession.countDocuments({
    clerkId,
    billingPeriodStart,
  });

  if (maxSessionsPerMonth !== Infinity && currentCount >= maxSessionsPerMonth) {
    return {
      allowed: false,
      currentCount,
      limit: maxSessionsPerMonth,
      plan,
      maxDurationMinutes: maxDurationPerSession,
      error: `You have reached your monthly session limit (${maxSessionsPerMonth} sessions) on the ${name} plan for this calendar month. Upgrade your plan for more sessions.`,
    };
  }

  return {
    allowed: true,
    currentCount,
    limit: maxSessionsPerMonth,
    plan,
    maxDurationMinutes: maxDurationPerSession,
  };
}
