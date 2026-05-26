
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AdminNotification, SystemSettings, AuthContextType } from '@/types/auth';
import { authenticateUser, restoreUserSession, setUserSession, clearUserSession } from '@/services/authService';
import { useTenant } from '@/contexts/TenantContext';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { logAdminAction as logAction } from '@/services/adminLogService';
import { logLogin, logLogout } from '@/services/userLogService';
import {
  loadSystemSettings,
  saveSystemSettings
} from '@/services/systemSettingsService';
import { createNotification } from '@/services/notificationService';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(loadSystemSettings());
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Try to restore user session on app initialization
    const initializeAuth = async () => {
      console.log('🔄 Initializing authentication...');
      const restoredUser = restoreUserSession();

      if (restoredUser) {
        console.log('✅ User session restored:', restoredUser.username);
        setCurrentUser(restoredUser);

        // Refresh user data from database to get latest profile picture
        if (restoredUser.id) {
          try {
            console.log('🔄 Refreshing user data from database...');

            // Add a small delay to ensure database is ready
            await new Promise(resolve => setTimeout(resolve, 100));

            const { data: userData, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', restoredUser.id)
              .single();

            if (error) {
              console.error('Error fetching user data:', error);
            } else if (userData) {
              const updatedUser: User = {
                id: userData.id,
                username: userData.username,
                password: userData.password_hash,
                role: userData.role as 'admin' | 'user',
                email: userData.email,
                profile_picture_url: userData.profile_picture_url
              };

              console.log('✅ User data refreshed with profile picture:', updatedUser.profile_picture_url);

              // Only update if we got new data
              if (updatedUser.profile_picture_url !== restoredUser.profile_picture_url) {
                console.log('📸 Profile picture updated from database');
                setCurrentUser(updatedUser);

                // Update session storage with fresh data
                localStorage.setItem('lighthouse-current-user', JSON.stringify(updatedUser));
              }
            }
          } catch (error) {
            console.error('Error refreshing user data on init:', error);
          }
        }
      } else {
        console.log('ℹ️ No valid session found');
      }

      setIsInitialized(true);
    };

    initializeAuth();

    // Load system settings
    setSystemSettings(loadSystemSettings());
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = await authenticateUser(email, password);

      if (user) {
        setCurrentUser(user);
        setUserSession(user);

        // Log the login action
        logLogin(user);

        console.log('✅ User logged in and session stored');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    console.log('🔄 Logging out user...');
    setIsLoggingOut(true);

    try {
      // Log the logout action before clearing user data
      if (currentUser) {
        logLogout(currentUser);
      }

      // Show logout animation for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clear user data and session
      setCurrentUser(null);
      clearUserSession();

      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
    } finally {
      // Always reset logout state, even if there was an error
      setIsLoggingOut(false);
    }
  };

  const logAdminAction = async (action: string) => {
    await logAction(currentUser, action);
  };

  const updateSystemSettings = (newSettings: Partial<SystemSettings>) => {
    const updatedSettings = { ...systemSettings, ...newSettings };
    setSystemSettings(updatedSettings);
    saveSystemSettings(updatedSettings);

    if (currentUser?.role === 'admin') {
      logAdminAction(`Updated system settings: ${Object.keys(newSettings).join(', ')}`);
    }
  };

  const addNotification = (notification: Omit<AdminNotification, 'id' | 'created_at'>) => {
    const newNotification = createNotification(notification);
    setNotifications(prev => [newNotification, ...prev]);
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const { role: tenantRole, tenantId } = useTenant();
  const { currentUser: mtUser } = useMultiTenantAuth();

  // Unified user resolution: check legacy first, then infrastructure, then supabase
  const effectiveUser = currentUser || (mtUser ? {
    id: mtUser.id,
    username: mtUser.username,
    email: mtUser.email,
    password: mtUser.password_hash || '',
    role: (mtUser.role === 'company_admin' || mtUser.role === 'super_admin') ? 'admin' : 'user' as any,
    is_super_admin: mtUser.role === 'super_admin'
  } : null) || (tenantId ? {
    id: 'sb-' + (tenantId || 'user'),
    username: 'Business Admin',
    email: 'tenant@business.com',
    password: '',
    role: (tenantRole === 'tenant_super_admin' || tenantRole === 'main_super_admin') ? 'admin' : 'user' as any,
    is_super_admin: tenantRole === 'main_super_admin'
  } : null);

  const isAdmin = effectiveUser?.role === 'admin' || tenantRole === 'tenant_super_admin' || tenantRole === 'main_super_admin';

  // Function to refresh user data from database
  const refreshUserData = async () => {
    if (!currentUser?.id) return;

    try {
      console.log('Refreshing user data for ID:', currentUser.id);
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Error refreshing user data:', error);
        return;
      }

      if (userData) {
        const updatedUser: User = {
          id: userData.id,
          username: userData.username,
          password: userData.password_hash,
          role: userData.role as 'admin' | 'user',
          email: userData.email,
          profile_picture_url: userData.profile_picture_url
        };

        console.log('User data refreshed:', updatedUser);
        setCurrentUser(updatedUser);

        // Update session storage with new user data
        localStorage.setItem('lighthouse-current-user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error in refreshUserData:', error);
    }
  };

  const value = {
    currentUser: effectiveUser,
    login,
    logout,
    isAdmin,
    isLoggingOut,
    isInitialized,
    isLoading: false,
    logAdminAction,
    systemSettings,
    updateSystemSettings,
    notifications,
    addNotification,
    deleteNotification,
    refreshUserData,
  };

  // Don't render children until auth is initialized to prevent flash of login screen
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-slate-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export User and AdminLog types for backward compatibility
export type { User, AdminLog } from '@/types/auth';
