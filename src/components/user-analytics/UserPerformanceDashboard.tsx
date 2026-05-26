import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  Target,
  Award,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { UserAnalyticsData } from '@/types/auth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';

interface UserPerformanceDashboardProps {
  analyticsData: UserAnalyticsData | null;
  detailed?: boolean;
}

export function UserPerformanceDashboard({ analyticsData, detailed = false }: UserPerformanceDashboardProps) {
  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">No analytics data available</p>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Performance metrics calculations
  const performanceScore = Math.min(100, Math.max(0, 
    (analyticsData.monthlyGrowth * 0.3) + 
    (analyticsData.customerRetention * 0.4) + 
    (Math.min(analyticsData.avgTransactionValue / 100, 1) * 30)
  ));

  const achievements = [
    {
      title: 'Revenue Milestone',
      description: `Earned ZMW ${analyticsData.totalRevenue.toFixed(2)} in total revenue`,
      achieved: analyticsData.totalRevenue > 1000,
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Customer Champion',
      description: `Served ${analyticsData.totalCustomers} unique customers`,
      achieved: analyticsData.totalCustomers >= 10,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Transaction Master',
      description: `Completed ${analyticsData.totalTransactions} transactions`,
      achieved: analyticsData.totalTransactions >= 50,
      icon: Activity,
      color: 'text-purple-600'
    },
    {
      title: 'Growth Leader',
      description: `Achieved ${analyticsData.monthlyGrowth.toFixed(1)}% monthly growth`,
      achieved: analyticsData.monthlyGrowth > 0,
      icon: TrendingUp,
      color: 'text-yellow-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Performance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {performanceScore.toFixed(0)}%
                </div>
                <Progress value={performanceScore} className="w-full" />
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-slate-600">Growth</p>
                  <p className={`font-semibold ${analyticsData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analyticsData.monthlyGrowth >= 0 ? '+' : ''}{analyticsData.monthlyGrowth.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Retention</p>
                  <p className="font-semibold text-blue-600">
                    {analyticsData.customerRetention.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Avg. Value</p>
                  <p className="font-semibold text-purple-600">
                    ZMW {analyticsData.avgTransactionValue.toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Monthly Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analyticsData.recentTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`ZMW ${value}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-green-500" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Tooltip formatter={(value) => [`ZMW ${value}`, 'Amount']} />
                <RechartsPieChart data={analyticsData.topCategories}>
                  {analyticsData.topCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </RechartsPieChart>
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {analyticsData.topCategories.slice(0, 3).map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-sm">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">ZMW {category.amount.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">{category.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${achievement.achieved ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <achievement.icon className={`w-4 h-4 ${achievement.achieved ? achievement.color : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{achievement.title}</h4>
                      <Badge variant={achievement.achieved ? "default" : "secondary"}>
                        {achievement.achieved ? "Achieved" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics (shown when detailed=true) */}
      {detailed && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transaction Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Transactions</span>
                  <span className="font-medium">{analyticsData.totalTransactions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Average Value</span>
                  <span className="font-medium">ZMW {analyticsData.avgTransactionValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Revenue</span>
                  <span className="font-medium text-green-600">ZMW {analyticsData.totalRevenue.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Customers</span>
                  <span className="font-medium">{analyticsData.totalCustomers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Retention Rate</span>
                  <span className="font-medium text-blue-600">{analyticsData.customerRetention.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Avg. per Customer</span>
                  <span className="font-medium">
                    ZMW {analyticsData.totalCustomers > 0 ? (analyticsData.totalRevenue / analyticsData.totalCustomers).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Growth Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Monthly Growth</span>
                  <span className={`font-medium ${analyticsData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analyticsData.monthlyGrowth >= 0 ? '+' : ''}{analyticsData.monthlyGrowth.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Performance Score</span>
                  <span className="font-medium text-purple-600">{performanceScore.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Categories</span>
                  <span className="font-medium">{analyticsData.topCategories.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
