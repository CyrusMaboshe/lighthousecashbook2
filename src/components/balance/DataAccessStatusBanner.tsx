
import { Shield, Eye, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DataAccessStatusBannerProps {
  showingRestrictedData: boolean;
  displayTransactionsCount: number;
  totalTransactionsCount: number;
}

export function DataAccessStatusBanner({ 
  showingRestrictedData, 
  displayTransactionsCount, 
  totalTransactionsCount 
}: DataAccessStatusBannerProps) {
  const { isAdmin, currentUser } = useAuth();

  return (
    <div className={`p-3 rounded-lg border ${
      showingRestrictedData 
        ? 'bg-orange-50 border-orange-200' 
        : 'bg-green-50 border-green-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showingRestrictedData ? (
            <>
              <Shield className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Restricted View - Your Transactions Only ({currentUser?.username})
              </span>
            </>
          ) : (
            <>
              {isAdmin ? (
                <>
                  <Eye className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Admin View - All Company Data
                  </span>
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Full Access - All Company Data
                  </span>
                </>
              )}
            </>
          )}
        </div>
        <span className="text-xs text-gray-600">
          {displayTransactionsCount} of {totalTransactionsCount} transactions
        </span>
      </div>
    </div>
  );
}
