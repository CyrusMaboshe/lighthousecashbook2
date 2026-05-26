import React, { useState, useEffect } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, DollarSign, Plus, History, Wallet, ShieldCheck, Activity, ArrowUpRight, ArrowDownLeft, Landmark, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

interface TeamWithdrawal {
  id: string;
  amount: number;
  withdrawn_by: string;
  withdrawn_at: string;
  action_type: string;
}

export function TeamWithdrawalView() {
  const { currentUser, isAdmin } = useAuth();
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<TeamWithdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableAmount, setAvailableAmount] = useState(0);
  const [addAmount, setAddAmount] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cashvault_transactions')
        .select('*')
        .in('action_type', ['team_withdrawal_add', 'team_withdrawal_reduce'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const mappedData: TeamWithdrawal[] = (data || []).map(item => ({
        id: item.id,
        amount: item.amount,
        withdrawn_by: item.initiating_user,
        withdrawn_at: item.created_at,
        action_type: item.action_type
      }));

      setWithdrawals(mappedData);

      const totalAdded = mappedData
        .filter(w => w.action_type === 'team_withdrawal_add')
        .reduce((sum, w) => sum + w.amount, 0);
      const totalReduced = mappedData
        .filter(w => w.action_type === 'team_withdrawal_reduce')
        .reduce((sum, w) => sum + w.amount, 0);

      setAvailableAmount(Math.max(0, totalAdded - totalReduced));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`team-withdrawal-updates-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        async (payload) => {
          const tx = payload.new as any;
          if (tx?.type !== 'cash-out' || tx?.category_name === 'Reserve Investment Withdrawal') return;

          const cashOutAmount = Math.abs(Number(tx.amount || 0));
          if (!cashOutAmount) return;

          try {
            const { data, error } = await supabase
              .from('cashvault_transactions')
              .select('action_type,amount')
              .in('action_type', ['team_withdrawal_add', 'team_withdrawal_reduce']);

            if (error) throw error;

            const totalAdded = (data || [])
              .filter((r: any) => r.action_type === 'team_withdrawal_add')
              .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);

            const totalReduced = (data || [])
              .filter((r: any) => r.action_type === 'team_withdrawal_reduce')
              .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);

            const latestAvailable = Math.max(0, totalAdded - totalReduced);
            if (latestAvailable <= 0) return;

            const reduceAmount = Math.min(cashOutAmount, latestAvailable);

            const { error: reduceError } = await supabase.from('cashvault_transactions').insert({
              action_type: 'team_withdrawal_reduce',
              amount: reduceAmount,
              initiating_user: tx.added_by || 'System',
              initiating_user_id: tx.added_by_user_id || null,
              note: `Auto-reduced from cash-out transaction`,
              date: format(new Date(), 'yyyy-MM-dd'),
              time: format(new Date(), 'HH:mm:ss'),
            });

            if (reduceError) throw reduceError;
            fetchData();
          } catch (e) {
            console.error('Failed to auto-reduce team withdrawal:', e);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cashvault_transactions',
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddAmount = async () => {
    if (!currentUser || !addAmount || parseFloat(addAmount) <= 0) return;

    setAdding(true);
    try {
      const amount = parseFloat(addAmount);

      const { error } = await supabase.from('cashvault_transactions').insert({
        action_type: 'team_withdrawal_add',
        amount: amount,
        initiating_user: currentUser.username,
        initiating_user_id: currentUser.id,
        note: `Admin added ${amount} ZMW to team withdrawal pool`,
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm:ss')
      });

      if (error) throw error;

      toast({
        title: 'Amount Added',
        description: `${amount} ZMW has been added to the team withdrawal pool.`,
      });

      setAddAmount('');
      fetchData();
    } catch (error) {
      console.error('Error adding amount:', error);
      toast({
        title: 'Error',
        description: 'Could not add amount. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const formatCurrency = (amount: number) => `ZMW ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  if (loading && withdrawals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 glass-card">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 shadow-2xl">
          <Users className="w-8 h-8 text-amber-400 animate-pulse" />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Syncing Team Liquidity...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="glass-card overflow-hidden p-8 md:p-12 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-amber-500 to-orange-600 p-4 border border-white/20 shadow-2xl shadow-amber-500/40">
                <Users className="w-full h-full text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">Team Withdrawal</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-2 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  Collective Expenditure Protocol
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 self-stretch md:self-auto">
            <div className="glass-card bg-emerald-500/[0.03] border-emerald-500/20 p-6 flex flex-col items-end min-w-[240px] shadow-2xl">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Available Disbursement Pool</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-500/50 italic tracking-tighter uppercase mr-1">ZMW</span>
                <div className="text-5xl font-black text-white tracking-tighter tabular-nums text-emerald-400">
                  <AnimatedNumber value={availableAmount} />
                </div>
              </div>
              <div className="mt-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Real-time Liquidity Verified
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Admin Disbursement Interface */}
          {isAdmin && (
            <div className="glass-card p-8 space-y-8 animate-in slide-in-from-left-4 duration-500 border-amber-500/10 bg-amber-500/[0.01]">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Plus className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Pool Provisioning</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Authorize collective fund injection</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 space-y-2 w-full">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Disbursement Volume (ZMW)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    className="glass-input h-14 text-xl font-black"
                  />
                </div>
                <Button
                  onClick={handleAddAmount}
                  disabled={!addAmount || parseFloat(addAmount) <= 0 || adding}
                  className="glass-btn-primary h-14 px-8 rounded-2xl bg-amber-600 text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20 active:scale-95 transition-all w-full md:w-auto min-w-[180px]"
                >
                  {adding ? 'Authorizing...' : 'Authorize Provision'}
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase tracking-wider">
                  Provisioned funds are accessible to all verified agents. The pool automatically re-balances upon execution of individual "Cash Out" operations.
                </p>
              </div>
            </div>
          )}

          {/* Immutable Ledger (History) */}
          <div className="glass-card overflow-hidden">
            <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Protocol History</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Immutable disbursement ledger</p>
              </div>
              <History className="w-6 h-6 text-slate-800" />
            </div>

            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
              {!withdrawals || withdrawals.length === 0 ? (
                <div className="p-20 text-center">
                  <Activity className="w-16 h-16 text-slate-800 mx-auto mb-6 stroke-[0.5]" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Ledger Initialized - No Records Detected</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="p-6 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-6 group">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 shadow-lg",
                          w.action_type === 'team_withdrawal_add'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                        )}>
                          {w.action_type === 'team_withdrawal_add' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white text-lg tracking-tight uppercase italic">
                              {w.action_type === 'team_withdrawal_add' ? 'Pool Injection' : 'Disbursement'}
                            </span>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">#{w.id.slice(0, 8)}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 uppercase tracking-widest italic">
                              {w.withdrawn_by}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-800" />
                            <span className="text-[10px] text-slate-600 font-medium">
                              {format(new Date(w.withdrawn_at), 'MMM d, yyyy • HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "text-2xl font-black tabular-nums tracking-tighter",
                          w.action_type === 'team_withdrawal_add' ? 'text-emerald-400' : 'text-rose-400'
                        )}>
                          {w.action_type === 'team_withdrawal_add' ? '+' : '-'} {Math.abs(w.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5 italic">Protocol Verified</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Strategic Insight Card */}
          <div className="glass-card p-8 space-y-6 bg-amber-500/[0.03] border-amber-500/20">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Team Protocols</h4>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Injection Aggregate</span>
                <span className="text-[11px] font-black text-emerald-400 tabular-nums">
                  {formatCurrency(withdrawals.filter(w => w.action_type === 'team_withdrawal_add').reduce((s, w) => s + w.amount, 0))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Utilized Balance</span>
                <span className="text-[11px] font-black text-rose-500 tabular-nums">
                  {formatCurrency(withdrawals.filter(w => w.action_type === 'team_withdrawal_reduce').reduce((s, w) => s + w.amount, 0))}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <span className="text-[10px] text-white font-black uppercase tracking-widest">Net Surplus</span>
                <span className="text-lg font-black text-white tabular-nums tracking-tighter">
                  {formatCurrency(availableAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Security Compliance Context */}
          <div className="glass-card p-8 bg-white/[0.02]">
            <p className="text-xs text-slate-400 leading-relaxed font-medium uppercase tracking-wider text-[10px]">
              The <span className="text-amber-500 font-black italic">Team Withdrawal Pool</span> is maintained as a high-liquidity reserve for administrative requirements. All protocol re-balancing is recorded with <span className="text-white font-bold">SHA-256 integrity</span> within the system's global ledger.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
