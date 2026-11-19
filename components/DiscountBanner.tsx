'use client';

import React, { useState } from 'react';
import { Tag, Check, Copy, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export const DiscountBanner: React.FC = () => {
  const [code, setCode] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error('Please enter a discount code');
      return;
    }

    setAppliedCode(trimmed);
    toast.success(`Discount code "${trimmed}" applied!`);
  };

  const handleCopy = () => {
    if (!appliedCode) return;
    navigator.clipboard.writeText(appliedCode);
    setCopied(true);
    toast.info('Discount code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-white border border-[#e5d8c5] rounded-2xl p-5 sm:p-6 shadow-xs transition-all">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-start gap-3.5 max-w-xl">
          <div className="size-10 rounded-xl bg-[#fff6e5] border border-[#f3e4c7] flex items-center justify-center shrink-0 mt-0.5">
            <Tag className="size-5 text-[#663820]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base text-[#212a3b]">
                Have a Discount or Promo Code?
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#fff6e5] text-[#663820] px-2 py-0.5 rounded-full border border-[#f3e4c7]">
                <Sparkles className="size-3 text-[#663820]" />
                Clerk Billing
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#3d485e] mt-1 leading-relaxed">
              Enter your discount code below. When the secure checkout drawer opens for your chosen plan, paste it into the promotion code field for an instant price reduction.
            </p>
          </div>
        </div>

        {/* Right: Input Form */}
        <div className="w-full md:w-auto shrink-0">
          {!appliedCode ? (
            <form onSubmit={handleApply} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter discount code"
                className="w-full sm:w-56 px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-sm font-medium tracking-wide uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:outline-none focus:border-[#663820] focus:ring-1 focus:ring-[#663820] bg-[var(--bg-primary)]"
              />
              <button
                type="submit"
                className="shrink-0 bg-[#212a3b] hover:bg-[#3d485e] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Apply
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 bg-[#f4fbf7] border border-emerald-200 px-4 py-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                <Check className="size-4 text-emerald-600" />
                <span className="font-mono font-bold text-sm text-emerald-900 tracking-wider">
                  {appliedCode}
                </span>
                <span className="text-xs text-emerald-700 font-medium">applied</span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="ml-2 inline-flex items-center gap-1 text-xs bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer"
                title="Copy code for checkout drawer"
              >
                {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAppliedCode(null);
                  setCode('');
                }}
                className="text-xs text-gray-400 hover:text-gray-600 underline ml-1 cursor-pointer"
              >
                Change
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscountBanner;
