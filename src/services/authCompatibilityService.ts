// Authentication Compatibility Service
// This service bridges the legacy authentication system with the new multi-tenant system

import { supabase } from '@/integrations/supabase/client';
import { MultiTenantUser, UserRole } from '@/types/multiTenant';
import { User } from '@/types/auth';

export class AuthCompatibilityService {
  
  /**
   * Migrate legacy user to multi-tenant system
   * This function checks if a legacy user exists and creates appropriate multi-tenant records
   */
  static async migrateLegacyUser(legacyUser: User): Promise<MultiTenantUser | null> {
    try {
      console.log('🔄 Migrating legacy user to multi-tenant system:', legacyUser.username);

      // Check if user already exists in Supabase Auth
      const { data: authUser } = await supabase.auth.getUser();
      
      if (!authUser.user) {
        console.log('❌ No Supabase Auth user found, cannot migrate');
        return null;
      }

      // Determine the appropriate role mapping
      const newRole: UserRole = legacyUser.role === 'admin' ? 'admin' : 'user';

      // Create multi-tenant user object
      const multiTenantUser: MultiTenantUser = {
        id: authUser.user.id,
        email: authUser.user.email,
        user_metadata: {
          user_role: newRole,
          username: legacyUser.username,
          migrated_from_legacy: true,
          legacy_user_id: legacyUser.id,
          display_name: legacyUser.username
        },
        aud: authUser.user.aud,
        role: authUser.user.role || 'authenticated',
        created_at: authUser.user.created_at,
        updated_at: authUser.user.updated_at || authUser.user.created_at
      };

      console.log('✅ Legacy user migrated to multi-tenant system');
      return multiTenantUser;

    } catch (error) {
      console.error('❌ Error migrating legacy user:', error);
      return null;
    }
  }

