// Setup Super Admin for jonahdjbreezy@gmail.com
// This utility ensures the user is properly configured as super admin in the multi-tenant system

import { supabase } from '@/integrations/supabase/client';

/**
 * Ensure jonahdjbreezy@gmail.com is set up as super admin
 */
export const setupSuperAdmin = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const email = 'jonahdjbreezy@gmail.com';
    const password = 'titanium'; // Using the known password
    
    console.log('🔄 Setting up super admin for:', email);

    // First, try to create/update in Supabase Auth
    let authUser;
    
    // Try to sign up the user (this will fail if user already exists, which is fine)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_role: 'super_admin',
          system_type: 'multi_tenant'
        }
      }
    });

    if (signUpData.user) {
      authUser = signUpData.user;
      console.log('✅ User created in Supabase Auth');
    } else if (signUpError?.message.includes('already registered')) {
      // User already exists, try to get them
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInData.user) {
        authUser = signInData.user;
        console.log('✅ User found in Supabase Auth');
        
        // Update user metadata to ensure super admin role
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            user_role: 'super_admin',
            system_type: 'multi_tenant'
          }
        });
        
        if (updateError) {
          console.warn('⚠️ Could not update user metadata:', updateError.message);
        } else {
          console.log('✅ User metadata updated');
        }
      } else {
        console.error('❌ Could not sign in existing user:', signInError?.message);
        return { success: false, message: 'Could not access existing user account' };
      }
    } else {
      console.error('❌ Could not create user:', signUpError?.message);
      return { success: false, message: signUpError?.message || 'Failed to create user' };
    }

    if (!authUser) {
      return { success: false, message: 'Could not get or create auth user' };
    }

    // Now ensure the user is in the super_admins table
    const { data: existingSuperAdmin, error: checkError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email)
      .single();

    if (existingSuperAdmin) {
      console.log('✅ User already exists in super_admins table');
    } else {
      // Insert into super_admins table
      const { data: insertData, error: insertError } = await supabase
        .from('super_admins')
        .insert({
          id: authUser.id,
          email: email
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Could not insert into super_admins table:', insertError.message);
        
        // Try the separate multi-tenant table as fallback
        const passwordHash = btoa(password); // Base64 encoding for demo
        const { data: mtInsertData, error: mtInsertError } = await supabase
          .from('mt_super_admins')
          .insert({
            email: email,
            password_hash: passwordHash
          })
          .select()
          .single();

        if (mtInsertError) {
          console.error('❌ Could not insert into mt_super_admins table:', mtInsertError.message);
          return { success: false, message: 'Could not add user to super admin tables' };
        } else {
          console.log('✅ User added to mt_super_admins table');
        }
      } else {
        console.log('✅ User added to super_admins table');
      }
    }

    // Sign out to clear any cached auth state
    await supabase.auth.signOut();

    return { 
      success: true, 
      message: `Super admin setup completed for ${email}. Please refresh the page and login again.` 
    };

  } catch (error) {
    console.error('❌ Setup super admin error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Check if jonahdjbreezy@gmail.com is properly set up as super admin
 */
export const checkSuperAdminStatus = async (): Promise<{ isSetup: boolean; details: any }> => {
  try {
    const email = 'jonahdjbreezy@gmail.com';
    
    // Check in super_admins table
    const { data: superAdmin, error: superAdminError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email)
      .single();

    // Check in mt_super_admins table
    const { data: mtSuperAdmin, error: mtSuperAdminError } = await supabase
      .from('mt_super_admins')
      .select('*')
      .eq('email', email)
      .single();

    // Check current auth user
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    return {
      isSetup: !!(superAdmin || mtSuperAdmin),
      details: {
        email,
        inSuperAdminsTable: !!superAdmin,
        inMtSuperAdminsTable: !!mtSuperAdmin,
        currentAuthUser: currentUser?.email,
        currentUserRole: currentUser?.user_metadata?.user_role,
        superAdminError: superAdminError?.message,
        mtSuperAdminError: mtSuperAdminError?.message
      }
    };
  } catch (error) {
    return {
      isSetup: false,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
};
