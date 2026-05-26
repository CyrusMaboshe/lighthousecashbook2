
import { useUserPreferences } from '@/hooks/useUserPreferences';

export function MobileTransactionTableHeader() {
  const { preferences } = useUserPreferences();

  return (
    <div className="mobile-transactions-table-header bg-gray-100 border-b-2 border-gray-200 px-3 py-3 grid grid-cols-8 gap-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
      <div className="text-center">Date</div>
      <div className="text-center">{preferences.showBalances ? 'Type' : '****'}</div>
      <div className="text-center">{preferences.showBalances ? 'Category' : '****'}</div>
      <div className="text-center">{preferences.showBalances ? 'Amount' : '****'}</div>
      <div className="text-center">{preferences.showBalances ? 'Customer' : '****'}</div>
      <div className="text-center">{preferences.showBalances ? 'Pictures' : '****'}</div>
      <div className="text-center">{preferences.showBalances ? 'WhatsApp' : '****'}</div>
      <div className="text-center">{preferences.showBalances ? 'Details' : '****'}</div>
    </div>
  );
}
