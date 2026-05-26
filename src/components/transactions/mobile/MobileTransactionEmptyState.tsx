
import { Users } from 'lucide-react';

interface MobileTransactionEmptyStateProps {
  showingRestrictedData: boolean;
}

export function MobileTransactionEmptyState({ showingRestrictedData }: MobileTransactionEmptyStateProps) {
  return (
    <div className="px-3 py-12 text-center">
      <div className="text-gray-400 mb-2">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
      </div>
      <p className="text-lg font-medium text-gray-600 mb-1">No transactions found</p>
      {showingRestrictedData && (
        <p className="text-sm text-orange-600">
          You can only see your own transactions. Contact admin for full access.
        </p>
      )}
    </div>
  );
}
