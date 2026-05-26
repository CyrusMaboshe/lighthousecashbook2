// Separate Multi-Tenant Authentication Hook
// This is completely separate from the existing useAuth hook
// It replicates the exact same functionality but for multi-tenant companies

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  SeparateMultiTenantAuth,
  MTCurrentUser,
  MTUserRole,
  MTCompany,
  MTCompanyAdmin,
  MTCompanyUser
} from '@/services/separateMultiTenantAuth';

interface SeparateMultiTenantAuthContextType {
  currentUser: MTCurrentUser | null;
  userRole: MTUserRole | null;
  currentCompany: MTCompany | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Authentication methods
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  createSuperAdmin: (email: string, password: string) => Promise<boolean>;

  // Super admin methods
  createCompany: (name: string, displayName: string, description?: string) => Promise<MTCompany | null>;
  createCompanyAdmin: (companyId: string, username: string, email: string, password: string) => Promise<MTCompanyAdmin | null>;
  createCompanyUser: (companyId: string, username: string, email: string, password: string) => Promise<MTCompanyUser | null>;
  getAllCompanies: () => Promise<MTCompany[]>;

  // Utility methods
  isSuperAdmin: () => boolean;
  isCompanyAdmin: () => boolean;
  isCompanyUser: () => boolean;
  refreshCompanyData: () => Promise<void>;
}

const SeparateMultiTenantAuthContext = createContext<SeparateMultiTenantAuthContextType | undefined>(undefined);

interface SeparateMultiTenantAuthProviderProps {
  children: ReactNode;
}

