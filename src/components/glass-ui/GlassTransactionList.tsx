import React from 'react';
import { TrendingUp, TrendingDown, ChevronRight, Shield, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  type: 'cash-in' | 'cash-out';
  amount: number;
  customer_name: string;
  category_name: string;
  date: string;
  time?: string;
  details?: string;
}

interface GlassTransactionListProps {
  transactions: Transaction[];
  onTransactionClick?: (transaction: Transaction) => void;
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  hideDetails?: boolean;
  onRevealClick?: () => void;
}

export function GlassTransactionList({
  transactions, onTransactionClick, maxItems = 5, showViewAll = true, onViewAll, hideDetails = false, onRevealClick
}: GlassTransactionListProps) {
  const displayTransactions = transactions.slice(0, maxItems);

  if (hideDetails) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-bold tracking-tight text-white/90">Activity</h3>
        </div>
        <div
          onClick={onRevealClick}
          className="glass-card p-8 text-center border-white/10 flex flex-col items-center justify-center min-h-[200px] animate-in fade-in zoom-in duration-300 cursor-pointer hover:bg-white/5 group transition-all"
        >
          <div className="w-16 h-16 mb-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md group-hover:scale-110 group-active:scale-95 transition-all">
            <EyeOff className="w-8 h-8 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Activity Hidden</h3>
          <p className="text-sm text-slate-400 max-w-[200px]">
            Transaction details are hidden. Click here or use the eye icon above to reveal.
          </p>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
          <TrendingUp className="w-8 h-8 text-cyan-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Transactions</h3>
        <p className="text-sm text-slate-300">Start by adding your first transaction using the + button</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-bold tracking-tight text-white/90">Activity</h3>
        {showViewAll && transactions.length > maxItems && (
          <button onClick={onViewAll} className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
            See All
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayTransactions.map((transaction, index) => {
          const isIncome = transaction.type === 'cash-in';
          return (
            <button
              key={transaction.id}
              onClick={() => onTransactionClick?.(transaction)}
              className="premium-card group w-full flex items-center gap-4 hover:border-primary/20 transition-all duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-active:scale-95',
                isIncome
                  ? 'bg-green-500/10 border border-green-500/10'
                  : 'bg-red-500/10 border border-red-500/10'
              )}>
                {isIncome ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-foreground text-[15px] truncate">
                  {transaction.customer_name || transaction.category_name}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-small-metadata text-muted-foreground uppercase">{transaction.category_name}</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-small-metadata">{format(new Date(transaction.date), 'MMM d, p')}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={cn('font-bold text-[16px]', isIncome ? 'text-green-600' : 'text-red-600')}>
                    {isIncome ? '+' : '-'}{transaction.amount.toLocaleString()}
                    <span className="text-[10px] ml-1 font-medium text-muted-foreground uppercase">{(transaction as any).currency || 'ZMW'}</span>
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
}
