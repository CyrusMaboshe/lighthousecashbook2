// Multi-Tenant Authentication Service
// This service handles authentication with multi-tenant support

import { supabase } from '@/integrations/supabase/client';
import { 
  MultiTenantUser, 
  UserRole, 
  Company, 
  CompanyAdmin, 
  CompanyUser,
  CompanyAdminPermissions,
  CompanyUserMetadata,
  CreateCompanyRequest,
  AssignUserRequest
} from '@/types/multiTenant';

export class MultiTenantAuthService {
  
  // =====================================================
  // AUTHENTICATION METHODS
  // =====================================================

  /**
   * Sign in user with email and password
   * This method handles both Supabase Auth and legacy authentication
   */
  static async signIn(email: string, password: string): Promise<{ user: MultiTenantUser | null; error: string | null }> {
    try {
      console.log('🔄 Attempting Supabase Auth login for:', email);

      // First try Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (data.user && !error) {
        console.log('✅ Supabase Auth login successful');
        const multiTenantUser = await this.enrichUserWithTenantData(data.user);
        return { user: multiTenantUser, error: null };
      }

      console.log('⚠️ Supabase Auth failed, trying legacy authentication...');

      // If Supabase Auth fails, try legacy authentication
      const legacyResult = await this.tryLegacyAuthentication(email, password);
      if (legacyResult.user) {
        console.log('✅ Legacy authentication successful');
        return legacyResult;
      }

      // If both fail, return the original Supabase error
      return { user: null, error: error?.message || 'Authentication failed' };

    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, error: 'An unexpected error occurred during sign in' };
    }
  }

  /**
   * Try legacy authentication for users not yet migrated to Supabase Auth
   */
  private static async tryLegacyAuthentication(email: string, password: string): Promise<{ user: MultiTenantUser | null; error: string | null }> {
    try {
      console.log('🔄 Attempting legacy authentication...');

      // Check if user exists in legacy users table
      const { data: legacyUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (fetchError || !legacyUser) {
        console.log('❌ No legacy user found');
        return { user: null, error: 'User not found' };
      }

      // For now, we'll do a simple password check (in production, you'd want proper hashing)
      // This is a simplified check - you should implement proper password verification
      console.log('🔍 Checking password for user:', legacyUser.username);
      console.log('🔍 Stored password hash:', legacyUser.password_hash);
      console.log('🔍 Provided password:', password);

      const passwordMatch = legacyUser.password_hash === password ||
                           legacyUser.password_hash === btoa(password) ||
                           btoa(password) === legacyUser.password_hash;

      if (!passwordMatch) {
        console.log('❌ Legacy password verification failed');
        return { user: null, error: 'Invalid password' };
      }

      console.log('✅ Legacy user authenticated, creating session...');

      // Create a temporary multi-tenant user object for legacy users
      const multiTenantUser: MultiTenantUser = {
        id: legacyUser.id,
        email: legacyUser.email,
        user_metadata: {
          user_role: legacyUser.role as 'admin' | 'user',
          username: legacyUser.username,
          legacy_user: true,
          migrated_from_legacy: true
        },
        aud: 'authenticated',
        role: 'authenticated',
        created_at: legacyUser.created_at || new Date().toISOString(),
        updated_at: legacyUser.updated_at || new Date().toISOString()
      };

      // Store legacy session in localStorage for compatibility
      localStorage.setItem('lighthouse-current-user', JSON.stringify({
        id: legacyUser.id,
        username: legacyUser.username,
        password: legacyUser.password_hash,
        role: legacyUser.role,
        email: legacyUser.email,
        profile_picture_url: legacyUser.profile_picture_url
      }));

      return { user: multiTenantUser, error: null };

    } catch (error) {
      console.error('Legacy authentication error:', error);
      return { user: null, error: 'Legacy authentication failed' };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<{ error: string | null }> {
    try {
      // Sign out from Supabase Auth
      const { error } = await supabase.auth.signOut();

      // Also clear legacy session
      localStorage.removeItem('lighthouse-current-user');

      console.log('✅ User signed out successfully');
      return { error: error?.message || null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: 'An unexpected error occurred during sign out' };
    }
  }

  /**
   * Get current authenticated user with tenant data
   */
  static async getCurrentUser(): Promise<MultiTenantUser | null> {
    try {
      // First try to get Supabase Auth user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        return await this.enrichUserWithTenantData(user);
      }

      // If no Supabase user, check for legacy session
      const legacySession = localStorage.getItem('lighthouse-current-user');
      if (legacySession) {
        try {
          const legacyUser = JSON.parse(legacySession);
          console.log('🔄 Found legacy session for:', legacyUser.username);

          // Convert legacy user to multi-tenant format
          const multiTenantUser: MultiTenantUser = {
            id: legacyUser.id,
            email: legacyUser.email,
            user_metadata: {
              user_role: legacyUser.role as 'admin' | 'user',
              username: legacyUser.username,
              legacy_user: true,
              migrated_from_legacy: true
            },
            aud: 'authenticated',
            role: 'authenticated',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          return multiTenantUser;
        } catch (parseError) {
          console.error('Error parsing legacy session:', parseError);
          localStorage.removeItem('lighthouse-current-user');
        }
      }

      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Enrich Supabase user with multi-tenant data
   */
  static async enrichUserWithTenantData(user: any): Promise<MultiTenantUser> {
    const userRole = this.getUserRole(user);
    
    // Base multi-tenant user
    const multiTenantUser: MultiTenantUser = {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata || {},
      aud: user.aud,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    // Add role to metadata if not present
    if (!multiTenantUser.user_metadata.user_role) {
      multiTenantUser.user_metadata.user_role = userRole;
    }

    try {
      // For super admins, get all companies they can manage
      if (userRole === 'super_admin') {
        const { data: companies } = await supabase
          .from('mt_companies')
          .select('*')
          .eq('is_active', true)
          .order('display_name');

        multiTenantUser.companies = companies || [];
      }

      // For company admins, get their admin record and company
      if (userRole === 'company_admin') {
        const { data: adminRecord } = await supabase
          .from('mt_company_admins')
          .select(`
            *,
            company:mt_companies(*)
          `)
          .eq('auth_user_id', user.id)
          .eq('is_active', true)
          .single();

        if (adminRecord) {
          multiTenantUser.company_admin = adminRecord;
          if (adminRecord.company) {
            multiTenantUser.user_metadata.company_id = adminRecord.company.id;
            multiTenantUser.user_metadata.company_name = adminRecord.company.display_name;
          }
        }
      }

      // For company users, get their user record and company
      if (userRole === 'company_user') {
        const { data: userRecord } = await supabase
          .from('mt_company_users')
          .select(`
            *,
            company:mt_companies(*)
          `)
          .eq('auth_user_id', user.id)
          .eq('is_active', true)
          .single();

        if (userRecord) {
          multiTenantUser.company_user = userRecord;
          if (userRecord.company) {
            multiTenantUser.user_metadata.company_id = userRecord.company.id;
            multiTenantUser.user_metadata.company_name = userRecord.company.display_name;
          }
        }
      }

    } catch (error) {
      console.error('Error enriching user with tenant data:', error);
    }

    return multiTenantUser;
  }

  /**
   * Determine user role from user metadata or legacy data
   */
  private static getUserRole(user: any): UserRole {
    // Check user metadata first
    if (user.user_metadata?.user_role) {
      return user.user_metadata.user_role as UserRole;
    }

    // Check app metadata (set by admin)
    if (user.app_metadata?.user_role) {
      return user.app_metadata.user_role as UserRole;
    }

    // Legacy role detection - check if user exists in old users table
    // This would require a separate query, for now default to 'user'
    return 'user';
  }

  // =====================================================
  // SUPER ADMIN METHODS
  // =====================================================

  /**
   * Create a new company (Super Admin only)
   */
  static async createCompany(companyData: CreateCompanyRequest): Promise<{ company: Company | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('mt_companies')
        .insert({
          name: companyData.name,
          display_name: companyData.display_name,
          description: companyData.description,
          settings: companyData.settings || {
            show_full_balance_to_users: false,
            current_visible_month: new Date().getMonth(),
            current_visible_year: new Date().getFullYear(),
            allow_user_transaction_creation: true,
            allow_user_transaction_editing: false,
            require_receipt_printing: false
          }
        })
        .select()
        .single();

      if (error) {
        return { company: null, error: error.message };
      }

      return { company: data, error: null };
    } catch (error) {
      console.error('Create company error:', error);
      return { company: null, error: 'Failed to create company' };
    }
  }

  /**
   * Assign user as company admin
   */
  static async assignCompanyAdmin(
    authUserId: string, 
    companyId: string, 
    permissions?: CompanyAdminPermissions
  ): Promise<{ admin: CompanyAdmin | null; error: string | null }> {
    try {
      const defaultPermissions: CompanyAdminPermissions = {
        manage_users: true,
        manage_transactions: true,
        view_reports: true,
        manage_categories: true,
        manage_notifications: true,
        export_data: true
      };

      const { data, error } = await supabase
        .from('mt_company_admins')
        .upsert({
          auth_user_id: authUserId,
          company_id: companyId,
          permissions: permissions || defaultPermissions,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        return { admin: null, error: error.message };
      }

      // Update user metadata in Supabase Auth
      await this.updateUserMetadata(authUserId, {
        user_role: 'company_admin',
        company_id: companyId
      });

      return { admin: data, error: null };
    } catch (error) {
      console.error('Assign company admin error:', error);
      return { admin: null, error: 'Failed to assign company admin' };
    }
  }

  /**
   * Assign user as company user
   */
  static async assignCompanyUser(
    authUserId: string, 
    companyId: string, 
    metadata?: CompanyUserMetadata
  ): Promise<{ user: CompanyUser | null; error: string | null }> {
    try {
      const defaultMetadata: CompanyUserMetadata = {
        can_create_transactions: true,
        can_edit_own_transactions: false,
        can_view_all_transactions: false
      };

      const { data, error } = await supabase
        .from('mt_company_users')
        .upsert({
          auth_user_id: authUserId,
          company_id: companyId,
          user_metadata: metadata || defaultMetadata,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        return { user: null, error: error.message };
      }

      // Update user metadata in Supabase Auth
      await this.updateUserMetadata(authUserId, {
        user_role: 'company_user',
        company_id: companyId
      });

      return { user: data, error: null };
    } catch (error) {
      console.error('Assign company user error:', error);
      return { user: null, error: 'Failed to assign company user' };
    }
  }

  /**
   * Update user metadata in Supabase Auth
   */
  private static async updateUserMetadata(userId: string, metadata: Record<string, any>): Promise<void> {
    try {
      // This would typically be done via a Supabase Edge Function or Admin API
      // For now, we'll store it in our custom user metadata
      console.log('Would update user metadata:', { userId, metadata });
    } catch (error) {
      console.error('Update user metadata error:', error);
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Check if user has specific permission
   */
  static hasPermission(user: MultiTenantUser | null, permission: string): boolean {
    if (!user) return false;

    // Super admins have all permissions
    if (user.user_metadata.user_role === 'super_admin') {
      return true;
    }

    // Company admins check their permissions
    if (user.user_metadata.user_role === 'company_admin' && user.company_admin) {
      return user.company_admin.permissions[permission] === true;
    }

    // Company users have limited permissions
    if (user.user_metadata.user_role === 'company_user' && user.company_user) {
      // Define user permissions based on metadata
      const userPermissions = user.company_user.user_metadata;
      switch (permission) {
        case 'create_transactions':
          return userPermissions.can_create_transactions === true;
        case 'edit_own_transactions':
          return userPermissions.can_edit_own_transactions === true;
        case 'view_all_transactions':
          return userPermissions.can_view_all_transactions === true;
        default:
          return false;
      }
    }

    return false;
  }

  /**
   * Check if user is super admin
   */
  static isSuperAdmin(user: MultiTenantUser | null): boolean {
    return user?.user_metadata.user_role === 'super_admin';
  }

  /**
   * Check if user is company admin for specific company
   */
  static isCompanyAdmin(user: MultiTenantUser | null, companyId?: string): boolean {
    if (!user || user.user_metadata.user_role !== 'company_admin') {
      return false;
    }

    if (!companyId) {
      return !!user.company_admin;
    }

    return user.company_admin?.company_id === companyId;
  }

  /**
   * Check if user is company user for specific company
   */
  static isCompanyUser(user: MultiTenantUser | null, companyId?: string): boolean {
    if (!user || user.user_metadata.user_role !== 'company_user') {
      return false;
    }

    if (!companyId) {
      return !!user.company_user;
    }

    return user.company_user?.company_id === companyId;
  }
}
