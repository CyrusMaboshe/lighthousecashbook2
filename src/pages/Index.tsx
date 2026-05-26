import { useState, useEffect } from 'react';
import { TransactionLoadingScreen, LogoutLoadingScreen } from '@/components/loading/TransactionLoadingScreen';
import { UnifiedLoginForm } from '@/components/UnifiedLoginForm';
import { GlassMainApp } from '@/components/glass-ui';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import { useAuth } from '@/hooks/useAuth';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { useTenant } from '@/contexts/TenantContext';
import { useRealtimeSystemSettings } from '@/hooks/useRealtimeSystemSettings';

// Import Glass Theme CSS
import '@/components/glass-ui/GlassTheme.css';

export interface FilterOptions {
  duration: 'all' | 'today' | 'yesterday' | 'this-week' | 'custom';
  type: 'all' | 'cash-in' | 'cash-out';
  categories?: string[];
  customStartDate?: string;
  customEndDate?: string;
  search?: string;
  category?: string;
  dateRange?: string;
}

const Index = () => {
  return <AuthenticatedApp />;
};

const AuthenticatedApp = () => {
  const { currentUser: legacyUser, isLoggingOut, isInitialized } = useAuth();
  const { currentUser: mtUser, isInitialized: isMTInitialized } = useMultiTenantAuth();
  const { role, tenantId, isLoading: isTenantLoading } = useTenant();
  const [isReady, setIsReady] = useState(false);

  // Add real-time system settings listener
  useRealtimeSystemSettings();

  useEffect(() => {
    // Set ready state after all auth systems are initialized
    if (isInitialized && isMTInitialized && !isTenantLoading) {
      setIsReady(true);
    }
  }, [isInitialized, isMTInitialized, isTenantLoading]);

  console.log('🔐 Unified Authentication state:', {
    legacyUser: legacyUser?.username,
    mtUser: mtUser?.username,
    tenantId,
    role,
    isReady,
    isLoggingOut
  });

  // Show logout loading screen when logging out
  if (isLoggingOut) {
    return <LogoutLoadingScreen />;
  }

  // Show initialization loading if not ready
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans">
        {/* Background Effects */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="text-center relative z-10 animate-in fade-in zoom-in-95 duration-700">
          <div className="w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-[28px] border border-white/10 backdrop-blur-xl flex items-center justify-center mx-auto mb-6 shadow-2xl relative">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Establishing Connection...</p>
        </div>
      </div>
    );
  }

  // Determine if user is authenticated via any auth source
  const isAuthenticated = !!(legacyUser || mtUser || tenantId);

  // Show main app for ANY authenticated user
  if (isAuthenticated) {
    return (
      <ErrorBoundary
        fallbackTitle="Dashboard Error"
        fallbackMessage="Something went wrong loading your dashboard. Please refresh the page."
      >
        <div className="glass-animate-fade-in">
          <GlassMainApp />
        </div>
      </ErrorBoundary>
    );
  }

  // Show login form when not authenticated
  return <UnifiedLoginForm />;
};

export default Index;
