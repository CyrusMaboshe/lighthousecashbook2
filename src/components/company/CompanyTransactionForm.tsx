// Company Transaction Form - Placeholder for transaction creation
// This will have the same transaction form as the existing system but company-scoped

import React from 'react';
import { Button } from '@/components/ui/button';

interface CompanyTransactionFormProps {
  onTransactionAdded: () => void;
  onCancel: () => void;
}

export function CompanyTransactionForm({ onTransactionAdded, onCancel }: CompanyTransactionFormProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Company Transaction</h2>
      <p className="text-gray-600 mb-6">
        Create a new transaction for your company. This will have the exact same form as the existing system.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">🚧 Transaction Form Coming Soon</h3>
        <p className="text-blue-800 mb-4">
          This will include the exact same transaction creation features:
        </p>
        <ul className="text-blue-700 space-y-1 text-sm">
          <li>• Cash-in and cash-out transactions</li>
          <li>• Category selection</li>
          <li>• Customer information</li>
          <li>• Receipt printing</li>
          <li>• WhatsApp integration</li>
          <li>• Photo attachments</li>
        </ul>
      </div>

      <div className="flex gap-4">
        <Button onClick={onTransactionAdded} className="bg-green-600 hover:bg-green-700">
          Save Transaction (Demo)
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
