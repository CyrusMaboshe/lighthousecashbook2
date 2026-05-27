// Separate Multi-Tenant Authentication Service
// This is completely separate from the existing authentication system
// It replicates the exact same functionality but for multi-tenant companies

import { supabase } from '@/integrations/supabase/client';

// Interfaces that replicate your existing system structure
export interface MTSuperAdmin {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface MTCompany {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  logo_url?: string;
  settings: MTCompanySettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MTCompanySettings {
  show_full_balance_to_users: boolean;
  current_visible_month: number;
  current_visible_year: number;
  allow_user_transaction_creation: boolean;
  allow_user_transaction_editing: boolean;
  require_receipt_printing: boolean;
  // Branding settings
  business_type?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  business_icon?: string;
  custom_header_text?: string;
  show_business_metrics?: boolean;
  metric_name?: string;
  metric_icon?: string;
}

export interface MTCompanyAdmin {
  id: string;
  company_id: string;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company?: MTCompany;
}

export interface MTCompanyUser {
  id: string;
  company_id: string;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company?: MTCompany;
}

export interface MTTransaction {
  id: string;
  company_id: string;
  date: string;
  time: string;
  type: 'cash-in' | 'cash-out';
  amount: number;
  category_name: string;
  customer_name: string;
  number_of_pictures: number;
  whatsapp_number?: string;
  details?: string;
  added_by: string;
  created_at: string;
  updated_at: string;
}

export interface MTCategory {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface MTNotification {
  id: string;
  company_id: string;
  title: string;
  message: string;
  priority: string;
  created_by: string;
  is_read: boolean;
  created_at: string;
}

export interface MTMessage {
  id: string;
  company_id: string;
  conversation_id: string;
  sender: string;
  sender_role: 'admin' | 'user';
  message: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

export type MTUserRole = 'super_admin' | 'company_admin' | 'company_user';

export interface MTCurrentUser {
  id: string;
  email: string;
  username?: string;
  role: MTUserRole;
  company_id?: string;
  company?: MTCompany;
  password_hash?: string;
  created_at: string;
  updated_at: string;
}

export class SeparateMultiTenantAuth {

  /**
   * Create the first super admin (completely separate from existing system)
   */
  static async createSuperAdmin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Creating MT super admin:', email);

      // Simple password hashing (in production, use proper bcrypt)
      const passwordHash = btoa(password); // Base64 encoding for demo

      // Create super admin record in separate table
      const { data, error: insertError } = await supabase
        .from('mt_super_admins')
        .insert({
          email: email,
          password_hash: passwordHash
        })
        .select()
        .single();

      if (insertError) {
        console.error('Super admin insert error:', insertError);
        if (insertError.code === '23505') { // Unique constraint violation
          return { success: false, error: 'Super admin with this email already exists' };
        }
        return { success: false, error: 'Failed to create super admin' };
      }

