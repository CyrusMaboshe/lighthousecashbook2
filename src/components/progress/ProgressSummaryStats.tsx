
import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Eye, EyeOff, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProcessedDataItem, ViewType } from './types';
import { cn } from '@/lib/utils';

interface ProgressSummaryStatsProps {
  primaryData: ProcessedDataItem[];
  comparisonData: ProcessedDataItem[];
  comparisonMode: boolean;
  viewType: ViewType;
  balancesVisible?: boolean;
  onToggleBalances?: () => void;
  lightTheme?: boolean;
}

export function ProgressSummaryStats({
  primaryData,
  comparisonData,
  comparisonMode,
  viewType,
  balancesVisible = true,
  onToggleBalances,
  lightTheme = false
}: ProgressSummaryStatsProps) {
  // Calculate summary stats
  const totalCashIn = primaryData.reduce((sum, item) => sum + item.cashIn, 0);
  const totalCashOut = primaryData.reduce((sum, item) => sum + item.cashOut, 0);
  const totalNetBalance = totalCashIn - totalCashOut;

  // Comparison summary stats
  const compareTotalCashIn = comparisonData.reduce((sum, item) => sum + item.cashIn, 0);
  const compareTotalCashOut = comparisonData.reduce((sum, item) => sum + item.cashOut, 0);
  const compareTotalNetBalance = compareTotalCashIn - compareTotalCashOut;

  // Differences
  const cashInDiff = totalCashIn - compareTotalCashIn;

  const CardWrapper = ({ children, className, icon: Icon, colorClass, label }: any) => (
    <div className={cn(
      "p-6 rounded-xl border border-slate-100 bg-white shadow-sm transition-all duration-300",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className={cn("text-xs font-bold uppercase tracking-wider", colorClass)}>
              {label}
            </span>
            {label === "Total Cash In" && onToggleBalances && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleBalances}
                className="p-1 h-auto rounded-full hover:bg-slate-100"
              >
                {balancesVisible ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
              </Button>
            )}
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {balancesVisible ? `ZMW ${children.toLocaleString()}` : '••••••••'}
          </p>
          {comparisonMode && balancesVisible && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full w-fit",
              (cashInDiff >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")
            )}>
              {cashInDiff >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {cashInDiff >= 0 ? '+' : ''}ZMW {Math.abs(cashInDiff).toLocaleString()}
            </div>
          )}
        </div>
        <div className="p-3 bg-slate-50 rounded-lg text-slate-400">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <CardWrapper
        label="Total Cash In"
        icon={TrendingUp}
        colorClass="text-emerald-600"
      >
        {totalCashIn}
      </CardWrapper>

      <CardWrapper
        label="Total Cash Out"
        icon={TrendingDown}
        colorClass="text-red-600"
      >
        {totalCashOut}
      </CardWrapper>

      <CardWrapper
        label="Net Balance"
        icon={DollarSign}
        colorClass="text-blue-600"
      >
        {totalNetBalance}
      </CardWrapper>

      <CardWrapper
        label={`Avg ${viewType === 'monthly' ? 'Monthly' : viewType === 'weekly' ? 'Weekly' : 'Daily'}`}
        icon={Activity}
        colorClass="text-purple-600"
      >
        {Math.round(totalNetBalance / Math.max(primaryData.length, 1))}
      </CardWrapper>
    </div>
  );
}
