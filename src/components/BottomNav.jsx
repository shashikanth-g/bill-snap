import React from 'react'

export default function BottomNav({ tab = 'bills', setTab, onSnap }) {
  const handleSnap = () => {
    if (onSnap) {
      onSnap()
    } else {
      console.log('snap')
    }
  }

  return (
    <nav className="bottom-nav">
      {/* Left Item: Bills */}
      <button
        className={`nav-item ${tab === 'bills' ? 'active' : ''}`}
        onClick={() => setTab?.('bills')}
      >
        <div className="nav-icon-box">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6" />
          </svg>
        </div>
        <span>Bills</span>
      </button>

      {/* Center Slot: Snap button shifted up, no label */}
      <div className="nav-snap-wrapper">
        <button
          className="snap-btn"
          aria-label="Snap a bill"
          onClick={handleSnap}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
            <path d="M12 9v6M9 12h6" />
          </svg>
        </button>
      </div>

      {/* Right Item: Insights */}
      <button
        className={`nav-item ${tab === 'insights' ? 'active' : ''}`}
        onClick={() => setTab?.('insights')}
      >
        <div className="nav-icon-box">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 21V11M12 21V4M19 21v-8" />
          </svg>
        </div>
        <span>Insights</span>
      </button>
    </nav>
  )
}
