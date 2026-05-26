import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Camera, 
  Target,
  Award,
  Zap,
  BarChart3
} from 'lucide-react';
import { AnimatedNumber } from '@/components/AnimatedNumber';

interface PerformanceOverviewProps {
  data: {
    totalRevenue: number;
    totalTransactions: number;
    totalPictures: number;
    totalCustomers: number;
    avgTransactionValue: number;
    avgPicturesPerTransaction: number;
    revenueGrowth: number;
    customerRetentionRate: number;
    monthlyData: any[];
    weeklyData: any[];
    categoryPerformance: any[];
    rawTransactions: any[];
    profitabilityMetrics: {
      grossProfit: number;
      profitMargin: number;
    };
  };
}

export function PerformanceOverview({ data }: PerformanceOverviewProps) {
  const formatCurrency = (amount: number) => `ZMW ${amount.toLocaleString()}`;

  // Validate data to prevent crashes
  const safeData = {
    totalRevenue: data?.totalRevenue || 0,
    totalTransactions: data?.totalTransactions || 0,
    totalPictures: data?.totalPictures || 0,
    totalCustomers: data?.totalCustomers || 0,
    avgTransactionValue: data?.avgTransactionValue || 0,
    avgPicturesPerTransaction: data?.avgPicturesPerTransaction || 0,
    revenueGrowth: data?.revenueGrowth || 0,
    customerRetentionRate: data?.customerRetentionRate || 0,
    monthlyData: data?.monthlyData || [],
    weeklyData: data?.weeklyData || [],
    categoryPerformance: data?.categoryPerformance || [],
    rawTransactions: data?.rawTransactions || [],
    profitabilityMetrics: data?.profitabilityMetrics || { grossProfit: 0, profitMargin: 0 }
  };

  // Advanced KPI Calculations
  const calculateAdvancedKPIs = () => {
    // Revenue per customer
    const revenuePerCustomer = safeData.totalCustomers > 0 ? safeData.totalRevenue / safeData.totalCustomers : 0;

    // Transaction frequency (transactions per customer)
    const transactionFrequency = safeData.totalCustomers > 0 ? safeData.totalTransactions / safeData.totalCustomers : 0;

    // Picture efficiency (revenue per picture)
    const revenuePerPicture = safeData.totalPictures > 0 ? safeData.totalRevenue / safeData.totalPictures : 0;

    // Business velocity (transactions per day)
    const businessDays = Math.max(1, Math.ceil(safeData.rawTransactions.length > 0 ?
      (new Date().getTime() - new Date(safeData.rawTransactions[safeData.rawTransactions.length - 1]?.date || new Date()).getTime()) / (1000 * 60 * 60 * 24) : 1));
    const transactionsPerDay = safeData.totalTransactions / businessDays;

    // Customer acquisition rate (new customers per month)
    const monthsActive = Math.max(1, safeData.monthlyData.length || 1);
    const customerAcquisitionRate = safeData.totalCustomers / monthsActive;

    return {
      revenuePerCustomer,
      transactionFrequency,
      revenuePerPicture,
      transactionsPerDay,
      customerAcquisitionRate,
      businessDays
    };
  };

  const kpis = calculateAdvancedKPIs();

  // Enhanced Performance Scoring with Industry Benchmarks
  const calculatePerformanceScores = () => {
    // Studio industry benchmarks (adjustable based on market research)
    const benchmarks = {
      revenuePerCustomer: 500,    // ZMW 500 per customer
      avgTransactionValue: 150,   // ZMW 150 per transaction
      profitMargin: 40,          // 40% profit margin
      customerRetention: 60,      // 60% retention rate
      transactionFrequency: 2.5,  // 2.5 transactions per customer
      revenueGrowth: 15          // 15% monthly growth
    };

    const revenueScore = Math.min(100, (kpis.revenuePerCustomer / benchmarks.revenuePerCustomer) * 100);
    const transactionScore = Math.min(100, (safeData.avgTransactionValue / benchmarks.avgTransactionValue) * 100);
    const profitabilityScore = Math.min(100, (safeData.profitabilityMetrics.profitMargin / benchmarks.profitMargin) * 100);
    const retentionScore = Math.min(100, (safeData.customerRetentionRate / benchmarks.customerRetention) * 100);
    const frequencyScore = Math.min(100, (kpis.transactionFrequency / benchmarks.transactionFrequency) * 100);
    const growthScore = safeData.revenueGrowth > 0 ? Math.min(100, (safeData.revenueGrowth / benchmarks.revenueGrowth) * 100) : 0;

    return {
      revenueScore,
      transactionScore,
      profitabilityScore,
      retentionScore,
      frequencyScore,
      growthScore,
      overallScore: (revenueScore + transactionScore + profitabilityScore + retentionScore + frequencyScore + growthScore) / 6
    };
  };

  const scores = calculatePerformanceScores();
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 80) return { label: 'Great', color: 'bg-blue-100 text-blue-800' };
    if (score >= 70) return { label: 'Good', color: 'bg-yellow-100 text-yellow-800' };
    if (score >= 60) return { label: 'Fair', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
  };

  // Advanced Insights Generation
  const generateAdvancedInsights = () => {
    const insights = [];

    // Identify top performing area
    const performanceAreas = [
      { name: 'Revenue Generation', score: scores.revenueScore, metric: 'Revenue per Customer' },
      { name: 'Transaction Value', score: scores.transactionScore, metric: 'Average Transaction Value' },
      { name: 'Profitability', score: scores.profitabilityScore, metric: 'Profit Margin' },
      { name: 'Customer Retention', score: scores.retentionScore, metric: 'Retention Rate' },
      { name: 'Customer Frequency', score: scores.frequencyScore, metric: 'Transaction Frequency' },
      { name: 'Growth', score: scores.growthScore, metric: 'Revenue Growth' }
    ];

    const topPerformer = performanceAreas.reduce((max, area) => area.score > max.score ? area : max);
    const weakestArea = performanceAreas.reduce((min, area) => area.score < min.score ? area : min);

    insights.push({
      icon: Award,
      title: 'Top Strength',
      description: `${topPerformer.name} is your strongest area (${topPerformer.score.toFixed(0)}% vs industry benchmark)`,
      color: 'text-green-600',
      score: topPerformer.score
    });

    // Growth opportunity based on weakest area
    const getGrowthRecommendation = (area: string) => {
      if (area === 'Revenue Generation') return 'Focus on premium service packages and customer value optimization';
      if (area === 'Transaction Value') return 'Bundle services and implement value-based pricing strategies';
      if (area === 'Profitability') return 'Optimize operational costs and improve service efficiency';
      if (area === 'Customer Retention') return 'Implement loyalty programs and customer follow-up systems';
      if (area === 'Customer Frequency') return 'Create repeat visit incentives and seasonal campaigns';
      if (area === 'Growth') return 'Expand marketing efforts and explore new service offerings';
      return 'Analyze market trends and customer feedback for improvement opportunities';
    };

    insights.push({
      icon: Target,
      title: 'Priority Improvement',
      description: `${weakestArea.name}: ${getGrowthRecommendation(weakestArea.name)}`,
      color: 'text-blue-600',
      score: weakestArea.score
    });

    // Quick win based on data analysis
    let quickWin = 'Optimize service delivery process for better efficiency';
    if (data.avgTransactionValue < 100) {
      quickWin = 'Increase transaction value through service bundling and upselling';
    } else if (kpis.transactionFrequency < 2) {
      quickWin = 'Implement customer follow-up system to increase repeat visits';
    } else if (data.profitabilityMetrics.profitMargin < 30) {
      quickWin = 'Review pricing strategy and optimize operational costs';
    } else if (data.revenueGrowth < 5) {
      quickWin = 'Launch targeted marketing campaign to accelerate growth';
    }

    insights.push({
      icon: Zap,
      title: 'Quick Win Opportunity',
      description: quickWin,
      color: 'text-purple-600',
      score: 0
    });

    return insights;
  };

  const insights = generateAdvancedInsights();

  return (
    <div className="space-y-6">
      {/* Overall Performance Score */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Overall Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-bold text-purple-900">
                <AnimatedNumber value={Math.round(scores.overallScore)} />%
              </div>
              <Badge className={getScoreBadge(scores.overallScore).color}>
                {getScoreBadge(scores.overallScore).label}
              </Badge>
              <div className="text-xs text-gray-500 mt-1">
                Industry Benchmark Comparison
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-2">Revenue Growth</div>
              <div className="flex items-center gap-1">
                {data.revenueGrowth >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">+{data.revenueGrowth.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-red-600 font-medium">{data.revenueGrowth.toFixed(1)}%</span>
                  </>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">vs previous period</div>
            </div>
          </div>
          <Progress value={scores.overallScore} className="h-3" />
        </CardContent>
      </Card>

      {/* Advanced KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Revenue per Customer</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(kpis.revenuePerCustomer)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <div className={`text-xs ${getScoreColor(scores.revenueScore)}`}>
                    Score: {Math.round(scores.revenueScore)}%
                  </div>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Avg Transaction Value</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(data.avgTransactionValue)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <div className={`text-xs ${getScoreColor(scores.transactionScore)}`}>
                    Score: {Math.round(scores.transactionScore)}%
                  </div>
                </div>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Profit Margin</p>
                <p className="text-2xl font-bold text-purple-900">
                  <AnimatedNumber value={data.profitabilityMetrics.profitMargin} />%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <div className={`text-xs ${getScoreColor(scores.profitabilityScore)}`}>
                    Score: {Math.round(scores.profitabilityScore)}%
                  </div>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-orange-600 text-sm font-medium mb-2">Customer Retention</p>
              <p className="text-xl font-bold text-orange-900">
                <AnimatedNumber value={data.customerRetentionRate} />%
              </p>
              <Progress value={scores.retentionScore} className="h-2 mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-teal-600 text-sm font-medium mb-2">Transaction Frequency</p>
              <p className="text-xl font-bold text-teal-900">
                <AnimatedNumber value={kpis.transactionFrequency} />x
              </p>
              <Progress value={scores.frequencyScore} className="h-2 mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-indigo-600 text-sm font-medium mb-2">Revenue per Picture</p>
              <p className="text-xl font-bold text-indigo-900">
                {formatCurrency(kpis.revenuePerPicture)}
              </p>
              <div className="text-xs text-gray-500 mt-1">Efficiency Metric</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-pink-600 text-sm font-medium mb-2">Daily Transactions</p>
              <p className="text-xl font-bold text-pink-900">
                <AnimatedNumber value={kpis.transactionsPerDay} />
              </p>
              <div className="text-xs text-gray-500 mt-1">Business Velocity</div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Advanced Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            Performance Breakdown vs Industry Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Revenue Generation</span>
                <span className={`text-sm font-bold ${getScoreColor(scores.revenueScore)}`}>
                  {Math.round(scores.revenueScore)}%
                </span>
              </div>
              <Progress value={scores.revenueScore} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">Revenue per customer vs ZMW 500 benchmark</div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Transaction Value</span>
                <span className={`text-sm font-bold ${getScoreColor(scores.transactionScore)}`}>
                  {Math.round(scores.transactionScore)}%
                </span>
              </div>
              <Progress value={scores.transactionScore} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">Average transaction vs ZMW 150 benchmark</div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Profitability</span>
                <span className={`text-sm font-bold ${getScoreColor(scores.profitabilityScore)}`}>
                  {Math.round(scores.profitabilityScore)}%
                </span>
              </div>
              <Progress value={scores.profitabilityScore} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">Profit margin vs 40% industry benchmark</div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Customer Retention</span>
                <span className={`text-sm font-bold ${getScoreColor(scores.retentionScore)}`}>
                  {Math.round(scores.retentionScore)}%
                </span>
              </div>
              <Progress value={scores.retentionScore} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">Retention rate vs 60% industry benchmark</div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Customer Frequency</span>
                <span className={`text-sm font-bold ${getScoreColor(scores.frequencyScore)}`}>
                  {Math.round(scores.frequencyScore)}%
                </span>
              </div>
              <Progress value={scores.frequencyScore} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">Transactions per customer vs 2.5 benchmark</div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Growth Performance</span>
                <span className={`text-sm font-bold ${getScoreColor(scores.growthScore)}`}>
                  {Math.round(scores.growthScore)}%
                </span>
              </div>
              <Progress value={scores.growthScore} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">Revenue growth vs 15% monthly benchmark</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <div key={index} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <insight.icon className={`h-5 w-5 ${insight.color}`} />
                  <span className="font-medium text-gray-900">{insight.title}</span>
                </div>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
