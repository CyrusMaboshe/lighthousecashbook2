// Company Transaction List - Placeholder for transaction listing
// This will have the same transaction list as the existing system but company-scoped

import React from 'react';

interface CompanyTransactionListProps {
  selectedYear: number;
  selectedMonth: number;
  limit?: number;
}

export function CompanyTransactionList({ selectedYear, selectedMonth, limit }: CompanyTransactionListProps) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Company Transactions - {monthNames[selectedMonth]} {selectedYear}
          {limit && ` (Latest ${limit})`}
        </h2>
        <p className="text-gray-600 mt-1">
          View and manage all company transactions with real-time updates.
        </p>
      </div>

      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">🚧 Transaction List Coming Soon</h3>
          <p className="text-blue-800 mb-4">
            This will include the exact same transaction management features:
          </p>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• Real-time transaction updates</li>
            <li>• Search and filter capabilities</li>
            <li>• Transaction editing and deletion</li>
            <li>• Category-wise filtering</li>
            <li>• Date range selection</li>
            <li>• Export functionality</li>
            <li>• Receipt viewing and printing</li>
          </ul>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <p className="text-gray-500">No transactions found for this period.</p>
          <p className="text-sm text-gray-400 mt-1">
            Transactions will appear here once the full system is implemented.
          </p>
        </div>
      </div>
    </div>
  );
}
