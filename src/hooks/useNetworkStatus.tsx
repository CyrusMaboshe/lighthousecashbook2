import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean; // Database connectivity
  lastOnlineTime: Date | null;
  connectionQuality: 'good' | 'poor' | 'offline';
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isConnected: false,
    lastOnlineTime: navigator.onLine ? new Date() : null,
    connectionQuality: navigator.onLine ? 'good' : 'offline'
  });

  // Test database connectivity
  const testDatabaseConnection = useCallback(async (): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('mt_companies')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.warn('Database connectivity test failed:', error);
      return false;
    }
  }, []);

  // Test connection quality by measuring response time
  const testConnectionQuality = useCallback(async (): Promise<'good' | 'poor'> => {
    try {
      const startTime = Date.now();
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Consider connection poor if response time > 3 seconds
      return responseTime > 3000 ? 'poor' : 'good';
    } catch (error) {
      return 'poor';
    }
  }, []);

  // Update network status
  const updateNetworkStatus = useCallback(async () => {
    const isOnline = navigator.onLine;
    
    if (!isOnline) {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        isConnected: false,
        connectionQuality: 'offline'
      }));
      return;
    }

    // Test database connectivity and connection quality in parallel
    const [isConnected, quality] = await Promise.all([
      testDatabaseConnection(),
      testConnectionQuality()
    ]);

    setNetworkStatus(prev => ({
      isOnline: true,
      isConnected,
      lastOnlineTime: new Date(),
      connectionQuality: isConnected ? quality : 'poor'
    }));
  }, [testDatabaseConnection, testConnectionQuality]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network: Online');
      updateNetworkStatus();
    };

    const handleOffline = () => {
      console.log('📴 Network: Offline');
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        isConnected: false,
        connectionQuality: 'offline'
      }));
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial status check
    updateNetworkStatus();

    // Periodic connectivity check (every 30 seconds when online)
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        updateNetworkStatus();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [updateNetworkStatus]);

  // Manual refresh function
  const refreshNetworkStatus = useCallback(() => {
    updateNetworkStatus();
  }, [updateNetworkStatus]);

  return {
    ...networkStatus,
    refreshNetworkStatus
  };
}

// Network status context for global state management
import { createContext, useContext, ReactNode } from 'react';

interface NetworkStatusContextType {
  networkStatus: NetworkStatus;
  refreshNetworkStatus: () => void;
}

const NetworkStatusContext = createContext<NetworkStatusContextType | undefined>(undefined);

export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const networkStatusData = useNetworkStatus();

  return (
    <NetworkStatusContext.Provider value={networkStatusData as any}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

export function useNetworkStatusContext() {
  const context = useContext(NetworkStatusContext);
  if (context === undefined) {
    throw new Error('useNetworkStatusContext must be used within a NetworkStatusProvider');
  }
  return context;
}

// Utility functions
export const isOnlineAndConnected = (status: NetworkStatus): boolean => {
  return status.isOnline && status.isConnected;
};

export const getConnectionStatusText = (status: NetworkStatus): string => {
  if (!status.isOnline) return 'Offline';
  if (!status.isConnected) return 'No Database Connection';
  
  switch (status.connectionQuality) {
    case 'good': return 'Online';
    case 'poor': return 'Poor Connection';
    default: return 'Offline';
  }
};

export const getConnectionStatusColor = (status: NetworkStatus): string => {
  if (!status.isOnline || !status.isConnected) return 'text-red-500';
  
  switch (status.connectionQuality) {
    case 'good': return 'text-green-500';
    case 'poor': return 'text-yellow-500';
    default: return 'text-red-500';
  }
};
