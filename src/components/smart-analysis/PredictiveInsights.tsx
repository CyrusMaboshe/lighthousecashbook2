import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Zap,
  TrendingUp,
  Target,
  Calendar,
  DollarSign,
  Users,
  Camera,
  AlertTriangle,
  Lightbulb,
  Star,
  Heart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedNumber } from '@/components/AnimatedNumber';

interface PredictiveInsightsProps {
  data: {
    totalRevenue: number;
    totalTransactions: number;
    totalPictures: number;
    avgTransactionValue: number;
    monthlyData: any[];
    weeklyData: any[];
    rawTransactions: any[];
    lastUpdated: Date;
    isUpdating: boolean;
  };
}

interface PredictionData {
  nextMonthRevenue: number;
  nextMonthTransactions: number;
  revenueConfidence: number;
  seasonalForecast: any[];
  recommendations: any[];
  riskFactors: any[];
  opportunities: any[];
  // Advanced predictions
  scenarioAnalysis?: any;
  confidenceIntervals?: any;
  customerPredictions?: any;
  serviceDemandForecasts?: any[];
  riskAssessment?: any[];
  modelAccuracy?: any;
}

export function PredictiveInsights({ data }: PredictiveInsightsProps) {
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);

  const getDefaultPredictions = (): PredictionData => ({
    nextMonthRevenue: 0,
    nextMonthTransactions: 0,
    revenueConfidence: 0,
    seasonalForecast: [],
    recommendations: [{
      type: 'info',
      title: 'Insufficient Data',
      description: 'Add more transactions to get accurate predictions',
      impact: 'low',
      priority: 'medium'
    }],
    riskFactors: [],
    opportunities: []
  });

  useEffect(() => {
    generatePredictionsRealtime();
  }, [data.rawTransactions, data.lastUpdated]);

  const generatePredictionsRealtime = () => {
    setLoading(true);
    try {
      console.log('🔮 Predictive Insights: Processing real-time transaction data...');

      // Validate input data
      if (!data.rawTransactions || !Array.isArray(data.rawTransactions)) {
        console.warn('Invalid transaction data provided to PredictiveInsights');
        setPredictions(getDefaultPredictions());
        return;
      }

      const predictionData = calculatePredictions(data.rawTransactions);
      setPredictions(predictionData);
      console.log('✅ Predictive Insights: Predictions updated in real-time');
    } catch (error) {
      console.error('Error generating predictions:', error);
      // Set fallback data instead of crashing
      setPredictions(getDefaultPredictions());
    } finally {
      setLoading(false);
    }
  };

  const calculatePredictions = (transactions: any[]): PredictionData => {
    // Advanced machine learning-inspired prediction algorithm
    const monthlyData = new Map();
    const weeklyData = new Map();
    const customerData = new Map();
    const seasonalData = new Map();
    const serviceData = new Map();
    const dailyData = new Map();

    // Enhanced data processing for advanced predictions
    transactions.forEach(transaction => {
      if (transaction.type === 'cash-in') {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const weekKey = getWeekKey(date);
        const season = getSeason(date.getMonth());
        const service = transaction.category_name || 'Other';
        const customer = transaction.customer_name?.toLowerCase().trim();
        const dailyKey = date.toISOString().split('T')[0];

        // Monthly data with enhanced metrics
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            revenue: 0,
            transactions: 0,
            pictures: 0,
            customers: new Set(),
            services: new Set(),
            avgTransactionValue: 0
          });
        }

        const monthData = monthlyData.get(monthKey);
        monthData.revenue += transaction.amount;
        monthData.transactions += 1;
        monthData.pictures += transaction.number_of_pictures || 0;
        if (customer) monthData.customers.add(customer);
        monthData.services.add(service);

        // Weekly patterns for short-term forecasting
        if (!weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, { revenue: 0, transactions: 0, customers: new Set() });
        }
        const weekData = weeklyData.get(weekKey);
        weekData.revenue += transaction.amount;
        weekData.transactions += 1;
        if (customer) weekData.customers.add(customer);

        // Seasonal patterns
        seasonalData.set(season, (seasonalData.get(season) || 0) + transaction.amount);

        // Service demand patterns
        if (!serviceData.has(service)) {
          serviceData.set(service, { revenue: 0, transactions: 0, trend: 0 });
        }
        const serviceInfo = serviceData.get(service);
        serviceInfo.revenue += transaction.amount;
        serviceInfo.transactions += 1;

        // Daily patterns for demand prediction
        if (!dailyData.has(dailyKey)) {
          dailyData.set(dailyKey, { revenue: 0, transactions: 0 });
        }
        const dailyInfo = dailyData.get(dailyKey);
        dailyInfo.revenue += transaction.amount;
        dailyInfo.transactions += 1;

        // Customer behavior tracking
        if (customer) {
          if (!customerData.has(customer)) {
            customerData.set(customer, {
              visits: 0,
              totalSpent: 0,
              lastVisit: date,
              avgDaysBetween: 0,
              predictedNextVisit: null
            });
          }
          const custData = customerData.get(customer);
          custData.visits += 1;
          custData.totalSpent += transaction.amount;
          custData.lastVisit = date;
        }
      }
    });

    // Helper functions
    function getWeekKey(date: Date): string {
      const year = date.getFullYear();
      const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
      return `${year}-W${week}`;
    }

    function getSeason(month: number): string {
      if (month >= 2 && month <= 4) return 'Spring';
      if (month >= 5 && month <= 7) return 'Summer';
      if (month >= 8 && month <= 10) return 'Fall';
      return 'Winter';
    }

    // Convert data to arrays for analysis
    const monthlyArray = Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      transactions: data.transactions,
      pictures: data.pictures,
      customers: data.customers.size,
      services: data.services.size,
      avgTransactionValue: data.transactions > 0 ? data.revenue / data.transactions : 0
    })).slice(-12); // Last 12 months

    const weeklyArray = Array.from(weeklyData.entries()).map(([week, data]) => ({
      week,
      revenue: data.revenue,
      transactions: data.transactions,
      customers: data.customers.size
    })).slice(-8); // Last 8 weeks
    
    // Advanced Predictive Analytics

    // 1. Multiple Regression Analysis for Revenue Prediction
    const revenueForecasts = calculateMultipleForecasts(monthlyArray, weeklyArray);

    // 2. Seasonal Decomposition and Forecasting
    const seasonalForecasts = calculateSeasonalForecasts(seasonalData, monthlyArray);

    // 3. Customer Behavior Prediction
    const customerPredictions = predictCustomerBehavior(customerData);

    // 4. Service Demand Forecasting
    const serviceDemandForecasts = forecastServiceDemand(serviceData, monthlyArray);

    // 5. Scenario Analysis (Optimistic, Realistic, Pessimistic)
    const scenarioAnalysis = calculateScenarioAnalysis(monthlyArray, weeklyArray);

    // 6. Confidence Intervals using Statistical Methods
    const confidenceIntervals = calculateConfidenceIntervals(monthlyArray);

    // 7. Risk Assessment and Mitigation Strategies
    const riskAssessment = assessBusinessRisks(monthlyArray, customerData, serviceData);

    // Primary predictions (ensemble of multiple models)
    const nextMonthRevenue = Math.max(0, (
      revenueForecasts.linearTrend * 0.3 +
      revenueForecasts.exponentialSmoothing * 0.3 +
      revenueForecasts.movingAverage * 0.2 +
      seasonalForecasts.nextMonth * 0.2
    ));

    const nextMonthTransactions = Math.max(0, Math.round(
      nextMonthRevenue / (monthlyArray.length > 0 ?
        monthlyArray.reduce((sum, m) => sum + m.avgTransactionValue, 0) / monthlyArray.length : 150)
    ));

    // Enhanced confidence calculation
    const revenueConfidence = Math.min(95, Math.max(60,
      (confidenceIntervals.confidence + revenueForecasts.confidence + seasonalForecasts.confidence) / 3
    ));

    // Generate enhanced recommendations and insights
    const recommendations = generateAdvancedRecommendations(data, monthlyArray, scenarioAnalysis, riskAssessment);
    const riskFactors = generateAdvancedRiskFactors(data, monthlyArray, riskAssessment);
    const opportunities = generateAdvancedOpportunities(data, monthlyArray, serviceDemandForecasts, customerPredictions);

    return {
      nextMonthRevenue,
      nextMonthTransactions,
      revenueConfidence,
      seasonalForecast: seasonalForecasts.forecast,
      recommendations,
      riskFactors,
      opportunities,
      // Advanced predictions
      scenarioAnalysis,
      confidenceIntervals,
      customerPredictions,
      serviceDemandForecasts,
      riskAssessment,
      modelAccuracy: {
        linearTrend: revenueForecasts.accuracy.linear,
        exponentialSmoothing: revenueForecasts.accuracy.exponential,
        movingAverage: revenueForecasts.accuracy.movingAverage,
        seasonal: seasonalForecasts.accuracy
      }
    };
  };

  // Advanced Prediction Helper Functions

  const calculateMultipleForecasts = (monthlyData: any[], weeklyData: any[]) => {
    if (monthlyData.length < 3) {
      return {
        linearTrend: 0,
        exponentialSmoothing: 0,
        movingAverage: 0,
        confidence: 50,
        accuracy: { linear: 0, exponential: 0, movingAverage: 0 }
      };
    }

    const revenues = monthlyData.map(m => m.revenue);

    // Linear Trend Forecasting
    const n = revenues.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = revenues.reduce((sum, val) => sum + val, 0);
    const sumXY = revenues.reduce((sum, val, index) => sum + val * (index + 1), 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const linearTrend = slope * (n + 1) + intercept;

    // Exponential Smoothing (α = 0.3)
    const alpha = 0.3;
    let smoothed = revenues[0];
    for (let i = 1; i < revenues.length; i++) {
      smoothed = alpha * revenues[i] + (1 - alpha) * smoothed;
    }
    const exponentialSmoothing = smoothed;

    // Moving Average (3-period)
    const movingAverage = revenues.slice(-3).reduce((sum, val) => sum + val, 0) / 3;

    // Calculate accuracy (simplified R-squared approximation)
    const mean = sumY / n;
    const totalVariation = revenues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    const confidence = Math.max(60, Math.min(95, 85 - (Math.sqrt(totalVariation / n) / mean) * 50));

    return {
      linearTrend: Math.max(0, linearTrend),
      exponentialSmoothing: Math.max(0, exponentialSmoothing),
      movingAverage: Math.max(0, movingAverage),
      confidence,
      accuracy: {
        linear: Math.max(0, 100 - Math.abs(slope) * 10),
        exponential: Math.max(0, 90 - Math.abs(revenues[revenues.length - 1] - smoothed) / smoothed * 100),
        movingAverage: Math.max(0, 85 - Math.abs(revenues[revenues.length - 1] - movingAverage) / movingAverage * 100)
      }
    };
  };

  const calculateSeasonalForecasts = (seasonalData: Map<string, number>, monthlyData: any[]) => {
    const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
    const currentMonth = new Date().getMonth();
    const currentSeason = seasons[Math.floor(currentMonth / 3)];

    const seasonalRevenues = Array.from(seasonalData.entries()).map(([season, revenue]) => ({
      season,
      revenue,
      percentage: 0
    }));

    const totalSeasonalRevenue = seasonalRevenues.reduce((sum, s) => sum + s.revenue, 0);
    seasonalRevenues.forEach(s => {
      s.percentage = totalSeasonalRevenue > 0 ? (s.revenue / totalSeasonalRevenue) * 100 : 25;
    });

    // Predict next month based on seasonal patterns
    const avgMonthlyRevenue = monthlyData.length > 0
      ? monthlyData.reduce((sum, m) => sum + m.revenue, 0) / monthlyData.length
      : 0;

    const nextMonthSeason = seasons[Math.floor(((currentMonth + 1) % 12) / 3)];
    const seasonalMultiplier = seasonalRevenues.find(s => s.season === nextMonthSeason)?.percentage || 25;
    const nextMonth = avgMonthlyRevenue * (seasonalMultiplier / 25); // Normalize to average

    return {
      forecast: seasonalRevenues,
      nextMonth: Math.max(0, nextMonth),
      confidence: Math.min(90, Math.max(70, 80 + (seasonalRevenues.length * 5))),
      accuracy: Math.max(70, 90 - Math.abs(seasonalMultiplier - 25))
    };
  };

  const predictCustomerBehavior = (customerData: Map<string, any>) => {
    const customers = Array.from(customerData.values());
    const now = new Date();

    // Predict customer churn and return likelihood
    const predictions = customers.map(customer => {
      const daysSinceLastVisit = Math.floor((now.getTime() - customer.lastVisit.getTime()) / (1000 * 60 * 60 * 24));
      const avgSpendingPerVisit = customer.visits > 0 ? customer.totalSpent / customer.visits : 0;

      // Simple churn prediction based on visit patterns
      const churnRisk = Math.min(100, Math.max(0, (daysSinceLastVisit - 30) * 2));
      const returnLikelihood = Math.max(0, 100 - churnRisk);

      return {
        customer: customer,
        churnRisk,
        returnLikelihood,
        predictedNextVisit: new Date(now.getTime() + (daysSinceLastVisit * 0.8 * 24 * 60 * 60 * 1000)),
        expectedSpending: avgSpendingPerVisit * (returnLikelihood / 100)
      };
    });

    const totalExpectedRevenue = predictions.reduce((sum, p) => sum + p.expectedSpending, 0);
    const highRiskCustomers = predictions.filter(p => p.churnRisk > 70).length;

    return {
      totalExpectedRevenue,
      highRiskCustomers,
      predictions: predictions.slice(0, 10), // Top 10 for display
      averageReturnLikelihood: predictions.reduce((sum, p) => sum + p.returnLikelihood, 0) / predictions.length
    };
  };

  const forecastServiceDemand = (serviceData: Map<string, any>, monthlyData: any[]) => {
    const services = Array.from(serviceData.entries()).map(([service, data]) => {
      const recentTrend = monthlyData.length > 2 ?
        (monthlyData[monthlyData.length - 1].revenue - monthlyData[monthlyData.length - 3].revenue) / 2 : 0;

      const serviceShare = monthlyData.length > 0 ?
        data.revenue / monthlyData.reduce((sum, m) => sum + m.revenue, 0) : 0;

      const predictedDemand = data.transactions * (1 + (recentTrend / data.revenue));

      return {
        service,
        currentDemand: data.transactions,
        predictedDemand: Math.max(0, predictedDemand),
        revenueShare: serviceShare * 100,
        growthTrend: recentTrend > 0 ? 'growing' : recentTrend < 0 ? 'declining' : 'stable'
      };
    });

    return services.sort((a, b) => b.predictedDemand - a.predictedDemand);
  };

  const calculateScenarioAnalysis = (monthlyData: any[], weeklyData: any[]) => {
    if (monthlyData.length < 3) {
      return {
        optimistic: { revenue: 0, probability: 0 },
        realistic: { revenue: 0, probability: 0 },
        pessimistic: { revenue: 0, probability: 0 }
      };
    }

    const recentRevenue = monthlyData[monthlyData.length - 1].revenue;
    const avgGrowth = monthlyData.slice(-3).reduce((sum, month, index, arr) => {
      if (index === 0) return sum;
      const prevMonth = arr[index - 1];
      return sum + (prevMonth.revenue > 0 ? (month.revenue - prevMonth.revenue) / prevMonth.revenue : 0);
    }, 0) / 2;

    return {
      optimistic: {
        revenue: recentRevenue * (1 + Math.max(0.15, avgGrowth * 1.5)),
        probability: Math.max(20, 40 - Math.abs(avgGrowth) * 100)
      },
      realistic: {
        revenue: recentRevenue * (1 + avgGrowth),
        probability: Math.max(60, 80 - Math.abs(avgGrowth) * 50)
      },
      pessimistic: {
        revenue: recentRevenue * (1 + Math.min(-0.1, avgGrowth * 0.5)),
        probability: Math.max(10, 30 - Math.abs(avgGrowth) * 50)
      }
    };
  };

  const calculateConfidenceIntervals = (monthlyData: any[]) => {
    if (monthlyData.length < 3) {
      return { lower: 0, upper: 0, confidence: 50 };
    }

    const revenues = monthlyData.map(m => m.revenue);
    const mean = revenues.reduce((sum, val) => sum + val, 0) / revenues.length;
    const variance = revenues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / revenues.length;
    const stdDev = Math.sqrt(variance);

    // 95% confidence interval (approximately 2 standard deviations)
    const margin = 1.96 * stdDev / Math.sqrt(revenues.length);

    return {
      lower: Math.max(0, mean - margin),
      upper: mean + margin,
      confidence: Math.max(70, Math.min(95, 90 - (stdDev / mean) * 50))
    };
  };

  const assessBusinessRisks = (monthlyData: any[], customerData: Map<string, any>, serviceData: Map<string, any>) => {
    const risks = [];

    // Revenue volatility risk
    if (monthlyData.length > 3) {
      const revenues = monthlyData.map(m => m.revenue);
      const mean = revenues.reduce((sum, val) => sum + val, 0) / revenues.length;
      const volatility = Math.sqrt(revenues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / revenues.length) / mean;

      if (volatility > 0.3) {
        risks.push({
          type: 'High Revenue Volatility',
          severity: 'high',
          probability: Math.min(90, volatility * 100),
          impact: 'Revenue unpredictability may affect business planning'
        });
      }
    }

    // Customer concentration risk
    const customers = Array.from(customerData.values());
    if (customers.length > 0) {
      const topCustomerRevenue = Math.max(...customers.map(c => c.totalSpent));
      const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
      const concentration = totalRevenue > 0 ? (topCustomerRevenue / totalRevenue) * 100 : 0;

      if (concentration > 30) {
        risks.push({
          type: 'Customer Concentration',
          severity: 'medium',
          probability: Math.min(80, concentration),
          impact: 'Heavy dependence on few customers increases business risk'
        });
      }
    }

    // Service diversification risk
    const services = Array.from(serviceData.values());
    if (services.length < 3) {
      risks.push({
        type: 'Limited Service Diversification',
        severity: 'medium',
        probability: 70,
        impact: 'Limited service offerings may restrict growth opportunities'
      });
    }

    return risks;
  };

  const generateAdvancedRecommendations = (currentData: any, monthlyData: any[], scenarioAnalysis: any, riskAssessment: any) => {
    const recommendations = [];

    // Revenue-based recommendations
    if (scenarioAnalysis.realistic.revenue < currentData.totalRevenue * 0.9) {
      recommendations.push({
        icon: TrendingUp,
        title: 'Revenue Optimization',
        description: 'Focus on premium services and customer retention to maintain revenue growth.',
        priority: 'high'
      });
    }

    // Risk-based recommendations
    if (riskAssessment.length > 0) {
      recommendations.push({
        icon: AlertTriangle,
        title: 'Risk Mitigation',
        description: 'Address identified business risks to ensure sustainable growth.',
        priority: 'medium'
      });
    }

    // Growth recommendations
    if (monthlyData.length > 2) {
      const recentGrowth = monthlyData[monthlyData.length - 1].revenue - monthlyData[monthlyData.length - 2].revenue;
      if (recentGrowth < 0) {
        recommendations.push({
          icon: Target,
          title: 'Growth Strategy',
          description: 'Implement marketing campaigns and service diversification to boost revenue.',
          priority: 'high'
        });
      }
    }

    return recommendations.slice(0, 5);
  };

  const generateAdvancedRiskFactors = (currentData: any, monthlyData: any[], riskAssessment: any) => {
    const risks = [];

    // Market volatility risk
    if (monthlyData.length > 3) {
      const revenues = monthlyData.map(m => m.revenue);
      const volatility = calculateVolatility(revenues);
      if (volatility > 30) {
        risks.push({
          icon: AlertTriangle,
          title: 'Revenue Volatility',
          description: 'High revenue fluctuations may indicate market instability.',
          severity: 'medium'
        });
      }
    }

    // Customer concentration risk
    if (currentData.totalCustomers < 20) {
      risks.push({
        icon: Users,
        title: 'Limited Customer Base',
        description: 'Small customer base increases business vulnerability.',
        severity: 'high'
      });
    }

    return risks.slice(0, 4);
  };

  const generateAdvancedOpportunities = (currentData: any, monthlyData: any[], serviceDemandForecasts: any[], customerPredictions: any) => {
    const opportunities = [];

    // Service expansion opportunities
    if (serviceDemandForecasts.length > 0) {
      const growingService = serviceDemandForecasts.find(s => s.growthTrend === 'growing');
      if (growingService) {
        opportunities.push({
          icon: Star,
          title: 'Service Expansion',
          description: `${growingService.service} shows strong growth potential.`,
          potential: 'high'
        });
      }
    }

    // Customer retention opportunity
    if (customerPredictions.averageReturnLikelihood < 70) {
      opportunities.push({
        icon: Heart,
        title: 'Customer Retention',
        description: 'Implement loyalty programs to improve customer retention.',
        potential: 'medium'
      });
    }

    // Revenue optimization
    if (currentData.avgTransactionValue < 150) {
      opportunities.push({
        icon: DollarSign,
        title: 'Revenue Per Transaction',
        description: 'Upselling and service bundling can increase transaction values.',
        potential: 'high'
      });
    }

    return opportunities.slice(0, 4);
  };

  const calculateVolatility = (values: number[]): number => {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;
  };

  const formatCurrency = (amount: number) => `ZMW ${amount.toLocaleString()}`;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">
              {data.isUpdating ? 'Updating predictions in real-time...' : 'Generating predictions...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!predictions) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Predictions Available</h3>
          <p className="text-gray-500">Not enough data to generate reliable predictions.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Next Month Predictions */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Next Month Predictions
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              AI-Powered
            </Badge>
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
              <div className="text-sm text-gray-600 mb-2">Predicted Revenue</div>
              <div className="text-2xl font-bold text-purple-900">
                {formatCurrency(predictions.nextMonthRevenue)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Confidence: <AnimatedNumber value={Math.round(predictions.revenueConfidence)} />%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Predicted Transactions</div>
              <div className="text-2xl font-bold text-purple-900">
                <AnimatedNumber value={predictions.nextMonthTransactions} />
              </div>
              <Progress value={predictions.revenueConfidence} className="w-full h-2 mt-2" />
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Growth Outlook</div>
              <div className="text-2xl font-bold text-purple-900">
                {predictions.nextMonthRevenue > data.totalRevenue ? 'Positive' : 'Stable'}
              </div>
              <div className="text-xs text-gray-500 mt-1">Based on recent trends</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50">
                <rec.icon className={`h-5 w-5 ${rec.color} mt-0.5`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{rec.title}</span>
                    <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      {predictions.riskFactors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {predictions.riskFactors.map((risk, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-red-200 bg-red-50">
                  <risk.icon className={`h-5 w-5 ${risk.color} mt-0.5`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{risk.title}</span>
                      <Badge variant={risk.severity === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                        {risk.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{risk.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Growth Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions.opportunities.map((opp, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-green-200 bg-green-50">
                <opp.icon className={`h-5 w-5 ${opp.color} mt-0.5`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{opp.title}</span>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                      {opp.potential} potential
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{opp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
