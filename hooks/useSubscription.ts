'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { PlanType, PLAN_LIMITS, PlanLimits } from '@/lib/subscription-constants';

export interface UseSubscriptionReturn {
  plan: PlanType;
  limits: PlanLimits;
  isLoaded: boolean;
  isSignedIn: boolean;
  hasActiveSubscription: boolean;
}

/**
 * Client-side hook to determine the current user's subscription tier and plan limits
 * using Clerk's client-side has() method and active user session metadata.
 */
export function useSubscription(): UseSubscriptionReturn {
  const { has, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  let plan: PlanType = 'free';

  if (isLoaded && isSignedIn) {
    if (has && has({ plan: 'pro' })) {
      plan = 'pro';
    } else if (has && has({ plan: 'standard' })) {
      plan = 'standard';
    } else if (user?.publicMetadata?.plan === 'pro') {
      plan = 'pro';
    } else if (user?.publicMetadata?.plan === 'standard') {
      plan = 'standard';
    }
  }

  const limits: PlanLimits = PLAN_LIMITS[plan];

  return {
    plan,
    limits,
    isLoaded,
    isSignedIn: !!isSignedIn,
    hasActiveSubscription: plan !== 'free',
  };
}

export default useSubscription;
