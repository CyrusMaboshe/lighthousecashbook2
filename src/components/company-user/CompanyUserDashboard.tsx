// Company User Dashboard - Robust implementation to avoid 404 errors
// This component provides a complete dashboard for company users
// Fixed isLoading variable conflict - UPDATED

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Minus,
  Settings,
  Bell,
  MessageSquare,
  FileText,
  Calendar,
  Building2,
  LogOut,
  Home,
  Camera,
  Menu,
  X,
  CreditCard,
  User,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Wallet,
  PieChart,
  Download,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { MTTransactionManager } from '@/components/company/MTTransactionManager';
import { MTTransactionManagerSafe } from '@/components/company/MTTransactionManagerSafe';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { UserLogs } from '@/components/company/UserLogs';
import { Reports } from '@/components/company/Reports';
import { CustomerAnalytics } from '@/components/company/CustomerAnalytics';
import { TenantReports } from '@/components/tenant/TenantReports';
import { TenantExports } from '@/components/tenant/TenantExports';
import { CampaignTargets } from '@/components/campaign/views/CampaignTargets';
import { supabase } from '@/integrations/supabase/client';
import { UniversalPasswordChange } from '../auth/UniversalPasswordChange';
import { ModernMobileCard, ModernMobileTabs } from '@/components/ui/ModernMobileWrapper';
import { useDeviceInfo } from '@/hooks/use-mobile';
import { EditableCompanyName } from '@/components/tenant/EditableCompanyName';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';


interface UserStats {
  totalTransactions: number;
  totalCashIn: number;
  totalCashOut: number;
  netBalance: number;
  thisMonth: number;
}

