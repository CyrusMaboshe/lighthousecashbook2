/**
 * User Access Control Service
 * Handles user access revocation, time-based restrictions, and automatic blocking
 */

import { supabase } from '@/integrations/supabase/client';
import { parseISO, isAfter, isBefore, addDays } from 'date-fns';

export interface AccessControlSettings {
  access_revoked: boolean;
  access_expires_at?: string;
  access_granted_at?: string;
  payment_required: boolean;
  payment_due_date?: string;
  auto_block_enabled: boolean;
  grace_period_days: number;
}

export interface UserAccessStatus {
  hasAccess: boolean;
  reason?: 'active' | 'revoked' | 'expired' | 'payment_required' | 'blocked';
  expiresAt?: Date;
  paymentDueDate?: Date;
  gracePeriodEnds?: Date;
}

export class UserAccessControlService {
  /**
   * Check if a user has access to their account
   */
  static async checkUserAccess(userId: string): Promise<UserAccessStatus> {
    try {
      const { data: user, error } = await supabase
        .from('mt_company_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return { hasAccess: false, reason: 'blocked' };
      }

      // Check if access is manually revoked
      if (user.access_revoked) {
        return { hasAccess: false, reason: 'revoked' };
      }

      // Check if user is inactive
      if (!user.is_active) {
        return { hasAccess: false, reason: 'blocked' };
      }

      // Check if access has expired
      if (user.access_expires_at) {
        const expiryDate = parseISO(user.access_expires_at);
        if (isAfter(new Date(), expiryDate)) {
          // Auto-block expired users
          await this.blockUser(userId, 'Access expired');
          return { 
            hasAccess: false, 
            reason: 'expired',
            expiresAt: expiryDate
          };
        }
      }

      // Check payment requirements
      if (user.payment_required && user.payment_due_date) {
        const paymentDueDate = parseISO(user.payment_due_date);
        const gracePeriodEnds = addDays(paymentDueDate, user.grace_period_days || 7);
        
        if (isAfter(new Date(), gracePeriodEnds)) {
          // Auto-block users who haven't paid after grace period
          await this.blockUser(userId, 'Payment overdue');
          return { 
            hasAccess: false, 
            reason: 'payment_required',
            paymentDueDate,
            gracePeriodEnds
          };
        }
      }

      return { 
        hasAccess: true, 
        reason: 'active',
        expiresAt: user.access_expires_at ? parseISO(user.access_expires_at) : undefined,
        paymentDueDate: user.payment_due_date ? parseISO(user.payment_due_date) : undefined
      };

    } catch (error) {
      console.error('Error checking user access:', error);
      return { hasAccess: false, reason: 'blocked' };
    }
  }

