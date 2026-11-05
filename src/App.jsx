import React, { useState, useEffect } from 'react'
import AppShell from './components/AppShell'
import Splash from './screens/Splash'
import Home from './screens/Home'
import Insights from './screens/Insights'
import DesignCheck from './screens/DesignCheck'
import SnapPicker from './components/SnapPicker'
import Reading from './screens/Reading'
import NotBill from './screens/NotBill'
import SnapError from './screens/SnapError'
import Review from './screens/Review'
import Toast from './components/Toast'
import { useBills } from './lib/useBills'
import { useImagePicker } from './lib/useImagePicker'
import './styles/flow.css'

export default function App() {
  // Splash screen state: plays once per full page load
  const [splashDone, setSplashDone] = useState(false)

  // Active navigation tab: "bills" | "insights"
  const [tab, setTab] = useState('bills')

  // URL hash to toggle the design check demo (window.location.hash === "#design")
  const [hash, setHash] = useState(window.location.hash)

  // Snap picker BottomSheet open state
  const [pickerOpen, setPickerOpen] = useState(false)

  // Snap flow state: null | { step: "reading"|"notbill"|"error"|"review"|"edit", ... }
  const [flow, setFlow] = useState(null)

  // Toast notification for flow & save messages
  const [toastMessage, setToastMessage] = useState(null)

  // DB hook for adding and updating bills
  const { add, update } = useBills()

  // Camera & Gallery image picker hook
  const {
    cameraInputRef,
    galleryInputRef,
    openCamera,
    openGallery,
    handleFileChange,
  } = useImagePicker({
    onImagePicked: (image) => {
      setPickerOpen(false)
      setFlow({ step: 'reading', image })
    },
    onError: (msg) => {
      setPickerOpen(false)
      setFlow(null)
      setToastMessage(msg)
    },
  })

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Show splash screen until done
  if (!splashDone) {
    return <Splash onDone={() => setSplashDone(true)} />
  }

  // Tapping the mint Snap button opens the SnapPicker bottom sheet
  const handleSnap = () => {
    setPickerOpen(true)
  }

  // Saving a new bill from Review
  const handleSaveBill = async (billData) => {
    try {
      await add(billData)
      setFlow(null)
      setTab('bills')
      setToastMessage('Bill saved')
    } catch (err) {
      setToastMessage(err.message || 'Failed to save bill')
    }
  }

  // Saving an edited bill
  const handleSaveEditedBill = async (updatedBill) => {
    try {
      await update(updatedBill)
      setFlow(null)
      setToastMessage('Changes saved')
    } catch (err) {
      setToastMessage(err.message || 'Failed to save changes')
    }
  }

  // Render active flow step overlay
  const renderFlowOverlay = () => {
    if (!flow) return null

    return (
      <div className="flow-overlay">
        {flow.step === 'reading' && (
          <Reading
            image={flow.image}
            onSuccess={(analysis) =>
              setFlow({ step: 'review', image: flow.image, analysis })
            }
            onNotBill={(reason) =>
              setFlow({ step: 'notbill', image: flow.image, reason })
            }
            onError={(message) =>
              setFlow({ step: 'error', image: flow.image, message })
            }
            onCancel={() => setFlow(null)}
          />
        )}

        {flow.step === 'notbill' && (
          <NotBill
            reason={flow.reason}
            onHome={() => setFlow(null)}
            openCamera={openCamera}
            openGallery={openGallery}
          />
        )}

        {flow.step === 'error' && (
          <SnapError
            message={flow.message}
            onRetry={() => setFlow({ step: 'reading', image: flow.image })}
            onCancel={() => setFlow(null)}
          />
        )}

        {flow.step === 'review' && (
          <Review
            mode="new"
            image={flow.image}
            analysis={flow.analysis}
            onSave={handleSaveBill}
            onDiscard={() => setFlow(null)}
            onRetake={openCamera}
          />
        )}

        {flow.step === 'edit' && (
          <Review
            mode="edit"
            bill={flow.bill}
            onSave={handleSaveEditedBill}
            onDiscard={() => setFlow(null)}
          />
        )}
      </div>
    )
  }

  // If hash is "#design", render the design check demo screen
  if (hash === '#design') {
    return (
      <AppShell
        tab={tab}
        setTab={setTab}
        onSnap={handleSnap}
        showBottomNav={flow === null}
        overlay={renderFlowOverlay()}
      >
        <DesignCheck />

        {/* Hidden Camera and Gallery Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Snap Picker Bottom Sheet */}
        <SnapPicker
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onCamera={openCamera}
          onGallery={openGallery}
        />

        {/* App-level Toast */}
        {toastMessage && (
          <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        )}
      </AppShell>
    )
  }

  // Render Home screen or Insights screen based on active tab
  return (
    <AppShell
      tab={tab}
      setTab={setTab}
      onSnap={handleSnap}
      showBottomNav={flow === null}
      overlay={renderFlowOverlay()}
    >
      {tab === 'bills' ? (
        <Home onEditBill={(bill) => setFlow({ step: 'edit', bill })} />
      ) : (
        <Insights />
      )}

      {/* Hidden Camera and Gallery Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Snap Picker Bottom Sheet */}
      <SnapPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onCamera={openCamera}
        onGallery={openGallery}
      />

      {/* App-level Toast */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </AppShell>
  )
}
