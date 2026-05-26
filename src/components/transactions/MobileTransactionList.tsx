
import { Transaction } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { MobileTransactionHeader } from './mobile/MobileTransactionHeader';
import { MobileTransactionWarning } from './mobile/MobileTransactionWarning';
import { MobileTransactionTable } from './mobile/MobileTransactionTable';

interface MobileTransactionListProps {
  transactions: Transaction[];
  currentUser: any;
}

export function MobileTransactionList({ transactions, currentUser }: MobileTransactionListProps) {
  const { isAdmin, systemSettings } = useAuth();

  // Filter transactions based on admin settings - EXACT same logic as balance cards and web view
  const displayTransactions = isAdmin 
    ? transactions 
    : (systemSettings.showFullBalanceToUsers ? transactions : transactions.filter(t => t.added_by === currentUser?.username));

  const showingRestrictedData = !isAdmin && !systemSettings.showFullBalanceToUsers;

  return (
    <div className="mobile-card">
      {/* Data Access Indicator */}
      <MobileTransactionHeader
        showingRestrictedData={showingRestrictedData}
        currentUser={currentUser}
        isAdmin={isAdmin}
        displayTransactionsCount={displayTransactions.length}
        totalTransactionsCount={transactions.length}
      />

      {/* Additional warning when user sees limited data */}
      <MobileTransactionWarning
        showingRestrictedData={showingRestrictedData}
        displayTransactionsCount={displayTransactions.length}
        totalTransactionsCount={transactions.length}
      />

      {/* Horizontal Scrollable Transaction Table */}
      <MobileTransactionTable
        displayTransactions={displayTransactions}
        showingRestrictedData={showingRestrictedData}
      />
    </div>
  );
}
