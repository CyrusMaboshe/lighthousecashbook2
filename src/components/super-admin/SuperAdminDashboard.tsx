// Super Admin Dashboard - Main interface for system administrators
// This component provides comprehensive company and user management capabilities

import React, { useState, useEffect } from 'react';
import { Plus, Building2, Users, Settings, BarChart3, Shield, DollarSign, TrendingUp, TrendingDown, Camera, Download, Eye, EyeOff, Lock, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMultiTenantAuth } from '@/hooks/useMultiTenantAuth';
import { Company } from '@/types/multiTenant';
import { supabase } from '@/integrations/supabase/client';
import { SuperAdminExportOptions } from '@/components/export/SuperAdminExportOptions';
import { CompanyUserManagement } from '@/components/super-admin/CompanyUserManagement';
import { AccessControlPanel } from '@/components/super-admin/AccessControlPanel';
import { UniversalPasswordChange } from '../auth/UniversalPasswordChange';

interface SuperAdminStats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  totalAdmins: number;
  totalTransactions: number;
  systemHealth: 'good' | 'warning' | 'error';
}

interface CompanyTransactionStats {
  company_id: string;
  total_cash_in: number;
  total_cash_out: number;
  net_balance: number;
  total_pictures: number;
  total_transactions: number;
}

export function SuperAdminDashboard() {
  const { currentUser, isSuperAdmin } = useMultiTenantAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyTransactionStats[]>([]);
  const [stats, setStats] = useState<SuperAdminStats>({
    totalCompanies: 0,
    activeCompanies: 0,
    totalUsers: 0,
    totalAdmins: 0,
    totalTransactions: 0,
    systemHealth: 'good'
  });
  const [balancesVisible, setBalancesVisible] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  });

  // Ensure dashboard always starts with current month
  useEffect(() => {
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthDisplay = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    // Always reset to current month on component mount
    if (selectedMonth !== currentMonthDisplay) {
      setSelectedMonth(currentMonthDisplay);
      console.log('📅 Super Admin Dashboard initialized to current month:', currentMonthDisplay);
    }
  }, []);

  // Generate comprehensive month/year options for period selection
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-based

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Generate options from 2020 to current year + 5 years
    for (let year = 2020; year <= currentYear + 5; year++) {
      for (let month = 0; month < 12; month++) {
        const monthName = months[month];
        const displayValue = `${monthName} ${year}`;
        options.push({
          value: displayValue,
          label: displayValue,
          year: year,
          month: month,
          isCurrent: year === currentYear && month === currentMonth,
          isFuture: year > currentYear || (year === currentYear && month > currentMonth),
          isPast: year < currentYear || (year === currentYear && month < currentMonth)
        });
      }
    }

    return options;
  };

  const monthOptions = generateMonthOptions();

  // Convert display month to API format (e.g., "July 2025" -> "2025-07")
  const getApiMonth = (displayMonth: string): string => {
    const monthMap: { [key: string]: string } = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };

    const [month, year] = displayMonth.split(' ');
    return `${year}-${monthMap[month] || '01'}`;
  };

  // Handle month selection change
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    console.log(`📅 Super Admin period changed to: ${newMonth} (API format: ${getApiMonth(newMonth)})`);
    // Reload data for the selected period
    loadCompanyTransactionStats(getApiMonth(newMonth));
  };

  // Password for viewing financial data
  const ADMIN_VIEW_PASSWORD = 'titanium';

  const handleToggleBalances = () => {
    if (balancesVisible) {
      // Hide balances immediately
      setBalancesVisible(false);
      setPasswordInput('');
      setPasswordError('');
    } else {
      // Show password prompt to reveal balances
      setShowPasswordPrompt(true);
    }
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_VIEW_PASSWORD) {
      setBalancesVisible(true);
      setShowPasswordPrompt(false);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password. Please try again.');
      setPasswordInput('');
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordPrompt(false);
    setPasswordInput('');
    setPasswordError('');
  };

  // Special override for jonahdjbreezy@gmail.com - always treat as super admin
  const isJonahUser = currentUser?.email === 'jonahdjbreezy@gmail.com';
  const effectiveIsSuperAdmin = isSuperAdmin() || isJonahUser;

  // Debug logging
  console.log('🔍 SuperAdminDashboard Debug:', {
    currentUser: currentUser?.email,
    isSuperAdmin: isSuperAdmin(),
    isJonahUser,
    effectiveIsSuperAdmin,
    companies: companies?.length,
    authUser: currentUser
  });

  // Redirect if not super admin (except for jonahdjbreezy@gmail.com)
  if (!effectiveIsSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access the Super Admin Dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load companies
      const { data: companiesData } = await supabase
        .from('mt_companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (companiesData) {
        setCompanies(companiesData);
      }

      // Load statistics and company transaction data
      await Promise.all([loadStats(), loadCompanyTransactionStats()]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get company stats
      const { data: companyStats } = await supabase
        .from('mt_companies')
        .select('id, is_active');

      // Get user stats
      const { data: adminStats } = await supabase
        .from('mt_company_admins')
        .select('id, is_active');

      const { data: userStats } = await supabase
        .from('mt_company_users')
        .select('id, is_active');

      // Get transaction stats
      const { data: transactionStats } = await supabase
        .from('mt_company_transactions')
        .select('id');

      const totalCompanies = companyStats?.length || 0;
      const activeCompanies = companyStats?.filter(c => c.is_active).length || 0;
      const totalAdmins = adminStats?.filter(a => a.is_active).length || 0;
      const totalUsers = userStats?.filter(u => u.is_active).length || 0;
      const totalTransactions = transactionStats?.length || 0;

      setStats({
        totalCompanies,
        activeCompanies,
        totalUsers,
        totalAdmins,
        totalTransactions,
        systemHealth: 'good' // TODO: Implement health checks
      });

    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadCompanyTransactionStats = async (selectedPeriod?: string) => {
    try {
      // Get transaction stats for each company
      let query = supabase
        .from('mt_company_transactions')
        .select('company_id, type, amount, number_of_pictures, date');

      // Filter by selected period if provided
      if (selectedPeriod) {
        const [year, month] = selectedPeriod.split('-');
        const startDate = `${selectedPeriod}-01`;
        // Get last day of the month
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        query = query.gte('date', startDate).lte('date', endDate);
        console.log(`📊 Loading transaction stats for period: ${selectedPeriod} (${startDate} to ${endDate})`);
      }

      const { data: transactionData } = await query;

      if (transactionData) {
        // Group by company and calculate stats
        const statsMap = new Map<string, CompanyTransactionStats>();

        transactionData.forEach(transaction => {
          const companyId = transaction.company_id;
          const existing = statsMap.get(companyId) || {
            company_id: companyId,
            total_cash_in: 0,
            total_cash_out: 0,
            net_balance: 0,
            total_pictures: 0,
            total_transactions: 0
          };

          existing.total_transactions += 1;
          if (transaction.type === 'cash-in') {
            existing.total_cash_in += parseFloat(transaction.amount) || 0;
            existing.total_pictures += transaction.number_of_pictures || 0;
          } else if (transaction.type === 'cash-out') {
            existing.total_cash_out += parseFloat(transaction.amount) || 0;
          }
          existing.net_balance = existing.total_cash_in - existing.total_cash_out;

          statsMap.set(companyId, existing);
        });

        setCompanyStats(Array.from(statsMap.values()));
      }
    } catch (error) {
      console.error('Error loading company transaction stats:', error);
    }
  };

  // Enhanced real-time subscription for all transaction updates
  useEffect(() => {
    if (!isSuperAdmin) return;

    const subscription = supabase
      .channel(`super_admin_comprehensive_updates-${Math.random().toString(36).substring(2, 9)}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mt_company_transactions'
        },
        (payload) => {
          console.log('🔄 Super Admin: MT Company transaction change detected:', payload);
          loadCompanyTransactionStats();
          loadStats();
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_transactions'
        },
        (payload) => {
          console.log('🔄 Super Admin: Campaign transaction change detected:', payload);
          loadCompanyTransactionStats();
          loadStats();
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mt_companies'
        },
        (payload) => {
          console.log('🔄 Super Admin: Company change detected:', payload);
          loadDashboardData();
        }
      )
      .subscribe((status) => {
        console.log('📊 Super Admin comprehensive real-time subscription status:', status);
      });

    return () => {
      console.log('🧹 Cleaning up super admin comprehensive real-time subscription');
      subscription.unsubscribe();
    };
  }, [isSuperAdmin]);

  // Removed unused handlers since we simplified the dashboard

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
          <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage companies, users, and system-wide settings
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Period Selection */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {monthOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className={`
                      ${option.isCurrent ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                      ${option.isFuture ? 'text-green-600' : ''}
                      ${option.isPast ? 'text-gray-600' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {option.isCurrent && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-2">
                          Current
                        </span>
                      )}
                      {option.isFuture && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded ml-2">
                          Future
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-gray-500">📅 Supports 2020-{new Date().getFullYear() + 5}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCompanies} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAdmins}</div>
            <p className="text-xs text-muted-foreground">
              Across all companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active users
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
            <p className="text-xs text-muted-foreground">
              All companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge 
                variant={stats.systemHealth === 'good' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {stats.systemHealth.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="exports">Exports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Real-time Company Transaction Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Company Transaction Overview (Real-time)</CardTitle>
                  <CardDescription>Live transaction data for all companies across all periods</CardDescription>
                </div>
                <Button
                  onClick={handleToggleBalances}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {balancesVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {balancesVisible ? 'Hide Balances' : 'Show Balances'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {companies.map((company) => {
                  const stats = companyStats.find(s => s.company_id === company.id) || {
                    total_cash_in: 0,
                    total_cash_out: 0,
                    net_balance: 0,
                    total_pictures: 0,
                    total_transactions: 0
                  };

                  return (
                    <div key={company.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{company.display_name}</h3>
                          <p className="text-sm text-muted-foreground">{company.name}</p>
                        </div>
                        <Badge variant={company.is_active ? "default" : "secondary"}>
                          {company.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Cash In</p>
                            <p className="font-semibold text-green-600">
                              {balancesVisible ? `ZMW ${stats.total_cash_in.toFixed(2)}` : '••••••'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Cash Out</p>
                            <p className="font-semibold text-red-600">
                              {balancesVisible ? `ZMW ${stats.total_cash_out.toFixed(2)}` : '••••••'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Net Balance</p>
                            <p className={`font-semibold ${stats.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {balancesVisible ? `ZMW ${stats.net_balance.toFixed(2)}` : '••••••'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Pictures</p>
                            <p className="font-semibold text-purple-600">{stats.total_pictures}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Transactions</p>
                            <p className="font-semibold text-orange-600">{stats.total_transactions}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {companies.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No companies found. Create your first company to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Overall system status and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Database Status</span>
                    <Badge variant="default">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>API Status</span>
                    <Badge variant="default">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Authentication</span>
                    <Badge variant="default">Operational</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Management</CardTitle>
              <CardDescription>Manage all companies in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Company management panel coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <AccessControlPanel />
          <CompanyUserManagement />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Super Admin Reports</CardTitle>
              <CardDescription>
                Comprehensive reporting and analytics for all companies and system-wide data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Super Admin Reports</h3>
                  <p className="text-gray-600 mb-4">
                    System-wide reporting and analytics dashboard for all companies and users.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-blue-600" />
                        <div>
                          <h4 className="font-semibold">Company Reports</h4>
                          <p className="text-sm text-gray-600">View individual company performance</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-green-600" />
                        <div>
                          <h4 className="font-semibold">User Analytics</h4>
                          <p className="text-sm text-gray-600">System-wide user activity</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                        <div>
                          <h4 className="font-semibold">Financial Overview</h4>
                          <p className="text-sm text-gray-600">Cross-company financial data</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Super Admin Data Exports</CardTitle>
              <CardDescription>
                Export comprehensive reports containing all companies' data, transactions, and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SuperAdminExportOptions isSuperAdmin={effectiveIsSuperAdmin} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  System settings panel coming soon...
                </p>
              </CardContent>
            </Card>

            <div>
              <UniversalPasswordChange />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Password Dialog for Balance Visibility */}
      <Dialog open={showPasswordPrompt} onOpenChange={setShowPasswordPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Admin Authentication Required
            </DialogTitle>
            <DialogDescription>
              Enter the admin password to view company financial data and balances.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
                placeholder="Enter admin password"
                className={passwordError ? 'border-red-500' : ''}
              />
              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handlePasswordCancel}>
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit}>
              Show Balances
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
