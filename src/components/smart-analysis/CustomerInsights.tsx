import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  UserCheck,
  UserPlus,
  Heart,
  Star,
  TrendingUp,
  Crown,
  Target,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedNumber } from '@/components/AnimatedNumber';

interface CustomerInsightsProps {
  data: {
    totalCustomers: number;
    avgTransactionValue: number;
    customerSegments: any[];
    rawTransactions: any[];
    lastUpdated: Date;
    isUpdating: boolean;
  };
}

interface CustomerData {
  newCustomers: number;
  returningCustomers: number;
  loyalCustomers: number;
  customerLifetimeValue: number;
  retentionRate: number;
  acquisitionTrend: Array<{ month: string; newCustomers: number }>;
  customerSegments: {
    highValue: number;
    regular: number;
    occasional: number;
  };
  topCustomers: Array<{
    name: string;
    visits: number;
    totalSpent: number;
    lastVisit: string;
    avgTransactionValue: number;
    totalPictures: number;
    customerSince: string;
    riskScore: number;
  }>;
  // Advanced analytics
  cohortAnalysis: Array<{
    cohort: string;
    customers: number;
    retention: number[];
    revenue: number;
  }>;
  churnPrediction: {
    atRiskCustomers: number;
    churnRate: number;
    predictedChurn: Array<{
      customer: string;
      riskScore: number;
      lastVisit: string;
      totalSpent: number;
    }>;
  };
  behaviorPatterns: {
    avgDaysBetweenVisits: number;
    preferredDays: string[];
    seasonalPreferences: Array<{ season: string; customers: number }>;
    servicePreferences: Array<{ service: string; customers: number }>;
  };
  customerJourney: {
    avgTimeToSecondVisit: number;
    conversionRate: number;
    dropoffPoints: string[];
  };
}

