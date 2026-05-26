// Reports Component - Advanced graph reports for performance analysis
// Shows year, month, days, weeks performance in advanced graph format

import React, { useState, useEffect } from 'react';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  PieChart,
  LineChart,
  Activity,
  Camera,
  Users,
  Brain,
  Download
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ProgressVisualization } from '@/components/ProgressVisualization';
import { SmartAnalysis } from '@/components/smart-analysis/SmartAnalysis';
import { exportElementsToPDF } from '@/utils/universalChartExport';
import { useToast } from '@/hooks/use-toast';

interface ReportData {
  period: string;
  cashIn: number;
  cashOut: number;
  netBalance: number;
  transactions: number;
}

interface ChartData {
  labels: string[];
  cashInData: number[];
  cashOutData: number[];
  netBalanceData: number[];
}

interface ReportsProps {
  selectedMonth?: string;
}

type ReportView = 'monthly' | 'progress' | 'smart';

export function Reports({ selectedMonth }: ReportsProps) {
  // Hooks must be called at the top level, not inside try-catch
  const { currentUser, currentCompany, isLoading: authLoading, isInitialized } = useMultiTenantAuth();

  // Simple Smart Analysis access check - only for jonahdjbreezy@gmail.com
  const hasSmartAnalysisAccess = currentUser?.email === 'jonahdjbreezy@gmail.com';

  // Debug logging
  console.log('🔍 Reports - Props and auth state:', {
    selectedMonth,
    currentUser: currentUser?.email,
    currentCompany: currentCompany?.display_name,
    companyId: currentCompany?.id,
    authLoading,
    isInitialized,
    hasSmartAnalysisAccess
  });
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [chartData, setChartData] = useState<ChartData>({ labels: [], cashInData: [], cashOutData: [], netBalanceData: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<'days' | 'weeks' | 'months' | 'year' | 'specific-month' | 'all-time'>('months');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSpecificMonth, setSelectedSpecificMonth] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [allTimeStats, setAllTimeStats] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ReportView>('monthly');
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (isInitialized && currentCompany?.id) {
      loadReportData();
      fetchTransactions();
      const cleanup = setupRealTimeSubscription();
      return cleanup;
    } else if (isInitialized && !currentCompany) {
      setError('No company selected');
      setIsLoading(false);
    }
  }, [currentCompany, timeFrame, selectedYear, selectedMonth, selectedSpecificMonth, isInitialized]);

  // Redirect users without Smart Analysis access away from 'smart' view
  useEffect(() => {
    if (currentView === 'smart' && !hasSmartAnalysisAccess) {
      console.log('User does not have Smart Analysis access, redirecting to monthly view');
      setCurrentView('monthly');
    }
  }, [currentView, hasSmartAnalysisAccess]);

  const fetchTransactions = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from('mt_company_transactions')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Real-time subscription for automatic updates
  const setupRealTimeSubscription = () => {
    if (!currentCompany?.id) {
      console.warn('Reports: Cannot setup real-time subscription - no company ID');
      return () => {};
    }

    const subscription = supabase
      .channel('reports_real_time')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mt_company_transactions',
          filter: `company_id=eq.${currentCompany.id}`
        },
        (payload) => {
          console.log('Reports: Real-time update received:', payload);
          // Reload data when transactions change
          loadReportData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const loadReportData = async () => {
    if (!currentCompany?.id) {
      console.warn('Reports: Cannot load data - no company ID');
      setError('No company selected');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('mt_company_transactions')
        .select('*')
        .eq('company_id', currentCompany.id);

      // Apply date filters based on timeFrame and selections
      if (timeFrame === 'specific-month' && selectedSpecificMonth) {
        // Filter by specific month (e.g., "2024-01" for January 2024)
        const [year, month] = selectedSpecificMonth.split('-');
        const startDate = `${selectedSpecificMonth}-01`;
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        query = query.gte('date', startDate).lte('date', endDate);
        console.log(`📊 Reports: Filtering for specific month ${selectedSpecificMonth} (${startDate} to ${endDate})`);
      } else if (timeFrame === 'all-time') {
        // No date filter for all-time reports
        console.log('Loading all-time reports for company:', currentCompany.id);
      } else if (selectedMonth) {
        // Legacy support for selectedMonth prop
        const [year, month] = selectedMonth.split('-');
        const startDate = `${selectedMonth}-01`;
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        query = query.gte('date', startDate).lte('date', endDate);
        console.log(`📊 Reports: Filtering for legacy month ${selectedMonth} (${startDate} to ${endDate})`);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;

      const processedData = processDataByTimeFrame(data || []);
      setReportData(processedData);
      setChartData(formatChartData(processedData));

      // Load all-time stats if in all-time mode
      if (timeFrame === 'all-time') {
        const allTimeData = await getAllTimeStats();
        setAllTimeStats(allTimeData);
      }

      console.log('Reports: Loaded', data?.length || 0, 'transactions');
    } catch (error) {
      console.error('Error loading report data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const processDataByTimeFrame = (transactions: any[]): ReportData[] => {
    const grouped: { [key: string]: any[] } = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.created_at);
      let key = '';

      switch (timeFrame) {
        case 'days':
          // Last 30 days
          key = date.toISOString().split('T')[0];
          break;
        case 'weeks':
          // Last 12 weeks
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'months':
          // Last 12 months
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          // Last 5 years
          key = date.getFullYear().toString();
          break;
        case 'specific-month':
          // Group by days within the selected month
          key = date.toISOString().split('T')[0];
          break;
        case 'all-time':
          // Group by months for all-time view
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(transaction);
    });

    return Object.entries(grouped).map(([period, transactions]) => {
      const cashIn = transactions
        .filter(t => t.type === 'cash-in')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const cashOut = transactions
        .filter(t => t.type === 'cash-out')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      return {
        period,
        cashIn,
        cashOut,
        netBalance: cashIn - cashOut,
        transactions: transactions.length
      };
    }).sort((a, b) => a.period.localeCompare(b.period));
  };

  const formatChartData = (data: ReportData[]): ChartData => {
    return {
      labels: data.map(d => formatPeriodLabel(d.period)),
      cashInData: data.map(d => d.cashIn),
      cashOutData: data.map(d => d.cashOut),
      netBalanceData: data.map(d => d.netBalance)
    };
  };

  const formatPeriodLabel = (period: string): string => {
    switch (timeFrame) {
      case 'days':
      case 'specific-month':
        return new Date(period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'weeks':
        return `Week of ${new Date(period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'months':
      case 'all-time':
        const [year, month] = period.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      case 'year':
        return period;
      default:
        return period;
    }
  };

  const getTotalStats = () => {
    const totals = reportData.reduce(
      (acc, curr) => ({
        cashIn: acc.cashIn + curr.cashIn,
        cashOut: acc.cashOut + curr.cashOut,
        transactions: acc.transactions + curr.transactions
      }),
      { cashIn: 0, cashOut: 0, transactions: 0 }
    );

    return {
      ...totals,
      netBalance: totals.cashIn - totals.cashOut
    };
  };

  // All-time comprehensive statistics
  const getAllTimeStats = async () => {
    if (!currentCompany?.id) return null;

    try {
      const { data: allTransactions, error } = await supabase
        .from('mt_company_transactions')
        .select('*')
        .eq('company_id', currentCompany.id);

      if (error) throw error;

      const stats = {
        totalTransactions: allTransactions?.length || 0,
        totalCashIn: allTransactions?.filter(t => t.type === 'cash-in').reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
        totalCashOut: allTransactions?.filter(t => t.type === 'cash-out').reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
        totalPictures: allTransactions?.filter(t => t.type === 'cash-in' && t.picture_url).length || 0,
        uniqueCustomers: new Set(allTransactions?.filter(t => t.whatsapp_number).map(t => t.whatsapp_number)).size || 0,
        totalCategories: new Set(allTransactions?.map(t => t.category_name)).size || 0,
        firstTransaction: allTransactions?.length > 0 ? new Date(Math.min(...allTransactions.map(t => new Date(t.created_at).getTime()))) : null,
        lastTransaction: allTransactions?.length > 0 ? new Date(Math.max(...allTransactions.map(t => new Date(t.created_at).getTime()))) : null,
        averageTransactionAmount: allTransactions?.length > 0 ? (allTransactions.reduce((sum, t) => sum + (t.amount || 0), 0) / allTransactions.length) : 0,
        largestTransaction: allTransactions?.length > 0 ? Math.max(...allTransactions.map(t => t.amount || 0)) : 0,
        smallestTransaction: allTransactions?.length > 0 ? Math.min(...allTransactions.map(t => t.amount || 0)) : 0
      };

      return {
        ...stats,
        netBalance: stats.totalCashIn - stats.totalCashOut,
        operatingDays: stats.firstTransaction && stats.lastTransaction ?
          Math.ceil((stats.lastTransaction.getTime() - stats.firstTransaction.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0
      };
    } catch (error) {
      console.error('Error calculating all-time stats:', error);
      return null;
    }
  };

  const exportToPDF = async () => {
    if (!currentCompany) return;

    setIsLoading(true);
    try {
      // Get the current report content
      const reportElement = document.querySelector('.reports-content');
      if (!reportElement) {
        throw new Error('Report content not found');
      }

      await exportElementsToPDF(
        [reportElement as HTMLElement],
        `${currentCompany.display_name}_Reports_${new Date().toISOString().split('T')[0]}`,
        undefined,
        [`${currentCompany.display_name} - Reports Export`]
      );

      toast({
        title: "Export Complete",
        description: "Your reports have been exported to PDF successfully.",
      });

    } catch (error) {
      console.error('Error exporting reports:', error);
      toast({
        title: "Error",
        description: "Failed to export reports",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMaxValue = () => {
    const allValues = [...chartData.cashInData, ...chartData.cashOutData];
    return Math.max(...allValues, 0);
  };

  // Show loading state while authentication is initializing
  if (!isInitialized || authLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error if user or company is not available
  if (!currentUser || !currentCompany) {
    console.log('🚨 Reports - Missing auth data:', { currentUser: !!currentUser, currentCompany: !!currentCompany });
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600">Authentication required</p>
            <p className="text-gray-500 text-sm mt-2">
              {!currentUser ? 'Please sign in to view reports.' : 'No company selected.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600">Error loading reports</p>
            <p className="text-gray-500 text-sm mt-2">{error}</p>
            <button
              onClick={() => {
                setError(null);
                loadReportData();
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalStats = getTotalStats();
  const maxValue = getMaxValue();

  console.log('🔍 Reports - About to render, currentView:', currentView);

  // Simple test to ensure component renders
  if (!currentView) {
    console.log('🚨 Reports - No currentView set, defaulting to monthly');
    setCurrentView('monthly');
  }

  return (
    <div className="space-y-6 reports-content">
      {/* Debug info */}
      <div className="text-xs text-gray-500 p-2 bg-yellow-50 rounded">
        Debug: currentView={currentView}, hasSmartAnalysisAccess={hasSmartAnalysisAccess ? 'true' : 'false'}
      </div>

      {/* Navigation Tabs - EXACT Legacy Style */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setCurrentView('monthly')}
          className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            currentView === 'monthly'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Monthly Reports
        </button>
        <button
          onClick={() => setCurrentView('progress')}
          className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            currentView === 'progress'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <LineChart className="w-4 h-4 mr-2" />
          Progress Visualization
        </button>
        {hasSmartAnalysisAccess && (
          <button
            onClick={() => setCurrentView('smart')}
            className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              currentView === 'smart'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Brain className="w-4 h-4 mr-2" />
            Smart Analysis
          </button>
        )}
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={exportToPDF}
          disabled={isLoading}
        >
          <Download className="w-4 h-4" />
          {isLoading ? 'Exporting...' : 'Export to PDF'}
        </Button>
      </div>

      {/* Tab Content */}
      {currentView === 'monthly' && (
        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Performance Reports
              </CardTitle>
              <CardDescription>
                Advanced analytics and performance graphs for {currentCompany.display_name}
              </CardDescription>
            </CardHeader>
          </Card>

      {/* Period Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Period Selection
          </CardTitle>
          <CardDescription>
            Choose your preferred time period and view mode
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Time Frame Selection */}
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-sm font-medium mb-2 block">View Mode</label>
              <Select value={timeFrame} onValueChange={(value: any) => setTimeFrame(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Last 30 Days</SelectItem>
                  <SelectItem value="weeks">Last 12 Weeks</SelectItem>
                  <SelectItem value="months">Last 12 Months</SelectItem>
                  <SelectItem value="year">Last 5 Years</SelectItem>
                  <SelectItem value="specific-month">Specific Month</SelectItem>
                  <SelectItem value="all-time">All Time Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={loadReportData} variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>

          {/* Month Segment Selector - Always Visible */}
          <div>
            <label className="text-sm font-medium mb-3 block">Quick Month Selection</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {Array.from({ length: 12 }, (_, i) => {
                const month = i + 1;
                const monthStr = month.toString().padStart(2, '0');
                const monthValue = `${selectedYear}-${monthStr}`;
                const monthName = new Date(selectedYear, i).toLocaleDateString('en-US', { month: 'short' });
                const isSelected = selectedSpecificMonth === monthValue ||
                  (timeFrame === 'specific-month' && selectedSpecificMonth === monthValue);

                return (
                  <button
                    key={monthValue}
                    onClick={() => {
                      setSelectedSpecificMonth(monthValue);
                      setTimeFrame('specific-month');
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {monthName}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click any month to view its specific data and transactions
            </p>
          </div>

          {/* Dropdown Month Selection - Show when specific-month is selected */}
          {timeFrame === 'specific-month' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Selected Month Details</label>
              <Select value={selectedSpecificMonth} onValueChange={setSelectedSpecificMonth}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Choose a month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1;
                    const monthStr = month.toString().padStart(2, '0');
                    const monthValue = `${selectedYear}-${monthStr}`;
                    const monthName = new Date(selectedYear, i).toLocaleDateString('en-US', { month: 'long' });
                    return (
                      <SelectItem key={monthValue} value={monthValue}>
                        {monthName} {selectedYear}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Cash In</p>
                <p className="text-xl font-bold text-green-600">ZMW {totalStats.cashIn.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Total Cash Out</p>
                <p className="text-xl font-bold text-red-600">ZMW {totalStats.cashOut.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Net Balance</p>
                <p className={`text-xl font-bold ${totalStats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ZMW {totalStats.netBalance.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-xl font-bold text-purple-600">{totalStats.transactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All-Time Comprehensive Reports - Only show when "All Time Reports" is selected */}
      {timeFrame === 'all-time' && allTimeStats && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                All-Time Comprehensive Reports
              </CardTitle>
              <CardDescription>
                Complete business overview since inception for {currentCompany.display_name}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* All-Time Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Cash In</p>
                    <p className="text-xl font-bold text-green-600">ZMW {allTimeStats.totalCashIn.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Cash Out</p>
                    <p className="text-xl font-bold text-red-600">ZMW {allTimeStats.totalCashOut.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Net Balance</p>
                    <p className={`text-xl font-bold ${allTimeStats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ZMW {allTimeStats.netBalance.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Transactions</p>
                    <p className="text-xl font-bold text-blue-600">{allTimeStats.totalTransactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional All-Time Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Pictures</p>
                    <p className="text-xl font-bold text-orange-600">{allTimeStats.totalPictures}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm text-gray-600">Unique Customers</p>
                    <p className="text-xl font-bold text-indigo-600">{allTimeStats.uniqueCustomers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-pink-600" />
                  <div>
                    <p className="text-sm text-gray-600">Categories Used</p>
                    <p className="text-xl font-bold text-pink-600">{allTimeStats.totalCategories}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-teal-600" />
                  <div>
                    <p className="text-sm text-gray-600">Operating Days</p>
                    <p className="text-xl font-bold text-teal-600">{allTimeStats.operatingDays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Average Transaction</p>
                    <p className="text-xl font-bold text-green-600">ZMW {allTimeStats.averageTransactionAmount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Largest Transaction</p>
                    <p className="text-xl font-bold text-blue-600">ZMW {allTimeStats.largestTransaction.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Smallest Transaction</p>
                    <p className="text-xl font-bold text-gray-600">ZMW {allTimeStats.smallestTransaction.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Business Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Business Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">First Transaction</p>
                  <p className="text-lg font-semibold">
                    {allTimeStats.firstTransaction ?
                      allTimeStats.firstTransaction.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'No transactions yet'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Latest Transaction</p>
                  <p className="text-lg font-semibold">
                    {allTimeStats.lastTransaction ?
                      allTimeStats.lastTransaction.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'No transactions yet'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Graphs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Performance Graphs
          </CardTitle>
          <CardDescription>
            Visual representation of your business performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading performance graphs...</p>
            </div>
          ) : chartData.labels.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No performance data available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cash Flow Line Chart */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-purple-600" />
                  Cash Flow Trend - Line Chart
                </h4>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={chartData.labels.map((label, index) => ({
                        month: label,
                        cashIn: chartData.cashInData[index],
                        cashOut: chartData.cashOutData[index]
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis
                        dataKey="month"
                        stroke="#6b7280"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={12}
                        tickFormatter={(value) => `ZMW ${value.toLocaleString()}`}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          `ZMW ${Number(value).toLocaleString()}`,
                          name === 'cashIn' ? 'Cash In' : 'Cash Out'
                        ]}
                        labelFormatter={(label) => `Period: ${label}`}
                        contentStyle={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cashIn"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2 }}
                        name="Cash In"
                      />
                      <Line
                        type="monotone"
                        dataKey="cashOut"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: '#ef4444', strokeWidth: 2 }}
                        name="Cash Out"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Net Balance Line Chart */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Net Balance Trend - Line Chart
                </h4>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={chartData.labels.map((label, index) => ({
                        month: label,
                        netBalance: chartData.netBalanceData[index]
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis
                        dataKey="month"
                        stroke="#6b7280"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={12}
                        tickFormatter={(value) => `ZMW ${value.toLocaleString()}`}
                      />
                      <Tooltip
                        formatter={(value) => [`ZMW ${Number(value).toLocaleString()}`, 'Net Balance']}
                        labelFormatter={(label) => `Period: ${label}`}
                        contentStyle={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="netBalance"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
                        name="Net Balance"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-blue-600" />
            Performance Chart - {timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading chart data...</p>
            </div>
          ) : chartData.labels.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No data available for the selected period</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Custom Bar Chart */}
              <div className="space-y-4">
                {chartData.labels.map((label, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="text-gray-500">
                        In: ZMW {chartData.cashInData[index].toFixed(0)} | 
                        Out: ZMW {chartData.cashOutData[index].toFixed(0)}
                      </span>
                    </div>
                    <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                      {/* Cash In Bar */}
                      <div
                        className="absolute top-0 left-0 h-4 bg-green-500 rounded-sm"
                        style={{
                          width: `${maxValue > 0 ? (chartData.cashInData[index] / maxValue) * 100 : 0}%`
                        }}
                      />
                      {/* Cash Out Bar */}
                      <div
                        className="absolute bottom-0 left-0 h-4 bg-red-500 rounded-sm"
                        style={{
                          width: `${maxValue > 0 ? (chartData.cashOutData[index] / maxValue) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Cash In</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>Cash Out</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Period</th>
                  <th className="text-right py-2">Cash In</th>
                  <th className="text-right py-2">Cash Out</th>
                  <th className="text-right py-2">Net Balance</th>
                  <th className="text-right py-2">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 font-medium">{formatPeriodLabel(row.period)}</td>
                    <td className="text-right py-2 text-green-600">ZMW {row.cashIn.toFixed(2)}</td>
                    <td className="text-right py-2 text-red-600">ZMW {row.cashOut.toFixed(2)}</td>
                    <td className={`text-right py-2 font-medium ${row.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ZMW {row.netBalance.toFixed(2)}
                    </td>
                    <td className="text-right py-2">{row.transactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
        </div>
      )}

      {currentView === 'progress' && (
        <ProgressVisualization transactions={transactions} />
      )}

      {currentView === 'smart' && hasSmartAnalysisAccess && (
        <SmartAnalysis />
      )}
    </div>
  );
}
