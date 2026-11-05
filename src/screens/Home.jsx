import React, { useState, useRef, useEffect } from 'react'
import { CATEGORIES } from '../lib/categories'
import CategoryIcon from '../components/CategoryIcon'
import { formatINR, formatShortDate, greeting } from '../lib/format'
import { summarize } from '../lib/summary'
import { useBills } from '../lib/useBills'
import BottomSheet from '../components/BottomSheet'
import BillDetails from '../components/BillDetails'
import Toast from '../components/Toast'

const FILTER_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'food', name: 'Food' },
  { id: 'groceries', name: 'Groceries' },
  { id: 'utilities', name: 'Utilities' },
  { id: 'shopping', name: 'Shopping' },
  { id: 'health', name: 'Health' },
  { id: 'transport', name: 'Transport' },
  { id: 'other', name: 'Other' },
]

export default function Home() {
  // Real IndexedDB bills hook
  const { bills, loading, remove, restore } = useBills()

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)

  // BottomSheet & Toast states
  const [selectedBill, setSelectedBill] = useState(null)
  const [toast, setToast] = useState(null)

  // Focus input automatically when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchOpen])

  // Summarize current month's bills for the hero card
  const { monthLabel, total, count, segments } = summarize(bills)

  // Filter bills by selected category chip and search query
  const filteredBills = bills.filter((b) => {
    // Category chip filter
    const matchesCategory =
      selectedCategory === 'all' ||
      b.category?.toLowerCase() === selectedCategory.toLowerCase()

    if (!matchesCategory) return false

    // Search query filter (case-insensitive merchant & category)
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const matchesMerchant = b.merchant?.toLowerCase().includes(q)
    const matchesCatName = b.category?.toLowerCase().includes(q)

    return matchesMerchant || matchesCatName
  })

  // Display name for empty filter text
  const activeCategoryObj = FILTER_CATEGORIES.find((c) => c.id === selectedCategory)
  const categoryDisplayName = activeCategoryObj ? activeCategoryObj.name : selectedCategory

  // Toggle search bar
  const toggleSearch = () => {
    if (searchOpen) {
      setSearchOpen(false)
      setSearchQuery('')
    } else {
      setSearchOpen(true)
    }
  }

  // Handle bill delete confirmation
  const handleDeleteBill = async (billToDelete) => {
    setSelectedBill(null)
    await remove(billToDelete.id)

    // Show 5-second undo toast
    setToast({
      message: 'Bill deleted',
      actionLabel: 'Undo',
      onAction: () => restore(billToDelete),
    })
  }

  return (
    <div>
      {/* 1. Header row */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '32px 20px 8px 20px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: '500' }}>
            {greeting()}
          </span>
          <h1
            style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: '800',
              letterSpacing: '-0.6px',
              color: 'var(--ink-strong)',
            }}
          >
            Your bills
          </h1>
        </div>

        {/* Search icon button */}
        <button
          className="icon-btn"
          aria-label={searchOpen ? 'Close search' : 'Search bills'}
          onClick={toggleSearch}
        >
          {searchOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          )}
        </button>
      </header>

      {/* Search Bar (slides open under header) */}
      <div
        style={{
          maxHeight: searchOpen ? '74px' : '0px',
          opacity: searchOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease',
          padding: searchOpen ? '4px 20px 10px 20px' : '0 20px',
        }}
      >
        <div
          className="field"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: '50px',
            padding: '0 8px 0 14px',
            gap: '8px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merchant or category"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '15px',
              fontWeight: '600',
              color: 'var(--ink)',
              fontFamily: 'inherit',
            }}
          />
          {searchQuery ? (
            <button
              aria-label="Clear search query"
              onClick={() => setSearchQuery('')}
              style={{
                width: '44px',
                height: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: 'var(--muted)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {/* 2. Hero summary card */}
      <section style={{ margin: '14px 20px 0 20px' }}>
        <div
          className="hero-card"
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* Decorative blurred circles */}
          <div
            style={{
              position: 'absolute',
              right: '-40px',
              top: '-50px',
              width: '170px',
              height: '170px',
              borderRadius: '85px',
              background: '#8B7CFF',
              opacity: 0.45,
              filter: 'blur(8px)',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          />
          <div
            style={{
              position: 'absolute',
              right: '30px',
              bottom: '-70px',
              width: '120px',
              height: '120px',
              borderRadius: '60px',
              background: '#5EEAD4',
              opacity: 0.22,
              filter: 'blur(14px)',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          />

          {/* Row 1: Spent in {monthLabel} + count pill */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.9)' }}>
              Spent in {monthLabel}
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '4px 10px',
                borderRadius: '12px',
              }}
            >
              {count} {count === 1 ? 'bill' : 'bills'}
            </span>
          </div>

          {/* Row 2: Total amount */}
          <div style={{ position: 'relative', fontSize: '38px', fontWeight: '800', letterSpacing: '-1.2px', lineHeight: 1 }}>
            {formatINR(total)}
          </div>

          {/* Row 3: Segmented bar */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              height: '8px',
              borderRadius: '4px',
              overflow: 'hidden',
              gap: '2px',
            }}
          >
            {count === 0 ? (
              <div style={{ flex: 1, background: '#E0E7FF' }} />
            ) : (
              segments.map((seg, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: seg.total > 0 ? seg.total : 1,
                    background: seg.color,
                  }}
                />
              ))
            )}
          </div>

          {/* Row 4: Legend for top 3 segments */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              gap: '14px',
              fontSize: '12px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.92)',
              flexWrap: 'wrap',
            }}
          >
            {count === 0 ? (
              <span>No bills yet</span>
            ) : (
              segments.slice(0, 3).map((seg, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '4px',
                      background: seg.color,
                      display: 'inline-block',
                    }}
                  />
                  <span>{seg.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 3. Filter chips row (horizontally scrollable) */}
      <section
        className="no-scrollbar"
        style={{
          display: 'flex',
          gap: '10px',
          padding: '26px 20px 8px 20px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {FILTER_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              className={isSelected ? 'chip-on' : 'chip'}
              onClick={() => setSelectedCategory(cat.id)}
              style={{ flexShrink: 0 }}
            >
              {cat.name}
            </button>
          )
        })}
      </section>

      {/* 4. Section label "RECENT" */}
      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--muted)', letterSpacing: '0.4px', padding: '8px 20px 0 20px' }}>
        RECENT
      </div>

      {/* 5. Bill list / 6. Loading & Empty states */}
      <section style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          /* While loading from IndexedDB, show 2 shimmer skeletons */
          <>
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </>
        ) : filteredBills.length === 0 ? (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '40px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '38px',
                background: 'linear-gradient(160deg, #EEF0FF, #C7D2FE)',
                boxShadow: '0 10px 0 #A5B4FC, 0 24px 34px rgba(67, 56, 202, 0.2), inset 0 3px 0 rgba(255, 255, 255, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                marginBottom: '20px',
              }}
            >
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6" />
              </svg>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--ink-strong)', margin: '0 0 8px 0' }}>
              No bills here yet
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--muted)', margin: 0, maxWidth: '280px' }}>
              {searchQuery.trim()
                ? `No bills match '${searchQuery.trim()}'.`
                : selectedCategory === 'all'
                ? 'Tap the mint Snap button to add your first bill.'
                : `No ${categoryDisplayName} bills yet.`}
            </p>
          </div>
        ) : (
          filteredBills.map((bill, idx) => {
            const cat = CATEGORIES[bill.category?.toLowerCase()] || CATEGORIES.other
            const delayClass = idx === 0 ? 'rise' : (idx < 5 ? `rise r${idx + 1}` : '')

            return (
              <div
                key={bill.id}
                className={`card ${delayClass}`}
                onClick={() => setSelectedBill(bill)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  cursor: 'pointer',
                }}
              >
                {/* 48x48 category icon tile */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '15px',
                    backgroundColor: cat.bg,
                    color: cat.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: 'inset 0 2px 0 rgba(255, 255, 255, 0.8), 0 3px 0 rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <CategoryIcon category={bill.category} size={24} />
                </div>

                {/* Middle details: Merchant, category pill & date */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: 'var(--ink-strong)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {bill.merchant}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: cat.bg,
                        color: cat.text,
                        padding: '3px 9px',
                        borderRadius: '10px',
                      }}
                    >
                      {cat.name}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {formatShortDate(bill.date)}
                    </span>
                  </div>
                </div>

                {/* Right: Amount */}
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--ink-strong)' }}>
                  {formatINR(bill.total)}
                </div>
              </div>
            )
          })
        )}
      </section>

      {/* Bill Details Bottom Sheet */}
      <BottomSheet
        isOpen={Boolean(selectedBill)}
        onClose={() => setSelectedBill(null)}
      >
        <BillDetails
          bill={selectedBill}
          onEdit={(b) => console.log('edit', b)}
          onDelete={handleDeleteBill}
        />
      </BottomSheet>

      {/* Toast Notification with Undo */}
      {toast ? (
        <Toast
          message={toast.message}
          actionLabel={toast.actionLabel}
          onAction={toast.onAction}
          duration={5000}
          onClose={() => setToast(null)}
        />
      ) : null}
    </div>
  )
}
