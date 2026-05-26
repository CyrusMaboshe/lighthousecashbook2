import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  BarChart3, 
  Activity,
  DollarSign,
  Users,
  Download
} from 'lucide-react';
import { User } from '@/types/auth';

interface UserProgressVisualizationProps {
  transactions: any[];
  currentUser: User | null;
  selectedMonth?: string;
}

type ViewType = 'daily' | 'weekly' | 'monthly';
type MetricType = 'revenue' | 'transactions' | 'customers';

export function UserProgressVisualization({ transactions, currentUser, selectedMonth }: UserProgressVisualizationProps) {
  const [viewType, setViewType] = useState<ViewType>('monthly');
  const [metricType, setMetricType] = useState<MetricType>('revenue');
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  // Filter user transactions
  const userTransactions = useMemo(() => {
    const userTxns = transactions.filter(t => t.added_by === currentUser?.username && t.type === 'cash-in');

    // If selectedMonth is provided, filter by that month for consistency
    if (selectedMonth) {
      return userTxns.filter(t => {
        const transactionMonth = t.date.slice(0, 7); // YYYY-MM format
        return transactionMonth === selectedMonth;
      });
    }

    return userTxns;
  }, [transactions, currentUser, selectedMonth]);

  // Process data based on view type and period
  const processedData = useMemo(() => {
    const now = new Date();
    let periods: Date[] = [];
    
    // Generate periods based on selection
    if (selectedPeriod === '6months') {
      for (let i = 5; i >= 0; i--) {
        periods.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
      }
    } else if (selectedPeriod === '12months') {
      for (let i = 11; i >= 0; i--) {
        periods.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
      }
    } else if (selectedPeriod === '30days') {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        periods.push(date);
      }
    }

    const data = periods.map(period => {
      let periodKey: string;
      let label: string;
      let startDate: Date;
      let endDate: Date;

      if (selectedPeriod === '30days') {
        periodKey = period.toISOString().slice(0, 10);
        label = period.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        startDate = new Date(period);
        endDate = new Date(period);
        endDate.setDate(endDate.getDate() + 1);
      } else {
        periodKey = period.toISOString().slice(0, 7);
        label = period.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        startDate = new Date(period.getFullYear(), period.getMonth(), 1);
        endDate = new Date(period.getFullYear(), period.getMonth() + 1, 0);
      }

      const periodTransactions = userTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });

      // BUSINESS RULE: Total Revenue MUST equal Total Cash-In for user analytics
      const cashInAmount = periodTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const revenue = cashInAmount; // Enforce: Revenue = Cash-In

      const transactionCount = periodTransactions.length;
      const uniqueCustomers = new Set(
        periodTransactions
          .map(t => t.customer_name)
          .filter(name => name && name.trim() !== '')
      ).size;

      // Validation: Ensure revenue equals cash-in
      if (revenue !== cashInAmount) {
        console.error('❌ PROGRESS VISUALIZATION VALIDATION ERROR: Revenue does not equal Cash-In!', {
          period: periodKey,
          revenue,
          cashInAmount,
          difference: revenue - cashInAmount
        });
      }

      return {
        period: periodKey,
        label,
        revenue,
        transactions: transactionCount,
        customers: uniqueCustomers,
        avgTransactionValue: transactionCount > 0 ? revenue / transactionCount : 0
      };
    });

    return data;
  }, [userTransactions, selectedPeriod]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    // BUSINESS RULE: Total Revenue MUST equal Total Cash-In for user analytics
    const totalCashIn = processedData.reduce((sum, d) => sum + d.revenue, 0);
    const totalRevenue = totalCashIn; // Enforce: Revenue = Cash-In

    const totalTransactions = processedData.reduce((sum, d) => sum + d.transactions, 0);
    const totalCustomers = Math.max(...processedData.map(d => d.customers));

    const currentPeriod = processedData[processedData.length - 1];
    const previousPeriod = processedData[processedData.length - 2];

    const revenueGrowth = previousPeriod && previousPeriod.revenue > 0
      ? ((currentPeriod.revenue - previousPeriod.revenue) / previousPeriod.revenue) * 100
      : 0;

    // Validation: Ensure revenue equals cash-in
    if (totalRevenue !== totalCashIn) {
      console.error('❌ PROGRESS SUMMARY VALIDATION ERROR: Revenue does not equal Cash-In!', {
        totalRevenue,
        totalCashIn,
        difference: totalRevenue - totalCashIn
      });
    }

    return {
      totalRevenue,
      totalTransactions,
      totalCustomers,
      revenueGrowth,
      avgTransactionValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0
    };
  }, [processedData]);

  const getMetricValue = (item: any) => {
    switch (metricType) {
      case 'revenue': return item.revenue;
      case 'transactions': return item.transactions;
      case 'customers': return item.customers;
      default: return item.revenue;
    }
  };

  const getMetricLabel = () => {
    switch (metricType) {
      case 'revenue': return 'Revenue (ZMW)';
      case 'transactions': return 'Transactions';
      case 'customers': return 'Customers';
      default: return 'Revenue (ZMW)';
    }
  };

  const getMetricColor = () => {
    switch (metricType) {
      case 'revenue': return '#10B981';
      case 'transactions': return '#3B82F6';
      case 'customers': return '#8B5CF6';
      default: return '#10B981';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>

          <Select value={metricType} onValueChange={(value: MetricType) => setMetricType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="transactions">Transactions</SelectItem>
              <SelectItem value="customers">Customers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Chart
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Revenue</p>
                <p className="text-xl font-bold text-green-600">
                  ZMW {summaryStats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Transactions</p>
                <p className="text-xl font-bold text-blue-600">
                  {summaryStats.totalTransactions}
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
                <p className="text-sm text-slate-600">Customers</p>
                <p className="text-xl font-bold text-purple-600">
                  {summaryStats.totalCustomers}
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
                <p className={`text-xl font-bold ${summaryStats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summaryStats.revenueGrowth >= 0 ? '+' : ''}{summaryStats.revenueGrowth.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {getMetricLabel()} Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [
                  metricType === 'revenue' ? `ZMW ${value}` : value,
                  getMetricLabel()
                ]}
              />
              <Area 
                type="monotone" 
                dataKey={metricType} 
                stroke={getMetricColor()} 
                fill={getMetricColor()}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Period Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={processedData.slice(-6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => [`ZMW ${value}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Average Transaction Value</span>
                <span className="font-medium">ZMW {summaryStats.avgTransactionValue.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Best Month Revenue</span>
                <span className="font-medium text-green-600">
                  ZMW {Math.max(...processedData.map(d => d.revenue)).toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Most Active Month</span>
                <span className="font-medium text-blue-600">
                  {Math.max(...processedData.map(d => d.transactions))} transactions
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Peak Customer Month</span>
                <span className="font-medium text-purple-600">
                  {Math.max(...processedData.map(d => d.customers))} customers
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
