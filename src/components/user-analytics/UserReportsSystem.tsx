import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Users,
  BarChart3,
  PieChart,
  Activity,
  Star,
  Target
} from 'lucide-react';
import { User } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { logExportPDF } from '@/services/userLogService';
import { enforceRevenueEqualsCashIn } from '@/utils/userAnalyticsValidation';
import { ValidationStatusBadge, ValidationSummary } from './ValidationStatusBadge';

interface UserReportsSystemProps {
  transactions: any[];
  currentUser: User | null;
  selectedMonth?: string;
}

type ReportPeriod = '7days' | '30days' | '3months' | '6months' | '12months';
type ReportType = 'summary' | 'detailed' | 'performance' | 'customer';

export function UserReportsSystem({ transactions, currentUser, selectedMonth }: UserReportsSystemProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('30days');
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('summary');
  const [useMonthlyFilter, setUseMonthlyFilter] = useState(!!selectedMonth);
  const { toast } = useToast();

  // Filter user transactions
  const userTransactions = useMemo(() => {
    return transactions.filter(t => t.added_by === currentUser?.username);
  }, [transactions, currentUser]);

  // Generate report data based on selected period or monthly filter
  const reportData = useMemo(() => {
    const now = new Date();
    let periodTransactions: any[];
    let startDate: Date;

    if (useMonthlyFilter && selectedMonth) {
      // Use monthly filter - filter transactions by selected month
      periodTransactions = userTransactions.filter(t => {
        const transactionMonth = t.date.slice(0, 7); // YYYY-MM format
        return transactionMonth === selectedMonth;
      });
      // Set startDate to beginning of selected month
      startDate = new Date(selectedMonth + '-01');
    } else {
      // Use period-based filtering
      switch (selectedPeriod) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case '6months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case '12months':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      periodTransactions = userTransactions.filter(t =>
        new Date(t.date) >= startDate
      );
    }

    const cashInTransactions = periodTransactions.filter(t => t.type === 'cash-in');
    const cashOutTransactions = periodTransactions.filter(t => t.type === 'cash-out');

    // BUSINESS RULE: Total Revenue MUST equal Total Cash-In for user analytics
    const { totalRevenue, totalCashIn, validation } = enforceRevenueEqualsCashIn(
      cashInTransactions,
      {
        username: currentUser?.username,
        component: 'UserReportsSystem',
        period: selectedPeriod,
        additionalInfo: { cashInCount: cashInTransactions.length }
      }
    );

    const totalExpenses = cashOutTransactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0); // Use absolute value for consistent cash-out calculation
    const netProfit = totalRevenue - totalExpenses;

    // Customer analysis
    const uniqueCustomers = new Set(
      cashInTransactions
        .map(t => t.customer_name)
        .filter(name => name && name.trim() !== '')
    );

    // Category breakdown
    const categoryMap = new Map();
    cashInTransactions.forEach(t => {
      const category = t.category || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + (t.amount || 0));
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([name, amount]) => ({ name, amount, percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Performance metrics
    const avgTransactionValue = cashInTransactions.length > 0 ? totalRevenue / cashInTransactions.length : 0;
    const transactionsPerDay = cashInTransactions.length / Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      period: selectedPeriod,
      startDate,
      endDate: now,
      totalRevenue,
      totalExpenses,
      netProfit,
      totalTransactions: cashInTransactions.length,
      uniqueCustomers: uniqueCustomers.size,
      avgTransactionValue,
      transactionsPerDay,
      topCategories,
      profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      validation // Include validation result
    };
  }, [userTransactions, selectedPeriod, useMonthlyFilter, selectedMonth]);

  const getPeriodLabel = (period: ReportPeriod) => {
    switch (period) {
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case '3months': return 'Last 3 Months';
      case '6months': return 'Last 6 Months';
      case '12months': return 'Last 12 Months';
      default: return 'Last 30 Days';
    }
  };

  const exportReport = () => {
    const reportContent = `
PERSONAL BUSINESS REPORT
${getPeriodLabel(selectedPeriod)}
Generated: ${new Date().toLocaleDateString()}

SUMMARY
-------
Total Revenue: ZMW ${reportData.totalRevenue.toFixed(2)}
Total Expenses: ZMW ${reportData.totalExpenses.toFixed(2)}
Net Profit: ZMW ${reportData.netProfit.toFixed(2)}
Profit Margin: ${reportData.profitMargin.toFixed(1)}%

PERFORMANCE METRICS
------------------
Total Transactions: ${reportData.totalTransactions}
Unique Customers: ${reportData.uniqueCustomers}
Average Transaction Value: ZMW ${reportData.avgTransactionValue.toFixed(2)}
Transactions per Day: ${reportData.transactionsPerDay.toFixed(1)}

TOP CATEGORIES
--------------
${reportData.topCategories.map(cat => 
  `${cat.name}: ZMW ${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`
).join('\n')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-report-${selectedPeriod}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Log the export action
    if (currentUser) {
      logExportPDF(currentUser, {
        reportType: 'user_business_report',
        period: selectedPeriod,
        totalRevenue: reportData.totalRevenue,
        totalTransactions: reportData.totalTransactions,
        uniqueCustomers: reportData.uniqueCustomers,
        timestamp: new Date().toISOString()
      });
    }

    toast({
      title: "Report Exported",
      description: "Your business report has been downloaded successfully"
    });
  };

  const getPerformanceRating = (value: number, type: 'profit' | 'transactions' | 'customers') => {
    let rating = 'Poor';
    let color = 'text-red-600';

    switch (type) {
      case 'profit':
        if (value > 5000) { rating = 'Excellent'; color = 'text-green-600'; }
        else if (value > 2000) { rating = 'Good'; color = 'text-blue-600'; }
        else if (value > 500) { rating = 'Fair'; color = 'text-yellow-600'; }
        break;
      case 'transactions':
        if (value > 100) { rating = 'Excellent'; color = 'text-green-600'; }
        else if (value > 50) { rating = 'Good'; color = 'text-blue-600'; }
        else if (value > 20) { rating = 'Fair'; color = 'text-yellow-600'; }
        break;
      case 'customers':
        if (value > 50) { rating = 'Excellent'; color = 'text-green-600'; }
        else if (value > 20) { rating = 'Good'; color = 'text-blue-600'; }
        else if (value > 10) { rating = 'Fair'; color = 'text-yellow-600'; }
        break;
    }

    return { rating, color };
  };

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Business Reports</h2>
          <p className="text-slate-600">Generate detailed insights about your performance</p>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedMonth && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="monthlyFilter"
                checked={useMonthlyFilter}
                onChange={(e) => setUseMonthlyFilter(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="monthlyFilter" className="text-sm text-slate-700">
                Use Monthly Filter ({new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
              </label>
            </div>
          )}

          <Select
            value={selectedPeriod}
            onValueChange={(value: ReportPeriod) => setSelectedPeriod(value)}
            disabled={useMonthlyFilter}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Data Integrity Validation */}
      <ValidationSummary
        validation={reportData.validation}
        title="Revenue = Cash-In Validation"
      />

      {/* Report Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Report Summary - {useMonthlyFilter && selectedMonth ?
              new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) :
              getPeriodLabel(selectedPeriod)
            }
            <ValidationStatusBadge validation={reportData.validation} className="ml-2" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                ZMW {reportData.totalRevenue.toFixed(2)}
              </div>
              <p className="text-sm text-slate-600">Total Revenue</p>
              <Badge className={getPerformanceRating(reportData.totalRevenue, 'profit').color}>
                {getPerformanceRating(reportData.totalRevenue, 'profit').rating}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {reportData.totalTransactions}
              </div>
              <p className="text-sm text-slate-600">Transactions</p>
              <Badge className={getPerformanceRating(reportData.totalTransactions, 'transactions').color}>
                {getPerformanceRating(reportData.totalTransactions, 'transactions').rating}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {reportData.uniqueCustomers}
              </div>
              <p className="text-sm text-slate-600">Customers</p>
              <Badge className={getPerformanceRating(reportData.uniqueCustomers, 'customers').color}>
                {getPerformanceRating(reportData.uniqueCustomers, 'customers').rating}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ZMW {reportData.netProfit.toFixed(2)}
              </div>
              <p className="text-sm text-slate-600">Net Profit</p>
              <Badge className={reportData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                {reportData.profitMargin.toFixed(1)}% Margin
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Average Transaction Value</span>
                <span className="font-medium">ZMW {reportData.avgTransactionValue.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Transactions per Day</span>
                <span className="font-medium">{reportData.transactionsPerDay.toFixed(1)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Revenue per Customer</span>
                <span className="font-medium">
                  ZMW {reportData.uniqueCustomers > 0 ? (reportData.totalRevenue / reportData.uniqueCustomers).toFixed(2) : '0.00'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Profit Margin</span>
                <span className={`font-medium ${reportData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {reportData.profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.topCategories.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-blue-${(index + 1) * 100}`} />
                    <span className="text-sm">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">ZMW {category.amount.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">{category.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
              
              {reportData.topCategories.length === 0 && (
                <p className="text-center text-slate-500 py-4">No category data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.profitMargin > 20 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">🎉 Excellent Profit Margin!</p>
                <p className="text-green-700 text-sm">Your profit margin of {reportData.profitMargin.toFixed(1)}% is excellent. Keep up the great work!</p>
              </div>
            )}
            
            {reportData.avgTransactionValue < 50 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 font-medium">💡 Opportunity to Increase Transaction Value</p>
                <p className="text-yellow-700 text-sm">Consider upselling or bundling services to increase your average transaction value from ZMW {reportData.avgTransactionValue.toFixed(2)}.</p>
              </div>
            )}
            
            {reportData.uniqueCustomers < 10 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 font-medium">🎯 Focus on Customer Acquisition</p>
                <p className="text-blue-700 text-sm">You have {reportData.uniqueCustomers} customers. Consider marketing strategies to attract more customers.</p>
              </div>
            )}
            
            {reportData.transactionsPerDay < 1 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-purple-800 font-medium">📈 Increase Transaction Frequency</p>
                <p className="text-purple-700 text-sm">With {reportData.transactionsPerDay.toFixed(1)} transactions per day, there's room to increase business activity.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