  /**
   * Revoke user access
   */
  static async revokeUserAccess(userId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('mt_company_users')
        .update({
          access_revoked: true,
          is_active: false,
          access_revoked_at: new Date().toISOString(),
          access_revoked_reason: reason || 'Access revoked by admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log the access revocation
      await this.logAccessEvent(userId, 'access_revoked', { reason });

      return { success: true };

    } catch (error: any) {
      console.error('Error revoking user access:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore user access
   */
  static async restoreUserAccess(userId: string, expiryDays?: number): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        access_revoked: false,
        is_active: true,
        access_revoked_at: null,
        access_revoked_reason: null,
        access_restored_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Set new expiry date if specified
      if (expiryDays) {
        updateData.access_expires_at = addDays(new Date(), expiryDays).toISOString();
      }

      const { error } = await supabase
        .from('mt_company_users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log the access restoration
      await this.logAccessEvent(userId, 'access_restored', { expiryDays });

      return { success: true };

    } catch (error: any) {
      console.error('Error restoring user access:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set access expiry date
   */
  static async setAccessExpiry(userId: string, expiryDate: Date): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('mt_company_users')
        .update({
          access_expires_at: expiryDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log the expiry update
      await this.logAccessEvent(userId, 'expiry_updated', { expiryDate: expiryDate.toISOString() });

      return { success: true };

    } catch (error: any) {
      console.error('Error setting access expiry:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set payment requirements
   */
  static async setPaymentRequirement(
    userId: string, 
    required: boolean, 
    dueDate?: Date, 
    gracePeriodDays: number = 7
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('mt_company_users')
        .update({
          payment_required: required,
          payment_due_date: dueDate?.toISOString() || null,
          grace_period_days: gracePeriodDays,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log the payment requirement update
      await this.logAccessEvent(userId, 'payment_requirement_updated', { 
        required, 
        dueDate: dueDate?.toISOString(), 
        gracePeriodDays 
      });

      return { success: true };

    } catch (error: any) {
      console.error('Error setting payment requirement:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Block user automatically
   */
  static async blockUser(userId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('mt_company_users')
        .update({
          is_active: false,
          auto_blocked: true,
          auto_blocked_at: new Date().toISOString(),
          auto_blocked_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log the auto-block event
      await this.logAccessEvent(userId, 'auto_blocked', { reason });

      return { success: true };

    } catch (error: any) {
      console.error('Error blocking user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run automatic access control checks for all users
   */
  static async runAutomaticAccessControl(): Promise<{ processed: number; blocked: number; errors: string[] }> {
    try {
      const { data: users, error } = await supabase
        .from('mt_company_users')
        .select('*')
        .eq('is_active', true)
        .eq('access_revoked', false);

      if (error) {
        return { processed: 0, blocked: 0, errors: [error.message] };
      }

      let processed = 0;
      let blocked = 0;
      const errors: string[] = [];

      for (const user of users || []) {
        try {
          processed++;
          const accessStatus = await this.checkUserAccess(user.id);
          
          if (!accessStatus.hasAccess && accessStatus.reason !== 'active') {
            blocked++;
          }
        } catch (error: any) {
          errors.push(`Error processing user ${user.id}: ${error.message}`);
        }
      }

      return { processed, blocked, errors };

    } catch (error: any) {
      console.error('Error running automatic access control:', error);
      return { processed: 0, blocked: 0, errors: [error.message] };
    }
  }

  /**
   * Get users requiring attention (expiring soon, payment due, etc.)
   */
  static async getUsersRequiringAttention(): Promise<{
    expiringSoon: any[];
    paymentDue: any[];
    blocked: any[];
  }> {
    try {
      const threeDaysFromNow = addDays(new Date(), 3).toISOString();
      const now = new Date().toISOString();

      const [expiringSoonResult, paymentDueResult, blockedResult] = await Promise.all([
        // Users expiring in the next 3 days
        supabase
          .from('mt_company_users')
          .select('*, company:companies(display_name)')
          .eq('is_active', true)
          .eq('access_revoked', false)
          .not('access_expires_at', 'is', null)
          .lte('access_expires_at', threeDaysFromNow)
          .gte('access_expires_at', now),

        // Users with payment due
        supabase
          .from('mt_company_users')
          .select('*, company:companies(display_name)')
          .eq('payment_required', true)
          .lte('payment_due_date', now),

        // Recently blocked users
        supabase
          .from('mt_company_users')
          .select('*, company:companies(display_name)')
          .eq('is_active', false)
          .order('updated_at', { ascending: false })
          .limit(10)
      ]);

      return {
        expiringSoon: expiringSoonResult.data || [],
        paymentDue: paymentDueResult.data || [],
        blocked: blockedResult.data || []
      };

    } catch (error) {
      console.error('Error getting users requiring attention:', error);
      return { expiringSoon: [], paymentDue: [], blocked: [] };
    }
  }

  /**
   * Log access control events
   */
  private static async logAccessEvent(userId: string, event: string, metadata: any): Promise<void> {
    try {
      await supabase
        .from('user_access_logs')
        .insert({
          user_id: userId,
          event_type: event,
          metadata,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging access event:', error);
      // Don't throw error for logging failures
    }
  }
}

// Export for use in components
export default UserAccessControlService;
