import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

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

  // Track open sheet state on document.body to hide BottomNav
  useEffect(() => {
    if (!isOpen) return

    document.body.classList.add('has-sheet-open')
    return () => {
      // Clean up class if no open sheets remain
      setTimeout(() => {
        if (!document.querySelector('.sheet-modal')) {
          document.body.classList.remove('has-sheet-open')
        }
      }, 0)
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
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
    </div>,
    document.body
  )
}
