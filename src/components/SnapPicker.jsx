import React from 'react'
import BottomSheet from './BottomSheet'

export default function SnapPicker({ isOpen, onClose, onCamera, onGallery }) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="snap-picker">
        <h2 className="snap-picker-title">Add a bill</h2>
        <p className="snap-picker-hint">
          Lay it flat in good light, all four corners visible
        </p>

        <div className="snap-picker-actions">
          <button
            className="btn-primary"
            onClick={() => {
              onCamera()
              onClose()
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>Take a photo</span>
          </button>

          <button
            className="btn-ghost"
            onClick={() => {
              onGallery()
              onClose()
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>Choose from gallery</span>
          </button>

          <button
            className="btn-ghost snap-picker-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
