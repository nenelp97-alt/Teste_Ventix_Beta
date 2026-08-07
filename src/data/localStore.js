/**
 * Generic persistence layer for Ventix.
 * Uses IndexedDB when available and falls back to memory/localStorage for tests and offline usage.
 */

const DB_NAME = 'ventix-db';
const DB_VERSION = 1;
const registeredStores = new Set();

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
  };
}

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem('__ventix_test__', '1');
      window.localStorage.removeItem('__ventix_test__');
      return window.localStorage;
    } catch {
      return createMemoryStorage();
    }
  }
  return createMemoryStorage();
}

function getIndexedDB() {
  if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined') {
    return window.indexedDB;
  }
  if (typeof indexedDB !== 'undefined') {
    return indexedDB;
  }
  return null;
}

function registerStore(storageKey) {
  registeredStores.add(storageKey);
}

function openDatabase() {
  const indexedDBApi = getIndexedDB();
  if (!indexedDBApi) {
    return Promise.reject(new Error('IndexedDB is not available'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDBApi.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
      registeredStores.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readAll(key) {
  const indexedDBApi = getIndexedDB();
  if (indexedDBApi) {
    try {
      const db = await openDatabase();
      const items = await new Promise((resolve, reject) => {
        const tx = db.transaction([key], 'readonly');
        const store = tx.objectStore(key);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
        tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
      });
      db.close();
      return items;
    } catch (error) {
      console.warn(`IndexedDB fallback for "${key}":`, error);
    }
  }

  try {
    const storage = getStorage();
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error(`Erro ao ler "${key}":`, error);
    return [];
  }
}

async function writeAll(key, data) {
  const indexedDBApi = getIndexedDB();
  if (indexedDBApi) {
    try {
      const db = await openDatabase();
      await new Promise((resolve, reject) => {
        const tx = db.transaction([key], 'readwrite');
        const store = tx.objectStore(key);
        store.clear();
        data.forEach((item) => {
          store.put(item);
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
      return;
    } catch (error) {
      console.warn(`IndexedDB fallback while writing "${key}":`, error);
    }
  }

  try {
    const storage = getStorage();
    storage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Erro ao salvar "${key}":`, error);
  }
}

/**
 * Creates a CRUD store backed by IndexedDB or a local fallback.
 * @param {string} storageKey - persistence key
 * @param {function} sortFn - optional sort function for list()
 * @returns {object} { list, get, create, update, delete, filter, deleteMany, bulkCreate, clear }
 */
export function createStore(storageKey, sortFn) {
  registerStore(storageKey);

  return {
    async list(sortOrFilter) {
      let items = await readAll(storageKey);

      if (typeof sortOrFilter === 'string' && sortOrFilter.startsWith('-')) {
        const field = sortOrFilter.substring(1);
        items = [...items].sort((a, b) => {
          const av = a[field];
          const bv = b[field];
          if (!av && !bv) return 0;
          if (!av) return 1;
          if (!bv) return -1;
          return String(bv).localeCompare(String(av));
        });
      } else if (typeof sortFn === 'function') {
        items = [...items].sort(sortFn);
      }

      return items;
    },

    async get(id) {
      const items = await readAll(storageKey);
      return items.find((item) => item.id === id) || null;
    },

    async create(data) {
      const items = await readAll(storageKey);
      const now = new Date().toISOString();
      const newItem = {
        ...data,
        id: generateId(),
        created_at: now,
        updated_at: now,
      };
      await writeAll(storageKey, [...items, newItem]);
      return newItem;
    },

    async update(id, data) {
      const items = await readAll(storageKey);
      const updated = items.map((item) =>
        item.id === id
          ? { ...item, ...data, id: item.id, updated_at: new Date().toISOString() }
          : item
      );
      await writeAll(storageKey, updated);
      return updated.find((item) => item.id === id) || null;
    },

    async delete(id) {
      const items = await readAll(storageKey);
      await writeAll(
        storageKey,
        items.filter((item) => item.id !== id)
      );
      return true;
    },

    async filter(criteria = {}) {
      const items = await readAll(storageKey);
      return items.filter((item) =>
        Object.entries(criteria).every(([key, value]) => item[key] === value)
      );
    },

    async deleteMany(criteria = {}) {
      const items = await readAll(storageKey);
      const remaining = items.filter(
        (item) =>
          !Object.entries(criteria).every(
            ([key, value]) => item[key] === value
          )
      );
      await writeAll(storageKey, remaining);
      return true;
    },

    async bulkCreate(records) {
      const items = await readAll(storageKey);
      const now = new Date().toISOString();
      const newRecords = records.map((record) => ({
        ...record,
        id: generateId(),
        created_at: now,
        updated_at: now,
      }));
      await writeAll(storageKey, [...items, ...newRecords]);
      return newRecords;
    },

    async clear() {
      const indexedDBApi = getIndexedDB();
      if (indexedDBApi) {
        try {
          const db = await openDatabase();
          await new Promise((resolve, reject) => {
            const tx = db.transaction([storageKey], 'readwrite');
            const store = tx.objectStore(storageKey);
            store.clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });
          db.close();
          return;
        } catch (error) {
          console.warn(`Erro ao limpar o store "${storageKey}":`, error);
        }
      }

      const storage = getStorage();
      storage.removeItem(storageKey);
    },
  };
}
