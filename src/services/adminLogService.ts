
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';

export const logAdminAction = async (currentUser: User | null, action: string) => {
  if (currentUser?.role === 'admin') {
    try {
      console.log('🔄 Logging admin action:', action, 'by user:', currentUser.username);

      const logEntry = {
        performed_by: currentUser.username,
        performed_by_user_id: currentUser.id || null,
        action: action,
        timestamp: new Date().toISOString(),
        details: {
          timestamp: new Date().toISOString(),
          user_id: currentUser.id,
          username: currentUser.username
        }
      };

      const { data, error } = await supabase
        .from('admin_logs')
        .insert(logEntry)
        .select();

      if (error) {
        console.error('❌ Error logging admin action:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        console.error('Log entry that failed:', logEntry);
      } else {
        console.log('✅ Admin action logged successfully:', data);
      }
    } catch (error) {
      console.error('❌ Exception while logging admin action:', error);
    }
  } else {
    console.warn('⚠️ Cannot log admin action: user is not admin or is null', {
      user: currentUser?.username,
      role: currentUser?.role
    });
  }
};
