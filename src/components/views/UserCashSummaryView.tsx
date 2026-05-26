import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, TrendingUp, TrendingDown, RefreshCw, Calendar, History, Download, ShieldCheck, Activity, Layout, Users, Zap, ArrowRightCircle, ChevronDown, ChevronUp, FileText, PieChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { parseISO, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SimpleCounter } from '@/components/ui/AnimatedCounter';

interface UserCashSummary {
  user_id: string;
  username: string;
  total_cash_in: number;
  total_cash_out: number;
  total_reserve_withdrawals: number;
}

interface UserCashSummaryViewProps {
  hideHeader?: boolean;
}

export function UserCashSummaryView({ hideHeader = false }: UserCashSummaryViewProps) {
  const [userSummaries, setUserSummaries] = useState<UserCashSummary[]>([]);
  const [filteredSummaries, setFilteredSummaries] = useState<UserCashSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'username' | 'total_cash_in' | 'total_cash_out'>('username');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [totalSystemCashOut, setTotalSystemCashOut] = useState(0);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [exportingUserId, setExportingUserId] = useState<string | null>(null);

  const getPreviousMonth = () => {
    const now = new Date();
    const pm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { year: pm.getFullYear(), month: pm.getMonth() };
  };

  const pmd = getPreviousMonth();
  const [selectedYear, setSelectedYear] = useState(pmd.year);
  const [selectedMonth, setSelectedMonth] = useState(pmd.month);
  const isAdmin = currentUser?.role === 'admin';

  const generateAvailableMonths = useCallback(() => {
    const months = [];
    const cd = new Date();
    const cy = cd.getFullYear();
    const cm = cd.getMonth();
    for (let m = 0; m <= cm; m++) months.push({ value: `${cy}-${String(m).padStart(2, '0')}`, label: format(new Date(cy, m, 1), 'MMMM yyyy'), year: cy, month: m });
    for (let m = 0; m < 12; m++) months.unshift({ value: `${cy - 1}-${String(m).padStart(2, '0')}`, label: format(new Date(cy - 1, m, 1), 'MMMM yyyy'), year: cy - 1, month: m });
    return months;
  }, []);

  const availableMonths = useMemo(() => generateAvailableMonths(), [generateAvailableMonths]);
  const currentMonthValue = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const handleMonthChange = (v: string) => {
    const [y, m] = v.split('-');
    setSelectedYear(parseInt(y));
    setSelectedMonth(parseInt(m));
  };

  const isCurrentMonth = () => {
    const n = new Date();
    return selectedYear === n.getFullYear() && selectedMonth === n.getMonth();
  };

  const fetchUserCashSummaries = useCallback(async () => {
    try {
      setLoading(true);
      const { data: users, error: ue } = await supabase.from('users').select('id, username').order('username');
      if (ue) throw ue;
      const som = format(new Date(selectedYear, selectedMonth, 1), 'yyyy-MM-01');
      const eom = format(new Date(selectedYear, selectedMonth + 1, 0), 'yyyy-MM-dd');
      
      // Fetch all transactions for the month
      let mt: any[] = []; 
      let f = 0; 
      let t = 999; 
      let hm = true;
      
      while (hm) {
        const { data: pt, error: te } = await supabase
          .from('transactions')
          .select('type, amount, added_by, added_by_user_id, date, category_name')
          .gte('date', som)
          .lte('date', eom)
          .range(f, t);
          
        if (te) throw te;
        if (pt && pt.length > 0) { 
          mt = [...mt, ...pt]; 
          if (pt.length < 1000) hm = false; 
          else { f += 1000; t += 1000; } 
        } else {
          hm = false;
        }
      }
      
      const groups: { [k: string]: UserCashSummary } = {};
      for (const u of users || []) {
        groups[u.id] = { user_id: u.id, username: u.username, total_cash_in: 0, total_cash_out: 0, total_reserve_withdrawals: 0 };
      }
      
      for (const tr of mt) {
        let uid = tr.added_by_user_id;
        if (!uid || !groups[uid]) {
          const fu = users?.find(u => u.username === tr.added_by);
          uid = fu ? fu.id : `leg_${tr.added_by}`;
        }
        if (!groups[uid]) groups[uid] = { user_id: uid, username: tr.added_by || 'Unknown', total_cash_in: 0, total_cash_out: 0, total_reserve_withdrawals: 0 };
        const a = Number(tr.amount || 0);
        if (tr.type === 'cash-in') {
          groups[uid].total_cash_in += a;
        } else if (tr.type === 'cash-out') {
          groups[uid].total_cash_out += Math.abs(a);
          if (tr.category_name === 'Reserve Investment Withdrawal') {
            groups[uid].total_reserve_withdrawals += Math.abs(a);
          }
        }
      }
      
      setUserSummaries(Object.values(groups));
      
      const totalRawCashOut = Object.values(groups).reduce((s, u) => s + u.total_cash_out, 0);
      setTotalSystemCashOut(totalRawCashOut);
    } catch (e) { 
      toast({ title: "Sync Failed", variant: "destructive" }); 
    } finally { 
      setLoading(false); 
    }
  }, [selectedYear, selectedMonth, toast]);

  useEffect(() => {
    fetchUserCashSummaries();
    const sub = supabase.channel(`user-cash-summary-${Math.random().toString(36).substring(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchUserCashSummaries())
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [fetchUserCashSummaries]);

  const handleExportUserDetail = async (userId: string, username: string, exportType: 'in' | 'out' | 'both') => {
    setExportingUserId(userId);
    try {
      const som = format(new Date(selectedYear, selectedMonth, 1), 'yyyy-MM-01');
      const eom = format(new Date(selectedYear, selectedMonth + 1, 0), 'yyyy-MM-dd');
      const periodLabel = format(new Date(selectedYear, selectedMonth, 1), 'MMMM yyyy');

      // Fetch precise user transactions for the selected month on-demand
      let mt: any[] = []; 
      let f = 0; 
      let t = 999; 
      let hm = true;
      
      while (hm) {
        // Query by added_by_user_id or fallback added_by string depending on legacy data
        const { data, error } = await supabase
          .from('transactions')
          .select('id, date, time, type, category_name, amount, customer_name, details, number_of_pictures')
          .gte('date', som)
          .lte('date', eom)
          .or(`added_by_user_id.eq.${userId},added_by.eq.${username}`)
          .range(f, t)
          .order('date', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          mt = [...mt, ...data];
          if (data.length < 1000) hm = false;
          else { f += 1000; t += 1000; }
        } else {
          hm = false;
        }
      }

      if (mt.length === 0) {
        toast({ title: "No transactions found", description: `No records for ${username} in ${periodLabel}`, variant: "destructive" });
        return;
      }

      const { exportUserDepositsOnlyPDF, exportUserWithdrawalsOnlyPDF, exportUserFullActivityPDF } = await import('@/utils/userDetailedPdfExport');

      if (exportType === 'in') {
        exportUserDepositsOnlyPDF(username, mt, periodLabel);
      } else if (exportType === 'out') {
        exportUserWithdrawalsOnlyPDF(username, mt, periodLabel);
      } else {
        exportUserFullActivityPDF(username, mt, periodLabel);
      }

      toast({ title: "Export generated", description: `Exported data for ${username}` });
    } catch (e) {
      console.error('Export error:', e);
      toast({ title: "Export Failed", variant: "destructive" });
    } finally {
      setExportingUserId(null);
    }
  };

  const handleExportPDF = async () => {
    const { exportUserSummaryToPDF } = await import('@/utils/userSummaryPdfExport');
    const p = format(new Date(selectedYear, selectedMonth, 1), 'MMMM yyyy');
    await exportUserSummaryToPDF(filteredSummaries, totalStats, p, currentUser?.username || 'Admin');
  };

  const filterAndSortSummaries = () => {
    let f = userSummaries.filter(s => s.username.toLowerCase().includes(searchTerm.toLowerCase()));
    f.sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy];
      if (typeof av === 'string') { av = av.toLowerCase(); bv = (bv as string).toLowerCase(); }
      return sortOrder === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
    });
    setFilteredSummaries(f);
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const totalStats = {
    totalUsers: userSummaries.length,
    totalCashIn: userSummaries.reduce((s, u) => s + u.total_cash_in, 0),
    totalCashOut: totalSystemCashOut
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {!hideHeader && (
        <div className="glass-card overflow-hidden p-8 md:p-12 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-emerald-500 to-teal-600 p-4 border border-white/20 shadow-2xl shadow-emerald-500/40">
                  <Activity className="w-full h-full text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">Agent Synthesis</h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-2 flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-emerald-500" />
                    {format(new Date(selectedYear, selectedMonth, 1), 'MMMM yyyy')} OPERational OVERVIEW
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleExportPDF} className="h-12 px-6 rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-xl">
                <Download className="h-4 w-4 mr-2" />
                Audit PDF
              </Button>
              <Button onClick={fetchUserCashSummaries} className="h-12 px-6 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                Synch
              </Button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="glass-card p-6 border-white/5 bg-white/[0.01] flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Temporal Offset Selection</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Select target sector for audit retrieval</p>
            </div>
          </div>
          <Select value={currentMonthValue} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-64 glass-input h-12 text-[10px] font-black uppercase tracking-[0.2em] border-indigo-500/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-select-content">
              {availableMonths.map(m => <SelectItem key={m.value} value={m.value}>{m.label.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 bg-emerald-500/[0.02] border-emerald-500/10 relative overflow-hidden group">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Gross Inflow (Matrix)</h3>
          <div className="text-4xl font-black text-emerald-400 tracking-tighter tabular-nums leading-none">
            <SimpleCounter amount={totalStats.totalCashIn} currency="ZMW" decimals={2} />
          </div>
          <div className="mt-4 flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
            <div className="h-[2px] w-8 bg-emerald-500" />
            <span className="text-[9px] font-black text-emerald-500 uppercase">Sector Positive</span>
          </div>
        </div>
        <div className="glass-card p-6 bg-rose-500/[0.02] border-rose-500/10 relative overflow-hidden group">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Gross Outflow (Vortex)</h3>
          <div className="text-4xl font-black text-rose-400 tracking-tighter tabular-nums leading-none">
            <SimpleCounter amount={totalStats.totalCashOut} currency="ZMW" decimals={2} />
          </div>
          <div className="mt-4 flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
            <div className="h-[2px] w-8 bg-rose-500" />
            <span className="text-[9px] font-black text-rose-500 uppercase">Sector Negative</span>
          </div>
        </div>
        <div className="glass-card p-6 bg-indigo-500/[0.02] border-indigo-500/10 relative overflow-hidden group">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Neural Nodes</h3>
          <div className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none">
            <SimpleCounter amount={totalStats.totalUsers} currency="" decimals={0} />
          </div>
          <div className="mt-4 flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
            <div className="h-[2px] w-8 bg-indigo-500" />
            <span className="text-[9px] font-black text-indigo-500 uppercase">Registered Agents</span>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden border-white/5 shadow-2xl relative min-h-[500px]">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

        <div className="p-8 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 h-4 w-4 group-focus-within:text-emerald-400 transition-colors" />
            <Input
              placeholder="Identify Agent in Matrix..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 glass-input h-14 text-[11px] font-black uppercase tracking-widest border-white/5 focus:border-emerald-500/30 transition-all shadow-xl"
            />
          </div>
          <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
            {(['username', 'total_cash_in', 'total_cash_out'] as const).map(f => (
              <Button
                key={f}
                onClick={() => handleSort(f)}
                variant="ghost"
                className={cn("h-11 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", sortBy === f ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-lg" : "text-slate-500 hover:text-white")}
              >
                {f.replace(/_/g, ' ')} {sortBy === f && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-32 flex flex-col items-center justify-center">
            <Zap className="w-12 h-12 text-emerald-500 animate-pulse mb-6" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Compiling Ledger Data...</p>
          </div>
        ) : filteredSummaries.length === 0 ? (
          <div className="p-32 text-center">
            <Users className="w-16 h-16 text-slate-800 mx-auto mb-6 stroke-[0.5]" />
            <h4 className="text-xl font-black text-slate-600 uppercase tracking-tighter mb-2">Matrix Void</h4>
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">No financial deviations recorded in sector</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {filteredSummaries.map((summary, idx) => {
              const netBalance = summary.total_cash_in - (summary.total_cash_out - summary.total_reserve_withdrawals);
              const isExpanded = expandedUserId === summary.user_id;

              return (
                <div key={summary.user_id} className="p-0 border-b border-white/[0.03] group animate-in slide-in-from-left-4" style={{ animationDelay: `${idx * 40}ms` }}>
                  {/* Main Row */}
                  <div 
                    onClick={() => setExpandedUserId(isExpanded ? null : summary.user_id)}
                    className="p-6 hover:bg-white/[0.02] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-600/10 group-hover:border-emerald-500/50 transition-all duration-700 shadow-2xl">
                        <span className="text-xl font-black text-slate-400 group-hover:text-emerald-400">{summary.username.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white tracking-tight uppercase italic leading-none group-hover:text-emerald-400 transition-colors mb-2">{summary.username}</h3>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[8px] font-black uppercase italic tracking-widest leading-none h-4">AGENT_ID: {summary.user_id.slice(0, 8).toUpperCase()}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 md:gap-12">
                      <div className="text-right hidden sm:block">
                        <div className="text-lg font-black text-emerald-400 tracking-tighter tabular-nums leading-none">+{summary.total_cash_in.toLocaleString()}</div>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Inflow</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="text-lg font-black text-rose-400 tracking-tighter tabular-nums leading-none">-{summary.total_cash_out.toLocaleString()}</div>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Outflow</p>
                      </div>
                      <div className="text-right">
                        <div className={cn("text-xl font-black tracking-tighter tabular-nums leading-none", netBalance >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {netBalance > 0 ? '+' : ''}{netBalance.toLocaleString()}
                        </div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Net Balance</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          className="h-10 w-10 p-0 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                        >
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Export Panel */}
                  {isExpanded && (
                    <div className="bg-black/20 p-6 flex flex-col sm:flex-row gap-4 justify-end border-t border-white/[0.02] animate-in slide-in-from-top-2 duration-300">
                      <div className="flex-1 flex items-center gap-3 opacity-60">
                        <FileText className="h-5 w-5 text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Select Export Format</span>
                      </div>
                      <Button 
                        onClick={(e) => { e.stopPropagation(); handleExportUserDetail(summary.user_id, summary.username, 'in'); }}
                        disabled={exportingUserId === summary.user_id}
                        className="h-12 px-6 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        {exportingUserId === summary.user_id ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2" />}
                        Deposits Only
                      </Button>
                      <Button 
                        onClick={(e) => { e.stopPropagation(); handleExportUserDetail(summary.user_id, summary.username, 'out'); }}
                        disabled={exportingUserId === summary.user_id}
                        className="h-12 px-6 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        {exportingUserId === summary.user_id ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <TrendingDown className="h-4 w-4 mr-2" />}
                        Withdrawals Only
                      </Button>
                      <Button 
                        onClick={(e) => { e.stopPropagation(); handleExportUserDetail(summary.user_id, summary.username, 'both'); }}
                        disabled={exportingUserId === summary.user_id}
                        className="h-12 px-6 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        {exportingUserId === summary.user_id ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <PieChart className="h-4 w-4 mr-2" />}
                        Full Activity
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
