import React, { useState, memo, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Edit2, Trash2, Check, X } from 'lucide-react';
import { Transaction } from '@/hooks/useTransactions';
import { ResponsiveButton, ResponsiveInput } from '@/components/layout/ResponsiveLayout';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { usePagination } from '@/hooks/usePagination';
import { useDeviceInfo } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ResponsiveTransactionTableProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  isAdmin: boolean;
}

interface TransactionRowProps {
  transaction: Transaction;
  isEditing: boolean;
  editData: Partial<Transaction>;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onEditDataChange: (field: string, value: any) => void;
  isAdmin: boolean;
  masked: boolean;
}

const TransactionRow = memo<TransactionRowProps>(({
  transaction,
  isEditing,
  editData,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onEditDataChange,
  isAdmin,
  masked
}) => {
  const formatDate = useMemo(() => {
    try {
      return format(new Date(transaction.date), 'MMM dd\nyyyy');
    } catch {
      return transaction.date;
    }
  }, [transaction.date]);

  const handleEdit = useCallback(() => {
    onEdit();
  }, [onEdit]);

  const handleSave = useCallback(() => {
    onSave();
  }, [onSave]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleDelete = useCallback(() => {
    onDelete();
  }, [onDelete]);

  const handleFieldChange = useCallback((field: string, value: any) => {
    onEditDataChange(field, value);
  }, [onEditDataChange]);

  if (masked) {
    return (
      <div className="responsive-table-row bg-gray-50">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4">
        <div className="text-center">
          <div className="text-xs font-medium text-gray-800 whitespace-pre-line">
            {new Date(transaction.date).toLocaleDateString()}
          </div>
        </div>
          <div className="text-center">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-gray-400">
              ****
            </span>
          </div>
          <div className="text-center hidden sm:block">
            <div className="text-sm font-medium text-gray-500">****</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-gray-500">****</div>
          </div>
          <div className="text-center hidden lg:block">
            <div className="text-sm font-medium text-gray-500">****</div>
          </div>
          <div className="text-center hidden lg:block">
            <div className="text-sm font-medium text-gray-500">****</div>
          </div>
          <div className="text-center hidden lg:block">
            <div className="text-sm text-gray-500">****</div>
          </div>
          <div className="text-center hidden lg:block">
            <div className="text-sm text-gray-500">****</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'responsive-table-row',
      transaction.type === 'cash-in' ? 'bg-green-50' : 'bg-red-50'
    )}>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4">
        {/* Date */}
        <div className="text-center">
          <div className="text-xs font-medium text-gray-800 whitespace-pre-line">
            {new Date(transaction.date).toLocaleDateString()}
          </div>
        </div>

        {/* Type */}
        <div className="text-center">
          <span className={cn(
            'inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-semibold text-white',
            transaction.type === 'cash-in' 
              ? 'bg-gradient-to-r from-green-500 to-green-600'
              : 'bg-gradient-to-r from-red-500 to-red-600'
          )}>
            {transaction.type === 'cash-in' ? 'In' : 'Out'}
          </span>
        </div>

        {/* Category - Hidden on mobile */}
        <div className="text-center hidden sm:block">
          {isEditing ? (
            <ResponsiveInput
              value={editData.category_name || ''}
              onChange={(e) => onEditDataChange('category_name', e.target.value)}
              className="text-sm"
            />
          ) : (
            <div className="text-sm font-medium text-gray-900 truncate" title={transaction.category_name}>
              {transaction.category_name}
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="text-center">
          {isEditing ? (
            <ResponsiveInput
              type="number"
              value={editData.amount?.toString() || ''}
              onChange={(e) => onEditDataChange('amount', parseFloat(e.target.value) || 0)}
              className="text-sm"
            />
          ) : (
            <div>
              <div className="text-xs text-gray-600 mb-1">ZMW</div>
              <div className={cn(
                'text-sm font-bold',
                transaction.type === 'cash-in' ? 'text-green-700' : 'text-red-700'
              )}>
                {transaction.amount.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* Customer - Hidden on mobile, shown on lg+ */}
        <div className="text-center hidden lg:block">
          {isEditing ? (
            <ResponsiveInput
              value={editData.customer_name || ''}
              onChange={(e) => onEditDataChange('customer_name', e.target.value)}
              className="text-sm"
            />
          ) : (
            <div className="text-sm font-medium text-gray-900 truncate" title={transaction.customer_name}>
              {transaction.customer_name || 'Customer'}
            </div>
          )}
        </div>

        {/* Pictures - Hidden on mobile, shown on lg+ */}
        <div className="text-center hidden lg:block">
          {isEditing ? (
            <ResponsiveInput
              type="number"
              value={editData.number_of_pictures?.toString() || ''}
              onChange={(e) => onEditDataChange('number_of_pictures', parseInt(e.target.value) || 0)}
              className="text-sm"
            />
          ) : (
            <div className="text-sm font-medium text-gray-900">
              {transaction.number_of_pictures > 0 ? (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  {transaction.number_of_pictures}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          )}
        </div>

        {/* WhatsApp - Hidden on mobile, shown on lg+ */}
        <div className="text-center hidden lg:block">
          {isEditing ? (
            <ResponsiveInput
              value={editData.whatsapp_number || ''}
              onChange={(e) => onEditDataChange('whatsapp_number', e.target.value)}
              className="text-sm"
            />
          ) : (
            <div className="text-sm text-gray-900 truncate" title={transaction.whatsapp_number}>
              {transaction.whatsapp_number || '-'}
            </div>
          )}
        </div>

        {/* Actions - Always visible */}
        <div className="text-center">
          {isAdmin && (
            <div className="flex justify-center gap-1">
              {isEditing ? (
                <>
                  <ResponsiveButton
                    size="sm"
                    variant="primary"
                    onClick={onSave}
                    className="p-1 min-w-[2rem]"
                  >
                    <Check className="w-3 h-3" />
                  </ResponsiveButton>
                  <ResponsiveButton
                    size="sm"
                    variant="ghost"
                    onClick={onCancel}
                    className="p-1 min-w-[2rem]"
                  >
                    <X className="w-3 h-3" />
                  </ResponsiveButton>
                </>
              ) : (
                <>
                  <ResponsiveButton
                    size="sm"
                    variant="ghost"
                    onClick={onEdit}
                    className="p-1 min-w-[2rem]"
                  >
                    <Edit2 className="w-3 h-3" />
                  </ResponsiveButton>
                  <ResponsiveButton
                    size="sm"
                    variant="ghost"
                    onClick={onDelete}
                    className="p-1 min-w-[2rem] text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </ResponsiveButton>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

TransactionRow.displayName = 'TransactionRow';

export const ResponsiveTransactionTable = memo<ResponsiveTransactionTableProps>(({
  transactions,
  onDeleteTransaction,
  onUpdateTransaction,
  isAdmin
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Transaction>>({});
  const { preferences } = useUserPreferences();
  const { isMobile } = useDeviceInfo();

  // Add pagination for better performance
  const pagination = usePagination(transactions, {
    initialPageSize: isMobile ? 25 : 50
  });

  const handleEdit = useCallback((transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditData(transaction);
  }, []);

  const handleSave = useCallback(() => {
    if (editingId && editData) {
      onUpdateTransaction(editingId, editData);
      setEditingId(null);
      setEditData({});
    }
  }, [editingId, editData, onUpdateTransaction]);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setEditData({});
  }, []);

  const handleEditDataChange = (field: string, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const shouldMaskBalances = !preferences.showBalances;

  return (
    <div className="responsive-table">
      {/* Table Header */}
      <div className="responsive-table-header">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4">
          <div className="text-center font-semibold">Date</div>
          <div className="text-center font-semibold">Type</div>
          <div className="text-center font-semibold hidden sm:block">Category</div>
          <div className="text-center font-semibold">Amount</div>
          <div className="text-center font-semibold hidden lg:block">Customer</div>
          <div className="text-center font-semibold hidden lg:block">Pictures</div>
          <div className="text-center font-semibold hidden lg:block">WhatsApp</div>
          <div className="text-center font-semibold">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="max-h-96 overflow-y-auto">
        {pagination.paginatedData.length > 0 ? (
          pagination.paginatedData.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              isEditing={editingId === transaction.id}
              editData={editData}
              onEdit={() => handleEdit(transaction)}
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={() => onDeleteTransaction(transaction.id)}
              onEditDataChange={handleEditDataChange}
              isAdmin={isAdmin}
              masked={shouldMaskBalances}
            />
          ))
        ) : (
          <div className="responsive-table-row">
            <div className="text-center py-8 text-gray-500">
              No transactions found
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-600">
            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems}
          </div>
          <div className="flex items-center space-x-2">
            <ResponsiveButton
              size="sm"
              variant="outline"
              onClick={pagination.previousPage}
              disabled={!pagination.hasPreviousPage}
            >
              Previous
            </ResponsiveButton>
            <span className="text-sm">
              {pagination.currentPage} of {pagination.totalPages}
            </span>
            <ResponsiveButton
              size="sm"
              variant="outline"
              onClick={pagination.nextPage}
              disabled={!pagination.hasNextPage}
            >
              Next
            </ResponsiveButton>
          </div>
        </div>
      )}
    </div>
  );
});

ResponsiveTransactionTable.displayName = 'ResponsiveTransactionTable';
