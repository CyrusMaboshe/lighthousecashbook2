
import { Transaction } from '@/hooks/useTransactions';
import { HorizontalScrollContainer } from '@/components/ui/horizontal-scroll-container';
import { MobileTransactionTableHeader } from './MobileTransactionTableHeader';
import { MobileTransactionRow } from './MobileTransactionRow';
import { MobileTransactionEmptyState } from './MobileTransactionEmptyState';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface MobileTransactionTableProps {
  displayTransactions: Transaction[];
  showingRestrictedData: boolean;
}

export function MobileTransactionTable({
  displayTransactions,
  showingRestrictedData
}: MobileTransactionTableProps) {
  const { preferences } = useUserPreferences();
  const showBalances = preferences.showBalances;

  // Debug logging
  console.log('📱 MobileTransactionTable received:', {
    displayTransactionsCount: displayTransactions.length,
    showingRestrictedData,
    firstTransaction: displayTransactions[0]
  });

  return (
    <HorizontalScrollContainer
      className="w-full"
      showButtons={true}
      buttonSize="md"
      scrollAmount={250}
    >
      <div className="min-w-[800px]">
        <MobileTransactionTableHeader />

        {displayTransactions.length > 0 ? (
          displayTransactions.slice(0, 50).map((transaction, index) => (
            <MobileTransactionRow
              key={transaction.id || index}
              transaction={transaction}
              index={index}
              showBalances={showBalances}
            />
          ))
        ) : (
          <MobileTransactionEmptyState showingRestrictedData={showingRestrictedData} />
        )}
      </div>
    </HorizontalScrollContainer>
  );
}
