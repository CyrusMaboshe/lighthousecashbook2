/**
 * Offline Cache Manager
 * Manages caching and synchronization of data between server and IndexedDB
 */

import { indexedDBService, STORES } from './indexedDBService';
import { Transaction } from '@/hooks/useTransactions';

export interface CacheMetadata {
    lastSync: number;
    dataVersion: number;
}

class OfflineCacheManager {
    private syncInProgress = false;

    /**
     * Cache transactions to IndexedDB
     */
    async cacheTransactions(transactions: Transaction[]): Promise<void> {
        try {
            await indexedDBService.putMany(STORES.TRANSACTIONS, transactions);
            await indexedDBService.setMetadata('transactions_last_sync', Date.now());
            console.log(`📦 Cached ${transactions.length} transactions to IndexedDB`);
        } catch (error) {
            console.error('Failed to cache transactions:', error);
            throw error;
        }
    }

    /**
     * Get cached transactions from IndexedDB
     */
    async getCachedTransactions(): Promise<Transaction[]> {
        try {
            const transactions = await indexedDBService.getAll<Transaction>(STORES.TRANSACTIONS);
            console.log(`📦 Retrieved ${transactions.length} cached transactions`);
            return transactions;
        } catch (error) {
            console.error('Failed to get cached transactions:', error);
            return [];
        }
    }

    /**
     * Cache a single transaction
     */
    async cacheSingleTransaction(transaction: Transaction): Promise<void> {
        try {
            await indexedDBService.put(STORES.TRANSACTIONS, transaction);
            console.log('📦 Cached transaction:', transaction.id);
        } catch (error) {
            console.error('Failed to cache transaction:', error);
            throw error;
        }
    }

