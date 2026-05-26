import React from 'react';
import { Plus, Minus, Vault } from 'lucide-react';
import { ResponsiveFlex, ResponsiveButton } from '@/components/layout/ResponsiveLayout';

interface ResponsiveActionButtonsProps {
  onAddCashIn: () => void;
  onAddCashOut: () => void;
  onWithdrawToCashVault: () => void;
  isAdmin: boolean;
}

export function ResponsiveActionButtons({
  onAddCashIn,
  onAddCashOut,
  onWithdrawToCashVault,
  isAdmin
}: ResponsiveActionButtonsProps) {
  return (
    <ResponsiveFlex justify="center" gap="md" className="py-2">
      {/* Cash In Button */}
      <ResponsiveButton
        variant="primary"
        onClick={onAddCashIn}
        className="bg-green-600 hover:bg-green-700 focus:ring-green-500 flex-1 sm:flex-none sm:min-w-[140px]"
      >
        <Plus className="w-4 h-4" />
        <span>Cash In</span>
      </ResponsiveButton>

      {/* Cash Out Button */}
      <ResponsiveButton
        variant="primary"
        onClick={onAddCashOut}
        className="bg-red-600 hover:bg-red-700 focus:ring-red-500 flex-1 sm:flex-none sm:min-w-[140px]"
      >
        <Minus className="w-4 h-4" />
        <span>Cash Out</span>
      </ResponsiveButton>

      {/* Cash Vault Button - Admin Only */}
      {isAdmin && (
        <ResponsiveButton
          variant="primary"
          onClick={onWithdrawToCashVault}
          className="bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 flex-1 sm:flex-none sm:min-w-[140px]"
        >
          <Vault className="w-4 h-4" />
          <span className="hidden sm:inline">Cash Vault</span>
          <span className="sm:hidden">Vault</span>
        </ResponsiveButton>
      )}
    </ResponsiveFlex>
  );
}

// Alternative stacked layout for mobile
export function ResponsiveActionButtonsStacked({
  onAddCashIn,
  onAddCashOut,
  onWithdrawToCashVault,
  isAdmin
}: ResponsiveActionButtonsProps) {
  return (
    <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-4 sm:justify-center">
      {/* Cash In Button */}
      <ResponsiveButton
        variant="primary"
        onClick={onAddCashIn}
        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 focus:ring-green-500 sm:min-w-[140px]"
      >
        <Plus className="w-5 h-5" />
        <span>Add Cash In</span>
      </ResponsiveButton>

      {/* Cash Out Button */}
      <ResponsiveButton
        variant="primary"
        onClick={onAddCashOut}
        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-500 sm:min-w-[140px]"
      >
        <Minus className="w-5 h-5" />
        <span>Add Cash Out</span>
      </ResponsiveButton>

      {/* Cash Vault Button - Admin Only */}
      {isAdmin && (
        <ResponsiveButton
          variant="primary"
          onClick={onWithdrawToCashVault}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 sm:min-w-[140px]"
        >
          <Vault className="w-5 h-5" />
          <span>Withdraw to Cash Vault</span>
        </ResponsiveButton>
      )}
    </div>
  );
}

// Floating action buttons for mobile
export function ResponsiveFloatingActionButtons({
  onAddCashIn,
  onAddCashOut,
  onWithdrawToCashVault,
  isAdmin
}: ResponsiveActionButtonsProps) {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-3 sm:hidden z-50">
      {/* Cash In FAB */}
      <button
        onClick={onAddCashIn}
        className="w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        title="Add Cash In"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Cash Out FAB */}
      <button
        onClick={onAddCashOut}
        className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        title="Add Cash Out"
      >
        <Minus className="w-6 h-6" />
      </button>

      {/* Cash Vault FAB - Admin Only */}
      {isAdmin && (
        <button
          onClick={onWithdrawToCashVault}
          className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          title="Cash Vault"
        >
          <Vault className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
