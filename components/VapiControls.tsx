'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Mic, MicOff, Square, Loader2, AlertCircle, X, FileText } from 'lucide-react';
import { useVapi, CallStatus } from '@/hooks/useVapi';
import { formatDuration } from '@/lib/utils';
import { IBook } from '@/types';
import { cn } from '@/lib/utils';
import Transcript from '@/components/Transcript';

interface VapiControlsProps {
  book: IBook;
}

export const VapiControls: React.FC<VapiControlsProps> = ({ book }) => {
  const {
    status,
    isActive,
    messages,
    currentMessage,
    currentUserMessage,
    duration,
    start,
    stop,
    limitError,
    isBillingError,
    maxDurationSeconds,
    clearError,
  } = useVapi(book);

  const personaName = book.persona
    ? book.persona.charAt(0).toUpperCase() + book.persona.slice(1)
    : 'Rachel';

  const getStatusText = (currentStatus: CallStatus) => {
    switch (currentStatus) {
      case 'idle':
        return 'Ready';
      case 'connecting':
        return 'Connecting...';
      case 'starting':
        return 'Starting...';
      case 'listening':
        return 'Listening...';
      case 'thinking':
        return 'Thinking...';
      case 'speaking':
        return 'Speaking...';
      default:
        return 'Ready';
    }
  };

  const getStatusDotClass = (currentStatus: CallStatus) => {
    switch (currentStatus) {
      case 'idle':
        return 'vapi-status-dot-ready';
      case 'connecting':
        return 'vapi-status-dot-connecting';
      case 'starting':
        return 'vapi-status-dot-starting';
      case 'listening':
        return 'vapi-status-dot-listening';
      case 'thinking':
        return 'vapi-status-dot-thinking';
      case 'speaking':
        return 'vapi-status-dot-speaking';
      default:
        return 'vapi-status-dot-ready';
    }
  };

  const handleMicClick = () => {
    if (isActive) {
      stop();
    } else {
      start();
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Error Banner */}
      {limitError && (
        <div className="error-banner flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="text-sm font-medium text-red-700">{limitError}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isBillingError && (
              <Link
                href="/subscriptions"
                className="bg-[#212a3b] hover:bg-[#3d485e] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
              >
                Upgrade Plan
              </Link>
            )}
            <button
              type="button"
              onClick={clearError}
              className="text-red-400 hover:text-red-600 transition-colors p-1"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Header Card */}
      <section className="vapi-header-card flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-[#f3e4c7] rounded-xl p-6 relative">
        {/* Left: Book Cover + Overlapping Mic Button */}
        <div className="vapi-cover-wrapper relative shrink-0 w-[120px] h-[180px]">
          <Image
            src={book.coverURL}
            alt={book.title}
            width={120}
            height={180}
            priority
            className="w-[120px] h-[180px] rounded-lg object-cover shadow-md"
          />

          <div className="vapi-mic-wrapper absolute -bottom-2 -right-2">
            {/* White pulsating ring when AI is speaking */}
            {status === 'speaking' && (
              <span className="vapi-pulse-ring absolute inset-0 size-[60px] rounded-full bg-white opacity-70 animate-ping pointer-events-none" />
            )}

            <button
              type="button"
              onClick={handleMicClick}
              disabled={status === 'connecting'}
              className={cn(
                'vapi-mic-btn size-[60px] rounded-full shadow-md flex items-center justify-center cursor-pointer border-0 transition-all group',
                isActive
                  ? 'vapi-mic-btn-active bg-[#212a3b] text-white shadow-xl hover:scale-105 active:scale-95'
                  : 'vapi-mic-btn-inactive bg-white text-[#212a3b] hover:scale-105 active:scale-95'
              )}
              aria-label={isActive ? 'Stop voice session' : 'Start voice session'}
              title={isActive ? 'Click to stop session' : 'Click to start conversation'}
            >
              {status === 'connecting' ? (
                <Loader2 className="w-6 h-6 animate-spin text-[#212a3b]" />
              ) : isActive ? (
                <>
                  <Mic className="w-6 h-6 text-white group-hover:hidden transition-transform animate-pulse" />
                  <Square className="w-5 h-5 text-white fill-white hidden group-hover:block" />
                </>
              ) : (
                <MicOff className="w-6 h-6 text-[#212a3b]" />
              )}
            </button>
          </div>
        </div>

        {/* Right of Cover: Title, Author, Badges */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 min-w-0">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-black tracking-tight leading-snug">
            {book.title}
          </h1>
          <p className="text-base text-[#3d485e] font-medium mt-1 mb-4">
            by {book.author}
          </p>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            {/* Active / Inactive Status Indicator */}
            <div className="vapi-status-indicator inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-xs">
              <span
                className={cn(
                  'vapi-status-dot size-2 rounded-full',
                  isActive ? getStatusDotClass(status) : 'vapi-status-dot-ready bg-gray-400'
                )}
              />
              <span className="vapi-status-text text-xs font-medium text-[#212a3b]">
                {isActive ? `Active · ${getStatusText(status)}` : 'Inactive'}
              </span>
            </div>

            {/* Voice Label */}
            <div className="inline-flex items-center bg-white px-3 py-1.5 rounded-full shadow-xs">
              <span className="text-xs font-medium text-[#212a3b]">
                Voice: {personaName}
              </span>
            </div>

            {/* Timer */}
            <div className="inline-flex items-center bg-white px-3 py-1.5 rounded-full shadow-xs">
              <span className="text-xs font-medium text-[#212a3b]">
                {formatDuration(duration)}/{formatDuration(maxDurationSeconds)}
              </span>
            </div>

            {/* View PDF (if uploaded) */}
            {book.fileURL && (
              <a
                href={book.fileURL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-[var(--text-primary)] px-3 py-1.5 rounded-full text-xs font-medium shadow-xs transition-colors"
                title="Open uploaded PDF in new tab"
              >
                <FileText className="w-3.5 h-3.5 text-[#663820]" />
                <span>PDF</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* 2. Transcript Area */}
      <div className="vapi-transcript-wrapper">
        <Transcript
          messages={messages}
          currentMessage={currentMessage}
          currentUserMessage={currentUserMessage}
        />
      </div>
    </div>
  );
};

export const VapiControl = VapiControls;
export default VapiControls;
