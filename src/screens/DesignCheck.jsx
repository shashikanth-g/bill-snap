import React, { useState } from 'react'
import { CATEGORIES } from '../lib/categories'
import { useBills } from '../lib/useBills'
import { sampleBills } from '../lib/sampleBills'
import { compressImage } from '../lib/image'
import { analyzeBill } from '../lib/analyzeBill'
import Toast from '../components/Toast'

export default function DesignCheck() {
  const [selectedCategory, setSelectedCategory] = useState('food')
  const { add, clear } = useBills()
  const [toast, setToast] = useState(null)

  // AI test state
  const [testFile, setTestFile] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [aiError, setAiError] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null
    setTestFile(file)
    setAiResult(null)
    setAiError(null)
  }

  const handleRunAiTest = async () => {
    if (!testFile) return
    setAiLoading(true)
    setAiError(null)
    setAiResult(null)

    try {
      const { base64, mimeType } = await compressImage(testFile)
      const data = await analyzeBill({ base64, mimeType })
      setAiResult(data)
    } catch (err) {
      setAiError(err.userMessage || err.message || 'Something went wrong reading this bill.')
    } finally {
      setAiLoading(false)
    }
  }

  const categoryList = Object.values(CATEGORIES).filter(
    (item, index, self) => self.findIndex((c) => c.name === item.name) === index
  )
  const activeCategoryData = CATEGORIES[selectedCategory] || CATEGORIES.food

  // Dev tools actions
  const handleAddDemoBills = async () => {
    try {
      for (const bill of sampleBills) {
        // Strip the fixed sample ID so addBill generates a unique crypto.randomUUID()
        const { id, ...billData } = bill
        await add(billData)
      }
      setToast({ message: '7 demo bills added to IndexedDB' })
    } catch (err) {
      setToast({ message: `Error adding bills: ${err.message}` })
    }
  }

  const handleDeleteAllBills = async () => {
    if (window.confirm('Delete all bills from IndexedDB?')) {
      try {
        await clear()
        setToast({ message: 'All bills deleted from IndexedDB' })
      } catch (err) {
        setToast({ message: `Error clearing bills: ${err.message}` })
      }
    }
  }

  return (
    <div>
      {/* Header bar with 3D icon buttons */}
      <header className="rise" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button className="icon-btn" aria-label="Back" onClick={() => { window.location.hash = '' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--ink-strong)', margin: 0 }}>
            Design check
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
            Bill Snap Design System (#design)
          </p>
        </div>

        <button className="icon-btn" aria-label="Search" onClick={() => {}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </header>

      {/* Dev Tools Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Dev tools
        </div>

        <button className="btn-ghost" onClick={handleAddDemoBills}>
          Add demo bills
        </button>

        <button className="btn-danger" onClick={handleDeleteAllBills}>
          Delete all bills
        </button>
      </section>

      {/* AI Test Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px', padding: '16px', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--line)', boxShadow: '0 4px 12px rgba(17,24,39,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            AI test
          </div>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
            Gemini Vision
          </span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
          Pick a receipt photo to test compression and Gemini structured output extraction.
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{
            fontSize: '13px',
            color: 'var(--ink)',
            background: 'var(--bg)',
            padding: '10px',
            borderRadius: '12px',
            border: '1px dashed var(--line)',
            cursor: 'pointer',
          }}
        />

        <button
          className="btn-primary"
          onClick={handleRunAiTest}
          disabled={!testFile || aiLoading}
          style={{ opacity: !testFile || aiLoading ? 0.6 : 1 }}
        >
          {aiLoading ? 'Analyzing bill...' : 'Analyze'}
        </button>

        {/* AI Error Alert */}
        {aiError && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--amber-bg)',
              color: 'var(--amber-ink)',
              border: '1px solid var(--amber-edge)',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            ⚠️ {aiError}
          </div>
        )}

        {/* AI Result Display */}
        {aiResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)' }}>
              <span>Model: <strong style={{ color: 'var(--ink-strong)' }}>{aiResult.model}</strong></span>
              <span>Time: <strong style={{ color: 'var(--ink-strong)' }}>{aiResult.ms} ms</strong></span>
            </div>

            <pre
              style={{
                margin: 0,
                background: '#0F172A',
                color: '#38BDF8',
                padding: '12px',
                borderRadius: '12px',
                fontSize: '11px',
                lineHeight: '1.45',
                overflowX: 'auto',
                maxHeight: '260px',
                fontFamily: 'monospace',
              }}
            >
              {JSON.stringify(aiResult.result || aiResult, null, 2)}
            </pre>
          </div>
        )}
      </section>

      {/* Hero Summary Card */}
      <section className="rise r2" style={{ marginBottom: '20px' }}>
        <div className="hero-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', opacity: 0.9, fontWeight: '500' }}>Spent in November</span>
            <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '12px', fontWeight: '600' }}>
              14 bills
            </span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            ₹12,480
          </div>
        </div>
      </section>

      {/* Bill Card with Category Icon Tile + Merchant + Amount */}
      <section className="rise r3" style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Recent Bill Card
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Category Icon Tile */}
            <div
              className="icon-tile"
              style={{ backgroundColor: activeCategoryData.bg, color: activeCategoryData.text }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d={activeCategoryData.iconPath} />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--ink-strong)' }}>
                Spice Route Kitchen
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                <span
                  className="cat-pill"
                  style={{ backgroundColor: activeCategoryData.bg, color: activeCategoryData.text }}
                >
                  {activeCategoryData.name}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>3 Nov</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--ink-strong)' }}>
            ₹1,240
          </div>
        </div>
      </section>

      {/* Normal Field + Unsure/Warning Field */}
      <section className="rise r4" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Form Fields
        </div>

        {/* Normal field with "Sure" pill */}
        <div className="field">
          <div className="field-header">
            <span className="field-label">Merchant</span>
            <span className="pill-sure">✓ Sure</span>
          </div>
          <div className="field-value">Spice Route Kitchen</div>
        </div>

        {/* Warning field with "Please check" pill */}
        <div className="field field-warn">
          <div className="field-header">
            <span className="field-label">Date</span>
            <span className="pill-check">Please check</span>
          </div>
          <div className="field-value">03 / 11 / 2026</div>
          <div className="field-subtext">Could be 3 Nov or 11 Mar. Which one?</div>
        </div>

        {/* Normal field with "Sure" pill */}
        <div className="field">
          <div className="field-header">
            <span className="field-label">Total</span>
            <span className="pill-sure">✓ Sure</span>
          </div>
          <div className="field-value">₹1,240.00</div>
        </div>
      </section>

      {/* All 7 Category Chips */}
      <section className="rise r5" style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
          All 7 Category Chips (Tap to select)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {categoryList.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase()
            return (
              <button
                key={cat.name}
                className={`chip ${isSelected ? 'chip-on' : ''}`}
                onClick={() => setSelectedCategory(cat.name.toLowerCase())}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={isSelected ? '#FFFFFF' : cat.text}
                >
                  <path d={cat.iconPath} />
                </svg>
                {cat.name}
              </button>
            )
          })}
        </div>
      </section>

      {/* Buttons Section (scrolling inside content area) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Buttons
        </div>

        {/* Ghost 3D Button */}
        <button className="btn-ghost" onClick={() => setToast({ message: 'Ghost button clicked' })}>
          Retake photo
        </button>

        {/* Danger 3D Button */}
        <button className="btn-danger" onClick={() => setToast({ message: 'Danger button clicked' })}>
          Delete item
        </button>

        {/* Primary 3D Button */}
        <button className="btn-primary" onClick={() => setToast({ message: 'Save bill clicked' })}>
          ✓ Save bill
        </button>
      </section>

      {/* Toast Notification */}
      {toast ? (
        <Toast
          message={toast.message}
          actionLabel={toast.actionLabel}
          onAction={toast.onAction}
          duration={3500}
          onClose={() => setToast(null)}
        />
      ) : null}
    </div>
  )
}
