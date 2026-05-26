
import { Shield, Eye, Users } from 'lucide-react';

interface MobileTransactionHeaderProps {
  showingRestrictedData: boolean;
  currentUser: any;
  isAdmin: boolean;
  displayTransactionsCount: number;
  totalTransactionsCount: number;
}

export function MobileTransactionHeader({
  showingRestrictedData,
  currentUser,
  isAdmin,
  displayTransactionsCount,
  totalTransactionsCount
}: MobileTransactionHeaderProps) {
  return (
    <div className="px-2 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showingRestrictedData ? (
            <>
              <Shield className="w-5 h-5 text-orange-500" />
              <div>
                <span className="text-sm text-orange-700 font-semibold block">Your Transactions Only</span>
                <span className="text-xs text-orange-600">({currentUser?.username})</span>
              </div>
            </>
          ) : (
            <>
              {isAdmin ? (
                <>
                  <Eye className="w-5 h-5 text-blue-500" />
                  <div>
                    <span className="text-sm text-blue-700 font-semibold block">Admin View</span>
                    <span className="text-xs text-blue-600">All Company Data</span>
                  </div>
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 text-green-500" />
                  <div>
                    <span className="text-sm text-green-700 font-semibold block">Full Access</span>
                    <span className="text-xs text-green-600">All Company Data</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-800">
            {displayTransactionsCount} of {totalTransactionsCount}
          </div>
          <div className="text-xs text-gray-500">transactions shown</div>
        </div>
      </div>
    </div>
  );
}
