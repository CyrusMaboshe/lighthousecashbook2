import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserPerformanceDashboard } from './UserPerformanceDashboard';
import { UserProgressVisualization } from './UserProgressVisualization';
import { UserCustomerAnalytics } from './UserCustomerAnalytics';
import { UserGoalTracker } from './UserGoalTracker';
import { UserReportsSystem } from './UserReportsSystem';
import { UserActionHistory } from '../UserActionHistory';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Calendar,
  Award,
  PieChart,
  LineChart,
  Activity,
  Star,
  History,
  DollarSign,
  Eye,
  EyeOff,
  RefreshCw,
  Filter,
  Download,
  Camera,
  Clock,
  MapPin,
  Phone,
  Coins,
  CreditCard,
  Wallet,
  Receipt,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { enforceRevenueEqualsCashIn } from '@/utils/userAnalyticsValidation';
import { logAnalyticsView } from '@/services/userLogService';
import { UserAnalyticsData } from '@/types/auth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart as RechartsLineChart, Line, Area, AreaChart } from 'recharts';

interface RealTimeAnalyticsData {
  // Financial Metrics
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  monthlyGrowth: number;

  // Transaction Metrics
  totalTransactions: number;
  cashInTransactions: number;
  cashOutTransactions: number;
  avgTransactionValue: number;

  // Customer Metrics
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  customerRetention: number;

  // Service Metrics
  totalPictures: number;
  avgPicturesPerTransaction: number;

  // Additional analytics data
  topCategories: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
  recentTrends: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
  goals: any[];

  // Time-based Analysis
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
    transactions: number;
    customers: number;
  }>;

  // Category Analysis
  categoryBreakdown: Array<{
    name: string;
    revenue: number;
    transactions: number;
    percentage: number;
    color: string;
  }>;

  // Customer Analysis
  topCustomers: Array<{
    name: string;
    totalSpent: number;
    visits: number;
    lastVisit: string;
    whatsapp: string;
  }>;

  // Performance Indicators
  dailyAverages: {
    revenue: number;
    transactions: number;
    customers: number;
  };

  // Growth Metrics
  monthOverMonthGrowth: number;
  transactionGrowth: number;
  customerGrowth: number;

  // Operational Insights
  peakHours: Array<{ hour: number; transactions: number; revenue: number }>;
  peakDays: Array<{ day: string; transactions: number; revenue: number }>;

  // Data Quality
  lastUpdated: Date;
  dataCompleteness: number;
}

import { RealDataAnalytics } from './RealDataAnalytics';

interface UserAnalyticsProps {
  transactions?: any[];
}

export function UserAnalytics({ transactions }: UserAnalyticsProps = {}) {
  // Use the new 100% real data analytics component
  return <RealDataAnalytics transactions={transactions} />;
}

