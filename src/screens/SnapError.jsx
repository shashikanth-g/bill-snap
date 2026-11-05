import React from 'react'

export default function SnapError({ message, onRetry, onCancel }) {
  return (
    <div className="feedback-screen">
      {/* Top-left back icon button returning home */}
      <div>
        <button
          className="icon-btn"
          onClick={onCancel}
          aria-label="Back to home"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Centered 150x150 amber floating tile */}
      <div>
        <div className="feedback-tile-wrap">
          <div className="feedback-tile tile-error">
            <svg
              width="76"
              height="76"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--amber)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5" />
            </svg>
          </div>
        </div>

        {/* Copy section */}
        <div className="feedback-copy">
          <h1 className="feedback-title">We couldn't read this bill</h1>
          <p className="feedback-body">
            {message || "Something went wrong reading this bill. Please try again."}
          </p>
        </div>
      </div>

      {/* Actions at bottom */}
      <div className="feedback-actions">
        <button className="btn-primary" onClick={onRetry}>
          Try again
        </button>
        <button className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

