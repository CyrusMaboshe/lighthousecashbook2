
import React from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { AnimatedNumber } from '@/components/AnimatedNumber';

interface MobileHeaderProps {
  netBalance: number;
  currentUser: any;
}

export function MobileHeader({ netBalance, currentUser }: MobileHeaderProps) {
  const { preferences } = useUserPreferences();

  return (
    <div className="mobile-header-modern">
      {/* Main Balance Display - Clean and Professional */}
      <div className="mobile-balance-hero">
        <div className="mobile-balance-hero-content">
          <p className="mobile-balance-hero-label">Current Balance</p>
          <div className="mobile-balance-hero-amount">
            {preferences.showBalances ? (
              <>
                <span className="mobile-balance-currency">ZMW</span>
                <AnimatedNumber 
                  value={netBalance} 
                  decimals={2}
                  className="mobile-balance-number"
                />
              </>
            ) : (
              <span className="mobile-balance-masked">••••••</span>
            )}
          </div>
          <div className="mobile-balance-hero-status">
            <div className={`mobile-status-indicator ${
              netBalance > 0 ? 'positive' : netBalance < 0 ? 'negative' : 'neutral'
            }`}>
              {netBalance > 0 ? '↗' : netBalance < 0 ? '↘' : '→'}
            </div>
            <span className="mobile-status-text">
              {netBalance > 0 ? 'Positive' : netBalance < 0 ? 'Negative' : 'Balanced'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
