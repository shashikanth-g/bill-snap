// Plain IndexedDB storage layer for Bill Snap
const DB_NAME = 'billsnap'
const DB_VERSION = 1
const STORE_NAME = 'bills'

/**
 * Opens connection to IndexedDB "billsnap" (version 1)
 * Creates the "bills" object store with keyPath "id" if not present.
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error(`Database error: ${request.error?.message || 'unknown error'}`))
  })
}

/**
 * Retrieves all stored bills from IndexedDB.
 */
export async function getAllBills() {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(new Error(`Failed to fetch bills: ${request.error?.message}`))
    })
  } catch (err) {
    console.error('getAllBills error:', err)
    throw err
  }
}

/**
 * Adds a new bill. Generates UUID and ISO timestamp if missing.
 */
export async function addBill(bill) {
  try {
    const db = await openDB()
    const record = {
      ...bill,
      id: bill.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `bill_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
      createdAt: bill.createdAt || new Date().toISOString(),
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.add(record)

      request.onsuccess = () => resolve(record)
      request.onerror = () => reject(new Error(`Failed to add bill: ${request.error?.message}`))
    })
  } catch (err) {
    console.error('addBill error:', err)
    throw err
  }
}

/**
 * Updates an existing bill record.
 */
export async function updateBill(bill) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.put(bill)

      request.onsuccess = () => resolve(bill)
      request.onerror = () => reject(new Error(`Failed to update bill: ${request.error?.message}`))
    })
  } catch (err) {
    console.error('updateBill error:', err)
    throw err
  }
}

/**
 * Deletes a single bill by its ID.
 */
export async function deleteBill(id) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => resolve(id)
      request.onerror = () => reject(new Error(`Failed to delete bill: ${request.error?.message}`))
    })
  } catch (err) {
    console.error('deleteBill error:', err)
    throw err
  }
}

/**
 * Clears all bills from the store.
 */
export async function clearBills() {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(new Error(`Failed to clear bills: ${request.error?.message}`))
    })
  } catch (err) {
    console.error('clearBills error:', err)
    throw err
  }
}

