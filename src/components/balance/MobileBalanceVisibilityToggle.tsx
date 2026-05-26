
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useRealtimeBalanceVisibility } from '@/hooks/useRealtimeBalanceVisibility';
import { PasswordProtectionDialog } from '@/components/PasswordProtectionDialog';
import { Button } from '@/components/ui/button';

export function MobileBalanceVisibilityToggle() {
  const { currentUser } = useAuth();
  const { preferences, updatePreferences, loading } = useUserPreferences();
  const { broadcastBalanceVisibilityChange } = useRealtimeBalanceVisibility();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const handleToggleBalanceVisibility = () => {
    if (loading) return;
    setShowPasswordDialog(true);
  };

  const handlePasswordConfirm = () => {
    if (loading) return;

    const newShowBalances = !preferences.showBalances;
    console.log('Mobile: Toggling balance visibility from', preferences.showBalances, 'to', newShowBalances);

    updatePreferences({ showBalances: newShowBalances });

    // Broadcast the change to all devices and users in real-time
    broadcastBalanceVisibilityChange(newShowBalances);

    setShowPasswordDialog(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center mb-4">
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 border border-gray-300 rounded-lg" disabled>
          <span className="text-sm font-medium text-gray-500">Loading...</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-center mb-4">
        <Button
          onClick={handleToggleBalanceVisibility}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
          disabled={loading}
        >
          {preferences.showBalances ? (
            <>
              <EyeOff className="w-4 h-4" />
              <span className="text-sm font-medium">Hide Balances</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">Show Balances</span>
            </>
          )}
        </Button>
      </div>

      <PasswordProtectionDialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        onConfirm={handlePasswordConfirm}
        title="Password Required"
        description={`Please enter your login password (${currentUser?.username}) to toggle balance visibility.`}
        currentUser={currentUser}
      />
    </>
  );
}
