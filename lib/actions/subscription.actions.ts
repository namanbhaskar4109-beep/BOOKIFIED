'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { PlanType } from '@/lib/subscription-constants';

/**
 * Server action to process plan upgrades and store active subscription details.
 */
export async function processPlanSubscription(plan: PlanType) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Please sign in to subscribe to a plan.' };
    }

    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        plan,
        subscriptionStatus: 'active',
        subscribedAt: new Date().toISOString(),
      },
    });

    revalidatePath('/');
    revalidatePath('/subscriptions');
    revalidatePath('/books/new');

    return { success: true, plan };
  } catch (error: any) {
    console.error('Error processing subscription:', error);
    return {
      success: false,
      error: error?.message || 'Failed to update subscription.',
    };
  }
}
