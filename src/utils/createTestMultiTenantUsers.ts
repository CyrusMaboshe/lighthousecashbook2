/**
 * Create Test Multi-Tenant Users
 * This utility creates test users for the multi-tenant system
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Create a test super admin user
 */
export async function createTestSuperAdmin(email: string, password: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔄 Creating test super admin:', email);

    // First, try to sign up the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_role: 'super_admin',
          system_type: 'multi_tenant'
        }
      }
    });

    if (authError && !authError.message.includes('already registered')) {
      console.error('❌ Auth signup error:', authError.message);
      return { success: false, message: authError.message };
    }

    // Add to super_admins table (using separate MT tables)
    const passwordHash = btoa(password); // Base64 encoding for demo
    const { data: superAdminData, error: superAdminError } = await supabase
      .from('mt_super_admins')
      .upsert({
        email: email,
        password_hash: passwordHash
      })
      .select()
      .single();

    if (superAdminError) {
      console.error('❌ Super admin table error:', superAdminError.message);
      return { success: false, message: superAdminError.message };
    }

    console.log('✅ Test super admin created successfully');
    return { success: true, message: 'Super admin created successfully' };

  } catch (error) {
    console.error('❌ Error creating test super admin:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * Create a test company
 */
export async function createTestCompany(name: string, displayName: string, description?: string): Promise<{ success: boolean; company: any; message: string }> {
  try {
    console.log('🔄 Creating test company:', displayName);

    const { data: companyData, error: companyError } = await supabase
      .from('mt_companies')
      .insert({
        name: name,
        display_name: displayName,
        description: description || `Test company: ${displayName}`,
        settings: {
          show_full_balance_to_users: true,
          current_visible_month: 0,
          current_visible_year: 2025,
          allow_user_transaction_creation: true,
          allow_user_transaction_editing: true,
          require_receipt_printing: false
        },
        is_active: true
      })
      .select()
      .single();

    if (companyError) {
      console.error('❌ Company creation error:', companyError.message);
      return { success: false, company: null, message: companyError.message };
    }

    console.log('✅ Test company created successfully');
    return { success: true, company: companyData, message: 'Company created successfully' };

  } catch (error) {
    console.error('❌ Error creating test company:', error);
    return { success: false, company: null, message: String(error) };
  }
}

/**
 * Create a test company admin user
 */
export async function createTestCompanyAdmin(email: string, password: string, companyId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔄 Creating test company admin:', email);

    // First, try to sign up the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_role: 'company_admin',
          system_type: 'multi_tenant'
        }
      }
    });

    if (authError && !authError.message.includes('already registered')) {
      console.error('❌ Auth signup error:', authError.message);
      return { success: false, message: authError.message };
    }

    // Add to company_admins table
    const passwordHash = btoa(password); // Base64 encoding for demo
    const { data: adminData, error: adminError } = await supabase
      .from('mt_company_admins')
      .upsert({
        email: email,
        password_hash: passwordHash,
        company_id: companyId,
        permissions: {
          manage_users: true,
          manage_transactions: true,
          view_reports: true,
          manage_categories: true,
          manage_notifications: true,
          export_data: true
        },
        is_active: true
      })
      .select()
      .single();

    if (adminError) {
      console.error('❌ Company admin table error:', adminError.message);
      return { success: false, message: adminError.message };
    }

    console.log('✅ Test company admin created successfully');
    return { success: true, message: 'Company admin created successfully' };

  } catch (error) {
    console.error('❌ Error creating test company admin:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * Create a test company user
 */
export async function createTestCompanyUser(email: string, password: string, username: string, companyId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔄 Creating test company user:', email);

    // First, try to sign up the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_role: 'company_user',
          system_type: 'multi_tenant'
        }
      }
    });

    if (authError && !authError.message.includes('already registered')) {
      console.error('❌ Auth signup error:', authError.message);
      return { success: false, message: authError.message };
    }

    // Add to company_users table
    const passwordHash = btoa(password); // Base64 encoding for demo
    const { data: userData, error: userError } = await supabase
      .from('mt_company_users')
      .upsert({
        email: email,
        username: username,
        password_hash: passwordHash,
        company_id: companyId,
        user_metadata: {
          can_create_transactions: true,
          can_edit_own_transactions: false,
          can_view_all_transactions: false
        },
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Company user table error:', userError.message);
      return { success: false, message: userError.message };
    }

    console.log('✅ Test company user created successfully');
    return { success: true, message: 'Company user created successfully' };

  } catch (error) {
    console.error('❌ Error creating test company user:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * Create a complete test setup with company and users
 */
export async function createCompleteTestSetup(): Promise<{ success: boolean; message: string; details: any }> {
  try {
    console.log('🚀 Creating complete test setup...');

    // 1. Create test company
    const companyResult = await createTestCompany('test-company', 'Test Company', 'A test company for multi-tenant testing');
    if (!companyResult.success) {
      return { success: false, message: 'Failed to create test company: ' + companyResult.message, details: null };
    }

    const companyId = companyResult.company.id;

    // 2. Create super admin
    const superAdminResult = await createTestSuperAdmin('superadmin@test.com', 'test123');
    
    // 3. Create company admin
    const companyAdminResult = await createTestCompanyAdmin('admin@test.com', 'test123', companyId);
    
    // 4. Create company user
    const companyUserResult = await createTestCompanyUser('user@test.com', 'test123', 'Test User', companyId);

    const details = {
      company: companyResult.company,
      superAdmin: superAdminResult.success,
      companyAdmin: companyAdminResult.success,
      companyUser: companyUserResult.success
    };

    console.log('✅ Complete test setup created successfully');
    return { 
      success: true, 
      message: 'Complete test setup created successfully', 
      details 
    };

  } catch (error) {
    console.error('❌ Error creating complete test setup:', error);
    return { success: false, message: String(error), details: null };
  }
}

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).createTestSuperAdmin = createTestSuperAdmin;
  (window as any).createTestCompany = createTestCompany;
  (window as any).createTestCompanyAdmin = createTestCompanyAdmin;
  (window as any).createTestCompanyUser = createTestCompanyUser;
  (window as any).createCompleteTestSetup = createCompleteTestSetup;
}
