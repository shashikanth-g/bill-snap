import React, { useState, useRef, useEffect, useMemo } from 'react'
import { evaluateFields } from '../lib/fieldState'
import { CATEGORIES } from '../lib/categories'
import CategoryIcon from '../components/CategoryIcon'
import BottomSheet from '../components/BottomSheet'
import '../styles/review.css'

const CATEGORY_KEYS = ['food', 'groceries', 'utilities', 'shopping', 'health', 'transport', 'other']

export default function Review({
  mode = 'new',
  image = null,
  analysis = null,
  bill = null,
  onSave,
  onDiscard,
  onRetake,
}) {
  const isEditMode = mode === 'edit'
  const todayString = useMemo(() => new Date().toISOString().slice(0, 10), [])

  // Initial field evaluation (only for new mode)
  const evaluatedInitial = useMemo(
    () => (isEditMode ? null : evaluateFields(analysis || {}, new Date())),
    [isEditMode, analysis]
  )

  // Form field values
  const [merchant, setMerchant] = useState(() => {
    if (isEditMode) return bill?.merchant || ''
    return analysis?.merchant?.value || ''
  })

  const [date, setDate] = useState(() => {
    if (isEditMode) return bill?.date || todayString
    return analysis?.date?.value || todayString
  })

  const [total, setTotal] = useState(() => {
    if (isEditMode) return bill?.total != null ? String(bill.total) : ''
    return analysis?.total?.value != null ? String(analysis.total.value) : ''
  })

  const [category, setCategory] = useState(() => {
    if (isEditMode) return (bill?.category || 'food').toLowerCase()
    return (analysis?.category?.value || 'food').toLowerCase()
  })

  // Track which fields have been edited by the user
  const [isEdited, setIsEdited] = useState({
    merchant: false,
    date: false,
    total: false,
    category: false,
  })

  // Track which unsure fields user explicitly confirmed with "Looks right"
  const [isConfirmed, setIsConfirmed] = useState({
    merchant: isEditMode,
    date: isEditMode,
    total: isEditMode,
    category: isEditMode,
  })

  // Field validation error messages
  const [errors, setErrors] = useState({})

  // Modals
  const [showDiscardSheet, setShowDiscardSheet] = useState(false)
  const [showUnsureSheet, setShowUnsureSheet] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)

  // DOM refs for scrolling to invalid / unsure fields
  const merchantRef = useRef(null)
  const dateRef = useRef(null)
  const totalRef = useRef(null)
  const categoryRef = useRef(null)

  // Close lightbox on Escape key
  useEffect(() => {
    if (!showLightbox) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowLightbox(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showLightbox])

  // Mark a field as edited
  const markEdited = (fieldName) => {
    setIsEdited((prev) => ({ ...prev, [fieldName]: true }))
    setErrors((prev) => {
      const copy = { ...prev }
      delete copy[fieldName]
      return copy
    })
  }

  // Confirm an unsure field as "Looks right"
  const markConfirmed = (fieldName) => {
    setIsConfirmed((prev) => ({ ...prev, [fieldName]: true }))
  }

  // Determine if a field is currently unsure (only in new mode, when not edited and not confirmed)
  const isFieldUnsure = (fieldName) => {
    if (isEditMode) return false
    if (isEdited[fieldName] || isConfirmed[fieldName]) return false
    return evaluatedInitial?.[fieldName]?.state === 'unsure'
  }

  const isMerchantUnsure = isFieldUnsure('merchant')
  const isDateUnsure = isFieldUnsure('date')
  const isTotalUnsure = isFieldUnsure('total')
  const isCategoryUnsure = isFieldUnsure('category')

  // Total count of currently unsure fields
  const unsureCount = ['merchant', 'date', 'total', 'category'].filter(isFieldUnsure).length

  // Filter input to allow only digits and at most one decimal point with 2 decimals
  const handleTotalChange = (e) => {
    const val = e.target.value
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      setTotal(val)
      markEdited('total')
    }
  }

  // Handle Back / Discard check
  const handleBackClick = () => {
    if (!isEditMode) {
      // In new mode, always prompt confirmation
      setShowDiscardSheet(true)
      return
    }

    // In edit mode, check if anything changed
    const hasChanges =
      merchant.trim() !== (bill?.merchant || '').trim() ||
      date !== (bill?.date || '') ||
      Math.abs((parseFloat(total) || 0) - (bill?.total || 0)) > 0.001 ||
      category.toLowerCase() !== (bill?.category || '').toLowerCase()

    if (hasChanges) {
      setShowDiscardSheet(true)
    } else {
      onDiscard()
    }
  }

  // Validate form fields
  const validateForm = () => {
    const newErrors = {}

    if (!merchant.trim()) {
      newErrors.merchant = 'Add the shop name'
    }

    if (!date || Number.isNaN(new Date(date).getTime())) {
      newErrors.date = 'Pick the date'
    }

    const numTotal = parseFloat(total)
    if (total === '' || Number.isNaN(numTotal) || numTotal <= 0) {
      newErrors.total = 'Enter the total'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      // Focus and scroll to first invalid field
      if (newErrors.merchant) {
        merchantRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        document.getElementById('field-merchant')?.focus()
      } else if (newErrors.date) {
        dateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        document.getElementById('field-date')?.focus()
      } else if (newErrors.total) {
        totalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        document.getElementById('field-total')?.focus()
      }
      return false
    }

    return true
  }

  // Perform the actual save
  const executeSave = () => {
    const parsedTotal = parseFloat(total) || 0

    if (isEditMode) {
      const updatedBill = {
        ...bill,
        merchant: merchant.trim(),
        date,
        total: parsedTotal,
        category,
      }
      onSave(updatedBill)
      return
    }

    // New bill mode: calculate corrected field list
    const corrected = []
    if (merchant.trim() !== (analysis?.merchant?.value?.trim() || '')) {
      corrected.push('merchant')
    }
    if (date !== (analysis?.date?.value || '')) {
      corrected.push('date')
    }
    const origTotal = typeof analysis?.total?.value === 'number' ? analysis.total.value : null
    if (origTotal === null || Math.abs(parsedTotal - origTotal) > 0.001) {
      corrected.push('total')
    }
    if (category.toLowerCase() !== (analysis?.category?.value || '').toLowerCase()) {
      corrected.push('category')
    }

    const newBillData = {
      merchant: merchant.trim(),
      date,
      total: parsedTotal,
      category,
      imageDataUrl: image?.dataUrl || null,
      ai: {
        merchant: analysis?.merchant || null,
        date: analysis?.date || null,
        total: analysis?.total || null,
        category: analysis?.category || null,
      },
      corrected,
    }

    onSave(newBillData)
  }

  // Handle Save button click
  const handleSaveClick = () => {
    if (!validateForm()) return

    // If there are still unedited and unconfirmed unsure fields, prompt with bottom sheet first
    if (!isEditMode && unsureCount > 0) {
      setShowUnsureSheet(true)
      return
    }

    executeSave()
  }

  // Scroll to first unsure field when user taps "Review them"
  const handleReviewUnsureFields = () => {
    setShowUnsureSheet(false)
    if (isMerchantUnsure) {
      merchantRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      document.getElementById('field-merchant')?.focus()
    } else if (isDateUnsure) {
      dateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      document.getElementById('field-date')?.focus()
    } else if (isTotalUnsure) {
      totalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      document.getElementById('field-total')?.focus()
    } else if (isCategoryUnsure) {
      categoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const currentPhotoUrl = image?.dataUrl || bill?.imageDataUrl || null

  return (
    <div className="review-container">
      {/* 1. Top Bar */}
      <div className="review-top-bar">
        <button
          className="icon-btn"
          onClick={handleBackClick}
          aria-label={isEditMode ? 'Back to bill' : 'Discard bill'}
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
          <h1 className="review-title">
            {isEditMode ? 'Edit bill' : 'Check your bill'}
          </h1>
          <p className="review-subtitle">
            {isEditMode
              ? 'Change anything, then save'
              : 'Fix anything that looks off, then save'}
          </p>
        </div>
      </div>

      {/* 2. Photo Card */}
      <div
        className="review-photo-card"
        onClick={() => {
          if (currentPhotoUrl) setShowLightbox(true)
        }}
        title={currentPhotoUrl ? 'Tap to view full photo' : undefined}
      >
        {currentPhotoUrl ? (
          <img
            src={currentPhotoUrl}
            alt="Bill receipt"
            className="review-photo-img"
          />
        ) : (
          <div className="review-photo-placeholder">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>No photo attached</span>
          </div>
        )}

        {/* Retake Button (New mode only) */}
        {!isEditMode && (
          <button
            type="button"
            className="review-retake-btn"
            onClick={(e) => {
              e.stopPropagation()
              onRetake?.()
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span>Retake</span>
          </button>
        )}
      </div>

      {/* 3. Live Banner (New mode only) */}
      {!isEditMode && (
        <div role="status" aria-live="polite">
          {unsureCount > 0 ? (
            <div className="review-banner-amber">
              <div className="review-banner-amber-icon" aria-hidden="true">
                !
              </div>
              <div className="review-banner-amber-text">
                <span className="review-banner-amber-title">
                  {unsureCount} field{unsureCount === 1 ? '' : 's'} need{unsureCount === 1 ? 's' : ''} a quick check
                </span>
                <span className="review-banner-amber-sub">
                  Amber means we're not sure. Tap to fix.
                </span>
              </div>
            </div>
          ) : (
            <div className="review-banner-green">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>All fields look good. Take a quick look, then save.</span>
            </div>
          )}
        </div>
      )}

      {/* 4. Four Field Cards */}
      <div className="review-fields-wrap">
        {/* Merchant Card */}
        <div
          ref={merchantRef}
          className={`field ${isMerchantUnsure ? 'field-warn' : ''} ${errors.merchant ? 'field-error-border' : ''} rise r1`}
        >
          <div className="field-header">
            <label htmlFor="field-merchant" className="field-label">
              Merchant
            </label>
            {isEdited.merchant ? (
              <span className="pill-edited">Edited</span>
            ) : isMerchantUnsure ? (
              <span className="pill-check">Please check</span>
            ) : (
              <span className="pill-sure">✓ Sure</span>
            )}
          </div>

          <input
            id="field-merchant"
            type="text"
            autoComplete="off"
            className="field-input"
            placeholder="Shop or business name"
            value={merchant}
            onChange={(e) => {
              setMerchant(e.target.value)
              markEdited('merchant')
            }}
          />

          {isMerchantUnsure && (
            <>
              <div className="field-subtext" style={{ color: 'var(--amber-ink)', fontSize: '12px', marginTop: '2px' }}>
                {evaluatedInitial?.merchant?.hint}
              </div>
              <button
                type="button"
                className="btn-looks-right"
                onClick={() => markConfirmed('merchant')}
              >
                Looks right
              </button>
            </>
          )}

          {errors.merchant && (
            <div className="field-error-text">{errors.merchant}</div>
          )}
        </div>

        {/* Date Card */}
        <div
          ref={dateRef}
          className={`field ${isDateUnsure ? 'field-warn' : ''} ${errors.date ? 'field-error-border' : ''} rise r2`}
        >
          <div className="field-header">
            <label htmlFor="field-date" className="field-label">
              Date
            </label>
            {isEdited.date ? (
              <span className="pill-edited">Edited</span>
            ) : isDateUnsure ? (
              <span className="pill-check">Please check</span>
            ) : (
              <span className="pill-sure">✓ Sure</span>
            )}
          </div>

          <input
            id="field-date"
            type="date"
            max={todayString}
            className="field-input field-input-date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              markEdited('date')
            }}
          />

          {isDateUnsure && (
            <>
              <div className="field-subtext" style={{ color: 'var(--amber-ink)', fontSize: '12px', marginTop: '2px' }}>
                {evaluatedInitial?.date?.hint}
              </div>
              <button
                type="button"
                className="btn-looks-right"
                onClick={() => markConfirmed('date')}
              >
                Looks right
              </button>
            </>
          )}

          {errors.date && (
            <div className="field-error-text">{errors.date}</div>
          )}
        </div>

        {/* Total Card */}
        <div
          ref={totalRef}
          className={`field ${isTotalUnsure ? 'field-warn' : ''} ${errors.total ? 'field-error-border' : ''} rise r3`}
        >
          <div className="field-header">
            <label htmlFor="field-total" className="field-label">
              Total
            </label>
            {isEdited.total ? (
              <span className="pill-edited">Edited</span>
            ) : isTotalUnsure ? (
              <span className="pill-check">Please check</span>
            ) : (
              <span className="pill-sure">✓ Sure</span>
            )}
          </div>

          <div className="field-total-wrap">
            <span className="field-currency">₹</span>
            <input
              id="field-total"
              type="text"
              inputMode="decimal"
              className="field-input"
              placeholder="0.00"
              value={total}
              onChange={handleTotalChange}
            />
          </div>

          {isTotalUnsure && (
            <>
              <div className="field-subtext" style={{ color: 'var(--amber-ink)', fontSize: '12px', marginTop: '2px' }}>
                {evaluatedInitial?.total?.hint}
              </div>
              <button
                type="button"
                className="btn-looks-right"
                onClick={() => markConfirmed('total')}
              >
                Looks right
              </button>
            </>
          )}

          {errors.total && (
            <div className="field-error-text">{errors.total}</div>
          )}
        </div>

        {/* Category Card */}
        <div
          ref={categoryRef}
          className={`field ${isCategoryUnsure ? 'field-warn' : ''} rise r4`}
        >
          <div className="field-header">
            <span className="field-label">Category · suggested for you</span>
            {isEdited.category ? (
              <span className="pill-edited">Edited</span>
            ) : isCategoryUnsure ? (
              <span className="pill-check">Please check</span>
            ) : (
              <span className="pill-sure">✓ Sure</span>
            )}
          </div>

          <div className="category-chips-wrap">
            {CATEGORY_KEYS.map((key) => {
              const catData = CATEGORIES[key] || CATEGORIES.other
              const isSelected = category === key
              return (
                <button
                  key={key}
                  type="button"
                  className={`chip ${isSelected ? 'chip-on' : ''}`}
                  onClick={() => {
                    setCategory(key)
                    markEdited('category')
                  }}
                >
                  <CategoryIcon category={key} size={16} />
                  <span>{catData.name}</span>
                </button>
              )
            })}
          </div>

          {isCategoryUnsure && (
            <>
              <div className="category-hint">
                Suggested, but not sure. Pick one.
              </div>
              <button
                type="button"
                className="btn-looks-right"
                onClick={() => markConfirmed('category')}
              >
                Looks right
              </button>
            </>
          )}
        </div>
      </div>

      {/* 5. Save Bar */}
      <div className="review-save-bar">
        <button
          type="button"
          className="btn-primary"
          onClick={handleSaveClick}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{isEditMode ? 'Save changes' : 'Save bill'}</span>
        </button>
      </div>

      {/* Lightbox for Full Photo Comparison */}
      {showLightbox && currentPhotoUrl && (
        <div
          className="photo-lightbox"
          onClick={() => setShowLightbox(false)}
          role="dialog"
          aria-label="Full bill image preview"
        >
          <button
            type="button"
            className="photo-lightbox-close"
            onClick={() => setShowLightbox(false)}
            aria-label="Close photo preview"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            src={currentPhotoUrl}
            alt="Full bill"
            className="photo-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Unsure Check Confirmation BottomSheet */}
      <BottomSheet
        isOpen={showUnsureSheet}
        onClose={() => setShowUnsureSheet(false)}
      >
        <div style={{ textAlign: 'center', padding: '6px 0 14px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--ink-strong)', margin: '0 0 6px 0' }}>
            {unsureCount} field{unsureCount === 1 ? '' : 's'} still need a check
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: '0 0 16px 0', lineHeight: '1.45' }}>
            Saving without checking can store wrong details.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="btn-primary"
              onClick={handleReviewUnsureFields}
            >
              Review them
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                setShowUnsureSheet(false)
                executeSave()
              }}
            >
              Save anyway
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Discard Confirmation BottomSheet */}
      <BottomSheet
        isOpen={showDiscardSheet}
        onClose={() => setShowDiscardSheet(false)}
      >
        <div style={{ textAlign: 'center', padding: '6px 0 14px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--ink-strong)', margin: '0 0 6px 0' }}>
            {isEditMode ? 'Discard changes?' : 'Discard this bill?'}
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: '0 0 16px 0' }}>
            Any changes you made will not be saved.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="btn-ghost"
              onClick={() => setShowDiscardSheet(false)}
            >
              Keep editing
            </button>
            <button
              className="btn-danger"
              onClick={() => {
                setShowDiscardSheet(false)
                onDiscard()
              }}
            >
              Discard
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
