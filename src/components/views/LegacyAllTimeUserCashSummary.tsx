/**
 * Legacy All-Time User Cash Summary
 * Shows comprehensive cash in/out totals for each user across all months and years
 * For legacy admin system (jonahdjbreezy@gmail.com)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Users,
  Calendar,
  Activity,
  Target,
  AlertCircle,
  Download,
  ShieldCheck,
  Zap,
  Layout,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  ArrowRightCircle,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { SimpleCounter } from '@/components/ui/AnimatedCounter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCashSummaryView } from '@/components/views/UserCashSummaryView';
import { cn } from '@/lib/utils';

interface UserCashSummary {
  user_id: string;
  username: string;
  email: string;
  total_cash_in: number;
  total_cash_out: number;
  total_reserve_withdrawals: number;
  net_balance: number;
  transaction_count: number;
  first_transaction: string | null;
  last_transaction: string | null;
  avg_transaction_value: number;
}

export function LegacyAllTimeUserCashSummary() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [userSummaries, setUserSummaries] = useState<UserCashSummary[]>([]);
  const [filteredSummaries, setFilteredSummaries] = useState<UserCashSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof UserCashSummary>('username');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [totalSystemCashOut, setTotalSystemCashOut] = useState(0);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [exportingUserId, setExportingUserId] = useState<string | null>(null);

  const isAuthorized = currentUser?.email === 'jonahdjbreezy@gmail.com' || currentUser?.role === 'admin';
  const isAdminVisible = currentUser?.email === 'jonahdjbreezy@gmail.com' || currentUser?.role === 'admin';

  const fetchAllTimeUserSummaries = async () => {
    if (!isAuthorized) return;

    try {
      setLoading(true);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, email')
        .order('username');

      if (usersError) throw usersError;

      let allTransactions: any[] = [];
      let from = 0;
      let to = 999;
      let hasMore = true;

      while (hasMore) {
        const { data: pageTransactions, error: transError } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: true })
          .range(from, to);

        if (transError) throw transError;

        if (pageTransactions && pageTransactions.length > 0) {
          allTransactions = [...allTransactions, ...pageTransactions];
          if (pageTransactions.length < 1000) hasMore = false;
          else {
            from += 1000;
            to += 1000;
          }
        } else hasMore = false;
      }

      const userGroups: { [key: string]: UserCashSummary } = {};

      for (const user of users || []) {
        userGroups[user.id] = {
          user_id: user.id,
          username: user.username || user.email,
          email: user.email,
          total_cash_in: 0,
          total_cash_out: 0,
          total_reserve_withdrawals: 0,
          net_balance: 0,
          transaction_count: 0,
          first_transaction: null,
          last_transaction: null,
          avg_transaction_value: 0
        };
      }

      for (const t of allTransactions) {
        let userId = t.added_by_user_id;
        if (!userId || !userGroups[userId]) {
          const foundUser = users?.find(u => u.username === t.added_by);
          userId = foundUser ? foundUser.id : `legacy_${t.added_by}`;
        }

        if (!userGroups[userId]) {
          userGroups[userId] = {
            user_id: userId,
            username: t.added_by || 'Unknown User',
            email: 'N/A',
            total_cash_in: 0,
            total_cash_out: 0,
            total_reserve_withdrawals: 0,
            net_balance: 0,
            transaction_count: 0,
            first_transaction: null,
            last_transaction: null,
            avg_transaction_value: 0
          };
        }

        const stats = userGroups[userId];
        const amount = Number(t.amount || 0);

        if (t.type === 'cash-in') stats.total_cash_in += amount;
        else if (t.type === 'cash-out') {
          stats.total_cash_out += Math.abs(amount);
          if (t.category_name === 'Reserve Investment Withdrawal') {
            stats.total_reserve_withdrawals += Math.abs(amount);
          }
        }

        stats.transaction_count += 1;
        const tDate = t.date || t.created_at;
        if (!stats.first_transaction || new Date(tDate) < new Date(stats.first_transaction)) stats.first_transaction = tDate;
        if (!stats.last_transaction || new Date(tDate) > new Date(stats.last_transaction)) stats.last_transaction = tDate;
      }

      const summaries = Object.values(userGroups).map(stats => ({
        ...stats,
        net_balance: stats.total_cash_in - (stats.total_cash_out - (stats.total_reserve_withdrawals || 0)),
        avg_transaction_value: stats.transaction_count > 0 ? (stats.total_cash_in + stats.total_cash_out) / stats.transaction_count : 0
      }));

      setUserSummaries(summaries);
      setFilteredSummaries(summaries);

      const totalRawCashOut = summaries.reduce((sum, u) => sum + u.total_cash_out, 0);
      setTotalSystemCashOut(totalRawCashOut);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      toast({ title: "Error", description: "Failed to fetch user summaries", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm) setFilteredSummaries(userSummaries);
    else {
      setFilteredSummaries(userSummaries.filter(summary =>
        summary.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        summary.email.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    }
  }, [searchTerm, userSummaries]);

  const handleSort = (field: keyof UserCashSummary) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newOrder);
    setFilteredSummaries([...filteredSummaries].sort((a, b) => {
      const aVal = a[field]; const bVal = b[field];
      if (typeof aVal === 'string' && typeof bVal === 'string') return newOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      if (typeof aVal === 'number' && typeof bVal === 'number') return newOrder === 'asc' ? aVal - bVal : bVal - aVal;
      return 0;
    }));
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchAllTimeUserSummaries();
      const subscription = supabase.channel(`legacy-alltime-cash-summary-${Math.random().toString(36).substring(2, 9)}`).on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchAllTimeUserSummaries()).subscribe();
      return () => { subscription.unsubscribe(); };
    }
  }, [isAuthorized]);

  const totalSystemReserveWithdrawals = userSummaries.reduce((sum, u) => sum + (u.total_reserve_withdrawals || 0), 0);
  const totalStats = {
    totalUsers: userSummaries.length,
    totalCashIn: userSummaries.reduce((sum, u) => sum + u.total_cash_in, 0),
    totalCashOut: totalSystemCashOut,
    netBalance: userSummaries.reduce((sum, u) => sum + u.total_cash_in, 0) - (totalSystemCashOut - totalSystemReserveWithdrawals),
    totalTransactions: userSummaries.reduce((sum, u) => sum + u.transaction_count, 0)
  };

  const handleExportPDF = async () => {
    const { exportUserSummaryToPDF } = await import('@/utils/userSummaryPdfExport');
    await exportUserSummaryToPDF(userSummaries.map(s => ({ user_id: s.user_id, username: s.username, total_cash_in: s.total_cash_in, total_cash_out: s.total_cash_out })), { totalCashIn: totalStats.totalCashIn, totalCashOut: totalStats.totalCashOut, totalUsers: totalStats.totalUsers }, 'All-Time Account Totals', currentUser?.username || 'Admin');
  };

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center p-20 glass-card">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-6" />
        <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Access Prohibited</h3>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 text-center max-w-sm">Elevated administrative privileges required to access global account summaries.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 glass-card">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 shadow-2xl">
          <Activity className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Aggregating Global Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Premium Sub-Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
            <PieChart className="w-8 h-8 text-blue-500" />
            Global Liquidity Map
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            Consolidated Multi-Account Analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleExportPDF}
            className="glass-btn-primary h-12 px-6 rounded-xl bg-emerald-600/10 text-emerald-400 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/5 hover:bg-emerald-600/20"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Protocol Audit
          </Button>
          <Button
            onClick={fetchAllTimeUserSummaries}
            className="h-12 px-6 rounded-xl bg-white/5 text-slate-400 border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Sync Buffer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="alltime" className="w-full">
        <TabsList className="grid w-full grid-cols-2 glass-card p-1 gap-2 bg-white/[0.02] border-white/5 mb-8">
          <TabsTrigger value="monthly" className="h-12 rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Monthly Buffer</TabsTrigger>
          <TabsTrigger value="alltime" className="h-12 rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Historical Aggregate</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="animate-in slide-in-from-left-4 duration-500">
          <UserCashSummaryView hideHeader={true} />
        </TabsContent>

        <TabsContent value="alltime" className="space-y-8 animate-in slide-in-from-right-4 duration-500">
          {/* Summary Intelligence Suite */}
          {isAdminVisible && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-6 bg-blue-500/[0.02] border-blue-500/10 hover:scale-[1.02] transition-transform shadow-lg group">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-4 group-hover:bg-blue-500 group-hover:border-blue-400 transition-all duration-500">
                  <Users className="h-6 w-6 text-blue-400 group-hover:text-white transition-colors" />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ecosystem Agents</p>
                <div className="text-3xl font-black text-white tracking-tighter"><SimpleCounter amount={totalStats.totalUsers} currency="" decimals={0} /></div>
              </div>

              <div className="glass-card p-6 bg-emerald-500/[0.02] border-emerald-500/10 hover:scale-[1.02] transition-transform shadow-lg group">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4 group-hover:bg-emerald-500 group-hover:border-emerald-400 transition-all duration-500">
                  <TrendingUp className="h-6 w-6 text-emerald-400 group-hover:text-white transition-colors" />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Aggregate Inflow</p>
                <div className="text-3xl font-black text-emerald-400 tracking-tighter leading-none"><SimpleCounter amount={totalStats.totalCashIn} currency="ZMW" decimals={2} /></div>
              </div>

              <div className="glass-card p-6 bg-rose-500/[0.02] border-rose-500/10 hover:scale-[1.02] transition-transform shadow-lg group">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 mb-4 group-hover:bg-rose-500 group-hover:border-rose-400 transition-all duration-500">
                  <TrendingDown className="h-6 w-6 text-rose-400 group-hover:text-white transition-colors" />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Aggregate Outflow</p>
                <div className="text-3xl font-black text-rose-400 tracking-tighter leading-none"><SimpleCounter amount={totalStats.totalCashOut} currency="ZMW" decimals={2} /></div>
              </div>

              <div className="glass-card p-6 bg-indigo-500/[0.02] border-indigo-500/10 hover:scale-[1.02] transition-transform shadow-lg group">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-4 group-hover:bg-indigo-500 group-hover:border-indigo-400 transition-all duration-500">
                  <Activity className="h-6 w-6 text-indigo-400 group-hover:text-white transition-colors" />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Protocol Density</p>
                <div className="text-3xl font-black text-white tracking-tighter"><SimpleCounter amount={totalStats.totalTransactions} currency="" decimals={0} /></div>
              </div>
            </div>
          )}

          {/* Filtering & Registry */}
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="Identify Agent Terminal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 glass-input h-14 text-[11px] font-black uppercase tracking-widest border-white/5 focus:border-blue-500/30 transition-all"
              />
            </div>
            <div className="glass-card px-6 py-4 flex items-center gap-3 border-white/5 shadow-2xl">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Status:</span>
              <span className="text-[11px] font-black text-white tabular-nums tracking-tighter leading-none italic">{filteredSummaries.length} / {userSummaries.length} ACTIVE LINKS</span>
            </div>
          </div>

          <div className="glass-card overflow-hidden border-white/5 shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.01] border-b border-white/5">
                    <th className="p-6 cursor-pointer group" onClick={() => handleSort('username')}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">Agent Terminal</span>
                        {sortBy === 'username' && <Activity className={cn("h-3 w-3 text-blue-500", sortOrder === 'desc' && "rotate-180")} />}
                      </div>
                    </th>
                    <th className="p-6 text-right cursor-pointer group" onClick={() => handleSort('total_cash_in')}>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">Gross Inflow</span>
                        {sortBy === 'total_cash_in' && <Activity className={cn("h-3 w-3 text-blue-500", sortOrder === 'desc' && "rotate-180")} />}
                      </div>
                    </th>
                    <th className="p-6 text-right cursor-pointer group" onClick={() => handleSort('total_cash_out')}>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">Gross Outflow</span>
                        {sortBy === 'total_cash_out' && <Activity className={cn("h-3 w-3 text-blue-500", sortOrder === 'desc' && "rotate-180")} />}
                      </div>
                    </th>
                    <th className="p-6 text-right cursor-pointer group" onClick={() => handleSort('net_balance')}>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">Net Balance</span>
                        {sortBy === 'net_balance' && <Activity className={cn("h-3 w-3 text-blue-500", sortOrder === 'desc' && "rotate-180")} />}
                      </div>
                    </th>
                    <th className="p-6 text-center cursor-pointer group" onClick={() => handleSort('transaction_count')}>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">Protocols</span>
                        {sortBy === 'transaction_count' && <Activity className={cn("h-3 w-3 text-blue-500", sortOrder === 'desc' && "rotate-180")} />}
                      </div>
                    </th>
                    <th className="p-6 text-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Temporal Range</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredSummaries.map((summary) => (
                    <tr key={summary.user_id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-black text-slate-200 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all">{summary.username.slice(0, 2).toUpperCase()}</div>
                          <div>
                            <p className="text-[15px] font-black text-white tracking-tight leading-none mb-1 capitalize italic">{summary.username}</p>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-tighter truncate max-w-[140px] italic">{summary.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <span className="text-xl font-black text-emerald-400 tabular-nums tracking-tighter">{summary.total_cash_in.toLocaleString()}</span>
                        <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mt-1">PROVISIONED</p>
                      </td>
                      <td className="p-6 text-right">
                        <span className="text-xl font-black text-rose-400 tabular-nums tracking-tighter">{summary.total_cash_out.toLocaleString()}</span>
                        <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mt-1">ALLOCATED</p>
                      </td>
                      <td className="p-6 text-right">
                        <span className={cn("text-2xl font-black tabular-nums tracking-tighter", summary.net_balance >= 0 ? 'text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.1)]' : 'text-rose-400')}>{summary.net_balance.toLocaleString()}</span>
                        <Badge className={cn("ml-2 text-[8px] font-black h-4 px-1 absolute top-4 right-4", summary.net_balance >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20')}>{summary.net_balance >= 0 ? 'SURPLUS' : 'DEFICIT'}</Badge>
                      </td>
                      <td className="p-6 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black tabular-nums italic">
                          {summary.transaction_count} OPS
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all opacity-40 group-hover:opacity-100">
                          <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                            <Calendar className="w-2.5 h-2.5" />
                            <span className="text-white">{summary.first_transaction ? format(new Date(summary.first_transaction), 'MM.dd.yy') : 'INIT'}</span>
                            <ArrowRightCircle className="w-2.5 h-2.5 mx-0.5" />
                            <span className="text-white">{summary.last_transaction ? format(new Date(summary.last_transaction), 'MM.dd.yy') : 'SYNC'}</span>
                          </div>
                          <div className="p-0.5 w-full bg-slate-800/50 rounded-full h-1 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full w-full" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredSummaries.length === 0 && (
              <div className="p-32 text-center">
                <Layout className="w-16 h-16 text-slate-800 mx-auto mb-6 stroke-[0.5]" />
                <h4 className="text-xl font-black text-slate-600 uppercase tracking-tighter mb-2">No Records Found</h4>
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">Historical buffer is empty for the given filter</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
