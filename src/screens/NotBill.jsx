import React from 'react'

export default function NotBill({ reason, onHome, openCamera, openGallery }) {
  return (
    <div className="feedback-screen">
      {/* Top-left back icon button returning home */}
      <div>
        <button
          className="icon-btn"
          onClick={onHome}
          aria-label="Back to bills"
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

      {/* Centered 150x150 floating tile */}
      <div>
        <div className="feedback-tile-wrap">
          <div className="feedback-tile tile-notbill">
            <svg
              width="84"
              height="84"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* Receipt shape with zig-zag bottom */}
              <path d="M4 2v20l3-2 3 2 3-2 3 2 4-2.5V2H4z" />
              {/* Question mark */}
              <circle cx="12" cy="17" r="0.75" fill="var(--primary)" stroke="none" />
              <path d="M9.8 8.8a2.4 2.4 0 1 1 3.8 2c-.8.8-1.6 1.4-1.6 2.4v.6" />
            </svg>
            <div className="tile-dot-mint" aria-hidden="true" />
          </div>
        </div>

        {/* Copy section */}
        <div className="feedback-copy">
          <h1 className="feedback-title">That doesn't look like a bill</h1>
          {reason && (
            <p className="feedback-reason">It looks like {reason}.</p>
          )}
          <p className="feedback-body">
            We couldn't find a shop name, date or total in this photo. Try again with a clear photo of a receipt or bill.
          </p>
        </div>

        {/* Tips card */}
        <div className="card tips-card">
          <div className="tip-row">
            <div className="tip-check">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span>Lay the bill flat</span>
          </div>

          <div className="tip-row">
            <div className="tip-check">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span>Use good light, avoid shadows</span>
          </div>

          <div className="tip-row">
            <div className="tip-check">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span>Fit all four edges in the frame</span>
          </div>
        </div>
      </div>

      {/* Actions at bottom */}
      <div className="feedback-actions">
        <button className="btn-primary" onClick={openCamera}>
          Retake photo
        </button>
        <button className="btn-ghost" onClick={openGallery}>
          Choose from gallery
        </button>
      </div>
    </div>
  )
}

