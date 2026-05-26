/**
 * Legacy Reports - Company Admin Dashboard
 * Replicates the EXACT design and functionality of the original AutomatedReports
 * but filtered for company-specific data only
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, RefreshCw, Calendar, LineChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMultiTenantAuth } from '@/hooks/useMultiTenantAuth';
import { TrendingUp, TrendingDown, DollarSign, Activity, Camera } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { ProgressVisualization } from '@/components/ProgressVisualization';
import { exportElementsToPDF } from '@/utils/universalChartExport';

type ReportView = 'monthly' | 'progress';

interface CompanyReportData {
  totalCashIn: number;
  totalCashOut: number;
  netBalance: number;
  transactionCount: number;
  totalPictures: number;
  topCategories: Array<{
    name: string;
    amount: number;
    count: number;
  }>;
}

interface CompanyOverallData {
  totalCashIn: number;
  totalCashOut: number;
  netBalance: number;
  transactionCount: number;
  totalPictures: number;
}

export function LegacyReports() {
  const { currentCompany } = useMultiTenantAuth();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<ReportView>('monthly');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState<CompanyReportData | null>(null);
  const [overallData, setOverallData] = useState<CompanyOverallData | null>(null);
  const [loading, setLoading] = useState(false);
  const [overallLoading, setOverallLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (currentCompany) {
      fetchReportData();
      fetchOverallData();
      fetchTransactions();
    }
  }, [currentCompany, currentMonth, currentYear]);

  const fetchTransactions = async () => {
    if (!currentCompany) return;

    try {
      const { data, error } = await supabase
        .from('mt_company_transactions')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching company transactions:', error);
    }
  };

  const fetchOverallData = async () => {
    if (!currentCompany) return;

    try {
      setOverallLoading(true);
      const { data, error } = await supabase
        .from('mt_company_transactions')
        .select('*')
        .eq('company_id', currentCompany.id);

      if (error) throw error;

      const transactions = data || [];
      const cashInTransactions = transactions.filter(t => t.type === 'cash-in');
      const cashOutTransactions = transactions.filter(t => t.type === 'cash-out');

      const totalCashIn = cashInTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalCashOut = cashOutTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalPictures = cashInTransactions.reduce((sum, t) => sum + (t.number_of_pictures || 0), 0);

      setOverallData({
        totalCashIn,
        totalCashOut,
        netBalance: totalCashIn - totalCashOut,
        transactionCount: transactions.length,
        totalPictures
      });
    } catch (error) {
      console.error('Error fetching overall data:', error);
    } finally {
      setOverallLoading(false);
    }
  };

  const fetchReportData = async () => {
    if (!currentCompany) return;

    try {
      // Check if report exists in tenant_reports table
      const { data: existingReport, error: fetchError } = await supabase
        .from('tenant_reports')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('report_month', currentMonth)
        .eq('report_year', currentYear)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingReport) {
        setReportData({
          totalCashIn: existingReport.total_cash_in || 0,
          totalCashOut: existingReport.total_cash_out || 0,
          netBalance: existingReport.net_balance || 0,
          transactionCount: existingReport.transaction_count || 0,
          totalPictures: existingReport.total_pictures || 0,
          topCategories: existingReport.top_categories || []
        });
      } else {
        setReportData(null);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      setReportData(null);
    }
  };

  const generateReport = async () => {
    if (!currentCompany) return;

    setLoading(true);
    try {
      console.log(`🔄 Generating company report for ${currentMonth}/${currentYear}`);

      // Fetch company transactions for the specific month/year
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

      const { data: transactions, error } = await supabase
        .from('mt_company_transactions')
        .select('*')
        .eq('company_id', currentCompany.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      const cashInTransactions = transactions?.filter(t => t.type === 'cash-in') || [];
      const cashOutTransactions = transactions?.filter(t => t.type === 'cash-out') || [];

      const totalCashIn = cashInTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalCashOut = cashOutTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalPictures = cashInTransactions.reduce((sum, t) => sum + (t.number_of_pictures || 0), 0);

      // Calculate top categories
      const categoryMap = new Map();
      cashInTransactions.forEach(t => {
        const category = t.category || 'Uncategorized';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { amount: 0, count: 0 });
        }
        const data = categoryMap.get(category);
        data.amount += t.amount || 0;
        data.count += 1;
      });

      const topCategories = Array.from(categoryMap.entries())
        .map(([name, data]) => ({ name, amount: data.amount, count: data.count }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Save report to tenant_reports table
      const reportData = {
        company_id: currentCompany.id,
        report_month: currentMonth,
        report_year: currentYear,
        total_cash_in: totalCashIn,
        total_cash_out: totalCashOut,
        net_balance: totalCashIn - totalCashOut,
        transaction_count: transactions?.length || 0,
        total_pictures: totalPictures,
        top_categories: topCategories,
        generated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('tenant_reports')
        .upsert(reportData, {
          onConflict: 'company_id,report_month,report_year'
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Report Generated",
        description: `Monthly report for ${monthNames[currentMonth - 1]} ${currentYear} has been generated successfully.`,
      });

      await fetchReportData();
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const exportToPDF = async () => {
    if (!reportData || !currentCompany) return;
    
    setLoading(true);
    try {
      // Create a temporary element with the report content
      const reportElement = document.createElement('div');
      reportElement.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="text-align: center; color: #1f2937; margin-bottom: 30px;">
            ${currentCompany.display_name} - Monthly Report
          </h1>
          <h2 style="text-align: center; color: #6b7280; margin-bottom: 40px;">
            ${monthNames[currentMonth - 1]} ${currentYear}
          </h2>
          
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="color: #059669; margin: 0 0 10px 0;">Total Cash In</h3>
              <p style="font-size: 24px; font-weight: bold; color: #047857; margin: 0;">ZMW ${reportData.totalCashIn.toLocaleString()}</p>
            </div>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="color: #dc2626; margin: 0 0 10px 0;">Total Cash Out</h3>
              <p style="font-size: 24px; font-weight: bold; color: #b91c1c; margin: 0;">ZMW ${reportData.totalCashOut.toLocaleString()}</p>
            </div>
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="color: #2563eb; margin: 0 0 10px 0;">Net Balance</h3>
              <p style="font-size: 24px; font-weight: bold; color: ${reportData.netBalance >= 0 ? '#1d4ed8' : '#dc2626'}; margin: 0;">ZMW ${reportData.netBalance.toLocaleString()}</p>
            </div>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="color: #374151; margin: 0 0 10px 0;">Transactions</h3>
              <p style="font-size: 24px; font-weight: bold; color: #111827; margin: 0;">${reportData.transactionCount}</p>
            </div>
          </div>
          
          <div style="margin-top: 30px;">
            <h3 style="color: #1f2937; margin-bottom: 20px;">Top Categories</h3>
            ${reportData.topCategories.map(category => `
              <div style="display: flex; justify-content: space-between; padding: 15px; background: #f9fafb; margin-bottom: 10px; border-radius: 6px;">
                <span style="font-weight: 500;">${category.name}</span>
                <div style="text-align: right;">
                  <div style="font-weight: bold;">ZMW ${category.amount.toLocaleString()}</div>
                  <div style="font-size: 12px; color: #6b7280;">${category.count} transactions</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      
      document.body.appendChild(reportElement);
      
      await exportElementsToPDF(
        [reportElement],
        `${currentCompany.display_name}_Report_${monthNames[currentMonth - 1]}_${currentYear}`,
        undefined,
        [`${currentCompany.display_name} - ${monthNames[currentMonth - 1]} ${currentYear} Report`]
      );
      
      document.body.removeChild(reportElement);
      
      toast({
        title: "Export Complete",
        description: "Your report has been exported to PDF successfully.",
      });
      
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">No company selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs - EXACT Legacy Style */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setCurrentView('monthly')}
          className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            currentView === 'monthly'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Monthly Reports
        </button>
        <button
          onClick={() => setCurrentView('progress')}
          className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            currentView === 'progress'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <LineChart className="w-4 h-4 mr-2" />
          Progress Visualization
        </button>
      </div>

      {currentView === 'monthly' && (
        <>
          {/* Overall Summary Card - EXACT Legacy Style */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Business Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {overallLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading overall data...</p>
                  </div>
                </div>
              ) : overallData ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-600 text-sm font-medium">Total Cash In</p>
                        <p className="text-2xl font-bold text-emerald-700">
                          ZMW <AnimatedNumber amount={overallData.totalCashIn} decimals={2} />
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-emerald-600" />
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-600 text-sm font-medium">Total Cash Out</p>
                        <p className="text-2xl font-bold text-red-700">
                          ZMW <AnimatedNumber amount={overallData.totalCashOut} decimals={2} />
                        </p>
                      </div>
                      <TrendingDown className="w-8 h-8 text-red-600" />
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${
                    overallData.netBalance >= 0 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-orange-50 border-orange-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${
                          overallData.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'
                        }`}>Net Balance</p>
                        <p className={`text-2xl font-bold ${
                          overallData.netBalance >= 0 ? 'text-blue-700' : 'text-orange-700'
                        }`}>
                          <AnimatedNumber
                            amount={overallData.netBalance}
                            currency="ZMW"
                            decimals={2}
                            className={`text-2xl font-bold ${overallData.netBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}
                          />
                        </p>
                      </div>
                      <DollarSign className={`w-8 h-8 ${
                        overallData.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'
                      }`} />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Transactions</p>
                        <p className="text-2xl font-bold text-slate-700">
                          <AnimatedNumber amount={overallData.transactionCount} currency="" decimals={0} className="text-2xl font-bold text-slate-700" />
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-slate-600" />
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm font-medium">Pictures</p>
                        <p className="text-2xl font-bold text-purple-700">
                          <AnimatedNumber amount={overallData.totalPictures} decimals={0} />
                        </p>
                      </div>
                      <Camera className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Month Navigation - EXACT Legacy Style */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Monthly Report</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-lg font-semibold px-4">
                    {monthNames[currentMonth - 1]} {currentYear}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Report Content */}
          {reportData ? (
            <>
              {/* Monthly Summary - EXACT Legacy Style */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-600 text-sm font-medium">Total Cash In</p>
                      <p className="text-2xl font-bold text-emerald-700">ZMW {reportData.totalCashIn.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-600 text-sm font-medium">Total Cash Out</p>
                      <p className="text-2xl font-bold text-red-700">ZMW {reportData.totalCashOut.toLocaleString()}</p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-600" />
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${
                  reportData.netBalance >= 0 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${
                        reportData.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'
                      }`}>Net Balance</p>
                      <p className={`text-2xl font-bold ${
                        reportData.netBalance >= 0 ? 'text-blue-700' : 'text-orange-700'
                      }`}>ZMW {reportData.netBalance.toLocaleString()}</p>
                    </div>
                    <DollarSign className={`w-8 h-8 ${
                      reportData.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`} />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Transactions</p>
                      <p className="text-2xl font-bold text-slate-700">{reportData.transactionCount}</p>
                    </div>
                    <Activity className="w-8 h-8 text-slate-600" />
                  </div>
                </div>
              </div>

              {/* Top Categories - EXACT Legacy Style */}
              {reportData.topCategories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData.topCategories.map((category, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium">{category.name}</span>
                          <div className="text-right">
                            <div className="font-bold text-slate-700">ZMW {category.amount.toLocaleString()}</div>
                            <div className="text-sm text-slate-500">{category.count} transactions</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Export Actions - EXACT Legacy Style */}
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={exportToPDF}
                  disabled={loading}
                >
                  <Download className="w-4 h-4" />
                  {loading ? 'Exporting...' : 'Export Report'}
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  No report data available for {monthNames[currentMonth - 1]} {currentYear}
                </p>
                <Button onClick={generateReport} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {currentView === 'progress' && (
        <ProgressVisualization transactions={transactions} />
      )}
    </div>
  );
}