  /**
   * Check if user should use legacy system
   * Returns true if user has legacy data and hasn't been migrated to multi-tenant
   */
  static async shouldUseLegacySystem(user: MultiTenantUser): Promise<boolean> {
    try {
      // Check if user has multi-tenant role
      const role = user.user_metadata.user_role;
      
      // If user has legacy roles (admin/user) and no company assignment, use legacy system
      if ((role === 'admin' || role === 'user') && !user.user_metadata.company_id) {
        console.log('👴 User should use legacy system:', role);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking legacy system usage:', error);
      return false;
    }
  }

  /**
   * Get legacy user data from the old users table
   */
  static async getLegacyUserData(authUserId: string): Promise<User | null> {
    try {
      const { data: legacyUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .single();

      if (error) {
        console.log('No legacy user data found');
        return null;
      }

      if (legacyUser) {
        return {
          id: legacyUser.id,
          username: legacyUser.username,
          password: legacyUser.password_hash,
          role: legacyUser.role as 'admin' | 'user',
          email: legacyUser.email,
          profile_picture_url: legacyUser.profile_picture_url
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching legacy user data:', error);
      return null;
    }
  }

  /**
   * Create Supabase Auth user for legacy user
   * This is used when a legacy user needs to be migrated to the new system
   */
  static async createAuthUserForLegacy(legacyUser: User, password: string): Promise<{ user: any; error: string | null }> {
    try {
      // Create Supabase Auth user
      const { data, error } = await supabase.auth.signUp({
        email: legacyUser.email || `${legacyUser.username}@lighthouse.local`,
        password: password,
        options: {
          data: {
            user_role: legacyUser.role,
            username: legacyUser.username,
            migrated_from_legacy: true,
            legacy_user_id: legacyUser.id
          }
        }
      });

      if (error) {
        return { user: null, error: error.message };
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error creating auth user for legacy:', error);
      return { user: null, error: 'Failed to create auth user' };
    }
  }

  /**
   * Sync legacy transactions to company transactions
   * This migrates existing transactions to the new multi-tenant structure
   */
  static async syncLegacyTransactions(legacyUserId: string, companyId: string): Promise<void> {
    try {
      console.log('🔄 Syncing legacy transactions to company transactions...');

      // Get legacy transactions
      const { data: legacyTransactions, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', legacyUserId);

      if (fetchError) {
        console.error('Error fetching legacy transactions:', fetchError);
        return;
      }

      if (!legacyTransactions || legacyTransactions.length === 0) {
        console.log('No legacy transactions to sync');
        return;
      }

      // Get company user record
      const { data: companyUser } = await supabase
        .from('mt_company_users')
        .select('id')
        .eq('auth_user_id', legacyUserId)
        .eq('company_id', companyId)
        .single();

      if (!companyUser) {
        console.error('Company user record not found for transaction sync');
        return;
      }

      // Convert and insert legacy transactions
      const companyTransactions = legacyTransactions.map(transaction => ({
        company_id: companyId,
        user_id: companyUser.id,
        date: transaction.date,
        time: transaction.time,
        type: transaction.type,
        amount: transaction.amount,
        category_name: transaction.category_name,
        customer_name: transaction.customer_name,
        number_of_pictures: transaction.number_of_pictures,
        whatsapp_number: transaction.whatsapp_number,
        details: transaction.details,
        added_by: transaction.added_by,
        created_at: transaction.created_at
      }));

      const { error: insertError } = await supabase
        .from('company_transactions')
        .insert(companyTransactions);

      if (insertError) {
        console.error('Error inserting company transactions:', insertError);
        return;
      }

      console.log(`✅ Synced ${companyTransactions.length} legacy transactions to company transactions`);

    } catch (error) {
      console.error('Error syncing legacy transactions:', error);
    }
  }

  /**
   * Check if legacy data migration is needed
   */
  static async needsLegacyMigration(authUserId: string): Promise<boolean> {
    try {
      // Check if user has legacy data but no multi-tenant records
      const legacyUser = await this.getLegacyUserData(authUserId);
      
      if (!legacyUser) {
        return false;
      }

      // Check if user already has multi-tenant records
      const { data: companyAdmin } = await supabase
        .from('mt_company_admins')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single();

      const { data: companyUser } = await supabase
        .from('mt_company_users')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single();

      // If user has legacy data but no multi-tenant records, migration is needed
      return !companyAdmin && !companyUser;

    } catch (error) {
      console.error('Error checking migration needs:', error);
      return false;
    }
  }

  /**
   * Perform automatic migration for legacy users
   * This assigns legacy users to the default Lighthouse Media company
   */
  static async performAutoMigration(authUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Performing automatic migration for user:', authUserId);

      const legacyUser = await this.getLegacyUserData(authUserId);
      if (!legacyUser) {
        return { success: false, error: 'No legacy user data found' };
      }

      // Get the default Lighthouse Media company
      const { data: defaultCompany } = await supabase
        .from('mt_companies')
        .select('id')
        .eq('name', 'lighthouse-media')
        .single();

      if (!defaultCompany) {
        return { success: false, error: 'Default company not found' };
      }

      // Assign user to default company based on their legacy role
      if (legacyUser.role === 'admin') {
        // Create company admin record
        const { error: adminError } = await supabase
          .from('mt_company_admins')
          .insert({
            auth_user_id: authUserId,
            company_id: defaultCompany.id,
            permissions: {
              manage_users: true,
              manage_transactions: true,
              view_reports: true,
              manage_categories: true,
              manage_notifications: true,
              export_data: true
            }
          });

        if (adminError) {
          return { success: false, error: adminError.message };
        }

        console.log('✅ Legacy admin migrated to company admin');
      } else {
        // Create company user record
        const { error: userError } = await supabase
          .from('mt_company_users')
          .insert({
            auth_user_id: authUserId,
            company_id: defaultCompany.id,
            user_metadata: {
              can_create_transactions: true,
              can_edit_own_transactions: false,
              can_view_all_transactions: false
            }
          });

        if (userError) {
          return { success: false, error: userError.message };
        }

        console.log('✅ Legacy user migrated to company user');
      }

      // DISABLED: Sync legacy transactions to prevent duplicate transaction issues
      // await this.syncLegacyTransactions(authUserId, defaultCompany.id);

      return { success: true };

    } catch (error) {
      console.error('Error performing auto migration:', error);
      return { success: false, error: 'Migration failed' };
    }
  }

  /**
   * Get user's effective role considering both legacy and multi-tenant systems
   */
  static getEffectiveUserRole(user: MultiTenantUser): UserRole {
    // Check if user has multi-tenant role
    if (user.user_metadata.user_role) {
      return user.user_metadata.user_role;
    }

    // Fallback to legacy role detection
    if (user.user_metadata.migrated_from_legacy) {
      // Check legacy user data if available
      return 'user'; // Default fallback
    }

    return 'user';
  }
}
