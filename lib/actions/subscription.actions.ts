'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { PlanType } from '@/lib/subscription-constants';

/**
 * Revalidates subscription-dependent pages after checkout or plan changes.
 * Paid plan statuses are strictly managed by Clerk Billing via has().
 */
export async function revalidateSubscriptionState() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    revalidatePath('/');
    revalidatePath('/subscriptions');
    revalidatePath('/books/new');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to revalidate subscription' };
  }
}

/**
 * Revalidates subscription state. Subscriptions are strictly handled and verified via Clerk Billing.
 */
export async function processPlanSubscription(_plan: PlanType) {
  return revalidateSubscriptionState();
}

