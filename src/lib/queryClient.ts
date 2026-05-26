import { QueryClient } from '@tanstack/react-query';

// Create a query client with optimized settings for mobile performance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for real-time data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect to save bandwidth on mobile
      refetchOnReconnect: false,
      // Background refetch interval for critical data
      refetchInterval: false,
      // Network mode for offline support
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Network mode for mutations
      networkMode: 'online',
    },
  },
});

// Query keys for consistent caching
export const queryKeys = {
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.transactions.lists(), filters] as const,
    details: () => [...queryKeys.transactions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.transactions.details(), id] as const,
  },
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.categories.lists(), filters] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    current: () => [...queryKeys.users.all, 'current'] as const,
  },
  companies: {
    all: ['companies'] as const,
    lists: () => [...queryKeys.companies.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.companies.lists(), filters] as const,
    details: () => [...queryKeys.companies.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.companies.details(), id] as const,
  },
  campaigns: {
    all: ['campaigns'] as const,
    lists: () => [...queryKeys.campaigns.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.campaigns.lists(), filters] as const,
    details: () => [...queryKeys.campaigns.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.campaigns.details(), id] as const,
  },
  stats: {
    all: ['stats'] as const,
    dashboard: () => [...queryKeys.stats.all, 'dashboard'] as const,
    user: (userId: string) => [...queryKeys.stats.all, 'user', userId] as const,
    company: (companyId: string) => [...queryKeys.stats.all, 'company', companyId] as const,
    campaign: (campaignId: string) => [...queryKeys.stats.all, 'campaign', campaignId] as const,
  },
} as const;

// Performance monitoring utilities
export const performanceMonitor = {
  // Track query performance
  trackQuery: (queryKey: string, startTime: number) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 1000) {
      console.warn(`Slow query detected: ${queryKey} took ${duration.toFixed(2)}ms`);
    }
    
    // Store performance data for analysis
    const perfData = {
      queryKey,
      duration,
      timestamp: Date.now(),
    };
    
    // Store in sessionStorage for debugging
    const existingData = JSON.parse(sessionStorage.getItem('query-performance') || '[]');
    existingData.push(perfData);
    
    // Keep only last 100 entries
    if (existingData.length > 100) {
      existingData.splice(0, existingData.length - 100);
    }
    
    sessionStorage.setItem('query-performance', JSON.stringify(existingData));
  },

  // Get performance statistics
  getStats: () => {
    const data = JSON.parse(sessionStorage.getItem('query-performance') || '[]');
    
    if (data.length === 0) return null;
    
    const durations = data.map((d: any) => d.duration);
    const avg = durations.reduce((a: number, b: number) => a + b, 0) / durations.length;
    const max = Math.max(...durations);
    const min = Math.min(...durations);
    
    return {
      totalQueries: data.length,
      averageDuration: avg,
      maxDuration: max,
      minDuration: min,
      slowQueries: data.filter((d: any) => d.duration > 1000),
    };
  },

  // Clear performance data
  clear: () => {
    sessionStorage.removeItem('query-performance');
  },
};

// Cache management utilities
export const cacheManager = {
  // Invalidate all transaction-related queries
  invalidateTransactions: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
  },

  // Invalidate all user-related queries
  invalidateUsers: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  },

  // Invalidate all company-related queries
  invalidateCompanies: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
  },

  // Invalidate all stats
  invalidateStats: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
  },

  // Clear all cache
  clearAll: () => {
    queryClient.clear();
  },

  // Get cache size (approximate)
  getCacheSize: () => {
    const cache = queryClient.getQueryCache();
    return cache.getAll().length;
  },

  // Prefetch critical data
  prefetchCriticalData: async (userId?: string, companyId?: string) => {
    const prefetchPromises = [];

    // Prefetch user data if available
    if (userId) {
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.users.detail(userId),
          staleTime: 10 * 60 * 1000, // 10 minutes
        })
      );
    }

    // Prefetch company data if available
    if (companyId) {
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.companies.detail(companyId),
          staleTime: 10 * 60 * 1000, // 10 minutes
        })
      );
    }

    // Prefetch categories (commonly used)
    prefetchPromises.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.categories.lists(),
        staleTime: 30 * 60 * 1000, // 30 minutes (categories don't change often)
      })
    );

    await Promise.allSettled(prefetchPromises);
  },
};

// Network status monitoring
export const networkMonitor = {
  isOnline: () => navigator.onLine,
  
  setupNetworkListeners: () => {
    const handleOnline = () => {
      console.log('Network: Back online, resuming queries');
      queryClient.resumePausedMutations();
      queryClient.invalidateQueries();
    };

    const handleOffline = () => {
      console.log('Network: Gone offline, pausing queries');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },
};
