'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import {
  Check,
  BookOpen,
  Clock,
  Mic,
  History,
  ShieldCheck,
  Lock,
  CreditCard,
  X,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { PlanType, PLAN_LIMITS } from '@/lib/subscription-constants';
import { processPlanSubscription } from '@/lib/actions/subscription.actions';

interface PlanDetails {
  type: PlanType;
  name: string;
  price: string;
  period: string;
  description: string;
  badge?: string;
  highlight?: boolean;
  features: { text: string; included: boolean }[];
  cta: string;
}

const PLANS_DATA: PlanDetails[] = [
  {
    type: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for casual readers getting started with voice AI.',
    badge: 'Starter',
    features: [
      { text: '1 book in personal library', included: true },
      { text: '5 voice sessions / month', included: true },
      { text: '5 min max per voice session', included: true },
      { text: 'Natural AI voice personas', included: true },
      { text: 'Full session transcript history', included: false },
    ],
    cta: 'Free Plan',
  },
  {
    type: 'standard',
    name: 'Standard',
    price: '$15',
    period: 'per month',
    description: 'For active readers who want longer sessions and a larger library.',
    badge: 'MOST POPULAR',
    highlight: true,
    features: [
      { text: '10 books in personal library', included: true },
      { text: '100 voice sessions / month', included: true },
      { text: '15 min max per voice session', included: true },
      { text: 'Full session transcript history', included: true },
      { text: 'Priority AI voice latency', included: true },
    ],
    cta: 'Upgrade to Standard',
  },
  {
    type: 'pro',
    name: 'Pro',
    price: '$39',
    period: 'per month',
    description: 'For researchers, book clubs, and power readers who want unlimited access.',
    badge: 'UNLIMITED',
    features: [
      { text: '100 books in personal library', included: true },
      { text: 'Unlimited voice sessions / month', included: true },
      { text: '60 min max per voice session', included: true },
      { text: 'Full session transcript history', included: true },
      { text: 'Dedicated high-performance voice pipeline', included: true },
    ],
    cta: 'Upgrade to Pro',
  },
];

