
import React, { useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import {
    Home,
    Calendar,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    TrendingUp,
    Wallet,
    Info,
    Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { GlassTransactionList } from '@/components/glass-ui/GlassTransactionList';
import { useAuth } from '@/hooks/useAuth';

const RENT_TARGET = 550;

export function RentReservedView() {
    const { transactions, loading } = useTransactions();
    const { currentUser } = useAuth();

    // Calculate rent accumulation
    // Goal: Track all "Rent Reserved" transactions.
    // If user withdraws (cash-out) and labels as Rent Reserved, it counts as accumulation.
    const rentData = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const rentTx = transactions.filter(t => {
            const isRentCategory = t.category_name === 'Rent Reserved' || t.category_name === 'Rent Paid';
            if (!isRentCategory) return false;

            const txDate = new Date(t.date);
            return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        });

        // Accumulated Rent = Sum of absolute values of "Rent Reserved" transactions
        // (Since withdrawing from main cash to rent bucket is a 'cash-out' in transactions)
        const accumulated = rentTx
            .filter(t => t.category_name === 'Rent Reserved')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // Paid Rent = Sum of absolute values of "Rent Paid" transactions
        const paid = rentTx
            .filter(t => t.category_name === 'Rent Paid')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const progressPercent = Math.min((accumulated / RENT_TARGET) * 100, 100);
        const isPaid = accumulated >= RENT_TARGET;

        // Sort rent history for display
        const history = [...rentTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
            accumulated,
            paid,
            remaining: Math.max(RENT_TARGET - accumulated, 0),
            progressPercent,
            isPaid,
            history
        };
    }, [transactions]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 glass-card">
                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 shadow-2xl">
                    <Home className="w-8 h-8 text-blue-400 animate-pulse" />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">
                    Calculating Rent Data...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header section */}
            <div className="glass-card p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-blue-600 to-indigo-700 p-4 border border-white/20 shadow-2xl shadow-blue-500/40">
                                <Home className="w-full h-full text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">
                                    Rent Reserved
                                </h1>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-2 flex items-center gap-2">
                                    <Receipt className="w-3.5 h-3.5 text-blue-500" />
                                    Property & Studio Rental
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {rentData.isPaid ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-green-500/20 backdrop-blur-md">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Rent Paid
                                </Badge>

                            ) : (
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 backdrop-blur-md">
                                    <Clock className="w-4 h-4 mr-2 animate-pulse" />
                                    Rent in Progress
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                        {/* Current Accumulated */}
                        <div className="glass-card p-6 bg-white/[0.02] border-white/5 group hover:bg-white/[0.04] transition-all duration-500">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">
                                Currently Accumulated
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-black text-blue-500/60 italic tracking-tighter uppercase">ZMW</span>
                                <div className="text-5xl font-black text-white tracking-tighter tabular-nums">
                                    <AnimatedNumber amount={rentData.accumulated} />
                                </div>
                            </div>

                            <div className="mt-6 space-y-2">
                                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <span>Goal Progress</span>
                                    <span>{Math.round(rentData.progressPercent)}%</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.5)]",
                                            rentData.isPaid ? "bg-green-500" : "bg-blue-500"
                                        )}

                                        style={{ width: `${rentData.progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Target Display */}
                        <div className="glass-card p-6 bg-white/[0.02] border-white/5 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                                    Monthly Target
                                </p>
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-blue-400" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-black text-blue-500/40 italic tracking-tighter uppercase">ZMW</span>
                                    <span className="text-4xl font-black text-white tracking-tighter">550.00</span>
                                </div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2 italic">
                                    Standard monthly obligation
                                </p>
                            </div>
                        </div>

                        {/* Status Card */}
                        <div className={cn(
                            "glass-card p-6 border-white/5 flex flex-col justify-between overflow-hidden relative",
                            rentData.isPaid ? "bg-green-500/10 border-green-500/20" : "bg-amber-500/10 border-amber-500/20"
                        )}>

                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <Info className="w-16 h-16" />
                            </div>

                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">
                                Analysis
                            </p>
                            <div>
                                <p className="text-lg font-black text-white tracking-tight">
                                    {rentData.isPaid
                                        ? "Sufficient Funds Accumulated"
                                        : `ZMW ${rentData.remaining.toFixed(2)} Remaining`}
                                </p>
                                <p className={cn(
                                    "text-[9px] font-bold uppercase tracking-widest mt-2",
                                    rentData.isPaid ? "text-green-400" : "text-amber-400"
                                )}>

                                    {rentData.isPaid
                                        ? "Target achieved — Rent can be disbursed."
                                        : "Continue reserving funds daily."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-black text-white tracking-tighter flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        Rent History
                    </h3>
                    <Badge className="bg-white/5 text-slate-400 border-white/10 px-3 py-1 font-black text-[9px] uppercase tracking-widest">
                        {rentData.history.length} Transactions
                    </Badge>
                </div>

                <div className="glass-card overflow-hidden">
                    <div className="p-2">
                        <GlassTransactionList
                            transactions={rentData.history as any}
                            onTransactionClick={() => { }} // Read-only view
                            showViewAll={false}
                            maxItems={50}
                        />
                    </div>

                    {rentData.history.length === 0 && (
                        <div className="p-12 text-center">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                No rent transactions found
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

