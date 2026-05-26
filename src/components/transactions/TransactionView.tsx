
import { useState } from 'react';
import { MobileTransactionSection } from './MobileTransactionSection';
import { DesktopTransactionSection } from './DesktopTransactionSection';
import { ResponsiveTransactionView } from './ResponsiveTransactionView';
import { TransactionModals } from './TransactionModals';
import { CashVaultWithdrawModal } from '@/components/cashvault/CashVaultWithdrawModal';
import { Transaction } from '@/hooks/useTransactions';
import { FilterOptions } from '@/pages/Index';
import { useIsMobile } from '@/hooks/use-mobile';

interface TransactionViewProps {
  filteredTransactions: Transaction[];
  userSpecificTransactions: Transaction[];
  displayTransactions: Transaction[];
  mobileBalanceTransactions: Transaction[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  categories: string[];
  isAdmin: boolean;
  currentUser: any;
  systemSettings: any;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'added_by'>) => void;
  onAddCategory: (category: string) => void;
}

export function TransactionView({
  filteredTransactions,
  userSpecificTransactions,
  displayTransactions,
  mobileBalanceTransactions,
  filters,
  onFiltersChange,
  categories,
  isAdmin,
  currentUser,
  systemSettings,
  onDeleteTransaction,
  onUpdateTransaction,
  onAddTransaction,
  onAddCategory
}: TransactionViewProps) {
  const [showTopCustomers, setShowTopCustomers] = useState(false);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showCashVaultModal, setShowCashVaultModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'cash-in' | 'cash-out'>('cash-in');
  const isMobile = useIsMobile();

  const handleAddCashIn = () => {
    setTransactionType('cash-in');
    setShowTransactionForm(true);
  };

  const handleAddCashOut = () => {
    setTransactionType('cash-out');
    setShowTransactionForm(true);
  };

  const handleWithdrawToCashVault = () => {
    setShowCashVaultModal(true);
  };

  const handleAddTransactionWrapper = async (transaction: Omit<Transaction, 'id' | 'added_by'>) => {
    await onAddTransaction(transaction);
    setShowTransactionForm(false);
  };

  return (
    <>
      {/* Mobile or Desktop Transaction Section - Fallback to existing components */}
      {isMobile ? (
        <MobileTransactionSection
          filteredTransactions={filteredTransactions}
          mobileBalanceTransactions={mobileBalanceTransactions}
          displayTransactions={displayTransactions}
          filters={filters}
          onFiltersChange={onFiltersChange}
          categories={categories}
          isAdmin={isAdmin}
          currentUser={currentUser}
          onShowTopCustomers={() => setShowTopCustomers(true)}
          onShowCustomerList={() => setShowCustomerList(true)}
          onAddCashIn={handleAddCashIn}
          onAddCashOut={handleAddCashOut}
          onWithdrawToCashVault={handleWithdrawToCashVault}
        />
      ) : (
        <DesktopTransactionSection
          filteredTransactions={filteredTransactions}
          userSpecificTransactions={userSpecificTransactions}
          displayTransactions={displayTransactions}
          filters={filters}
          onFiltersChange={onFiltersChange}
          categories={categories}
          isAdmin={isAdmin}
          systemSettings={systemSettings}
          onDeleteTransaction={onDeleteTransaction}
          onUpdateTransaction={onUpdateTransaction}
          onShowTopCustomers={() => setShowTopCustomers(true)}
          onShowCustomerList={() => setShowCustomerList(true)}
          onAddCashIn={handleAddCashIn}
          onAddCashOut={handleAddCashOut}
          onWithdrawToCashVault={handleWithdrawToCashVault}
        />
      )}

      {/* All Modals */}
      <TransactionModals
        showTransactionForm={showTransactionForm}
        showTopCustomers={showTopCustomers}
        showCustomerList={showCustomerList}
        transactionType={transactionType}
        categories={categories}
        filteredTransactions={filteredTransactions}
        onCloseTransactionForm={() => setShowTransactionForm(false)}
        onCloseTopCustomers={() => setShowTopCustomers(false)}
        onCloseCustomerList={() => setShowCustomerList(false)}
        onAddTransaction={handleAddTransactionWrapper}
        onAddCategory={onAddCategory}
      />

      {/* Cash Vault Withdraw Modal */}
      <CashVaultWithdrawModal
        isOpen={showCashVaultModal}
        onClose={() => setShowCashVaultModal(false)}
      />
    </>
  );
}
