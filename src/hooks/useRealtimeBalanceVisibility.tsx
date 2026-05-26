
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserPreferences } from './useUserPreferences';
import { useAuth } from './useAuth';

let globalChannel: any = null;
let listenerCount = 0;

export function useRealtimeBalanceVisibility() {
  const { preferences, updatePreferences } = useUserPreferences();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    console.log('Setting up real-time listener for balance visibility changes');
    
    // Listen for storage events (cross-tab synchronization)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `lighthouse-user-prefs-${currentUser.username}` && e.newValue) {
        try {
          const newPrefs = JSON.parse(e.newValue);
          updatePreferences(newPrefs);
        } catch (error) {
          console.error('Error parsing storage change:', error);
        }
      }
    };

    // Listen for custom events for real-time sync across devices
    const handleBalanceVisibilityChange = (event: CustomEvent) => {
      const { username, showBalances } = event.detail;
      if (username === currentUser.username) {
        updatePreferences({ showBalances });
      }
    };

    // Listen to local notifications from the single shared Supabase broadcast subscription
    const handleRemoteChange = (event: CustomEvent) => {
      const payload = event.detail;
      if (payload && payload.username === currentUser.username) {
        updatePreferences({ showBalances: payload.showBalances });
      }
    };

    // Set up listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('balanceVisibilityChanged', handleBalanceVisibilityChange as EventListener);
    window.addEventListener('supabaseBalanceVisibilityChange', handleRemoteChange as EventListener);

    listenerCount++;

    if (!globalChannel) {
      console.log('📡 Subscribing to global balance-visibility-sync channel');
      globalChannel = supabase
        .channel('balance-visibility-sync')
        .on('broadcast', { event: 'balance_visibility_change' }, (payload) => {
          console.log('Received balance visibility change broadcast:', payload);
          window.dispatchEvent(new CustomEvent('supabaseBalanceVisibilityChange', { detail: payload }));
        });
      globalChannel.subscribe();
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('balanceVisibilityChanged', handleBalanceVisibilityChange as EventListener);
      window.removeEventListener('supabaseBalanceVisibilityChange', handleRemoteChange as EventListener);
      
      listenerCount--;
      if (listenerCount === 0 && globalChannel) {
        console.log('🧹 Unsubscribing from global balance-visibility-sync channel');
        supabase.removeChannel(globalChannel);
        globalChannel = null;
      }
    };
  }, [currentUser, updatePreferences]);

  // Function to broadcast balance visibility changes
  const broadcastBalanceVisibilityChange = (showBalances: boolean) => {
    if (!currentUser) return;

    // Broadcast to other devices via Supabase
    supabase.channel('balance-visibility-sync').send({
      type: 'broadcast',
      event: 'balance_visibility_change',
      payload: {
        username: currentUser.username,
        showBalances,
        timestamp: new Date().toISOString()
      }
    });

    // Dispatch custom event for local tabs
    window.dispatchEvent(new CustomEvent('balanceVisibilityChanged', {
      detail: {
        username: currentUser.username,
        showBalances
      }
    }));
  };

  return {
    broadcastBalanceVisibilityChange
  };
}