      console.log('✅ MT Super admin created successfully');
      return { success: true };

    } catch (error) {
      console.error('Super admin creation error:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Sign in to multi-tenant system (completely separate authentication)
   */
  static async signIn(email: string, password: string): Promise<{ user: MTCurrentUser | null; error?: string }> {
    try {
      console.log('🔄 MT sign in attempt:', email);

      const passwordHash = btoa(password); // Base64 encoding for demo
      console.log('🔍 Password hash:', passwordHash);

      // Try super admin first with multiple password formats for compatibility
      console.log('🔍 Checking super admins table...');
      const { data: superAdmins, error: superAdminError } = await supabase
        .from('mt_super_admins')
        .select('*')
        .eq('email', email);

      let superAdmin = null;
      if (superAdmins && superAdmins.length > 0) {
        // Check multiple password formats for compatibility
        superAdmin = superAdmins.find(admin =>
          admin.password_hash === passwordHash ||
          admin.password_hash === password ||
          admin.password_hash === btoa(password)
        );
      }

      console.log('🔍 Super admin result:', { superAdmin, superAdminError });

      if (superAdmin) {
        console.log('✅ MT Super admin sign in successful');
        return {
          user: {
            id: superAdmin.id,
            email: superAdmin.email,
            role: 'super_admin',
            password_hash: superAdmin.password_hash,
            created_at: superAdmin.created_at,
            updated_at: superAdmin.updated_at
          }
        };
      }

      // Try company admin with flexible password matching
      console.log('🔍 Checking company admins table...');
      console.log('🔍 Looking for email:', email, 'with hash:', passwordHash);

      const { data: companyAdmins, error: adminError } = await supabase
        .from('mt_company_admins')
        .select(`
          *,
          company:mt_companies(*)
        `)
        .eq('email', email)
        .eq('is_active', true);

      let companyAdmin = null;
      if (companyAdmins && companyAdmins.length > 0) {
        // Check multiple password formats for compatibility
        companyAdmin = companyAdmins.find(admin =>
          admin.password_hash === passwordHash ||
          admin.password_hash === password ||
          admin.password_hash === btoa(password)
        );
      }

      console.log('🔍 Company admin result:', { companyAdmin, adminError });

      // If the join syntax doesn't work, try a simpler approach
      if (adminError && !companyAdmin) {
        console.log('🔍 Trying simpler query without join...');
        const { data: simpleAdmin, error: simpleError } = await supabase
          .from('mt_company_admins')
          .select('*')
          .eq('email', email)
          .eq('password_hash', passwordHash)
          .eq('is_active', true)
          .single();

        console.log('🔍 Simple admin result:', { simpleAdmin, simpleError });

        if (simpleAdmin && !simpleError) {
          // Get company separately
          const { data: company } = await supabase
            .from('mt_companies')
            .select('*')
            .eq('id', simpleAdmin.company_id)
            .single();

          console.log('✅ MT Company admin sign in successful (simple query)');
          return {
            user: {
              id: simpleAdmin.id,
              email: simpleAdmin.email,
              username: simpleAdmin.username,
              role: 'company_admin',
              company_id: simpleAdmin.company_id,
              company: company,
              password_hash: simpleAdmin.password_hash,
              created_at: simpleAdmin.created_at,
              updated_at: simpleAdmin.updated_at
            }
          };
        }
      }

      if (companyAdmin && !adminError) {
        // ── Subscription / access check ──────────────────────────────────────
        const { data: subCheck } = await supabase.rpc('check_company_subscription_access', {
          p_company_id: companyAdmin.company_id
        });
        if (subCheck && subCheck.has_access === false) {
          const reasonMap: Record<string, string> = {
            suspended: 'Your company account has been suspended. Please contact support.',
            cancelled: 'Your company subscription has been cancelled. Please contact support.',
            subscription_expired: `Your company subscription expired on ${subCheck.expired_on || 'an earlier date'}. Please renew to continue.`
          };
          const msg = reasonMap[subCheck.reason] || 'Access denied. Please contact your administrator.';
          console.warn('⛔ Company admin login blocked:', subCheck.reason);
          return { user: null, error: msg };
        }
        // ────────────────────────────────────────────────────────────────────
        console.log('✅ MT Company admin sign in successful');
        return {
          user: {
            id: companyAdmin.id,
            email: companyAdmin.email,
            username: companyAdmin.username,
            role: 'company_admin',
            company_id: companyAdmin.company_id,
            company: companyAdmin.company,
            password_hash: companyAdmin.password_hash,
            created_at: companyAdmin.created_at,
            updated_at: companyAdmin.updated_at
          }
        };
      }

      // Try company user with flexible password matching
      console.log('🔍 Checking company users table...');
      const { data: companyUsers, error: userError } = await supabase
        .from('mt_company_users')
        .select(`
          *,
          company:mt_companies(*)
        `)
        .eq('email', email)
        .eq('is_active', true);

      let companyUser = null;
      if (companyUsers && companyUsers.length > 0) {
        // Check multiple password formats for compatibility
        companyUser = companyUsers.find(user =>
          user.password_hash === passwordHash ||
          user.password_hash === password ||
          user.password_hash === btoa(password)
        );
      }

      console.log('🔍 Company user result:', { companyUser, userError });

      if (companyUser && !userError) {
        // ── Subscription / access check ──────────────────────────────────────
        const { data: subCheck } = await supabase.rpc('check_company_subscription_access', {
          p_company_id: companyUser.company_id
        });
        if (subCheck && subCheck.has_access === false) {
          const reasonMap: Record<string, string> = {
            suspended: 'Your company account has been suspended. Please contact support.',
            cancelled: 'Your company subscription has been cancelled. Please contact support.',
            subscription_expired: `Your company subscription expired on ${subCheck.expired_on || 'an earlier date'}. Please renew to continue.`
          };
          const msg = reasonMap[subCheck.reason] || 'Access denied. Please contact your administrator.';
          console.warn('⛔ Company user login blocked:', subCheck.reason);
          return { user: null, error: msg };
        }
        // ────────────────────────────────────────────────────────────────────
        console.log('✅ MT Company user sign in successful');
        return {
          user: {
            id: companyUser.id,
            email: companyUser.email,
            username: companyUser.username,
            role: 'company_user',
            company_id: companyUser.company_id,
            company: companyUser.company,
            password_hash: companyUser.password_hash,
            created_at: companyUser.created_at,
            updated_at: companyUser.updated_at
          }
        };
      }

      console.log('❌ MT sign in failed - no matching user found');
      return { user: null, error: 'Invalid email or password' };

    } catch (error) {
      console.error('MT sign in error:', error);
      return { user: null, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Create a new company (super admin only)
   */
  static async createCompany(name: string, displayName: string, description?: string): Promise<{ company: MTCompany | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('mt_companies')
        .insert({
          name: name,
          display_name: displayName,
          description: description
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { company: null, error: 'Company name already exists' };
        }
        return { company: null, error: 'Failed to create company' };
      }

      return { company: data };
    } catch (error) {
      console.error('Create company error:', error);
      return { company: null, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Delete a company and all its related data (super admin only)
   */
  static async deleteCompany(companyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete all related data in the correct order (foreign key constraints)

      // 1. Delete company transactions
      const { error: transactionsError } = await supabase
        .from('mt_company_transactions')
        .delete()
        .eq('company_id', companyId);

      if (transactionsError) {
        return { success: false, error: `Failed to delete transactions: ${transactionsError.message}` };
      }

      // 2. Delete company users
      const { error: usersError } = await supabase
        .from('mt_company_users')
        .delete()
        .eq('company_id', companyId);

      if (usersError) {
        return { success: false, error: `Failed to delete users: ${usersError.message}` };
      }

      // 3. Delete company admins
      const { error: adminsError } = await supabase
        .from('mt_company_admins')
        .delete()
        .eq('company_id', companyId);

      if (adminsError) {
        return { success: false, error: `Failed to delete admins: ${adminsError.message}` };
      }

      // 4. Delete company categories (if they exist)
      const { error: categoriesError } = await supabase
        .from('mt_company_categories')
        .delete()
        .eq('company_id', companyId);

      // Don't return error if categories table doesn't exist or no categories found

      // 5. Finally delete the company itself
      const { error: companyError } = await supabase
        .from('mt_companies')
        .delete()
        .eq('id', companyId);

      if (companyError) {
        return { success: false, error: `Failed to delete company: ${companyError.message}` };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete company error:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Create company admin
   */
  static async createCompanyAdmin(companyId: string, username: string, email: string, password: string): Promise<{ admin: MTCompanyAdmin | null; error?: string }> {
    try {
      const passwordHash = btoa(password);

      const { data, error } = await supabase
        .from('mt_company_admins')
        .insert({
          company_id: companyId,
          username: username,
          email: email,
          password_hash: passwordHash,
          role: 'admin'
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { admin: null, error: 'Username or email already exists for this company' };
        }
        return { admin: null, error: 'Failed to create company admin' };
      }

      return { admin: data };
    } catch (error) {
      console.error('Create company admin error:', error);
      return { admin: null, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Create company user
   */
  static async createCompanyUser(companyId: string, username: string, email: string, password: string): Promise<{ user: MTCompanyUser | null; error?: string }> {
    try {
      const passwordHash = btoa(password);

      const { data, error } = await supabase
        .from('mt_company_users')
        .insert({
          company_id: companyId,
          username: username,
          email: email,
          password_hash: passwordHash,
          role: 'user'
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { user: null, error: 'Username or email already exists for this company' };
        }
        return { user: null, error: 'Failed to create company user' };
      }

      return { user: data };
    } catch (error) {
      console.error('Create company user error:', error);
      return { user: null, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Get all companies (super admin only)
   */
  static async getAllCompanies(): Promise<{ companies: MTCompany[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('mt_companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { companies: [], error: 'Failed to fetch companies' };
      }

      return { companies: data || [] };
    } catch (error) {
      console.error('Get companies error:', error);
      return { companies: [], error: 'Unexpected error occurred' };
    }
  }

  /**
   * Get company by ID (for refreshing company data)
   */
  static async getCompanyById(companyId: string): Promise<{ data: MTCompany | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('mt_companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) {
        return { data: null, error: 'Failed to fetch company' };
      }

      return { data };
    } catch (error) {
      console.error('Get company by ID error:', error);
      return { data: null, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Utility methods
   */
  static isSuperAdmin(user: MTCurrentUser | null): boolean {
    return user?.role === 'super_admin';
  }

  static isCompanyAdmin(user: MTCurrentUser | null): boolean {
    return user?.role === 'company_admin';
  }

  static isCompanyUser(user: MTCurrentUser | null): boolean {
    return user?.role === 'company_user';
  }
}
