import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { TransactionDetailDialog } from './TransactionDetailDialog';
import { FilterOptions } from '@/pages/Index';
import { Transaction } from '@/hooks/useTransactions';
import { TransactionModals } from '@/components/transactions/TransactionModals';
import { CashVaultWithdrawModal } from '@/components/cashvault/CashVaultWithdrawModal';
import { Search, Filter, TrendingUp, TrendingDown, Image, Plus, Minus, Calendar, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface GlassTransactionsViewProps {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  categories: string[];
  isAdmin: boolean;
  currentUser: any;
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'added_by'>) => void;
  onAddCategory: (category: string) => void;
}

export function GlassTransactionsView({
  transactions, filteredTransactions, filters, onFiltersChange, categories,
  isAdmin, currentUser, selectedYear, selectedMonth, onYearChange, onMonthChange,
  onDeleteTransaction, onUpdateTransaction, onAddTransaction, onAddCategory
}: GlassTransactionsViewProps) {
  const [showTopCustomers, setShowTopCustomers] = useState(false);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showCashVaultModal, setShowCashVaultModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'cash-in' | 'cash-out'>('cash-in');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [displayLimit, setDisplayLimit] = useState(50);

  // Reset display limit when filters change
  React.useEffect(() => {
    setDisplayLimit(50);
  }, [filters]);

  const totals = React.useMemo(() => {
    const cashIn = filteredTransactions.filter(t => t.type === 'cash-in').reduce((s, t) => s + Number(t.amount) || 0, 0);
    const cashOut = filteredTransactions.filter(t => t.type === 'cash-out').reduce((s, t) => s + Number(t.amount) || 0, 0);
    const cashOutOperational = filteredTransactions
      .filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal')
      .reduce((s, t) => s + Number(t.amount) || 0, 0);
    const totalPictures = filteredTransactions.reduce((s, t) => s + (t.number_of_pictures || 0), 0);
    return { cashIn, cashOut, net: cashIn - cashOutOperational, totalPictures };
  }, [filteredTransactions]);

  const handleAddTransactionWrapper = async (transaction: Omit<Transaction, 'id' | 'added_by'>) => {
    setShowTransactionForm(false);
    setEditingTransaction(null);
    onAddTransaction(transaction);
  };

  return (
    <div className="space-y-4">
      {/* Summary - Responsive grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        <GlassCard padding="sm" className="text-center bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-400/30">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-300" />
          <p className="text-xs text-green-200">Cash In</p>
          <p className="text-2xl font-black glass-text-success">{totals.cashIn.toLocaleString()} <span className="text-xs opacity-70">ZMW</span></p>
        </GlassCard>
        <GlassCard padding="sm" className="text-center bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-400/30">
          <TrendingDown className="w-5 h-5 mx-auto mb-1 text-red-300" />
          <p className="text-xs text-red-200">Cash Out</p>
          <p className="text-2xl font-black glass-text-danger">{totals.cashOut.toLocaleString()} <span className="text-xs opacity-70">ZMW</span></p>
        </GlassCard>
        <GlassCard padding="sm" className="text-center bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-400/30">
          <div className={cn("w-5 h-5 mx-auto mb-1 rounded-full backdrop-blur-sm border", totals.net >= 0 ? "bg-blue-500/30 border-blue-400/40" : "bg-red-500/30 border-red-400/40")} />
          <p className="text-xs text-blue-200">Balance</p>
          <p className={cn("text-2xl font-black", totals.net >= 0 ? "glass-text-success" : "glass-text-danger")}>
            {totals.net.toLocaleString()} <span className="text-xs opacity-70">ZMW</span>
          </p>
        </GlassCard>
        <GlassCard padding="sm" className="text-center bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border-emerald-400/30">
          <Image className="w-5 h-5 mx-auto mb-1 text-emerald-300" />
          <p className="text-xs text-emerald-200">Pictures</p>
          <p className="font-bold text-emerald-300">{totals.totalPictures.toLocaleString()}</p>
        </GlassCard>
      </div>

      {/* Quick Transaction Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            setTransactionType('cash-in');
            setShowTransactionForm(true);
          }}
          className="flex-1 p-4 flex flex-col items-center gap-2 bg-gradient-to-br from-green-900/40 via-green-800/30 to-green-900/40 border-green-400/40 hover:border-green-400/60 transition-all duration-300 rounded-xl border backdrop-blur-md"
        >
          <div className="w-12 h-12 rounded-xl bg-green-500/30 border border-green-400/50 text-green-300 flex items-center justify-center backdrop-blur-sm">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-sm font-semibold text-green-100">Cash In</span>
          <span className="text-xs text-green-200">Record income</span>
        </button>
        <button
          onClick={() => {
            setTransactionType('cash-out');
            setShowTransactionForm(true);
          }}
          className="flex-1 p-4 flex flex-col items-center gap-2 bg-gradient-to-br from-red-900/40 via-red-800/30 to-red-900/40 border-red-400/40 hover:border-red-400/60 transition-all duration-300 rounded-xl border backdrop-blur-md"
        >
          <div className="w-12 h-12 rounded-xl bg-red-500/30 border border-red-400/50 text-red-300 flex items-center justify-center backdrop-blur-sm">
            <Minus className="w-6 h-6" />
          </div>
          <span className="text-sm font-semibold text-red-100">Cash Out</span>
          <span className="text-xs text-red-200">Record expense</span>
        </button>
      </div>

      {/* Search & Filter */}
      <GlassCard padding="sm">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="glass-input pl-10 py-2"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn("glass-btn flex items-center gap-2 px-3", showFilters && "bg-cyan-500/20 border-cyan-400/30")}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-3 glass-animate-fade-in">
            {/* Active period — admin sets this from Profile view */}
            <div className="pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-violet-300" />
                <label className="text-xs text-slate-300 font-medium">
                  Active Period
                  {isAdmin && <span className="ml-2 text-[9px] text-violet-300 font-bold uppercase tracking-widest">(Change in Profile)</span>}
                </label>
              </div>
              <div className="px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <p className="text-sm font-semibold text-white">
                  {format(new Date(selectedYear, selectedMonth, 1), 'MMMM yyyy')}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-300 mb-1 block">Period</label>
              <select
                value={filters.duration}
                onChange={(e) => onFiltersChange({ ...filters, duration: e.target.value as any })}
                className="glass-input py-2"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this-week">This Week</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 mb-1 block">Type</label>
              <div className="flex gap-2">
                {['all', 'cash-in', 'cash-out'].map((type) => (
                  <button
                    key={type}
                    onClick={() => onFiltersChange({ ...filters, type: type as any })}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                      filters.type === type
                        ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border border-cyan-400/30"
                        : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                    )}
                  >
                    {type === 'all' ? 'All' : type === 'cash-in' ? 'Income' : 'Expense'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Transaction List - Responsive layout */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white/90">
          Transactions ({filteredTransactions.length})
        </h3>

        {filteredTransactions.length === 0 ? (
          <GlassCard className="text-center py-8">
            <p className="text-white/50">No transactions found</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {(() => {
              // Slice transactions to display limit for performance
              const visibleTransactions = filteredTransactions.slice(0, displayLimit);

              // Group transactions by date
              const groupedByDate = visibleTransactions.reduce((groups, transaction) => {
                const dateKey = transaction.date;
                if (!groups[dateKey]) {
                  groups[dateKey] = [];
                }
                groups[dateKey].push(transaction);
                return groups;
              }, {} as Record<string, Transaction[]>);

              // Sort dates in descending order (most recent first)
              const sortedDates = Object.keys(groupedByDate).sort((a, b) =>
                new Date(b).getTime() - new Date(a).getTime()
              );

              return sortedDates.map((dateKey) => (
                <div key={dateKey} className="space-y-2">
                  {/* Date Separator */}
                  <div className="flex items-center gap-3 px-1">
                    <h4 className="text-sm font-semibold text-white/80">
                      {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
                    </h4>
                    <div className="flex-1 h-px bg-white/10"></div>
                    <span className="text-xs text-white/50">
                      {groupedByDate[dateKey].length} {groupedByDate[dateKey].length === 1 ? 'transaction' : 'transactions'}
                    </span>
                  </div>

                  {/* Transactions for this date */}
                  <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                    {groupedByDate[dateKey].map((transaction) => (
                      <button
                        key={transaction.id}
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowTransactionDetail(true);
                        }}
                        className="w-full text-left"
                      >
                        <GlassCard padding="sm" className="glass-animate-fade-in hover:bg-white/5 transition-colors cursor-pointer border-white/5">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              transaction.type === 'cash-in' ? "bg-green-500/10" : "bg-red-500/10"
                            )}>
                              {transaction.type === 'cash-in' ? (
                                <TrendingUp className="w-5 h-5 text-green-400" />
                              ) : (
                                <TrendingDown className="w-5 h-5 text-red-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white/90 truncate">{transaction.customer_name}</p>
                              <p className="text-xs text-white/50">
                                {transaction.category_name}
                                {transaction.time && ` • ${transaction.time}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={cn("font-bold text-lg", transaction.type === 'cash-in' ? "glass-text-success" : "glass-text-danger")}>
                                {transaction.type === 'cash-in' ? '+' : '-'}{Number(transaction.amount).toLocaleString()}
                              </p>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ZMW</div>
                            </div>
                          </div>
                        </GlassCard>
                      </button>
                    ))}
                  </div>
                </div>
              ));
            })()}

            {filteredTransactions.length > displayLimit && (
              <div className="flex justify-center pt-6 pb-2">
                <button
                  onClick={() => setDisplayLimit(prev => prev + 50)}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 hover:border-white/20 transition-all font-medium text-sm flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                  Load More Transactions
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transaction Detail Dialog */}
      <TransactionDetailDialog
        transaction={selectedTransaction}
        isOpen={showTransactionDetail}
        onClose={() => {
          setShowTransactionDetail(false);
          setSelectedTransaction(null);
        }}
        isAdmin={isAdmin}
        onEdit={(transaction) => {
          setEditingTransaction(transaction);
          setTransactionType(transaction.type);
          setShowTransactionForm(true);
        }}
        onDelete={(transactionId) => {
          onDeleteTransaction(transactionId);
        }}
      />

      <TransactionModals
        showTransactionForm={showTransactionForm}
        showTopCustomers={showTopCustomers}
        showCustomerList={showCustomerList}
        transactionType={transactionType}
        categories={categories}
        filteredTransactions={filteredTransactions}
        onCloseTransactionForm={() => {
          setShowTransactionForm(false);
          setEditingTransaction(null);
        }}
        onCloseTopCustomers={() => setShowTopCustomers(false)}
        onCloseCustomerList={() => setShowCustomerList(false)}
        onAddTransaction={handleAddTransactionWrapper}
        onAddCategory={onAddCategory}
        editingTransaction={editingTransaction}
        onUpdateTransaction={onUpdateTransaction}
      />

      <CashVaultWithdrawModal
        isOpen={showCashVaultModal}
        onClose={() => setShowCashVaultModal(false)}
      />
    </div>
  );
}