export function CustomerInsights({ data }: CustomerInsightsProps) {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  const getDefaultCustomerData = (): CustomerData => ({
    newCustomers: 0,
    returningCustomers: 0,
    loyalCustomers: 0,
    customerLifetimeValue: 0,
    retentionRate: 0,
    acquisitionTrend: [],
    customerSegments: {
      highValue: 0,
      regular: 0,
      occasional: 0
    },
    topCustomers: [],
    cohortAnalysis: [],
    churnPrediction: {
      atRiskCustomers: 0,
      churnRate: 0,
      predictedChurn: []
    },
    behaviorPatterns: {
      avgDaysBetweenVisits: 0,
      preferredDays: [],
      seasonalPreferences: [],
      servicePreferences: []
    },
    customerJourney: {
      avgTimeToSecondVisit: 0,
      conversionRate: 0,
      dropoffPoints: []
    }
  });

  useEffect(() => {
    processCustomerDataRealtime();
  }, [data.rawTransactions, data.lastUpdated]);

  const processCustomerDataRealtime = () => {
    setLoading(true);
    try {
      console.log('👥 Customer Insights: Processing real-time transaction data...');

      // Validate input data
      if (!data.rawTransactions || !Array.isArray(data.rawTransactions)) {
        console.warn('Invalid transaction data provided to CustomerInsights');
        setCustomerData(getDefaultCustomerData());
        return;
      }

      const cashInTransactions = data.rawTransactions.filter(t => t.type === 'cash-in');
      const processedData = processCustomerData(cashInTransactions);
      setCustomerData(processedData);
      console.log('✅ Customer Insights: Data updated in real-time');
    } catch (error) {
      console.error('Error processing customer data:', error);
      // Set fallback data instead of crashing
      setCustomerData(getDefaultCustomerData());
    } finally {
      setLoading(false);
    }
  };

  const processCustomerData = (transactions: any[]): CustomerData => {
    const customerMap = new Map();
    const monthlyNewCustomers = new Map();
    const servicePreferences = new Map();
    const dailyPatterns = new Map();
    const seasonalPatterns = new Map();

    // Process each transaction with enhanced tracking
    transactions.forEach(transaction => {
      const customerName = transaction.customer_name?.toLowerCase().trim();
      if (!customerName) return;

      const date = new Date(transaction.date);
      const amount = Number(transaction.amount);
      const pictures = Number(transaction.number_of_pictures) || 0;
      const service = transaction.category_name || 'Other';
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const season = getSeason(date.getMonth());

      if (!customerMap.has(customerName)) {
        customerMap.set(customerName, {
          name: transaction.customer_name,
          visits: 0,
          totalSpent: 0,
          totalPictures: 0,
          firstVisit: date,
          lastVisit: date,
          visitDates: new Set(),
          services: new Set(),
          avgDaysBetweenVisits: 0,
          transactions: []
        });

        // Track new customers by month for cohort analysis
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyNewCustomers.set(monthKey, (monthlyNewCustomers.get(monthKey) || 0) + 1);
      }

      const customer = customerMap.get(customerName);
      customer.visits++;
      customer.totalSpent += amount;
      customer.totalPictures += pictures;
      customer.visitDates.add(transaction.date);
      customer.services.add(service);
      customer.transactions.push({
        date,
        amount,
        service,
        pictures,
        dayOfWeek,
        season
      });

      if (date > customer.lastVisit) {
        customer.lastVisit = date;
      }

      // Track service preferences
      servicePreferences.set(service, (servicePreferences.get(service) || 0) + 1);

      // Track daily patterns
      dailyPatterns.set(dayOfWeek, (dailyPatterns.get(dayOfWeek) || 0) + 1);

      // Track seasonal patterns
      seasonalPatterns.set(season, (seasonalPatterns.get(season) || 0) + 1);
    });

    // Helper function for seasons
    function getSeason(month: number): string {
      if (month >= 2 && month <= 4) return 'Spring';
      if (month >= 5 && month <= 7) return 'Summer';
      if (month >= 8 && month <= 10) return 'Fall';
      return 'Winter';
    }

    const customers = Array.from(customerMap.values());

    // Calculate advanced customer metrics
    customers.forEach(customer => {
      // Calculate average days between visits
      const visitDatesArray = Array.from(customer.visitDates).sort();
      if (visitDatesArray.length > 1) {
        const daysBetween = visitDatesArray.slice(1).map((date, index) => {
          const current = new Date(String(date));
          const previous = new Date(String(visitDatesArray[index]));
          return Math.abs(current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);
        });
        customer.avgDaysBetweenVisits = daysBetween.reduce((sum, days) => sum + days, 0) / daysBetween.length;
      }
    });

    // Calculate customer segments
    const totalCustomers = customers.length;
    const newCustomers = customers.filter(c => c.visits === 1).length;
    const returningCustomers = customers.filter(c => c.visits >= 2 && c.visits <= 5).length;
    const loyalCustomers = customers.filter(c => c.visits > 5).length;

    // Customer value segments
    const avgSpending = customers.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers;
    const highValue = customers.filter(c => c.totalSpent > avgSpending * 2).length;
    const regular = customers.filter(c => c.totalSpent >= avgSpending && c.totalSpent <= avgSpending * 2).length;
    const occasional = customers.filter(c => c.totalSpent < avgSpending).length;

    // Enhanced top customers with risk scoring
    const topCustomers = customers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(customer => {
        const daysSinceLastVisit = Math.floor((new Date().getTime() - customer.lastVisit.getTime()) / (1000 * 60 * 60 * 24));
        const avgVisitInterval = customer.avgDaysBetweenVisits || 30;
        const riskScore = Math.min(100, Math.max(0, (daysSinceLastVisit / avgVisitInterval) * 100));

        return {
          name: customer.name,
          visits: customer.visits,
          totalSpent: customer.totalSpent,
          totalPictures: customer.totalPictures,
          avgTransactionValue: customer.totalSpent / customer.visits,
          lastVisit: customer.lastVisit.toLocaleDateString(),
          customerSince: customer.firstVisit.toLocaleDateString(),
          riskScore: Math.round(riskScore)
        };
      });

    // Acquisition trend (last 6 months)
    const acquisitionTrend = Array.from(monthlyNewCustomers.entries())
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        newCustomers: count
      }))
      .slice(-6);

    // Calculate retention rate
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const customersThreeMonthsAgo = customers.filter(c => c.firstVisit <= threeMonthsAgo).length;
    const returningInLastThreeMonths = customers.filter(c => 
      c.firstVisit <= threeMonthsAgo && c.lastVisit > threeMonthsAgo
    ).length;
    const retentionRate = customersThreeMonthsAgo > 0 ? (returningInLastThreeMonths / customersThreeMonthsAgo) * 100 : 0;

    // Customer lifetime value
    const customerLifetimeValue = totalCustomers > 0 ?
      customers.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers : 0;

    // Advanced Analytics

    // Cohort Analysis (simplified)
    const cohortAnalysis = Array.from(monthlyNewCustomers.entries())
      .slice(-6)
      .map(([month, newCustomerCount]) => {
        const cohortDate = new Date(month + '-01');
        const cohortCustomers = customers.filter(c =>
          c.firstVisit.getFullYear() === cohortDate.getFullYear() &&
          c.firstVisit.getMonth() === cohortDate.getMonth()
        );

        // Calculate retention for subsequent months
        const retention = [];
        for (let i = 1; i <= 6; i++) {
          const checkDate = new Date(cohortDate);
          checkDate.setMonth(checkDate.getMonth() + i);
          const retainedCustomers = cohortCustomers.filter(c => c.lastVisit >= checkDate).length;
          retention.push(cohortCustomers.length > 0 ? (retainedCustomers / cohortCustomers.length) * 100 : 0);
        }

        return {
          cohort: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          customers: newCustomerCount,
          retention,
          revenue: cohortCustomers.reduce((sum, c) => sum + c.totalSpent, 0)
        };
      });

    // Churn Prediction
    const now = new Date();
    const atRiskCustomers = customers.filter(customer => {
      const daysSinceLastVisit = Math.floor((now.getTime() - customer.lastVisit.getTime()) / (1000 * 60 * 60 * 24));
      const avgInterval = customer.avgDaysBetweenVisits || 30;
      return daysSinceLastVisit > avgInterval * 1.5 && customer.visits > 1;
    });

    const predictedChurn = atRiskCustomers
      .map(customer => {
        const daysSinceLastVisit = Math.floor((now.getTime() - customer.lastVisit.getTime()) / (1000 * 60 * 60 * 24));
        const avgInterval = customer.avgDaysBetweenVisits || 30;
        const riskScore = Math.min(100, (daysSinceLastVisit / avgInterval) * 100);

        return {
          customer: customer.name,
          riskScore: Math.round(riskScore),
          lastVisit: customer.lastVisit.toLocaleDateString(),
          totalSpent: customer.totalSpent
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    const churnRate = totalCustomers > 0 ? (atRiskCustomers.length / totalCustomers) * 100 : 0;

    // Behavior Patterns
    const avgDaysBetweenVisits = customers.reduce((sum, c) => sum + (c.avgDaysBetweenVisits || 0), 0) / totalCustomers;

    const preferredDays = Array.from(dailyPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day);

    const seasonalPreferences = Array.from(seasonalPatterns.entries())
      .map(([season, count]) => ({ season, customers: count }))
      .sort((a, b) => b.customers - a.customers);

    const servicePreferencesArray = Array.from(servicePreferences.entries())
      .map(([service, count]) => ({ service, customers: count }))
      .sort((a, b) => b.customers - a.customers)
      .slice(0, 5);

    // Customer Journey Analysis
    const secondVisitTimes = customers
      .filter(c => c.visits >= 2)
      .map(c => {
        const visits = Array.from(c.visitDates).sort();
        if (visits.length >= 2) {
          const first = new Date(String(visits[0]));
          const second = new Date(String(visits[1]));
          return Math.abs(second.getTime() - first.getTime()) / (1000 * 60 * 60 * 24);
        }
        return 0;
      })
      .filter(days => days > 0);

    const avgTimeToSecondVisit = secondVisitTimes.length > 0
      ? secondVisitTimes.reduce((sum, days) => sum + days, 0) / secondVisitTimes.length
      : 0;

    const conversionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    return {
      newCustomers,
      returningCustomers,
      loyalCustomers,
      customerLifetimeValue,
      retentionRate,
      acquisitionTrend,
      customerSegments: {
        highValue,
        regular,
        occasional
      },
      topCustomers,
      // Advanced analytics
      cohortAnalysis,
      churnPrediction: {
        atRiskCustomers: atRiskCustomers.length,
        churnRate,
        predictedChurn
      },
      behaviorPatterns: {
        avgDaysBetweenVisits,
        preferredDays,
        seasonalPreferences,
        servicePreferences: servicePreferencesArray
      },
      customerJourney: {
        avgTimeToSecondVisit,
        conversionRate,
        dropoffPoints: ['After first visit', 'After 3 months', 'After 6 months'] // Simplified
      }
    };
  };

  const formatCurrency = (amount: number) => `ZMW ${amount.toLocaleString()}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">
            {data.isUpdating ? 'Updating customer insights in real-time...' : 'Analyzing customer data...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer Insights Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Customer Insights
            {data.isUpdating && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
                Updating
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Advanced Customer Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-red-600 text-sm font-medium mb-2">At-Risk Customers</p>
              <p className="text-2xl font-bold text-red-900">
                <AnimatedNumber value={customerData?.churnPrediction.atRiskCustomers || 0} />
              </p>
              <div className="text-xs text-gray-500 mt-1">
                {customerData?.churnPrediction.churnRate.toFixed(1)}% churn risk
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-green-600 text-sm font-medium mb-2">Avg Visit Interval</p>
              <p className="text-2xl font-bold text-green-900">
                <AnimatedNumber value={customerData?.behaviorPatterns.avgDaysBetweenVisits || 0} />
              </p>
              <div className="text-xs text-gray-500 mt-1">days between visits</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-purple-600 text-sm font-medium mb-2">Conversion Rate</p>
              <p className="text-2xl font-bold text-purple-900">
                <AnimatedNumber value={customerData?.customerJourney.conversionRate || 0} />%
              </p>
              <div className="text-xs text-gray-500 mt-1">first to repeat visit</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-orange-600 text-sm font-medium mb-2">Time to 2nd Visit</p>
              <p className="text-2xl font-bold text-orange-900">
                <AnimatedNumber value={customerData?.customerJourney.avgTimeToSecondVisit || 0} />
              </p>
              <div className="text-xs text-gray-500 mt-1">days average</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Churn Prediction & Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-red-600" />
            Churn Risk Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">High-Risk Customers</h4>
                <div className="space-y-2">
                  {customerData?.churnPrediction.predictedChurn.slice(0, 5).map((customer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                      <div>
                        <span className="font-medium text-gray-900">{customer.customer}</span>
                        <div className="text-sm text-gray-600">
                          Last visit: {customer.lastVisit} • Spent: {formatCurrency(customer.totalSpent)}
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {customer.riskScore}% risk
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Behavior Patterns</h4>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <span className="text-sm font-medium text-blue-900">Preferred Days:</span>
                    <div className="text-sm text-blue-700 mt-1">
                      {customerData?.behaviorPatterns.preferredDays.join(', ') || 'No data'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <span className="text-sm font-medium text-green-900">Top Services:</span>
                    <div className="text-sm text-green-700 mt-1">
                      {customerData?.behaviorPatterns.servicePreferences.slice(0, 3).map(s => s.service).join(', ') || 'No data'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <span className="text-sm font-medium text-purple-900">Seasonal Trends:</span>
                    <div className="text-sm text-purple-700 mt-1">
                      {customerData?.behaviorPatterns.seasonalPreferences[0]?.season || 'No data'} is most popular
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">New Customers</p>
                <p className="text-2xl font-bold text-blue-900">
                  <AnimatedNumber value={customerData?.newCustomers || 0} />
                </p>
              </div>
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Returning</p>
                <p className="text-2xl font-bold text-green-900">
                  <AnimatedNumber value={customerData?.returningCustomers || 0} />
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Loyal</p>
                <p className="text-2xl font-bold text-purple-900">
                  <AnimatedNumber value={customerData?.loyalCustomers || 0} />
                </p>
              </div>
              <Heart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Retention Rate</p>
                <p className="text-2xl font-bold text-orange-900">
                  <AnimatedNumber value={customerData?.retentionRate || 0} />%
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            Customer Cohort Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Track customer retention by acquisition month
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Cohort</th>
                    <th className="text-center p-2">Customers</th>
                    <th className="text-center p-2">Revenue</th>
                    <th className="text-center p-2">Month 1</th>
                    <th className="text-center p-2">Month 2</th>
                    <th className="text-center p-2">Month 3</th>
                    <th className="text-center p-2">Month 6</th>
                  </tr>
                </thead>
                <tbody>
                  {customerData?.cohortAnalysis.map((cohort, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">{cohort.cohort}</td>
                      <td className="p-2 text-center">{cohort.customers}</td>
                      <td className="p-2 text-center">{formatCurrency(cohort.revenue)}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          cohort.retention[0] > 50 ? 'bg-green-100 text-green-800' :
                          cohort.retention[0] > 25 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {cohort.retention[0]?.toFixed(0) || 0}%
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          cohort.retention[1] > 40 ? 'bg-green-100 text-green-800' :
                          cohort.retention[1] > 20 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {cohort.retention[1]?.toFixed(0) || 0}%
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          cohort.retention[2] > 30 ? 'bg-green-100 text-green-800' :
                          cohort.retention[2] > 15 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {cohort.retention[2]?.toFixed(0) || 0}%
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          cohort.retention[5] > 20 ? 'bg-green-100 text-green-800' :
                          cohort.retention[5] > 10 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {cohort.retention[5]?.toFixed(0) || 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Lifetime Value */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-indigo-600" />
            Customer Lifetime Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-900 mb-2">
              {formatCurrency(customerData?.customerLifetimeValue || 0)}
            </div>
            <p className="text-indigo-600">Average value per customer</p>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {customerData?.customerSegments.highValue || 0}
                </div>
                <div className="text-sm text-gray-600">High Value</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {customerData?.customerSegments.regular || 0}
                </div>
                <div className="text-sm text-gray-600">Regular</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {customerData?.customerSegments.occasional || 0}
                </div>
                <div className="text-sm text-gray-600">Occasional</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Acquisition Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Customer Acquisition Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customerData?.acquisitionTrend.map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{month.month}</span>
                  <span className="text-sm font-bold text-green-600">
                    {month.newCustomers} new customers
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, (month.newCustomers / Math.max(...(customerData?.acquisitionTrend.map(m => m.newCustomers) || [1]))) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Top Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {customerData?.topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-500">
                      {customer.visits} visits • Last: {customer.lastVisit}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    {formatCurrency(customer.totalSpent)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {customer.visits > 5 ? 'Loyal' : customer.visits > 1 ? 'Returning' : 'New'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
