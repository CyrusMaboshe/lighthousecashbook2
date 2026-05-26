import { memo, useCallback } from 'react';
import { TransactionForm } from '@/components/TransactionForm';
import { TopCustomers } from '@/components/TopCustomers';
import { CustomerList } from '@/components/CustomerList';
import { Transaction } from '@/hooks/useTransactions';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useTheme } from '@/contexts/ThemeContext';

interface TransactionModalsProps {
  showTransactionForm: boolean;
  showTopCustomers: boolean;
  showCustomerList: boolean;
  transactionType: 'cash-in' | 'cash-out';
  categories: string[];
  filteredTransactions: Transaction[];
  onCloseTransactionForm: () => void;
  onCloseTopCustomers: () => void;
  onCloseCustomerList: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'added_by'>) => Promise<void>;
  onAddCategory: (category: string) => void;
  editingTransaction?: Transaction | null;
  onUpdateTransaction?: (id: string, transaction: Partial<Transaction>) => void;
}

export const TransactionModals = memo(function TransactionModals({
  showTransactionForm,
  showTopCustomers,
  showCustomerList,
  transactionType,
  categories,
  filteredTransactions,
  onCloseTransactionForm,
  onCloseTopCustomers,
  onCloseCustomerList,
  onAddTransaction,
  onAddCategory,
  editingTransaction,
  onUpdateTransaction
}: TransactionModalsProps) {
  const { theme } = useTheme();

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) onCloseTransactionForm();
  }, [onCloseTransactionForm]);

  return (
    <>
      {/* Transaction Form Modal */}
      <Dialog open={showTransactionForm} onOpenChange={handleOpenChange}>
        <DialogContent
          className="transaction-modal-content p-0 border-none shadow-none max-w-2xl w-[95vw] fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-h-[90vh] block focus:outline-none overflow-visible"
          style={{ animationDuration: '0s', transitionDuration: '0s' }}
        >
          <VisuallyHidden>
            <DialogTitle>{editingTransaction ? 'Edit' : 'Add'} Transaction</DialogTitle>
          </VisuallyHidden>
          {showTransactionForm && (
            <TransactionForm
              type={transactionType}
              categories={categories}
              onSubmit={onAddTransaction}
              onCancel={onCloseTransactionForm}
              onAddCategory={onAddCategory}
              initialTransaction={editingTransaction || undefined}
              onUpdate={onUpdateTransaction}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Top Customers Modal */}
      {showTopCustomers && (
        <TopCustomers
          transactions={filteredTransactions}
          onClose={onCloseTopCustomers}
        />
      )}

      {/* Customer List Modal */}
      {showCustomerList && (
        <CustomerList
          transactions={filteredTransactions}
          onClose={onCloseCustomerList}
        />
      )}
    </>
  );
});
