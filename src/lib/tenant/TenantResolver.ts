import { supabase } from '@/integrations/supabase/client';

export class TenantResolver {
  /**
   * Resolves the current tenant globally from the authenticated session.
   */
  static async resolveCurrentTenant() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) return null;

    // Get tenant data from our profile table
    const { data: profile, error } = await supabase
      .from('rebuilt_profiles')
      .select('tenant_id, role, companies(*)')
      .eq('id', session.user.id)
      .single();

    if (error || !profile) {
      console.warn('Profile not found in rebuilt_profiles, falling back to metadata:', error);

      // FALLBACK: Check user metadata for the role if profile missing
      const metadataRole = session.user.user_metadata?.user_role || session.user.user_metadata?.role;
      const metadataTenant = session.user.user_metadata?.tenant_id;

      if (metadataRole === 'main_super_admin') {
        return {
          tenantId: null,
          role: 'main_super_admin' as any,
          company: null
        };
      }

      return null;
    }

    return {
      tenantId: profile.tenant_id,
      role: profile.role,
      company: profile.companies
    };
  }

  /**
   * Helper to identify if user is Main Super Admin
   */
  static isMainSuperAdmin(role: string | null) {
    return role === 'main_super_admin';
  }
}
