
import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { verifyUserPassword } from '@/services/passwordVerificationService';
import { ProgressVisualizationProps, ViewType, ChartConfig } from '@/components/progress/types';
import { useProgressData } from '@/hooks/useProgressData';
import { ProgressControls } from '@/components/progress/ProgressControls';
import { ProgressSummaryStats } from '@/components/progress/ProgressSummaryStats';
import { CashFlowChart } from '@/components/progress/CashFlowChart';
import { NetBalanceChart } from '@/components/progress/NetBalanceChart';
import { exportChartsToPDF } from '@/utils/chartExport';
import { useToast } from '@/hooks/use-toast';
import { logExportPDF } from '@/services/userLogService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Maximize2, X } from 'lucide-react';

export function ProgressVisualization({ transactions = [], userContext }: ProgressVisualizationProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [viewType, setViewType] = useState<ViewType>('monthly');
  const [isExporting, setIsExporting] = useState(false);

  // Comparison mode states
  const [comparisonMode, setComparisonMode] = useState(false);
  const [compareYear, setCompareYear] = useState(new Date().getFullYear() - 1);
  const [compareMonth, setCompareMonth] = useState(new Date().getMonth());
  const [compareViewType, setCompareViewType] = useState<ViewType>('monthly');

  // Store specific dates for daily comparison
  const [primaryDate, setPrimaryDate] = useState<Date | undefined>(undefined);
  const [compareDate, setCompareDate] = useState<Date | undefined>(undefined);

  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Check if this is a multi-tenant context (disable hide balances for multi-tenant users)
  const isMultiTenant = !!userContext;

  // Password protection states (disabled for multi-tenant users)
  const [balancesVisible, setBalancesVisible] = useState(isMultiTenant ? true : false);
  const [passwordPrompt, setPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');

  // Refs for chart elements
  const cashFlowChartRef = useRef<HTMLDivElement>(null);
  const netBalanceChartRef = useRef<HTMLDivElement>(null);

  // Password protection functions (disabled for multi-tenant users)
  const handleToggleBalances = () => {
    if (isMultiTenant) {
      // Do nothing for multi-tenant users - feature is disabled
      return;
    }

    if (balancesVisible) {
      setBalancesVisible(false);
    } else {
      setPasswordPrompt(true);
    }
  };

  const handlePasswordSubmit = async () => {
    const effectiveUser = userContext || currentUser;

    if (!effectiveUser?.email) {
      alert('No user session found');
      return;
    }

    try {
      const isValidPassword = await verifyUserPassword(effectiveUser.email, password);

      if (isValidPassword) {
        setBalancesVisible(true);
        setPasswordPrompt(false);
        setPassword('');
      } else {
        alert('Incorrect password. Please enter your login password.');
        setPassword('');
      }
    } catch (error) {
      console.error('Password verification error:', error);
      alert('Unable to verify password. Please try again.');
      setPassword('');
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Handle view type changes when "All Years" is selected
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    // If "All Years" is selected and current view is daily, switch to monthly
    if (year === 0 && viewType === 'daily') {
      setViewType('monthly');
    }
  };

  const handleCompareYearChange = (year: number) => {
    setCompareYear(year);
    // If "All Years" is selected and current view is daily, switch to monthly
    if (year === 0 && compareViewType === 'daily') {
      setCompareViewType('monthly');
    }
  };

  // Chart configuration for futuristic styling
  const chartConfig: ChartConfig = {
    cashIn: {
      label: "Cash In",
      color: "#10b981", // Emerald 500
    },
    cashOut: {
      label: "Cash Out",
      color: "#ef4444", // Red 500
    },
    netBalance: {
      label: "Net Balance",
      color: "#3b82f6", // Blue 500
    },
    // Comparison colors - more distinct and sophisticated
    compareCashIn: {
      label: "Benchmark Cash In",
      color: "#059669", // Emerald 600
    },
    compareCashOut: {
      label: "Benchmark Cash Out",
      color: "#dc2626", // Red 600
    },
    compareNetBalance: {
      label: "Benchmark Balance",
      color: "#2563eb", // Blue 600
    },
  };

  // Primary data - use the actual selected date for daily comparison
  const primaryData = useProgressData(
    transactions,
    selectedYear,
    selectedMonth,
    viewType,
    comparisonMode && viewType === 'daily' ? primaryDate : undefined
  );

  // Comparison data - use the actual selected comparison date for daily comparison
  const comparisonData = useProgressData(
    transactions,
    compareYear,
    compareMonth,
    compareViewType,
    comparisonMode && compareViewType === 'daily' ? compareDate : undefined
  );

  // Combine data for charts when in comparison mode
  const combinedData = useMemo(() => {
    if (!comparisonMode) return primaryData;

    // For daily view with specific date comparison, create single-item arrays
    if (viewType === 'daily' && compareViewType === 'daily' && primaryDate && compareDate) {
      const primaryItem = primaryData[0];
      const compareItem = comparisonData[0];

      if (primaryItem && compareItem) {
        return [{
          ...primaryItem,
          compareCashIn: compareItem.cashIn || 0,
          compareCashOut: compareItem.cashOut || 0,
          compareNetBalance: compareItem.netBalance || 0,
        }];
      }
    }

    // Ensure both datasets have the same length by taking the minimum
    const minLength = Math.min(primaryData.length, comparisonData.length);

    return primaryData.slice(0, minLength).map((item, index) => ({
      ...item,
      compareCashIn: comparisonData[index]?.cashIn || 0,
      compareCashOut: comparisonData[index]?.cashOut || 0,
      compareNetBalance: comparisonData[index]?.netBalance || 0,
    }));
  }, [primaryData, comparisonData, comparisonMode, viewType, compareViewType, primaryDate, compareDate]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const yearText = selectedYear === 0 ? 'All Years' : selectedYear.toString();
      const reportTitle = `Progress Visualization ${yearText}${viewType === 'daily' && selectedYear !== 0 ? ` - ${months[selectedMonth]}` : ''} - ${viewType === 'monthly' ? 'Monthly' : viewType === 'weekly' ? 'Weekly' : 'Daily'} View${comparisonMode ? ' (Comparison)' : ''}`;

      await exportChartsToPDF(
        cashFlowChartRef.current,
        netBalanceChartRef.current,
        reportTitle
      );

      // Log the export action
      if (currentUser) {
        logExportPDF(currentUser, {
          reportType: 'progress_visualization',
          viewType: viewType,
          selectedYear: selectedYear,
          selectedMonth: selectedMonth,
          comparisonMode: comparisonMode,
          reportTitle: reportTitle,
          timestamp: new Date().toISOString()
        });
      }

      toast({
        title: "Export Successful",
        description: "Charts have been exported to PDF successfully.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export charts to PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const [isCashFlowExpanded, setIsCashFlowExpanded] = useState(false);
  const [isNetBalanceExpanded, setIsNetBalanceExpanded] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden rounded-xl">
        <CardHeader className="border-b border-slate-100 bg-white py-8">
          <div className="flex justify-between items-center sm:px-4">
            <CardTitle className="flex items-center gap-3 text-slate-900 text-3xl font-extrabold tracking-tight">
              <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              Progress Visualization
            </CardTitle>
            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              variant="outline"
              size="lg"
              className="hidden sm:flex items-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold rounded-2xl h-12 px-6"
            >
              <Download className="w-5 h-5" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 p-6">
          {/* Controls Section */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <ProgressControls
              selectedYear={selectedYear}
              setSelectedYear={handleYearChange}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              viewType={viewType}
              setViewType={setViewType}
              comparisonMode={comparisonMode}
              setComparisonMode={setComparisonMode}
              compareYear={compareYear}
              setCompareYear={handleCompareYearChange}
              compareMonth={compareMonth}
              setCompareMonth={setCompareMonth}
              compareViewType={compareViewType}
              setCompareViewType={setCompareViewType}
              primaryDate={primaryDate}
              setPrimaryDate={setPrimaryDate}
              compareDate={compareDate}
              setCompareDate={setCompareDate}
              lightTheme={true}
            />
          </div>

          <ProgressSummaryStats
            primaryData={primaryData}
            comparisonData={comparisonData}
            comparisonMode={comparisonMode}
            viewType={viewType}
            balancesVisible={balancesVisible}
            onToggleBalances={isMultiTenant ? undefined : handleToggleBalances}
            lightTheme={true}
          />

          {/* Cash Flow Section */}
          <div className="relative group bg-white p-4 rounded-xl border border-slate-200">
            <div className="absolute top-6 right-6 z-10 opacity-100 transition-opacity duration-300">
              <Dialog open={isCashFlowExpanded} onOpenChange={setIsCashFlowExpanded}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="icon" className="rounded-full h-14 w-14 bg-white/90 backdrop-blur shadow-2xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all group/btn">
                    <Maximize2 className="h-7 w-7 text-blue-600 group-hover/btn:text-white" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] p-0 bg-white border-none rounded-none sm:rounded-[2.5rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.2)]">
                  <DialogHeader className="p-8 border-b border-slate-100 bg-white z-10">
                    <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
                      <DialogTitle className="text-3xl font-black text-slate-900 flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200">
                          <BarChart3 className="w-8 h-8 text-white" />
                        </div>
                        Cash Flow Trend Analysis
                      </DialogTitle>
                    </div>
                  </DialogHeader>
                  <div className="flex-1 w-full relative bg-white overflow-auto p-4 sm:p-12">
                    <div className="max-w-7xl mx-auto h-full">
                      <CashFlowChart
                        data={combinedData}
                        viewType={viewType}
                        selectedYear={selectedYear}
                        selectedMonth={selectedMonth}
                        comparisonMode={comparisonMode}
                        compareYear={compareYear}
                        compareMonth={compareMonth}
                        compareViewType={compareViewType}
                        chartConfig={chartConfig}
                        fullScreen={true}
                        lightTheme={true}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <CashFlowChart
              ref={cashFlowChartRef}
              data={combinedData}
              viewType={viewType}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              comparisonMode={comparisonMode}
              compareYear={compareYear}
              compareMonth={compareMonth}
              compareViewType={compareViewType}
              chartConfig={chartConfig}
              lightTheme={true}
            />
          </div>

          {/* Net Balance Section */}
          <div className="relative group bg-white p-4 rounded-xl border border-slate-200">
            <div className="absolute top-6 right-6 z-10 opacity-100 transition-opacity duration-300">
              <Dialog open={isNetBalanceExpanded} onOpenChange={setIsNetBalanceExpanded}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="icon" className="rounded-full h-14 w-14 bg-white/90 backdrop-blur shadow-2xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all group/btn">
                    <Maximize2 className="h-7 w-7 text-blue-600 group-hover/btn:text-white" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] p-0 bg-white border-none rounded-none sm:rounded-[2rem] overflow-hidden flex flex-col">
                  <DialogHeader className="p-8 border-b border-slate-100 bg-white z-10">
                    <DialogTitle className="text-3xl font-black text-slate-900 flex items-center gap-3">
                      <div className="p-2 bg-purple-600 rounded-xl">
                        <BarChart3 className="w-8 h-8 text-white" />
                      </div>
                      Net Balance Trend – Full Analysis View
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 w-full relative bg-white overflow-auto p-4 sm:p-12">
                    <div className="max-w-7xl mx-auto h-full">
                      <NetBalanceChart
                        data={combinedData}
                        viewType={viewType}
                        selectedYear={selectedYear}
                        selectedMonth={selectedMonth}
                        comparisonMode={comparisonMode}
                        compareYear={compareYear}
                        compareMonth={compareMonth}
                        compareViewType={compareViewType}
                        chartConfig={chartConfig}
                        fullScreen={true}
                        lightTheme={true}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <NetBalanceChart
              ref={netBalanceChartRef}
              data={combinedData}
              viewType={viewType}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              comparisonMode={comparisonMode}
              compareYear={compareYear}
              compareMonth={compareMonth}
              compareViewType={compareViewType}
              chartConfig={chartConfig}
              lightTheme={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Password Prompt Modal */}
      {passwordPrompt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 bg-white border-slate-200 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-900">
                <Lock className="h-5 w-5 text-blue-600" />
                <span>Enter Password</span>
              </CardTitle>
              <p className="text-sm text-slate-500">
                Enter your password to view progress visualization balances
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
              <div className="flex space-x-2">
                <Button onClick={handlePasswordSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  Unlock Balances
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPasswordPrompt(false);
                    setPassword('');
                  }}
                  className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
