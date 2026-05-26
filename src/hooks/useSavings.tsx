import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SavingsBalance {
  id: string;
  current_balance: number;
  last_updated: string;
  updated_by: string;
  user_id?: string;
}

interface SavingsTransaction {
  id: string;
  action_type: 'deposit' | 'withdrawal';
  amount: number;
  description: string | null;
  initiating_user: string;
  balance_before: number;
  balance_after: number;
  date: string;
  time: string;
  created_at: string;
  user_id?: string;
}

interface UseSavingsOptions {
  userId?: string;
  isAdmin?: boolean;
}

export const useSavings = (options?: UseSavingsOptions) => {
  const [savingsBalance, setSavingsBalance] = useState<SavingsBalance | null>(null);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsersTransactions, setAllUsersTransactions] = useState<SavingsTransaction[]>([]);

  const userId = options?.userId;
  const isAdmin = options?.isAdmin || false;

  const fetchSavingsBalance = async () => {
    try {
      // Admin users see system-wide balance; regular users see their own
      if (isAdmin) {
        // Admin: use system-wide balance calculation
        const { data, error } = await supabase.rpc('get_current_savings_balance');

        if (error) {
          console.error('Error fetching system savings balance:', error);
          throw error;
        }

        if (data) {
          const balanceData: SavingsBalance = {
            id: 'system-calculated',
            current_balance: data.current_balance || 0,
            last_updated: data.last_updated || new Date().toISOString(),
            updated_by: 'System'
          };
          setSavingsBalance(balanceData);
        } else {
          setSavingsBalance(null);
        }
      } else if (userId) {
        // Regular user: user-specific balance
        const { data, error } = await supabase.rpc('get_user_savings_balance', {
          p_user_id: userId
        });

        if (error) {
          console.error('Error fetching user savings balance:', error);
          throw error;
        }

        if (data) {
          const balanceData: SavingsBalance = {
            id: 'user-calculated',
            current_balance: data.current_balance || 0,
            last_updated: data.last_updated || new Date().toISOString(),
            updated_by: 'System',
            user_id: userId
          };
          setSavingsBalance(balanceData);
        }
      } else {
        // Fallback to system balance
        const { data, error } = await supabase.rpc('get_current_savings_balance');

        if (error) {
          console.error('Error fetching savings balance:', error);
          throw error;
        }

        if (data) {
          const balanceData: SavingsBalance = {
            id: 'calculated',
            current_balance: data.current_balance || 0,
            last_updated: data.last_updated || new Date().toISOString(),
            updated_by: 'System'
          };
          setSavingsBalance(balanceData);
        } else {
          setSavingsBalance(null);
        }
      }
    } catch (error) {
      console.error('Error in fetchSavingsBalance:', error);
      toast.error('Failed to fetch savings balance');
    }
  };

  const fetchTransactions = async () => {
    try {
      let query = supabase
        .from('savings_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by user_id if provided (non-admin users see only their transactions)
      if (userId && !isAdmin) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (userId && !isAdmin) {
        setTransactions(data || []);
      } else if (isAdmin) {
        // Admin sees all transactions
        setAllUsersTransactions(data || []);
        // Also set regular transactions for display
        setTransactions(data || []);
      } else {
        setTransactions(data || []);
      }
    } catch (error) {
      console.error('Error fetching savings transactions:', error);
      toast.error('Failed to fetch savings transactions');
    }
  };

  const depositToSavings = async (
    amount: number, 
    description: string, 
    username: string, 
    transactionDate?: Date
  ) => {
    try {
      const dateToUse = transactionDate || new Date();
      
      // Admin uses system-wide deposit; regular users use user-specific
      if (isAdmin) {
        // Admin: use system-wide deposit function
        const { data, error } = await supabase.rpc('deposit_to_savings', {
          amount_param: amount,
          description_param: description,
          user_name: username,
          transaction_date: dateToUse.toISOString().split('T')[0]
        });

        if (error) throw error;

        const result = data as { success: boolean; message: string };

        if (result.success) {
          toast.success(result.message);
          await Promise.all([fetchSavingsBalance(), fetchTransactions()]);
          return true;
        } else {
          toast.error(result.message);
          return false;
        }
      } else if (userId) {
        // Regular user: user-specific deposit function
        const { data, error } = await supabase.rpc('user_deposit_to_savings', {
          p_user_id: userId,
          amount_param: amount,
          description_param: description,
          user_name: username,
          transaction_date: dateToUse.toISOString().split('T')[0]
        });

        if (error) throw error;

        const result = data as { success: boolean; message: string };

        if (result.success) {
          toast.success(result.message);
          await Promise.all([fetchSavingsBalance(), fetchTransactions()]);
          return true;
        } else {
          toast.error(result.message);
          return false;
        }
      } else {
        // Fallback to system deposit
        const { data, error } = await supabase.rpc('deposit_to_savings', {
          amount_param: amount,
          description_param: description,
          user_name: username,
          transaction_date: dateToUse.toISOString().split('T')[0]
        });

        if (error) throw error;

        const result = data as { success: boolean; message: string };

        if (result.success) {
          toast.success(result.message);
          await Promise.all([fetchSavingsBalance(), fetchTransactions()]);
          return true;
        } else {
          toast.error(result.message);
          return false;
        }
      }
    } catch (error: any) {
      console.error('Error depositing to savings:', error);
      toast.error(error.message || 'Failed to deposit to savings');
      return false;
    }
  };

  const withdrawFromSavings = async (
    amount: number, 
    description: string, 
    username: string, 
    transactionDate?: Date
  ) => {
    try {
      const dateToUse = transactionDate || new Date();
      
      // Admin uses system-wide withdraw; regular users use user-specific
      if (isAdmin) {
        // Admin: use system-wide withdraw function
        const { data, error } = await supabase.rpc('withdraw_from_savings', {
          amount_param: amount,
          description_param: description,
          user_name: username,
          transaction_date: dateToUse.toISOString().split('T')[0]
        });

        if (error) throw error;

        const result = data as { success: boolean; message: string };

        if (result.success) {
          toast.success(result.message);
          await Promise.all([fetchSavingsBalance(), fetchTransactions()]);
          return true;
        } else {
          toast.error(result.message);
          return false;
        }
      } else if (userId) {
        // Regular user: user-specific withdraw function
        const { data, error } = await supabase.rpc('user_withdraw_from_savings', {
          p_user_id: userId,
          amount_param: amount,
          description_param: description,
          user_name: username,
          transaction_date: dateToUse.toISOString().split('T')[0]
        });

        if (error) throw error;

        const result = data as { success: boolean; message: string };

        if (result.success) {
          toast.success(result.message);
          await Promise.all([fetchSavingsBalance(), fetchTransactions()]);
          return true;
        } else {
          toast.error(result.message);
          return false;
        }
      } else {
        // Fallback to system withdraw
        const { data, error } = await supabase.rpc('withdraw_from_savings', {
          amount_param: amount,
          description_param: description,
          user_name: username,
          transaction_date: dateToUse.toISOString().split('T')[0]
        });

        if (error) throw error;

        const result = data as { success: boolean; message: string };

        if (result.success) {
          toast.success(result.message);
          await Promise.all([fetchSavingsBalance(), fetchTransactions()]);
          return true;
        } else {
          toast.error(result.message);
          return false;
        }
      }
    } catch (error: any) {
      console.error('Error withdrawing from savings:', error);
      toast.error(error.message || 'Failed to withdraw from savings');
      return false;
    }
  };

  // Admin function to get all savings summary
  const getAdminSavingsSummary = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_all_savings');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching admin savings summary:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSavingsBalance(), fetchTransactions()]);
      setLoading(false);
    };

    loadData();

    // Set up real-time subscription for savings transactions
    const transactionsChannel = supabase
      .channel(`savings_transactions_changes-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'savings_transactions'
        },
        () => {
          fetchSavingsBalance();
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionsChannel);
    };
  }, [userId, isAdmin]);

  return {
    savingsBalance,
    transactions,
    allUsersTransactions,
    loading,
    depositToSavings,
    withdrawFromSavings,
    getAdminSavingsSummary,
    refetch: async () => {
      await Promise.all([fetchSavingsBalance(), fetchTransactions()]);
    }
  };
};