    /**
     * Update cached transaction
     */
    async updateCachedTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
        try {
            const existing = await indexedDBService.get<Transaction>(STORES.TRANSACTIONS, id);
            if (existing) {
                const updated = { ...existing, ...updates };
                await indexedDBService.put(STORES.TRANSACTIONS, updated);
                console.log('📦 Updated cached transaction:', id);
            }
        } catch (error) {
            console.error('Failed to update cached transaction:', error);
            throw error;
        }
    }

    /**
     * Delete cached transaction
     */
    async deleteCachedTransaction(id: string): Promise<void> {
        try {
            await indexedDBService.delete(STORES.TRANSACTIONS, id);
            console.log('📦 Deleted cached transaction:', id);
        } catch (error) {
            console.error('Failed to delete cached transaction:', error);
            throw error;
        }
    }

    /**
     * Cache categories
     */
    async cacheCategories(categories: any[]): Promise<void> {
        try {
            await indexedDBService.putMany(STORES.CATEGORIES, categories);
            await indexedDBService.setMetadata('categories_last_sync', Date.now());
            console.log(`📦 Cached ${categories.length} categories`);
        } catch (error) {
            console.error('Failed to cache categories:', error);
            throw error;
        }
    }

    /**
     * Get cached categories
     */
    async getCachedCategories(): Promise<any[]> {
        try {
            return await indexedDBService.getAll(STORES.CATEGORIES);
        } catch (error) {
            console.error('Failed to get cached categories:', error);
            return [];
        }
    }

    /**
     * Cache quick stats
     */
    async cacheQuickStats(month: number, year: number, stats: any): Promise<void> {
        try {
            const key = `stats_${year}_${month}`;
            await indexedDBService.put(STORES.QUICK_STATS, {
                key,
                stats,
                timestamp: Date.now()
            });
            console.log(`📦 Cached stats for ${year}-${month}`);
        } catch (error) {
            console.error('Failed to cache stats:', error);
        }
    }

    /**
     * Get cached quick stats
     */
    async getCachedQuickStats(month: number, year: number): Promise<any | null> {
        try {
            const key = `stats_${year}_${month}`;
            const result = await indexedDBService.get<{ key: string; stats: any }>(STORES.QUICK_STATS, key);
            return result?.stats || null;
        } catch (error) {
            console.error('Failed to get cached stats:', error);
            return null;
        }
    }

    /**
     * Cache user preferences
     */
    async cacheUserPreferences(key: string, value: any): Promise<void> {
        try {
            await indexedDBService.put(STORES.USER_PREFERENCES, { key, value });
        } catch (error) {
            console.error('Failed to cache user preferences:', error);
        }
    }

    /**
     * Get cached user preferences
     */
    async getCachedUserPreferences(key: string): Promise<any> {
        try {
            const result = await indexedDBService.get<{ key: string; value: any }>(STORES.USER_PREFERENCES, key);
            return result?.value;
        } catch (error) {
            console.error('Failed to get cached user preferences:', error);
            return null;
        }
    }

    /**
     * Get last sync timestamp
     */
    async getLastSyncTime(dataType: string): Promise<number | null> {
        try {
            const timestamp = await indexedDBService.getMetadata(`${dataType}_last_sync`);
            return timestamp || null;
        } catch (error) {
            console.error('Failed to get last sync time:', error);
            return null;
        }
    }

    /**
     * Check if cache is stale (older than 5 minutes)
     */
    async isCacheStale(dataType: string, maxAgeMs: number = 5 * 60 * 1000): Promise<boolean> {
        const lastSync = await this.getLastSyncTime(dataType);
        if (!lastSync) return true;
        return Date.now() - lastSync > maxAgeMs;
    }

    /**
     * Add offline change to sync queue
     */
    async queueOfflineChange(action: 'create' | 'update' | 'delete', store: string, data: any): Promise<void> {
        try {
            await indexedDBService.addToSyncQueue({ action, store, data });
            console.log(`📤 Queued offline ${action} for ${store}`);
        } catch (error) {
            console.error('Failed to queue offline change:', error);
        }
    }

    /**
     * Process sync queue when back online
     */
    async processSyncQueue(syncCallback: (item: any) => Promise<void>): Promise<void> {
        if (this.syncInProgress) {
            console.log('⏳ Sync already in progress');
            return;
        }

        try {
            this.syncInProgress = true;
            const queue = await indexedDBService.getSyncQueue();

            if (queue.length === 0) {
                console.log('✅ No pending sync items');
                return;
            }

            console.log(`🔄 Processing ${queue.length} sync items`);

            for (const item of queue) {
                try {
                    await syncCallback(item);
                } catch (error) {
                    console.error('Failed to sync item:', item, error);
                    // Continue with other items even if one fails
                }
            }

            // Clear queue after successful sync
            await indexedDBService.clearSyncQueue();
            console.log('✅ Sync queue processed');
        } catch (error) {
            console.error('Failed to process sync queue:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Clear all cached data
     */
    async clearAllCache(): Promise<void> {
        try {
            await Promise.all([
                indexedDBService.clear(STORES.TRANSACTIONS),
                indexedDBService.clear(STORES.CATEGORIES),
                indexedDBService.clear(STORES.QUICK_STATS),
                indexedDBService.clear(STORES.USER_PREFERENCES),
                indexedDBService.clear(STORES.SYNC_QUEUE),
                indexedDBService.clear(STORES.METADATA)
            ]);
            console.log('🗑️ All cache cleared');
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    }

    /**
     * Get cache statistics
     */
    async getCacheStats(): Promise<{
        transactionCount: number;
        categoryCount: number;
        lastTransactionSync: number | null;
        lastCategorySync: number | null;
        pendingSyncItems: number;
    }> {
        try {
            const [transactions, categories, syncQueue, lastTransactionSync, lastCategorySync] = await Promise.all([
                indexedDBService.getAll(STORES.TRANSACTIONS),
                indexedDBService.getAll(STORES.CATEGORIES),
                indexedDBService.getSyncQueue(),
                this.getLastSyncTime('transactions'),
                this.getLastSyncTime('categories')
            ]);

            return {
                transactionCount: transactions.length,
                categoryCount: categories.length,
                lastTransactionSync,
                lastCategorySync,
                pendingSyncItems: syncQueue.length
            };
        } catch (error) {
            console.error('Failed to get cache stats:', error);
            return {
                transactionCount: 0,
                categoryCount: 0,
                lastTransactionSync: null,
                lastCategorySync: null,
                pendingSyncItems: 0
            };
        }
    }
}

// Export singleton instance
export const offlineCacheManager = new OfflineCacheManager();
