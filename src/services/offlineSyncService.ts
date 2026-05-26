/**
 * Offline Sync Service
 * Handles synchronization of offline changes when connection is restored
 */

import { offlineCacheManager } from './offlineCacheManager';
import { supabase } from '@/integrations/supabase/client';
import { SyncQueueItem } from './indexedDBService';

class OfflineSyncService {
    private isSyncing = false;
    private syncListeners: Array<(status: 'syncing' | 'complete' | 'error') => void> = [];

    /**
     * Add a listener for sync status changes
     */
    onSyncStatusChange(callback: (status: 'syncing' | 'complete' | 'error') => void) {
        this.syncListeners.push(callback);
        return () => {
            this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
        };
    }

    /**
     * Notify all listeners of sync status change
     */
    private notifyListeners(status: 'syncing' | 'complete' | 'error') {
        this.syncListeners.forEach(callback => callback(status));
    }

    /**
     * Sync all pending offline changes
     */
    async syncOfflineChanges(): Promise<{ success: boolean; synced: number; failed: number }> {
        if (this.isSyncing) {
            console.log('⏳ Sync already in progress');
            return { success: false, synced: 0, failed: 0 };
        }

        this.isSyncing = true;
        this.notifyListeners('syncing');

        let syncedCount = 0;
        let failedCount = 0;

        try {
            console.log('🔄 Starting offline sync...');

            await offlineCacheManager.processSyncQueue(async (item: SyncQueueItem) => {
                try {
                    await this.syncItem(item);
                    syncedCount++;
                    console.log(`✅ Synced item ${syncedCount}:`, item.action, item.store);
                } catch (error) {
                    failedCount++;
                    console.error('❌ Failed to sync item:', item, error);
                    throw error; // Re-throw to let the queue processor handle it
                }
            });

            console.log(`✅ Sync complete: ${syncedCount} synced, ${failedCount} failed`);
            this.notifyListeners('complete');

            return { success: true, synced: syncedCount, failed: failedCount };
        } catch (error) {
            console.error('❌ Sync error:', error);
            this.notifyListeners('error');
            return { success: false, synced: syncedCount, failed: failedCount };
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Sync a single queue item
     */
    private async syncItem(item: SyncQueueItem): Promise<void> {
        switch (item.store) {
            case 'transactions':
                await this.syncTransaction(item);
                break;
            default:
                console.warn('Unknown store type:', item.store);
        }
    }

    /**
     * Sync a transaction
     */
    private async syncTransaction(item: SyncQueueItem): Promise<void> {
        const transaction = item.data;

        switch (item.action) {
            case 'create':
                // Check if this is an offline transaction (has offline_ prefix)
                if (transaction.id.startsWith('offline_')) {
                    // Create a new transaction on the server
                    const { id, ...transactionData } = transaction;

                    const { data, error } = await supabase
                        .from('transactions')
                        .insert([transactionData])
                        .select()
                        .single();

                    if (error) {
                        console.error('Failed to sync transaction creation:', error);
                        throw error;
                    }

                    // Update the cached transaction with the real ID
                    await offlineCacheManager.deleteCachedTransaction(id);
                    if (data) {
                        await offlineCacheManager.cacheSingleTransaction(data);
                    }

                    console.log('✅ Synced offline transaction:', id, '→', data?.id);
                }
                break;

            case 'update':
                const { error: updateError } = await supabase
                    .from('transactions')
                    .update(transaction)
                    .eq('id', transaction.id);

                if (updateError) {
                    console.error('Failed to sync transaction update:', updateError);
                    throw updateError;
                }

                console.log('✅ Synced transaction update:', transaction.id);
                break;

            case 'delete':
                const { error: deleteError } = await supabase
                    .from('transactions')
                    .delete()
                    .eq('id', transaction.id);

                if (deleteError) {
                    console.error('Failed to sync transaction deletion:', deleteError);
                    throw deleteError;
                }

                console.log('✅ Synced transaction deletion:', transaction.id);
                break;
        }
    }

    /**
     * Check if there are pending sync items
     */
    async hasPendingSync(): Promise<boolean> {
        const stats = await offlineCacheManager.getCacheStats();
        return stats.pendingSyncItems > 0;
    }

    /**
     * Get sync statistics
     */
    async getSyncStats() {
        return await offlineCacheManager.getCacheStats();
    }
}

// Export singleton instance
export const offlineSyncService = new OfflineSyncService();
