
import { useState, useEffect } from 'react';
import { TransactionFilters } from './TransactionFilters';
import { MobileBalanceCard } from './MobileBalanceCard';
import { MobileActionButtons } from './MobileActionButtons';
import { MobileTransactionList } from './MobileTransactionList';
import { MobileBalanceVisibilityToggle } from '@/components/balance/MobileBalanceVisibilityToggle';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { Transaction } from '@/hooks/useTransactions';
import { FilterOptions } from '@/pages/Index';
import { useAuth } from '@/hooks/useAuth';
import { useSystemBalance } from '@/hooks/useSystemBalance';

interface MobileTransactionSectionProps {
  filteredTransactions: Transaction[];
  mobileBalanceTransactions: Transaction[];
  displayTransactions: Transaction[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  categories: string[];
  isAdmin: boolean;
  currentUser: any;
  onShowTopCustomers: () => void;
  onShowCustomerList: () => void;
  onAddCashIn: () => void;
  onAddCashOut: () => void;
  onWithdrawToCashVault: () => void;
}

export function MobileTransactionSection({
  filteredTransactions,
  mobileBalanceTransactions,
  displayTransactions,
  filters,
  onFiltersChange,
  categories,
  isAdmin,
  currentUser,
  onShowTopCustomers,
  onShowCustomerList,
  onAddCashIn,
  onAddCashOut,
  onWithdrawToCashVault
}: MobileTransactionSectionProps) {
  const { systemSettings } = useAuth();
  const { systemState, getUserEffectiveBalance, loading: systemLoading } = useSystemBalance();
  const [userEffectiveBalance, setUserEffectiveBalance] = useState<number | null>(null);

  // REAL-TIME SYNC: Calculate user transactions for balance sync
  const userTransactions = filteredTransactions.filter(t => t.added_by === currentUser?.username);
  const userCashIn = userTransactions
    .filter(t => t.type === 'cash-in')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  // Total cash-out for DISPLAY (includes Reserve Investment Withdrawals)
  const userCashOut = userTransactions
    .filter(t => t.type === 'cash-out')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  // Operational cash-out for NET BALANCE (excludes Reserve Investment Withdrawals)
  const userOperationalCashOut = userTransactions
    .filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  // Balance transactions based on admin settings
  const balanceTransactions = isAdmin 
    ? filteredTransactions 
    : (systemSettings.showFullBalanceToUsers ? filteredTransactions : userTransactions);

  const mobileCashIn = balanceTransactions
    .filter(t => t.type === 'cash-in')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const mobileCashOut = balanceTransactions
    .filter(t => t.type === 'cash-out')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0); // Use absolute value for consistent cash-out calculation

  const mobileCashOutOperational = balanceTransactions
    .filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  const totalPictures = balanceTransactions
    .filter(t => t.type === 'cash-in' && t.number_of_pictures)
    .reduce((sum, t) => sum + (t.number_of_pictures || 0), 0);

  // REAL-TIME SYNC: Mobile balance synchronization with admin constraint
  useEffect(() => {
    if (!currentUser || isAdmin || systemLoading) {
      setUserEffectiveBalance(null);
      return;
    }

    const syncMobileBalance = async () => {
      console.log('Mobile: Real-time sync for user:', currentUser.username);
      console.log('Mobile: User cash-in (user_total_cashin):', userCashIn);
      console.log('Mobile: User cash-out (user_total_cashout):', userCashOut);
      console.log('Mobile: Admin net balance (admin_net_balance):', systemState.netSystemBalance);
      
      // EXTRA RULE: Real-time Admin Sync Control
      // Pass operational cash-out (excluding reserve withdrawals) so net balance is not reduced by them
      const effectiveBalance = await getUserEffectiveBalance(currentUser.username, userCashIn, userOperationalCashOut);
      
      console.log('Mobile: Real-time sync result:', {
        userNetBalance: userCashIn - userCashOut,
        adminConstraint: systemState.netSystemBalance,
        finalEffectiveBalance: effectiveBalance
      });
      
      setUserEffectiveBalance(effectiveBalance);
    };

    syncMobileBalance();
  }, [currentUser, userCashIn, userCashOut, systemState.netSystemBalance, isAdmin, systemLoading, getUserEffectiveBalance]);

  // REAL-TIME DISPLAY: Calculate display balance with sync logic
  const displayNetBalance = isAdmin 
    ? (mobileCashIn - mobileCashOutOperational) // Admin sees admin_net_balance calculation (excluding Reserve Investment Withdrawals)
    : (userEffectiveBalance !== null ? userEffectiveBalance : 0); // User sees synced balance

  return (
    <>
      {/* Modern Mobile Header */}
      <MobileHeader
        netBalance={displayNetBalance}
        currentUser={currentUser}
      />

      {/* Mobile Search and Filters */}
      <TransactionFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        categories={categories}
        onShowTopCustomers={onShowTopCustomers}
        onShowCustomerList={onShowCustomerList}
        isAdmin={isAdmin}
        isMobile={true}
      />

      {/* Mobile Balance Visibility Toggle */}
      <div className="px-4 py-2">
        <MobileBalanceVisibilityToggle />
      </div>

      {/* Balance Cards - Mobile with real-time synced logic */}
      <MobileBalanceCard
        netBalance={displayNetBalance}
        cashIn={isAdmin ? mobileCashIn : userCashIn} // Admin sees admin_total_cashin, user sees user_total_cashin
        cashOut={isAdmin ? mobileCashOut : userCashOut} // Admin sees admin_total_cashout, user sees user_total_cashout
        numberOfPictures={totalPictures}
      />

      {/* Modern Transactions Header */}
      <div className="mobile-card">
        <div className="mobile-card-header">
          <div className="mobile-card-title">Recent Transactions</div>
          <div className="text-sm text-slate-500">
            {balanceTransactions.length} entries
          </div>
        </div>
        {!isAdmin && !systemSettings.showFullBalanceToUsers && (
          <div className="text-xs text-orange-600 mt-1">
            Showing your transactions only
          </div>
        )}
      </div>

      {/* Mobile Action Buttons */}
      <MobileActionButtons
        onAddCashIn={onAddCashIn}
        onAddCashOut={onAddCashOut}
        onWithdrawToCashVault={onWithdrawToCashVault}
      />

      {/* Mobile Transaction List with consistent data */}
      <MobileTransactionList
        transactions={balanceTransactions}
        currentUser={currentUser}
      />
    </>
  );
}
