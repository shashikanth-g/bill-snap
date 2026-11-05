import React, { useEffect, useState, useRef } from 'react'
import '../styles/splash.css'

export default function Splash({ onDone }) {
  const [isFading, setIsFading] = useState(false)
  const doneTriggeredRef = useRef(false)

  // Safe callback that ensures onDone is called only once
  const triggerDone = () => {
    if (doneTriggeredRef.current) return
    doneTriggeredRef.current = true
    onDone?.()
  }

  // Handle immediate skip when user taps anywhere
  const handleSkip = () => {
    if (isFading) return
    setIsFading(true)
    setTimeout(triggerDone, 300)
  }

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // If user prefers reduced motion: show logo + title for 800ms, then finish
    if (prefersReduced) {
      const reducedTimer = setTimeout(() => {
        setIsFading(true)
        setTimeout(triggerDone, 300)
      }, 800)
      return () => clearTimeout(reducedTimer)
    }

    // Normal sequence: 2.4s animation, then 0.3s fade-out (2.7s total)
    const fadeTimer = setTimeout(() => {
      setIsFading(true)
    }, 2400)

    const finishTimer = setTimeout(() => {
      triggerDone()
    }, 2700)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(finishTimer)
    }
  }, [])

  return (
    <div
      className={`splash-screen ${isFading ? 'fade-out' : ''}`}
      onClick={handleSkip}
      role="button"
      tabIndex={0}
      aria-label="Bill Snap Intro (tap to skip)"
    >
      {/* Background blurred color blobs */}
      <div className="splash-blob-1" aria-hidden="true" />
      <div className="splash-blob-2" aria-hidden="true" />

      {/* Central stage box */}
      <div className="splash-stage">
        {/* Animated Receipt */}
        <div className="splash-receipt">
          {/* Header row with avatar and grey placeholder bars */}
          <div className="splash-receipt-header">
            <div className="splash-receipt-avatar" />
            <div className="splash-receipt-bars">
              <div className="splash-receipt-bar-1" />
              <div className="splash-receipt-bar-2" />
            </div>
          </div>

          {/* Row 1: Merchant */}
          <div className="splash-row splash-row-1">
            <div className="splash-row-left">
              <span className="splash-row-label">Merchant</span>
              <span className="splash-row-val">Spice Route Kitchen</span>
            </div>
            <div className="splash-check-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Row 2: Date */}
          <div className="splash-row splash-row-2">
            <div className="splash-row-left">
              <span className="splash-row-label">Date</span>
              <span className="splash-row-val">3 Nov 2026</span>
            </div>
            <div className="splash-check-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Row 3: Total */}
          <div className="splash-row splash-row-3 splash-row-total">
            <div className="splash-row-left">
              <span className="splash-row-label">Total</span>
              <span className="splash-row-val-total">₹1,240</span>
            </div>
            <div className="splash-check-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Mint Scan Line */}
          <div className="splash-scan" />
        </div>

        {/* Expanding Ring */}
        <div className="splash-ring" aria-hidden="true" />

        {/* 3D App Logo */}
        <div className="splash-logo">
          <svg width="62" height="62" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" />
            <path d="M9 10.5l2 2 4-4" stroke="#5EEAD4" strokeWidth="2.6" />
            <path d="M9 16h6" />
          </svg>

          {/* Spark star on top right of logo */}
          <div className="splash-spark">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="#5EEAD4">
              <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="splash-title">
          Bill <span>Snap</span>
        </h1>

        {/* Tagline */}
        <p className="splash-tagline">
          Snap it. Check it. Done.
        </p>
      </div>
    </div>
  )
}

