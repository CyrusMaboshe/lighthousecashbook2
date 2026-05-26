// Company Admin Dashboard - Main interface for company administrators
// This component provides company-scoped management capabilities

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Settings,
  Bell,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMultiTenantAuth } from '@/hooks/useMultiTenantAuth';
import { CompanyTransaction, CompanyUser, CompanyAdmin } from '@/types/multiTenant';
import { supabase } from '@/integrations/supabase/client';
import { CompanyTransactionView } from './CompanyTransactionView';
import { TenantReports } from '@/components/tenant/TenantReports';
import { TenantExports } from '@/components/tenant/TenantExports';
import { LegacyReports } from '@/components/company-admin/LegacyReports';

interface CompanyDashboardStats {
  totalTransactions: number;
  totalCashIn: number;
  totalCashOut: number;
  netBalance: number;
  activeUsers: number;
  totalAdmins: number;
  thisMonthTransactions: number;
  lastMonthTransactions: number;
  recentTransactions: CompanyTransaction[];
}

export function CompanyAdminDashboard() {
  const { currentUser, currentCompany, isCompanyAdmin } = useMultiTenantAuth();
  const location = useLocation();
  const [stats, setStats] = useState<CompanyDashboardStats>({
    totalTransactions: 0,
    totalCashIn: 0,
    totalCashOut: 0,
    netBalance: 0,
    activeUsers: 0,
    totalAdmins: 0,
    thisMonthTransactions: 0,
    lastMonthTransactions: 0,
    recentTransactions: []
  });

  // Determine active tab based on URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/users')) return 'users';
    if (path.includes('/transactions')) return 'transactions';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/exports')) return 'exports';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/settings')) return 'settings';
    return 'transactions';
  };
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not company admin or no company
  if (!isCompanyAdmin() || !currentCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-red-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access this company dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Load dashboard data
  useEffect(() => {
    if (currentCompany) {
      loadDashboardStats();
    }
  }, [currentCompany]);

  const loadDashboardStats = async () => {
    if (!currentCompany) return;

    try {
      setIsLoading(true);

      // Get all transactions for the company
      const { data: transactions } = await supabase
        .from('company_transactions')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      // Get users count
      const { data: users } = await supabase
        .from('company_users')
        .select('id')
        .eq('company_id', currentCompany.id)
        .eq('is_active', true);

      // Get admins count
      const { data: admins } = await supabase
        .from('company_admins')
        .select('id')
        .eq('company_id', currentCompany.id)
        .eq('is_active', true);

      if (transactions) {
        const totalCashIn = transactions
          .filter(t => t.type === 'cash-in')
          .reduce((sum, t) => sum + t.amount, 0);

        const totalCashOut = transactions
          .filter(t => t.type === 'cash-out')
          .reduce((sum, t) => sum + t.amount, 0);

        const netBalance = totalCashIn - totalCashOut;

        // Calculate this month vs last month
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

        const thisMonthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.created_at);
          return transactionDate.getMonth() === thisMonth && 
                 transactionDate.getFullYear() === thisYear;
        }).length;

        const lastMonthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.created_at);
          return transactionDate.getMonth() === lastMonth && 
                 transactionDate.getFullYear() === lastMonthYear;
        }).length;

        setStats({
          totalTransactions: transactions.length,
          totalCashIn,
          totalCashOut,
          netBalance,
          activeUsers: users?.length || 0,
          totalAdmins: admins?.length || 0,
          thisMonthTransactions,
          lastMonthTransactions,
          recentTransactions: transactions.slice(0, 5)
        });
      }

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTransactionTrend = () => {
    if (stats.lastMonthTransactions === 0) return { trend: 'neutral', percentage: 0 };
    
    const percentage = ((stats.thisMonthTransactions - stats.lastMonthTransactions) / stats.lastMonthTransactions) * 100;
    const trend = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
    
    return { trend, percentage: Math.abs(percentage) };
  };

  const transactionTrend = getTransactionTrend();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{currentCompany.display_name}</h1>
          <p className="text-muted-foreground">
            Company Dashboard - Manage your team and transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.netBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalCashIn)} in, {formatCurrency(stats.totalCashOut)} out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {transactionTrend.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1 text-green-500" />}
              {transactionTrend.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1 text-red-500" />}
              {transactionTrend.percentage.toFixed(1)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAdmins} admin{stats.totalAdmins !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Transactions this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={getActiveTab()} className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="exports">Exports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>



        <TabsContent value="transactions" className="space-y-4">
          <CompanyTransactionView companyId={currentCompany.id} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage users in your company</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                User management features coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <LegacyReports />
        </TabsContent>

        <TabsContent value="exports" className="space-y-4">
          <TenantExports />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Analytics</CardTitle>
              <CardDescription>View detailed analytics and reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Analytics dashboard coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Settings</CardTitle>
              <CardDescription>Configure your company preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Settings panel coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
