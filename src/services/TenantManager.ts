import { supabase } from '@/integrations/supabase/client';

export interface CompanyCreateInput {
    name: string;
    tenant_id: string; // The friendly slug/id
    admin_email: string;
}

export class TenantManager {
    /**
     * Main Super Admin: Create a new company (Tenant)
     */
    static async createCompany(input: CompanyCreateInput) {
        const { data, error } = await supabase
            .from('companies')
            .insert({
                name: input.name,
                tenant_id: input.tenant_id,
                admin_email: input.admin_email,
                status: 'active'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Main Super Admin: Assign a Tenant Super Admin to a company
     */
    static async assignTenantAdmin(userId: string, companyId: string) {
        const { data, error } = await supabase
            .from('rebuilt_profiles')
            .update({
                role: 'tenant_super_admin',
                tenant_id: companyId
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Main Super Admin: Toggle company status (active/inactive)
     */
    static async toggleCompanyStatus(companyId: string, status: 'active' | 'inactive') {
        const { error } = await supabase
            .from('companies')
            .update({ status })
            .eq('id', companyId);

        if (error) throw error;
        return true;
    }

    /**
     * List all companies (Metadata only for Main Super Admin)
     */
    static async listCompanies() {
        const { data, error } = await supabase
            .from('companies')
            .select('id, name, tenant_id, admin_email, status, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * List all Tenant Super Admins across the platform
     */
    static async listTenantAdmins() {
        const { data, error } = await supabase
            .from('rebuilt_profiles')
            .select(`
        id, 
        email, 
        role, 
        tenant_id, 
        full_name,
        companies (
          id,
          name,
          tenant_id
        )
      `)
            .eq('role', 'tenant_super_admin');

        if (error) throw error;
        return data;
    }

    /**
     * Get users who are not yet assigned to a company or role
     */
    static async getUnassignedUsers() {
        const { data, error } = await supabase
            .from('rebuilt_profiles')
            .select('id, email, full_name, role')
            .is('tenant_id', null)
            .eq('role', 'user'); // Assuming 'user' is the default for new signups

        if (error) throw error;
        return data;
    }
}