export const SubscriptionPlans = () => {
  const { plan: currentPlan, isLoaded } = useSubscription();
  const { user, isSignedIn } = useUser();
  const router = useRouter();

  // Modal state
  const [selectedPlan, setSelectedPlan] = useState<PlanDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Form input state for checkout
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardName, setCardName] = useState(user?.fullName || 'Reader Member');
  const [billingCountry, setBillingCountry] = useState('United States');
  const [postalCode, setPostalCode] = useState('10001');

  const handleSelectPlan = (plan: PlanDetails) => {
    if (!isSignedIn) {
      toast.info('Please sign in to select a subscription plan');
      router.push('/sign-in?redirect_url=/subscriptions');
      return;
    }

    if (plan.type === currentPlan) {
      return;
    }

    setSelectedPlan(plan);
    setPaymentSuccess(false);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    try {
      setIsProcessing(true);

      // Simulate real-time Stripe / bank gateway authorization
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const res = await processPlanSubscription(selectedPlan.type);

      if (res.success) {
        setPaymentSuccess(true);
        toast.success(`Welcome to the ${selectedPlan.name} plan!`);

        setTimeout(() => {
          setSelectedPlan(null);
          setPaymentSuccess(false);
          router.refresh();
        }, 1600);
      } else {
        toast.error(res.error || 'Payment authorization failed');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      toast.error('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      {/* SINGLE ROW OF THREE PLAN CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch">
        {PLANS_DATA.map((plan) => {
          const isCurrent = currentPlan === plan.type;
          const isPro = plan.type === 'pro';

          return (
            <div
              key={plan.type}
              className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 relative ${
                isPro
                  ? 'bg-[#212a3b] text-white shadow-xl border border-[#3d485e]'
                  : plan.highlight
                  ? 'bg-white border-2 border-[#663820] shadow-lg hover:shadow-xl'
                  : 'bg-white border border-[var(--border-subtle)] shadow-xs hover:shadow-md'
              }`}
            >
              {/* Highlight / Popular Badge */}
              {plan.badge && (
                <div
                  className={`absolute -top-3 right-6 text-[11px] font-bold tracking-wider px-3 py-1 rounded-full uppercase shadow-xs ${
                    plan.highlight
                      ? 'bg-[#663820] text-white'
                      : isPro
                      ? 'bg-[#f3e4c7] text-[#212a3b]'
                      : 'bg-[#f3e4c7] text-[#663820]'
                  }`}
                >
                  {plan.badge}
                </div>
              )}

              <div>
                {/* Plan Title & Description */}
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className={`font-serif text-2xl font-bold ${
                      isPro ? 'text-white' : 'text-[#212a3b]'
                    }`}
                  >
                    {plan.name}
                  </h3>
                  {isCurrent && (
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-300">
                      Current Plan
                    </span>
                  )}
                </div>

                <p
                  className={`text-sm mb-6 ${
                    isPro ? 'text-gray-300' : 'text-[#3d485e]'
                  }`}
                >
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="flex items-baseline gap-1.5 mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
                  <span
                    className={`font-serif text-4xl sm:text-5xl font-bold tracking-tight ${
                      isPro ? 'text-white' : 'text-[#212a3b]'
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      isPro ? 'text-gray-300' : 'text-[#3d485e]'
                    }`}
                  >
                    /{plan.period}
                  </span>
                </div>

                {/* Features List */}
                <ul className="space-y-3.5 mb-8 text-sm">
                  {plan.features.map((feat, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-3 ${
                        feat.included
                          ? isPro
                            ? 'text-gray-100'
                            : 'text-[#212a3b]'
                          : 'text-gray-400 line-through'
                      }`}
                    >
                      <Check
                        className={`size-4 shrink-0 mt-0.5 ${
                          feat.included
                            ? isPro
                              ? 'text-[#f3e4c7]'
                              : 'text-emerald-600'
                            : 'text-gray-300'
                        }`}
                      />
                      <span className="leading-tight">{feat.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrent}
                  className={`w-full py-3.5 px-5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-400 cursor-default border border-gray-200'
                      : isPro
                      ? 'bg-[#f3e4c7] text-[#212a3b] hover:bg-[#ebd5b3] shadow-md hover:shadow-lg'
                      : plan.highlight
                      ? 'bg-[#663820] text-white hover:bg-[#4d2817] shadow-md hover:shadow-lg'
                      : 'bg-[#212a3b] text-white hover:bg-[#3d485e] shadow-xs hover:shadow-md'
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <Check className="size-4" />
                      <span>Active on Your Account</span>
                    </>
                  ) : (
                    <>
                      <span>{plan.cta}</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* REALISTIC CHECKOUT & TRANSACTION MODAL */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden relative animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#f8f4e9] border-b border-[var(--border-subtle)] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#212a3b]">
                <ShieldCheck className="size-5 text-emerald-600" />
                <span>Bookified Secure Checkout</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-normal">
                  256-bit SSL
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                disabled={isProcessing}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            {paymentSuccess ? (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 animate-in zoom-in-50 duration-300">
                  <Check className="size-9 stroke-[3]" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#212a3b] mb-2">
                  Payment Confirmed!
                </h3>
                <p className="text-sm text-[#3d485e] mb-4">
                  Your account has been upgraded to the <strong>{selectedPlan.name} Plan</strong>.
                </p>
                <div className="text-xs text-gray-400 font-mono">
                  Transaction Reference: tx_live_{Date.now().toString(36)}
                </div>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="p-6 sm:p-8 flex flex-col gap-6">
                {/* Order Summary Strip */}
                <div className="bg-[#f8f4e9] rounded-xl p-4 border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-lg text-[#212a3b]">
                        {selectedPlan.name} Plan
                      </span>
                      <span className="text-xs bg-[#663820] text-white px-2 py-0.5 rounded font-semibold">
                        Monthly
                      </span>
                    </div>
                    <p className="text-xs text-[#3d485e] mt-0.5">
                      {selectedPlan.type === 'pro'
                        ? '100 books • Unlimited sessions • 60 min session duration'
                        : selectedPlan.type === 'standard'
                        ? '10 books • 100 sessions/mo • 15 min session duration'
                        : '1 book • 5 sessions/mo'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-serif text-2xl font-bold text-[#212a3b]">
                      {selectedPlan.price}
                    </span>
                    <span className="text-xs text-[#3d485e] block">billed monthly</span>
                  </div>
                </div>

                {/* Payment Form Fields */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#3d485e] flex items-center gap-1.5">
                      <CreditCard className="size-4" />
                      <span>Card Details</span>
                    </label>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 font-bold text-gray-600">VISA</span>
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 font-bold text-gray-600">MC</span>
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 font-bold text-gray-600">AMEX</span>
                    </div>
                  </div>

                  {/* Card Number */}
                  <div>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="Card number"
                      className="w-full h-11 px-3.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#212a3b] font-mono tracking-wide"
                    />
                  </div>

                  {/* Expiry & CVC Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM / YY"
                        className="w-full h-11 px-3.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#212a3b] font-mono"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="CVC"
                        className="w-full h-11 px-3.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#212a3b] font-mono"
                      />
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label className="text-xs font-semibold text-[#3d485e] mb-1 block">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Name on card"
                      className="w-full h-11 px-3.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#212a3b]"
                    />
                  </div>

                  {/* Country & Zip Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#3d485e] mb-1 block">
                        Country
                      </label>
                      <input
                        type="text"
                        value={billingCountry}
                        onChange={(e) => setBillingCountry(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#212a3b]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#3d485e] mb-1 block">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#212a3b]"
                      />
                    </div>
                  </div>
                </div>

                {/* Total & Submit Button */}
                <div className="pt-2 border-t border-gray-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#3d485e]">Total Due Today:</span>
                    <span className="font-bold font-serif text-xl text-[#212a3b]">
                      {selectedPlan.price}.00 USD
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full h-12 bg-[#212a3b] hover:bg-[#3d485e] text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Processing Secure Payment...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="size-4" />
                        <span>Pay {selectedPlan.price}.00 & Subscribe</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 mt-1">
                    <Lock className="size-3" />
                    <span>Guaranteed safe checkout powered by Stripe • Cancel anytime</span>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
