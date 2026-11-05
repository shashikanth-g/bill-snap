import React, { useState } from 'react'
import { CATEGORIES } from '../lib/categories'
import { formatINR, formatLongDate } from '../lib/format'

export default function BillDetails({ bill, onEdit, onDelete }) {
  // Inline confirmation state for delete
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!bill) return null

  const cat = CATEGORIES[bill.category?.toLowerCase()] || CATEGORIES.other

  return (
    <div>
      {/* Optional bill photo */}
      {bill.imageDataUrl ? (
        <img
          src={bill.imageDataUrl}
          alt={bill.merchant}
          style={{
            width: '100%',
            maxHeight: '220px',
            objectFit: 'cover',
            borderRadius: '20px',
            marginBottom: '16px',
            display: 'block',
          }}
        />
      ) : null}

      {/* Merchant name */}
      <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--ink-strong)', margin: '0 0 4px 0' }}>
        {bill.merchant}
      </h2>

      {/* Large total amount */}
      <div style={{ fontSize: '34px', fontWeight: '800', color: 'var(--ink-strong)', letterSpacing: '-0.8px', marginBottom: '18px' }}>
        {formatINR(bill.total)}
      </div>

      {/* Date row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          borderTop: '1px solid var(--line)',
        }}
      >
        <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: '500' }}>Date</span>
        <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--ink-strong)' }}>
          {formatLongDate(bill.date)}
        </span>
      </div>

      {/* Category row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          borderTop: '1px solid var(--line)',
          marginBottom: '24px',
        }}
      >
        <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: '500' }}>Category</span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: cat.bg,
            color: cat.text,
            padding: '4px 10px',
            borderRadius: '10px',
          }}
        >
          {cat.name}
        </span>
      </div>

      {/* Bottom actions: Edit & Delete, or Inline confirmation */}
      {confirmDelete ? (
        <div style={{ textAlign: 'center', paddingTop: '4px' }}>
          <p style={{ fontSize: '17px', fontWeight: '800', color: 'var(--ink-strong)', margin: '0 0 16px 0' }}>
            Delete this bill?
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn-ghost"
              style={{ flex: 1 }}
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
            <button
              className="btn-danger"
              style={{ flex: 1 }}
              onClick={() => onDelete?.(bill)}
            >
              Yes, delete
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn-ghost"
            style={{ flex: 1 }}
            onClick={() => onEdit?.(bill)}
          >
            Edit
          </button>
          <button
            className="btn-danger"
            style={{ flex: 1 }}
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

