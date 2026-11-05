'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingOverlayProps {
  isLoading: boolean
  title?: string
  statusText?: string
}

export const LoadingOverlay = ({
  isLoading,
  title = 'Synthesizing Your Book...',
  statusText = 'Uploading & analyzing contents',
}: LoadingOverlayProps) => {
  if (!isLoading) return null

  return (
    <div className="loading-wrapper" role="status" aria-live="polite">
      <div className="loading-shadow-wrapper bg-white shadow-xl">
        <div className="loading-shadow">
          <Loader2 className="loading-animation w-10 h-10 text-[#663820]" />
          <h2 className="loading-title">{title}</h2>
          <div className="loading-progress">
            <div className="loading-progress-item">
              <span className="loading-progress-status" />
              <span className="text-[var(--text-secondary)] font-medium">
                {statusText}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoadingOverlay

