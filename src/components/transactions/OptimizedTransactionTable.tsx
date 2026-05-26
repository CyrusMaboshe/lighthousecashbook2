import React, { memo, useMemo, useCallback } from 'react';
import { Transaction } from '@/hooks/useTransactions';
import { usePagination } from '@/hooks/usePagination';
import { VirtualScrollList } from '@/components/ui/VirtualScrollList';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeviceInfo } from '@/hooks/use-mobile';

interface OptimizedTransactionTableProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
  loading?: boolean;
  className?: string;
  enableVirtualScrolling?: boolean;
  maxHeight?: number;
}

const TransactionRow = memo(({ 
  transaction, 
  index, 
  onEdit, 
  onDelete, 
  isAdmin 
}: {
  transaction: Transaction;
  index: number;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}) => {
  const handleEdit = useCallback(() => {
    onEdit?.(transaction);
  }, [onEdit, transaction]);

  const handleDelete = useCallback(() => {
    onDelete?.(transaction.id);
  }, [onDelete, transaction.id]);

  return (
    <div className={cn(
      "grid grid-cols-12 gap-2 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors",
      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
    )}>
      <div className="col-span-2 text-sm font-medium text-gray-900">
        {transaction.date}
      </div>
      <div className="col-span-1 text-sm">
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          transaction.type === 'cash-in' 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        )}>
          {transaction.type === 'cash-in' ? 'In' : 'Out'}
        </span>
      </div>
      <div className="col-span-2 text-sm text-gray-600 truncate">
        {transaction.category_name}
      </div>
      <div className="col-span-2 text-sm font-semibold text-gray-900">
        K{transaction.amount.toLocaleString()}
      </div>
      <div className="col-span-2 text-sm text-gray-600 truncate">
        {transaction.customer_name}
      </div>
      <div className="col-span-1 text-sm text-gray-500">
        {transaction.number_of_pictures}
      </div>
      <div className="col-span-2 flex items-center justify-end space-x-1">
        {isAdmin && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Edit</span>
              ✏️
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <span className="sr-only">Delete</span>
              🗑️
            </Button>
          </>
        )}
      </div>
    </div>
  );
});

TransactionRow.displayName = 'TransactionRow';

const TableHeader = memo(() => (
  <div className="grid grid-cols-12 gap-2 p-3 bg-gray-100 border-b border-gray-200 font-medium text-sm text-gray-700">
    <div className="col-span-2">Date</div>
    <div className="col-span-1">Type</div>
    <div className="col-span-2">Category</div>
    <div className="col-span-2">Amount</div>
    <div className="col-span-2">Customer</div>
    <div className="col-span-1">Pics</div>
    <div className="col-span-2 text-right">Actions</div>
  </div>
));

TableHeader.displayName = 'TableHeader';

const PaginationControls = memo(({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  hasNextPage,
  hasPreviousPage,
  goToPage,
  nextPage,
  previousPage,
  setPageSize,
  goToFirstPage,
  goToLastPage
}: any) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">
        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} transactions
      </span>
    </div>
    
    <div className="flex items-center space-x-2">
      <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="25">25</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="100">100</SelectItem>
          <SelectItem value="200">200</SelectItem>
        </SelectContent>
      </Select>
      
      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="sm"
          onClick={goToFirstPage}
          disabled={!hasPreviousPage}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={previousPage}
          disabled={!hasPreviousPage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="px-3 py-1 text-sm">
          {currentPage} of {totalPages}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={!hasNextPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={goToLastPage}
          disabled={!hasNextPage}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
));

PaginationControls.displayName = 'PaginationControls';

export const OptimizedTransactionTable = memo<OptimizedTransactionTableProps>(({
  transactions,
  onEdit,
  onDelete,
  isAdmin = false,
  loading = false,
  className,
  enableVirtualScrolling = false,
  maxHeight = 600
}) => {
  const { isMobile } = useDeviceInfo();
  
  const pagination = usePagination(transactions, {
    initialPageSize: isMobile ? 25 : 50
  });

  const renderTransactionRow = useCallback((transaction: Transaction, index: number) => (
    <TransactionRow
      key={transaction.id}
      transaction={transaction}
      index={index}
      onEdit={onEdit}
      onDelete={onDelete}
      isAdmin={isAdmin}
    />
  ), [onEdit, onDelete, isAdmin]);

  if (loading) {
    return (
      <div className={cn("border rounded-lg", className)}>
        <TableHeader />
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading transactions...</span>
          </div>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={cn("border rounded-lg", className)}>
        <TableHeader />
        <div className="flex items-center justify-center p-8 text-gray-500">
          No transactions found
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <TableHeader />
      
      {enableVirtualScrolling && transactions.length > 100 ? (
        <VirtualScrollList
          items={pagination.paginatedData}
          itemHeight={60}
          containerHeight={maxHeight}
          renderItem={renderTransactionRow}
          loading={loading}
        />
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {pagination.paginatedData.map((transaction, index) => 
            renderTransactionRow(transaction, index)
          )}
        </div>
      )}
      
      <PaginationControls {...pagination} />
    </div>
  );
});

OptimizedTransactionTable.displayName = 'OptimizedTransactionTable';
