import { useState } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LifeBuoy, TrendingUp, TrendingDown, History, Shield, Eye, EyeOff, CalendarIcon, Sparkles, Clock, Calendar, Download, Trash2, ShieldCheck, ArrowUpRight, ArrowDownLeft, Landmark } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useEmergencyFund } from '@/hooks/useEmergencyFund';
import { format } from 'date-fns';
import { PasswordProtectionDialog } from '@/components/PasswordProtectionDialog';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

export function EmergencyFundManagement() {
    const isMobile = useIsMobile();
    const {
        balance,
        transactions,
        loading,
        depositToEmergencyFund,
        withdrawFromEmergencyFund,
        withdrawCashFromEmergencyFund,
        deleteEmergencyTransaction,
        refetch
    } = useEmergencyFund();

    const { currentUser } = useAuth();
    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [directWithdrawAmount, setDirectWithdrawAmount] = useState('');
    const [depositNote, setDepositNote] = useState('');
    const [withdrawNote, setWithdrawNote] = useState('');
    const [directWithdrawNote, setDirectWithdrawNote] = useState('');
    const [depositDate, setDepositDate] = useState<Date>(new Date());
    const [withdrawDate, setWithdrawDate] = useState<Date>(new Date());
    const [directWithdrawDate, setDirectWithdrawDate] = useState<Date>(new Date());
    const [isProcessing, setIsProcessing] = useState(false);
    const [balanceVisible, setBalanceVisible] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isAdmin = currentUser?.role === 'admin';

    const handleDeposit = async () => {
        const amount = parseFloat(depositAmount);
        if (!amount || amount <= 0) return;

        setIsProcessing(true);
        const success = await depositToEmergencyFund(amount, depositNote || undefined, depositDate);
        if (success) {
            setDepositAmount('');
            setDepositNote('');
            setDepositDate(new Date());
            setTimeout(() => refetch(), 500);
        }
        setIsProcessing(false);
    };

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount);
        if (!amount || amount <= 0) return;

        setIsProcessing(true);
        const success = await withdrawFromEmergencyFund(amount, withdrawNote || undefined, withdrawDate);
        if (success) {
            setWithdrawAmount('');
            setWithdrawNote('');
            setWithdrawDate(new Date());
            setTimeout(() => refetch(), 500);
        }
        setIsProcessing(false);
    };

    const handleDirectWithdraw = async () => {
        const amount = parseFloat(directWithdrawAmount);
        if (!amount || amount <= 0) return;

        setIsProcessing(true);
        const success = await withdrawCashFromEmergencyFund(amount, directWithdrawNote || undefined, directWithdrawDate);
        if (success) {
            setDirectWithdrawAmount('');
            setDirectWithdrawNote('');
            setDirectWithdrawDate(new Date());
            setTimeout(() => refetch(), 500);
        }
        setIsProcessing(false);
    };

    const handleDeleteClick = (transaction: any) => {
        setTransactionToDelete(transaction);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!transactionToDelete) return;

        setIsDeleting(true);
        const success = await deleteEmergencyTransaction(transactionToDelete.id);
        if (success) {
            setDeleteConfirmOpen(false);
            setTransactionToDelete(null);
        }
        setIsDeleting(false);
    };

    const handleExportPDF = async () => {
        const { exportEmergencyFundToPDF } = await import('@/utils/emergencyFundPdfExport');
        const fundTransactions = transactions.map(t => ({
            id: t.id,
            action_type: t.action_type as any,
            amount: t.amount,
            note: t.note,
            initiating_user: t.initiating_user,
            created_at: t.created_at
        }));
        await exportEmergencyFundToPDF(fundTransactions, currentBalance, currentUser?.username || 'Admin');
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
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-2xl">
                    <LifeBuoy className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Synchronizing Reserve Data...</p>
            </div>
        );
    }

    const currentBalance = balance?.current_balance || 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            {/* Header & Hero Stats */}
            <div className="glass-card overflow-hidden p-8 md:p-12 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-emerald-500 to-teal-600 p-4 border border-white/20 shadow-2xl shadow-emerald-500/40">
                                <LifeBuoy className="w-full h-full text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">Emergency Reserve</h1>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-2 flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                    Tier-1 Strategic Liquidity
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Secured Fund
                            </div>
                            <Button
                                onClick={handleExportPDF}
                                className="h-7 px-3 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[9px] font-black uppercase tracking-widest"
                            >
                                <Download className="w-3 h-3 mr-1.5" />
                                Audit Report
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 self-stretch md:self-auto">
                        <div className="glass-card bg-white/[0.03] border-white/10 p-6 flex flex-col items-end min-w-[240px] shadow-2xl">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Current Fund Valuation</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-emerald-500/50 italic tracking-tighter uppercase mr-1">ZMW</span>
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
                                className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400 hover:text-emerald-300 transition-colors tracking-widest"
                            >
                                {balanceVisible ? <><EyeOff className="w-3 h-3" /> Hide Sensitive Data</> : <><Eye className="w-3 h-3" /> Decrypt Reserve Totals</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Tabs defaultValue="deposit" className="w-full">
                        <TabsList className="grid grid-cols-4 glass-card p-1.5 h-auto mb-6 bg-white/[0.02]">
                            <TabsTrigger value="deposit" className="glass-tabs-trigger h-12 data-[state=active]:bg-green-500 data-[state=active]:text-white">
                                Inflow
                            </TabsTrigger>
                            <TabsTrigger value="withdraw" className="glass-tabs-trigger h-12 data-[state=active]:bg-teal-500 data-[state=active]:text-white">
                                Return
                            </TabsTrigger>
                            <TabsTrigger value="direct" className="glass-tabs-trigger h-12 data-[state=active]:bg-red-500 data-[state=active]:text-white">
                                Direct
                            </TabsTrigger>
                            <TabsTrigger value="history" className="glass-tabs-trigger h-12 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
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
                                        <h3 className="text-xl font-black text-white tracking-tight">Reserve Provisioning</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Authorize fund liquidity increase</p>
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
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Protocol Memo</Label>
                                            <Input
                                                value={depositNote}
                                                onChange={(e) => setDepositNote(e.target.value)}
                                                placeholder="Allocation details"
                                                className="glass-input h-14"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Effectuation Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button className="glass-input h-14 w-full justify-start text-white bg-transparent hover:bg-white/5 border-white/10">
                                                    <CalendarIcon className="mr-3 h-5 w-5 text-emerald-400" />
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
                                        className="w-full glass-btn-primary h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] bg-emerald-600 shadow-lg shadow-emerald-500/20"
                                    >
                                        {isProcessing ? 'Authorizing...' : 'Authorize Inflow Protocol'}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="withdraw">
                            <div className="glass-card p-8 space-y-8 animate-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                    <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                                        <ArrowUpRight className="w-6 h-6 text-teal-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight">System Re-balancing</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Return funds to main liquidity pool</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Release Volume</Label>
                                            <Input
                                                type="number"
                                                value={withdrawAmount}
                                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="glass-input h-14 text-xl font-black"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Re-balancing Memo</Label>
                                            <Input
                                                value={withdrawNote}
                                                onChange={(e) => setWithdrawNote(e.target.value)}
                                                placeholder="Allocation target"
                                                className="glass-input h-14"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Effectuation Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button className="glass-input h-14 w-full justify-start text-white bg-transparent hover:bg-white/5 border-white/10">
                                                    <CalendarIcon className="mr-3 h-5 w-5 text-teal-400" />
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
                                        className="w-full glass-btn-primary h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] bg-teal-600 shadow-lg shadow-teal-500/20"
                                    >
                                        {isProcessing ? 'Processing...' : 'Execute Re-balancing'}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="direct">
                            <div className="glass-card p-8 space-y-8 animate-in zoom-in-95 duration-500">
                                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                        <TrendingDown className="w-6 h-6 text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight">Direct Emergency Release</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Immediate cash withdrawal for requirements</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Strategic Release Volume</Label>
                                            <Input
                                                type="number"
                                                value={directWithdrawAmount}
                                                onChange={(e) => setDirectWithdrawAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="glass-input h-14 text-xl font-black"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Requirement Memo</Label>
                                            <Input
                                                value={directWithdrawNote}
                                                onChange={(e) => setDirectWithdrawNote(e.target.value)}
                                                placeholder="Reason for release"
                                                className="glass-input h-14"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Effectuation Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button className="glass-input h-14 w-full justify-start text-white bg-transparent hover:bg-white/5 border-white/10">
                                                    <CalendarIcon className="mr-3 h-5 w-5 text-red-400" />
                                                    {directWithdrawDate ? format(directWithdrawDate, "PPP") : "Select Release Date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="glass-card border-white/10 p-0 overflow-hidden shadow-2xl">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={directWithdrawDate}
                                                    onSelect={(date) => date && setDirectWithdrawDate(date)}
                                                    className="bg-[#050505] text-white"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <Button
                                        onClick={handleDirectWithdraw}
                                        disabled={!directWithdrawAmount || parseFloat(directWithdrawAmount) <= 0 || parseFloat(directWithdrawAmount) > currentBalance || isProcessing}
                                        className="w-full glass-btn-primary h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] bg-red-600 shadow-lg shadow-red-500/20"
                                    >
                                        {isProcessing ? 'Processing...' : 'Authorize Emergency Release'}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="history">
                            <div className="glass-card p-0 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                                <div className="p-8 border-b border-white/5">
                                    <h3 className="text-xl font-black text-white tracking-tight">Audit History</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Immutable strategic ledger</p>
                                </div>

                                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                                    {!transactions || transactions.length === 0 ? (
                                        <div className="p-20 text-center">
                                            <ShieldCheck className="w-16 h-16 text-slate-800 mx-auto mb-4" />
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Ledger Initialized - No Records Found</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-white/5">
                                            {transactions.map((transaction) => (
                                                <div key={transaction.id} className="p-6 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-6 group">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110",
                                                            transaction.action_type === 'deposit'
                                                                ? 'bg-green-500/10 border-green-500/20 text-green-500'
                                                                : 'bg-red-500/10 border-red-500/20 text-red-500'
                                                        )}>
                                                            {transaction.action_type === 'deposit' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                                                        </div>

                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-white text-lg tracking-tight uppercase italic">{transaction.action_type === 'deposit' ? 'Inflow' : 'Release'}</span>
                                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">#{transaction.id.slice(0, 8)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-0.5">
                                                                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                                                    <CalendarIcon className="w-3 h-3 text-slate-600" /> {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                                                                </span>
                                                                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                                                    <Clock className="w-3 h-3 text-slate-600" /> {format(new Date(transaction.created_at), 'HH:mm')}
                                                                </span>
                                                            </div>
                                                            {transaction.note && <p className="text-[10px] text-slate-400 mt-1 italic max-w-xs">{transaction.note}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex items-center gap-4">
                                                        <div>
                                                            <div className={cn(
                                                                "text-2xl font-black tabular-nums tracking-tighter",
                                                                transaction.action_type === 'deposit' ? 'text-green-400' : 'text-red-500'
                                                            )}>
                                                                {transaction.action_type === 'deposit' ? '+' : '-'} {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </div>

                                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Verified by {transaction.initiating_user}</p>
                                                        </div>
                                                        {isAdmin && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeleteClick(transaction)}
                                                                className="h-10 w-10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 rounded-xl"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </Button>
                                                        )}
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
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Reserve Protocols</h4>
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center group">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Authorization Status</span>
                                <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 tracking-tighter shadow-sm">Verified Agent</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ledger Integrity</span>
                                <span className="text-[10px] font-black text-teal-400 uppercase flex items-center gap-1.5 tracking-tighter">
                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
                                    Immutable
                                </span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Protocol Version</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">v.2.4.EF</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-8 bg-emerald-500/[0.03] border-emerald-500/10">
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                            The <span className="text-white font-bold tracking-tight italic uppercase">Emergency Fund</span> acts as the final buffer for liquidity. Withdrawals recorded here as <span className="text-red-400 uppercase font-black tracking-widest">Direct Release</span> are treated as permanent cash outflows from the system's reserve pool.
                        </p>
                    </div>
                </div>
            </div>

            <PasswordProtectionDialog
                open={passwordDialogOpen}
                onClose={() => setPasswordDialogOpen(false)}
                onConfirm={handlePasswordConfirm}
                title="Reserve Authorization"
                description="Verify high-frequency credentials to access fund valuation data."
                currentUser={currentUser}
            />

            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent className="glass-dialog-content max-w-md p-0 overflow-hidden">
                    <div className="p-8 border-b border-white/5 bg-red-500/5">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-6 mx-auto shadow-2xl shadow-red-500/20">
                            <Shield className="w-8 h-8 text-red-400" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-white text-center tracking-tight">Protocol Reversion</DialogTitle>
                    </div>
                    <div className="p-8 space-y-6">
                        <p className="text-center text-slate-400 text-sm font-medium leading-relaxed">
                            You are initiating a manual reversion of record <span className="text-red-400 font-bold">#{transactionToDelete?.id.slice(0, 8)}</span>. This will adjust the reserve valuation.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setDeleteConfirmOpen(false)}
                                disabled={isDeleting}
                                className="flex-1 h-14 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
                            >
                                Abort Protocol
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-[2] h-14 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                            >
                                {isDeleting ? 'Reverting...' : 'Execute Reversion'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
