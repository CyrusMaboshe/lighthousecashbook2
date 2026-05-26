
import { Transaction } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { useSystemBalance } from '@/hooks/useSystemBalance';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { DataAccessStatusBanner } from './balance/DataAccessStatusBanner';
import { BalanceVisibilityToggle } from './balance/BalanceVisibilityToggle';
import { BalanceCardsGrid } from './balance/BalanceCardsGrid';
import { useState, useEffect } from 'react';

interface BalanceCardsProps {
  transactions: Transaction[];
  userSpecificTransactions: Transaction[];
}

export function BalanceCards({ transactions, userSpecificTransactions }: BalanceCardsProps) {
  const { isAdmin, systemSettings, currentUser } = useAuth();
  const { systemState, getUserEffectiveBalance, loading: systemLoading } = useSystemBalance();
  const { preferences, loading: preferencesLoading } = useUserPreferences();
  const [userEffectiveBalance, setUserEffectiveBalance] = useState<number | null>(null);

  // Use appropriate transactions based on user role and settings
  const displayTransactions = isAdmin 
    ? transactions 
    : (systemSettings.showFullBalanceToUsers ? transactions : userSpecificTransactions);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount).replace('$', 'ZMW ');
  };

  const showingRestrictedData = !isAdmin && !systemSettings.showFullBalanceToUsers;

  // REAL-TIME SYNC: Calculate user totals for balance sync
  const userCashIn = userSpecificTransactions
    .filter(t => t.type === 'cash-in')
    .reduce((sum, t) => sum + t.amount, 0);

  // Total cash-out for DISPLAY (includes Reserve Investment Withdrawals)
  const userCashOut = userSpecificTransactions
    .filter(t => t.type === 'cash-out')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Operational cash-out for NET BALANCE calculation (excludes Reserve Investment Withdrawals)
  // Reserve investment withdrawals show in Cash Out but must NOT reduce the user's net balance
  const userOperationalCashOut = userSpecificTransactions
    .filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // REAL-TIME SYNC: Sync user to admin funds on every update
  useEffect(() => {
    if (!currentUser || isAdmin || systemLoading) {
      setUserEffectiveBalance(null);
      return;
    }

    const syncUserToAdmin = async () => {
      console.log('Real-time sync: Syncing user to admin funds');
      console.log('User cash-in (user_total_cashin):', userCashIn);
      console.log('User cash-out (user_total_cashout):', userCashOut);
      console.log('Admin net balance (admin_net_balance):', systemState.netSystemBalance);
      
      // Get effective balance using real-time sync logic
      // Pass operational cash-out (excluding reserve withdrawals) so net balance is not reduced by them
      const effectiveBalance = await getUserEffectiveBalance(currentUser.username, userCashIn, userOperationalCashOut);
      
      console.log('Real-time sync result:', {
        userNetBalance: userCashIn - userCashOut,
        adminConstraint: systemState.netSystemBalance,
        finalEffectiveBalance: effectiveBalance
      });
      
      setUserEffectiveBalance(effectiveBalance);
    };

    syncUserToAdmin();
  }, [currentUser, userCashIn, userCashOut, systemState.netSystemBalance, isAdmin, systemLoading, getUserEffectiveBalance]);

  // Calculate display data with real-time sync logic
  const displayData = isAdmin ? {
    // ADMIN VIEW: admin_total_cashin, admin_total_cashout (incl. reserve for display),
    // admin_net_balance already excludes reserve withdrawals via get_system_balance_status DB fn
    cashIn: systemState.totalCashIn,
    cashOut: systemState.totalCashOut,
    netBalance: systemState.netSystemBalance // DB already excludes reserve withdrawals
  } : {
    // USER VIEW: total cash-out for display, but net balance excludes reserve withdrawals
    cashIn: userCashIn,
    cashOut: userCashOut,  // full cash-out including reserve (for display)
    netBalance: userEffectiveBalance !== null ? userEffectiveBalance : 0 // excludes reserve
  };

  // Show loading state while preferences are loading
  if (preferencesLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Data Access Status Banner */}
      <DataAccessStatusBanner
        showingRestrictedData={showingRestrictedData}
        displayTransactionsCount={displayTransactions.length}
        totalTransactionsCount={transactions.length}
      />

      {/* Balance Visibility Toggle */}
      <BalanceVisibilityToggle />

      {/* Balance Cards Grid with real-time synced data */}
      {/* Always pass overrideBalances so the grid uses correct values:
          - For users: uses operational cashOut for net (excludes reserve withdrawals)
          - For admin: uses DB-computed net balance (already excludes reserve withdrawals) */}
      <BalanceCardsGrid
        displayTransactions={displayTransactions}
        showingRestrictedData={!preferences.showBalances}
        formatCurrency={formatCurrency}
        overrideBalances={{
          cashIn: displayData.cashIn,
          cashOut: displayData.cashOut,
          netBalance: displayData.netBalance
        }}
      />
    </div>
  );
}
