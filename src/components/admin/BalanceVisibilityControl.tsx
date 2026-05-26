
import { useState } from 'react';
import { Users, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function BalanceVisibilityControl() {
  const [isUpdating, setIsUpdating] = useState(false);

  let systemSettings, updateSystemSettings, logAdminAction, toast;

  try {
    const authHook = useAuth();
    const toastHook = useToast();

    systemSettings = authHook.systemSettings;
    updateSystemSettings = authHook.updateSystemSettings;
    logAdminAction = authHook.logAdminAction;
    toast = toastHook.toast;
  } catch (error) {
    console.error('Error in BalanceVisibilityControl hooks:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <Users className="w-4 h-4" />
          <span className="font-medium">Balance Visibility Control Error</span>
        </div>
        <p className="text-sm text-red-700">
          Failed to load balance visibility controls. Please refresh the page.
        </p>
      </div>
    );
  }

  const handleToggleFullBalance = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      const newValue = !systemSettings.showFullBalanceToUsers;
      
      // Update system settings
      updateSystemSettings({ 
        showFullBalanceToUsers: newValue 
      });
      
      // Log the action for real-time sync
      await logAdminAction(`Updated system settings: Balance visibility changed to ${newValue ? 'visible to all users' : 'restricted to own transactions'}`);
      
      toast({
        title: "Settings Updated",
        description: `Users can ${newValue ? 'now' : 'no longer'} see full balances and all transactions.`,
      });

      // Force a page refresh to ensure all components update immediately
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error updating balance visibility:', error);
      toast({
        title: "Error",
        description: "Failed to update balance visibility setting.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border-2 border-blue-200">
      <div className="flex items-center gap-3">
        <Users className="w-5 h-5 text-slate-600" />
        <div>
          <h4 className="font-medium text-slate-800">
            User Balance & Transaction Visibility
          </h4>
          <p className="text-sm text-slate-600">
            Control whether regular users can see full company balances and all transactions
          </p>
          <div className="text-xs text-slate-500 mt-1">
            <strong>DEFAULT:</strong> Users can only see their own transactions
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {systemSettings.showFullBalanceToUsers ? (
              <span className="text-green-600 font-medium">
                ✓ ENABLED: Users can see ALL transactions and full balances
              </span>
            ) : (
              <span className="text-orange-600 font-medium">
                ⚠ DEFAULT: Users can only see THEIR OWN transactions and balances
              </span>
            )}
          </div>
        </div>
      </div>
      <Button
        onClick={handleToggleFullBalance}
        variant="ghost"
        size="sm"
        className="p-0"
        disabled={isUpdating}
      >
        {systemSettings.showFullBalanceToUsers ? (
          <ToggleRight className="w-8 h-8 text-emerald-600" />
        ) : (
          <ToggleLeft className="w-8 h-8 text-slate-400" />
        )}
      </Button>
    </div>
  );
}
