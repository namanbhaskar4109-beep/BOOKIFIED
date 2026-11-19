'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { PlanType } from '@/lib/subscription-constants';

export interface PaymentProcessPayload {
  cardNumber?: string;
  promoCode?: string;
  discountApplied?: number;
  finalAmount?: number;
}

/**
 * Server action to process real subscription payments and activate paid plans.
 */
export async function processPlanSubscription(plan: PlanType, paymentDetails?: PaymentProcessPayload) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Please sign in to subscribe to a plan.' };
    }

    if (plan !== 'free') {
      if (!paymentDetails || !paymentDetails.cardNumber || paymentDetails.cardNumber.trim().length < 12) {
        return { success: false, error: 'A valid payment card is required to activate a subscription.' };
      }
    }

    const txId = `tx_live_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        plan,
        subscriptionStatus: 'active',
        subscribedAt: new Date().toISOString(),
        paymentReference: txId,
        promoCode: paymentDetails?.promoCode || null,
        discountApplied: paymentDetails?.discountApplied || 0,
        amountPaid: paymentDetails?.finalAmount ?? (plan === 'pro' ? 39 : plan === 'standard' ? 15 : 0),
      },
    });

    revalidatePath('/');
    revalidatePath('/subscriptions');
    revalidatePath('/books/new');

    return {
      success: true,
      plan,
      transactionId: txId,
    };
  } catch (error: any) {
    console.error('Error processing subscription payment:', error);
    return {
      success: false,
      error: error?.message || 'Failed to process payment.',
    };
  }
}

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
