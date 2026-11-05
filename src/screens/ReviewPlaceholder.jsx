// TEMPORARY: replaced by the real Review screen in Prompt 7
import React from 'react'
import { UNSURE_BELOW } from '../lib/config'
import { formatINR } from '../lib/format'

export default function ReviewPlaceholder({ image, analysis, onSave, onDiscard }) {
  const merchantVal = analysis.merchant?.value
  const isMerchantUnsure = !merchantVal || (analysis.merchant?.confidence ?? 0) < UNSURE_BELOW

  const dateVal = analysis.date?.value
  const isDateUnsure = !dateVal || (analysis.date?.confidence ?? 0) < UNSURE_BELOW

  const totalVal = analysis.total?.value
  const isTotalUnsure = totalVal == null || (analysis.total?.confidence ?? 0) < UNSURE_BELOW

  const categoryVal = analysis.category?.value
  const isCategoryUnsure = !categoryVal || (analysis.category?.confidence ?? 0) < UNSURE_BELOW

  const handleSave = () => {
    const today = new Date().toISOString().slice(0, 10)
    onSave({
      merchant: merchantVal?.trim() || 'Unknown shop',
      date: dateVal || today,
      total: typeof totalVal === 'number' ? totalVal : 0,
      category: categoryVal || 'other',
      imageDataUrl: image.dataUrl || null,
    })
  }

  return (
    <div className="review-screen">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          className="icon-btn"
          onClick={onDiscard}
          aria-label="Discard review"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--ink-strong)', margin: 0 }}>
            Check your bill
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
            Fix anything that looks off, then save
          </p>
        </div>
      </div>

      {/* Photo thumbnail */}
      <div className="review-preview-row">
        <img
          src={image.dataUrl}
          alt="Receipt thumbnail"
          className="review-thumb"
        />
        <div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--ink-strong)' }}>
            Photo captured
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
            {image.width} × {image.height}px
          </div>
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Merchant */}
        <div className={`field ${isMerchantUnsure ? 'field-warn' : ''}`}>
          <div className="field-header">
            <span className="field-label">Merchant</span>
            {isMerchantUnsure ? (
              <span className="pill-check">Please check</span>
            ) : (
              <span className="pill-sure">✓ Sure</span>
            )}
          </div>
          <div className="field-value">
            {merchantVal || 'Unknown shop'}
          </div>
        </div>

        {/* Date */}
        <div className={`field ${isDateUnsure ? 'field-warn' : ''}`}>
          <div className="field-header">
            <span className="field-label">Date</span>
            {isDateUnsure ? (
              <span className="pill-check">Please check</span>
            ) : (
              <span className="pill-sure">✓ Sure</span>
            )}
          </div>
          <div className="field-value">
            {dateVal || 'Not found'}
          </div>
        </div>

        {/* Total */}
        <div className={`field ${isTotalUnsure ? 'field-warn' : ''}`}>
          <div className="field-header">
            <span className="field-label">Total</span>
            {isTotalUnsure ? (
              <span className="pill-check">Please check</span>
            ) : (
              <span className="pill-sure">✓ Sure</span>
            )}
          </div>
          <div className="field-value">
            {totalVal != null ? formatINR(totalVal) : 'Not found'}
          </div>
        </div>

        {/* Category */}
        <div className={`field ${isCategoryUnsure ? 'field-warn' : ''}`}>
          <div className="field-header">
            <span className="field-label">Category</span>
            {isCategoryUnsure ? (
              <span className="pill-check">Please check</span>
            ) : (
              <span className="pill-sure">✓ Sure</span>
            )}
          </div>
          <div className="field-value" style={{ textTransform: 'capitalize' }}>
            {categoryVal || 'other'}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto', paddingTop: '16px' }}>
        <button className="btn-primary" onClick={handleSave}>
          ✓ Save bill
        </button>
        <button className="btn-ghost" onClick={onDiscard}>
          Discard
        </button>
      </div>
    </div>
  )
}

