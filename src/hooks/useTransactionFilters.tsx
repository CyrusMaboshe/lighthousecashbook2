
import { useState } from 'react';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { FilterOptions } from '@/pages/Index';
import { Transaction } from '@/hooks/useTransactions';

export const useTransactionFilters = (
  transactions: Transaction[],
  selectedYear: number,
  selectedMonth: number
) => {
  const [filters, setFilters] = useState<FilterOptions>({
    duration: 'all',
    type: 'all'
  });

  const getFilteredTransactions = () => {
    // If "All Time" is requested (year 0) or no specific filters, return all transactions
    let filtered = transactions;

    // Only apply month/year filtering if we have specific values
    if (selectedYear > 0) {
      filtered = transactions.filter(transaction => {
        const transactionDate = parseISO(transaction.date);
        const matches = transactionDate.getFullYear() === selectedYear &&
                       transactionDate.getMonth() === selectedMonth;
        return matches;
      });
    }

    // Apply duration filter
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);

    switch (filters.duration) {
      case 'today':
        filtered = filtered.filter(t => 
          format(parseISO(t.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
        );
        break;
      case 'yesterday':
        filtered = filtered.filter(t => 
          format(parseISO(t.date), 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')
        );
        break;
      case 'this-week':
        filtered = filtered.filter(t => {
          const transactionDate = parseISO(t.date);
          return isWithinInterval(transactionDate, { start: weekStart, end: weekEnd });
        });
        break;
      case 'custom':
        if (filters.customStartDate && filters.customEndDate) {
          filtered = filtered.filter(t => {
            const transactionDate = parseISO(t.date);
            const startDate = parseISO(filters.customStartDate!);
            const endDate = parseISO(filters.customEndDate!);
            return isWithinInterval(transactionDate, { start: startDate, end: endDate });
          });
        }
        break;
    }

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Apply categories filter
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(t => filters.categories!.includes(t.category_name));
    }

    // Apply search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        (t.customer_name && t.customer_name.toLowerCase().includes(q)) ||
        (t.category_name && t.category_name.toLowerCase().includes(q)) ||
        (t.details && t.details.toLowerCase().includes(q))
      );
    }

    console.log('✅ Final filtered transactions:', {
      count: filtered.length,
      firstFew: filtered.slice(0, 3).map(t => ({ date: t.date, type: t.type, amount: t.amount }))
    });

    return filtered;
  };

  return {
    filters,
    setFilters,
    getFilteredTransactions
  };
};
