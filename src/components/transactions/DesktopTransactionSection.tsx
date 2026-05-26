
import { Plus, Vault } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BalanceCards } from '@/components/BalanceCards';
import { TransactionTable } from '@/components/TransactionTable';
import { TransactionFilters } from './TransactionFilters';
import { Transaction } from '@/hooks/useTransactions';
import { FilterOptions } from '@/pages/Index';
import { BalanceVisibilityToggle } from '@/components/balance/BalanceVisibilityToggle';

interface DesktopTransactionSectionProps {
  filteredTransactions: Transaction[];
  userSpecificTransactions: Transaction[];
  displayTransactions: Transaction[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  categories: string[];
  isAdmin: boolean;
  systemSettings: any;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  onShowTopCustomers: () => void;
  onShowCustomerList: () => void;
  onAddCashIn: () => void;
  onAddCashOut: () => void;
  onWithdrawToCashVault: () => void;
}

export function DesktopTransactionSection({
  filteredTransactions,
  userSpecificTransactions,
  displayTransactions,
  filters,
  onFiltersChange,
  categories,
  isAdmin,
  systemSettings,
  onDeleteTransaction,
  onUpdateTransaction,
  onShowTopCustomers,
  onShowCustomerList,
  onAddCashIn,
  onAddCashOut,
  onWithdrawToCashVault
}: DesktopTransactionSectionProps) {
  return (
    <>
      {/* Desktop Balance Cards */}
      <div className="px-0">
        <BalanceCards
          transactions={filteredTransactions}
          userSpecificTransactions={userSpecificTransactions}
        />
      </div>

      {/* Desktop Filters */}
      <TransactionFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        categories={categories}
        onShowTopCustomers={onShowTopCustomers}
        onShowCustomerList={onShowCustomerList}
        isAdmin={isAdmin}
        isMobile={false}
      />

      {/* Desktop Cash In/Out Buttons - POSITIONED ON THE LEFT AND MADE BIGGER */}
      <div className="flex flex-wrap gap-4 justify-between items-center px-2 mb-6">
        <div className="flex gap-4">
          <Button
            onClick={onAddCashIn}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg min-w-[160px] px-6 py-3 text-base"
          >
            <Plus className="mr-2 w-5 h-5" />
            <span>Cash In</span>
          </Button>
          <Button
            onClick={onAddCashOut}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg min-w-[160px] px-6 py-3 text-base"
          >
            <Plus className="mr-2 w-5 h-5" />
            <span>Cash Out</span>
          </Button>
          <Button
            onClick={onWithdrawToCashVault}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg min-w-[180px] px-6 py-3 text-base"
          >
            <Vault className="mr-2 w-5 h-5" />
            <span>Withdraw from Cash Vault</span>
          </Button>
        </div>

        {/* Balance Visibility Toggle */}
        <div className="flex items-center">
          <BalanceVisibilityToggle />
        </div>
      </div>

      {/* Desktop Transactions Table */}
      <div className="px-0">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 w-full max-w-full">
          <CardHeader className="p-3 md:p-4 lg:p-6">
            <CardTitle className="font-semibold text-slate-800 text-base md:text-lg lg:text-xl">
              Transactions ({displayTransactions.length})
              {!isAdmin && !systemSettings.showFullBalanceToUsers && (
                <span className="text-orange-600 block font-normal text-xs md:text-sm">
                  Showing only your transactions
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-4 lg:p-6">
            <div className="overflow-x-auto w-full max-w-full">
              <TransactionTable
                transactions={displayTransactions}
                onDeleteTransaction={onDeleteTransaction}
                onUpdateTransaction={onUpdateTransaction}
                isAdmin={isAdmin}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
