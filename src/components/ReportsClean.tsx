import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { ProgressVisualization } from '@/components/ProgressVisualization';
import { verifyUserPassword } from '@/services/passwordVerificationService';
import { useToast } from '@/hooks/use-toast';
import { MonthlyBalanceSummary } from '@/components/reports/MonthlyBalanceSummary';
import { isRefundCategory } from '@/utils/refundUtils';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Camera,
  Calendar,
  Eye,
  EyeOff,
  LineChart,
  Brain,
  Activity,
  BarChart3,
  Lock,
  PieChart,
  RefreshCw,
  Zap,
  Target,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { CountUp } from '@/components/ui/CountUp';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface MonthlyStats {
  totalCashIn: number;
  totalCashOut: number;
  netBalance: number;
  totalTransactions: number;
  totalPictures: number;
  topCategories: Array<{
    name: string;
    amount: number;
    count: number;
  }>;
}

interface AllTimeStats {
  totalCashIn: number;
  totalCashOut: number;
  netBalance: number;
  totalTransactions: number;
  totalPictures: number;
  totalUsers: number;
  firstTransaction: Date | null;
  lastTransaction: Date | null;
  averageTransactionValue: number;
  topCategories: Array<{
    name: string;
    amount: number;
    count: number;
  }>;
}

type ReportView = 'monthly' | 'progress' | 'smart' | 'alltime' | 'analytics';

