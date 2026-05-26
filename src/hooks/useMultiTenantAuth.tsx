// Multi-Tenant Authentication Hook and Context
// This provides authentication state and methods for the multi-tenant system

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MultiTenantAuthService } from '@/services/multiTenantAuthService';
import { AuthCompatibilityService } from '@/services/authCompatibilityService';
import { 
  MultiTenantUser, 
  UserRole, 
  Company, 
  CompanyAdmin, 
  CompanyUser,
  MultiTenantAuthContextType,
  CompanyAdminPermissions,
  CompanyUserMetadata,
  CreateCompanyRequest
} from '@/types/multiTenant';

const MultiTenantAuthContext = createContext<MultiTenantAuthContextType | undefined>(undefined);

interface MultiTenantAuthProviderProps {
  children: ReactNode;
}

export function MultiTenantAuthProvider({ children }: MultiTenantAuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<MultiTenantUser | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize authentication state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing multi-tenant authentication...');
        
        // Get current user from Supabase
        const user = await MultiTenantAuthService.getCurrentUser();

        if (mounted && user) {
          // Check if user needs legacy migration
          const needsMigration = await AuthCompatibilityService.needsLegacyMigration(user.id);

          if (needsMigration) {
            console.log('🔄 User needs legacy migration, performing auto-migration...');
            const migrationResult = await AuthCompatibilityService.performAutoMigration(user.id);

            if (migrationResult.success) {
              console.log('✅ Auto-migration completed successfully');
              // Refresh user data after migration
              const updatedUser = await MultiTenantAuthService.getCurrentUser();
              setCurrentUser(updatedUser);
              if (updatedUser) {
                await setUserCompany(updatedUser);
              }
            } else {
              console.error('❌ Auto-migration failed:', migrationResult.error);
              setCurrentUser(user);
              await setUserCompany(user);
            }
          } else {
            setCurrentUser(user);
            await setUserCompany(user);
          }
        } else if (mounted) {
          setCurrentUser(user);
          
          setIsLoading(false);
          setIsInitialized(true);
          console.log('✅ Multi-tenant auth initialized:', { 
            user: user?.email, 
            role: user?.user_metadata.user_role,
            company: user?.user_metadata.company_name
          });
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        const user = await MultiTenantAuthService.enrichUserWithTenantData(session.user);
        if (mounted) {
          setCurrentUser(user);
          await setUserCompany(user);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setCurrentUser(null);
          setCurrentCompany(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Set current company based on user role and data
  const setUserCompany = async (user: MultiTenantUser) => {
    try {
      if (user.user_metadata.user_role === 'super_admin') {
        // Super admins don't have a default company
        setCurrentCompany(null);
      } else if (user.company_admin?.company) {
        setCurrentCompany(user.company_admin.company);
      } else if (user.company_user?.company) {
        setCurrentCompany(user.company_user.company);
      } else if (user.user_metadata.company_id) {
        // Fetch company data if not already loaded
        const { data: company } = await supabase
          .from('mt_companies')
          .select('*')
          .eq('id', user.user_metadata.company_id)
          .single();
        
        if (company) {
          setCurrentCompany(company);
        }
      }
    } catch (error) {
      console.error('Error setting user company:', error);
    }
  };

  // Authentication methods
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { user, error } = await MultiTenantAuthService.signIn(email, password);
      
      if (error) {
        console.error('Sign in error:', error);
        return false;
      }

      if (user) {
        setCurrentUser(user);
        await setUserCompany(user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Sign in error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await MultiTenantAuthService.signOut();
      setCurrentUser(null);
      setCurrentCompany(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Super admin methods
  const createCompany = async (companyData: CreateCompanyRequest): Promise<Company> => {
    const { company, error } = await MultiTenantAuthService.createCompany(companyData);
    
    if (error) {
      throw new Error(error);
    }

    if (!company) {
      throw new Error('Failed to create company');
    }

    return company;
  };

  const assignCompanyAdmin = async (
    userId: string, 
    companyId: string, 
    permissions?: CompanyAdminPermissions
  ): Promise<CompanyAdmin> => {
    const { admin, error } = await MultiTenantAuthService.assignCompanyAdmin(userId, companyId, permissions);
    
    if (error) {
      throw new Error(error);
    }

    if (!admin) {
      throw new Error('Failed to assign company admin');
    }

    return admin;
  };

  const assignCompanyUser = async (
    userId: string, 
    companyId: string, 
    metadata?: CompanyUserMetadata
  ): Promise<CompanyUser> => {
    const { user, error } = await MultiTenantAuthService.assignCompanyUser(userId, companyId, metadata);
    
    if (error) {
      throw new Error(error);
    }

    if (!user) {
      throw new Error('Failed to assign company user');
    }

    return user;
  };

  // Company management
  const updateCompanySettings = async (companyId: string, settings: any): Promise<void> => {
    try {
      const { error } = await supabase
        .from('mt_companies')
        .update({ settings })
        .eq('id', companyId);

      if (error) {
        throw new Error(error.message);
      }

      // Update current company if it's the one being updated
      if (currentCompany?.id === companyId) {
        setCurrentCompany({ ...currentCompany, settings: { ...currentCompany.settings, ...settings } });
      }
    } catch (error) {
      console.error('Update company settings error:', error);
      throw error;
    }
  };

  const switchCompany = async (companyId: string): Promise<void> => {
    try {
      // Only super admins can switch companies
      if (!isSuperAdmin()) {
        throw new Error('Only super admins can switch companies');
      }

      const { data: company } = await supabase
        .from('mt_companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (company) {
        setCurrentCompany(company);
      }
    } catch (error) {
      console.error('Switch company error:', error);
      throw error;
    }
  };

  // Utility methods
  const hasPermission = (permission: string): boolean => {
    return MultiTenantAuthService.hasPermission(currentUser, permission);
  };

  const isSuperAdmin = (): boolean => {
    return MultiTenantAuthService.isSuperAdmin(currentUser);
  };

  const isCompanyAdmin = (companyId?: string): boolean => {
    return MultiTenantAuthService.isCompanyAdmin(currentUser, companyId);
  };

  const isCompanyUser = (companyId?: string): boolean => {
    return MultiTenantAuthService.isCompanyUser(currentUser, companyId);
  };

  // Get user role
  const userRole: UserRole = currentUser?.user_metadata.user_role || 'user';

  const contextValue: any = {
    currentUser,
    userRole,
    currentCompany,
    isLoading,
    isInitialized,
    signIn,
    signOut,
    createCompany: createCompany as any,
    assignCompanyAdmin,
    assignCompanyUser,
    updateCompanySettings,
    switchCompany,
    hasPermission,
    isSuperAdmin,
    isCompanyAdmin,
    isCompanyUser,
    createSuperAdmin: async () => {}
  };

  return (
    <MultiTenantAuthContext.Provider value={contextValue}>
      {children}
    </MultiTenantAuthContext.Provider>
  );
}

// Hook to use multi-tenant authentication
export function useMultiTenantAuth(): MultiTenantAuthContextType {
  const context = useContext(MultiTenantAuthContext);
  
  if (context === undefined) {
    throw new Error('useMultiTenantAuth must be used within a MultiTenantAuthProvider');
  }
  
  return context;
}

// Higher-order component for role-based access
export function withRoleAccess<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: UserRole[]
) {
  return function RoleAccessComponent(props: P) {
    const { currentUser, userRole } = useMultiTenantAuth();
    
    if (!currentUser) {
      return <div>Please sign in to access this page.</div>;
    }
    
    if (!allowedRoles.includes(userRole)) {
      return <div>You don't have permission to access this page.</div>;
    }
    
    return <Component {...props} />;
  };
}

// Hook for role-based conditional rendering
export function useRoleAccess(allowedRoles: UserRole[]): boolean {
  const { currentUser, userRole } = useMultiTenantAuth();
  
  if (!currentUser) {
    return false;
  }
  
  return allowedRoles.includes(userRole);
}
