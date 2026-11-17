import React from 'react';
import { Sparkles } from 'lucide-react';
import { SubscriptionPlans } from '@/components/SubscriptionPlans';

export const metadata = {
  title: 'Subscriptions & Pricing | Bookified',
  description: 'Choose a subscription plan to unlock more book uploads and voice conversations.',
};

export default function SubscriptionsPage() {
  return (
    <div className="w-full flex flex-col items-center py-10 px-4 max-w-6xl mx-auto min-h-[calc(100vh-100px)]">
      {/* Header Banner */}
      <div className="flex flex-col items-center text-center max-w-2xl mb-12">
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

      {/* SINGLE ROW OF PLAN CARDS WITH DIRECT SELECTION & TRANSACTION WINDOW */}
      <SubscriptionPlans />
    </div>
  );
}
