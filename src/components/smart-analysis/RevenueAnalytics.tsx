import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  BarChart3,
  PieChart,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedNumber } from '@/components/AnimatedNumber';

interface RevenueAnalyticsProps {
  data: {
    totalRevenue: number;
    avgTransactionValue: number;
    profitabilityMetrics: {
      grossProfit: number;
      profitMargin: number;
    };
    monthlyData: any[];
    weeklyData: any[];
    categoryPerformance: any[];
    rawTransactions: any[];
    lastUpdated: Date;
    isUpdating: boolean;
  };
}

interface RevenueData {
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
    transactions: number;
    avgTransactionValue: number;
    profitMargin: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    revenue: number;
    transactions: number;
    avgValue: number;
    pictures: number;
    profitability: number;
    percentage: number;
  }>;
  dailyAverages: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  revenueGrowth: {
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
  };
  hourlyPatterns: Array<{ hour: number; revenue: number }>;
  seasonalAnalysis: Array<{ season: string; revenue: number }>;
  topCustomers: Array<{ customer: string; spending: number }>;
  weeklyTrends: Array<{ week: string; revenue: number; transactions: number }>;
  forecast: {
    nextMonth: number;
    confidence: number;
  };
  insights: {
    peakHour: { hour: number; revenue: number };
    bestSeason: { season: string; revenue: number };
    avgDailyRevenue: number;
    revenueVolatility: number;
  };
}

