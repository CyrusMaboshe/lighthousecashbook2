
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';

interface BalanceOverrideNotificationProps {
  isSystemDepleted: boolean;
  originalBalance: number;
  effectiveBalance: number;
  showDetails?: boolean;
}

export function BalanceOverrideNotification({
  isSystemDepleted,
  originalBalance,
  effectiveBalance,
  showDetails = true
}: BalanceOverrideNotificationProps) {
  if (!isSystemDepleted || originalBalance === effectiveBalance) {
    return null;
  }

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <div className="space-y-2">
          <p className="font-medium">
            System Balance Adjustment
          </p>
          <p className="text-sm">
            Admin account withdrawal has affected system funds. Your effective balance has been adjusted to reflect available system liquidity.
          </p>
          {showDetails && (
            <div className="text-xs bg-orange-100 p-2 rounded mt-2">
              <p>Original Balance: ZMW {originalBalance.toFixed(2)}</p>
              <p>Effective Balance: ZMW {effectiveBalance.toFixed(2)}</p>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
