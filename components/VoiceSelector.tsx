'use client'

import React from 'react'
import { cn } from 'cn'
import { voiceOptions, voiceCategories } from '@/lib/constants'
import { VoiceSelectorProps } from '@/types'

export const VoiceSelector = ({
  value = 'rachel',
  onChange,
  disabled = false,
  className,
}: VoiceSelectorProps) => {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Male Voices Group */}
      <div className="space-y-2">
        <span className="text-sm font-semibold text-[var(--text-secondary)]">
          Male Voices
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {voiceCategories.male.map((key) => {
            const voice = voiceOptions[key as keyof typeof voiceOptions]
            const isSelected = value === key || value === voice.id
            return (
              <button
                type="button"
                key={key}
                disabled={disabled}
                onClick={() => onChange(key)}
                className={cn(
                  'voice-selector-option flex flex-col items-start text-left justify-between p-3.5 rounded-lg border transition-all',
                  isSelected
                    ? 'voice-selector-option-selected'
                    : 'voice-selector-option-default',
                  disabled && 'voice-selector-option-disabled'
                )}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-base text-[var(--text-primary)]">
                    {voice.name}
                  </span>
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
                      isSelected
                        ? 'border-[#663820] bg-[#663820]'
                        : 'border-[#ccc] bg-white'
                    )}
                  >
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-snug">
                  {voice.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Female Voices Group */}
      <div className="space-y-2">
        <span className="text-sm font-semibold text-[var(--text-secondary)]">
          Female Voices
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {voiceCategories.female.map((key) => {
            const voice = voiceOptions[key as keyof typeof voiceOptions]
            const isSelected = value === key || value === voice.id
            return (
              <button
                type="button"
                key={key}
                disabled={disabled}
                onClick={() => onChange(key)}
                className={cn(
                  'voice-selector-option flex flex-col items-start text-left justify-between p-3.5 rounded-lg border transition-all',
                  isSelected
                    ? 'voice-selector-option-selected'
                    : 'voice-selector-option-default',
                  disabled && 'voice-selector-option-disabled'
                )}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-base text-[var(--text-primary)]">
                    {voice.name}
                  </span>
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
                      isSelected
                        ? 'border-[#663820] bg-[#663820]'
                        : 'border-[#ccc] bg-white'
                    )}
                  >
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-snug">
                  {voice.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default VoiceSelector

