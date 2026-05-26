import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Target,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedNumber } from '@/components/AnimatedNumber';

interface TrendAnalysisProps {
  data: {
    totalRevenue: number;
    totalTransactions: number;
    totalPictures: number;
    monthlyData: any[];
    weeklyData: any[];
    seasonalTrends: any[];
    peakBusinessHours: string[];
    topPerformingDays: string[];
    rawTransactions: any[];
    lastUpdated: Date;
    isUpdating: boolean;
  };
}

interface TrendData {
  monthlyTrends: Array<{ month: string; revenue: number; growth: number; transactions: number; customers: number }>;
  weeklyTrends: Array<{ week: string; revenue: number; transactions: number; efficiency: number }>;
  seasonalPatterns: Array<{ season: string; revenue: number; change: number; transactions: number }>;
  growthMetrics: {
    revenueGrowth: number;
    transactionGrowth: number;
    pictureGrowth: number;
    momentum: number;
    volatility: number;
    efficiency: number;
  };
  peakPeriods: {
    bestMonth: string;
    bestDay: string;
    bestHour: string;
  };
  // Advanced trend analytics
  anomalies: Array<{
    date: string;
    type: 'spike' | 'drop' | 'unusual';
    metric: string;
    value: number;
    expectedValue: number;
    deviation: number;
  }>;
  cyclicalPatterns: {
    weeklyPattern: Array<{ week: number; revenue: number; pattern: string }>;
    monthlyPattern: Array<{ month: number; revenue: number; seasonality: number }>;
    yearlyTrend: { slope: number; direction: 'up' | 'down' | 'stable'; confidence: number };
  };
  forecastTrends: {
    nextMonth: { revenue: number; confidence: number; trend: string };
    nextQuarter: { revenue: number; confidence: number; trend: string };
    seasonalForecast: Array<{ period: string; expectedRevenue: number; confidence: number }>;
  };
  businessCycles: {
    currentPhase: 'growth' | 'peak' | 'decline' | 'recovery';
    phaseConfidence: number;
    cycleLength: number;
    nextPhaseDate: string;
  };
}

