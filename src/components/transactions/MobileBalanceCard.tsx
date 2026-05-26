
import { TrendingUp, TrendingDown, DollarSign, Camera } from 'lucide-react';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface MobileBalanceCardProps {
  cashIn: number;
  cashOut: number;
  netBalance: number;
  numberOfPictures: number;
}

export function MobileBalanceCard({
  cashIn,
  cashOut,
  netBalance,
  numberOfPictures
}: MobileBalanceCardProps) {
  const { preferences, loading } = useUserPreferences();

  // Show loading state while preferences are loading
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="mobile-balance-grid">
          {Array.from({ length: 4 }, (_, index) => index + 1).map((index) => (
            <div key={index} className="mobile-balance-item bg-gradient-to-br from-gray-400 to-gray-500">
              <div className="mobile-icon-wrapper">
                <div className="w-5 h-5 bg-white/20 rounded animate-pulse"></div>
              </div>
              <div className="mobile-balance-content">
                <div className="h-4 bg-white/20 rounded animate-pulse mb-2"></div>
                <div className="h-6 bg-white/20 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If balance visibility is off, show masked data
  if (!preferences.showBalances) {
    return (
      <div className="space-y-4">
        <div className="mobile-balance-grid">
          <div className="mobile-balance-item bg-gradient-to-br from-gray-500 to-gray-600">
            <div className="mobile-icon-wrapper">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="mobile-balance-content">
              <p className="mobile-balance-label">Cash In</p>
              <p className="mobile-balance-value">****</p>
            </div>
          </div>

          <div className="mobile-balance-item bg-gradient-to-br from-gray-500 to-gray-600">
            <div className="mobile-icon-wrapper">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div className="mobile-balance-content">
              <p className="mobile-balance-label">Cash Out</p>
              <p className="mobile-balance-value">****</p>
            </div>
          </div>

          <div className="mobile-balance-item bg-gradient-to-br from-gray-500 to-gray-600">
            <div className="mobile-icon-wrapper">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="mobile-balance-content">
              <p className="mobile-balance-label">Net Balance</p>
              <p className="mobile-balance-value">****</p>
            </div>
          </div>

          <div className="mobile-balance-item bg-gradient-to-br from-gray-500 to-gray-600">
            <div className="mobile-icon-wrapper">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div className="mobile-balance-content">
              <p className="mobile-balance-label">Pictures</p>
              <p className="mobile-balance-value">****</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Stats Section - Removed duplicate Total Balance display */}
      <div className="px-3 mb-2">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Stats</h3>
      </div>

      {/* Balance Grid */}
      <div className="mobile-balance-grid">
        <div className="mobile-balance-item bg-gradient-to-br from-green-500 to-emerald-600">
          <div className="mobile-icon-wrapper">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="mobile-balance-content">
            <p className="mobile-balance-label">Cash In</p>
            <p className="mobile-balance-value">
              ZMW <AnimatedNumber value={cashIn} decimals={2} />
            </p>
          </div>
        </div>

        <div className="mobile-balance-item bg-gradient-to-br from-red-500 to-rose-600">
          <div className="mobile-icon-wrapper">
            <TrendingDown className="w-5 h-5 text-white" />
          </div>
          <div className="mobile-balance-content">
            <p className="mobile-balance-label">Cash Out</p>
            <p className="mobile-balance-value">
              ZMW <AnimatedNumber value={cashOut} decimals={2} />
            </p>
          </div>
        </div>

        <div className="mobile-balance-item bg-gradient-to-br from-purple-500 to-violet-600">
          <div className="mobile-icon-wrapper">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div className="mobile-balance-content">
            <p className="mobile-balance-label">Pictures</p>
            <p className="mobile-balance-value">
              <AnimatedNumber value={numberOfPictures} decimals={0} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
