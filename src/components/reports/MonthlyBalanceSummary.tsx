/**
 * Monthly Balance Summary Component
 * Shows total balance from each month in a consolidated box
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';
import { cn } from '@/lib/utils';
import { isRefundCategory } from '@/utils/refundUtils';

interface MonthlyData {
  month: string;
  year: number;
  monthIndex: number;
  totalCashIn: number;
  totalCashOut: number;
  netBalance: number;
  transactionCount: number;
  totalReserveWithdrawals?: number;
}

interface MonthlyBalanceSummaryProps {
  balancesVisible?: boolean;
}

export function MonthlyBalanceSummary({ balancesVisible = true }: MonthlyBalanceSummaryProps) {
  const { transactions } = useTransactions();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate monthly breakdown from transactions
  useEffect(() => {
    if (!transactions || transactions.length === 0) {
      setMonthlyData([]);
      return;
    }

    // Group transactions by year-month
    const monthlyMap = new Map<string, MonthlyData>();

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const year = date.getFullYear();
      const monthIndex = date.getMonth();
      const key = `${year}-${monthIndex}`;

      const existing = monthlyMap.get(key) || {
        month: monthNames[monthIndex],
        year,
        monthIndex,
        totalCashIn: 0,
        totalCashOut: 0,
        netBalance: 0,
        transactionCount: 0,
        totalReserveWithdrawals: 0
      };

      if (transaction.type === 'cash-in') {
        // Refund-category cash-ins reduce inflow instead of adding to it
        if (isRefundCategory(transaction.category_name)) {
          existing.totalCashIn -= Number(transaction.amount) || 0;
        } else {
          existing.totalCashIn += Number(transaction.amount) || 0;
        }
      } else if (transaction.type === 'cash-out') {
        const amt = Math.abs(Number(transaction.amount) || 0);
        existing.totalCashOut += amt;
        if (transaction.category_name === 'Reserve Investment Withdrawal') {
          existing.totalReserveWithdrawals = (existing.totalReserveWithdrawals || 0) + amt;
        }
      }
      existing.transactionCount += 1;
      existing.netBalance = existing.totalCashIn - (existing.totalCashOut - (existing.totalReserveWithdrawals || 0));

      monthlyMap.set(key, existing);
    });

    // Convert to array and sort by date (newest first)
    const sorted = Array.from(monthlyMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.monthIndex - a.monthIndex;
    });

    setMonthlyData(sorted);
  }, [transactions]);

  const totals = useMemo(() => {
    return monthlyData.reduce((acc, month) => ({
      totalCashIn: acc.totalCashIn + month.totalCashIn,
      totalCashOut: acc.totalCashOut + month.totalCashOut,
      netBalance: acc.netBalance + month.netBalance,
      transactionCount: acc.transactionCount + month.transactionCount
    }), { totalCashIn: 0, totalCashOut: 0, netBalance: 0, transactionCount: 0 });
  }, [monthlyData]);

  const formatCurrency = (amount: number) => {
    if (!balancesVisible) return '••••••';
    return `ZMW ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (monthlyData.length === 0) {
    return (
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-blue-400" />
            Monthly Balance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50 text-slate-500" />
            <p>No transaction data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <div className="p-2 bg-gradient-to-r from-blue-600/50 to-purple-600/50 rounded-lg border border-white/10">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          Monthly Balance Summary
          <Badge variant="secondary" className="ml-auto glass-badge text-slate-300">
            {monthlyData.length} months
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Total Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-900/50 rounded-xl border border-white/10">
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Total Cash In</p>
            <p className="text-xl font-bold text-green-400">{formatCurrency(totals.totalCashIn || 0)}</p>
          </div>
          <div className="text-center border-x border-white/10">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Total Cash Out</p>
            <p className="text-xl font-bold text-red-400">{formatCurrency(totals.totalCashOut || 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Net Balance</p>
            <p className={cn(
              "text-xl font-bold",
              totals.netBalance >= 0 ? "text-blue-400" : "text-red-400"
            )}>
              {formatCurrency(totals.netBalance || 0)}
            </p>
          </div>
        </div>

        {/* Monthly Breakdown */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {monthlyData.map((month) => (
              <div
                key={`${month.year}-${month.monthIndex}`}
                className="p-4 glass-card bg-slate-900/40 rounded-xl border border-white/5 hover:bg-slate-900/60 hover:border-white/10 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg",
                      month.netBalance >= 0
                        ? "bg-gradient-to-br from-green-500/80 to-green-700/80 border border-green-500/30"
                        : "bg-gradient-to-br from-red-500/80 to-red-700/80 border border-red-500/30"
                    )}>
                      {month.month.slice(0, 3)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{month.month} {month.year}</p>
                      <p className="text-xs text-slate-400">{month.transactionCount} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-lg font-bold",
                      month.netBalance >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {formatCurrency(month.netBalance)}
                    </p>
                  </div>
                </div>

                {/* Cash In/Out breakdown */}
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
                    <TrendingUp className="h-3 w-3 text-green-400" />
                    <span className="text-green-300">{formatCurrency(month.totalCashIn || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
                    <TrendingDown className="h-3 w-3 text-red-400" />
                    <span className="text-red-300">{formatCurrency(month.totalCashOut || 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