export function Reports() {
  const { transactions, loading } = useTransactions();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const hasSmartAnalysisAccess = currentUser?.email === 'jonahdjbreezy@gmail.com';
  const [currentView, setCurrentView] = useState<ReportView>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [allTimeStats, setAllTimeStats] = useState<AllTimeStats | null>(null);
  const [allTimeLoading, setAllTimeLoading] = useState(false);
  const [balancesVisible, setBalancesVisible] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    if (!transactions || transactions.length === 0) {
      return Array.from({ length: 10 }, (_, i) => currentYear - i);
    }
    const txYears = transactions.map(t => Number(String(t.date).slice(0, 4))).filter(Boolean);
    const minYear = txYears.length ? Math.min(...txYears) : currentYear;
    const maxYear = txYears.length ? Math.max(...txYears) : currentYear;
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) list.push(y);
    return list;
  }, [transactions]);

  useEffect(() => {
    if (!transactions || transactions.length === 0) {
      setMonthlyStats(null);
      return;
    }

    const selectedMonthString = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
    const [year, month] = selectedMonthString.split('-');
    const startDate = `${selectedMonthString}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

    const filteredTransactions = transactions.filter(transaction => {
      return transaction.date >= startDate && transaction.date <= endDate;
    });

    if (filteredTransactions.length === 0) {
      setMonthlyStats({
        totalCashIn: 0,
        totalCashOut: 0,
        netBalance: 0,
        totalTransactions: 0,
        totalPictures: 0,
        topCategories: []
      });
      return;
    }

    const cashInTransactions = filteredTransactions.filter(t => t.type === 'cash-in');
    const cashOutTransactions = filteredTransactions.filter(t => t.type === 'cash-out');
    // Refund-adjusted cash-in: refund categories reduce inflow rather than adding to it
    const cashIn = cashInTransactions.reduce((sum, t) => {
      const amount = Number(t.amount) || 0;
      return isRefundCategory(t.category_name) ? sum - amount : sum + amount;
    }, 0);
    const cashOut = cashOutTransactions.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
    const cashOutOperational = cashOutTransactions
      .filter(t => t.category_name !== 'Reserve Investment Withdrawal')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
    const totalPictures = cashInTransactions.reduce((sum, t) => sum + (t.number_of_pictures || 0), 0);

    const categoryStats: { [key: string]: { amount: number; count: number } } = {};
    filteredTransactions.forEach(transaction => {
      const category = transaction.category_name || 'Uncategorized';
      if (!categoryStats[category]) categoryStats[category] = { amount: 0, count: 0 };
      categoryStats[category].amount += transaction.amount;
      categoryStats[category].count += 1;
    });

    const topCategories = Object.entries(categoryStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    setMonthlyStats({
      totalCashIn: cashIn,
      totalCashOut: cashOut,
      netBalance: cashIn - cashOutOperational,
      totalTransactions: filteredTransactions.length,
      totalPictures,
      topCategories
    });
  }, [transactions, selectedMonth, selectedYear]);

  const formatCurrency = (amount: number) => `ZMW ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const calculateAllTimeStats = () => {
    if (!transactions || transactions.length === 0) {
      setAllTimeStats(null);
      return;
    }
    setAllTimeLoading(true);
    const cashInTransactions = transactions.filter(t => t.type === 'cash-in');
    const cashOutTransactions = transactions.filter(t => t.type === 'cash-out');
    // Refund-adjusted cash-in for all-time stats
    const cashIn = cashInTransactions.reduce((sum, t) => {
      const amount = Number(t.amount) || 0;
      return isRefundCategory(t.category_name) ? sum - amount : sum + amount;
    }, 0);
    const cashOut = cashOutTransactions.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
    const cashOutOperational = cashOutTransactions
      .filter(t => t.category_name !== 'Reserve Investment Withdrawal')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
    const totalPictures = cashInTransactions.reduce((sum, t) => sum + (t.number_of_pictures || 0), 0);
    const uniqueUsers = new Set(transactions.map(t => t.added_by)).size;
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstTransaction = sortedTransactions.length > 0 ? new Date(sortedTransactions[0].date) : null;
    const lastTransaction = sortedTransactions.length > 0 ? new Date(sortedTransactions[sortedTransactions.length - 1].date) : null;
    const averageTransactionValue = cashInTransactions.length > 0 ? cashIn / cashInTransactions.length : 0;

    const categoryStats: { [key: string]: { amount: number; count: number } } = {};
    transactions.forEach(transaction => {
      const category = transaction.category_name || 'Uncategorized';
      if (!categoryStats[category]) categoryStats[category] = { amount: 0, count: 0 };
      categoryStats[category].amount += transaction.amount;
      categoryStats[category].count += 1;
    });

    const topCategories = Object.entries(categoryStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    setAllTimeStats({
      totalCashIn: cashIn,
      totalCashOut: cashOut,
      netBalance: cashIn - cashOutOperational,
      totalTransactions: transactions.length,
      totalPictures,
      totalUsers: uniqueUsers,
      firstTransaction,
      lastTransaction,
      averageTransactionValue,
      topCategories
    });
    setAllTimeLoading(false);
  };

  useEffect(() => {
    if (currentView === 'alltime' && !allTimeLoading) calculateAllTimeStats();
  }, [currentView, transactions]);

  const handleToggleBalances = async () => {
    if (balancesVisible) {
      setBalancesVisible(false);
      return;
    }
    if (!currentUser?.email) {
      toast({ title: "Authentication Required", description: "Please log in to view sensitive data", variant: "destructive" });
      return;
    }
    setPasswordPrompt(true);
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      toast({ title: "Password Required", description: "Please enter your password to continue", variant: "destructive" });
      return;
    }
    try {
      const isValid = await verifyUserPassword(currentUser.email, password);
      if (isValid) {
        setBalancesVisible(true);
        setPasswordPrompt(false);
        setPassword('');
        toast({ title: "Access Granted", description: "Financial data is now visible" });
      } else {
        toast({ title: "Invalid Password", description: "Please check your password and try again", variant: "destructive" });
      }
    } catch (error) {
      console.error('Password verification error:', error);
      toast({ title: "Verification Failed", description: "Unable to verify password. Please try again.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 glass-card">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 shadow-2xl">
          <BarChart3 className="w-8 h-8 text-blue-400 animate-pulse" />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Syncing Analytical Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="glass-card overflow-hidden p-8 md:p-12 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-indigo-500 to-purple-600 p-4 border border-white/20 shadow-2xl shadow-indigo-500/40">
                <BarChart3 className="w-full h-full text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">Intelligence Hub</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-2 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  Consolidated Business Analytics
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={handleToggleBalances}
            className={cn(
              "glass-btn-primary h-14 px-8 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg transition-all duration-500",
              balancesVisible ? "bg-red-500 shadow-red-500/20" : "bg-blue-600 shadow-blue-500/20"
            )}
          >
            {balancesVisible ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {balancesVisible ? 'Restrict Data' : 'Authorize Insight'}
          </Button>
        </div>
      </div>

      {/* Navigation Matrix */}
      <div className="p-1.5 bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/5 flex flex-wrap gap-2 overflow-x-auto custom-scrollbar shadow-inner">
        {[
          { id: 'monthly', icon: Calendar, label: 'Monthly' },
          { id: 'alltime', icon: Activity, label: 'All-Time' },
          { id: 'progress', icon: LineChart, label: 'Progress' },
          { id: 'analytics', icon: Zap, label: 'Advanced' },
          ...(hasSmartAnalysisAccess ? [{ id: 'smart', icon: Brain, label: 'Smart AI' }] : [])
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentView(tab.id as ReportView)}
            className={cn(
              "flex items-center gap-3 px-6 h-14 rounded-2xl transition-all duration-500 text-[11px] font-black uppercase tracking-widest min-w-[140px] justify-center",
              currentView === tab.id
                ? "bg-white/[0.08] text-white border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-105"
                : "bg-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
            )}
          >
            <tab.icon className={cn("w-4 h-4", currentView === tab.id ? "text-blue-400" : "text-slate-600")} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Content Buffer */}
      <div className="min-h-[600px]">
        {currentView === 'monthly' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-700">
            <div className="glass-card p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Temporal Filter: Month</Label>
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger className="glass-input h-14">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-select-content">
                    {months.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Temporal Filter: Year</Label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="glass-input h-14">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-select-content">
                    {years.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {monthlyStats && monthlyStats.totalTransactions > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="glass-card p-6 bg-emerald-500/[0.03] border-emerald-500/20 group hover:scale-[1.02] transition-transform">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4">
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Gross Inflow</p>
                    <p className="text-3xl font-black text-white tracking-tighter tabular-nums">
                      {balancesVisible ? <CountUp end={monthlyStats.totalCashIn} prefix="ZMW " /> : '********'}
                    </p>
                  </div>
                  <div className="glass-card p-6 bg-rose-500/[0.03] border-rose-500/20 group hover:scale-[1.02] transition-transform">
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 mb-4">
                      <TrendingDown className="w-6 h-6 text-rose-400" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Gross Outflow</p>
                    <p className="text-3xl font-black text-white tracking-tighter tabular-nums">
                      {balancesVisible ? <CountUp end={monthlyStats.totalCashOut} prefix="ZMW " /> : '********'}
                    </p>
                  </div>
                  <div className="glass-card p-6 bg-blue-500/[0.03] border-blue-500/20 group hover:scale-[1.02] transition-transform">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-4">
                      <Wallet className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Net Yield</p>
                    <p className={cn("text-3xl font-black tracking-tighter tabular-nums", monthlyStats.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                      {balancesVisible ? <CountUp end={monthlyStats.netBalance} prefix="ZMW " /> : '********'}
                    </p>
                  </div>
                  <div className="glass-card p-6 bg-purple-500/[0.03] border-purple-500/20 group hover:scale-[1.02] transition-transform">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-4">
                      <Camera className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Visual Evidence</p>
                    <p className="text-3xl font-black text-white tracking-tighter tabular-nums">
                      <CountUp end={monthlyStats.totalPictures} decimals={0} />
                    </p>
                  </div>
                </div>

                <div className="glass-card overflow-hidden">
                  <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Segment Analysis</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">High-Performing Cost Centers</p>
                  </div>
                  <div className="p-8 space-y-6">
                    {monthlyStats.topCategories.map((cat, i) => (
                      <div key={cat.name} className="group">
                        <div className="flex justify-between items-end mb-3">
                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tier {i + 1} Category</p>
                            <p className="text-lg font-bold text-white tracking-tight">{cat.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-white tracking-tighter">
                              {balancesVisible ? formatCurrency(cat.amount) : '********'}
                            </p>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{cat.count} Operations</p>
                          </div>
                        </div>
                        <div className="h-2.5 w-full bg-white/[0.02] rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full group-hover:from-blue-500 group-hover:to-indigo-400 transition-all duration-700"
                            style={{ width: `${(cat.amount / (monthlyStats.topCategories[0]?.amount || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-card p-20 text-center">
                <Calendar className="w-16 h-16 text-slate-800 mx-auto mb-6 stroke-[1]" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Zero data points in specified temporal range</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'alltime' && (
          <div className="space-y-8 animate-in zoom-in-95 duration-700">
            <div className="glass-card bg-indigo-900/[0.05] border-indigo-500/20 p-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center md:text-left">
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Total Ecosystem Revenue</p>
                  <p className="text-5xl font-black text-white tracking-tighter tabular-nums mb-2">
                    {balancesVisible && allTimeStats ? <CountUp end={allTimeStats.totalCashIn} prefix="ZMW " /> : '********'}
                  </p>
                  <p className="text-xs text-slate-500 font-bold">Aggregate growth since inception</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Transaction Density</p>
                  <p className="text-5xl font-black text-white tracking-tighter tabular-nums mb-2">
                    {allTimeStats ? <CountUp end={allTimeStats.totalTransactions} decimals={0} /> : '0'}
                  </p>
                  <p className="text-xs text-slate-500 font-bold">Successfully processed protocols</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Network Participants</p>
                  <p className="text-5xl font-black text-white tracking-tighter tabular-nums mb-2">
                    {allTimeStats ? <CountUp end={allTimeStats.totalUsers} decimals={0} /> : '0'}
                  </p>
                  <p className="text-xs text-slate-500 font-bold">Verified administrative agents</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Operational Surplus</p>
                  <p className={cn("text-5xl font-black tracking-tighter tabular-nums mb-2", allTimeStats && allTimeStats.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    {balancesVisible && allTimeStats ? <CountUp end={allTimeStats.netBalance} prefix="ZMW " /> : '********'}
                  </p>
                  <p className="text-xs text-slate-500 font-bold">Consolidated fiscal balance</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-1">
              <MonthlyBalanceSummary balancesVisible={balancesVisible} />
            </div>
          </div>
        )}

        {currentView === 'progress' && (
          <div className="animate-in slide-in-from-right-5 duration-700">
            <ProgressVisualization transactions={transactions} />
          </div>
        )}

        {currentView === 'analytics' && (
          <div className="glass-card p-20 text-center animate-in zoom-in-95 duration-700">
            <Zap className="w-16 h-16 text-blue-500/50 mx-auto mb-6 animate-pulse" />
            <h3 className="text-2xl font-black text-white tracking-tighter mb-4">Advanced Neural Analytics</h3>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] max-w-md mx-auto leading-relaxed">
              Proprietary predictive modeling and multi-dimensional trend extrapolation arriving in the next release cycle.
            </p>
          </div>
        )}

        {currentView === 'smart' && hasSmartAnalysisAccess && (
          <div className="glass-card p-20 text-center animate-in zoom-in-95 duration-700">
            <Brain className="w-16 h-16 text-purple-500/50 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-white tracking-tighter mb-4">Artificial Intelligence Sandbox</h3>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] max-w-md mx-auto leading-relaxed">
              Legacy AI modules restricted to system architect only. Modern replacement under development.
            </p>
          </div>
        )}
      </div>

      {/* Security Overlay */}
      {passwordPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="glass-card overflow-hidden max-w-sm w-full shadow-2xl border-white/20">
            <div className="p-8 border-b border-white/5 bg-blue-500/5">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-6 mx-auto">
                <Lock className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-black text-white text-center tracking-tight">Security Protocol</h3>
              <p className="text-center text-slate-400 text-sm font-medium mt-2">Enter Tier-1 credentials to continue</p>
            </div>
            <div className="p-8 space-y-6">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Administrative Key"
                className="glass-input h-14 text-center tracking-[0.5em]"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setPasswordPrompt(false)} className="flex-1 h-14 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500">Abort</Button>
                <Button onClick={handlePasswordSubmit} className="flex-[2] h-14 rounded-xl glass-btn-primary bg-blue-600 text-[10px] font-black uppercase tracking-widest">Verify Identity</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