export function SeparateMultiTenantAuthProvider({ children }: SeparateMultiTenantAuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<MTCurrentUser | null>(null);
  const [currentCompany, setCurrentCompany] = useState<MTCompany | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize authentication state from storage
  useEffect(() => {
    const initializeAuth = () => {
      console.log('🔄 Initializing MT authentication...');
      try {
        const storedUser = localStorage.getItem('mt_user_session');
        const sessionExpiry = localStorage.getItem('mt_session_expiry');

        if (storedUser && sessionExpiry) {
          const expiryTime = parseInt(sessionExpiry);
          const currentTime = new Date().getTime();

          if (currentTime < expiryTime) {
            const user = JSON.parse(storedUser);
            console.log('🔍 Restoring MT user session:', user);
            setCurrentUser(user);
            if (user.company) {
              setCurrentCompany(user.company);
            }
            console.log('✅ MT session restored successfully');
          } else {
            console.log('⏰ MT session expired, clearing storage');
            localStorage.removeItem('mt_user_session');
            localStorage.removeItem('mt_session_expiry');
          }
        } else {
          console.log('ℹ️ No MT session found');
        }
      } catch (error) {
        console.error('Error restoring MT session:', error);
        localStorage.removeItem('mt_user_session');
        localStorage.removeItem('mt_session_expiry');
      }
      setIsInitialized(true);
    };

    initializeAuth();
  }, []);

  // No automatic initialization - this is a separate system

  // Authentication methods
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { user, error } = await SeparateMultiTenantAuth.signIn(email, password);

      if (error) {
        console.error('MT sign in error:', error);
        return false;
      }

      if (user) {
        console.log('🔍 Setting MT user state:', user);
        setCurrentUser(user);
        if (user.company) {
          setCurrentCompany(user.company);
          console.log('🔍 Setting company state:', user.company);
        }

        // Persist session to localStorage
        try {
          localStorage.setItem('mt_user_session', JSON.stringify(user));
          // Set session to expire in 7 days
          const expiryTime = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
          localStorage.setItem('mt_session_expiry', expiryTime.toString());
          console.log('✅ MT session stored with expiry');
        } catch (error) {
          console.error('Error storing MT session:', error);
        }

        console.log('✅ MT user signed in:', user.role, 'Company:', user.company?.display_name);
        return true;
      }

      return false;
    } catch (error) {
      console.error('MT sign in error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = (): void => {
    setCurrentUser(null);
    setCurrentCompany(null);
    console.log('✅ MT user signed out');
    // Clear session storage
    localStorage.removeItem('mt_user_session');
    localStorage.removeItem('mt_session_expiry');
    sessionStorage.removeItem('mt_user_session');
  };

  const createSuperAdmin = async (email: string, password: string): Promise<boolean> => {
    try {
      const { success, error } = await SeparateMultiTenantAuth.createSuperAdmin(email, password);

      if (error) {
        console.error('Super admin creation error:', error);
        return false;
      }

      return success;
    } catch (error) {
      console.error('Super admin creation error:', error);
      return false;
    }
  };

  // Super admin methods
  const createCompany = async (name: string, displayName: string, description?: string): Promise<MTCompany | null> => {
    try {
      const { company, error } = await SeparateMultiTenantAuth.createCompany(name, displayName, description);

      if (error) {
        console.error('Create company error:', error);
        return null;
      }

      return company;
    } catch (error) {
      console.error('Create company error:', error);
      return null;
    }
  };

  const createCompanyAdmin = async (companyId: string, username: string, email: string, password: string): Promise<MTCompanyAdmin | null> => {
    try {
      const { admin, error } = await SeparateMultiTenantAuth.createCompanyAdmin(companyId, username, email, password);

      if (error) {
        console.error('Create company admin error:', error);
        return null;
      }

      return admin;
    } catch (error) {
      console.error('Create company admin error:', error);
      return null;
    }
  };

  const createCompanyUser = async (companyId: string, username: string, email: string, password: string): Promise<MTCompanyUser | null> => {
    try {
      const { user, error } = await SeparateMultiTenantAuth.createCompanyUser(companyId, username, email, password);

      if (error) {
        console.error('Create company user error:', error);
        return null;
      }

      return user;
    } catch (error) {
      console.error('Create company user error:', error);
      return null;
    }
  };

  const getAllCompanies = async (): Promise<MTCompany[]> => {
    try {
      const { companies, error } = await SeparateMultiTenantAuth.getAllCompanies();

      if (error) {
        console.error('Get companies error:', error);
        return [];
      }

      return companies;
    } catch (error) {
      console.error('Get companies error:', error);
      return [];
    }
  };

  // Utility methods
  const isSuperAdmin = (): boolean => {
    return SeparateMultiTenantAuth.isSuperAdmin(currentUser);
  };

  const isCompanyAdmin = (): boolean => {
    return SeparateMultiTenantAuth.isCompanyAdmin(currentUser);
  };

  const isCompanyUser = (): boolean => {
    return SeparateMultiTenantAuth.isCompanyUser(currentUser);
  };

  const refreshCompanyData = async (): Promise<void> => {
    if (!currentUser?.company?.id) return;

    try {
      console.log('🔄 Refreshing company data...');
      const { data, error } = await SeparateMultiTenantAuth.getCompanyById(currentUser.company.id);

      if (error) {
        console.error('Error refreshing company data:', error);
        return;
      }

      if (data) {
        console.log('✅ Company data refreshed:', data);
        setCurrentCompany(data);

        // Update the stored user session with fresh company data
        const updatedUser = { ...currentUser, company: data };
        setCurrentUser(updatedUser);
        localStorage.setItem('mt_user_session', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error refreshing company data:', error);
    }
  };

  const userRole: MTUserRole | null = currentUser?.role || null;

  const contextValue: SeparateMultiTenantAuthContextType = {
    currentUser,
    userRole,
    currentCompany,
    isLoading,
    isInitialized,
    signIn,
    signOut,
    createSuperAdmin,
    createCompany,
    createCompanyAdmin,
    createCompanyUser,
    getAllCompanies,
    isSuperAdmin,
    isCompanyAdmin,
    isCompanyUser,
    refreshCompanyData
  };

  return (
    <SeparateMultiTenantAuthContext.Provider value={contextValue}>
      {children}
    </SeparateMultiTenantAuthContext.Provider>
  );
}

// Hook to use separate multi-tenant authentication
export function useSeparateMultiTenantAuth(): SeparateMultiTenantAuthContextType {
  const context = useContext(SeparateMultiTenantAuthContext);
  
  if (context === undefined) {
    throw new Error('useSeparateMultiTenantAuth must be used within a SeparateMultiTenantAuthProvider');
  }
  
  return context;
}

// Export the hook with a shorter name for convenience
export const useMultiTenantAuth = useSeparateMultiTenantAuth;
