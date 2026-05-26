import React, { useState } from 'react';
import { Transaction } from '@/hooks/useTransactions';
import { FilterOptions } from '@/pages/Index';
import { ResponsiveLayout, ResponsiveGrid, ResponsiveCard, ResponsiveFlex } from '@/components/layout/ResponsiveLayout';
import { ResponsiveBalanceCards } from './ResponsiveBalanceCards';
import { ResponsiveTransactionTable } from './ResponsiveTransactionTable';
import { ResponsiveTransactionFilters } from './ResponsiveTransactionFilters';
import { ResponsiveActionButtons } from './ResponsiveActionButtons';
import { TransactionModals } from './TransactionModals';
import { CashVaultWithdrawModal } from '@/components/cashvault/CashVaultWithdrawModal';
import { cn } from '@/lib/utils';
import { MobileBalanceVisibilityToggle } from '@/components/balance/MobileBalanceVisibilityToggle';

interface ResponsiveTransactionViewProps {
  filteredTransactions: Transaction[];
  userSpecificTransactions: Transaction[];
  displayTransactions: Transaction[];
  mobileBalanceTransactions: Transaction[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  categories: Array<{ id: string; name: string; type: 'cash-in' | 'cash-out' }>;
  isAdmin: boolean;
  currentUser: any;
  systemSettings: any;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => void;
  onAddCategory: (category: { name: string; type: 'cash-in' | 'cash-out' }) => void;
}

export function ResponsiveTransactionView({
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
}: ResponsiveTransactionViewProps) {
  const [showTopCustomers, setShowTopCustomers] = useState(false);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showCashVaultModal, setShowCashVaultModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'cash-in' | 'cash-out'>('cash-in');

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

  const handleAddTransaction = (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    onAddTransaction(transaction);
    setShowTransactionForm(false);
  };

  return (
    <ResponsiveLayout>
      {/* Responsive Filters Section */}
      <ResponsiveCard className="mb-4 sm:mb-6">
        <ResponsiveTransactionFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          categories={categories as any}
        />
      </ResponsiveCard>

      {/* Balance Visibility Toggle for Mobile/Responsive */}
      <div className="mb-2">
        <MobileBalanceVisibilityToggle />
      </div>

      {/* Responsive Balance Cards */}
      <div className="mb-4 sm:mb-6">
        <ResponsiveBalanceCards
          transactions={filteredTransactions}
          userSpecificTransactions={userSpecificTransactions}
          mobileBalanceTransactions={mobileBalanceTransactions}
          isAdmin={isAdmin}
          systemSettings={systemSettings}
        />
      </div>

      {/* Responsive Action Buttons */}
      <ResponsiveCard className="mb-4 sm:mb-6">
        <ResponsiveActionButtons
          onAddCashIn={handleAddCashIn}
          onAddCashOut={handleAddCashOut}
          onWithdrawToCashVault={handleWithdrawToCashVault}
          isAdmin={isAdmin}
        />
      </ResponsiveCard>

      {/* Responsive Transaction Table */}
      <ResponsiveCard>
        <div className="mb-4">
          <ResponsiveFlex justify="between" align="center">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              Transactions
            </h3>
            <div className="text-sm text-gray-600">
              Showing {displayTransactions.length} entries
              {!isAdmin && !systemSettings.showFullBalanceToUsers && (
                <span className="block text-xs text-orange-600 sm:inline sm:ml-2">
                  (Your transactions only)
                </span>
              )}
            </div>
          </ResponsiveFlex>
        </div>

        <ResponsiveTransactionTable
          transactions={displayTransactions}
          onDeleteTransaction={onDeleteTransaction}
          onUpdateTransaction={onUpdateTransaction}
          isAdmin={isAdmin}
        />
      </ResponsiveCard>

      {/* Modals */}
      <TransactionModals
        showTopCustomers={showTopCustomers}
        showCustomerList={showCustomerList}
        showTransactionForm={showTransactionForm}
        transactionType={transactionType}
        categories={categories as any}
        filteredTransactions={filteredTransactions}
        onCloseTopCustomers={() => setShowTopCustomers(false)}
        onCloseCustomerList={() => setShowCustomerList(false)}
        onCloseTransactionForm={() => setShowTransactionForm(false)}
        onAddTransaction={handleAddTransaction as any}
        onAddCategory={onAddCategory as any}
      />
    </ResponsiveLayout>
  );
}

// Responsive wrapper for backward compatibility
export function UnifiedTransactionView(props: ResponsiveTransactionViewProps) {
  return <ResponsiveTransactionView {...props} />;
}
