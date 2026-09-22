/**
 * Feature 15 — Offline-First PWA Queue
 * Provides offline storage for complaint submissions using IndexedDB,
 * with graceful fallback to localStorage when IndexedDB is unavailable.
 * Automatically synchronizes queued reports when connection is restored.
 */

const DB_NAME = 'CivicSenseOfflineDB';
const STORE_NAME = 'offline_complaints';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null); // Fallback to localStorage
    }

    const req = window.indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => {
      console.warn('[OfflineQueue] IndexedDB open error, using localStorage fallback:', e);
      resolve(null);
    };
  });

  return dbPromise;
}

/**
 * Enqueue a new report while offline.
 * @param {Object} reportData - Form data or JSON fields
 * @returns {Promise<string>} The generated offline ID
 */
export async function enqueueReport(reportData) {
  const id = `OFFLINE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const item = {
    id,
    data: reportData,
    createdAt: new Date().toISOString(),
    synced: false,
    retryCount: 0
  };

  const db = await getDB();
  if (db) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(item);
        tx.oncomplete = () => resolve(id);
        tx.onerror = (e) => {
          console.warn('[OfflineQueue] Failed to put in IndexedDB, fallback to LS:', e);
          fallbackSave(item);
          resolve(id);
        };
      } catch (err) {
        fallbackSave(item);
        resolve(id);
      }
    });
  } else {
    fallbackSave(item);
    return id;
  }
}

function fallbackSave(item) {
  try {
    const list = JSON.parse(localStorage.getItem('civicsense_offline_queue') || '[]');
    list.push(item);
    localStorage.setItem('civicsense_offline_queue', JSON.stringify(list));
  } catch (e) {
    console.error('[OfflineQueue] LocalStorage fallback failed:', e);
  }
}

/**
 * Retrieve all pending (unsynced) offline reports.
 * @returns {Promise<Array>}
 */
export async function getPendingReports() {
  const db = await getDB();
  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const items = (req.result || []).filter(item => !item.synced);
          resolve(items);
        };
        req.onerror = () => {
          resolve(fallbackGetPending());
        };
      } catch {
        resolve(fallbackGetPending());
      }
    });
  }
  return fallbackGetPending();
}

function fallbackGetPending() {
  try {
    const list = JSON.parse(localStorage.getItem('civicsense_offline_queue') || '[]');
    return list.filter(item => !item.synced);
  } catch {
    return [];
  }
}

/**
 * Get count of pending unsynced reports.
 */
export async function getPendingCount() {
  const items = await getPendingReports();
  return items.length;
}

/**
 * Flush and submit all queued reports to the backend.
 * @param {Function} submitFn - Function that receives data and sends to backend (e.g. api.createComplaint or api.uploadComplaintWithPhoto)
 * @returns {Promise<{ syncedCount: number, failedCount: number }>}
 */
export async function flushQueue(submitFn) {
  const pending = await getPendingReports();
  if (pending.length === 0) return { syncedCount: 0, failedCount: 0 };

  let syncedCount = 0;
  let failedCount = 0;

  const db = await getDB();

  for (const item of pending) {
    try {
      let res;
      if (typeof submitFn === 'function') {
        res = await submitFn(item.data);
      } else {
        // Default: POST /api/complaints
        const API_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:4000/api';
        const isFormData = item.data instanceof FormData;
        const response = await fetch(`${API_URL}/complaints`, {
          method: 'POST',
          headers: isFormData ? {} : { 'Content-Type': 'application/json' },
          body: isFormData ? item.data : JSON.stringify(item.data)
        });
        res = await response.json();
      }

      if (res && (res.success || res.complaintNumber || res.data)) {
        syncedCount++;
        await markSynced(item.id, db);
      } else {
        failedCount++;
      }
    } catch (err) {
      console.warn('[OfflineQueue] Flush item failed:', item.id, err);
      failedCount++;
    }
  }

  return { syncedCount, failedCount };
}

async function markSynced(id, db) {
  if (db) {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
    } catch {}
  }
  try {
    const list = JSON.parse(localStorage.getItem('civicsense_offline_queue') || '[]');
    const updated = list.filter(x => x.id !== id);
    localStorage.setItem('civicsense_offline_queue', JSON.stringify(updated));
  } catch {}
}

/**
 * Initialize automatic background sync when network comes back online.
 * @param {Function} onSyncComplete - Callback after auto-flush finishes
 */
export function initOnlineListener(onSyncComplete) {
  if (typeof window === 'undefined') return;

  const handleOnline = async () => {
    console.log('[OfflineQueue] Device returned online, flushing pending reports...');
    try {
      const result = await flushQueue();
      if (result.syncedCount > 0 && typeof onSyncComplete === 'function') {
        onSyncComplete(result);
      }
    } catch (err) {
      console.warn('[OfflineQueue] Online auto-flush error:', err);
    }
  };

  window.addEventListener('online', handleOnline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
