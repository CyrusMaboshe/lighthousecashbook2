/**
 * Offline Indicator Component
 * Shows a subtle banner when the app is offline
 */

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, Wifi, Cloud, CloudOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
    const { isOnline, isConnected, connectionQuality } = useNetworkStatus();

    // Don't show anything if online is not explicitly false
    // This prevents showing during initialization
    if (isOnline !== false && connectionQuality !== 'poor') {
        return null;
    }

    const getStatusInfo = () => {
        if (isOnline === false) {
            return {
                icon: WifiOff,
                text: 'Offline - Viewing cached data',
                variant: 'destructive' as const,
                bgClass: 'bg-red-500/10 border-red-500/20'
            };
        }

        if (!isConnected) {
            return {
                icon: CloudOff,
                text: 'No server connection - Viewing cached data',
                variant: 'destructive' as const,
                bgClass: 'bg-red-500/10 border-red-500/20'
            };
        }

        if (connectionQuality === 'poor') {
            return {
                icon: Cloud,
                text: 'Poor connection',
                variant: 'secondary' as const,
                bgClass: 'bg-yellow-500/10 border-yellow-500/20'
            };
        }

        return {
            icon: Wifi,
            text: 'Online',
            variant: 'default' as const,
            bgClass: 'bg-green-500/10 border-green-500/20'
        };
    };

    const status = getStatusInfo();
    const Icon = status.icon;

    return (
        <div
            className={cn(
                "fixed top-0 left-0 right-0 z-50 px-4 py-2 backdrop-blur-md border-b transition-all duration-300",
                status.bgClass
            )}
            style={{
                animation: 'slideDown 0.3s ease-out'
            }}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{status.text}</span>
            </div>

            <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
        </div>
    );
}
