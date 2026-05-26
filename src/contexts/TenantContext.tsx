import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TenantResolver } from '@/lib/tenant/TenantResolver';

export type TenantRole = 'main_super_admin' | 'tenant_super_admin' | 'user' | null;

interface TenantContextType {
    tenantId: string | null;
    role: TenantRole;
    company: any | null;
    isLoading: boolean;
    refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [role, setRole] = useState<TenantRole>(null);
    const [company, setCompany] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const resolveTenant = async () => {
        setIsLoading(true);
        try {
            const result = await TenantResolver.resolveCurrentTenant();
            if (result) {
                setTenantId(result.tenantId);
                setRole(result.role as TenantRole);
                setCompany(result.company);
            } else {
                setTenantId(null);
                setRole(null);
                setCompany(null);
            }
        } catch (error) {
            console.error('Error in TenantProvider:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        resolveTenant();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            resolveTenant();
        });

        return () => subscription.unsubscribe();
    }, []);

    const value = {
        tenantId,
        role,
        company,
        isLoading,
        refreshTenant: resolveTenant
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}
