// Company Admin Dashboard - MODERN PROFESSIONAL DESIGN
// Advanced mobile-first multi-tenant interface with premium styling

import React, { useState, useEffect } from 'react';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { MTTransactionManager } from './MTTransactionManager';
import { UserLogs } from './UserLogs';
import { Reports } from './Reports';
import { CustomerAnalytics } from './CustomerAnalytics';

import { CompanyBrandingManager } from './CompanyBrandingManager';
import { UniversalPasswordChange } from '../auth/UniversalPasswordChange';
import {
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Settings,
  Bell,
  MessageSquare,
  FileText,
  Vault,
  Download,
  Receipt,
  Building2,
  LogOut,
  Eye,
  ChevronDown,
  Camera,
  EyeOff,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Home,
  CreditCard,
  PieChart,
  Calendar,
  User,
  Layers,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export function CompanyAdminDashboardExact() {
  const { currentUser, currentCompany, signOut, isLoading, isInitialized } = useMultiTenantAuth();

  // Get company branding colors
  const primaryColor = currentCompany?.settings?.primary_color || '#3B82F6';
  const secondaryColor = currentCompany?.settings?.secondary_color || '#8B5CF6';
  const accentColor = currentCompany?.settings?.accent_color || '#10B981';

  // Define users who should see "Lighthouse Media Cashbook" instead of "Smart_Savings cashbook"
  const lighthouseMediaUsers = ['cyrus', 'confidence', 'henry', 'kelvin'];

  // Function to get dashboard title based on user
  const getDashboardTitle = () => {
    const userEmail = currentUser?.email?.toLowerCase() || '';
    const username = currentUser?.username?.toLowerCase() || '';

    // Check if user is jonahdjbreezy@gmail.com (should see Smart_Savings)
    if (userEmail === 'jonahdjbreezy@gmail.com') {
      return 'Smart_Savings Cashbook';
    }

    // Check if user is in the lighthouse media users list
    const isLighthouseUser = lighthouseMediaUsers.some(user =>
      userEmail.includes(user) || username.includes(user)
    );

    if (isLighthouseUser) {
      return 'Lighthouse Media Cashbook';
    }

    // Default to company display name
    return currentCompany?.display_name || 'Company Dashboard';
  };

  // Debug logging
  console.log('🔍 CompanyAdminDashboardExact - Auth state:', {
    currentUser: currentUser?.email,
    currentCompany: currentCompany?.display_name,
    isLoading,
    isInitialized,
    userRole: currentUser?.role,
    companySettings: currentCompany?.settings,
    metricName: currentCompany?.settings?.metric_name,
    businessType: currentCompany?.settings?.business_type,
    dashboardTitle: getDashboardTitle()
  });

  // Show loading state while authentication is initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if user or company is not available
  if (!currentUser || !currentCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">Unable to load user or company information.</p>
          <button
            onClick={() => window.location.href = '/company-login'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }
  const [currentView, setCurrentView] = useState('Trans');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  });
  const [hideBalances, setHideBalances] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Generate comprehensive month/year options
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

  // Handle month selection change with real-time database integration
  const handleMonthChange = async (newMonth: string) => {
    setSelectedMonth(newMonth);

    // Save the selected month to the database in real-time
    try {
      const apiMonth = getApiMonth(newMonth);

      console.log(`📅 Period changed to: ${newMonth} (API format: ${apiMonth})`);

      // Save to user preferences in Supabase
      if (currentUser && currentCompany) {
        const { error } = await supabase
          .from('mt_user_preferences')
          .upsert({
            user_id: currentUser.id,
            company_id: currentCompany.id,
            selected_period: apiMonth,
            selected_period_display: newMonth,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,company_id'
          });

        if (error) {
          console.error('Error saving period preference:', error);
        } else {
          console.log('✅ Period preference saved to database');
        }
      }

      // Trigger data refresh for the new period
      // This will automatically update all components that depend on the selected month

    } catch (error) {
      console.error('Error saving period selection:', error);
    }
  };

  // Always start with current month - don't load saved preferences for main dashboard
  useEffect(() => {
    const ensureCurrentMonth = () => {
      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const currentMonthDisplay = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

      // Always set to current month on component mount
      if (selectedMonth !== currentMonthDisplay) {
        setSelectedMonth(currentMonthDisplay);
        console.log('📅 Dashboard initialized to current month:', currentMonthDisplay);
      }
    };

    if (currentUser && currentCompany) {
      ensureCurrentMonth();
    }
  }, [currentUser, currentCompany]);

  // Track company settings changes for debugging
  useEffect(() => {
    if (currentCompany?.settings) {
      console.log('🎨 CompanyAdminDashboard - Company settings changed:', {
        metricName: currentCompany.settings.metric_name,
        businessType: currentCompany.settings.business_type,
        primaryColor: currentCompany.settings.primary_color,
        logoUrl: currentCompany.logo_url
      });
    }
  }, [currentCompany?.settings?.metric_name, currentCompany?.settings?.business_type, currentCompany?.settings?.primary_color, currentCompany?.logo_url]);

  const [stats, setStats] = useState({
    totalCashIn: 0,
    totalCashOut: 0,
    netBalance: 0,
    totalPictures: 0,
    totalTransactions: 0
  });

  // Load real-time company statistics
  useEffect(() => {
    const loadCompanyStats = async () => {
      if (!currentCompany) return;

      try {
        // Query database stats directly
        const { data, error } = await supabase.rpc('get_mt_company_transaction_stats', {
          p_company_id: currentCompany.id
        });

        if (error) {
          console.warn('Error loading company stats via RPC, falling back to client-side:', error);
          
          // Fallback to client-side loading
          const { data: transactions, error: txError } = await supabase
            .from('mt_company_transactions')
            .select('type, amount, number_of_pictures')
            .eq('company_id', currentCompany.id);

          if (txError) {
            console.error('Error loading fallback company transactions:', txError);
            return;
          }

          const cashInTransactions = transactions?.filter(t => t.type === 'cash-in') || [];
          const cashOutTransactions = transactions?.filter(t => t.type === 'cash-out') || [];

          const totalCashIn = cashInTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
          const totalCashOut = cashOutTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
          const netBalance = totalCashIn - totalCashOut;
          const totalPictures = cashInTransactions.reduce((sum, t) => sum + Number(t.number_of_pictures || 0), 0);

          setStats({
            totalCashIn,
            totalCashOut,
            netBalance,
            totalPictures,
            totalTransactions: transactions?.length || 0
          });
          return;
        }

        if (data && data.length > 0) {
          const res = data[0];
          setStats({
            totalCashIn: Number(res.total_cash_in) || 0,
            totalCashOut: Number(res.total_cash_out) || 0,
            netBalance: Number(res.net_balance) || 0,
            totalPictures: Number(res.total_pictures) || 0,
            totalTransactions: Number(res.total_transactions) || 0
          });
        }

      } catch (error) {
        console.error('Error calculating company stats:', error);
      }
    };

    loadCompanyStats();

    // Set up real-time subscription for transaction updates
    const channel = supabase
      .channel('company-transactions')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mt_company_transactions',
          filter: `company_id=eq.${currentCompany?.id}`
        },
        () => {
          console.log('Company transaction updated, reloading stats...');
          loadCompanyStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentCompany]);

  const handleLogout = async () => {
    console.log('🔄 Company admin logging out...');
    await signOut();
    window.location.href = '/'; // Redirect to Smart vault login page
  };

  return (
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
              {currentCompany?.logo_url ? (
                <img
                  src={currentCompany.logo_url}
                  alt="Company Logo"
                  className="h-8 w-8 object-contain rounded-lg"
                />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">
                  {getDashboardTitle()}
                </h1>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setHideBalances(!hideBalances)}
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-100 rounded-xl"
          >
            {hideBalances ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </Button>
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
                    {currentCompany?.logo_url ? (
                      <img
                        src={currentCompany.logo_url}
                        alt="Company Logo"
                        className="h-10 w-10 object-contain rounded-xl"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 leading-tight">
                        {getDashboardTitle()}
                      </h2>
                      <p className="text-sm text-gray-500">Admin Dashboard</p>
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

            {/* Period Selection - Modern Card Style */}
            {!sidebarCollapsed && (
              <div className="p-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-blue-900">Period Selection</h3>
                  </div>
                  <Select value={selectedMonth} onValueChange={handleMonthChange}>
                    <SelectTrigger className="w-full bg-white/80 backdrop-blur border-blue-200 text-gray-900 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto rounded-xl border-0 shadow-2xl">
                      {monthOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className={`
                            rounded-lg mx-1 my-0.5
                            ${option.isCurrent ? 'bg-blue-50 text-blue-700 font-semibold' : ''}
                            ${option.isFuture ? 'text-green-600' : ''}
                            ${option.isPast ? 'text-gray-600' : ''}
                          `}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{option.label}</span>
                            {option.isCurrent && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                Current
                              </Badge>
                            )}
                            {option.isFuture && (
                              <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                                Future
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Real-time sync • 2020-{new Date().getFullYear() + 5}
                  </p>
                </div>
              </div>
            )}

            {/* Modern Navigation */}
            <div className="flex-1 px-6 pb-6">
              {!sidebarCollapsed && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">Navigation</h3>
                </div>
              )}

              <nav className="space-y-2">
                {/* Dashboard/Transactions */}
                <button
                  onClick={() => setCurrentView('Trans')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    currentView === 'Trans'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${sidebarCollapsed ? 'justify-center px-3' : ''}`}
                  title={sidebarCollapsed ? "Transactions" : ""}
                >
                  <div className={`p-1 rounded-lg ${currentView === 'Trans' ? 'bg-white/20' : 'bg-blue-50'}`}>
                    <CreditCard className={`h-4 w-4 ${currentView === 'Trans' ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Transactions</div>
                      <div className="text-xs opacity-75">Manage cash flow</div>
                    </div>
                  )}
                  {!sidebarCollapsed && currentView === 'Trans' && (
                    <ArrowUpRight className="h-4 w-4 text-white/80" />
                  )}
                </button>

                {/* User Logs */}
                <button
                  onClick={() => setCurrentView('User Logs')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    currentView === 'User Logs'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${sidebarCollapsed ? 'justify-center px-3' : ''}`}
                  title={sidebarCollapsed ? "User Logs" : ""}
                >
                  <div className={`p-1 rounded-lg ${currentView === 'User Logs' ? 'bg-white/20' : 'bg-green-50'}`}>
                    <Users className={`h-4 w-4 ${currentView === 'User Logs' ? 'text-white' : 'text-green-600'}`} />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 text-left">
                      <div className="font-semibold">User Logs</div>
                      <div className="text-xs opacity-75">Activity tracking</div>
                    </div>
                  )}
                  {!sidebarCollapsed && currentView === 'User Logs' && (
                    <ArrowUpRight className="h-4 w-4 text-white/80" />
                  )}
                </button>

                {/* Reports */}
                <button
                  onClick={() => setCurrentView('Reports')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    currentView === 'Reports'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${sidebarCollapsed ? 'justify-center px-3' : ''}`}
                  title={sidebarCollapsed ? "Reports" : ""}
                >
                  <div className={`p-1 rounded-lg ${currentView === 'Reports' ? 'bg-white/20' : 'bg-purple-50'}`}>
                    <BarChart3 className={`h-4 w-4 ${currentView === 'Reports' ? 'text-white' : 'text-purple-600'}`} />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Reports</div>
                      <div className="text-xs opacity-75">Analytics & insights</div>
                    </div>
                  )}
                  {!sidebarCollapsed && currentView === 'Reports' && (
                    <ArrowUpRight className="h-4 w-4 text-white/80" />
                  )}
                </button>

                {/* Customer Analytics */}
                <button
                  onClick={() => setCurrentView('Customer Analytics')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    currentView === 'Customer Analytics'
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${sidebarCollapsed ? 'justify-center px-3' : ''}`}
                  title={sidebarCollapsed ? "Customer Analytics" : ""}
                >
                  <div className={`p-1 rounded-lg ${currentView === 'Customer Analytics' ? 'bg-white/20' : 'bg-orange-50'}`}>
                    <PieChart className={`h-4 w-4 ${currentView === 'Customer Analytics' ? 'text-white' : 'text-orange-600'}`} />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Customer Analytics</div>
                      <div className="text-xs opacity-75">Customer insights</div>
                    </div>
                  )}
                  {!sidebarCollapsed && currentView === 'Customer Analytics' && (
                    <ArrowUpRight className="h-4 w-4 text-white/80" />
                  )}
                </button>

                {/* Company Branding */}
                <button
                  onClick={() => setCurrentView('Company Branding')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    currentView === 'Company Branding'
                      ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${sidebarCollapsed ? 'justify-center px-3' : ''}`}
                  title={sidebarCollapsed ? "Company Branding" : ""}
                >
                  <div className={`p-1 rounded-lg ${currentView === 'Company Branding' ? 'bg-white/20' : 'bg-indigo-50'}`}>
                    <Layers className={`h-4 w-4 ${currentView === 'Company Branding' ? 'text-white' : 'text-indigo-600'}`} />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Company Branding</div>
                      <div className="text-xs opacity-75">Brand settings</div>
                    </div>
                  )}
                  {!sidebarCollapsed && currentView === 'Company Branding' && (
                    <ArrowUpRight className="h-4 w-4 text-white/80" />
                  )}
                </button>

                {/* Change Password */}
                <button
                  onClick={() => setCurrentView('Change Password')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    currentView === 'Change Password'
                      ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg shadow-gray-500/25'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${sidebarCollapsed ? 'justify-center px-3' : ''}`}
                  title={sidebarCollapsed ? "Change Password" : ""}
                >
                  <div className={`p-1 rounded-lg ${currentView === 'Change Password' ? 'bg-white/20' : 'bg-gray-50'}`}>
                    <Shield className={`h-4 w-4 ${currentView === 'Change Password' ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Security</div>
                      <div className="text-xs opacity-75">Change password</div>
                    </div>
                  )}
                  {!sidebarCollapsed && currentView === 'Change Password' && (
                    <ArrowUpRight className="h-4 w-4 text-white/80" />
                  )}
                </button>
              </nav>
            </div>

            {/* Sidebar Footer */}
            {!sidebarCollapsed && (
              <div className="p-6 border-t border-gray-100">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">
                      {currentUser?.username || 'Admin User'}
                    </div>
                    <div className="text-xs text-gray-500">Company Administrator</div>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
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
                  {currentCompany?.logo_url ? (
                    <img
                      src={currentCompany.logo_url}
                      alt="Company Logo"
                      className="h-12 w-12 object-contain rounded-2xl"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                      {getDashboardTitle()}
                    </h1>
                    <p className="text-sm text-gray-500">Company Admin Dashboard</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Admin View</span>
                  </div>
                  <Button
                    onClick={() => setHideBalances(!hideBalances)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 rounded-xl border-gray-200 hover:bg-gray-50"
                  >
                    {hideBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {hideBalances ? 'Show' : 'Hide'} Balances
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Header with Period Info */}
          <div className="px-4 lg:px-8 py-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedMonth}</h2>
                <p className="text-sm text-gray-600">Financial Overview & Management</p>
              </div>
              <div className="lg:hidden">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 rounded-xl"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content - Modern Container */}
          <div className="p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {currentView === 'User Logs' ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl overflow-hidden">
                  <UserLogs selectedMonth={getApiMonth(selectedMonth)} />
                </div>
              ) : currentView === 'Reports' ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl overflow-hidden">
                  <Reports selectedMonth={getApiMonth(selectedMonth)} />
                </div>
              ) : currentView === 'Customer Analytics' ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl overflow-hidden">
                  <CustomerAnalytics selectedMonth={getApiMonth(selectedMonth)} />
                </div>
              ) : currentView === 'Company Branding' ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl overflow-hidden">
                  <CompanyBrandingManager />
                </div>
              ) : currentView === 'Change Password' ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl overflow-hidden">
                  <UniversalPasswordChange />
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl overflow-hidden">
                  <MTTransactionManager
                    key={`${currentCompany?.settings?.metric_name}-${currentCompany?.settings?.business_type}-${currentCompany?.logo_url}`}
                    hideBalances={hideBalances}
                    selectedMonth={getApiMonth(selectedMonth)}
                  />
                </div>
              )}
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
  );
}
