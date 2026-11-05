import React, { useState, useEffect, useRef } from 'react'
import { analyzeBill } from '../lib/analyzeBill'

const HINTS = [
  "Checking it's a bill",
  "Finding the shop name",
  "Reading the total",
]

export default function Reading({ image, onSuccess, onNotBill, onError, onCancel }) {
  const [hintIndex, setHintIndex] = useState(0)
  const abortControllerRef = useRef(null)

  // Cycle through cosmetic status hints every 1.4s
  useEffect(() => {
    const timer = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % HINTS.length)
    }, 1400)

    return () => clearInterval(timer)
  }, [])

  // Start analysis on mount with AbortController
  useEffect(() => {
    const controller = new AbortController()
    abortControllerRef.current = controller

    analyzeBill({
      base64: image.base64,
      mimeType: image.mimeType,
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) return
        const res = data.result || data

        if (!res.is_bill) {
          onNotBill(res.not_bill_reason || null)
        } else {
          onSuccess(res)
        }
      })
      .catch((err) => {
        // If aborted by the user, ignore silently without showing an error
        if (controller.signal.aborted || err.name === 'AbortError') {
          return
        }
        onError(err.userMessage || err.message || 'Something went wrong reading this bill. Please try again.')
      })

    return () => {
      controller.abort()
    }
  }, [image, onSuccess, onNotBill, onError])

  const handleAbortAndCancel = () => {
    abortControllerRef.current?.abort()
    onCancel()
  }

  return (
    <div className="reading-screen">
      {/* Top-left 48px close button */}
      <div className="reading-header">
        <button
          className="icon-btn"
          style={{ width: '48px', height: '48px' }}
          onClick={handleAbortAndCancel}
          aria-label="Cancel reading"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Bill preview card with sweeping mint scan line */}
      <div>
        <div className="reading-card">
          <img
            src={image.dataUrl}
            alt="Captured bill"
            className="reading-image"
          />
          <div className="reading-scan-line" aria-hidden="true" />
        </div>

        {/* Text hints under photo */}
        <div className="reading-status">
          <h2 className="reading-title">Reading your bill...</h2>
          <p className="reading-hint">{HINTS[hintIndex]}</p>
        </div>
      </div>

      {/* Bottom cancel button */}
      <button className="btn-ghost" onClick={handleAbortAndCancel}>
        Cancel
      </button>
    </div>
  )
}

