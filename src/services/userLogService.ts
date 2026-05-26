import { supabase } from '@/integrations/supabase/client';
import { User, UserLog } from '@/types/auth';

// Action types for consistent logging
export const USER_ACTION_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  TRANSACTION_CREATE: 'transaction_create',
  TRANSACTION_UPDATE: 'transaction_update',
  TRANSACTION_DELETE: 'transaction_delete',
  PROFILE_UPDATE: 'profile_update',
  VIEW_CHANGE: 'view_change',
  EXPORT_PDF: 'export_pdf',
  CASHVAULT_DEPOSIT: 'cashvault_deposit',
  CASHVAULT_WITHDRAWAL: 'cashvault_withdrawal',
  SETTINGS_UPDATE: 'settings_update',
  CATEGORY_CREATE: 'category_create',
  PASSWORD_CHANGE: 'password_change',
  PROFILE_PICTURE_UPDATE: 'profile_picture_update',
  ANALYTICS_VIEW: 'analytics_view',
  SYSTEM_ERROR: 'system_error'
} as const;

export type UserActionType = typeof USER_ACTION_TYPES[keyof typeof USER_ACTION_TYPES];

interface LogUserActionParams {
  user: User | null;
  actionType: UserActionType;
  description: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log a user action to the database
 */
export const logUserAction = async ({
  user,
  actionType,
  description,
  details = {},
  ipAddress,
  userAgent
}: LogUserActionParams): Promise<void> => {
  if (!user) {
    console.warn('Cannot log user action: user is null');
    return;
  }

  // Check if user has an id field, if not, log a warning but continue
  if (!user.id) {
    console.warn('User object missing id field:', { user });
    // Don't return here, we'll try to log anyway with username
  }

  try {
    console.log('🔄 Attempting to log user action:', {
      username: user.username,
      userId: user.id,
      actionType,
      description,
      details
    });

    const logEntry = {
      user_id: user.id || null, // Allow null if id is missing
      username: user.username,
      action_type: actionType,
      action_description: description,
      details: details,
      ip_address: ipAddress,
      user_agent: userAgent,
      timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_logs')
      .insert(logEntry)
      .select();

    if (error) {
      console.error('❌ Error logging user action:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      console.error('Log entry that failed:', logEntry);
    } else {
      console.log('✅ User action logged successfully:', data);
    }
  } catch (error) {
    console.error('❌ Exception while logging user action:', error);
  }
};

/**
 * Get user logs for a specific user (for regular users to see their own logs)
 */
export const getUserLogs = async (userId: string, limit: number = 100): Promise<UserLog[]> => {
  try {
    console.log('🔄 Fetching user logs for user ID:', userId, 'with limit:', limit);

    // First, let's check if there are any logs for this user
    const { data: checkData, error: checkError } = await supabase
      .from('user_logs')
      .select('id, user_id, username')
      .eq('user_id', userId)
      .limit(5);

    console.log('🔍 Debug: Found logs for user ID', userId, ':', checkData?.length || 0, 'records');
    if (checkData && checkData.length > 0) {
      console.log('🔍 Sample logs:', checkData);
    }

    const { data, error } = await supabase
      .from('user_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching user logs:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return [];
    }

    console.log('✅ Successfully fetched user logs for user:', userId, '- Records:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('📋 First few logs:', data.slice(0, 3));
    }
    return data || [];
  } catch (error) {
    console.error('❌ Exception while fetching user logs:', error);
    return [];
  }
};

/**
 * Get all user logs (for admin users)
 */
export const getAllUserLogs = async (limit: number = 200): Promise<UserLog[]> => {
  try {
    console.log('🔄 Fetching all user logs with limit:', limit);

    const { data, error } = await supabase
      .from('user_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching all user logs:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return [];
    }

    console.log('✅ Successfully fetched user logs:', data?.length || 0, 'records');
    return data || [];
  } catch (error) {
    console.error('❌ Exception while fetching all user logs:', error);
    return [];
  }
};

/**
 * Get user logs filtered by action type
 */
export const getUserLogsByActionType = async (
  actionType: UserActionType,
  limit: number = 100
): Promise<UserLog[]> => {
  try {
    const { data, error } = await supabase
      .from('user_logs')
      .select('*')
      .eq('action_type', actionType)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user logs by action type:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user logs by action type:', error);
    return [];
  }
};

/**
 * Get user logs for a specific user filtered by action type
 */
export const getUserLogsByUserAndActionType = async (
  userId: string,
  actionType: UserActionType,
  limit: number = 100
): Promise<UserLog[]> => {
  try {
    const { data, error } = await supabase
      .from('user_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('action_type', actionType)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user logs by user and action type:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user logs by user and action type:', error);
    return [];
  }
};

/**
 * Get user logs within a date range
 */
export const getUserLogsByDateRange = async (
  startDate: string,
  endDate: string,
  userId?: string,
  limit: number = 200
): Promise<UserLog[]> => {
  try {
    let query = supabase
      .from('user_logs')
      .select('*')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user logs by date range:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user logs by date range:', error);
    return [];
  }
};

/**
 * Convenience functions for common user actions
 */

export const logLogin = (user: User) => {
  logUserAction({
    user,
    actionType: USER_ACTION_TYPES.LOGIN,
    description: `User ${user.username} logged in`,
    details: { role: user.role }
  });
};

export const logLogout = (user: User) => {
  logUserAction({
    user,
    actionType: USER_ACTION_TYPES.LOGOUT,
    description: `User ${user.username} logged out`,
    details: { role: user.role }
  });
};

export const logTransactionCreate = (user: User, transactionDetails: any) => {
  logUserAction({
    user,
    actionType: USER_ACTION_TYPES.TRANSACTION_CREATE,
    description: `Created ${transactionDetails.type} transaction: ZMW ${transactionDetails.amount} for ${transactionDetails.customer_name}`,
    details: transactionDetails
  });
};

export const logTransactionUpdate = (user: User, transactionDetails: any) => {
  logUserAction({
    user,
    actionType: USER_ACTION_TYPES.TRANSACTION_UPDATE,
    description: `Updated transaction: ${transactionDetails.customer_name}`,
    details: transactionDetails
  });
};

export const logTransactionDelete = (user: User, transactionDetails: any) => {
  logUserAction({
    user,
    actionType: USER_ACTION_TYPES.TRANSACTION_DELETE,
    description: `Deleted ${transactionDetails.type} transaction: ZMW ${transactionDetails.amount} for ${transactionDetails.customer_name}`,
    details: transactionDetails
  });
};

export const logViewChange = (user: User, fromView: string, toView: string) => {
  logUserAction({
    user,
    actionType: USER_ACTION_TYPES.VIEW_CHANGE,
    description: `Changed view from ${fromView} to ${toView}`,
    details: { fromView, toView }
  });
};

export const logProfileUpdate = (user: User, updateDetails: any) => {
  logUserAction({
    user,
    actionType: USER_ACTION_TYPES.PROFILE_UPDATE,
    description: `Updated profile information`,
    details: updateDetails
  });
};

export const logExportPDF = (user: User, exportDetails: any) => {
  logUserAction({
    user,
    actionType: USER_ACTION_TYPES.EXPORT_PDF,
    description: `Exported PDF report`,
    details: exportDetails
  });
};

export const logCashvaultAction = (user: User, actionType: 'deposit' | 'withdrawal', amount: number, details: any) => {
  const action = actionType === 'deposit' ? USER_ACTION_TYPES.CASHVAULT_DEPOSIT : USER_ACTION_TYPES.CASHVAULT_WITHDRAWAL;
  logUserAction({
    user,
    actionType: action,
    description: `Cash vault ${actionType}: ZMW ${amount}`,
    details: { amount, ...details }
  });
};

export const logAnalyticsView = (user: User, analyticsSection: string) => {
  logUserAction({
    user,
    actionType: USER_ACTION_TYPES.ANALYTICS_VIEW,
    description: `Viewed ${analyticsSection} analytics`,
    details: { section: analyticsSection }
  });
};

/**
 * Test function to manually create a user log entry
 */
export const testUserLogging = async (user: User) => {
  console.log('🧪 Testing user logging for user:', user.username);
  await logUserAction({
    user,
    actionType: USER_ACTION_TYPES.VIEW_CHANGE,
    description: `Test log entry for ${user.username}`,
    details: {
      test: true,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }
  });
};
