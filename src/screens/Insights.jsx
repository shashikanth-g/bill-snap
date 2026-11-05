import React from 'react'

export default function Insights() {
  return (
    <div>
      {/* Header row with consistent styling */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 20px 8px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', letterSpacing: '-0.6px', color: 'var(--ink-strong)' }}>
            Insights
          </h1>
        </div>
      </div>

      {/* Placeholder content */}
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '28px',
            background: 'linear-gradient(160deg, #EEF0FF, #C7D2FE)',
            boxShadow: '0 8px 0 #A5B4FC, 0 16px 24px rgba(67,56,202,0.15)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            marginBottom: '20px',
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 21V11M12 21V4M19 21v-8" />
          </svg>
        </div>
        <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--muted)', margin: 0 }}>
          Charts arrive in Prompt 8
        </p>
      </div>
    </div>
  )
}

