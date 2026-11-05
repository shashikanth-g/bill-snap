import React, { useState, useEffect } from 'react'
import AppShell from './components/AppShell'
import Splash from './screens/Splash'
import Home from './screens/Home'
import Insights from './screens/Insights'
import DesignCheck from './screens/DesignCheck'

export default function App() {
  // Splash screen state: plays once per full page load
  const [splashDone, setSplashDone] = useState(false)

  // Active navigation tab: "bills" | "insights"
  const [tab, setTab] = useState('bills')

  // URL hash to toggle the design check demo (window.location.hash === "#design")
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Show splash screen until done
  if (!splashDone) {
    return <Splash onDone={() => setSplashDone(true)} />
  }

  // Snap button click handler for now
  const handleSnap = () => {
    console.log('snap')
  }

  // If hash is "#design", render the design check demo screen
  if (hash === '#design') {
    return (
      <AppShell tab={tab} setTab={setTab} onSnap={handleSnap}>
        <DesignCheck />
      </AppShell>
    )
  }

  // Render Home screen or Insights screen based on active tab
  return (
    <AppShell tab={tab} setTab={setTab} onSnap={handleSnap}>
      {tab === 'bills' ? <Home /> : <Insights />}
    </AppShell>
  )
}
