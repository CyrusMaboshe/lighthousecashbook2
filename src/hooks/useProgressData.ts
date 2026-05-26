import { useMemo } from 'react';
import { parseISO, format, startOfWeek, endOfWeek, eachWeekOfInterval, eachMonthOfInterval, startOfYear, endOfYear, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Transaction } from '@/hooks/useTransactions';
import { ProcessedDataItem, ViewType } from '@/components/progress/types';
import { isRefundCategory } from '@/utils/refundUtils';

export function useProgressData(
  transactions: Transaction[],
  year: number,
  month: number,
  viewType: ViewType,
  specificDate?: Date
) {
  return useMemo(() => {
    // Handle "All Years" option (year = 0) or All Time reports
    if (year === 0) {
      if (viewType === 'monthly') {
        // Get all available years from transactions, including future years
        const availableYears = [...new Set(transactions.map(t => parseISO(t.date).getFullYear()))].sort();
        
        // Include all years from the earliest transaction year through current year
        const currentYear = new Date().getFullYear();
        const minYear = availableYears.length > 0 ? Math.min(...availableYears) : currentYear;
        const maxYear = availableYears.length > 0 ? Math.max(currentYear, ...availableYears) : currentYear;
        
        const allYears = [];
        for (let y = minYear; y <= maxYear; y++) {
          allYears.push(y);
        }
        
        // Create monthly data for all years
        const allMonthsData: ProcessedDataItem[] = [];
        
        allYears.forEach(currentYear => {
          const yearStart = startOfYear(new Date(currentYear, 0, 1));
          const yearEnd = endOfYear(new Date(currentYear, 11, 31));
          const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

          months.forEach(month => {
            const monthTransactions = transactions.filter(transaction => {
              const transactionDate = parseISO(transaction.date);
              return transactionDate.getFullYear() === currentYear &&
                     transactionDate.getMonth() === month.getMonth();
            });

            // Refund-adjusted cash-in for chart data
            const cashIn = monthTransactions
              .filter(t => t.type === 'cash-in')
              .reduce((sum, t) => {
                const amount = Number(t.amount) || 0;
                return isRefundCategory(t.category_name) ? sum - amount : sum + amount;
              }, 0);
            
            const cashOut = monthTransactions
              .filter(t => t.type === 'cash-out')
              .reduce((sum, t) => sum + t.amount, 0);

            const operationalCashOut = monthTransactions
              .filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal')
              .reduce((sum, t) => sum + t.amount, 0);

            allMonthsData.push({
              name: format(month, 'MMM yy'),
              fullName: format(month, 'MMMM yyyy'),
              cashIn,
              cashOut,
              netBalance: cashIn - operationalCashOut,
              transactions: monthTransactions.length
            });
          });
        });

        return allMonthsData;
      } else if (viewType === 'weekly') {
        // Get all available years from transactions, including future years
        const availableYears = [...new Set(transactions.map(t => parseISO(t.date).getFullYear()))].sort();
        
        // Include all years from the earliest transaction year through current year
        const currentYear = new Date().getFullYear();
        const minYear = availableYears.length > 0 ? Math.min(...availableYears) : currentYear;
        const maxYear = availableYears.length > 0 ? Math.max(currentYear, ...availableYears) : currentYear;
        
        const allYears = [];
        for (let y = minYear; y <= maxYear; y++) {
          allYears.push(y);
        }
        
        // Create weekly data for all years
        const allWeeksData: ProcessedDataItem[] = [];
        
        allYears.forEach(currentYear => {
          const yearStart = startOfYear(new Date(currentYear, 0, 1));
          const yearEnd = endOfYear(new Date(currentYear, 11, 31));
          const weeks = eachWeekOfInterval({ start: yearStart, end: yearEnd });

          weeks.forEach((week, index) => {
            const weekStart = startOfWeek(week);
            const weekEnd = endOfWeek(week);
            
            const weekTransactions = transactions.filter(transaction => {
              const transactionDate = parseISO(transaction.date);
              return transactionDate >= weekStart && transactionDate <= weekEnd;
            });

            // Refund-adjusted cash-in for weekly chart data
            const cashIn = weekTransactions
              .filter(t => t.type === 'cash-in')
              .reduce((sum, t) => {
                const amount = Number(t.amount) || 0;
                return isRefundCategory(t.category_name) ? sum - amount : sum + amount;
              }, 0);
            
            const cashOut = weekTransactions
              .filter(t => t.type === 'cash-out')
              .reduce((sum, t) => sum + t.amount, 0);

            const operationalCashOut = weekTransactions
              .filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal')
              .reduce((sum, t) => sum + t.amount, 0);

            allWeeksData.push({
              name: `${currentYear}-W${index + 1}`,
              fullName: `${currentYear} Week ${index + 1} (${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')})`,
              cashIn,
              cashOut,
              netBalance: cashIn - operationalCashOut,
              transactions: weekTransactions.length
            });
          });
        });

        return allWeeksData;
      } else {
        // For daily view with "All Years", we can't show all days, so we'll show monthly aggregated data
        return [];
      }
    }

    // Regular year-specific logic
    if (viewType === 'monthly') {
      const yearStart = startOfYear(new Date(year, 0, 1));
      const yearEnd = endOfYear(new Date(year, 11, 31));
      const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

      return months.map(month => {
        const monthTransactions = transactions.filter(transaction => {
          const transactionDate = parseISO(transaction.date);
          return transactionDate.getFullYear() === year &&
                 transactionDate.getMonth() === month.getMonth();
        });

        // Refund-adjusted cash-in for monthly chart
        const cashIn = monthTransactions
          .filter(t => t.type === 'cash-in')
          .reduce((sum, t) => {
            const amount = Number(t.amount) || 0;
            return isRefundCategory(t.category_name) ? sum - amount : sum + amount;
          }, 0);
        
        const cashOut = monthTransactions
          .filter(t => t.type === 'cash-out')
          .reduce((sum, t) => sum + t.amount, 0);

        const operationalCashOut = monthTransactions
          .filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          name: format(month, 'MMM'),
          fullName: format(month, 'MMMM yyyy'),
          cashIn,
          cashOut,
          netBalance: cashIn - operationalCashOut,
          transactions: monthTransactions.length
        };
      });
    } else if (viewType === 'weekly') {
      const yearStart = startOfYear(new Date(year, 0, 1));
      const yearEnd = endOfYear(new Date(year, 11, 31));
      const weeks = eachWeekOfInterval({ start: yearStart, end: yearEnd });

      return weeks.map((week, index) => {
        const weekStart = startOfWeek(week);
        const weekEnd = endOfWeek(week);
        
        const weekTransactions = transactions.filter(transaction => {
          const transactionDate = parseISO(transaction.date);
          return transactionDate >= weekStart && transactionDate <= weekEnd;
        });

        // Refund-adjusted cash-in for weekly chart
        const cashIn = weekTransactions
          .filter(t => t.type === 'cash-in')
          .reduce((sum, t) => {
            const amount = Number(t.amount) || 0;
            return isRefundCategory(t.category_name) ? sum - amount : sum + amount;
          }, 0);
        
        const cashOut = weekTransactions
          .filter(t => t.type === 'cash-out')
          .reduce((sum, t) => sum + t.amount, 0);

        const operationalCashOut = weekTransactions
          .filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          name: `W${index + 1}`,
          fullName: `Week ${index + 1} (${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')})`,
          cashIn,
          cashOut,
          netBalance: cashIn - operationalCashOut,
          transactions: weekTransactions.length
        };
      });
    } else {
      // Daily view - handle specific date comparison
      if (specificDate) {
        // For specific date comparison, return single day data
        const dayTransactions = transactions.filter(transaction => {
          const transactionDate = parseISO(transaction.date);
          return isSameDay(transactionDate, specificDate);
        });

        // Refund-adjusted cash-in for specific-date chart
        const cashIn = dayTransactions
          .filter(t => t.type === 'cash-in')
          .reduce((sum, t) => {
            const amount = Number(t.amount) || 0;
            return isRefundCategory(t.category_name) ? sum - amount : sum + amount;
          }, 0);
        
        const cashOut = dayTransactions
          .filter(t => t.type === 'cash-out')
          .reduce((sum, t) => sum + t.amount, 0);

        const operationalCashOut = dayTransactions
          .filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal')
          .reduce((sum, t) => sum + t.amount, 0);

        return [{
          name: format(specificDate, 'dd'),
          fullName: format(specificDate, 'EEEE, MMMM dd, yyyy'),
          cashIn,
          cashOut,
          netBalance: cashIn - operationalCashOut,
          transactions: dayTransactions.length
        }];
      } else {
        // Regular daily view for entire month
        const monthStart = startOfMonth(new Date(year, month, 1));
        const monthEnd = endOfMonth(new Date(year, month, 1));
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

        return days.map(day => {
          const dayTransactions = transactions.filter(transaction => {
            const transactionDate = parseISO(transaction.date);
            return transactionDate.toDateString() === day.toDateString();
          });

          // Refund-adjusted cash-in for daily chart
          const cashIn = dayTransactions
            .filter(t => t.type === 'cash-in')
            .reduce((sum, t) => {
              const amount = Number(t.amount) || 0;
              return isRefundCategory(t.category_name) ? sum - amount : sum + amount;
            }, 0);
          
          const cashOut = dayTransactions
            .filter(t => t.type === 'cash-out')
            .reduce((sum, t) => sum + t.amount, 0);

          const operationalCashOut = dayTransactions
            .filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal')
            .reduce((sum, t) => sum + t.amount, 0);

          return {
            name: format(day, 'dd'),
            fullName: format(day, 'EEEE, MMMM dd, yyyy'),
            cashIn,
            cashOut,
            netBalance: cashIn - operationalCashOut,
            transactions: dayTransactions.length
          };
        });
      }
    }
  }, [transactions, year, month, viewType, specificDate]);
}
