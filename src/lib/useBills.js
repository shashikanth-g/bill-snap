import { useState, useEffect, useCallback } from 'react'
import { getAllBills, addBill, updateBill, deleteBill, clearBills } from './db'

// Module-level broadcaster to keep all hook instances in sync
const subscribers = new Set()
const notifySubscribers = () => {
  subscribers.forEach((fn) => fn())
}

/**
 * Sorts bills newest first by date ("YYYY-MM-DD"), then by createdAt timestamp.
 */
export function sortBills(list = []) {
  return [...list].sort((a, b) => {
    const diff = new Date(b.date) - new Date(a.date)
    if (diff !== 0) return diff
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  })
}

/**
 * React hook to manage bills stored in IndexedDB.
 * Returns { bills, loading, error, add, update, remove, restore, clear }
 */
export function useBills() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Request persistent storage on load to avoid browser evictions
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {
        // Silently ignore failures
      })
    }
  }, [])

  // Load all bills from IndexedDB
  const fetchBills = useCallback(async () => {
    try {
      const records = await getAllBills()
      setBills(sortBills(records))
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load bills')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBills()

    // Subscribe to changes from other hook usages
    subscribers.add(fetchBills)
    return () => {
      subscribers.delete(fetchBills)
    }
  }, [fetchBills])

  // Add a new bill and update state immediately
  const add = useCallback(async (bill) => {
    try {
      const saved = await addBill(bill)
      setBills((prev) => sortBills([saved, ...prev.filter((b) => b.id !== saved.id)]))
      notifySubscribers()
      return saved
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // Update a bill and update state immediately
  const update = useCallback(async (bill) => {
    try {
      const updated = await updateBill(bill)
      setBills((prev) => sortBills(prev.map((b) => (b.id === updated.id ? updated : b))))
      notifySubscribers()
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // Remove a bill by ID and update state immediately
  const remove = useCallback(async (id) => {
    try {
      await deleteBill(id)
      setBills((prev) => prev.filter((b) => b.id !== id))
      notifySubscribers()
      return id
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // Restore a previously deleted bill (preserves original ID)
  const restore = useCallback(async (bill) => {
    try {
      // Use updateBill (put) so it restores the exact same ID
      const restored = await updateBill(bill)
      setBills((prev) => sortBills([restored, ...prev.filter((b) => b.id !== restored.id)]))
      notifySubscribers()
      return restored
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // Clear all bills
  const clear = useCallback(async () => {
    try {
      await clearBills()
      setBills([])
      notifySubscribers()
      return true
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  return {
    bills,
    loading,
    error,
    add,
    update,
    remove,
    restore,
    clear,
  }
}

export default useBills

