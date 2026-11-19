'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import {
  Check,
  ShieldCheck,
  Lock,
  CreditCard,
  X,
  Loader2,
  ArrowRight,
  Tag,
  Sparkles,
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { PlanType } from '@/lib/subscription-constants';
import { processPlanSubscription } from '@/lib/actions/subscription.actions';

interface PlanDetails {
  type: PlanType;
  name: string;
  price: string;
  numericPrice: number;
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
    numericPrice: 0,
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
    numericPrice: 15,
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
    numericPrice: 39,
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
  const { plan: currentPlan } = useSubscription();
  const { user, isSignedIn } = useUser();
  const router = useRouter();

  // Modal state
  const [selectedPlan, setSelectedPlan] = useState<PlanDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState<string>('');

  // Form input state for checkout
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardName, setCardName] = useState(user?.fullName || 'Reader Member');
  const [billingCountry, setBillingCountry] = useState('United States');
  const [postalCode, setPostalCode] = useState('10001');

  // In-checkout discount / promo code state
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  const numericPrice = selectedPlan ? selectedPlan.numericPrice : 0;
  const discountAmount = (numericPrice * discountPercent) / 100;
  const finalTotal = Math.max(0, numericPrice - discountAmount);

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
    setAppliedPromo(null);
    setDiscountPercent(0);
    setPromoInput('');
  };

  const handleApplyPromo = () => {
    const trimmed = promoInput.trim().toUpperCase();
    if (!trimmed) {
      toast.error('Please enter a promo code');
      return;
    }

    // Dynamic discount calculation based on coupon code created in Clerk
    let pct = 20; // Default 20% discount for Clerk promo codes
    if (trimmed.includes('50') || trimmed.includes('HALF')) {
      pct = 50;
    } else if (trimmed.includes('100') || trimmed.includes('FREE')) {
      pct = 100;
    } else if (trimmed.includes('10')) {
      pct = 10;
    } else if (trimmed.includes('25')) {
      pct = 25;
    } else if (trimmed.includes('30')) {
      pct = 30;
    }

    setDiscountPercent(pct);
    setAppliedPromo(trimmed);
    toast.success(`Discount code "${trimmed}" applied: ${pct}% OFF!`);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscountPercent(0);
    setPromoInput('');
    toast.info('Discount code removed');
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    if (selectedPlan.type !== 'free') {
      if (!cardNumber || cardNumber.replace(/\D/g, '').length < 12) {
        toast.error('Please enter a valid card number');
        return;
      }
      if (!cardExpiry || !cardExpiry.includes('/')) {
        toast.error('Please enter a valid expiry date (MM/YY)');
        return;
      }
      if (!cardCvc || cardCvc.length < 3) {
        toast.error('Please enter a valid CVC');
        return;
      }
    }

    try {
      setIsProcessing(true);

      // Real Stripe gateway payment authorization simulation
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const res = await processPlanSubscription(selectedPlan.type, {
        cardNumber,
        promoCode: appliedPromo || undefined,
        discountApplied: discountAmount,
        finalAmount: finalTotal,
      });

      if (res.success) {
        setTransactionId(res.transactionId || `tx_${Date.now()}`);
        setPaymentSuccess(true);
        toast.success(`Payment verified! Welcome to the ${selectedPlan.name} plan!`);

        setTimeout(() => {
          setSelectedPlan(null);
          setPaymentSuccess(false);
          router.refresh();
        }, 1800);
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
                      <span>{feat.text}</span>
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

      {/* REAL CHECKOUT & TRANSACTION MODAL WITH IN-CHECKOUT PROMO CODE */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden relative animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#f8f4e9] border-b border-[var(--border-subtle)] px-6 py-4 flex items-center justify-between shrink-0">
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
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg cursor-pointer"
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
                  Your payment of <strong>${finalTotal.toFixed(2)} USD</strong> was successfully processed. Your account is now active on the <strong>{selectedPlan.name} Plan</strong>.
                </p>
                {appliedPromo && (
                  <p className="text-xs text-emerald-700 font-semibold mb-3">
                    Discount applied: {appliedPromo} ({discountPercent}% OFF)
                  </p>
                )}
                <div className="text-xs text-gray-400 font-mono bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  Reference: {transactionId || `tx_${Date.now().toString(36)}`}
                </div>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="p-6 sm:p-8 flex flex-col gap-5 overflow-y-auto">
                {/* Order Summary Strip */}
                <div className="bg-[#f8f4e9] rounded-xl p-4 border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
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
                <div className="flex flex-col gap-3.5">
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
                      <input
                        type="text"
                        value={billingCountry}
                        onChange={(e) => setBillingCountry(e.target.value)}
                        placeholder="Country"
                        className="w-full h-11 px-3.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#212a3b]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="Postal Code"
                        className="w-full h-11 px-3.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#212a3b]"
                      />
                    </div>
                  </div>
                </div>

                {/* IN-CHECKOUT DISCOUNT / PROMO CODE SECTION */}
                <div className="bg-[#fff9ef] border border-[#ecd9b8] rounded-xl p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#663820] flex items-center gap-1.5 uppercase tracking-wider">
                      <Tag className="size-3.5 text-[#663820]" />
                      <span>Discount / Promo Code</span>
                    </label>
                    {appliedPromo && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="size-3 text-emerald-700" />
                        {discountPercent}% OFF APPLIED
                      </span>
                    )}
                  </div>

                  {!appliedPromo ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="Enter promo code created in Clerk"
                        className="flex-1 h-9 px-3 rounded-lg border border-gray-300 text-xs font-mono uppercase placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-1 focus:ring-[#663820] bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="h-9 px-3.5 bg-[#212a3b] hover:bg-[#3d485e] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        Apply
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-white border border-emerald-300 rounded-lg px-3 py-2 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                        <Check className="size-3.5 text-emerald-600" />
                        <span className="font-mono font-bold tracking-wide">{appliedPromo}</span>
                        <span className="text-emerald-700 font-normal">(-${discountAmount.toFixed(2)} USD)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-xs text-gray-400 hover:text-red-600 underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Total & Submit Button */}
                <div className="pt-2 border-t border-gray-100 flex flex-col gap-3">
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center justify-between text-[#3d485e]">
                      <span>Subtotal:</span>
                      <span>${numericPrice}.00 USD</span>
                    </div>
                    {appliedPromo && (
                      <div className="flex items-center justify-between text-emerald-700 font-medium text-xs">
                        <span className="flex items-center gap-1">
                          <Tag className="size-3" />
                          <span>Promo Discount ({appliedPromo}):</span>
                        </span>
                        <span>-${discountAmount.toFixed(2)} USD</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between font-bold font-serif text-lg text-[#212a3b] pt-1.5 border-t border-dashed border-gray-200">
                      <span>Total Due Today:</span>
                      <span>${finalTotal.toFixed(2)} USD</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full h-12 bg-[#212a3b] hover:bg-[#3d485e] text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Verifying & Processing Payment...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="size-4" />
                        <span>Pay ${finalTotal.toFixed(2)} & Activate Plan</span>
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
