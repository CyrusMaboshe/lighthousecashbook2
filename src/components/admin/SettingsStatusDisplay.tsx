
import { Wifi } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function SettingsStatusDisplay() {
  let systemSettings;

  try {
    const authHook = useAuth();
    systemSettings = authHook.systemSettings;
  } catch (error) {
    console.error('Error in SettingsStatusDisplay hooks:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <Wifi className="w-4 h-4" />
          <span className="font-medium">Settings Status Error</span>
        </div>
        <p className="text-sm text-red-700">
          Failed to load system settings status. Please refresh the page.
        </p>
      </div>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <>
      {/* Real-time Status & Current Settings */}
      <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Wifi className="w-4 h-4 text-green-500" />
          <strong>Real-time Settings Active</strong>
        </div>
        <ul className="space-y-1">
          <li><strong>DEFAULT BEHAVIOR:</strong> Users can only see their own transactions</li>
          <li>• Balance Visibility: Users {systemSettings.showFullBalanceToUsers ? 'CAN' : 'CANNOT'} see full balances</li>
          <li>• Transaction Access: Users {systemSettings.showFullBalanceToUsers ? 'see ALL transactions' : 'see ONLY their own transactions'}</li>
          <li>• Visible Period: {monthNames[systemSettings.currentVisibleMonth]} {systemSettings.currentVisibleYear}</li>
          <li>• Admin Access: You can see all months, years, and transactions</li>
        </ul>
      </div>

      {/* Warning about immediate effect */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
        <p className="text-sm text-orange-800">
          <strong>Note:</strong> By default, all users can only see their own transactions. Changes take effect immediately for all users. The page will refresh automatically to sync settings across all connected devices.
        </p>
      </div>
    </>
  );
}
