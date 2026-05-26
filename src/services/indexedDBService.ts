/**
 * IndexedDB Service for Offline Data Persistence
 * Stores transactions, categories, and other app data locally
 */

const DB_NAME = 'lighthouse_cash_flow_db';
const DB_VERSION = 1;

// Store names
export const STORES = {
    TRANSACTIONS: 'transactions',
    CATEGORIES: 'categories',
    QUICK_STATS: 'quick_stats',
    USER_PREFERENCES: 'user_preferences',
    SYNC_QUEUE: 'sync_queue',
    METADATA: 'metadata'
} as const;

export interface SyncQueueItem {
    id: string;
    action: 'create' | 'update' | 'delete';
    store: string;
    data: any;
    timestamp: number;
}

class IndexedDBService {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<IDBDatabase> | null = null;

    /**
     * Initialize the IndexedDB database
     */
    async init(): Promise<IDBDatabase> {
        if (this.db) {
            return this.db;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB initialization failed:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Transactions store
                if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
                    const transactionStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
                    transactionStore.createIndex('date', 'date', { unique: false });
                    transactionStore.createIndex('type', 'type', { unique: false });
                    transactionStore.createIndex('user_id', 'user_id', { unique: false });
                }

                // Categories store
                if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
                    db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
                }

                // Quick stats store
                if (!db.objectStoreNames.contains(STORES.QUICK_STATS)) {
                    const statsStore = db.createObjectStore(STORES.QUICK_STATS, { keyPath: 'key' });
                    statsStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // User preferences store
                if (!db.objectStoreNames.contains(STORES.USER_PREFERENCES)) {
                    db.createObjectStore(STORES.USER_PREFERENCES, { keyPath: 'key' });
                }

                // Sync queue store (for offline changes)
                if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
                    const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
                    syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Metadata store (for cache timestamps, etc.)
                if (!db.objectStoreNames.contains(STORES.METADATA)) {
                    db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
                }

                console.log('📦 IndexedDB stores created');
            };
        });

        return this.initPromise;
    }

    /**
     * Get all items from a store
     */
    async getAll<T>(storeName: string): Promise<T[]> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get a single item by key
     */
    async get<T>(storeName: string, key: string | number): Promise<T | undefined> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Add or update an item in a store
     */
    async put<T>(storeName: string, item: T): Promise<void> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Add multiple items to a store
     */
    async putMany<T>(storeName: string, items: T[]): Promise<void> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);

            let completed = 0;
            const total = items.length;

            if (total === 0) {
                resolve();
                return;
            }

            items.forEach(item => {
                const request = store.put(item);
                request.onsuccess = () => {
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };
                request.onerror = () => reject(request.error);
            });
        });
    }

    /**
     * Delete an item from a store
     */
    async delete(storeName: string, key: string | number): Promise<void> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear all items from a store
     */
    async clear(storeName: string): Promise<void> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get items by index
     */
    async getByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Add item to sync queue
     */
    async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): Promise<void> {
        const queueItem: Omit<SyncQueueItem, 'id'> = {
            ...item,
            timestamp: Date.now()
        };
        await this.put(STORES.SYNC_QUEUE, queueItem);
    }

    /**
     * Get all pending sync items
     */
    async getSyncQueue(): Promise<SyncQueueItem[]> {
        return this.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
    }

    /**
     * Clear sync queue
     */
    async clearSyncQueue(): Promise<void> {
        await this.clear(STORES.SYNC_QUEUE);
    }

    /**
     * Set metadata (e.g., last sync timestamp)
     */
    async setMetadata(key: string, value: any): Promise<void> {
        await this.put(STORES.METADATA, { key, value, timestamp: Date.now() });
    }

    /**
     * Get metadata
     */
    async getMetadata(key: string): Promise<any> {
        const result = await this.get<{ key: string; value: any }>(STORES.METADATA, key);
        return result?.value;
    }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();
