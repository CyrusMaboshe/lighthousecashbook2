import React, { useMemo, useState, useEffect } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { Card, CardContent } from '@/components/ui/card';
import { Users, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import { CountUp } from '@/components/ui/CountUp';
import { cn } from '@/lib/utils';
import { format, parseISO, isBefore, isSameMonth, addMonths, startOfMonth, startOfYear, isAfter } from 'date-fns';

export function GlassCustomersTab() {
    const { transactions } = useTransactions();
    const [animatedTotal, setAnimatedTotal] = useState(0);

    const {
        totalCustomers,
        monthlyBreakdown,
        currentMonthCount,
        growthPercentage
    } = useMemo(() => {
        if (!transactions) return { totalCustomers: 0, monthlyBreakdown: [], currentMonthCount: 0, growthPercentage: 0 };

        // Get all valid customers
        const validTransactions = transactions.filter(t =>
            t.customer_name && t.customer_name.trim().length > 0 &&
            (t.type === 'cash-in' || t.type === 'cash-out' || !t.type)
        );

        // Get unique customers (by lowercase name to avoid case duplicates)
        // We want to count when a customer FIRST appeared to plot them accurately across months
        const firstAppearanceMap = new Map<string, string>();
        validTransactions.forEach(t => {
            const name = (t.customer_name || '').trim().toLowerCase();
            if (!name) return;

            const dateStr = t.date;
            if (!firstAppearanceMap.has(name) || new Date(dateStr) < new Date(firstAppearanceMap.get(name)!)) {
                firstAppearanceMap.set(name, dateStr);
            }
        });

        const uniqueCustomersTotal = firstAppearanceMap.size;

        // Monthly breakdown from inception to end of current year
        if (uniqueCustomersTotal === 0) return { totalCustomers: 0, monthlyBreakdown: [], currentMonthCount: 0, growthPercentage: 0 };

        let earliestDate = new Date();
        firstAppearanceMap.forEach(dateStr => {
            const d = new Date(dateStr);
            if (d < earliestDate) earliestDate = d;
        });

        const breakdownMap = new Map<string, number>();
        firstAppearanceMap.forEach(dateStr => {
            const monthKey = dateStr.slice(0, 7); // YYYY-MM
            breakdownMap.set(monthKey, (breakdownMap.get(monthKey) || 0) + 1);
        });

        const now = new Date();
        const currentYearEnd = new Date(now.getFullYear(), 11, 31);
        let iter = startOfMonth(earliestDate);
        const timeline = [];

        let currentMonthNewCount = 0;
        let lastMonthNewCount = 0;
        const currentMonthKey = format(now, 'yyyy-MM');
        const lastMonthKey = format(addMonths(now, -1), 'yyyy-MM');

        while (!isAfter(iter, currentYearEnd)) {
            const mKey = format(iter, 'yyyy-MM');
            const count = breakdownMap.get(mKey) || 0;
            timeline.push({
                monthKey: mKey,
                label: format(iter, 'MMM yyyy'),
                count,
                isFuture: isAfter(iter, now) && !isSameMonth(iter, now)
            });

            if (mKey === currentMonthKey) currentMonthNewCount = count;
            if (mKey === lastMonthKey) lastMonthNewCount = count;

            iter = addMonths(iter, 1);
        }

        let growth = 0;
        if (lastMonthNewCount > 0) {
            growth = Math.round(((currentMonthNewCount - lastMonthNewCount) / lastMonthNewCount) * 100);
        } else if (currentMonthNewCount > 0) {
            growth = 100;
        }

        return {
            totalCustomers: uniqueCustomersTotal,
            monthlyBreakdown: timeline,
            currentMonthCount: currentMonthNewCount,
            growthPercentage: growth
        };
    }, [transactions]);

    useEffect(() => {
        // Trigger the animation for the total count whenever it changes
        setAnimatedTotal(totalCustomers);
    }, [totalCustomers]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-2">
            {/* Metric Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="glass-card border-white/10 bg-white/[0.03] overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <CardContent className="p-6 relative z-10 flex items-center justify-between">
                        <div className="space-y-1 mt-6">
                            <p className="text-sm font-medium text-blue-200/70 tracking-tight uppercase">Total Global Customers</p>
                            <div className="text-4xl font-bold text-white tracking-tighter flex items-center gap-2">
                                <CountUp end={animatedTotal} duration={2} />
                            </div>
                            <p className="text-xs text-slate-400 mt-2 pt-1 border-t border-white/5">Historical unique accounts</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:scale-105 transition-transform duration-500">
                            <Users className="w-8 h-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-white/10 bg-white/[0.03] overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <CardContent className="p-6 relative z-10 flex items-center justify-between">
                        <div className="space-y-1 mt-6">
                            <p className="text-sm font-medium text-emerald-200/70 tracking-tight uppercase">New This Month</p>
                            <div className="text-4xl font-bold text-white tracking-tighter flex items-baseline gap-2">
                                <CountUp end={currentMonthCount} duration={1.5} />
                                <span className={cn(
                                    "text-sm font-medium flex items-center ml-2",
                                    growthPercentage >= 0 ? "text-emerald-400" : "text-red-400"
                                )}>
                                    {growthPercentage >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingUp className="w-4 h-4 mr-1 rotate-180" />}
                                    {Math.abs(growthPercentage)}%
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 pt-1 border-t border-white/5">Versus last month</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] group-hover:scale-105 transition-transform duration-500">
                            <ArrowUpRight className="w-8 h-8 text-emerald-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Timeline */}
            <Card className="glass-card border-white/10 bg-white/[0.02]">
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
                        <Calendar className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-lg font-bold text-white tracking-tight">Monthly Acquisition Timeline</h3>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {monthlyBreakdown.map((item, index) => (
                            <div
                                key={item.monthKey}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-xl border transition-all duration-300",
                                    item.isFuture
                                        ? "bg-white/[0.01] border-white/5 opacity-50"
                                        : item.monthKey === format(new Date(), 'yyyy-MM')
                                            ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.05)] text-white"
                                            : "bg-white/[0.03] border-white/10 hover:bg-white/[0.05]"
                                )}
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        item.isFuture ? "bg-slate-600" : item.count > 0 ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-slate-500"
                                    )}></div>
                                    <span className={cn(
                                        "font-medium",
                                        item.isFuture ? "text-slate-500" : "text-slate-200"
                                    )}>{item.label}</span>
                                    {item.monthKey === format(new Date(), 'yyyy-MM') && (
                                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border border-blue-500/30">Current</span>
                                    )}
                                </div>
                                <div className={cn(
                                    "font-bold text-lg tabular-nums",
                                    item.isFuture ? "text-slate-600" : item.count > 0 ? "text-white" : "text-slate-500"
                                )}>
                                    {item.isFuture ? '0' : <CountUp end={item.count} duration={1} />}
                                </div>
                            </div>
                        ))}

                        {monthlyBreakdown.length === 0 && (
                            <div className="text-center py-8 text-slate-400 space-y-2">
                                <Users className="w-12 h-12 mx-auto opacity-20" />
                                <p>No customer data available yet.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
