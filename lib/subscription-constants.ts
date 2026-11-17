// Shared subscription constants and plan limits for Clerk Billing

export type PlanType = 'free' | 'standard' | 'pro';

export interface PlanLimits {
  name: string;
  maxBooks: number;
  maxSessionsPerMonth: number; // Use Infinity for unlimited
  maxDurationPerSession: number; // In minutes
  hasHistory: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    name: 'Free',
    maxBooks: 1,
    maxSessionsPerMonth: 5,
    maxDurationPerSession: 5,
    hasHistory: false,
  },
  standard: {
    name: 'Standard',
    maxBooks: 10,
    maxSessionsPerMonth: 100,
    maxDurationPerSession: 15,
    hasHistory: true,
  },
  pro: {
    name: 'Pro',
    maxBooks: 100,
    maxSessionsPerMonth: Infinity,
    maxDurationPerSession: 60,
    hasHistory: true,
  },
};

export const PLANS = PLAN_LIMITS;

/**
 * Returns the start of the current calendar month (e.g. 2026-11-01T00:00:00.000Z)
 * used for tracking monthly voice session limits per billing period.
 */
export const getCurrentBillingPeriodStart = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};
