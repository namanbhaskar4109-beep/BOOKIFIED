'use client';

import React, { useRef, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { Messages } from '@/types';
import { cn } from '@/lib/utils';

export interface TranscriptProps {
  messages: Messages[];
  currentMessage?: string;
  currentUserMessage?: string;
  className?: string;
}

export const Transcript: React.FC<TranscriptProps> = ({
  messages,
  currentMessage = '',
  currentUserMessage = '',
  className,
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const hasMessages =
    messages.length > 0 || Boolean(currentMessage) || Boolean(currentUserMessage);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentMessage, currentUserMessage]);

  return (
    <div className={cn('transcript-container', className)}>
      {!hasMessages ? (
        <div className="transcript-empty">
          <Mic className="size-12 text-[#8c827a] mb-4" strokeWidth={1.5} />
          <h3 className="transcript-empty-text">No conversation yet</h3>
          <p className="transcript-empty-hint">
            Click the mic button above to start talking
          </p>
        </div>
      ) : (
        <div className="transcript-messages">
          {messages.map((message, index) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={index}
                className={cn(
                  'transcript-message',
                  isUser
                    ? 'transcript-message-user'
                    : 'transcript-message-assistant',
                )}
              >
                <div
                  className={cn(
                    'transcript-bubble',
                    isUser
                      ? 'transcript-bubble-user'
                      : 'transcript-bubble-assistant',
                  )}
                >
                  {message.content}
                </div>
              </div>
            );
          })}

          {/* Streaming user message */}
          {currentUserMessage && (
            <div className="transcript-message transcript-message-user">
              <div className="transcript-bubble transcript-bubble-user">
                {currentUserMessage}
                <span className="transcript-cursor bg-white" />
              </div>
            </div>
          )}

          {/* Streaming assistant message */}
          {currentMessage && (
            <div className="transcript-message transcript-message-assistant">
              <div className="transcript-bubble transcript-bubble-assistant">
                {currentMessage}
                <span className="transcript-cursor bg-[#212a3b]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default Transcript;
