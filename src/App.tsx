import { TransactionNotifications } from '@/components/notifications/TransactionNotifications';
import { PushNotificationManager } from '@/components/notifications/PushNotificationManager';

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { SeparateMultiTenantAuthProvider, useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { TenantProvider, useTenant } from '@/contexts/TenantContext';
import { NetworkStatusProvider } from '@/hooks/useNetworkStatus';
import { UserPreferencesProvider } from '@/hooks/useUserPreferences';
import { GlobalMonthProvider } from '@/hooks/useGlobalMonthControl';
import { forceCleanSessionForJonah, getCurrentMultiTenantUserEmail } from '@/utils/sessionCleanup';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import { RebuiltSuperAdminDashboard } from '@/components/super-admin/RebuiltSuperAdminDashboard';
import { TenantAdminGlassDashboard } from '@/components/glass-ui/TenantAdminGlassDashboard';
import { InstallPrompt } from '@/components/InstallPrompt';
import { OfflineIndicator } from '@/components/OfflineIndicator';

import { queryClient } from '@/lib/queryClient';

function AppContent() {
  const { currentUser: mtUser, isLoading: mtLoading } = useMultiTenantAuth();
  const { tenantId, role, isLoading: isTenantLoading } = useTenant();

  // Clean up legacy multi-tenant sessions ONLY for jonahdjbreezy@gmail.com
  useEffect(() => {
    const currentMTUserEmail = getCurrentMultiTenantUserEmail();
    if (currentMTUserEmail === 'jonahdjbreezy@gmail.com') {
      forceCleanSessionForJonah();
    }
  }, []);

  console.log('🚀 Routing State:', {
    existingLegacyUser: mtUser?.username,
    legacyRole: mtUser?.role,
    newRole: role,
    isTenantLoading,
    mtLoading
  });

  // 1. Show loading while tenant/auth is initializing
  if (isTenantLoading || mtLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans">
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Initializing Platform...</p>
        </div>
      </div>
    );
  }

  const isPlatformAdmin = role === 'main_super_admin' || mtUser?.role === 'super_admin';
  const isBranchAdmin = role === 'tenant_super_admin' || mtUser?.role === 'company_admin';

  // 2. Main Super Admin Routing
  if (isPlatformAdmin) {
    return (
      <ErrorBoundary fallbackTitle="Admin Dashboard Error" fallbackMessage="Something went wrong loading the admin dashboard. Please refresh the page.">
        <Routes>
          <Route path="/infrastructure" element={<RebuiltSuperAdminDashboard />} />
          <Route path="/" element={<Navigate to="/infrastructure" replace />} />
          <Route path="*" element={<Navigate to="/infrastructure" replace />} />
        </Routes>
      </ErrorBoundary>
    );
  }

  // 3. Tenant Super Admin Routing
  if (isBranchAdmin) {
    return (
      <ErrorBoundary fallbackTitle="Company Dashboard Error" fallbackMessage="Something went wrong loading your company dashboard. Please refresh the page.">
        <Routes>
          <Route path="/" element={<TenantAdminGlassDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    );
  }

  // 4. Default Routing (Login / Main App)
  return (
    <ErrorBoundary fallbackTitle="App Error" fallbackMessage="Something went wrong. Please refresh the page.">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary fallbackTitle="Critical Error" fallbackMessage="The application encountered a critical error. Please refresh the page.">
      <QueryClientProvider client={queryClient}>
        <Router>
          <SeparateMultiTenantAuthProvider>
            <TenantProvider>
              <GlobalMonthProvider>
                <AuthProvider>
                  <UserPreferencesProvider>
                    <NetworkStatusProvider>
                      <ThemeProvider>
                        <div className="min-h-screen bg-[#0a0a0b]">
                          <OfflineIndicator />
                          <TransactionNotifications />
                          <PushNotificationManager />
                          <AppContent />
                          <InstallPrompt />
                          <Toaster />
                          {import.meta.env.DEV && (
                            <ReactQueryDevtools initialIsOpen={false} />
                          )}
                        </div>
                      </ThemeProvider>
                    </NetworkStatusProvider>
                  </UserPreferencesProvider>
                </AuthProvider>
              </GlobalMonthProvider>
            </TenantProvider>
          </SeparateMultiTenantAuthProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
