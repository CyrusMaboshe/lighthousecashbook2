import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Camera, Vault } from 'lucide-react';
import { Transaction } from '@/hooks/useTransactions';
import { ResponsiveGrid } from '@/components/layout/ResponsiveLayout';
import { SimpleCounter } from '@/components/ui/AnimatedCounter';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useCashvault } from '@/hooks/useCashvault';
import { cn } from '@/lib/utils';

interface ResponsiveBalanceCardsProps {
  transactions: Transaction[];
  userSpecificTransactions: Transaction[];
  mobileBalanceTransactions: Transaction[];
  isAdmin: boolean;
  systemSettings: any;
}

interface BalanceCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  masked?: boolean;
  subtitle?: string;
}

function BalanceCard({ title, value, icon: Icon, gradient, masked = false, subtitle }: BalanceCardProps) {
  return (
    <div className={cn(
      'mobile-balance-item',
      gradient,
      'relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-white/20'
    )}>
      <div className="mobile-icon-wrapper">
        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="mobile-balance-content">
        <p className="mobile-balance-label font-semibold text-white/90">{title}</p>
        <p className="mobile-balance-value font-bold text-white">
          {masked ? '••••••' : (
            typeof value === 'number' ? (
              <SimpleCounter
                amount={value}
                currency="ZMW"
                className="font-bold text-white"
                decimals={2}
              />
            ) : (
              value
            )
          )}
        </p>
        {subtitle && (
          <p className="text-xs sm:text-sm text-white/90 font-medium mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Enhanced decorative background pattern */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
        <Icon className="w-full h-full" />
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
    </div>
  );
}

export function ResponsiveBalanceCards({
  transactions,
  userSpecificTransactions,
  mobileBalanceTransactions,
  isAdmin,
  systemSettings
}: ResponsiveBalanceCardsProps) {
  const { preferences, loading } = useUserPreferences();
  const { balance: cashVaultBalanceObj } = useCashvault();
  const cashVaultBalance = cashVaultBalanceObj?.current_balance || 0;

  // Calculate balances based on admin/user context
  const balanceTransactions = isAdmin ? mobileBalanceTransactions : userSpecificTransactions;
  
  const cashIn = balanceTransactions
    .filter(t => t.type === 'cash-in')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const cashOut = balanceTransactions
    .filter(t => t.type === 'cash-out')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0); // Use absolute value for consistent cash-out calculation
    
  const cashOutOperational = balanceTransactions
    .filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    
  const netBalance = cashIn - cashOutOperational;
  
  const totalPictures = balanceTransactions
    .filter(t => t.type === 'cash-in')
    .reduce((sum, t) => sum + (Number(t.number_of_pictures) || 0), 0);

  // Check if balances should be masked
  const shouldMaskBalances = !preferences.showBalances && !loading;

  const balanceCards = [
    {
      title: 'Cash In',
      value: cashIn,
      icon: TrendingUp,
      gradient: 'bg-gradient-to-br from-green-700 to-green-800'
    },
    {
      title: 'Cash Out',
      value: cashOut,
      icon: TrendingDown,
      gradient: 'bg-gradient-to-br from-red-700 to-red-800'
    },
    {
      title: 'Net Balance',
      value: netBalance,
      icon: DollarSign,
      gradient: netBalance >= 0
        ? 'bg-gradient-to-br from-emerald-700 to-emerald-800'
        : 'bg-gradient-to-br from-orange-600 to-red-600'
    },
    {
      title: 'Pictures',
      value: totalPictures,
      icon: Camera,
      gradient: 'bg-gradient-to-br from-purple-700 to-purple-800'
    }
  ];

  // Add Cash Vault card for admin users
  if (isAdmin) {
    balanceCards.push({
      title: 'Cash Vault',
      value: cashVaultBalance,
      icon: Vault,
      gradient: 'bg-gradient-to-br from-indigo-700 to-indigo-800'
    });
  }

  return (
    <div className="mobile-balance-grid">
      {balanceCards.map((card, index) => (
        <BalanceCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          gradient={card.gradient}
          masked={shouldMaskBalances}
        />
      ))}
    </div>
  );
}

// Alternative grid-based layout for larger screens
export function ResponsiveBalanceCardsGrid({
  transactions,
  userSpecificTransactions,
  mobileBalanceTransactions,
  isAdmin,
  systemSettings
}: ResponsiveBalanceCardsProps) {
  const { preferences, loading } = useUserPreferences();
  const { balance: cashVaultBalanceObj } = useCashvault();
  const cashVaultBalance = cashVaultBalanceObj?.current_balance || 0;

  // Calculate balances (same logic as above)
  const balanceTransactions = isAdmin ? mobileBalanceTransactions : userSpecificTransactions;
  
  const cashIn = balanceTransactions
    .filter(t => t.type === 'cash-in')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const cashOut = balanceTransactions
    .filter(t => t.type === 'cash-out')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0); // Use absolute value for consistent cash-out calculation
    
  const cashOutOperational = balanceTransactions
    .filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    
  const netBalance = cashIn - cashOutOperational;
  
  const totalPictures = balanceTransactions
    .filter(t => t.type === 'cash-in')
    .reduce((sum, t) => sum + (Number(t.number_of_pictures) || 0), 0);

  const shouldMaskBalances = !preferences.showBalances && !loading;

  const balanceCards = [
    {
      title: 'Cash In',
      value: cashIn,
      icon: TrendingUp,
      gradient: 'bg-gradient-to-br from-green-700 to-green-800'
    },
    {
      title: 'Cash Out',
      value: cashOut,
      icon: TrendingDown,
      gradient: 'bg-gradient-to-br from-red-700 to-red-800'
    },
    {
      title: 'Net Balance',
      value: netBalance,
      icon: DollarSign,
      gradient: netBalance >= 0
        ? 'bg-gradient-to-br from-emerald-700 to-emerald-800'
        : 'bg-gradient-to-br from-orange-600 to-red-600'
    },
    {
      title: 'Pictures',
      value: totalPictures,
      icon: Camera,
      gradient: 'bg-gradient-to-br from-purple-700 to-purple-800'
    }
  ];

  if (isAdmin) {
    balanceCards.push({
      title: 'Cash Vault',
      value: cashVaultBalance,
      icon: Vault,
      gradient: 'bg-gradient-to-br from-indigo-700 to-indigo-800'
    });
  }

  return (
    <ResponsiveGrid columns={isAdmin ? 5 : 4} gap="md" className="mb-6">
      {balanceCards.map((card) => (
        <BalanceCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          gradient={card.gradient}
          masked={shouldMaskBalances}
        />
      ))}
    </ResponsiveGrid>
  );
}
