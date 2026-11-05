import React from 'react'
import BottomNav from './BottomNav'

export default function AppShell({
  tab,
  setTab,
  onSnap,
  showBottomNav = true,
  overlay = null,
  children,
}) {
  return (
    <div className="app-shell">
      {/* Scrollable middle content area */}
      <div className="app-content">
        {children}
      </div>

      {/* Full-screen flow overlay (inside 430px column, above everything) */}
      {overlay}

      {/* Fixed bottom navigation bar (hidden while flow is active) */}
      {showBottomNav ? (
        <BottomNav tab={tab} setTab={setTab} onSnap={onSnap} />
      ) : null}
    </div>
  )
}
