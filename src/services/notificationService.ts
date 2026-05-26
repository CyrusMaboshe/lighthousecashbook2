
import { AdminNotification } from '@/types/auth';

export const createNotification = (
  notification: Omit<AdminNotification, 'id' | 'created_at'>
): AdminNotification => ({
  ...notification,
  id: Date.now().toString(),
  created_at: new Date().toISOString()
});