export function UserAnalyticsLegacy() {
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState<RealTimeAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days' | '90days' | '12months' | 'all'>('30days');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [showBalances, setShowBalances] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { transactions, loading: transactionsLoading } = useTransactions();
  const { currentUser } = useAuth();

  const handleTabChange = (newTab: string) => {
    if (currentUser && newTab !== activeTab) {
      logAnalyticsView(currentUser, newTab);
    }
    setActiveTab(newTab);
  };

  // Process comprehensive real-time analytics data
  const processRealTimeAnalytics = (allTransactions: any[]): RealTimeAnalyticsData => {
    console.log('🔍 Processing comprehensive analytics for:', currentUser?.username);
    console.log('📊 Total transactions available:', allTransactions.length);
    console.log('📅 Selected period:', selectedPeriod);

    // Filter user-specific transactions
    const userTxns = allTransactions.filter(t => t.added_by === currentUser?.username);
    console.log('👤 User-specific transactions found:', userTxns.length);

    // Apply period filter
    const filteredTxns = filterTransactionsByPeriod(userTxns, selectedPeriod);
    console.log(`📅 Transactions for ${selectedPeriod}:`, filteredTxns.length);

    // Separate transaction types
    const cashInTxns = filteredTxns.filter(t => t.type === 'cash-in');
    const cashOutTxns = filteredTxns.filter(t => t.type === 'cash-out');

    // Financial Metrics (100% real data)
    const totalRevenue = cashInTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalExpenses = cashOutTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Transaction Metrics
    const totalTransactions = filteredTxns.length;
    const cashInTransactions = cashInTxns.length;
    const cashOutTransactions = cashOutTxns.length;
    const avgTransactionValue = cashInTransactions > 0 ? totalRevenue / cashInTransactions : 0;

    // Customer Metrics (100% real data)
    const customerData = processCustomerMetrics(cashInTxns);

    // Service Metrics
    const totalPictures = cashInTxns.reduce((sum, t) => sum + (Number(t.number_of_pictures) || 0), 0);
    const avgPicturesPerTransaction = cashInTransactions > 0 ? totalPictures / cashInTransactions : 0;

    // Time-based Analysis
    const monthlyTrends = processMonthlyTrends(userTxns);

    // Category Analysis
    const categoryBreakdown = processCategoryBreakdown(cashInTxns, totalRevenue);

    // Top Customers
    const topCustomers = processTopCustomers(cashInTxns);

    // Performance Indicators
    const dailyAverages = calculateDailyAverages(filteredTxns, selectedPeriod);

    // Growth Metrics
    const growthMetrics = calculateGrowthMetrics(userTxns, selectedPeriod);

    // Operational Insights
    const peakHours = analyzePeakHours(filteredTxns);
    const peakDays = analyzePeakDays(filteredTxns);

    // Data Quality Assessment
    const dataCompleteness = assessDataCompleteness(filteredTxns);

    return {
      // Financial Metrics
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      monthlyGrowth: growthMetrics.monthOverMonth,

      // Transaction Metrics
      totalTransactions,
      cashInTransactions,
      cashOutTransactions,
      avgTransactionValue,

      // Customer Metrics
      totalCustomers: customerData.total,
      newCustomers: customerData.new,
      returningCustomers: customerData.returning,
      customerRetentionRate: customerData.retentionRate,

      // Service Metrics
      totalPictures,
      avgPicturesPerTransaction,

      // Additional analytics data
      topCategories: categoryBreakdown.slice(0, 5).map(c => ({ name: c.name, amount: c.revenue, percentage: c.percentage })),
      recentTrends: monthlyTrends.slice(-6).map(t => ({ month: t.month, revenue: t.revenue, transactions: t.transactions })),
      goals: [],
      customerRetention: customerData.retentionRate,

      // Time-based Analysis
      monthlyTrends,

      // Category Analysis
      categoryBreakdown,

      // Customer Analysis
      topCustomers,

      // Performance Indicators
      dailyAverages,

      // Growth Metrics
      monthOverMonthGrowth: growthMetrics.monthOverMonth,
      transactionGrowth: growthMetrics.transactions,
      customerGrowth: growthMetrics.customers,

      // Operational Insights
      peakHours,
      peakDays,

      // Data Quality
      lastUpdated: new Date(),
      dataCompleteness
    };
  };

  // Helper function to filter transactions by period
  const filterTransactionsByPeriod = (transactions: any[], period: string) => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '12months':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'all':
        return transactions;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return transactions.filter(t => {
      const txnDate = new Date(t.created_at || t.date);
      return txnDate >= startDate;
    });
  };

  // Process customer metrics from real data
  const processCustomerMetrics = (cashInTxns: any[]) => {
    const customerMap = new Map();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    cashInTxns.forEach(t => {
      const customerKey = t.customer_name?.trim() || t.whatsapp_number;
      if (!customerKey) return;

      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          firstSeen: new Date(t.created_at || t.date),
          visits: 0,
          totalSpent: 0
        });
      }

      const customer = customerMap.get(customerKey);
      customer.visits += 1;
      customer.totalSpent += Number(t.amount) || 0;

      const txnDate = new Date(t.created_at || t.date);
      if (txnDate < customer.firstSeen) {
        customer.firstSeen = txnDate;
      }
    });

    const totalCustomers = customerMap.size;
    const newCustomers = Array.from(customerMap.values())
      .filter(c => c.firstSeen >= thirtyDaysAgo).length;
    const returningCustomers = Array.from(customerMap.values())
      .filter(c => c.visits > 1).length;
    const retentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    return {
      total: totalCustomers,
      new: newCustomers,
      returning: returningCustomers,
      retentionRate
    };
  };

  // Process monthly trends from real data
  const processMonthlyTrends = (userTxns: any[]) => {
    const monthlyData = new Map();
    const now = new Date();

    // Get last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      monthlyData.set(monthKey, {
        revenue: 0,
        expenses: 0,
        profit: 0,
        transactions: 0,
        customers: new Set()
      });
    }

    userTxns.forEach(t => {
      const monthKey = (t.created_at || t.date).slice(0, 7);
      if (monthlyData.has(monthKey)) {
        const data = monthlyData.get(monthKey);
        const amount = Number(t.amount) || 0;

        if (t.type === 'cash-in') {
          data.revenue += amount;
          data.transactions += 1;
          if (t.customer_name) {
            data.customers.add(t.customer_name);
          }
        } else if (t.type === 'cash-out') {
          data.expenses += amount;
        }

        data.profit = data.revenue - data.expenses;
      }
    });

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.profit,
      transactions: data.transactions,
      customers: data.customers.size
    }));
  };

  // Process category breakdown from real data
  const processCategoryBreakdown = (cashInTxns: any[], totalRevenue: number) => {
    const categoryMap = new Map();
    const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316'];

    cashInTxns.forEach(t => {
      const category = t.category_name || 'Uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { revenue: 0, transactions: 0 });
      }
      const data = categoryMap.get(category);
      data.revenue += Number(t.amount) || 0;
      data.transactions += 1;
    });

    return Array.from(categoryMap.entries())
      .map(([name, data], index) => ({
        name,
        revenue: data.revenue,
        transactions: data.transactions,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  // Process top customers from real data
  const processTopCustomers = (cashInTxns: any[]) => {
    const customerMap = new Map();

    cashInTxns.forEach(t => {
      const customerKey = t.customer_name?.trim();
      if (!customerKey) return;

      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          name: customerKey,
          totalSpent: 0,
          visits: 0,
          lastVisit: t.created_at || t.date,
          whatsapp: t.whatsapp_number || ''
        });
      }

      const customer = customerMap.get(customerKey);
      customer.totalSpent += Number(t.amount) || 0;
      customer.visits += 1;

      const txnDate = new Date(t.created_at || t.date);
      const lastVisitDate = new Date(customer.lastVisit);
      if (txnDate > lastVisitDate) {
        customer.lastVisit = t.created_at || t.date;
        customer.whatsapp = t.whatsapp_number || customer.whatsapp;
      }
    });

    return Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
  };

  useEffect(() => {
    if (!transactionsLoading && transactions && currentUser) {
      setIsLoading(true);
      try {
        const data = processRealTimeAnalytics(transactions);
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error processing real-time analytics:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [transactions, transactionsLoading, currentUser, selectedPeriod]);

  // Calculate daily averages
  const calculateDailyAverages = (txns: any[], period: string) => {
    const days = period === '7days' ? 7 : period === '30days' ? 30 : period === '90days' ? 90 : 365;
    const cashInTxns = txns.filter(t => t.type === 'cash-in');
    const revenue = cashInTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const customers = new Set(cashInTxns.map(t => t.customer_name).filter(Boolean)).size;

    return {
      revenue: revenue / days,
      transactions: cashInTxns.length / days,
      customers: customers / days
    };
  };

  // Calculate growth metrics
  const calculateGrowthMetrics = (userTxns: any[], period: string) => {
    const now = new Date();
    const currentPeriodStart = new Date();
    const previousPeriodStart = new Date();

    if (period === '30days') {
      currentPeriodStart.setDate(now.getDate() - 30);
      previousPeriodStart.setDate(now.getDate() - 60);
    } else if (period === '7days') {
      currentPeriodStart.setDate(now.getDate() - 7);
      previousPeriodStart.setDate(now.getDate() - 14);
    } else {
      currentPeriodStart.setDate(now.getDate() - 90);
      previousPeriodStart.setDate(now.getDate() - 180);
    }

    const currentTxns = userTxns.filter(t => {
      const txnDate = new Date(t.created_at || t.date);
      return txnDate >= currentPeriodStart && txnDate <= now;
    });

    const previousTxns = userTxns.filter(t => {
      const txnDate = new Date(t.created_at || t.date);
      return txnDate >= previousPeriodStart && txnDate < currentPeriodStart;
    });

    const currentRevenue = currentTxns.filter(t => t.type === 'cash-in').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const previousRevenue = previousTxns.filter(t => t.type === 'cash-in').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const currentTransactions = currentTxns.filter(t => t.type === 'cash-in').length;
    const previousTransactions = previousTxns.filter(t => t.type === 'cash-in').length;
    const currentCustomers = new Set(currentTxns.filter(t => t.type === 'cash-in').map(t => t.customer_name).filter(Boolean)).size;
    const previousCustomers = new Set(previousTxns.filter(t => t.type === 'cash-in').map(t => t.customer_name).filter(Boolean)).size;

    return {
      monthOverMonth: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0,
      transactions: previousTransactions > 0 ? ((currentTransactions - previousTransactions) / previousTransactions) * 100 : 0,
      customers: previousCustomers > 0 ? ((currentCustomers - previousCustomers) / previousCustomers) * 100 : 0
    };
  };

  // Analyze peak hours
  const analyzePeakHours = (txns: any[]) => {
    const hourlyData = new Map();

    for (let i = 0; i < 24; i++) {
      hourlyData.set(i, { transactions: 0, revenue: 0 });
    }

    txns.filter(t => t.type === 'cash-in').forEach(t => {
      const hour = t.time ? parseInt(t.time.split(':')[0]) : 12;
      const data = hourlyData.get(hour);
      if (data) {
        data.transactions += 1;
        data.revenue += Number(t.amount) || 0;
      }
    });

    return Array.from(hourlyData.entries())
      .map(([hour, data]) => ({ hour, ...data }))
      .sort((a, b) => b.transactions - a.transactions)
      .slice(0, 5);
  };

  // Analyze peak days
  const analyzePeakDays = (txns: any[]) => {
    const dailyData = new Map();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    days.forEach(day => {
      dailyData.set(day, { transactions: 0, revenue: 0 });
    });

    txns.filter(t => t.type === 'cash-in').forEach(t => {
      const date = new Date(t.created_at || t.date);
      const day = days[date.getDay()];
      const data = dailyData.get(day);
      if (data) {
        data.transactions += 1;
        data.revenue += Number(t.amount) || 0;
      }
    });

    return Array.from(dailyData.entries())
      .map(([day, data]) => ({ day, ...data }))
      .sort((a, b) => b.transactions - a.transactions);
  };

  // Assess data completeness
  const assessDataCompleteness = (txns: any[]) => {
    if (txns.length === 0) return 100;

    let completenessScore = 0;
    const fields = ['customer_name', 'whatsapp_number', 'amount', 'category_name', 'number_of_pictures'];

    txns.forEach(t => {
      let fieldScore = 0;
      fields.forEach(field => {
        if (t[field] && t[field].toString().trim() !== '') {
          fieldScore += 20; // Each field is worth 20%
        }
      });
      completenessScore += fieldScore;
    });

    return (completenessScore / (txns.length * 100)) * 100;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (transactions && currentUser) {
        const data = processRealTimeAnalytics(transactions);
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'progress', label: 'Progress', icon: LineChart },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'reports', label: 'Reports', icon: PieChart },
    { id: 'history', label: 'Action History', icon: History }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Your Analytics</h1>
          <p className="text-slate-600">Track your performance and achieve your goals</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-600" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  const months = [];
                  const now = new Date();
                  for (let i = 11; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    months.push(
                      <SelectItem key={monthKey} value={monthKey}>
                        {monthLabel}
                      </SelectItem>
                    );
                  }
                  return months;
                })()}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-slate-700">Performance Score: 85%</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ZMW {analyticsData.totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Monthly Transactions</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {analyticsData.totalTransactions}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Monthly Customers</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {analyticsData.totalCustomers}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Growth</p>
                  <p className={`text-2xl font-bold ${analyticsData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analyticsData.monthlyGrowth >= 0 ? '+' : ''}{analyticsData.monthlyGrowth.toFixed(1)}%
                  </p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 text-xs md:text-sm"
            >
              <tab.icon className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              <span className="hidden md:inline">{tab.label}</span>
              <span className="md:hidden text-xs truncate">{tab.label.slice(0, 4)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <UserPerformanceDashboard analyticsData={analyticsData} />
        </TabsContent>

        <TabsContent value="performance">
          <UserPerformanceDashboard analyticsData={analyticsData} detailed={true} />
        </TabsContent>

        <TabsContent value="progress">
          <UserProgressVisualization
            transactions={transactions}
            currentUser={currentUser}
            selectedMonth={selectedMonth}
          />
        </TabsContent>

        <TabsContent value="customers">
          <UserCustomerAnalytics
            transactions={transactions}
            currentUser={currentUser}
            selectedMonth={selectedMonth}
          />
        </TabsContent>

        <TabsContent value="goals">
          <UserGoalTracker analyticsData={analyticsData} currentUser={currentUser} />
        </TabsContent>

        <TabsContent value="reports">
          <UserReportsSystem
            transactions={transactions}
            currentUser={currentUser}
            selectedMonth={selectedMonth}
          />
        </TabsContent>

        <TabsContent value="history">
          <UserActionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
