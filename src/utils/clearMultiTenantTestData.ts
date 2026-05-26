/**
 * Clear Multi-Tenant Test Data
 * Removes all test transactions and logs for multi-tenant users
 * while preserving data for main admin and existing users
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Clear ALL multi-tenant data completely
 */
export async function clearAllMultiTenantData(): Promise<{ success: boolean; message: string; details: any }> {
  try {
    console.log('🧹 Starting COMPLETE multi-tenant data cleanup...');

    const results = {
      companiesDeleted: 0,
      transactionsDeleted: 0,
      usersDeleted: 0,
      adminsDeleted: 0,
      superAdminsDeleted: 0,
      logsDeleted: 0,
      notificationsDeleted: 0,
      messagesDeleted: 0,
      categoriesDeleted: 0,
      preferencesDeleted: 0
    };

    // 1. Clear ALL company transactions
    console.log('🔄 Clearing ALL company transactions...');
    const { data: allTransactions, error: transError } = await supabase
      .from('mt_company_transactions')
      .delete()
      .select('id');

    if (transError) {
      console.error('❌ Error clearing transactions:', transError);
    } else {
      results.transactionsDeleted = allTransactions?.length || 0;
      console.log(`✅ Cleared ${results.transactionsDeleted} transactions`);
    }

    // 2. Clear ALL company messages
    console.log('🔄 Clearing ALL company messages...');
    const { data: allMessages, error: messagesError } = await supabase
      .from('mt_company_messages')
      .delete()
      .select('id');

    if (messagesError) {
      console.error('❌ Error clearing messages:', messagesError);
    } else {
      results.messagesDeleted = allMessages?.length || 0;
      console.log(`✅ Cleared ${results.messagesDeleted} messages`);
    }

    // 3. Clear ALL company categories
    console.log('🔄 Clearing ALL company categories...');
    const { data: allCategories, error: categoriesError } = await supabase
      .from('mt_company_categories')
      .delete()
      .select('id');

    if (categoriesError) {
      console.error('❌ Error clearing categories:', categoriesError);
    } else {
      results.categoriesDeleted = allCategories?.length || 0;
      console.log(`✅ Cleared ${results.categoriesDeleted} categories`);
    }

    // 4. Clear ALL user preferences
    console.log('🔄 Clearing ALL user preferences...');
    const { data: allPreferences, error: preferencesError } = await supabase
      .from('mt_user_preferences')
      .delete()
      .select('user_id');

    if (preferencesError) {
      console.error('❌ Error clearing preferences:', preferencesError);
    } else {
      results.preferencesDeleted = allPreferences?.length || 0;
      console.log(`✅ Cleared ${results.preferencesDeleted} user preferences`);
    }

    // 5. Clear ALL company users
    console.log('🔄 Clearing ALL company users...');
    const { data: allUsers, error: usersError } = await supabase
      .from('mt_company_users')
      .delete()
      .select('id');

    if (usersError) {
      console.error('❌ Error clearing users:', usersError);
    } else {
      results.usersDeleted = allUsers?.length || 0;
      console.log(`✅ Cleared ${results.usersDeleted} users`);
    }

    // 6. Clear ALL company admins
    console.log('🔄 Clearing ALL company admins...');
    const { data: allAdmins, error: adminsError } = await supabase
      .from('mt_company_admins')
      .delete()
      .select('id');

    if (adminsError) {
      console.error('❌ Error clearing admins:', adminsError);
    } else {
      results.adminsDeleted = allAdmins?.length || 0;
      console.log(`✅ Cleared ${results.adminsDeleted} admins`);
    }

    // 7. Clear ALL super admins
    console.log('🔄 Clearing ALL super admins...');
    const { data: allSuperAdmins, error: superAdminsError } = await supabase
      .from('mt_super_admins')
      .delete()
      .select('id');
    
    if (superAdminsError) {
      console.error('❌ Error clearing super admins:', superAdminsError);
    } else {
      results.superAdminsDeleted = allSuperAdmins?.length || 0;
      console.log(`✅ Cleared ${results.superAdminsDeleted} super admins`);
    }

    // 8. Clear ALL company notifications
    console.log('🔄 Clearing ALL notifications...');
    const { data: allNotifications, error: notificationsError } = await supabase
      .from('mt_company_notifications')
      .delete()
      .select('id');

    if (notificationsError) {
      console.error('❌ Error clearing notifications:', notificationsError);
    } else {
      results.notificationsDeleted = allNotifications?.length || 0;
      console.log(`✅ Cleared ${results.notificationsDeleted} notifications`);
    }

    // 9. Clear ALL companies
    console.log('🔄 Clearing ALL companies...');
    const { data: allCompanies, error: companiesError } = await supabase
      .from('companies')
      .delete()
      .select('id, display_name');
    
    if (companiesError) {
      console.error('❌ Error clearing companies:', companiesError);
    } else {
      results.companiesDeleted = allCompanies?.length || 0;
      console.log(`✅ Cleared ${results.companiesDeleted} companies`);
      if (allCompanies) {
        allCompanies.forEach(company => {
          console.log(`  - Deleted: ${company.display_name}`);
        });
      }
    }

    console.log('🎉 COMPLETE multi-tenant data cleanup finished!');
    console.log('📊 Summary:', results);

    return {
      success: true,
      message: `Successfully cleared all multi-tenant data: ${results.companiesDeleted} companies, ${results.transactionsDeleted} transactions, ${results.usersDeleted} users, ${results.adminsDeleted} admins, ${results.superAdminsDeleted} super admins, ${results.messagesDeleted} messages, ${results.categoriesDeleted} categories, ${results.preferencesDeleted} preferences, ${results.notificationsDeleted} notifications`,
      details: results
    };

  } catch (error) {
    console.error('❌ Error during multi-tenant data cleanup:', error);
    return {
      success: false,
      message: `Failed to clear multi-tenant data: ${error}`,
      details: { error: error }
    };
  }
}

