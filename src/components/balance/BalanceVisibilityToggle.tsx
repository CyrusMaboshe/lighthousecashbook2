
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useRealtimeBalanceVisibility } from '@/hooks/useRealtimeBalanceVisibility';
import { PasswordProtectionDialog } from '@/components/PasswordProtectionDialog';

export function BalanceVisibilityToggle() {
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
    console.log('Toggling balance visibility from', preferences.showBalances, 'to', newShowBalances);
    
    updatePreferences({ showBalances: newShowBalances });
    
    // Broadcast the change to all devices and users in real-time
    broadcastBalanceVisibilityChange(newShowBalances);
    
    setShowPasswordDialog(false);
  };

  if (loading) {
    return (
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" disabled>
          Loading...
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={handleToggleBalanceVisibility}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={loading}
        >
          {preferences.showBalances ? (
            <>
              <EyeOff className="w-4 h-4" />
              Hide Balances
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Show Balances
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
