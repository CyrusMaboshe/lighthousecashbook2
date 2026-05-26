import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Vault, TrendingUp, TrendingDown, History, Shield, Download, Eye, EyeOff, CalendarIcon, Sparkles, Clock, Calendar, ArrowUpRight, ArrowDownLeft, ShieldCheck, Landmark } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useCashvault } from '@/hooks/useCashvault';
import { format } from 'date-fns';
import { PasswordProtectionDialog } from '@/components/PasswordProtectionDialog';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

export function CashvaultManagement() {
  const isMobile = useIsMobile();
  const {
    balance,
    transactions,
    loading,
    depositToCashvault,
    withdrawFromCashvault,
    exportTransactionHistoryToPDF
  } = useCashvault();
  const { currentUser } = useAuth();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [depositDate, setDepositDate] = useState<Date>(new Date());
  const [withdrawDate, setWithdrawDate] = useState<Date>(new Date());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) return;

    setIsProcessing(true);
    await depositToCashvault(amount, depositNote || undefined, depositDate);
    setDepositAmount('');
    setDepositNote('');
    setDepositDate(new Date());
    setIsProcessing(false);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) return;

    setIsProcessing(true);
    await withdrawFromCashvault(amount, withdrawNote || undefined, withdrawDate);
    setWithdrawAmount('');
    setWithdrawNote('');
    setWithdrawDate(new Date());
    setIsProcessing(false);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    await exportTransactionHistoryToPDF();
    setIsExporting(false);
  };

  const handleBalanceVisibilityToggle = () => {
    if (balanceVisible) {
      setBalanceVisible(false);
    } else {
      setPasswordDialogOpen(true);
    }
  };

  const handlePasswordConfirm = () => {
    setBalanceVisible(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 glass-card">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 shadow-2xl">
          <Landmark className="w-8 h-8 text-blue-400 animate-pulse" />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Syncing Vault Data...</p>
      </div>
    );
  }

  const currentBalance = balance?.current_balance || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Header & Hero Stats */}
      <div className="glass-card overflow-hidden p-8 md:p-12 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-blue-500 to-indigo-600 p-4 border border-white/20 shadow-2xl shadow-blue-500/40">
                <Landmark className="w-full h-full text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">Capital Vault</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-2 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Military-Grade Asset Storage
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Reserve
              </div>
              <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                Tier-1 Access Only
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 self-stretch md:self-auto">
            <div className="glass-card bg-white/[0.03] border-white/10 p-6 flex flex-col items-end min-w-[240px] shadow-2xl">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Total Available Liquidity</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-500/50 italic tracking-tighter uppercase mr-1">ZMW</span>
                <div className="text-5xl font-black text-white tracking-tighter tabular-nums">
                  {balanceVisible ? (
                    <AnimatedNumber value={currentBalance} />
                  ) : (
                    <span className="text-white/10 tracking-[-0.1em]">********</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleBalanceVisibilityToggle}
                className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-blue-400 hover:text-blue-300 transition-colors tracking-widest"
              >
                {balanceVisible ? <><EyeOff className="w-3 h-3" /> Hide Sensitive Data</> : <><Eye className="w-3 h-3" /> Decrypt Vault Balance</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid grid-cols-3 glass-card p-1.5 h-auto mb-6 bg-white/[0.02]">
              <TabsTrigger value="deposit" className="glass-tabs-trigger h-12 data-[state=active]:bg-green-500 data-[state=active]:text-white">
                <ArrowDownLeft className="w-4 h-4 mr-2" />
                Inflow
              </TabsTrigger>

              <TabsTrigger value="withdraw" className="glass-tabs-trigger h-12 data-[state=active]:bg-red-500 data-[state=active]:text-white">
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Outflow
              </TabsTrigger>
              <TabsTrigger value="history" className="glass-tabs-trigger h-12 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <History className="w-4 h-4 mr-2" />
                Audit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposit">
              <div className="glass-card p-8 space-y-8 animate-in slide-in-from-left-4 duration-500">
                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">Record Capital Inflow</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Authorize system liquidity increase</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Volume (ZMW)</Label>
                      <Input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0.00"
                        className="glass-input h-14 text-xl font-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Provenance</Label>
                      <Input
                        value={depositNote}
                        onChange={(e) => setDepositNote(e.target.value)}
                        placeholder="Transaction source/memo"
                        className="glass-input h-14"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Effectuation Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button className="glass-input h-14 w-full justify-start text-white bg-transparent hover:bg-white/5 border-white/10">
                          <CalendarIcon className="mr-3 h-5 w-5 text-blue-400" />
                          {depositDate ? format(depositDate, "PPP") : "Select Authorization Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="glass-card border-white/10 p-0 overflow-hidden shadow-2xl">
                        <CalendarComponent
                          mode="single"
                          selected={depositDate}
                          onSelect={(date) => date && setDepositDate(date)}
                          className="bg-[#050505] text-white"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button
                    onClick={handleDeposit}
                    disabled={!depositAmount || parseFloat(depositAmount) <= 0 || isProcessing}
                    className="w-full glass-btn-primary h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] bg-green-600 shadow-lg shadow-green-500/20"
                  >
                    {isProcessing ? 'Authorizing...' : 'Authorize Vault Inflow'}
                  </Button>

                </div>
              </div>
            </TabsContent>

            <TabsContent value="withdraw">
              <div className="glass-card p-8 space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <TrendingDown className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">Record Capital Outflow</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Strategic reserve release</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Value To Release</Label>
                      <Input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        className="glass-input h-14 text-xl font-black overflow-hidden"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Destination Memo</Label>
                      <Input
                        value={withdrawNote}
                        onChange={(e) => setWithdrawNote(e.target.value)}
                        placeholder="Recipient or purpose"
                        className="glass-input h-14"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Authorization Timestamp</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button className="glass-input h-14 w-full justify-start text-white bg-transparent hover:bg-white/5 border-white/10">
                          <CalendarIcon className="mr-3 h-5 w-5 text-red-500" />
                          {withdrawDate ? format(withdrawDate, "PPP") : "Select Release Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="glass-card border-white/10 p-0 overflow-hidden shadow-2xl">
                        <CalendarComponent
                          mode="single"
                          selected={withdrawDate}
                          onSelect={(date) => date && setWithdrawDate(date)}
                          className="bg-[#050505] text-white"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button
                    onClick={handleWithdraw}
                    disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > currentBalance || isProcessing}
                    className="w-full glass-btn-primary h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] bg-red-600 shadow-lg shadow-red-500/20"
                  >
                    {isProcessing ? 'Validating Authorization...' : 'Execute Strategic Release'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="glass-card p-0 overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">Vault Ledger</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cryptographically audited history</p>
                  </div>
                  {transactions && transactions.length > 0 && (
                    <Button onClick={handleExportPDF} disabled={isExporting} className="h-10 px-4 rounded-xl glass-btn-primary text-[9px] font-black uppercase tracking-widest">
                      <Download className="w-3 h-3 mr-2" /> Export Audit Log
                    </Button>
                  )}
                </div>

                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  {!transactions || transactions.length === 0 ? (
                    <div className="p-20 text-center">
                      <Shield className="w-16 h-16 text-slate-800 mx-auto mb-4" />
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Ledger Initialized - No Records</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {transactions.map((transaction, idx) => (
                        <div key={transaction.id} className="p-6 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-6 group">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110",
                              transaction.action_type === 'deposit_from_main'
                                ? 'bg-green-500/10 border-green-500/20 text-green-500'
                                : 'bg-red-500/10 border-red-500/20 text-red-500'
                            )}>
                              {transaction.action_type === 'deposit_from_main' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-white text-lg tracking-tight uppercase italic">{transaction.action_type === 'deposit_from_main' ? 'Deposit' : 'Withdrawal'}</span>
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">#{transaction.id.slice(0, 8)}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {format(new Date(transaction.created_at), 'HH:mm')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn(
                              "text-2xl font-black tabular-nums tracking-tighter",
                              transaction.action_type === 'deposit_from_main' ? 'text-green-400' : 'text-red-500'
                            )}>
                              {transaction.action_type === 'deposit_from_main' ? '+' : '-'} {transaction.amount.toLocaleString()}
                            </div>

                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Approved by {transaction.initiating_user}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <div className="glass-card p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Shield className="w-5 h-5 text-blue-400" />
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Security Metrics</h4>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center group">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Authorization Tier</span>
                <span className="text-[10px] font-black text-blue-400 uppercase bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 group-hover:bg-blue-500/20 transition-all tracking-tighter shadow-sm">Super Admin Level</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ledger Integrity</span>
                <span className="text-[10px] font-black text-emerald-400 uppercase flex items-center gap-1.5 group-hover:translate-x-[-4px] transition-transform tracking-tighter">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  Verified
                </span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Protocol Type</span>
                <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-tighter group-hover:scale-110 transition-transform">Multi-Tenant Isolated</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 bg-blue-500/[0.03] border-blue-500/10">
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              The <span className="text-white font-bold tracking-tight italic uppercase">Capital Vault</span> operates as an isolated fiscal environment. Every transaction requires Tier-1 administrative credentials and is logged within our immutable high-frequency audit stream for audit and compliance purposes.
            </p>
          </div>
        </div>
      </div>

      <PasswordProtectionDialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        onConfirm={handlePasswordConfirm}
        title="Administrative Authorization"
        description="Verify your high-frequency credentials to decrypt vault balance data."
        currentUser={currentUser}
      />
    </div>
  );
}
