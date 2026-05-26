
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Users, FileText, BarChart, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useQuickStats } from '@/hooks/useQuickStats';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { isRefundCategory } from '@/utils/refundUtils';

interface HomePageProps {
  selectedMonth: number;
  selectedYear: number;
  onViewChange: (view: string) => void;
  onAddCashIn: () => void;
  onAddCashOut: () => void;
}

export function HomePage({
  selectedMonth,
  selectedYear,
  onViewChange,
  onAddCashIn,
  onAddCashOut
}: HomePageProps) {
  const { currentUser, isAdmin } = useAuth();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { preferences, updatePreferences } = useUserPreferences();
  const { stats, loading: statsLoading } = useQuickStats(selectedMonth, selectedYear);
  const [refreshing, setRefreshing] = useState(false);
  const isMobile = useIsMobile();

  // Initialize offline sync - automatically syncs when connection is restored
  useOfflineSync();

  // Filter transactions by month and year
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === selectedMonth &&
      transactionDate.getFullYear() === selectedYear;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const toggleBalanceVisibility = () => {
    updatePreferences({
      showBalances: !preferences.showBalances
    });
  };

  // Refund-adjusted cash-in: refund-category transactions reduce inflow instead of adding to it
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

  return (
    <div className="space-y-4 sm:space-y-6">
{/* Welcome Section */}
       <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 sm:p-6 text-white">
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           {isMobile ? (
             <>
               <p className="text-blue-100 text-sm sm:text-base mb-1">
                 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
               </p>
               <p className="text-blue-100 text-sm sm:text-base">
                 {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
               </p>
             </>
           ) : (
             <div>
               <h1 className="text-xl sm:text-2xl font-bold mb-2">
                 Welcome back, {currentUser?.username}!
               </h1>
               <p className="text-blue-100 text-sm sm:text-base">
                 Here's your financial overview for {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
               </p>
             </div>
           )}
           <div className="flex items-center gap-2 sm:gap-3">
             <Button
               variant="secondary"
               size="sm"
               onClick={toggleBalanceVisibility}
               className="bg-white/20 hover:bg-white/30 text-white border-0"
             >
               {preferences.showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
             </Button>
             <Button
               variant="secondary"
               size="sm"
               onClick={handleRefresh}
               disabled={refreshing}
               className="bg-white/20 hover:bg-white/30 text-white border-0"
             >
               <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
             </Button>
           </div>
         </div>
       </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs sm:text-sm font-medium">Total Cash In</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {preferences.showBalances ? (
                    <>ZMW <AnimatedNumber value={totalCashIn} decimals={2} /></>
                  ) : (
                    '••••••'
                  )}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-xs sm:text-sm font-medium">Total Cash Out</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {preferences.showBalances ? (
                    <>ZMW <AnimatedNumber value={totalCashOut} decimals={2} /></>
                  ) : (
                    '••••••'
                  )}
                </p>
              </div>
              <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm font-medium">Net Balance</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {preferences.showBalances ? (
                    <>ZMW <AnimatedNumber value={netBalance} decimals={2} /></>
                  ) : (
                    '••••••'
                  )}
                </p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs sm:text-sm font-medium">Transactions</p>
                <p className="text-lg sm:text-2xl font-bold">
                  <AnimatedNumber value={filteredTransactions.length} decimals={0} />
                </p>
              </div>
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 grid grid-cols-2 gap-3 sm:gap-4">
          <Button onClick={onAddCashIn} className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base py-3">
            <TrendingUp className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add </span>Cash In
          </Button>
          <Button onClick={onAddCashOut} className="bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base py-3">
            <TrendingDown className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add </span>Cash Out
          </Button>
          <Button onClick={() => onViewChange('reports')} variant="outline" className="text-sm sm:text-base py-3">
            <BarChart className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">View </span>Reports
          </Button>
          <Button onClick={() => onViewChange('users')} variant="outline" className="text-sm sm:text-base py-3">
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Manage </span>Users
          </Button>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base sm:text-lg">Recent Transactions</CardTitle>
            <Badge variant="secondary">{filteredTransactions.length} Total</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 overflow-x-auto">
          <table className="w-full table-auto min-w-[500px]">
            <thead>
              <tr className="text-left">
                <th className="pb-2 text-xs sm:text-sm font-semibold uppercase">Date</th>
                <th className="pb-2 text-xs sm:text-sm font-semibold uppercase">Type</th>
                <th className="pb-2 text-xs sm:text-sm font-semibold uppercase">Amount</th>
                <th className="pb-2 text-xs sm:text-sm font-semibold uppercase">Customer</th>
                <th className="pb-2 text-xs sm:text-sm font-semibold uppercase hidden sm:table-cell">Category</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.slice(0, 5).map(transaction => (
                <tr key={transaction.id} className="border-b last:border-b-0">
                  <td className="py-3 text-sm">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${transaction.type === 'cash-in'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                      }`}>
                      {transaction.type === 'cash-in' ? 'In' : 'Out'}
                    </span>
                  </td>
                  <td className="py-3 text-sm font-medium">ZMW {transaction.amount}</td>
                  <td className="py-3 text-sm">{transaction.customer_name}</td>
                  <td className="py-3 text-sm hidden sm:table-cell">{transaction.category_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
