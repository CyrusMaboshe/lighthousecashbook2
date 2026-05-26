/**
 * Tenant Exports - Multi-Tenant Export System
 * Replicates the exact design and functionality of ExportCenter but for tenant-specific data
 * Uses new tenant_exports tables and is fully isolated from the main system
 */

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  FileText, 
  BarChart3, 
  Calendar, 
  Users, 
  TrendingUp,
  Database,
  FileSpreadsheet,
  Printer,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMultiTenantAuth } from '@/hooks/useMultiTenantAuth';
import { supabase } from '@/integrations/supabase/client';

interface TenantExportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'transactions' | 'reports' | 'analytics' | 'system';
  adminOnly?: boolean;
  action: () => Promise<void> | void;
  isLoading?: boolean;
}

export function TenantExports() {
  const { currentCompany, currentUser, isCompanyAdmin } = useMultiTenantAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'transactions' | 'analytics' | 'reports' | 'system'>('transactions');
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = (optionId: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [optionId]: loading }));
  };

  // Export functions for tenant-specific data
  const exportTenantTransactions = async () => {
    if (!currentCompany) return;
    
    setLoading('tenant-transactions', true);
    try {
      const { data, error } = await supabase
        .from('mt_company_transactions')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Create CSV content
      const csvContent = [
        ['Date', 'Type', 'Amount', 'Category', 'Customer Name', 'Customer WhatsApp', 'Customer Details', 'Pictures Count'].join(','),
        ...data.map(t => [
          new Date(t.created_at).toLocaleDateString(),
          t.type,
          t.amount,
          t.category || '',
          t.customer_name || '',
          t.customer_whatsapp || '',
          t.customer_details || '',
          t.pictures?.length || 0
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentCompany.name}-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Transactions exported successfully",
      });
    } catch (error) {
      console.error('Error exporting transactions:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export transactions",
        variant: "destructive",
      });
    } finally {
      setLoading('tenant-transactions', false);
    }
  };

  const exportTenantUsers = async () => {
    if (!currentCompany || !isCompanyAdmin) return;
    
    setLoading('tenant-users', true);
    try {
      const { data, error } = await supabase
        .from('mt_company_users')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Create CSV content
      const csvContent = [
        ['Username', 'Email', 'Role', 'Active', 'Created Date', 'Last Login'].join(','),
        ...data.map(u => [
          u.username,
          u.email,
          u.role,
          u.is_active ? 'Yes' : 'No',
          new Date(u.created_at).toLocaleDateString(),
          u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentCompany.name}-users-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Users exported successfully",
      });
    } catch (error) {
      console.error('Error exporting users:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export users",
        variant: "destructive",
      });
    } finally {
      setLoading('tenant-users', false);
    }
  };

  const exportTenantReports = async () => {
    if (!currentCompany) return;
    
    setLoading('tenant-reports', true);
    try {
      const { data, error } = await supabase
        .from('tenant_reports')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('report_year', { ascending: false })
        .order('report_month', { ascending: false });

      if (error) throw error;

      // Create CSV content
      const csvContent = [
        ['Month', 'Year', 'Total Cash In', 'Total Cash Out', 'Net Balance', 'Transaction Count', 'Pictures Count'].join(','),
        ...data.map(r => [
          r.report_month,
          r.report_year,
          r.total_cash_in,
          r.total_cash_out,
          r.net_balance,
          r.transaction_count,
          r.total_pictures
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentCompany.name}-reports-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Reports exported successfully",
      });
    } catch (error) {
      console.error('Error exporting reports:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export reports",
        variant: "destructive",
      });
    } finally {
      setLoading('tenant-reports', false);
    }
  };

  const exportTenantAnalytics = async () => {
    if (!currentCompany) return;
    
    setLoading('tenant-analytics', true);
    try {
      // Generate analytics data
      const { data: transactions, error } = await supabase
        .from('mt_company_transactions')
        .select('*')
        .eq('company_id', currentCompany.id);

      if (error) throw error;

      // Calculate analytics
      const monthlyData = new Map();
      const categoryData = new Map();
      
      transactions.forEach(t => {
        const month = new Date(t.created_at).toISOString().slice(0, 7);
        const existing = monthlyData.get(month) || { cashIn: 0, cashOut: 0, count: 0 };
        
        if (t.type === 'cash_in') {
          existing.cashIn += t.amount;
        } else {
          existing.cashOut += t.amount;
        }
        existing.count += 1;
        monthlyData.set(month, existing);

        // Category analytics
        if (t.category) {
          const catExisting = categoryData.get(t.category) || { amount: 0, count: 0 };
          catExisting.amount += t.amount;
          catExisting.count += 1;
          categoryData.set(t.category, catExisting);
        }
      });

      // Create analytics CSV
      const analyticsContent = [
        'MONTHLY ANALYTICS',
        ['Month', 'Cash In', 'Cash Out', 'Net', 'Transactions'].join(','),
        ...Array.from(monthlyData.entries()).map(([month, data]) => [
          month,
          data.cashIn,
          data.cashOut,
          data.cashIn - data.cashOut,
          data.count
        ].join(',')),
        '',
        'CATEGORY ANALYTICS',
        ['Category', 'Total Amount', 'Transaction Count'].join(','),
        ...Array.from(categoryData.entries()).map(([category, data]) => [
          category,
          data.amount,
          data.count
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([analyticsContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentCompany.name}-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Analytics exported successfully",
      });
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export analytics",
        variant: "destructive",
      });
    } finally {
      setLoading('tenant-analytics', false);
    }
  };

  // Define export options (replicating exact structure from ExportCenter)
  const exportOptions: TenantExportOption[] = [
    {
      id: 'tenant-transactions',
      title: 'Transaction History',
      description: 'Export all company transactions with customer details and metadata',
      icon: FileText,
      category: 'transactions',
      action: exportTenantTransactions,
      isLoading: loadingStates['tenant-transactions']
    },
    {
      id: 'tenant-users',
      title: 'User List',
      description: 'Export all company users with roles and activity status',
      icon: Users,
      category: 'system',
      adminOnly: true,
      action: exportTenantUsers,
      isLoading: loadingStates['tenant-users']
    },
    {
      id: 'tenant-reports',
      title: 'Monthly Reports',
      description: 'Export all generated monthly reports and summaries',
      icon: Calendar,
      category: 'reports',
      action: exportTenantReports,
      isLoading: loadingStates['tenant-reports']
    },
    {
      id: 'tenant-analytics',
      title: 'Business Analytics',
      description: 'Export comprehensive analytics and insights data',
      icon: BarChart3,
      category: 'analytics',
      action: exportTenantAnalytics,
      isLoading: loadingStates['tenant-analytics']
    }
  ];

  const getOptionsByCategory = (category: string) => {
    return exportOptions.filter(option => {
      if (option.category !== category) return false;
      if (option.adminOnly && !isCompanyAdmin) return false;
      return true;
    });
  };

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">No company selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            {currentCompany.display_name} - Data Export Hub
          </CardTitle>
          <p className="text-sm text-gray-600">
            Centralized location for all company data export functions. Choose your export type and format below.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Reports
              </TabsTrigger>
              {isCompanyAdmin && (
                <TabsTrigger value="system" className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  System
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="transactions" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getOptionsByCategory('transactions').map((option) => (
                  <TenantExportCard key={option.id} option={option} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getOptionsByCategory('analytics').map((option) => (
                  <TenantExportCard key={option.id} option={option} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getOptionsByCategory('reports').map((option) => (
                  <TenantExportCard key={option.id} option={option} />
                ))}
              </div>
              {getOptionsByCategory('reports').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Additional report exports coming soon...</p>
                </div>
              )}
            </TabsContent>

            {isCompanyAdmin && (
              <TabsContent value="system" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getOptionsByCategory('system').map((option) => (
                    <TenantExportCard key={option.id} option={option} />
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface TenantExportCardProps {
  option: TenantExportOption;
}

function TenantExportCard({ option }: TenantExportCardProps) {
  const Icon = option.icon;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">{option.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{option.description}</p>
            <Button
              onClick={option.action}
              disabled={option.isLoading}
              className="w-full flex items-center gap-2"
              size="sm"
            >
              {option.isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {option.isLoading ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
