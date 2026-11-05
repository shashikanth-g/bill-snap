import React, { useState, useMemo } from 'react'
import { useBills } from '../lib/useBills'
import { monthStats, changeVsPrevious, earliestMonth } from '../lib/insights'
import { CATEGORIES } from '../lib/categories'
import CategoryIcon from '../components/CategoryIcon'
import { formatINR } from '../lib/format'
import '../styles/insights.css'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DONUT_RADIUS = 70
const CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS // ~439.82

export default function Insights({ onSnap }) {
  const { bills } = useBills()

  // Selected year and month (1-based: 1 to 12)
  const now = useMemo(() => new Date(), [])
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)
  const [selectedCategory, setSelectedCategory] = useState(null)

  // Calculate stats for current selection
  const stats = useMemo(() => monthStats(bills, year, month), [bills, year, month])
  const earliest = useMemo(() => earliestMonth(bills), [bills])
  const change = useMemo(() => changeVsPrevious(bills, year, month), [bills, year, month])

  const monthName = MONTH_NAMES[month - 1]
  const prevMonthName = MONTH_NAMES[month === 1 ? 11 : month - 2]

  const isNextDisabled = year === currentYear && month === currentMonth
  const isPrevDisabled =
    year < earliest.year || (year === earliest.year && month <= earliest.month)

  const handlePrevMonth = () => {
    if (isPrevDisabled) return
    setSelectedCategory(null)
    if (month === 1) {
      setYear((y) => y - 1)
      setMonth(12)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (isNextDisabled) return
    setSelectedCategory(null)
    if (month === 12) {
      setYear((y) => y + 1)
      setMonth(1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const toggleCategorySelection = (catKey) => {
    setSelectedCategory((prev) => (prev === catKey ? null : catKey))
  }

  // Calculate SVG donut segments
  const donutSegments = useMemo(() => {
    if (stats.total <= 0 || stats.byCategory.length === 0) return []

    let accumulatedLength = 0
    const count = stats.byCategory.length

    return stats.byCategory.map((item) => {
      const fraction = item.total / stats.total
      const arcLength = fraction * CIRCUMFERENCE
      // 2px gap between segments if multiple categories exist
      const strokeLength = count > 1 ? Math.max(1, arcLength - 2) : arcLength
      const strokeOffset = -accumulatedLength
      accumulatedLength += arcLength

      const catData = CATEGORIES[item.category] || CATEGORIES.other
      const isSelected = selectedCategory === item.category

      return {
        category: item.category,
        total: item.total,
        percent: item.percent,
        color: catData.chartColor || '#94A3B8',
        strokeDasharray: `${strokeLength} ${CIRCUMFERENCE}`,
        strokeDashoffset: strokeOffset,
        isSelected,
      }
    })
  }, [stats.total, stats.byCategory, selectedCategory])

  // Selected category info for donut center
  const activeCategoryItem = useMemo(() => {
    if (!selectedCategory) return null
    return stats.byCategory.find((c) => c.category === selectedCategory) || null
  }, [selectedCategory, stats.byCategory])

  return (
    <div>
      {/* 1. Header */}
      <header className="insights-header rise">
        <span className="insights-subtitle">Where your money went</span>
        <h1 className="insights-title">Insights</h1>
      </header>

      {/* 2. Month Switcher */}
      <section className="month-switcher rise r1" aria-label="Month selector">
        <button
          className={`icon-btn ${isPrevDisabled ? 'month-btn-disabled' : ''}`}
          onClick={handlePrevMonth}
          disabled={isPrevDisabled}
          aria-label="Previous month"
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

        <span className="month-label" aria-live="polite">
          {monthName} {year}
        </span>

        <button
          className={`icon-btn ${isNextDisabled ? 'month-btn-disabled' : ''}`}
          onClick={handleNextMonth}
          disabled={isNextDisabled}
          aria-label="Next month"
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
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </section>

      {/* When no bills in selected month */}
      {stats.count === 0 ? (
        <section className="insights-empty rise r2">
          <div className="empty-chart-tile" aria-hidden="true">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
          </div>
          <h2 className="empty-title">No bills in {monthName} yet</h2>
          <p className="empty-text">
            Snap a bill and your spending shows up here.
          </p>
          <button className="btn-primary" onClick={onSnap}>
            Snap a bill
          </button>
        </section>
      ) : (
        <>
          {/* 3. Hero Summary Card */}
          <section className="rise r2" style={{ marginBottom: '20px' }}>
            <div className="hero-card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '14px', opacity: 0.9, fontWeight: '500' }}>
                  Spent in {monthName}
                </span>

                {change !== null && (
                  <span
                    className="hero-change-pill"
                    aria-label={
                      change >= 0
                        ? `Up ${change}% vs ${prevMonthName}`
                        : `Down ${Math.abs(change)}% vs ${prevMonthName}`
                    }
                  >
                    {change >= 0 ? `▲ ${change}%` : `▼ ${Math.abs(change)}%`} vs {prevMonthName}
                  </span>
                )}
              </div>

              <div style={{ fontSize: '38px', fontWeight: '800', letterSpacing: '-0.8px' }}>
                {formatINR(stats.total)}
              </div>
            </div>
          </section>

          {/* 4. Donut Chart Card */}
          <section className="card donut-card rise r3">
            <svg
              className="donut-svg"
              viewBox="0 0 200 200"
              role="img"
              aria-label={`Donut chart showing spending breakdown for ${monthName}`}
            >
              {/* Rotating group starting at 12 o'clock */}
              <g
                key={`${year}-${month}`}
                transform="rotate(-90 100 100)"
                className="donut-draw-anim"
              >
                {donutSegments.map((seg) => {
                  const isDimmed = selectedCategory && !seg.isSelected
                  const strokeW = seg.isSelected ? 26 : 22

                  return (
                    <circle
                      key={seg.category}
                      className="donut-segment"
                      cx="100"
                      cy="100"
                      r={DONUT_RADIUS}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={strokeW}
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      strokeLinecap="butt"
                      opacity={isDimmed ? 0.45 : 1}
                      onClick={() => toggleCategorySelection(seg.category)}
                    />
                  )
                })}
              </g>

              {/* Center Info Text */}
              <g className="donut-center">
                {activeCategoryItem ? (
                  <>
                    <text
                      x="100"
                      y="92"
                      textAnchor="middle"
                      style={{
                        fontSize: '15px',
                        fontWeight: '700',
                        fill: 'var(--ink-strong)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {activeCategoryItem.category}
                    </text>
                    <text
                      x="100"
                      y="114"
                      textAnchor="middle"
                      style={{
                        fontSize: '20px',
                        fontWeight: '800',
                        fill: 'var(--ink-strong)',
                        letterSpacing: '-0.4px',
                      }}
                    >
                      {formatINR(activeCategoryItem.total)}
                    </text>
                  </>
                ) : (
                  <>
                    <text
                      x="100"
                      y="92"
                      textAnchor="middle"
                      style={{
                        fontSize: '22px',
                        fontWeight: '800',
                        fill: 'var(--ink-strong)',
                        letterSpacing: '-0.5px',
                      }}
                    >
                      {formatINR(stats.total)}
                    </text>
                    <text
                      x="100"
                      y="114"
                      textAnchor="middle"
                      style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        fill: 'var(--muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Total
                    </text>
                  </>
                )}
              </g>
            </svg>
          </section>

          {/* 6. Stat Cards (3-column grid) */}
          <section className="stats-grid rise r4">
            <div className="card stat-tile">
              <span className="stat-label">Bills</span>
              <span className="stat-value">{stats.count}</span>
            </div>

            <div className="card stat-tile">
              <span className="stat-label">Average</span>
              <span className="stat-value">{formatINR(stats.average)}</span>
            </div>

            <div className="card stat-tile">
              <span className="stat-label">Biggest</span>
              <span className="stat-value">
                {stats.biggest ? formatINR(stats.biggest.total) : '₹0'}
              </span>
              {stats.biggest && (
                <span className="stat-sub" title={stats.biggest.merchant}>
                  {stats.biggest.merchant}
                </span>
              )}
            </div>
          </section>

          {/* 5. Legend List under donut */}
          <section className="legend-list rise r5" aria-label="Category breakdown">
            {stats.byCategory.map((item, idx) => {
              const catData = CATEGORIES[item.category] || CATEGORIES.other
              const isSelected = selectedCategory === item.category

              return (
                <button
                  key={item.category}
                  type="button"
                  className={`legend-btn rise r${Math.min(idx + 1, 5)} ${
                    isSelected ? 'legend-btn-active' : ''
                  }`}
                  onClick={() => toggleCategorySelection(item.category)}
                  aria-pressed={isSelected}
                >
                  {/* Colored 12px dot */}
                  <span
                    className="legend-dot"
                    style={{ backgroundColor: catData.chartColor }}
                    aria-hidden="true"
                  />

                  {/* 36px Icon Tile */}
                  <div
                    className="legend-icon-tile"
                    style={{ backgroundColor: catData.bg, color: catData.text }}
                    aria-hidden="true"
                  >
                    <CategoryIcon category={item.category} size={20} />
                  </div>

                  {/* Info and Progress Bar */}
                  <div className="legend-info">
                    <div className="legend-top">
                      <span className="legend-name">{catData.name}</span>
                      <div className="legend-nums">
                        <span className="legend-amount">
                          {formatINR(item.total)}
                        </span>
                        <span className="legend-pct">{item.percent}%</span>
                      </div>
                    </div>

                    <div className="legend-progress-track">
                      <div
                        className="legend-progress-bar"
                        style={{
                          width: `${Math.max(2, item.percent)}%`,
                          backgroundColor: catData.chartColor,
                        }}
                      />
                    </div>
                  </div>
                </button>
              )
            })}
          </section>
        </>
      )}
    </div>
  )
}
