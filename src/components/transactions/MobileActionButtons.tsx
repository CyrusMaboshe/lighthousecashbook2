
import { Plus, Minus, Vault } from 'lucide-react';

interface MobileActionButtonsProps {
  onAddCashIn: () => void;
  onAddCashOut: () => void;
  onWithdrawToCashVault: () => void;
}

export function MobileActionButtons({
  onAddCashIn,
  onAddCashOut,
  onWithdrawToCashVault
}: MobileActionButtonsProps) {
  return (
    <div className="mobile-button-group">
      <button
        onClick={onAddCashIn}
        className="mobile-action-button cash-in"
      >
        <Plus className="w-5 h-5" />
        <span>Cash In</span>
      </button>

      <button
        onClick={onAddCashOut}
        className="mobile-action-button cash-out"
      >
        <Minus className="w-5 h-5" />
        <span>Cash Out</span>
      </button>

      <button
        onClick={onWithdrawToCashVault}
        className="mobile-action-button vault"
      >
        <Vault className="w-4 h-4" />
        <span>Vault</span>
      </button>
    </div>
  );
}
