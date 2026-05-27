import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  Calendar,
  Users,
  Camera,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Award,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTransactions } from '@/hooks/useTransactions';
import { PerformanceOverview } from './PerformanceOverview';
import { RevenueAnalytics } from './RevenueAnalytics';
import { CustomerInsights } from './CustomerInsights';
import { TrendAnalysis } from './TrendAnalysis';
import { PredictiveInsights } from './PredictiveInsights';
import { BusinessHealth } from './BusinessHealth';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface SmartAnalysisData {
  totalRevenue: number;
  totalTransactions: number;
  totalPictures: number;
  totalCustomers: number;
  avgTransactionValue: number;
  avgPicturesPerTransaction: number;
  revenueGrowth: number;
  customerRetentionRate: number;
  peakBusinessHours: string[];
  topPerformingDays: string[];
  seasonalTrends: any[];
  categoryPerformance: any[];
  monthlyData: any[];
  weeklyData: any[];
  customerSegments: any[];
  profitabilityMetrics: any;
  // Real-time transaction data for sub-components
  rawTransactions: any[];
  lastUpdated: Date;
  isUpdating: boolean;
}

interface SmartAnalysisProps {
  transactions?: any[];
}

export function SmartAnalysis({ transactions: transactionsProp }: SmartAnalysisProps = {}) {
  const [data, setData] = useState<SmartAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();
  const standardTxResult = useTransactions();
  const transactions = transactionsProp !== undefined ? transactionsProp : standardTxResult.transactions;
  const transactionsLoading = transactionsProp !== undefined ? false : standardTxResult.loading;
  const channelRef = useRef<any>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedHashRef = useRef<string>('');
  const processingRef = useRef<boolean>(false);

  // Memoized hash function to detect actual data changes
  const transactionHash = useMemo(() => {
    if (!transactions || transactions.length === 0) return '';

    // Create a hash based on transaction count, total amounts, and last transaction timestamp
    const cashInTransactions = transactions.filter(t => t.type === 'cash-in');
    const cashOutTransactions = transactions.filter(t => t.type === 'cash-out');
    const totalRevenue = cashInTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = cashOutTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const lastTransaction = transactions[0]; // Assuming sorted by date desc

    return `${transactions.length}-${totalRevenue}-${totalExpenses}-${lastTransaction?.id || ''}`;
  }, [transactions]);

  // Optimized debounced update function with change detection
  const debouncedUpdate = useCallback(() => {
    // Prevent multiple simultaneous processing
    if (processingRef.current) {
      console.log('🔄 Smart Analysis: Processing already in progress, skipping...');
      return;
    }

    // Check if data actually changed
    if (transactionHash === lastProcessedHashRef.current) {
      console.log('🔄 Smart Analysis: No data changes detected, skipping update...');
      return;
    }

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    setIsUpdating(true);
    updateTimeoutRef.current = setTimeout(() => {
      if (transactions && transactions.length > 0) {
        processingRef.current = true;
        console.log('🔄 Real-time: Updating Smart Analysis data with optimized processing...');

        try {
          const startTime = performance.now();
          const analysisData = processTransactionData(transactions);
          const endTime = performance.now();

          setData(analysisData);
          setLastUpdated(new Date());
          lastProcessedHashRef.current = transactionHash;

          console.log(`✅ Real-time: Smart Analysis updated successfully in ${(endTime - startTime).toFixed(2)}ms`);
        } catch (error) {
          console.error('❌ Error processing Smart Analysis data:', error);
        } finally {
          processingRef.current = false;
        }
      }
      setIsUpdating(false);
    }, 200); // Reduced debounce for faster real-time feel
  }, [transactions, transactionHash]);



  // Process transactions data in real-time
  useEffect(() => {
    if (!transactionsLoading && transactions) {
      console.log('🧠 Processing Smart Analysis data from real-time transactions...');
      debouncedUpdate();
      setLoading(false);
    }
  }, [transactions, transactionsLoading, debouncedUpdate]);

  // Set up real-time subscription for immediate updates
  useEffect(() => {
    if (transactionsProp !== undefined) return;
    console.log('🚀 Setting up Smart Analysis real-time subscription');

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create real-time channel for Smart Analysis
    const channel = supabase
      .channel(`smart-analysis-realtime-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('⚡ Smart Analysis: Real-time transaction change detected:', payload.eventType);
          // Trigger debounced update
          debouncedUpdate();
        }
      )
      .subscribe((status) => {
        console.log('📊 Smart Analysis real-time subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      console.log('🧹 Cleaning up Smart Analysis real-time subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      // Reset processing flags
      processingRef.current = false;
      lastProcessedHashRef.current = '';
    };
  }, [debouncedUpdate, transactionsProp]);

  // Additional cleanup effect for component unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Smart Analysis component unmounting - cleaning up resources');
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      processingRef.current = false;
    };
  }, []);

  const processTransactionData = (transactions: any[]): SmartAnalysisData => {
    console.log('🔍 Processing real transaction data for Smart Analysis:', transactions.length, 'transactions');

    if (!transactions || transactions.length === 0) {
      console.log('⚠️ No transactions available for analysis');
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        totalPictures: 0,
        totalCustomers: 0,
        avgTransactionValue: 0,
        avgPicturesPerTransaction: 0,
        revenueGrowth: 0,
        customerRetentionRate: 0,
        peakBusinessHours: [],
        topPerformingDays: [],
        seasonalTrends: [],
        categoryPerformance: [],
        monthlyData: [],
        weeklyData: [],
        customerSegments: [],
        profitabilityMetrics: { grossProfit: 0, profitMargin: 0 },
        rawTransactions: [],
        lastUpdated,
        isUpdating
      };
    }

    // REAL DATA PROCESSING - 100% accurate calculations
    const cashInTransactions = transactions.filter(t => t.type === 'cash-in');
    const cashOutTransactions = transactions.filter(t => t.type === 'cash-out');

    const totalRevenue = cashInTransactions.reduce((sum, t) => {
      const amount = Number(t.amount) || 0;
      return sum + amount;
    }, 0);

    const totalExpenses = cashOutTransactions.reduce((sum, t) => {
      const amount = Math.abs(Number(t.amount)) || 0;
      return sum + amount;
    }, 0);

    const totalTransactions = transactions.length;
    const totalPictures = cashInTransactions.reduce((sum, t) => {
      const pictures = Number(t.number_of_pictures) || 0;
      return sum + pictures;
    }, 0);

    // Real customer analysis
    const customerNames = cashInTransactions
      .filter(t => t.customer_name && t.customer_name.trim())
      .map(t => t.customer_name.toLowerCase().trim());

    const uniqueCustomers = new Set(customerNames).size;

    // Real averages
    const avgTransactionValue = cashInTransactions.length > 0 ? totalRevenue / cashInTransactions.length : 0;
    const avgPicturesPerTransaction = cashInTransactions.length > 0 ? totalPictures / cashInTransactions.length : 0;

    // Process real advanced analytics data
    const monthlyData = processMonthlyData(transactions);
    const weeklyData = processWeeklyData(transactions);
    const categoryPerformance = processCategoryPerformance(transactions);
    const customerSegments = processCustomerSegments(transactions);
    const seasonalTrends = processSeasonalTrends(transactions);
    const peakBusinessHours = processPeakHours(transactions);
    const topPerformingDays = processTopDays(transactions);

    console.log('✅ Real Smart Analysis Data:', {
      totalRevenue,
      totalExpenses,
      totalTransactions,
      totalPictures,
      uniqueCustomers,
      avgTransactionValue: avgTransactionValue.toFixed(2),
      avgPicturesPerTransaction: avgPicturesPerTransaction.toFixed(2)
    });

    return {
      totalRevenue,
      totalTransactions,
      totalPictures,
      totalCustomers: uniqueCustomers,
      avgTransactionValue,
      avgPicturesPerTransaction,
      revenueGrowth: calculateRevenueGrowth(monthlyData),
      customerRetentionRate: calculateRetentionRate(transactions),
      peakBusinessHours,
      topPerformingDays,
      seasonalTrends,
      categoryPerformance,
      monthlyData,
      weeklyData,
      customerSegments,
      profitabilityMetrics: {
        grossProfit: totalRevenue - totalExpenses,
        profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0
      },
      // Pass raw data for sub-components
      rawTransactions: transactions,
      lastUpdated,
      isUpdating
    };
  };

  // Memoized helper functions for processing REAL analytics data
  const processMonthlyData = useMemo(() => (transactions: any[]) => {
    console.log('📊 Processing monthly data from real transactions:', transactions.length);
    const monthlyMap = new Map();

    transactions.forEach(t => {
      const date = new Date(t.date || t.created_at);
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Invalid date in transaction:', t);
        return;
      }

      const month = date.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, {
          revenue: 0,
          expenses: 0,
          transactions: 0,
          pictures: 0,
          customers: new Set()
        });
      }

      const data = monthlyMap.get(month);
      data.transactions += 1;

      if (t.type === 'cash-in') {
        data.revenue += Number(t.amount) || 0;
        data.pictures += Number(t.number_of_pictures) || 0;
        if (t.customer_name && t.customer_name.trim()) {
          data.customers.add(t.customer_name.toLowerCase().trim());
        }
      } else if (t.type === 'cash-out') {
        data.expenses += Math.abs(Number(t.amount)) || 0;
      }
    });

    const result = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      expenses: data.expenses,
      transactions: data.transactions,
      pictures: data.pictures,
      customers: data.customers.size,
      profit: data.revenue - data.expenses
    }));

    console.log('✅ Monthly data processed:', result.length, 'months');
    return result;
  }, []);

  const processWeeklyData = useMemo(() => (transactions: any[]) => {
    console.log('📅 Processing weekly data from real transactions:', transactions.length);
    const weeklyMap = new Map();

    transactions.forEach(t => {
      const date = new Date(t.date || t.created_at);
      if (isNaN(date.getTime())) return;

      // Get ISO week number
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
      const week = `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;

      if (!weeklyMap.has(week)) {
        weeklyMap.set(week, {
          revenue: 0,
          expenses: 0,
          transactions: 0,
          pictures: 0,
          customers: new Set()
        });
      }

      const data = weeklyMap.get(week);
      data.transactions += 1;

      if (t.type === 'cash-in') {
        data.revenue += Number(t.amount) || 0;
        data.pictures += Number(t.number_of_pictures) || 0;
        if (t.customer_name && t.customer_name.trim()) {
          data.customers.add(t.customer_name.toLowerCase().trim());
        }
      } else if (t.type === 'cash-out') {
        data.expenses += Math.abs(Number(t.amount)) || 0;
      }
    });

    const result = Array.from(weeklyMap.entries()).map(([week, data]) => ({
      week,
      revenue: data.revenue,
      expenses: data.expenses,
      transactions: data.transactions,
      pictures: data.pictures,
      customers: data.customers.size,
      profit: data.revenue - data.expenses
    }));

    console.log('✅ Weekly data processed:', result.length, 'weeks');
    return result;
  }, []);

  const processCategoryPerformance = useMemo(() => (transactions: any[]) => {
    console.log('🏷️ Processing category performance from real transactions');
    const categoryMap = new Map();

    transactions.filter(t => t.type === 'cash-in').forEach(t => {
      const category = t.category_name || t.category || 'Uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          revenue: 0,
          transactions: 0,
          pictures: 0,
          customers: new Set()
        });
      }

      const data = categoryMap.get(category);
      data.revenue += Number(t.amount) || 0;
      data.transactions += 1;
      data.pictures += Number(t.number_of_pictures) || 0;

      if (t.customer_name && t.customer_name.trim()) {
        data.customers.add(t.customer_name.toLowerCase().trim());
      }
    });

    const result = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      revenue: data.revenue,
      transactions: data.transactions,
      pictures: data.pictures,
      customers: data.customers.size,
      avgTransactionValue: data.transactions > 0 ? data.revenue / data.transactions : 0
    })).sort((a, b) => b.revenue - a.revenue);

    console.log('✅ Category performance processed:', result.length, 'categories');
    return result;
  }, []);

  const processCustomerSegments = useMemo(() => (transactions: any[]) => {
    console.log('👥 Processing customer segments from real transactions');
    const customerMap = new Map();

    transactions.filter(t => t.type === 'cash-in' && t.customer_name && t.customer_name.trim()).forEach(t => {
      const customer = t.customer_name.toLowerCase().trim();
      if (!customerMap.has(customer)) {
        customerMap.set(customer, {
          totalSpent: 0,
          visits: 0,
          pictures: 0,
          firstVisit: new Date(t.date || t.created_at),
          lastVisit: new Date(t.date || t.created_at)
        });
      }

      const data = customerMap.get(customer);
      data.totalSpent += Number(t.amount) || 0;
      data.visits += 1;
      data.pictures += Number(t.number_of_pictures) || 0;

      const visitDate = new Date(t.date || t.created_at);
      if (visitDate < data.firstVisit) data.firstVisit = visitDate;
      if (visitDate > data.lastVisit) data.lastVisit = visitDate;
    });

    const result = Array.from(customerMap.entries()).map(([customer, data]) => ({
      customer,
      totalSpent: data.totalSpent,
      visits: data.visits,
      pictures: data.pictures,
      avgSpendPerVisit: data.visits > 0 ? data.totalSpent / data.visits : 0,
      firstVisit: data.firstVisit,
      lastVisit: data.lastVisit,
      daysSinceLastVisit: Math.floor((new Date().getTime() - data.lastVisit.getTime()) / (1000 * 60 * 60 * 24))
    })).sort((a, b) => b.totalSpent - a.totalSpent);

    console.log('✅ Customer segments processed:', result.length, 'customers');
    return result;
  }, []);

  const processSeasonalTrends = useMemo(() => (transactions: any[]) => {
    const seasonalMap = new Map();
    transactions.filter(t => t.type === 'cash-in').forEach(t => {
      const month = new Date(t.date).getMonth();
      const season = month < 3 ? 'Winter' : month < 6 ? 'Spring' : month < 9 ? 'Summer' : 'Fall';
      if (!seasonalMap.has(season)) {
        seasonalMap.set(season, { revenue: 0, transactions: 0 });
      }
      const data = seasonalMap.get(season);
      data.revenue += Number(t.amount);
      data.transactions += 1;
    });
    return Array.from(seasonalMap.entries()).map(([season, data]) => ({ season, ...data }));
  }, []);

  const processPeakHours = useMemo(() => (transactions: any[]) => {
    const hourMap = new Map();
    transactions.filter(t => t.type === 'cash-in' && t.time).forEach(t => {
      const hour = t.time.split(':')[0];
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });
    return Array.from(hourMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);
  }, []);

  const processTopDays = useMemo(() => (transactions: any[]) => {
    const dayMap = new Map();
    transactions.filter(t => t.type === 'cash-in').forEach(t => {
      const day = new Date(t.date).toLocaleDateString('en-US', { weekday: 'long' });
      dayMap.set(day, (dayMap.get(day) || 0) + Number(t.amount));
    });
    return Array.from(dayMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day);
  }, []);

  const calculateRevenueGrowth = useMemo(() => (monthlyData: any[]) => {
    if (monthlyData.length < 2) return 0;
    const sorted = monthlyData.sort((a, b) => a.month.localeCompare(b.month));
    const current = sorted[sorted.length - 1]?.revenue || 0;
    const previous = sorted[sorted.length - 2]?.revenue || 0;
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  }, []);

  const calculateRetentionRate = useMemo(() => (transactions: any[]) => {
    const customerSegments = processCustomerSegments(transactions);
    const returningCustomers = customerSegments.filter(c => c.visits > 1).length;
    const totalCustomers = customerSegments.length;
    return totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Smart Analysis
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              AI-Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Analyzing your studio performance...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Smart Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Data Available</h3>
            <p className="text-gray-500">Add some transactions to see intelligent insights about your studio performance.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Smart Analysis
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              AI-Powered Insights
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
              Real-time
            </Badge>
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Advanced analytics and intelligent insights about your studio performance
            </p>
            <div className="flex items-center gap-3">
              {isUpdating && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Updating...
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <RefreshCw className="h-3 w-3" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1">
              <TabsTrigger value="overview" className="flex items-center gap-1 px-2 md:px-3 py-2 text-xs md:text-sm">
                <BarChart3 className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <span className="hidden md:inline">Overview</span>
                <span className="md:hidden">Over</span>
              </TabsTrigger>
              <TabsTrigger value="revenue" className="flex items-center gap-1 px-2 md:px-3 py-2 text-xs md:text-sm">
                <DollarSign className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <span className="hidden md:inline">Revenue</span>
                <span className="md:hidden">Rev</span>
              </TabsTrigger>
              <TabsTrigger value="customers" className="flex items-center gap-1 px-2 md:px-3 py-2 text-xs md:text-sm">
                <Users className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <span className="hidden md:inline">Customers</span>
                <span className="md:hidden">Cust</span>
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center gap-1 px-2 md:px-3 py-2 text-xs md:text-sm">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <span className="hidden md:inline">Trends</span>
                <span className="md:hidden">Trend</span>
              </TabsTrigger>
              <TabsTrigger value="predictions" className="flex items-center gap-1 px-2 md:px-3 py-2 text-xs md:text-sm">
                <Zap className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <span className="hidden md:inline">Predictions</span>
                <span className="md:hidden">Pred</span>
              </TabsTrigger>
              <TabsTrigger value="health" className="flex items-center gap-1 px-2 md:px-3 py-2 text-xs md:text-sm">
                <Activity className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <span className="hidden md:inline">Health</span>
                <span className="md:hidden">Hlth</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <ErrorBoundary fallbackTitle="Overview Error" fallbackMessage="Failed to load performance overview. This might be due to data processing issues.">
                <PerformanceOverview data={data} />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="revenue" className="mt-6">
              <ErrorBoundary fallbackTitle="Revenue Analytics Error" fallbackMessage="Failed to load revenue analytics. This might be due to data processing issues.">
                <RevenueAnalytics data={data} />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="customers" className="mt-6">
              <ErrorBoundary fallbackTitle="Customer Insights Error" fallbackMessage="Failed to load customer insights. This might be due to data processing issues.">
                <CustomerInsights data={data} />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="trends" className="mt-6">
              <ErrorBoundary fallbackTitle="Trend Analysis Error" fallbackMessage="Failed to load trend analysis. This might be due to data processing issues.">
                <TrendAnalysis data={data} />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="predictions" className="mt-6">
              <ErrorBoundary fallbackTitle="Predictive Insights Error" fallbackMessage="Failed to load predictive insights. This might be due to complex calculations.">
                <PredictiveInsights data={data} />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="health" className="mt-6">
              <ErrorBoundary fallbackTitle="Business Health Error" fallbackMessage="Failed to load business health metrics. This might be due to data processing issues.">
                <BusinessHealth data={data} />
              </ErrorBoundary>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
