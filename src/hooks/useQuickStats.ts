
import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { isRefundCategory } from '@/utils/refundUtils';

export interface QuickStats {
  totalTransactions: number;
  totalCashIn: number;
  totalCashOut: number;
  netBalance: number;
  avgTransactionValue: number;
  topCategories: Array<{
    name: string;
    amount: number;
    count: number;
  }>;
}

export function useQuickStats(selectedMonth: number, selectedYear: number) {
  const { transactions, loading } = useTransactions();

  const stats = useMemo(() => {
    if (!transactions.length) {
      return {
        totalTransactions: 0,
        totalCashIn: 0,
        totalCashOut: 0,
        netBalance: 0,
        avgTransactionValue: 0,
        topCategories: []
      };
    }

    // Filter transactions by month and year
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === selectedMonth && 
             transactionDate.getFullYear() === selectedYear;
    });

    // Refund-adjusted cash-in: refund-category cash-ins REDUCE inflow instead of adding to it
    const totalCashIn = filteredTransactions
      .filter(t => t.type === 'cash-in')
      .reduce((sum, t) => {
        const amount = Number(t.amount) || 0;
        return isRefundCategory(t.category_name) ? sum - amount : sum + amount;
      }, 0);
      
    const totalCashOut = filteredTransactions
      .filter(t => t.type === 'cash-out')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const operationalCashOut = filteredTransactions
      .filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const netBalance = totalCashIn - operationalCashOut;
    
    const avgTransactionValue = filteredTransactions.length > 0 
      ? (totalCashIn + totalCashOut) / filteredTransactions.length 
      : 0;

    // Calculate top categories
    const categoryMap = new Map<string, { amount: number; count: number }>();
    
    filteredTransactions.forEach(t => {
      const category = t.category_name || 'Uncategorized';
      const amount = Number(t.amount);
      
      if (categoryMap.has(category)) {
        const existing = categoryMap.get(category)!;
        categoryMap.set(category, {
          amount: existing.amount + amount,
          count: existing.count + 1
        });
      } else {
        categoryMap.set(category, { amount, count: 1 });
      }
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalTransactions: filteredTransactions.length,
      totalCashIn,
      totalCashOut,
      netBalance,
      avgTransactionValue,
      topCategories
    };
  }, [transactions, selectedMonth, selectedYear]);

  return {
    stats,
    loading
  };
}
