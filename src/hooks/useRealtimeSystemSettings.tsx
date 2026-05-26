
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeSystemSettings() {
  useEffect(() => {
    console.log('Setting up real-time listener for system settings changes on mobile');
    
    const channel = supabase
      .channel(`mobile-system-settings-changes-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_logs'
        },
        (payload) => {
          console.log('Mobile: Admin settings change detected:', payload);
          // This will trigger a refresh of settings across all connected clients
          if (payload.new && typeof payload.new === 'object' && 'action' in payload.new && 
              typeof payload.new.action === 'string' && payload.new.action.includes('Updated system settings')) {
            
            // Force immediate reload to sync settings in real-time
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
