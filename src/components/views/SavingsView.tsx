import React, { useState } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useSavings } from '@/hooks/useSavings';
import { User } from '@/types/auth';
import { Wallet, TrendingUp, TrendingDown, Calendar, Clock, Eye, EyeOff, CalendarIcon, PiggyBank, Download, ShieldCheck, Zap, Activity, ArrowUpRight, ArrowDownLeft, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { format } from 'date-fns';
import { PasswordProtectionDialog } from '@/components/PasswordProtectionDialog';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { exportSavingsTransactionsToPDF } from '@/utils/savingsPdfExport';

interface SavingsViewProps {
  currentUser: User;
}

export const SavingsView: React.FC<SavingsViewProps> = ({ currentUser }) => {
  const isMobile = useIsMobile();
  const isAdmin = currentUser.role === 'admin';
  const {
    savingsBalance,
    transactions,
    loading,
    depositToSavings,
    withdrawFromSavings,
  } = useSavings({
    userId: currentUser.id,
    isAdmin: isAdmin
  });

  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');
  const [depositDate, setDepositDate] = useState<Date>(new Date());
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDescription, setWithdrawDescription] = useState('');
  const [withdrawDate, setWithdrawDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;
    setIsSubmitting(true);
    const success = await depositToSavings(amount, depositDescription, currentUser.username, depositDate);
    setIsSubmitting(false);
    if (success) {
      setDepositDialogOpen(false);
      setDepositAmount('');
      setDepositDescription('');
      setDepositDate(new Date());
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return;
    setIsSubmitting(true);
    const success = await withdrawFromSavings(amount, withdrawDescription, currentUser.username, withdrawDate);
    setIsSubmitting(false);
    if (success) {
      setWithdrawDialogOpen(false);
      setWithdrawAmount('');
      setWithdrawDescription('');
      setWithdrawDate(new Date());
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 glass-card">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 shadow-2xl">
          <PiggyBank className="w-8 h-8 text-indigo-400 animate-pulse" />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Syncing Savings Ledger...</p>
      </div>
    );
  }

  const currentBalance = savingsBalance?.current_balance || 0;

  const handleBalanceVisibilityToggle = () => {
    if (balanceVisible) setBalanceVisible(false);
    else setPasswordDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* ═══ Premium Header Hero ═══ */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900/90 via-indigo-950/60 to-slate-900/90 border border-white/[0.08] shadow-2xl shadow-indigo-500/10">
        {/* Ambient glow layers */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-[120px] -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/10 rounded-full blur-[100px] -ml-20 -mb-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/[0.04] rounded-full blur-[140px]" />

        <div className="relative z-10 p-6 md:p-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            {/* Left: Title area */}
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/20">
                <PiggyBank className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none">
                  Savings Vault
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-1.5 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Regulated Capital Reserve
                </p>
              </div>
            </div>

            {/* Right: Balance card */}
            <div className="w-full md:w-auto">
              <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl p-5 md:p-6 shadow-xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Liquid Assets</span>
                    <button
                      onClick={handleBalanceVisibilityToggle}
                      className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
                    >
                      {balanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-indigo-400/70 uppercase tracking-wide">ZMW</span>
                    <div className="text-4xl md:text-5xl font-extrabold text-white tracking-tight tabular-nums">
                      {balanceVisible ? <AnimatedNumber value={currentBalance} /> : '••••••'}
                    </div>
                  </div>
                  {savingsBalance && balanceVisible && (
                    <p className="text-[10px] text-slate-500 font-medium mt-3 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      Synced {format(new Date(savingsBalance.last_updated), 'MMM d, HH:mm:ss')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Action Cards ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 animate-in slide-in-from-bottom-4 duration-700 delay-100">
        {/* Deposit Card */}
        <button
          onClick={() => setDepositDialogOpen(true)}
          className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 md:p-8 text-left transition-all duration-300 hover:bg-white/[0.06] hover:border-green-500/20 hover:shadow-lg hover:shadow-green-500/5 active:scale-[0.98]"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-green-500/8 rounded-full blur-3xl -mr-14 -mt-14 group-hover:bg-green-500/15 transition-all duration-500" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/15 mb-5 group-hover:bg-green-500 group-hover:border-green-400 transition-all duration-300 shadow-sm">
              <TrendingUp className="w-6 h-6 text-green-400 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight mb-1.5">Fund Deposit</h3>
            <p className="text-[12px] text-slate-500 font-medium leading-relaxed">Transfer liquid capital into the savings reserve.</p>
            <div className="mt-5 flex items-center gap-1.5 text-[11px] font-semibold text-green-400/80 group-hover:text-green-400 transition-colors">
              Initiate <Zap className="w-3 h-3" />
            </div>
          </div>
        </button>

        {/* Withdraw Card */}
        <button
          onClick={() => setWithdrawDialogOpen(true)}
          disabled={currentBalance <= 0}
          className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 md:p-8 text-left transition-all duration-300 hover:bg-white/[0.06] hover:border-red-500/20 hover:shadow-lg hover:shadow-red-500/5 active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-white/[0.03] disabled:hover:border-white/[0.06] disabled:hover:shadow-none disabled:cursor-not-allowed disabled:active:scale-100"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-red-500/8 rounded-full blur-3xl -mr-14 -mt-14 group-hover:bg-red-500/15 transition-all duration-500" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/15 mb-5 group-hover:bg-red-500 group-hover:border-red-400 transition-all duration-300 shadow-sm">
              <TrendingDown className="w-6 h-6 text-red-400 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight mb-1.5">Capital Recall</h3>
            <p className="text-[12px] text-slate-500 font-medium leading-relaxed">Withdraw provisioned assets back to operational accounts.</p>
            <div className="mt-5 flex items-center gap-1.5 text-[11px] font-semibold text-red-400/80 group-hover:text-red-400 transition-colors">
              Execute <Zap className="w-3 h-3" />
            </div>
          </div>
        </button>
      </div>

      {/* ═══ Transaction Ledger ═══ */}
      <div className="overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        {/* Ledger Header */}
        <div className="p-5 md:p-6 border-b border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Transaction Ledger</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Complete audit trail of all movements</p>
          </div>
          <div className="flex items-center gap-3">
            {transactions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportSavingsTransactionsToPDF(transactions, currentBalance, currentUser.username)}
                className="h-9 px-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white text-[11px] font-medium border border-white/[0.06] transition-all duration-200"
              >
                <Download className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                Export PDF
              </Button>
            )}
            <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 px-2.5 py-1 rounded-lg text-[10px] font-semibold">
              {transactions.length} {transactions.length === 1 ? 'ENTRY' : 'ENTRIES'}
            </Badge>
          </div>
        </div>

        {/* Transaction List */}
        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
          {transactions.length === 0 ? (
            <div className="p-16 md:p-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-5">
                <Activity className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">No transactions recorded yet</p>
              <p className="text-[10px] text-slate-600 mt-1">Deposits and withdrawals will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {transactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className="px-5 md:px-6 py-4 md:py-5 hover:bg-white/[0.02] transition-colors duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-105",
                      transaction.action_type === 'deposit'
                        ? 'bg-green-500/10 border-green-500/15 text-green-400'
                        : 'bg-red-500/10 border-red-500/15 text-red-400'
                    )}>
                      {transaction.action_type === 'deposit'
                        ? <ArrowDownLeft className="w-5 h-5" />
                        : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-white text-[15px] tracking-tight leading-none">
                          {transaction.action_type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                        </span>
                        {index === 0 && (
                          <Badge className="bg-indigo-500/15 text-indigo-300 text-[9px] font-semibold px-1.5 py-0.5 rounded-md">
                            LATEST
                          </Badge>
                        )}
                      </div>
                      <p className="text-[12px] text-slate-500 font-medium mt-1 truncate max-w-[280px]">
                        {transaction.description || 'System provisioned'}
                      </p>
                      <div className="flex items-center gap-2.5 mt-2">
                        <span className="text-[10px] text-slate-600 font-medium">
                          {transaction.initiating_user}
                        </span>
                        <span className="w-0.5 h-0.5 rounded-full bg-slate-700" />
                        <span className="text-[10px] text-slate-600 font-medium flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {format(new Date(transaction.date), 'MMM d, yyyy')}
                        </span>
                        <span className="w-0.5 h-0.5 rounded-full bg-slate-700" />
                        <span className="text-[10px] text-slate-600 font-medium flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {transaction.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end pl-15 md:pl-0">
                    <div className={cn(
                      "text-xl font-bold tabular-nums tracking-tight",
                      transaction.action_type === 'deposit' ? 'text-green-400' : 'text-red-400'
                    )}>
                      {transaction.action_type === 'deposit' ? '+' : '-'} {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-[9px] text-slate-600 font-medium mt-1">
                      #{transaction.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Deposit Dialog ═══ */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent className="glass-card-no-blur border-white/[0.08] bg-[#0c1222]/95 backdrop-blur-3xl shadow-2xl max-w-lg p-0 flex flex-col max-h-[85vh] rounded-3xl">
          <div className="p-6 md:p-8 border-b border-white/[0.05] bg-green-500/[0.03] shrink-0 rounded-t-3xl">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/15 mb-5 mx-auto">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <DialogTitle className="text-2xl font-extrabold text-white text-center tracking-tight leading-none">Fund Deposit</DialogTitle>
            <p className="text-center text-[11px] text-slate-500 font-medium mt-2">Transfer liquid assets to the savings reserve</p>
          </div>
          <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="space-y-2.5">
              <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5">Amount (ZMW)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="glass-input h-12 text-lg font-bold rounded-xl"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="w-full glass-input h-12 justify-start text-left font-semibold text-[12px] rounded-xl">
                    <CalendarIcon className="mr-2.5 h-4 w-4 text-green-500" />
                    {depositDate ? format(depositDate, "PPP") : "Select Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-white/10 bg-[#0c1222]" align="center">
                  <CalendarComponent mode="single" selected={depositDate} onSelect={(d) => d && setDepositDate(d)} className="bg-transparent" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2.5">
              <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5">Note</Label>
              <Textarea
                placeholder="Purpose of this deposit..."
                value={depositDescription}
                onChange={(e) => setDepositDescription(e.target.value)}
                className="glass-input min-h-[88px] resize-none text-[12px] font-medium rounded-xl"
              />
            </div>
          </div>
          <div className="p-6 md:p-8 pt-0 flex gap-3 shrink-0">
            <Button variant="ghost" onClick={() => setDepositDialogOpen(false)} className="flex-1 h-12 rounded-xl text-[12px] font-semibold text-slate-500 hover:text-slate-300">
              Cancel
            </Button>
            <Button onClick={handleDeposit} disabled={!depositAmount || parseFloat(depositAmount) <= 0 || isSubmitting} className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-[12px] font-semibold shadow-lg shadow-green-500/20 active:scale-95 transition-all duration-200 border border-green-500/20">
              {isSubmitting ? 'Processing...' : 'Confirm Deposit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Withdraw Dialog ═══ */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="glass-card-no-blur border-white/[0.08] bg-[#0c1222]/95 backdrop-blur-3xl shadow-2xl max-w-lg p-0 flex flex-col max-h-[85vh] rounded-3xl">
          <div className="p-6 md:p-8 border-b border-white/[0.05] bg-red-500/[0.03] shrink-0 rounded-t-3xl">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/15 mb-5 mx-auto">
              <TrendingDown className="w-6 h-6 text-red-400" />
            </div>
            <DialogTitle className="text-2xl font-extrabold text-white text-center tracking-tight leading-none">Capital Recall</DialogTitle>
            <p className="text-center text-[11px] text-slate-500 font-medium mt-2">Reclaim assets from the savings reserve</p>
          </div>
          <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="text-center py-3 px-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <span className="text-[11px] text-slate-400 font-medium">Available Balance</span>
              <p className="text-lg font-bold text-white mt-0.5 tabular-nums">{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} ZMW</p>
            </div>
            <div className="space-y-2.5">
              <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5">Amount (ZMW)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="glass-input h-12 text-lg font-bold rounded-xl border-red-500/15"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="w-full glass-input h-12 justify-start text-left font-semibold text-[12px] rounded-xl">
                    <CalendarIcon className="mr-2.5 h-4 w-4 text-red-500" />
                    {withdrawDate ? format(withdrawDate, "PPP") : "Select Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-white/10 bg-[#0c1222]" align="center">
                  <CalendarComponent mode="single" selected={withdrawDate} onSelect={(d) => d && setWithdrawDate(d)} className="bg-transparent" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2.5">
              <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5">Reason</Label>
              <Textarea
                placeholder="Reason for this withdrawal..."
                value={withdrawDescription}
                onChange={(e) => setWithdrawDescription(e.target.value)}
                className="glass-input min-h-[88px] resize-none text-[12px] font-medium rounded-xl"
              />
            </div>
          </div>
          <div className="p-6 md:p-8 pt-0 flex gap-3 shrink-0">
            <Button variant="ghost" onClick={() => setWithdrawDialogOpen(false)} className="flex-1 h-12 rounded-xl text-[12px] font-semibold text-slate-500 hover:text-slate-300">
              Cancel
            </Button>
            <Button onClick={handleWithdraw} disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > currentBalance || isSubmitting} className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-[12px] font-semibold shadow-lg shadow-red-500/20 active:scale-95 transition-all duration-200 border border-red-500/20">
              {isSubmitting ? 'Processing...' : 'Confirm Withdrawal'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PasswordProtectionDialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        onConfirm={() => setBalanceVisible(true)}
        title="Tier-1 Identity Verification"
        description="Verify administrative credentials to reveal sensitive reserve balances."
        currentUser={currentUser}
      />
    </div>
  );
};