export function CompanyUserDashboard() {
  const { currentUser, currentCompany, signOut, isLoading: authLoading, isInitialized, refreshCompanyData } = useMultiTenantAuth();
  const { isMobile } = useDeviceInfo();
  const location = useLocation();
  const navigate = useNavigate();

  const [activityOpen, setActivityOpen] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalTransactions: 0,
    totalCashIn: 0,
    totalCashOut: 0,
    netBalance: 0,
    thisMonth: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsUpdating, setStatsUpdating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Refresh company data on mount so brand name is always fresh
  useEffect(() => {
    refreshCompanyData?.();
    const handler = (e: StorageEvent) => {
      if (e.key === 'mt_user_session') refreshCompanyData?.();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Ensure dashboard always starts with current month
  useEffect(() => {
    const now = new Date();
    const currentMonthValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (selectedMonth !== currentMonthValue) {
      setSelectedMonth(currentMonthValue);
    }
  }, []);

  // Determine active tab based on URL (Reports removed for basic users)
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/transactions')) return 'transactions';
    if (path.includes('/targets')) return 'targets';
    if (path.includes('/user-logs')) return 'user-logs';
    if (path.includes('/exports')) return 'exports';
    if (path.includes('/customer-analytics')) return 'customer-analytics';
    if (path.includes('/settings')) return 'settings';
    return 'transactions';
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  // Load user statistics
  useEffect(() => {
    const loadStats = async (showUpdating = false) => {
      if (!currentCompany?.id) return;

      try {
        if (showUpdating) {
          setStatsUpdating(true);
        } else {
          setStatsLoading(true);
        }

        // Load all-time stats using optimized RPC function
        const { data: allTimeData, error: rpcError } = await supabase.rpc('get_mt_company_transaction_stats', {
          p_company_id: currentCompany.id
        });

        if (rpcError) {
          console.error('Error loading all-time stats via RPC:', rpcError);
          await loadStatsFallback();
        } else if (allTimeData && allTimeData.length > 0) {
          const res = allTimeData[0];
          setStats({
            totalTransactions: Number(res.total_transactions) || 0,
            totalCashIn: Number(res.total_cash_in) || 0,
            totalCashOut: Number(res.total_cash_out) || 0,
            netBalance: Number(res.net_balance) || 0,
            thisMonth: Number(res.this_month_transactions) || 0
          });

          console.log('📊 All-time stats loaded via RPC:', res);
        } else {
          await loadStatsFallback();
        }
      } catch (error) {
        console.error('Error loading stats:', error);
        await loadStatsFallback();
      } finally {
        setStatsLoading(false);
        setStatsUpdating(false);
      }
    };

    const loadStatsFallback = async () => {
      try {
        // Calculate date range for selected month
        const [yearStr, monthStr] = selectedMonth.split('-');
        const startDate = `${selectedMonth}-01`;
        const endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0)
          .toISOString().split('T')[0];

        // Try month-specific stats RPC first
        const { data, error } = await supabase.rpc('get_mt_company_period_stats', {
          p_company_id: currentCompany.id,
          p_start_date: startDate,
          p_end_date: endDate
        });

        if (error) {
          console.warn('Error in stats fallback RPC, falling back to client-side aggregation:', error);
          
          // Fallback client-side calculation
          const { data: rawData, error: rawError } = await supabase
            .from('mt_company_transactions')
            .select('type, amount, date')
            .eq('company_id', currentCompany.id)
            .gte('date', startDate)
            .lte('date', endDate);

          if (rawError) {
            console.error('Error in raw stats fallback query:', rawError);
            return;
          }

          const cashIn = rawData?.filter(t => t.type === 'cash-in') || [];
          const cashOut = rawData?.filter(t => t.type === 'cash-out') || [];

          const totalCashIn = cashIn.reduce((sum, t) => sum + (t.amount || 0), 0);
          const totalCashOut = cashOut.reduce((sum, t) => sum + (t.amount || 0), 0);

          setStats({
            totalTransactions: rawData?.length || 0,
            totalCashIn: totalCashIn,
            totalCashOut: totalCashOut,
            netBalance: totalCashIn - totalCashOut,
            thisMonth: rawData?.length || 0
          });
          return;
        }

        if (data && data.length > 0) {
          const res = data[0];
          setStats({
            totalTransactions: Number(res.total_transactions) || 0,
            totalCashIn: Number(res.total_cash_in) || 0,
            totalCashOut: Number(res.total_cash_out) || 0,
            netBalance: Number(res.net_balance) || 0,
            thisMonth: Number(res.total_transactions) || 0
          });
        }
      } catch (error) {
        console.error('Error in stats fallback calculation:', error);
      }
    };
      } catch (error) {
        console.error('Error in stats fallback calculation:', error);
      }
    };

    loadStats();

    // Set up real-time subscription for stats updates
    const subscription = supabase
      .channel('user_dashboard_stats')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mt_company_transactions',
          filter: `company_id=eq.${currentCompany.id}`
        },
        () => {
          // Reload stats when transactions change with updating indicator
          loadStats(true);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentCompany, selectedMonth]);

  // Show loading state while authentication is initializing
  if (!isInitialized || authLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-foreground">Loading Dashboard...</h2>
          <p className="text-muted-foreground">Please wait while we prepare your workspace</p>
        </div>
      </div>
    );
  }

  // Show error state if no user or company
  if (!currentUser || !currentCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Users className="h-5 w-5" />
              Access Error
            </CardTitle>
            <CardDescription>
              Unable to load your dashboard. Please try logging in again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dashboardTabs = [
    { id: 'overview', label: 'Overview', icon: <Building2 className="h-4 w-4" /> },
    { id: 'transactions', label: 'Transactions', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> }
  ];

  return (
    <ErrorBoundary>
      <div className="mobile-container">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          {/* Mobile Header - Only visible on mobile */}
          <div className="lg:hidden bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <EditableCompanyName textClassName="text-lg font-bold text-gray-900 leading-tight" allowEdit={false} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  <Bell className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex">
            {/* Modern Sidebar - Desktop & Mobile Overlay */}
            <div className={`
              ${sidebarCollapsed ? 'w-0 lg:w-20' : 'w-80'}
              fixed lg:relative inset-y-0 left-0 z-40
              transform transition-all duration-300 ease-out
              ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
            `}>
              <div className="h-full bg-white/95 backdrop-blur-xl border-r border-white/20 shadow-2xl lg:shadow-none">
                {/* Sidebar Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    {!sidebarCollapsed && (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                          <Camera className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-gray-900 leading-tight">
                            {currentCompany.display_name}
                          </h2>
                          <p className="text-sm text-gray-500">User Dashboard</p>
                        </div>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="p-2 hover:bg-gray-100 rounded-xl lg:flex hidden"
                    >
                      {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSidebarCollapsed(true)}
                      className="p-2 hover:bg-gray-100 rounded-xl lg:hidden"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>



                {/* Modern Navigation */}
                <div className="flex-1 px-6 pb-6">
                  {!sidebarCollapsed && (
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">Navigation</h3>
                    </div>
                  )}

                  <nav className="space-y-2">
                    {/* Transactions */}
                    <button
                      onClick={() => navigate('/company-user/transactions')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${getActiveTab() === 'transactions'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } ${sidebarCollapsed ? 'justify-center px-3' : ''}`}
                    >
                      <div className={`p-1 rounded-lg ${getActiveTab() === 'transactions' ? 'bg-white/20' : 'bg-blue-50'}`}>
                        <CreditCard className={`h-4 w-4 ${getActiveTab() === 'transactions' ? 'text-white' : 'text-blue-600'}`} />
                      </div>
                      {!sidebarCollapsed && (
                        <div className="flex-1 text-left">
                          <div className="font-semibold">Transactions</div>
                          <div className="text-xs opacity-75">Manage cash flow</div>
                        </div>
                      )}
                      {!sidebarCollapsed && getActiveTab() === 'transactions' && (
                        <ArrowUpRight className="h-4 w-4 text-white/80" />
                      )}
                    </button>

                    {/* Targets */}
                    <button
                      onClick={() => navigate('/company-user/targets')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${getActiveTab() === 'targets'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } ${sidebarCollapsed ? 'justify-center px-3' : ''}`}
                    >
                      <div className={`p-1 rounded-lg ${getActiveTab() === 'targets' ? 'bg-white/20' : 'bg-amber-50'}`}>
                        <Target className={`h-4 w-4 ${getActiveTab() === 'targets' ? 'text-white' : 'text-amber-600'}`} />
                      </div>
                      {!sidebarCollapsed && (
                        <div className="flex-1 text-left">
                          <div className="font-semibold">Targets</div>
                          <div className="text-xs opacity-75">Goals & To-Do</div>
                        </div>
                      )}
                      {!sidebarCollapsed && getActiveTab() === 'targets' && (
                        <ArrowUpRight className="h-4 w-4 text-white/80" />
                      )}
                    </button>

                    {/* User Logs */}
                    <button
                      onClick={() => navigate('/company-user/user-logs')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${getActiveTab() === 'user-logs'
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } ${sidebarCollapsed ? 'justify-center px-3' : ''}`}
                    >
                      <div className={`p-1 rounded-lg ${getActiveTab() === 'user-logs' ? 'bg-white/20' : 'bg-green-50'}`}>
                        <Users className={`h-4 w-4 ${getActiveTab() === 'user-logs' ? 'text-white' : 'text-green-600'}`} />
                      </div>
                      {!sidebarCollapsed && (
                        <div className="flex-1 text-left">
                          <div className="font-semibold">User Logs</div>
                          <div className="text-xs opacity-75">Activity tracking</div>
                        </div>
                      )}
                      {!sidebarCollapsed && getActiveTab() === 'user-logs' && (
                        <ArrowUpRight className="h-4 w-4 text-white/80" />
                      )}
                    </button>

                    {/* Exports */}
                    <button
                      onClick={() => navigate('/company-user/exports')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${getActiveTab() === 'exports'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } ${sidebarCollapsed ? 'justify-center px-3' : ''}`}
                    >
                      <div className={`p-1 rounded-lg ${getActiveTab() === 'exports' ? 'bg-white/20' : 'bg-purple-50'}`}>
                        <Download className={`h-4 w-4 ${getActiveTab() === 'exports' ? 'text-white' : 'text-purple-600'}`} />
                      </div>
                      {!sidebarCollapsed && (
                        <div className="flex-1 text-left">
                          <div className="font-semibold">Exports</div>
                          <div className="text-xs opacity-75">Download reports</div>
                        </div>
                      )}
                      {!sidebarCollapsed && getActiveTab() === 'exports' && (
                        <ArrowUpRight className="h-4 w-4 text-white/80" />
                      )}
                    </button>

                    {/* Customer Analytics */}
                    <button
                      onClick={() => navigate('/company-user/customer-analytics')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${getActiveTab() === 'customer-analytics'
                          ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } ${sidebarCollapsed ? 'justify-center px-3' : ''}`}
                    >
                      <div className={`p-1 rounded-lg ${getActiveTab() === 'customer-analytics' ? 'bg-white/20' : 'bg-orange-50'}`}>
                        <PieChart className={`h-4 w-4 ${getActiveTab() === 'customer-analytics' ? 'text-white' : 'text-orange-600'}`} />
                      </div>
                      {!sidebarCollapsed && (
                        <div className="flex-1 text-left">
                          <div className="font-semibold">Analytics</div>
                          <div className="text-xs opacity-75">Customer insights</div>
                        </div>
                      )}
                      {!sidebarCollapsed && getActiveTab() === 'customer-analytics' && (
                        <ArrowUpRight className="h-4 w-4 text-white/80" />
                      )}
                    </button>

                    {/* Settings */}
                    <button
                      onClick={() => navigate('/company-user/settings')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${getActiveTab() === 'settings'
                          ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg shadow-gray-500/25'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } ${sidebarCollapsed ? 'justify-center px-3' : ''}`}
                    >
                      <div className={`p-1 rounded-lg ${getActiveTab() === 'settings' ? 'bg-white/20' : 'bg-gray-50'}`}>
                        <Settings className={`h-4 w-4 ${getActiveTab() === 'settings' ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      {!sidebarCollapsed && (
                        <div className="flex-1 text-left">
                          <div className="font-semibold">Settings</div>
                          <div className="text-xs opacity-75">Account settings</div>
                        </div>
                      )}
                      {!sidebarCollapsed && getActiveTab() === 'settings' && (
                        <ArrowUpRight className="h-4 w-4 text-white/80" />
                      )}
                    </button>
                  </nav>
                </div>

                {/* Sidebar Footer */}
                {!sidebarCollapsed && (
                  <div className="p-6 border-t border-gray-100">
                    <button
                      onClick={() => navigate('/company-user/settings')}
                      className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-purple-50 rounded-2xl hover:from-purple-50 hover:to-pink-50 transition-all"
                    >
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold text-gray-900">
                          {currentUser?.username || 'Company User'}
                        </div>
                        <div className="text-xs text-gray-500">View profile</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto">
              {/* Desktop Header - Hidden on mobile */}
              <div className="hidden lg:block bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-30">
                <div className="px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                          {currentCompany.display_name}
                        </h1>
                        <p className="text-sm text-gray-500">Company User Dashboard</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-xl">
                        <User className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">User View</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 hover:bg-gray-100 rounded-xl"
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Welcome Section - Modern Card Style */}
              <div className="p-4 lg:p-8">
                <div className="max-w-7xl mx-auto">
                  <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white p-6 lg:p-8 rounded-3xl mb-8 shadow-2xl shadow-purple-500/25">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                          Welcome, {currentUser.username || 'User'}!
                        </h2>
                        <p className="text-purple-100 text-lg">
                          You're logged into {currentCompany.display_name}
                        </p>
                      </div>
                    </div>
                    <p className="text-purple-200 text-sm lg:text-base">
                      Manage your transactions and view your financial activity with our modern dashboard.
                    </p>
                  </div>

                  {/* Period Selection - Modern Card Style */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-100 mb-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="text-lg font-bold text-blue-900">Period Selection</h3>
                          <p className="text-sm text-blue-600">Choose a month to view transaction history</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                          <SelectTrigger className="w-48 bg-white/80 backdrop-blur border-blue-200 text-gray-900 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto rounded-xl border-0 shadow-2xl">
                            {Array.from({ length: 6 }, (_, yearOffset) => {
                              const year = new Date().getFullYear() - 2 + yearOffset;
                              return Array.from({ length: 12 }, (_, monthIndex) => {
                                const month = monthIndex + 1;
                                const value = `${year}-${String(month).padStart(2, '0')}`;
                                const label = new Date(year, monthIndex).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long'
                                });
                                const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth() + 1;
                                return (
                                  <SelectItem
                                    key={value}
                                    value={value}
                                    className={`rounded-lg mx-1 my-0.5 ${isCurrentMonth ? 'bg-blue-50 text-blue-700 font-semibold' : ''}`}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span>{label}</span>
                                      {isCurrentMonth && (
                                        <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full ml-2">
                                          Current
                                        </Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              });
                            }).flat()}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-4 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Real-time sync • All-time stats displayed
                    </p>
                  </div>

                  {/* Activity Section - Collapsible */}
                  <Collapsible open={activityOpen} onOpenChange={setActivityOpen} className="mb-8">
                    <CollapsibleTrigger className="w-full flex items-center justify-between p-4 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 hover:bg-white transition-all shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-base font-bold text-gray-900">Activity Overview</h3>
                          <p className="text-xs text-gray-500">{activityOpen ? 'Click to collapse' : 'Click to expand stats'}</p>
                        </div>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${activityOpen ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4 relative">
                    {statsUpdating && (
                      <div className="absolute top-0 right-0 z-10">
                        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          Updating...
                        </div>
                      </div>
                    )}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Transactions</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                        <p className="text-xs text-muted-foreground">
                          +{stats.thisMonth} this month
                        </p>
                      </CardContent>
                    </Card>

                    {/* Cash In - Green Background */}
                    <ModernMobileCard className="bg-gradient-to-br from-green-500 to-green-600 border-green-400/50 text-white" hover={false}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white">Total Cash In</CardTitle>
                        <TrendingUp className="h-4 w-4 text-white" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">
                          ZMW {stats.totalCashIn.toFixed(2)}
                        </div>
                        <p className="text-xs text-white/80">
                          Total income recorded
                        </p>
                      </CardContent>
                    </ModernMobileCard>

                    {/* Cash Out - Red Background */}
                    <ModernMobileCard className="bg-gradient-to-br from-red-500 to-red-600 border-red-400/50 text-white" hover={false}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white">Total Cash Out</CardTitle>
                        <TrendingDown className="h-4 w-4 text-white" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">
                          ZMW {stats.totalCashOut.toFixed(2)}
                        </div>
                        <p className="text-xs text-white/80">
                          Total expenses recorded
                        </p>
                      </CardContent>
                    </ModernMobileCard>

                    {/* Net Balance - Light Green Background */}
                    <ModernMobileCard className="bg-gradient-to-br from-green-400 to-green-500 border-green-300/50 text-white" hover={false}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white">Net Balance</CardTitle>
                        <DollarSign className="h-4 w-4 text-white" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">
                          ZMW {stats.netBalance.toFixed(2)}
                        </div>
                        <p className="text-xs text-white/80">
                          Current balance
                        </p>
                      </CardContent>
                    </ModernMobileCard>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Main Content Tabs */}
                  <Tabs value={getActiveTab()} className="space-y-4">
                    {isMobile ? (
                      <ModernMobileTabs
                        tabs={[
                          { id: 'transactions', label: 'Transactions', icon: <DollarSign className="h-4 w-4" /> },
                          { id: 'targets', label: 'Targets', icon: <Target className="h-4 w-4" /> },
                          { id: 'user-logs', label: 'Logs', icon: <FileText className="h-4 w-4" /> },
                          { id: 'exports', label: 'Exports', icon: <Calendar className="h-4 w-4" /> },
                          { id: 'customer-analytics', label: 'Analytics', icon: <Users className="h-4 w-4" /> },
                          { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> }
                        ]}
                        activeTab={getActiveTab()}
                        onTabChange={(tabId) => navigate(`/company-user?tab=${tabId}`)}
                        className="mb-6"
                      />
                    ) : (
                      <TabsList className="grid w-full grid-cols-7">
                        <TabsTrigger value="transactions">Transactions</TabsTrigger>
                        <TabsTrigger value="targets">Targets</TabsTrigger>
                        <TabsTrigger value="user-logs">User Logs</TabsTrigger>
                        <TabsTrigger value="reports">Reports</TabsTrigger>
                        <TabsTrigger value="exports">Exports</TabsTrigger>
                        <TabsTrigger value="customer-analytics">Customer Analytics</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                      </TabsList>
                    )}



                    <TabsContent value="transactions" className="space-y-4 min-h-[600px] w-full">
                      <ErrorBoundary fallback={<MTTransactionManagerSafe />}>
                        <div className="w-full max-w-full bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl p-4 lg:p-6">
                          <MTTransactionManager selectedMonth={selectedMonth} />
                        </div>
                      </ErrorBoundary>
                    </TabsContent>

                    <TabsContent value="targets" className="space-y-4 min-h-[600px] w-full">
                      <ErrorBoundary>
                        <div className="w-full max-w-full bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl p-4 lg:p-6">
                          <CampaignTargets
                            companyId={currentCompany?.id || ''}
                            username={currentUser?.username || ''}
                            isAdmin={currentUser?.role === 'company_admin'}
                          />
                        </div>
                      </ErrorBoundary>
                    </TabsContent>

                    <TabsContent value="user-logs" className="space-y-4 min-h-[600px] w-full">
                      <ErrorBoundary>
                        <div className="w-full max-w-full bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl p-4 lg:p-6">
                          <UserLogs selectedMonth={selectedMonth} />
                        </div>
                      </ErrorBoundary>
                    </TabsContent>

                    <TabsContent value="customer-analytics" className="space-y-4">
                      <ErrorBoundary>
                        <div className="w-full max-w-full bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl p-4 lg:p-6">
                          <CustomerAnalytics selectedMonth={selectedMonth} />
                        </div>
                      </ErrorBoundary>
                    </TabsContent>

                    <TabsContent value="reports" className="space-y-4">
                      <ErrorBoundary>
                        <div className="w-full max-w-full bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl p-4 lg:p-6">
                          <TenantReports />
                        </div>
                      </ErrorBoundary>
                    </TabsContent>

                    <TabsContent value="exports" className="space-y-4">
                      <ErrorBoundary>
                        <div className="w-full max-w-full bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl p-4 lg:p-6">
                          <TenantExports />
                        </div>
                      </ErrorBoundary>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-4">
                      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl overflow-hidden p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <Card className="border-0 shadow-lg">
                            <CardHeader>
                              <CardTitle>Account Information</CardTitle>
                              <CardDescription>Your account details and company information</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-2xl space-y-2">
                                  <p><strong>Email:</strong> {currentUser.email}</p>
                                  <p><strong>Username:</strong> {currentUser.username || 'Not set'}</p>
                                  <p><strong>Role:</strong> Company User</p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <strong>Company:</strong>
                                    <EditableCompanyName textClassName="text-base font-semibold text-gray-900" />
                                  </div>
                                </div>

                                <ThemeToggle />

                                {/* Logout button moved to profile/settings */}
                                <Button
                                  onClick={handleLogout}
                                  variant="destructive"
                                  className="w-full mt-4"
                                >
                                  <LogOut className="h-4 w-4 mr-2" />
                                  Sign Out
                                </Button>
                              </div>
                            </CardContent>
                          </Card>

                          <div>
                            <UniversalPasswordChange />
                          </div>
                        </div>
                      </div>
                    </TabsContent>


                  </Tabs>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Sidebar Overlay */}
          {!sidebarCollapsed && (
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
              onClick={() => setSidebarCollapsed(true)}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
