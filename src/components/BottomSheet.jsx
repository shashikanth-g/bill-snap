import React, { useEffect } from 'react'

export default function BottomSheet({ isOpen, onClose, children }) {
  // Listen for Escape key to close the sheet
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="sheet-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="sheet-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grey drag handle */}
        <div className="sheet-handle" aria-hidden="true" />

        {/* Scrollable inner content */}
        <div className="sheet-content">
          {children}
        </div>
      </div>
    </div>
  )
}

