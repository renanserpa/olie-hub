// IndexedDB cache for Tiny API responses (TTL: 15 min)

const DB_NAME = 'TinyCache';
const STORE_NAME = 'responses';
const TTL = 15 * 60 * 1000; // 15 min

interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
}

let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
};

export const getCached = async (key: string): Promise<any | null> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const entry: CacheEntry = request.result;
        if (!entry) {
          resolve(null);
          return;
        }

        // Check TTL
        if (Date.now() - entry.timestamp > TTL) {
          // Expired - delete it
          const deleteTransaction = database.transaction([STORE_NAME], 'readwrite');
          const deleteStore = deleteTransaction.objectStore(STORE_NAME);
          deleteStore.delete(key);
          resolve(null);
          return;
        }

        resolve(entry.data);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[tinyCache] getCached error:', error);
    return null;
  }
};

export const setCache = async (key: string, data: any): Promise<void> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const entry: CacheEntry = {
        key,
        data,
        timestamp: Date.now(),
      };
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[tinyCache] setCache error:', error);
  }
};

export const clearCache = async (): Promise<void> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[tinyCache] clearCache error:', error);
  }
};
