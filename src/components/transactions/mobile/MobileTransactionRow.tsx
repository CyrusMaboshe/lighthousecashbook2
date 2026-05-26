import { memo } from 'react';
import { Transaction } from '@/hooks/useTransactions';

interface MobileTransactionRowProps {
  transaction: Transaction;
  index: number;
  showBalances: boolean;
}

export const MobileTransactionRow = memo(function MobileTransactionRow({ 
  transaction, 
  index,
  showBalances
}: MobileTransactionRowProps) {
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}\n${day},\n${year}`;
  };

  // If balance visibility is off, show masked data
  if (!showBalances) {
    return (
      <div 
        key={transaction.id || index} 
        className="grid grid-cols-8 gap-4 px-3 py-4 text-sm border-b hover:bg-gray-50 transition-colors bg-gray-50 border-gray-200"
      >
        {/* Date - still visible */}
        <div className="text-center">
          <div className="whitespace-pre-line text-xs leading-tight font-medium text-gray-800">
            {formatDate(transaction.date)}
          </div>
        </div>

        {/* Type - masked */}
        <div className="text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm bg-gray-400">
            ****
          </span>
        </div>

        {/* Category - masked */}
        <div className="text-center">
          <div className="text-sm font-medium text-gray-500">
            ****
          </div>
        </div>

        {/* Amount - masked */}
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">ZMW</div>
          <div className="text-sm font-bold text-gray-500">
            ****
          </div>
        </div>

        {/* Customer - masked */}
        <div className="text-center">
          <div className="text-sm font-medium text-gray-500">
            ****
          </div>
        </div>

        {/* Pictures - masked */}
        <div className="text-center">
          <div className="text-sm font-medium text-gray-500">
            ****
          </div>
        </div>

        {/* WhatsApp - masked */}
        <div className="text-center">
          <div className="text-sm text-gray-500">
            ****
          </div>
        </div>

        {/* Details - masked */}
        <div className="text-center">
          <div className="text-sm text-gray-500">
            ****
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      key={transaction.id || index} 
      className={`grid grid-cols-8 gap-4 px-3 py-4 text-sm border-b hover:bg-gray-50 transition-colors ${
        transaction.type === 'cash-in' 
          ? 'bg-green-50 border-green-100' 
          : 'bg-red-50 border-red-100'
      }`}
    >
      {/* Date */}
      <div className="text-center">
        <div className="whitespace-pre-line text-xs leading-tight font-medium text-gray-800">
          {formatDate(transaction.date)}
        </div>
      </div>

      {/* Type */}
      <div className="text-center">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm ${
          transaction.type === 'cash-in' 
            ? 'bg-gradient-to-r from-green-500 to-green-600' 
            : 'bg-gradient-to-r from-red-500 to-red-600'
        }`}>
          {transaction.type === 'cash-in' ? 'Cash In' : 'Cash Out'}
        </span>
      </div>

      {/* Category */}
      <div className="text-center">
        <div className="text-sm font-medium text-gray-900 truncate" title={transaction.category_name}>
          {transaction.category_name}
        </div>
      </div>

      {/* Amount */}
      <div className="text-center">
        <div className="text-xs text-gray-600 mb-1">ZMW</div>
        <div className={`text-sm font-bold ${
          transaction.type === 'cash-in' ? 'text-green-700' : 'text-red-700'
        }`}>
          {transaction.amount.toFixed(2)}
        </div>
      </div>

      {/* Customer */}
      <div className="text-center">
        <div className="text-sm font-medium text-gray-900 truncate" title={transaction.customer_name}>
          {transaction.customer_name || 'Customer'}
        </div>
      </div>

      {/* Pictures */}
      <div className="text-center">
        <div className="text-sm font-medium text-gray-900">
          {transaction.number_of_pictures > 0 ? (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              {transaction.number_of_pictures}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      </div>

      {/* WhatsApp */}
      <div className="text-center">
        <div className="text-sm text-gray-900 truncate" title={transaction.whatsapp_number}>
          {transaction.whatsapp_number || '-'}
        </div>
      </div>

      {/* Details */}
      <div className="text-center">
        <div className="text-sm text-gray-900 truncate" title={transaction.details}>
          {transaction.details || '-'}
        </div>
      </div>
    </div>
  );
});