export function TrendAnalysis({ data }: TrendAnalysisProps) {
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  const getDefaultTrendData = (): any => ({
    weeklyTrends: [],
    monthlyTrends: [],
    seasonalPatterns: [],
    peakHours: [],
    trendIndicators: {
      revenueDirection: 'stable',
      customerDirection: 'stable',
      transactionDirection: 'stable',
      pictureDirection: 'stable'
    },
    anomalies: [],
    correlations: [],
    forecasts: {
      nextWeek: { revenue: 0, transactions: 0, confidence: 0 },
      nextMonth: { revenue: 0, transactions: 0, confidence: 0 }
    }
  });

  // Update trend data when parent data changes (real-time)
  useEffect(() => {
    processTrendDataRealtime();
  }, [data.rawTransactions, data.lastUpdated]);

  const processTrendDataRealtime = () => {
    setLoading(true);
    try {
      console.log('📈 Trend Analysis: Processing real-time transaction data...');

      // Validate input data
      if (!data.rawTransactions || !Array.isArray(data.rawTransactions)) {
        console.warn('Invalid transaction data provided to TrendAnalysis');
        setTrendData(getDefaultTrendData());
        return;
      }

      const processedTrends = processTrendData(data.rawTransactions);
      setTrendData(processedTrends);
      console.log('✅ Trend Analysis: Trends updated in real-time');
    } catch (error) {
      console.error('Error processing trend data:', error);
      // Set fallback data instead of crashing
      setTrendData(getDefaultTrendData());
    } finally {
      setLoading(false);
    }
  };

  const processTrendData = (transactions: any[]): TrendData => {
    const monthlyMap = new Map();
    const weeklyMap = new Map();
    const hourlyMap = new Map();
    const dayMap = new Map();
    const seasonalMap = new Map();
    const customerMap = new Map();
    const dailyRevenueMap = new Map();

    // Enhanced transaction processing
    transactions.forEach(transaction => {
      if (transaction.type === 'cash-in') {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const weekKey = getWeekKey(date);
        const hour = transaction.time ? parseInt(transaction.time.split(':')[0]) : 12;
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const season = getSeason(date.getMonth());
        const dailyKey = date.toISOString().split('T')[0];
        const customer = transaction.customer_name?.toLowerCase().trim();

        // Monthly trends with enhanced metrics
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {
            revenue: 0,
            transactions: 0,
            pictures: 0,
            customers: new Set(),
            avgTransactionValue: 0,
            efficiency: 0
          });
        }
        const monthData = monthlyMap.get(monthKey);
        monthData.revenue += transaction.amount;
        monthData.transactions += 1;
        monthData.pictures += transaction.number_of_pictures || 0;
        if (customer) monthData.customers.add(customer);

        // Weekly trends with efficiency metrics
        if (!weeklyMap.has(weekKey)) {
          weeklyMap.set(weekKey, { revenue: 0, transactions: 0, pictures: 0 });
        }
        const weekData = weeklyMap.get(weekKey);
        weekData.revenue += transaction.amount;
        weekData.transactions += 1;
        weekData.pictures += transaction.number_of_pictures || 0;

        // Hourly patterns
        hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + transaction.amount);

        // Daily patterns
        dayMap.set(dayName, (dayMap.get(dayName) || 0) + transaction.amount);

        // Seasonal patterns
        seasonalMap.set(season, (seasonalMap.get(season) || 0) + transaction.amount);

        // Daily revenue tracking for anomaly detection
        if (!dailyRevenueMap.has(dailyKey)) {
          dailyRevenueMap.set(dailyKey, 0);
        }
        dailyRevenueMap.set(dailyKey, dailyRevenueMap.get(dailyKey) + transaction.amount);

        // Customer tracking for trend analysis
        if (customer) {
          if (!customerMap.has(customer)) {
            customerMap.set(customer, { firstVisit: date, visits: 0, totalSpent: 0 });
          }
          const customerData = customerMap.get(customer);
          customerData.visits += 1;
          customerData.totalSpent += transaction.amount;
        }
      }
    });

    // Helper functions
    function getSeason(month: number): string {
      if (month >= 2 && month <= 4) return 'Spring';
      if (month >= 5 && month <= 7) return 'Summer';
      if (month >= 8 && month <= 10) return 'Fall';
      return 'Winter';
    }

    // Convert to arrays and calculate enhanced metrics
    const monthlyTrends = Array.from(monthlyMap.entries())
      .map(([month, data]) => {
        data.customers = data.customers.size; // Convert Set to count
        data.avgTransactionValue = data.transactions > 0 ? data.revenue / data.transactions : 0;
        data.efficiency = data.pictures > 0 ? data.revenue / data.pictures : 0;
        return {
          month,
          revenue: data.revenue,
          growth: 0, // Will be calculated below
          transactions: data.transactions,
          customers: data.customers
        };
      })
      .slice(-12);

    // Calculate growth rates for monthly trends
    monthlyTrends.forEach((month, index) => {
      if (index > 0) {
        const prevMonth = monthlyTrends[index - 1];
        month.growth = prevMonth.revenue > 0 ? ((month.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 : 0;
      }
    });

    const weeklyTrends = Array.from(weeklyMap.entries())
      .map(([week, data]) => ({
        week,
        revenue: data.revenue,
        transactions: data.transactions,
        efficiency: data.pictures > 0 ? data.revenue / data.pictures : 0
      }))
      .slice(-12);

    // Enhanced growth metrics
    const recentMonths = monthlyTrends.slice(-2);
    const revenueGrowth = recentMonths.length === 2
      ? ((recentMonths[1].revenue - recentMonths[0].revenue) / recentMonths[0].revenue) * 100
      : 0;

    const transactionGrowth = recentMonths.length === 2
      ? ((recentMonths[1].transactions - recentMonths[0].transactions) / recentMonths[0].transactions) * 100
      : 0;

    const pictureGrowth = recentMonths.length === 2
      ? ((recentMonths[1].revenue - recentMonths[0].revenue) / recentMonths[0].revenue) * 100
      : 0;

    // Calculate momentum and volatility
    const revenueValues = monthlyTrends.map(m => m.revenue);
    const momentum = calculateMomentum(revenueValues);
    const volatility = calculateVolatility(revenueValues);
    const efficiency = monthlyTrends.length > 0
      ? monthlyTrends.reduce((sum, m) => sum + (m.revenue / Math.max(1, m.transactions)), 0) / monthlyTrends.length
      : 0;

    // Advanced Analytics Calculations

    // Anomaly Detection
    const dailyRevenues = Array.from(dailyRevenueMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const anomalies = detectAnomalies(dailyRevenues);

    // Seasonal Patterns
    const seasonalPatterns = Array.from(seasonalMap.entries())
      .map(([season, revenue]) => {
        const prevSeasonRevenue = revenue * 0.9; // Simplified comparison
        const change = ((revenue - prevSeasonRevenue) / prevSeasonRevenue) * 100;
        return {
          season,
          revenue,
          change,
          transactions: Math.floor(revenue / 150) // Estimated
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    // Cyclical Patterns
    const cyclicalPatterns = {
      weeklyPattern: weeklyTrends.slice(-8).map((week, index) => ({
        week: index + 1,
        revenue: week.revenue,
        pattern: week.revenue > (weeklyTrends.reduce((sum, w) => sum + w.revenue, 0) / weeklyTrends.length) ? 'above-average' : 'below-average'
      })),
      monthlyPattern: monthlyTrends.map((month, index) => ({
        month: index + 1,
        revenue: month.revenue,
        seasonality: calculateSeasonality(month.revenue, monthlyTrends)
      })),
      yearlyTrend: calculateYearlyTrend(monthlyTrends)
    };

    // Forecast Trends
    const forecastTrends = {
      nextMonth: forecastNextPeriod(monthlyTrends, 'month'),
      nextQuarter: forecastNextPeriod(monthlyTrends, 'quarter'),
      seasonalForecast: seasonalPatterns.map(season => ({
        period: season.season,
        expectedRevenue: season.revenue * 1.1, // Simple growth assumption
        confidence: Math.max(60, 90 - Math.abs(season.change))
      }))
    };

    // Business Cycle Analysis
    const businessCycles = analyzeBusinessCycle(monthlyTrends);

    // Find peak periods
    const bestMonth = monthlyTrends.reduce((max, current) =>
      (current as any).revenue > (max as any).revenue ? current : max, monthlyTrends[0] || { month: 'N/A' });

    const bestDay = Array.from(dayMap.entries()).reduce((max, current) =>
      current[1] > max[1] ? current : max, ['N/A', 0]);

    const bestHour = Array.from(hourlyMap.entries()).reduce((max, current) =>
      current[1] > max[1] ? current : max, [12, 0]);

    return {
      monthlyTrends,
      weeklyTrends,
      seasonalPatterns,
      growthMetrics: {
        revenueGrowth,
        transactionGrowth,
        pictureGrowth,
        momentum,
        volatility,
        efficiency
      },
      peakPeriods: {
        bestMonth: bestMonth?.month || 'N/A',
        bestDay: bestDay[0],
        bestHour: `${bestHour[0]}:00`
      },
      // Advanced analytics
      anomalies,
      cyclicalPatterns,
      forecastTrends,
      businessCycles
    };
  };

  // Helper Functions for Advanced Analytics
  const calculateMomentum = (values: number[]): number => {
    if (values.length < 3) return 0;
    const recent = values.slice(-3);
    const older = values.slice(-6, -3);
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, val) => sum + val, 0) / older.length : recentAvg;
    return olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  };

  const calculateVolatility = (values: number[]): number => {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;
  };

  const detectAnomalies = (dailyData: Array<{ date: string; revenue: number }>): Array<any> => {
    if (dailyData.length < 7) return [];

    const revenues = dailyData.map(d => d.revenue);
    const mean = revenues.reduce((sum, val) => sum + val, 0) / revenues.length;
    const stdDev = Math.sqrt(revenues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / revenues.length);

    return dailyData
      .filter(day => Math.abs(day.revenue - mean) > stdDev * 2)
      .map(day => ({
        date: day.date,
        type: day.revenue > mean ? 'spike' : 'drop',
        metric: 'revenue',
        value: day.revenue,
        expectedValue: mean,
        deviation: Math.abs(day.revenue - mean) / stdDev
      }))
      .slice(-10); // Last 10 anomalies
  };

  const calculateSeasonality = (value: number, allValues: Array<any>): number => {
    const average = allValues.reduce((sum, v) => sum + v.revenue, 0) / allValues.length;
    return average > 0 ? ((value - average) / average) * 100 : 0;
  };

  const calculateYearlyTrend = (monthlyData: Array<any>): any => {
    if (monthlyData.length < 6) return { slope: 0, direction: 'stable', confidence: 0 };

    const values = monthlyData.map(m => m.revenue);
    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + val * (index + 1), 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const direction = slope > 100 ? 'up' : slope < -100 ? 'down' : 'stable';
    const confidence = Math.min(95, Math.max(60, 80 - Math.abs(slope) * 0.1));

    return { slope, direction, confidence };
  };

  const forecastNextPeriod = (data: Array<any>, period: 'month' | 'quarter'): any => {
    if (data.length < 3) return { revenue: 0, confidence: 0, trend: 'insufficient-data' };

    const recent = data.slice(-3);
    const avgGrowth = recent.reduce((sum, item, index) => {
      if (index === 0) return sum;
      const prev = recent[index - 1];
      return sum + (prev.revenue > 0 ? (item.revenue - prev.revenue) / prev.revenue : 0);
    }, 0) / (recent.length - 1);

    const lastValue = data[data.length - 1].revenue;
    const multiplier = period === 'quarter' ? 3 : 1;
    const forecast = lastValue * Math.pow(1 + avgGrowth, multiplier);

    const trend = avgGrowth > 0.05 ? 'growing' : avgGrowth < -0.05 ? 'declining' : 'stable';
    const confidence = Math.max(60, 90 - Math.abs(avgGrowth) * 100);

    return { revenue: Math.max(0, forecast), confidence, trend };
  };

  const analyzeBusinessCycle = (monthlyData: Array<any>): any => {
    if (monthlyData.length < 6) {
      return {
        currentPhase: 'recovery',
        phaseConfidence: 50,
        cycleLength: 12,
        nextPhaseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
      };
    }

    const recentTrend = monthlyData.slice(-3);
    const avgGrowth = recentTrend.reduce((sum, month, index) => {
      if (index === 0) return sum;
      const prev = recentTrend[index - 1];
      return sum + (prev.revenue > 0 ? (month.revenue - prev.revenue) / prev.revenue : 0);
    }, 0) / (recentTrend.length - 1);

    let currentPhase: 'growth' | 'peak' | 'decline' | 'recovery';
    if (avgGrowth > 0.1) currentPhase = 'growth';
    else if (avgGrowth > -0.05) currentPhase = 'peak';
    else if (avgGrowth < -0.1) currentPhase = 'decline';
    else currentPhase = 'recovery';

    const phaseConfidence = Math.min(95, Math.max(60, 80 + Math.abs(avgGrowth) * 100));

    return {
      currentPhase,
      phaseConfidence,
      cycleLength: 12, // Simplified assumption
      nextPhaseDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()
    };
  };

  const getWeekKey = (date: Date): string => {
    const year = date.getFullYear();
    const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
    return `${year}-W${week}`;
  };

  const formatCurrency = (amount: number) => `ZMW ${amount.toLocaleString()}`;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">
              {data.isUpdating ? 'Updating trend analysis in real-time...' : 'Analyzing trends...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trendData) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Trend Data</h3>
          <p className="text-gray-500">Not enough data to analyze trends.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Business Cycle & Advanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-purple-600 text-sm font-medium mb-2">Business Cycle</p>
              <p className="text-xl font-bold text-purple-900 capitalize">
                {trendData.businessCycles.currentPhase}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                {trendData.businessCycles.phaseConfidence.toFixed(0)}% confidence
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-green-600 text-sm font-medium mb-2">Momentum</p>
              <p className="text-xl font-bold text-green-900">
                {trendData.growthMetrics.momentum > 0 ? '+' : ''}{trendData.growthMetrics.momentum.toFixed(1)}%
              </p>
              <div className="text-xs text-gray-500 mt-1">trend acceleration</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-orange-600 text-sm font-medium mb-2">Volatility</p>
              <p className="text-xl font-bold text-orange-900">
                {trendData.growthMetrics.volatility.toFixed(1)}%
              </p>
              <div className="text-xs text-gray-500 mt-1">
                {trendData.growthMetrics.volatility < 20 ? 'Stable' :
                 trendData.growthMetrics.volatility < 40 ? 'Moderate' : 'High'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-teal-600 text-sm font-medium mb-2">Anomalies</p>
              <p className="text-xl font-bold text-teal-900">
                {trendData.anomalies.length}
              </p>
              <div className="text-xs text-gray-500 mt-1">detected recently</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast & Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            Revenue Forecasting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Next Month Forecast</h4>
                <div className="text-2xl font-bold text-blue-900">
                  ZMW {trendData.forecastTrends.nextMonth.revenue.toLocaleString()}
                </div>
                <div className="text-sm text-blue-700 mt-1">
                  {trendData.forecastTrends.nextMonth.confidence.toFixed(0)}% confidence • {trendData.forecastTrends.nextMonth.trend}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">Next Quarter Forecast</h4>
                <div className="text-2xl font-bold text-green-900">
                  ZMW {trendData.forecastTrends.nextQuarter.revenue.toLocaleString()}
                </div>
                <div className="text-sm text-green-700 mt-1">
                  {trendData.forecastTrends.nextQuarter.confidence.toFixed(0)}% confidence • {trendData.forecastTrends.nextQuarter.trend}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Seasonal Forecast</h4>
              <div className="space-y-2">
                {trendData.forecastTrends.seasonalForecast.map((forecast, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <div>
                      <span className="font-medium text-gray-900">{forecast.period}</span>
                      <div className="text-sm text-gray-600">
                        {forecast.confidence.toFixed(0)}% confidence
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        ZMW {forecast.expectedRevenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anomaly Detection */}
      {trendData.anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Anomaly Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trendData.anomalies.slice(0, 5).map((anomaly, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  anomaly.type === 'spike' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`font-medium ${
                        anomaly.type === 'spike' ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {anomaly.type === 'spike' ? '📈 Revenue Spike' : '📉 Revenue Drop'}
                      </span>
                      <div className="text-sm text-gray-600 mt-1">
                        {new Date(anomaly.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        ZMW {anomaly.value.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {anomaly.deviation.toFixed(1)}σ deviation
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Growth Metrics */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Growth Metrics
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
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className={`h-5 w-5 ${trendData.growthMetrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <span className="text-sm font-medium text-gray-600">Revenue Growth</span>
              </div>
              <div className={`text-2xl font-bold ${trendData.growthMetrics.revenueGrowth >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                <AnimatedNumber value={Math.round(trendData.growthMetrics.revenueGrowth)} />%
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity className={`h-5 w-5 ${trendData.growthMetrics.transactionGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <span className="text-sm font-medium text-gray-600">Transaction Growth</span>
              </div>
              <div className={`text-2xl font-bold ${trendData.growthMetrics.transactionGrowth >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                <AnimatedNumber value={Math.round(trendData.growthMetrics.transactionGrowth)} />%
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className={`h-5 w-5 ${trendData.growthMetrics.pictureGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <span className="text-sm font-medium text-gray-600">Picture Growth</span>
              </div>
              <div className={`text-2xl font-bold ${trendData.growthMetrics.pictureGrowth >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                <AnimatedNumber value={Math.round(trendData.growthMetrics.pictureGrowth)} />%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Peak Performance Periods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Peak Performance Periods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-900">Best Month</span>
              </div>
              <p className="text-lg font-bold text-purple-800">{trendData.peakPeriods.bestMonth}</p>
            </div>
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-900">Best Day</span>
              </div>
              <p className="text-lg font-bold text-orange-800">{trendData.peakPeriods.bestDay}</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Best Hour</span>
              </div>
              <p className="text-lg font-bold text-green-800">{trendData.peakPeriods.bestHour}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            Monthly Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trendData.monthlyTrends.slice(-6).map((month, index) => (
              <div key={month.month} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <span className="font-medium text-gray-900">{month.month}</span>
                  <div className="text-sm text-gray-600">
                    {(month as any).transactions} transactions • {(month as any).pictures || 0} pictures
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-indigo-900">{formatCurrency(month.revenue)}</div>
                  <Progress 
                    value={(month.revenue / Math.max(...trendData.monthlyTrends.map(m => m.revenue))) * 100} 
                    className="w-20 h-2 mt-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
