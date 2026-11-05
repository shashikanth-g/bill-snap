import React from 'react'
import BottomNav from './BottomNav'

export default function AppShell({ tab, setTab, onSnap, children }) {
  return (
    <div className="app-shell">
      {/* Scrollable middle content area */}
      <div className="app-content">
        {children}
      </div>

      {/* Fixed bottom navigation bar */}
      <BottomNav tab={tab} setTab={setTab} onSnap={onSnap} />
    </div>
  )
}
