
import { TrendingUp, TrendingDown, Camera } from 'lucide-react';
import { BalanceCard } from './BalanceCard';
import { Transaction } from '@/hooks/useTransactions';

interface BalanceCardsGridProps {
  displayTransactions: Transaction[];
  showingRestrictedData: boolean;
  formatCurrency: (amount: number) => string;
  overrideBalances?: {
    cashIn: number;
    cashOut: number;
    netBalance: number;
  };
}

// Team withdrawal calculation moved to dedicated view

export function BalanceCardsGrid({
  displayTransactions,
  showingRestrictedData,
  formatCurrency,
  overrideBalances
}: BalanceCardsGridProps) {
  // Use override balances if provided, otherwise calculate from transactions.
  // IMPORTANT: Reserve Investment Withdrawals appear in Cash Out (display) but must NOT
  // reduce the Net Balance — they are internal wealth reallocations, not real expenses.
  const cashIn = overrideBalances?.cashIn ?? displayTransactions
    .filter(t => t.type === 'cash-in')
    .reduce((sum, t) => sum + t.amount, 0);

  // Total cash-out includes reserve withdrawals (for display purposes)
  const cashOut = overrideBalances?.cashOut ?? displayTransactions
    .filter(t => t.type === 'cash-out')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Net balance fallback excludes reserve investment withdrawals
  const operationalCashOut = displayTransactions
    .filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netBalance = overrideBalances?.netBalance ?? (cashIn - operationalCashOut);

  const totalPictures = displayTransactions
    .filter(t => t.type === 'cash-in' && t.number_of_pictures)
    .reduce((sum, t) => sum + (t.number_of_pictures || 0), 0);

  return (
    <div className="space-y-4">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <BalanceCard
          title="Total Cash In"
          subtitle="ZMW"
          amount={cashIn}
          icon={TrendingUp}
          description="Total incoming funds"
          showingRestrictedData={showingRestrictedData}
          formatCurrency={formatCurrency}
        />

        <BalanceCard
          title="Total Cash Out"
          subtitle="ZMW"
          amount={cashOut}
          icon={TrendingDown}
          description="Total outgoing funds"
          showingRestrictedData={showingRestrictedData}
          formatCurrency={formatCurrency}
        />

        <BalanceCard
          title="Net Balance"
          subtitle="ZMW"
          amount={netBalance}
          icon={netBalance >= 0 ? TrendingUp : TrendingDown}
          description={netBalance >= 0 ? 'Available balance' : 'Overdraft'}
          showingRestrictedData={showingRestrictedData}
          formatCurrency={formatCurrency}
        />

        <BalanceCard
          title="Total Pictures"
          amount={totalPictures}
          icon={Camera}
          description="Captured this month"
          showingRestrictedData={showingRestrictedData}
          formatCurrency={(amount) => amount.toLocaleString()}
        />
      </div>
    </div>
  );
}
