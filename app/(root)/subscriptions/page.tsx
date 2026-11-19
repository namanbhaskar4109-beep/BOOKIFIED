import React from 'react';
import { Sparkles, ShieldCheck, Lock, CreditCard } from 'lucide-react';
import { PricingTable } from '@clerk/nextjs';
import DiscountBanner from '@/components/DiscountBanner';

export const metadata = {
  title: 'Subscriptions & Pricing | Bookified',
  description: 'Choose a subscription plan to unlock more book uploads and voice conversations.',
};

export default function SubscriptionsPage() {
  return (
    <div className="w-full flex flex-col items-center py-10 px-4 max-w-6xl mx-auto min-h-[calc(100vh-100px)]">
      {/* Header Banner */}
      <div className="flex flex-col items-center text-center max-w-2xl mb-8">
        <div className="inline-flex items-center gap-2 bg-[#f3e4c7] text-[#663820] px-4 py-1.5 rounded-full text-xs font-semibold mb-4 shadow-2xs">
          <Sparkles className="size-4 text-[#663820]" />
          <span>Flexible Plans for Readers</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#212a3b] tracking-tight mb-4">
          Upgrade Your Library
        </h1>
        <p className="text-base text-[#3d485e] leading-relaxed max-w-xl">
          Expand your interactive reading experience. Upload more books, talk with AI companions for longer, and unlock unlimited voice sessions.
        </p>
      </div>

      {/* Discount Code Section (Coupons Created in Clerk) */}
      <div className="w-full max-w-5xl mb-8">
        <DiscountBanner />
      </div>

      {/* Real Clerk Billing Pricing Table (Single Row of Plans & Real Stripe Checkout) */}
      <div className="w-full max-w-5xl pricing-table-container clerk-pricing-table-wrapper">
        <PricingTable
          for="user"
          appearance={{
            variables: {
              colorPrimary: '#212a3b',
              colorBackground: '#ffffff',
              borderRadius: '0.75rem',
            },
            elements: {
              card: 'border border-[var(--border-subtle)] shadow-xs rounded-2xl hover:shadow-md transition-all',
              card__highlighted: 'border-2 border-[#663820] shadow-xl',
            },
          }}
          checkoutProps={{
            appearance: {
              variables: {
                colorPrimary: '#212a3b',
              },
            },
          }}
        />
      </div>

      {/* Trust & Security Verification */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#3d485e] mt-10 pt-6 border-t border-[var(--border-subtle)] w-full max-w-5xl">
        <div className="flex items-center gap-1.5">
          <Lock className="size-3.5 text-emerald-600" />
          <span>256-bit SSL Encrypted Checkout</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CreditCard className="size-3.5 text-[#663820]" />
          <span>Stripe & Clerk Billing Gateway</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          <span>Cancel or Switch Plans Anytime</span>
        </div>
      </div>
    </div>
  );
}