export function RevenueAnalytics({ data }: RevenueAnalyticsProps) {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'6months' | '12months' | 'all'>('6months');

  const getDefaultRevenueData = (): any => ({
    monthlyRevenue: [],
    categoryBreakdown: [],
    revenueStreams: [],
    growthMetrics: {
      monthOverMonth: 0,
      yearOverYear: 0,
      quarterOverQuarter: 0
    },
    forecasting: {
      nextMonth: 0,
      nextQuarter: 0,
      confidence: 0
    }
  });

  useEffect(() => {
    processRevenueDataRealtime();
  }, [data.rawTransactions, data.lastUpdated, timeframe]);

  const processRevenueDataRealtime = () => {
    setLoading(true);
    try {
      console.log('💰 Revenue Analytics: Processing real-time transaction data...');

      // Validate input data
      if (!data.rawTransactions || !Array.isArray(data.rawTransactions)) {
        console.warn('Invalid transaction data provided to RevenueAnalytics');
        setRevenueData(getDefaultRevenueData());
        return;
      }

      const processedData = processRevenueData(data.rawTransactions);
      setRevenueData(processedData);
      console.log('✅ Revenue Analytics: Data updated in real-time');
    } catch (error) {
      console.error('Error processing revenue data:', error);
      // Set fallback data instead of crashing
      setRevenueData(getDefaultRevenueData());
    } finally {
      setLoading(false);
    }
  };

  const processRevenueData = (transactions: any[]): RevenueData => {
    // Advanced revenue analytics processing
    const monthlyData = new Map();
    const categoryData = new Map();
    const dailyData = { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
    const dailyCounts = { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };

    // Additional analytics data structures
    const hourlyRevenue = new Map();
    const weeklyTrends = new Map();
    const seasonalData = new Map();
    const customerSpending = new Map();

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof dailyData;
      const amount = Number(transaction.amount);
      const hour = transaction.time ? parseInt(transaction.time.split(':')[0]) : 12;
      const season = getSeason(date.getMonth());
      const weekKey = getWeekKey(date);

      // Monthly data with enhanced metrics
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          revenue: 0,
          expenses: 0,
          transactions: 0,
          pictures: 0,
          avgTransactionValue: 0,
          profitMargin: 0
        });
      }

      const monthData = monthlyData.get(monthKey);
      if (transaction.type === 'cash-in') {
        monthData.revenue += amount;
        monthData.transactions += 1;
        monthData.pictures += Number(transaction.number_of_pictures) || 0;

        // Category breakdown with enhanced metrics
        const category = transaction.category_name || 'Other';
        if (!categoryData.has(category)) {
          categoryData.set(category, {
            revenue: 0,
            transactions: 0,
            avgValue: 0,
            pictures: 0,
            profitability: 0
          });
        }
        const catData = categoryData.get(category);
        catData.revenue += amount;
        catData.transactions += 1;
        catData.pictures += Number(transaction.number_of_pictures) || 0;

        // Daily patterns
        dailyData[dayName] += amount;
        dailyCounts[dayName]++;

        // Hourly revenue patterns
        hourlyRevenue.set(hour, (hourlyRevenue.get(hour) || 0) + amount);

        // Weekly trends
        if (!weeklyTrends.has(weekKey)) {
          weeklyTrends.set(weekKey, { revenue: 0, transactions: 0 });
        }
        const weekData = weeklyTrends.get(weekKey);
        weekData.revenue += amount;
        weekData.transactions += 1;

        // Seasonal analysis
        seasonalData.set(season, (seasonalData.get(season) || 0) + amount);

        // Customer spending patterns
        if (transaction.customer_name) {
          const customer = transaction.customer_name.toLowerCase().trim();
          customerSpending.set(customer, (customerSpending.get(customer) || 0) + amount);
        }
      } else {
        monthData.expenses += amount;
      }

      // Calculate derived metrics
      monthData.avgTransactionValue = monthData.transactions > 0 ? monthData.revenue / monthData.transactions : 0;
      monthData.profitMargin = monthData.revenue > 0 ? ((monthData.revenue - monthData.expenses) / monthData.revenue) * 100 : 0;
    });

    // Helper functions
    function getSeason(month: number): string {
      if (month >= 2 && month <= 4) return 'Spring';
      if (month >= 5 && month <= 7) return 'Summer';
      if (month >= 8 && month <= 10) return 'Fall';
      return 'Winter';
    }

    function getWeekKey(date: Date): string {
      const year = date.getFullYear();
      const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
      return `${year}-W${week}`;
    }

    // Calculate category averages and profitability
    categoryData.forEach((data, category) => {
      data.avgValue = data.transactions > 0 ? data.revenue / data.transactions : 0;
      // Estimate profitability based on category (this could be enhanced with actual cost data)
      const profitabilityRates = {
        'Portrait': 0.65,
        'Wedding': 0.55,
        'Event': 0.60,
        'Commercial': 0.70,
        'Other': 0.50
      };
      data.profitability = (profitabilityRates[category as keyof typeof profitabilityRates] || 0.50) * 100;
    });

    // Convert to arrays and calculate averages
    const monthlyRevenue = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses
      }))
      .slice(-6); // Last 6 months

    const totalRevenue = Array.from(categoryData.values()).reduce((sum, data) => sum + data.revenue, 0);
    const categoryBreakdown = Array.from(categoryData.entries())
      .map(([category, data]) => ({
        category,
        revenue: data.revenue,
        transactions: data.transactions,
        avgValue: data.avgValue,
        pictures: data.pictures,
        profitability: data.profitability,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate daily averages
    Object.keys(dailyData).forEach(day => {
      const dayKey = day as keyof typeof dailyData;
      if (dailyCounts[dayKey] > 0) {
        dailyData[dayKey] = dailyData[dayKey] / dailyCounts[dayKey];
      }
    });

    // Growth calculation
    const thisMonth = monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0;
    const lastMonth = monthlyRevenue[monthlyRevenue.length - 2]?.revenue || 0;
    const growthRate = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    // Advanced analytics calculations
    const hourlyPatterns = Array.from(hourlyRevenue.entries())
      .map(([hour, revenue]) => ({ hour, revenue }))
      .sort((a, b) => a.hour - b.hour);

    const seasonalAnalysis = Array.from(seasonalData.entries())
      .map(([season, revenue]) => ({ season, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    const topCustomers = Array.from(customerSpending.entries())
      .map(([customer, spending]) => ({ customer, spending }))
      .sort((a, b) => b.spending - a.spending)
      .slice(0, 10);

    const weeklyTrendData = Array.from(weeklyTrends.entries())
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12); // Last 12 weeks

    // Revenue forecasting (simple linear regression)
    const forecastNextMonth = () => {
      if (monthlyRevenue.length < 3) return thisMonth;

      const recentTrend = monthlyRevenue.slice(-3);
      const avgGrowth = recentTrend.reduce((sum, month, index) => {
        if (index === 0) return sum;
        const prevMonth = recentTrend[index - 1];
        return sum + (prevMonth.revenue > 0 ? (month.revenue - prevMonth.revenue) / prevMonth.revenue : 0);
      }, 0) / (recentTrend.length - 1);

      return Math.max(0, thisMonth * (1 + avgGrowth));
    };

    return {
      monthlyRevenue: monthlyRevenue.map(month => ({
        ...month,
        transactions: monthlyData.get(month.month.replace(/\s/g, ''))?.transactions || 0,
        avgTransactionValue: monthlyData.get(month.month.replace(/\s/g, ''))?.avgTransactionValue || 0,
        profitMargin: monthlyData.get(month.month.replace(/\s/g, ''))?.profitMargin || 0
      })),
      categoryBreakdown,
      dailyAverages: dailyData,
      revenueGrowth: {
        thisMonth,
        lastMonth,
        growthRate
      },
      // Enhanced analytics
      hourlyPatterns,
      seasonalAnalysis,
      topCustomers,
      weeklyTrends: weeklyTrendData,
      forecast: {
        nextMonth: forecastNextMonth(),
        confidence: Math.min(95, Math.max(60, 85 - Math.abs(growthRate) * 2)) // Dynamic confidence based on volatility
      },
      insights: {
        peakHour: hourlyPatterns.reduce((max, hour) => hour.revenue > max.revenue ? hour : max, { hour: 12, revenue: 0 }),
        bestSeason: seasonalAnalysis[0] || { season: 'Summer', revenue: 0 },
        avgDailyRevenue: Object.values(dailyData).reduce((sum, val) => sum + val, 0) / 7,
        revenueVolatility: calculateVolatility(monthlyRevenue.map(m => m.revenue))
      }
    };
  };

  // Helper function for volatility calculation
  const calculateVolatility = (values: number[]): number => {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean * 100; // Coefficient of variation as percentage
  };

  const formatCurrency = (amount: number) => `ZMW ${amount.toLocaleString()}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">
            {data.isUpdating ? 'Updating revenue analytics in real-time...' : 'Processing revenue data...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Forecast & Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-purple-600 text-sm font-medium mb-2">Next Month Forecast</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(revenueData?.forecast.nextMonth || 0)}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                {revenueData?.forecast.confidence || 0}% confidence
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-orange-600 text-sm font-medium mb-2">Peak Revenue Hour</p>
              <p className="text-2xl font-bold text-orange-900">
                {revenueData?.insights.peakHour.hour || 12}:00
              </p>
              <div className="text-xs text-gray-500 mt-1">
                {formatCurrency(revenueData?.insights.peakHour.revenue || 0)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-teal-600 text-sm font-medium mb-2">Best Season</p>
              <p className="text-xl font-bold text-teal-900">
                {revenueData?.insights.bestSeason.season || 'Summer'}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                {formatCurrency(revenueData?.insights.bestSeason.revenue || 0)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-pink-600 text-sm font-medium mb-2">Revenue Stability</p>
              <p className="text-xl font-bold text-pink-900">
                {revenueData?.insights.revenueVolatility < 20 ? 'Stable' :
                 revenueData?.insights.revenueVolatility < 40 ? 'Moderate' : 'Volatile'}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                {revenueData?.insights.revenueVolatility.toFixed(1)}% volatility
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-indigo-600" />
            Service Category Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueData?.categoryBreakdown.map((category, index) => (
              <div key={category.category} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{category.category}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      {category.transactions} transactions
                    </span>
                    <span className="font-bold text-indigo-900">
                      {formatCurrency(category.revenue)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Avg Value: </span>
                    <span className="font-medium">{formatCurrency(category.avgValue)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Pictures: </span>
                    <span className="font-medium">{category.pictures}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Profitability: </span>
                    <span className="font-medium text-green-600">{category.profitability.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{category.percentage.toFixed(1)}% of total revenue</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Growth Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Revenue Growth Analysis
            {data.isUpdating && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
                Updating
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">This Month</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(revenueData?.revenueGrowth.thisMonth || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Last Month</p>
              <p className="text-2xl font-bold text-gray-700">
                {formatCurrency(revenueData?.revenueGrowth.lastMonth || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Growth Rate</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${
                  (revenueData?.revenueGrowth.growthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(revenueData?.revenueGrowth.growthRate || 0) >= 0 ? '+' : ''}
                  <AnimatedNumber value={revenueData?.revenueGrowth.growthRate || 0} />%
                </p>
                {(revenueData?.revenueGrowth.growthRate || 0) >= 0 ? 
                  <TrendingUp className="h-5 w-5 text-green-600" /> : 
                  <TrendingDown className="h-5 w-5 text-red-600" />
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Monthly Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueData?.monthlyRevenue.map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{month.month}</span>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">
                      {formatCurrency(month.revenue)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Profit: {formatCurrency(month.profit)}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, (month.revenue / Math.max(...(revenueData?.monthlyRevenue.map(m => m.revenue) || [1]))) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-600" />
            Revenue by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {revenueData?.categoryBreakdown.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ 
                      backgroundColor: `hsl(${(index * 60) % 360}, 70%, 60%)` 
                    }}
                  ></div>
                  <span className="font-medium">{category.category}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    {formatCurrency(category.revenue)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {category.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            Average Daily Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {Object.entries(revenueData?.dailyAverages || {}).map(([day, avg]) => (
              <div key={day} className="text-center p-3 rounded-lg bg-orange-50 border border-orange-200">
                <div className="text-xs font-medium text-orange-600 uppercase mb-1">
                  {day.slice(0, 3)}
                </div>
                <div className="text-sm font-bold text-orange-900">
                  ZMW {Math.round(avg)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            Revenue Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
              <h4 className="font-medium text-indigo-900 mb-2">Peak Performance</h4>
              <p className="text-sm text-indigo-700">
                Your best performing category is{' '}
                <span className="font-bold">
                  {revenueData?.categoryBreakdown[0]?.category || 'N/A'}
                </span>
                {' '}generating{' '}
                <span className="font-bold">
                  {revenueData?.categoryBreakdown[0]?.percentage.toFixed(1) || 0}%
                </span>
                {' '}of total revenue.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Growth Opportunity</h4>
              <p className="text-sm text-blue-700">
                Focus on{' '}
                <span className="font-bold">
                  {Object.entries(revenueData?.dailyAverages || {})
                    .sort(([,a], [,b]) => a - b)[0]?.[0] || 'weekdays'}
                </span>
                {' '}to boost revenue. Consider special promotions or extended hours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
