// Customer Analytics Component - Shows customer analytics and new customer tracking
// Tracks customers by phone numbers and shows monthly analytics

import React, { useState, useEffect } from 'react';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  UserPlus,
  Phone,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Star
} from 'lucide-react';

interface CustomerData {
  month: string;
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerList: string[];
}

interface CustomerStats {
  totalUniqueCustomers: number;
  newThisMonth: number;
  averagePerMonth: number;
  topCustomers: { phone: string; name: string; transactions: number }[];
}

interface CustomerAnalyticsProps {
  selectedMonth?: string;
}

export function CustomerAnalytics({ selectedMonth }: CustomerAnalyticsProps) {
  const { currentUser, currentCompany, isLoading: authLoading, isInitialized } = useMultiTenantAuth();

  // Debug logging
  console.log('🔍 CustomerAnalytics - Props and auth state:', {
    selectedMonth,
    currentUser: currentUser?.email,
    currentCompany: currentCompany?.display_name,
    companyId: currentCompany?.id,
    authLoading,
    isInitialized
  });
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStats>({
    totalUniqueCustomers: 0,
    newThisMonth: 0,
    averagePerMonth: 0,
    topCustomers: []
  });
  const [allTimeStats, setAllTimeStats] = useState<CustomerStats>({
    totalUniqueCustomers: 0,
    newThisMonth: 0,
    averagePerMonth: 0,
    topCustomers: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isInitialized && currentCompany?.id) {
      loadCustomerAnalytics();
      loadAllTimeCustomerStats();
      const cleanup = setupRealTimeSubscription();
      return cleanup;
    } else if (isInitialized && !currentCompany) {
      setError('No company selected');
      setIsLoading(false);
    }
  }, [currentCompany, selectedYear, selectedMonth, selectedMonthFilter, isInitialized]);

  // Real-time subscription for automatic updates
  const setupRealTimeSubscription = () => {
    if (!currentCompany?.id) {
      console.warn('CustomerAnalytics: Cannot setup real-time subscription - no company ID');
      return () => {};
    }

    const subscription = supabase
      .channel('customer_analytics_real_time')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mt_company_transactions',
          filter: `company_id=eq.${currentCompany.id}`
        },
        (payload) => {
          console.log('CustomerAnalytics: Real-time update received:', payload);
          // Reload data when transactions change
          loadCustomerAnalytics();
          loadAllTimeCustomerStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  // Load all-time customer statistics (no month filtering)
  const loadAllTimeCustomerStats = async () => {
    if (!currentCompany?.id) {
      console.warn('CustomerAnalytics: Cannot load all-time stats - no company ID');
      return;
    }

    try {
      console.log('📊 CustomerAnalytics: Loading ALL-TIME customer statistics...');

      let query = supabase
        .from('mt_company_transactions')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('type', 'cash-in') // Only cash-in transactions have customer data
        .not('whatsapp_number', 'is', null)
        .not('whatsapp_number', 'eq', '');

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;

      const allTimeCustomerStats = calculateCustomerStats(data || []);
      setAllTimeStats(allTimeCustomerStats);
      console.log('📊 CustomerAnalytics: All-time stats loaded -', allTimeCustomerStats.totalUniqueCustomers, 'total customers');
    } catch (error) {
      console.error('Error loading all-time customer stats:', error);
    }
  };

  const loadCustomerAnalytics = async () => {
    if (!currentCompany?.id) {
      console.warn('CustomerAnalytics: Cannot load data - no company ID');
      setError('No company selected');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Always fetch ALL-TIME customer data (as per user requirements)
      const { data, error } = await supabase
        .from('mt_company_transactions')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('type', 'cash-in') // Only cash-in transactions have customer data
        .not('whatsapp_number', 'is', null)
        .not('whatsapp_number', 'eq', '')
        .order('created_at', { ascending: true });

      console.log(`🔍 CustomerAnalytics: Fetching ALL-TIME customer data for company ${currentCompany.id}`);

      if (error) throw error;

      const processedData = processCustomerData(data || []);
      setCustomerData(processedData);
      setCustomerStats(calculateCustomerStats(data || []));
      console.log('CustomerAnalytics: Loaded', data?.length || 0, 'customer transactions (ALL-TIME)');
    } catch (error) {
      console.error('Error loading customer analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to load customer analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const processCustomerData = (transactions: any[]): CustomerData[] => {
    const monthlyData: { [key: string]: Set<string> } = {};
    const customerFirstSeen: { [key: string]: string } = {};

    // Track when each customer was first seen
    transactions.forEach(transaction => {
      const date = new Date(transaction.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const customerKey = transaction.whatsapp_number;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = new Set();
      }
      monthlyData[monthKey].add(customerKey);

      // Track first appearance
      if (!customerFirstSeen[customerKey] || transaction.created_at < customerFirstSeen[customerKey]) {
        customerFirstSeen[customerKey] = monthKey;
      }
    });

    // Calculate new vs returning customers for each month
    return Object.entries(monthlyData)
      .filter(([month]) => month.startsWith(selectedYear.toString()))
      .map(([month, customers]) => {
        const customerArray = Array.from(customers);
        const newCustomers = customerArray.filter(customer => 
          customerFirstSeen[customer] === month
        ).length;
        
        return {
          month,
          totalCustomers: customerArray.length,
          newCustomers,
          returningCustomers: customerArray.length - newCustomers,
          customerList: customerArray
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const calculateCustomerStats = (transactions: any[]): CustomerStats => {
    const uniqueCustomers = new Set(transactions.map(t => t.whatsapp_number));
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    
    // Count new customers this month
    const customerFirstSeen: { [key: string]: string } = {};
    transactions.forEach(transaction => {
      const date = new Date(transaction.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const customerKey = transaction.whatsapp_number;

      if (!customerFirstSeen[customerKey] || transaction.created_at < customerFirstSeen[customerKey]) {
        customerFirstSeen[customerKey] = monthKey;
      }
    });

    const newThisMonth = Object.values(customerFirstSeen).filter(month => month === currentMonth).length;

    // Calculate top customers by transaction count
    const customerTransactionCount: { [key: string]: { count: number; name: string } } = {};
    transactions.forEach(transaction => {
      const key = transaction.whatsapp_number;
      if (!customerTransactionCount[key]) {
        customerTransactionCount[key] = { count: 0, name: transaction.customer_name || 'Unknown' };
      }
      customerTransactionCount[key].count++;
    });

    const topCustomers = Object.entries(customerTransactionCount)
      .map(([phone, data]) => ({
        phone,
        name: data.name,
        transactions: data.count
      }))
      .sort((a, b) => b.transactions - a.transactions)
      .slice(0, 10);

    return {
      totalUniqueCustomers: uniqueCustomers.size,
      newThisMonth,
      averagePerMonth: customerData.length > 0 ? 
        customerData.reduce((sum, month) => sum + month.newCustomers, 0) / customerData.length : 0,
      topCustomers
    };
  };

  const formatMonthLabel = (month: string): string => {
    const [year, monthNum] = month.split('-');
    return new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const getMaxCustomers = () => {
    return Math.max(...customerData.map(d => d.totalCustomers), 0);
  };

  // Clean loading state
  if (!isInitialized || authLoading) {
    return (
      <Card className="bg-white shadow-lg border border-slate-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading customer analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error if user or company is not available
  if (!currentUser || !currentCompany) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600">Authentication required</p>
            <p className="text-gray-500 text-sm mt-2">
              {!currentUser ? 'Please sign in to view customer analytics.' : 'No company selected.'}
            </p>
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
            <p className="text-red-600">Error loading customer analytics</p>
            <p className="text-gray-500 text-sm mt-2">{error}</p>
            <button
              onClick={() => {
                setError(null);
                loadCustomerAnalytics();
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

  const maxCustomers = getMaxCustomers();

  return (
    <div className="space-y-6">
      {/* Clean Professional Header */}
      <Card className="bg-white shadow-lg border border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-800">
                  Customer Analytics
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  Customer insights and growth analytics for {currentCompany.display_name}
                </CardDescription>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Live Data
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Month Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            Customer Analytics Period Selection
          </CardTitle>
          <CardDescription>
            View customer analytics for specific months
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
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

            <div className="flex-1">
              <label className="text-sm font-medium mb-3 block">Select Month for Customer Analytics</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1;
                  const monthStr = month.toString().padStart(2, '0');
                  const monthValue = `${selectedYear}-${monthStr}`;
                  const monthName = new Date(selectedYear, i).toLocaleDateString('en-US', { month: 'short' });
                  const isSelected = selectedMonthFilter === monthValue;

                  return (
                    <button
                      key={monthValue}
                      onClick={() => {
                        if (selectedMonthFilter === monthValue) {
                          setSelectedMonthFilter(''); // Deselect if already selected
                        } else {
                          setSelectedMonthFilter(monthValue);
                        }
                      }}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isSelected
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {monthName}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Click any month to view customer analytics, or click again to show all-time data
              </p>
            </div>
          </div>

          {selectedMonthFilter && (
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-sm text-orange-700">
                <strong>Viewing:</strong> {new Date(selectedYear, parseInt(selectedMonthFilter.split('-')[1]) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} customer analytics
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clean All-Time Customer Statistics */}
      <Card className="bg-white shadow-lg border border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            All-Time Customer Statistics
          </CardTitle>
          <CardDescription>
            Complete customer analytics across all time periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Customers</p>
                  <p className="text-2xl font-bold text-blue-800">{allTimeStats.totalUniqueCustomers}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700">Monthly Average</p>
                  <p className="text-2xl font-bold text-green-800">{allTimeStats.averagePerMonth.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-700">Top Customer</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {allTimeStats.topCustomers[0]?.transactions || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-700">Customer Base</p>
                  <p className="text-2xl font-bold text-orange-800">{allTimeStats.totalUniqueCustomers}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Monthly Customer Statistics
          </CardTitle>
          <CardDescription>
            Customer analytics for the selected month period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Customers</p>
                    <p className="text-xl font-bold text-blue-600">{customerStats.totalUniqueCustomers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">New This Month</p>
                <p className="text-xl font-bold text-green-600">{customerStats.newThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Avg New/Month</p>
                <p className="text-xl font-bold text-purple-600">{customerStats.averagePerMonth.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Top Customer</p>
                <p className="text-lg font-bold text-orange-600">
                  {customerStats.topCustomers[0]?.transactions || 0} transactions
                </p>
              </div>
            </div>
            </CardContent>
          </Card>
          </div>
        </CardContent>
      </Card>

      {/* Customer Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Monthly Customer Growth - {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading customer data...</p>
            </div>
          ) : customerData.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No customer data available for {selectedYear}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Custom Bar Chart */}
              <div className="space-y-4">
                {customerData.map((data, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{formatMonthLabel(data.month)}</span>
                      <span className="text-gray-500">
                        Total: {data.totalCustomers} | New: {data.newCustomers} | Returning: {data.returningCustomers}
                      </span>
                    </div>
                    <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                      {/* Total Customers Bar */}
                      <div
                        className="absolute top-0 left-0 h-4 bg-blue-500 rounded-sm"
                        style={{
                          width: `${maxCustomers > 0 ? (data.totalCustomers / maxCustomers) * 100 : 0}%`
                        }}
                      />
                      {/* New Customers Bar */}
                      <div
                        className="absolute bottom-0 left-0 h-4 bg-green-500 rounded-sm"
                        style={{
                          width: `${maxCustomers > 0 ? (data.newCustomers / maxCustomers) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Total Customers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>New Customers</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-600" />
            Top Customers by Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customerStats.topCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No customer data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customerStats.topCustomers.map((customer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Phone className="h-3 w-3" />
                        <span>{customer.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{customer.transactions}</p>
                    <p className="text-xs text-gray-500">transactions</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Month</th>
                  <th className="text-right py-2">Total Customers</th>
                  <th className="text-right py-2">New Customers</th>
                  <th className="text-right py-2">Returning Customers</th>
                  <th className="text-right py-2">Growth Rate</th>
                </tr>
              </thead>
              <tbody>
                {customerData.map((row, index) => {
                  const prevMonth = index > 0 ? customerData[index - 1] : null;
                  const growthRate = prevMonth ? 
                    ((row.totalCustomers - prevMonth.totalCustomers) / prevMonth.totalCustomers * 100) : 0;
                  
                  return (
                    <tr key={index} className="border-b">
                      <td className="py-2 font-medium">{formatMonthLabel(row.month)}</td>
                      <td className="text-right py-2">{row.totalCustomers}</td>
                      <td className="text-right py-2 text-green-600">{row.newCustomers}</td>
                      <td className="text-right py-2 text-blue-600">{row.returningCustomers}</td>
                      <td className={`text-right py-2 font-medium ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
