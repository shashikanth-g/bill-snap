import React, { useEffect } from 'react'

export default function Toast({
  message,
  actionLabel,
  onAction,
  duration = 5000,
  onClose,
}) {
  useEffect(() => {
    if (!message) return

    const timer = setTimeout(() => {
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [message, duration, onClose])

  if (!message) return null

  return (
    <div className="toast-pill" role="status" aria-live="polite">
      <span>{message}</span>

      {actionLabel && onAction ? (
        <button
          className="toast-action"
          onClick={() => {
            onAction()
            onClose?.()
          }}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

