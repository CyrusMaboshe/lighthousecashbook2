import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Heart, 
  Shield, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Target,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedNumber } from '@/components/AnimatedNumber';

interface BusinessHealthProps {
  data: {
    totalRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
    avgTransactionValue: number;
    profitabilityMetrics: {
      grossProfit: number;
      profitMargin: number;
    };
    rawTransactions: any[];
    lastUpdated: Date;
    isUpdating: boolean;
  };
}

interface HealthMetrics {
  overallScore: number;
  financialHealth: number;
  operationalHealth: number;
  customerHealth: number;
  growthHealth: number;
  healthIndicators: any[];
  recommendations: any[];
  alerts: any[];
}

export function BusinessHealth({ data }: BusinessHealthProps) {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateHealthMetrics();
  }, [data.rawTransactions, data.lastUpdated]);

  const calculateHealthMetrics = () => {
    setLoading(true);
    try {
      console.log('🏥 Business Health: Processing real-time transaction data...');

      // Validate input data
      if (!data.rawTransactions || !Array.isArray(data.rawTransactions)) {
        console.warn('Invalid transaction data provided to BusinessHealth');
        setHealthMetrics(getDefaultHealthMetrics());
        return;
      }

      const metrics = processHealthData(data.rawTransactions);
      setHealthMetrics(metrics);
      console.log('✅ Business Health: Metrics updated in real-time');
    } catch (error) {
      console.error('Error calculating health metrics:', error);
      // Set fallback data instead of crashing
      setHealthMetrics(getDefaultHealthMetrics());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultHealthMetrics = (): any => ({
    overallScore: 50,
    financialHealth: 50,
    operationalHealth: 50,
    customerHealth: 50,
    growthHealth: 50,
    keyMetrics: {
      cashFlow: 0,
      profitMargin: 0,
      customerSatisfaction: 0,
      operationalEfficiency: 0,
      marketPosition: 0
    },
    recommendations: [{
      category: 'general',
      priority: 'medium',
      title: 'Insufficient Data',
      description: 'Add more transactions to get accurate health metrics',
      impact: 'Improve data collection for better insights'
    }],
    alerts: [],
    trends: {
      revenue: 'stable',
      customers: 'stable',
      efficiency: 'stable'
    }
  });

  const processHealthData = (transactions: any[]): HealthMetrics => {
    // Financial Health (40% weight)
    const revenueScore = Math.min(100, (data.totalRevenue / 10000) * 100); // Target: 10k
    const profitMarginScore = Math.min(100, Math.max(0, data.profitabilityMetrics.profitMargin * 2)); // Target: 50%
    const avgTransactionScore = Math.min(100, (data.avgTransactionValue / 200) * 100); // Target: 200
    const financialHealth = (revenueScore + profitMarginScore + avgTransactionScore) / 3;

    // Operational Health (25% weight)
    const transactionVolumeScore = Math.min(100, (data.totalTransactions / 100) * 100); // Target: 100 transactions
    const consistencyScore = calculateConsistencyScore(transactions);
    const operationalHealth = (transactionVolumeScore + consistencyScore) / 2;

    // Customer Health (25% weight)
    const customerBaseScore = Math.min(100, (data.totalCustomers / 50) * 100); // Target: 50 customers
    const customerRetentionScore = calculateRetentionScore(transactions);
    const customerHealth = (customerBaseScore + customerRetentionScore) / 2;

    // Growth Health (10% weight)
    const growthScore = calculateGrowthScore(transactions);
    const growthHealth = growthScore;

    // Industry Benchmarking
    const industryBenchmarks = {
      financialHealth: 75,    // Industry average for photo studios
      operationalHealth: 70,  // Industry average for operational efficiency
      customerHealth: 65,     // Industry average for customer metrics
      growthHealth: 60,       // Industry average for growth metrics
      overallScore: 68        // Industry average overall health
    };

    // Calculate benchmark comparisons
    const benchmarkComparisons = {
      financialHealth: ((financialHealth - industryBenchmarks.financialHealth) / industryBenchmarks.financialHealth) * 100,
      operationalHealth: ((operationalHealth - industryBenchmarks.operationalHealth) / industryBenchmarks.operationalHealth) * 100,
      customerHealth: ((customerHealth - industryBenchmarks.customerHealth) / industryBenchmarks.customerHealth) * 100,
      growthHealth: ((growthHealth - industryBenchmarks.growthHealth) / industryBenchmarks.growthHealth) * 100
    };

    // Enhanced Overall Score with industry weighting
    const overallScore = (
      financialHealth * 0.35 +
      operationalHealth * 0.25 +
      customerHealth * 0.25 +
      growthHealth * 0.15
    );

    const overallBenchmarkComparison = ((overallScore - industryBenchmarks.overallScore) / industryBenchmarks.overallScore) * 100;

    // Early Warning System
    const earlyWarnings = generateEarlyWarnings(data, {
      financialHealth,
      operationalHealth,
      customerHealth,
      growthHealth,
      overallScore
    }, transactions);

    // Health Trend Analysis
    const healthTrends = analyzeHealthTrends(transactions);

    // Risk Assessment
    const riskAssessment = assessBusinessRisks(data, {
      financialHealth,
      operationalHealth,
      customerHealth,
      growthHealth
    }, transactions);

    // Generate enhanced health indicators
    const healthIndicators = generateEnhancedHealthIndicators({
      financialHealth,
      operationalHealth,
      customerHealth,
      growthHealth,
      overallScore,
      benchmarkComparisons,
      industryBenchmarks
    });

    // Generate comprehensive recommendations and alerts
    const recommendations = generateComprehensiveRecommendations(data, {
      financialHealth,
      operationalHealth,
      customerHealth,
      growthHealth
    }, benchmarkComparisons, riskAssessment);

    const alerts: any = [];

    return {
      overallScore,
      financialHealth,
      operationalHealth,
      customerHealth,
      growthHealth,
      recommendations,
      alerts
    } as any;
  };

  const calculateConsistencyScore = (transactions: any[]): number => {
    if (transactions.length < 4) return 50;

    const monthlyRevenue = new Map();
    transactions.forEach(transaction => {
      if (transaction.type === 'cash-in') {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyRevenue.set(monthKey, (monthlyRevenue.get(monthKey) || 0) + transaction.amount);
      }
    });

    const revenues = Array.from(monthlyRevenue.values());
    if (revenues.length < 2) return 50;

    const mean = revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length;
    const variance = revenues.reduce((sum, rev) => sum + Math.pow(rev - mean, 2), 0) / revenues.length;
    const coefficient = mean > 0 ? Math.sqrt(variance) / mean : 1;

    return Math.max(0, Math.min(100, (1 - coefficient) * 100));
  };

  const calculateRetentionScore = (transactions: any[]): number => {
    const customerTransactions = new Map();
    transactions.forEach(transaction => {
      if (transaction.type === 'cash-in' && transaction.customer_name) {
        const customer = transaction.customer_name;
        if (!customerTransactions.has(customer)) {
          customerTransactions.set(customer, []);
        }
        customerTransactions.get(customer).push(transaction.date);
      }
    });

    const repeatCustomers = Array.from(customerTransactions.values()).filter(dates => dates.length > 1).length;
    const totalCustomers = customerTransactions.size;

    return totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
  };

  const calculateGrowthScore = (transactions: any[]): number => {
    const monthlyData = new Map();
    transactions.forEach(transaction => {
      if (transaction.type === 'cash-in') {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + transaction.amount);
      }
    });

    const months = Array.from(monthlyData.entries()).sort();
    if (months.length < 3) return 50;

    const recent = months.slice(-2);
    const older = months.slice(-4, -2);

    if (recent.length < 2 || older.length < 2) return 50;

    const recentAvg = recent.reduce((sum, [, revenue]) => sum + revenue, 0) / recent.length;
    const olderAvg = older.reduce((sum, [, revenue]) => sum + revenue, 0) / older.length;

    const growthRate = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    return Math.max(0, Math.min(100, 50 + growthRate * 2)); // Normalize around 50
  };

  const generateHealthIndicators = (scores: any) => [
    {
      name: 'Financial Stability',
      score: scores.financialHealth,
      icon: DollarSign,
      color: getHealthColor(scores.financialHealth)
    },
    {
      name: 'Operational Efficiency',
      score: scores.operationalHealth,
      icon: Activity,
      color: getHealthColor(scores.operationalHealth)
    },
    {
      name: 'Customer Satisfaction',
      score: scores.customerHealth,
      icon: Users,
      color: getHealthColor(scores.customerHealth)
    },
    {
      name: 'Growth Momentum',
      score: scores.growthHealth,
      icon: TrendingUp,
      color: getHealthColor(scores.growthHealth)
    }
  ];

  const generateHealthRecommendations = (businessData: any, scores: any) => {
    const recommendations = [];

    if (scores.financialHealth < 70) {
      recommendations.push({
        icon: DollarSign,
        title: 'Improve Financial Performance',
        description: 'Focus on increasing revenue and optimizing profit margins.',
        priority: 'high'
      });
    }

    if (scores.customerHealth < 60) {
      recommendations.push({
        icon: Users,
        title: 'Enhance Customer Retention',
        description: 'Implement loyalty programs and improve customer service.',
        priority: 'high'
      });
    }

    if (scores.operationalHealth < 65) {
      recommendations.push({
        icon: Activity,
        title: 'Streamline Operations',
        description: 'Optimize workflows and maintain consistent service delivery.',
        priority: 'medium'
      });
    }

    return recommendations;
  };

  const generateHealthAlerts = (businessData: any, scores: any) => {
    const alerts = [];

    if (scores.overallScore < 50) {
      alerts.push({
        icon: AlertTriangle,
        title: 'Business Health Critical',
        description: 'Multiple areas need immediate attention.',
        severity: 'critical'
      });
    }

    if (businessData.totalTransactions < 5) {
      alerts.push({
        icon: Clock,
        title: 'Low Activity',
        description: 'Very few transactions recorded. Consider marketing efforts.',
        severity: 'warning'
      });
    }

    return alerts;
  };

  const getHealthColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Enhanced Health Analytics Helper Functions

  const generateEarlyWarnings = (businessData: any, scores: any, transactions: any[]) => {
    const warnings = [];

    // Revenue decline warning
    if (transactions.length > 6) {
      const recentRevenue = transactions.slice(-3).reduce((sum, t) => t.type === 'cash-in' ? sum + t.amount : sum, 0);
      const olderRevenue = transactions.slice(-6, -3).reduce((sum, t) => t.type === 'cash-in' ? sum + t.amount : sum, 0);

      if (recentRevenue < olderRevenue * 0.85) {
        warnings.push({
          type: 'Revenue Decline',
          severity: 'high',
          message: 'Revenue has declined by more than 15% in recent period',
          action: 'Review pricing strategy and marketing efforts'
        });
      }
    }

    // Customer retention warning
    if (scores.customerHealth < 50) {
      warnings.push({
        type: 'Customer Retention Risk',
        severity: 'medium',
        message: 'Customer retention metrics are below healthy levels',
        action: 'Implement customer loyalty programs and follow-up systems'
      });
    }

    // Operational efficiency warning
    if (scores.operationalHealth < 60) {
      warnings.push({
        type: 'Operational Inefficiency',
        severity: 'medium',
        message: 'Operational metrics indicate potential efficiency issues',
        action: 'Review and optimize business processes'
      });
    }

    return warnings;
  };

  const analyzeHealthTrends = (transactions: any[]) => {
    const monthlyHealth = new Map();

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyHealth.has(monthKey)) {
        monthlyHealth.set(monthKey, { revenue: 0, transactions: 0, customers: new Set() });
      }

      const monthData = monthlyHealth.get(monthKey);
      if (transaction.type === 'cash-in') {
        monthData.revenue += transaction.amount;
        monthData.transactions += 1;
        if (transaction.customer_name) {
          monthData.customers.add(transaction.customer_name.toLowerCase().trim());
        }
      }
    });

    const trends = Array.from(monthlyHealth.entries())
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        transactions: data.transactions,
        customers: data.customers.size,
        healthScore: calculateMonthHealthScore(data)
      }))
      .slice(-6);

    const trendDirection = trends.length > 1 ?
      (trends[trends.length - 1].healthScore > trends[0].healthScore ? 'improving' : 'declining') : 'stable';

    return {
      trends,
      direction: trendDirection,
      volatility: calculateTrendVolatility(trends.map(t => t.healthScore))
    };
  };

  const calculateMonthHealthScore = (monthData: any): number => {
    const revenueScore = Math.min(100, (monthData.revenue / 10000) * 100);
    const transactionScore = Math.min(100, (monthData.transactions / 50) * 100);
    const customerScore = Math.min(100, (monthData.customers / 20) * 100);

    return (revenueScore * 0.5 + transactionScore * 0.3 + customerScore * 0.2);
  };

  const calculateTrendVolatility = (scores: number[]): number => {
    if (scores.length < 2) return 0;
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return Math.sqrt(variance);
  };

  const assessBusinessRisks = (businessData: any, scores: any, transactions: any[]) => {
    const risks = [];

    // Financial risk assessment
    if (scores.financialHealth < 60) {
      risks.push({
        category: 'Financial',
        risk: 'Cash Flow Instability',
        probability: 'Medium',
        impact: 'High',
        mitigation: 'Improve revenue streams and cost management'
      });
    }

    // Market risk assessment
    if (businessData.totalCustomers < 30) {
      risks.push({
        category: 'Market',
        risk: 'Limited Customer Base',
        probability: 'High',
        impact: 'Medium',
        mitigation: 'Expand marketing efforts and customer acquisition'
      });
    }

    // Operational risk assessment
    if (scores.operationalHealth < 65) {
      risks.push({
        category: 'Operational',
        risk: 'Process Inefficiencies',
        probability: 'Medium',
        impact: 'Medium',
        mitigation: 'Streamline operations and improve workflows'
      });
    }

    return risks;
  };

  const generateEnhancedHealthIndicators = (data: any) => {
    return {
      overall: {
        score: data.overallScore,
        grade: getHealthGrade(data.overallScore),
        benchmarkComparison: data.benchmarkComparisons ?
          (Object.values(data.benchmarkComparisons).reduce((sum: number, val: any) => Number(sum) + Number(val), 0) as number) / 4 : 0
      },
      categories: [
        {
          name: 'Financial Health',
          score: data.financialHealth,
          benchmark: data.industryBenchmarks?.financialHealth || 75,
          status: getHealthStatus(data.financialHealth)
        },
        {
          name: 'Operational Health',
          score: data.operationalHealth,
          benchmark: data.industryBenchmarks?.operationalHealth || 70,
          status: getHealthStatus(data.operationalHealth)
        },
        {
          name: 'Customer Health',
          score: data.customerHealth,
          benchmark: data.industryBenchmarks?.customerHealth || 65,
          status: getHealthStatus(data.customerHealth)
        },
        {
          name: 'Growth Health',
          score: data.growthHealth,
          benchmark: data.industryBenchmarks?.growthHealth || 60,
          status: getHealthStatus(data.growthHealth)
        }
      ]
    };
  };

  const generateComprehensiveRecommendations = (businessData: any, scores: any, benchmarkComparisons: any, riskAssessment: any) => {
    const recommendations = [];

    // Priority recommendations based on benchmark comparisons
    Object.entries(benchmarkComparisons).forEach(([category, comparison]: [string, any]) => {
      if (comparison < -20) { // More than 20% below industry average
        recommendations.push({
          icon: TrendingUp,
          title: `Improve ${category.replace('Health', '')} Performance`,
          description: `Currently ${Math.abs(comparison).toFixed(1)}% below industry average. Focus on this area for maximum impact.`,
          priority: 'high'
        });
      }
    });

    // Risk-based recommendations
    riskAssessment.forEach((risk: any) => {
      recommendations.push({
        icon: Shield,
        title: `Mitigate ${risk.risk}`,
        description: risk.mitigation,
        priority: risk.impact === 'High' ? 'high' : 'medium'
      });
    });

    return recommendations.slice(0, 6); // Top 6 recommendations
  };

  const generateAdvancedHealthAlerts = (businessData: any, scores: any, growthHealth: number) => {
    const alerts = [];

    if (scores.overallScore < 40) {
      alerts.push({
        icon: AlertTriangle,
        title: 'Critical Business Health',
        description: 'Multiple areas require immediate attention to ensure business sustainability.',
        severity: 'critical'
      });
    }

    if (scores.financialHealth < 50) {
      alerts.push({
        icon: DollarSign,
        title: 'Financial Health Warning',
        description: 'Revenue and profitability metrics are below healthy levels.',
        severity: 'high'
      });
    }

    return alerts;
  };

  const getHealthGrade = (score: number): string => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const calculateImprovementPotential = (currentScore: number, benchmarkScore: number): number => {
    return Math.max(0, benchmarkScore - currentScore);
  };

  const getCompetitivePosition = (benchmarkComparison: number): string => {
    if (benchmarkComparison > 20) return 'Market Leader';
    if (benchmarkComparison > 0) return 'Above Average';
    if (benchmarkComparison > -10) return 'Average';
    if (benchmarkComparison > -25) return 'Below Average';
    return 'Needs Improvement';
  };

  const getHealthStatus = (score: number): { label: string; color: string } => {
    if (score >= 80) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 60) return { label: 'Good', color: 'bg-yellow-100 text-yellow-800' };
    if (score >= 40) return { label: 'Fair', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Poor', color: 'bg-red-100 text-red-800' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">
              {data.isUpdating ? 'Updating business health in real-time...' : 'Analyzing business health...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthMetrics) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Health Analysis Unavailable</h3>
          <p className="text-gray-500">Not enough data to perform health analysis.</p>
        </CardContent>
      </Card>
    );
  }

  const overallStatus = getHealthStatus(healthMetrics.overallScore);

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-green-600" />
            Business Health Score
            {data.isUpdating && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
                Updating
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-4xl font-bold text-green-900">
                <AnimatedNumber value={Math.round(healthMetrics.overallScore)} />%
              </div>
              <Badge className={overallStatus.color}>
                {overallStatus.label}
              </Badge>
            </div>
            <div className="text-right">
              <Shield className="w-16 h-16 text-green-600 opacity-20" />
            </div>
          </div>
          <Progress value={healthMetrics.overallScore} className="w-full h-3" />
        </CardContent>
      </Card>

      {/* Health Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Health Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthMetrics.healthIndicators.map((indicator, index) => (
              <div key={index} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <indicator.icon className={`h-5 w-5 ${indicator.color}`} />
                    <span className="font-medium text-gray-900">{indicator.name}</span>
                  </div>
                  <span className={`text-lg font-bold ${indicator.color}`}>
                    <AnimatedNumber value={Math.round(indicator.score)} />%
                  </span>
                </div>
                <Progress value={indicator.score} className="w-full h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Alerts */}
      {healthMetrics.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Health Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthMetrics.alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-red-200 bg-red-50">
                  <alert.icon className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{alert.title}</span>
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{alert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Health Improvement Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {healthMetrics.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-purple-200 bg-purple-50">
                <rec.icon className="h-5 w-5 text-purple-600 mt-0.5" />
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
    </div>
  );
}
