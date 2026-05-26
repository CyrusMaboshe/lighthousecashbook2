/**
 * Hook to handle automatic offline sync when connection is restored
 */

import { useEffect, useState } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { offlineSyncService } from '@/services/offlineSyncService';
import { useToast } from './use-toast';

export function useOfflineSync() {
    const { isOnline, isConnected } = useNetworkStatus();
    const { toast } = useToast();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    useEffect(() => {
        let mounted = true;

        const syncWhenOnline = async () => {
            // Only sync when we're explicitly online and connected
            // Avoid syncing during initialization when status is uncertain
            if (isOnline !== true || isConnected !== true || isSyncing) {
                return;
            }

            // Check if there are pending changes
            const hasPending = await offlineSyncService.hasPendingSync();
            if (!hasPending) {
                return;
            }

            console.log('🔄 Connection restored - syncing offline changes...');
            setIsSyncing(true);

            try {
                const result = await offlineSyncService.syncOfflineChanges();

                if (!mounted) return;

                if (result.success && result.synced > 0) {
                    setLastSyncTime(new Date());
                    toast({
                        title: "Sync Complete",
                        description: `Successfully synced ${result.synced} offline change${result.synced !== 1 ? 's' : ''}.`,
                    });
                }

                if (result.failed > 0) {
                    toast({
                        title: "Partial Sync",
                        description: `${result.synced} synced, ${result.failed} failed. Will retry later.`,
                        variant: "destructive",
                    });
                }
            } catch (error) {
                console.error('Sync error:', error);
                if (mounted) {
                    toast({
                        title: "Sync Failed",
                        description: "Failed to sync offline changes. Will retry when connection is stable.",
                        variant: "destructive",
                    });
                }
            } finally {
                if (mounted) {
                    setIsSyncing(false);
                }
            }
        };

        // Sync when connection is restored
        if (isOnline === true && isConnected === true) {
            // Small delay to ensure connection is stable
            const timeoutId = setTimeout(() => {
                syncWhenOnline();
            }, 2000);

            return () => {
                clearTimeout(timeoutId);
                mounted = false;
            };
        }

        return () => {
            mounted = false;
        };
    }, [isOnline, isConnected, isSyncing, toast]);

    return {
        isSyncing,
        lastSyncTime,
        manualSync: async () => {
            if (isSyncing) return;
            setIsSyncing(true);
            try {
                const result = await offlineSyncService.syncOfflineChanges();
                setLastSyncTime(new Date());
                return result;
            } finally {
                setIsSyncing(false);
            }
        }
    };
}
