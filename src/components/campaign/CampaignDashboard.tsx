// Campaign Dashboard - Complete Admin System Replica
// This replicates the entire existing admin system but for individual campaigns

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  Menu,
  User,
  Home
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { supabase } from '@/integrations/supabase/client';
import { CampaignLayout } from './CampaignLayout';
import { CampaignViews } from './CampaignViews';
import { CampaignTransactionView } from './CampaignTransactionView';
import { CampaignAnalytics } from './CampaignAnalytics';

interface CampaignStats {
  totalTransactions: number;
  totalCashIn: number;
  totalCashOut: number;
  netBalance: number;
  activeUsers: number;
  totalPictures: number;
  thisMonthTransactions: number;
  lastMonthTransactions: number;
  recentTransactions: any[];
}

interface CampaignDashboardProps {
  campaignId: string;
  campaignName: string;
  onBackToCampaigns?: () => void;
}

export function CampaignDashboard({ campaignId, campaignName, onBackToCampaigns }: CampaignDashboardProps) {
  // Note: We're not using multi-tenant auth for campaigns, this is for the main system
  // const { currentUser, currentCompany, signOut } = useMultiTenantAuth();

  console.log('🎯 CampaignDashboard props:', { campaignId, campaignName });
  const location = useLocation();
  const [currentView, setCurrentView] = useState<'home' | 'transactions' | 'users' | 'logs' | 'userlogs' | 'settings' | 'reports' | 'cashvault' | 'analytics' | 'exports' | 'usersummary' | 'invoices'>('home');
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  
  const [stats, setStats] = useState<CampaignStats>({
    totalTransactions: 0,
    totalCashIn: 0,
    totalCashOut: 0,
    netBalance: 0,
    activeUsers: 0,
    totalPictures: 0,
    thisMonthTransactions: 0,
    lastMonthTransactions: 0,
    recentTransactions: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Determine current view based on URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/transactions')) setCurrentView('transactions');
    else if (path.includes('/users')) setCurrentView('users');
    else if (path.includes('/logs')) setCurrentView('logs');
    else if (path.includes('/userlogs')) setCurrentView('userlogs');
    else if (path.includes('/settings')) setCurrentView('settings');
    else if (path.includes('/reports')) setCurrentView('reports');
    else if (path.includes('/cashvault')) setCurrentView('cashvault');
    else if (path.includes('/analytics')) setCurrentView('analytics');
    else if (path.includes('/exports')) setCurrentView('exports');
    else if (path.includes('/usersummary')) setCurrentView('usersummary');
    else if (path.includes('/invoices')) setCurrentView('invoices');
    else setCurrentView('home');
  }, [location.pathname]);

  // Load campaign statistics with real-time subscription
  useEffect(() => {
    if (campaignId) {
      console.log('🔄 Loading stats for campaign:', campaignId);
      loadCampaignStats();

      // Set up real-time subscription for campaign transactions
      const subscription = supabase
        .channel(`campaign_dashboard_${campaignId}`)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'campaign_transactions',
            filter: `company_id=eq.${campaignId}`
          },
          (payload) => {
            console.log('🔄 Campaign Dashboard: Real-time transaction update received:', payload);
            // Reload stats when transactions change
            loadCampaignStats();
          }
        )
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'mt_company_transactions',
            filter: `company_id=eq.${campaignId}`
          },
          (payload) => {
            console.log('🔄 Campaign Dashboard: Real-time MT transaction update received:', payload);
            // Reload stats when MT transactions change
            loadCampaignStats();
          }
        )
        .subscribe((status) => {
          console.log('📊 Campaign Dashboard real-time subscription status:', status);
        });

      // Cleanup subscription on unmount
      return () => {
        console.log('🧹 Cleaning up campaign dashboard real-time subscription');
        subscription.unsubscribe();
      };
    } else {
      console.log('❌ No campaignId provided');
      setIsLoading(false);
    }
  }, [campaignId, selectedYear, selectedMonth]);

  const loadCampaignStats = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading campaign stats for:', campaignId);

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );

      // Load real campaign data from database
      const dataPromise = supabase
        .from('campaign_transactions')
        .select('*')
        .eq('campaign_id', campaignId);

      const { data: transactions, error } = await Promise.race([dataPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Error loading campaign stats:', error);
        // Set default stats if error
        setStats({
          totalTransactions: 0,
          totalCashIn: 0,
          totalCashOut: 0,
          netBalance: 0,
          activeUsers: 0,
          totalPictures: 0,
          thisMonthTransactions: 0,
          lastMonthTransactions: 0,
          recentTransactions: []
        });
      } else {
        console.log('✅ Loaded campaign transactions:', transactions?.length || 0);

        // Calculate stats from real data
        const totalCashIn = transactions?.filter(t => t.type === 'cash-in').reduce((sum, t) => sum + t.amount, 0) || 0;
        const totalCashOut = transactions?.filter(t => t.type === 'cash-out').reduce((sum, t) => sum + t.amount, 0) || 0;
        const totalPictures = transactions?.reduce((sum, t) => sum + (t.number_of_pictures || 0), 0) || 0;

        setStats({
          totalTransactions: transactions?.length || 0,
          totalCashIn,
          totalCashOut,
          netBalance: totalCashIn - totalCashOut,
          activeUsers: 1, // For now
          totalPictures,
          thisMonthTransactions: transactions?.filter(t => {
            const transactionDate = new Date(t.created_at);
            const now = new Date();
            return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
          }).length || 0,
          lastMonthTransactions: 0, // Calculate if needed
          recentTransactions: transactions?.slice(0, 5) || []
        });
      }
    } catch (error) {
      console.error('❌ Error in loadCampaignStats:', error);
      // Set default stats if error
      setStats({
        totalTransactions: 0,
        totalCashIn: 0,
        totalCashOut: 0,
        netBalance: 0,
        activeUsers: 0,
        totalPictures: 0,
        thisMonthTransactions: 0,
        lastMonthTransactions: 0,
        recentTransactions: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // For campaigns, we go back to campaign selector or main system
      if (onBackToCampaigns) {
        onBackToCampaigns();
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  const handleViewChange = (view: typeof currentView) => {
    setCurrentView(view);
    // Update URL without page reload
    const newPath = view === 'home' ? '/company-admin' : `/company-admin/${view}`;
    window.history.pushState({}, '', newPath);
  };

  const handleExportPDF = () => {
    console.log('Exporting campaign data to PDF...');
    // Implement PDF export functionality
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading Campaign Dashboard...</h2>
          <p className="text-gray-600">Please wait while we prepare your workspace</p>
        </div>
      </div>
    );
  }

  // Show error state if no campaign
  if (!campaignId || !campaignName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Users className="h-5 w-5" />
              Campaign Error
            </CardTitle>
            <CardDescription>
              Unable to load campaign dashboard. Please select a campaign.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={onBackToCampaigns || (() => window.location.href = '/')}
              className="w-full"
            >
              Back to Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If home view is selected, render campaign home page
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Campaign Home Page */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 text-white">
          <div className="container mx-auto px-6 py-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  📸 {campaignName}
                </h1>
                <p className="text-blue-100 text-lg">
                  Campaign Management Dashboard
                </p>
                <p className="text-blue-200 text-sm">
                  Smart Savings - Cashbook Campaign System
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="text-white border-white hover:bg-white hover:text-blue-600"
                  onClick={() => handleViewChange('transactions')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Transactions
                </Button>
                <Button 
                  variant="outline" 
                  className="text-white border-white hover:bg-white hover:text-blue-600"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>

            {/* Stats Grid - Resized for Mobile */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8 mobile-balance-grid">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 mobile-balance-item">
                <CardContent className="p-3 md:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs md:text-sm font-medium">Transactions</p>
                      <p className="text-lg md:text-2xl lg:text-3xl font-bold text-white">{stats.totalTransactions}</p>
                    </div>
                    <FileText className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 mobile-balance-item">
                <CardContent className="p-3 md:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-xs md:text-sm font-medium">Cash In</p>
                      <p className="text-lg md:text-2xl lg:text-3xl font-bold text-white">${stats.totalCashIn.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 mobile-balance-item">
                <CardContent className="p-3 md:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-xs md:text-sm font-medium">Cash Out</p>
                      <p className="text-lg md:text-2xl lg:text-3xl font-bold text-white">${stats.totalCashOut.toLocaleString()}</p>
                    </div>
                    <TrendingDown className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 mobile-balance-item">
                <CardContent className="p-3 md:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-xs md:text-sm font-medium">Net Balance</p>
                      <p className="text-lg md:text-2xl lg:text-3xl font-bold text-white">${stats.netBalance.toLocaleString()}</p>
                    </div>
                    <DollarSign className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                className="h-20 flex-col bg-white/20 hover:bg-white/30 border-white/30"
                onClick={() => handleViewChange('transactions')}
              >
                <FileText className="h-6 w-6 mb-2" />
                Transactions
              </Button>
              <Button 
                className="h-20 flex-col bg-white/20 hover:bg-white/30 border-white/30"
                onClick={() => handleViewChange('users')}
              >
                <Users className="h-6 w-6 mb-2" />
                Users
              </Button>
              <Button 
                className="h-20 flex-col bg-white/20 hover:bg-white/30 border-white/30"
                onClick={() => handleViewChange('reports')}
              >
                <BarChart3 className="h-6 w-6 mb-2" />
                Reports
              </Button>
              <Button 
                className="h-20 flex-col bg-white/20 hover:bg-white/30 border-white/30"
                onClick={() => handleViewChange('settings')}
              >
                <Settings className="h-6 w-6 mb-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render main campaign dashboard with layout
  return (
    <CampaignLayout
      selectedYear={selectedYear}
      selectedMonth={selectedMonth}
      onYearChange={setSelectedYear}
      onMonthChange={setSelectedMonth}
      currentView={currentView}
      onViewChange={handleViewChange}
      onExportPDF={handleExportPDF}
      onLogout={handleLogout}
      isAdmin={true} // Campaign admins have full admin rights
      showSidebar={showSidebar}
      onToggleSidebar={() => setShowSidebar(!showSidebar)}
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebarCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      campaignName={campaignName || 'Campaign'}
    >
      {/* Content based on current view */}
      {currentView === 'transactions' ? (
        <CampaignTransactionView
          campaignId={campaignId}
          stats={stats}
        />
      ) : currentView === 'analytics' ? (
        <CampaignAnalytics
          campaignId={campaignId}
          stats={stats}
        />
      ) : (
        <CampaignViews
          currentView={currentView as any}
          campaignId={campaignId}
          stats={stats}
        />
      )}
    </CampaignLayout>
  );
}
