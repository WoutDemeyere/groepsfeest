import type { StateStorage } from 'zustand/middleware'

const DB_NAME = 'groepsfeestappV2'
const STORE_NAME = 'zustand-store'
const DB_VERSION = 1

const isIndexedDbAvailable = () => typeof indexedDB !== 'undefined'

const dbPromise: Promise<IDBDatabase> | null = isIndexedDbAvailable()
  ? new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  : null

const withStore = async <T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  if (!dbPromise) return Promise.reject(new Error('IndexedDB unavailable'))
  const db = await dbPromise
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    const request = callback(store)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

const noopStorage: StateStorage = {
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined
}

export const idbStorage: StateStorage = dbPromise
  ? {
      getItem: async (name) => {
        const value = await withStore<string | null>('readonly', (store) => store.get(name))
        return value ?? null
      },
      setItem: async (name, value) => {
        await withStore('readwrite', (store) => store.put(value, name))
      },
      removeItem: async (name) => {
        await withStore('readwrite', (store) => store.delete(name))
      }
    }
  : noopStorage