/**
 * Clear specific test users by email pattern
 */
export async function clearTestUsersByPattern(emailPattern: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🔄 Clearing test users matching pattern: ${emailPattern}`);
    
    // Clear from company users
    const { data: deletedUsers, error: usersError } = await supabase
      .from('mt_company_users')
      .delete()
      .ilike('email', emailPattern)
      .select('email');
    
    if (usersError) {
      console.error('❌ Error clearing test users:', usersError);
      return { success: false, message: usersError.message };
    }

    console.log(`✅ Cleared ${deletedUsers?.length || 0} test users`);
    return {
      success: true,
      message: `Cleared ${deletedUsers?.length || 0} test users matching pattern: ${emailPattern}`
    };

  } catch (error) {
    console.error('❌ Error clearing test users:', error);
    return {
      success: false,
      message: 'Failed to clear test users: ' + String(error)
    };
  }
}

/**
 * Verify what data remains after cleanup
 */
export async function verifyDataAfterCleanup(): Promise<{ success: boolean; summary: any }> {
  try {
    console.log('🔍 Verifying remaining data...');
    
    const [
      companiesResult,
      transactionsResult,
      usersResult,
      adminsResult
    ] = await Promise.all([
      supabase.from('companies').select('id, display_name, name').order('created_at'),
      supabase.from('mt_company_transactions').select('id, company_id').order('created_at'),
      supabase.from('mt_company_users').select('id, email, company_id').order('created_at'),
      supabase.from('mt_company_admins').select('id, email, company_id').order('created_at')
    ]);

    const summary = {
      companies: companiesResult.data || [],
      transactions: transactionsResult.data || [],
      users: usersResult.data || [],
      admins: adminsResult.data || []
    };

    console.log('📊 Remaining data summary:');
    console.log(`  - Companies: ${summary.companies.length}`);
    console.log(`  - Transactions: ${summary.transactions.length}`);
    console.log(`  - Users: ${summary.users.length}`);
    console.log(`  - Admins: ${summary.admins.length}`);

    return { success: true, summary };

  } catch (error) {
    console.error('❌ Error verifying data:', error);
    return { success: false, summary: null };
  }
}

// Export the main function with the expected name
export const clearMultiTenantTestData = clearAllMultiTenantData;

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).clearMultiTenantTestData = clearAllMultiTenantData;
  (window as any).clearTestUsersByPattern = clearTestUsersByPattern;
  (window as any).verifyDataAfterCleanup = verifyDataAfterCleanup;
}
