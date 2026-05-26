
import { Shield } from 'lucide-react';

interface MobileTransactionWarningProps {
  showingRestrictedData: boolean;
  displayTransactionsCount: number;
  totalTransactionsCount: number;
}

export function MobileTransactionWarning({
  showingRestrictedData,
  displayTransactionsCount,
  totalTransactionsCount
}: MobileTransactionWarningProps) {
  if (!showingRestrictedData || displayTransactionsCount >= totalTransactionsCount) {
    return null;
  }

  return (
    <div className="px-3 py-2 bg-orange-50 border-b border-orange-200">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-orange-500" />
        <p className="text-xs text-orange-700 font-medium">
          You're seeing only your transactions. Admin can enable full access in settings.
        </p>
      </div>
    </div>
  );
}
