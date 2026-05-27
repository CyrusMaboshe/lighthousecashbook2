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
  companyId?: string;
}

export const useSavings = (options?: UseSavingsOptions) => {
  const [savingsBalance, setSavingsBalance] = useState<SavingsBalance | null>(null);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsersTransactions, setAllUsersTransactions] = useState<SavingsTransaction[]>([]);

  const userId = options?.userId;
  const isAdmin = options?.isAdmin || false;
  const companyId = options?.companyId;

  const fetchSavingsBalance = async () => {
    try {
      if (companyId) {
        // Company savings balance
        const { data, error } = await supabase
          .from('savings_balance')
          .select('*')
          .eq('tenant_id', companyId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching company savings balance:', error);
          throw error;
        }

        if (data) {
          const balanceData: SavingsBalance = {
            id: data.id,
            current_balance: data.current_balance || 0,
            last_updated: data.last_updated || new Date().toISOString(),
            updated_by: data.updated_by || 'System'
          };
          setSavingsBalance(balanceData);
        } else {
          // Initialize balance row for company
          const { data: newRow, error: initErr } = await supabase
            .from('savings_balance')
            .insert({
              tenant_id: companyId,
              current_balance: 0,
              updated_by: 'System'
            })
            .select()
            .maybeSingle();

          if (initErr) {
            console.error('Error initializing company savings balance:', initErr);
          }
          if (newRow) {
            const balanceData: SavingsBalance = {
              id: newRow.id,
              current_balance: newRow.current_balance || 0,
              last_updated: newRow.last_updated || new Date().toISOString(),
              updated_by: newRow.updated_by || 'System'
            };
            setSavingsBalance(balanceData);
          } else {
            setSavingsBalance(null);
          }
        }
      } else if (isAdmin) {
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

      // Filter by tenant_id if companyId is provided
      if (companyId) {
        query = query.eq('tenant_id', companyId);
      } else if (userId && !isAdmin) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (companyId) {
        setTransactions(data || []);
        setAllUsersTransactions(data || []);
      } else if (userId && !isAdmin) {
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
      
      if (companyId) {
        // Company savings deposit
        // 1. Get current balance of company
        const { data: balanceData, error: balErr } = await supabase
          .from('savings_balance')
          .select('*')
          .eq('tenant_id', companyId)
          .maybeSingle();

        if (balErr) throw balErr;

        const currentBalance = balanceData?.current_balance || 0;
        const newBalance = currentBalance + amount;

        // 2. Insert cash-out transaction in mt_company_transactions
        const { error: tErr } = await supabase
          .from('mt_company_transactions')
          .insert({
            company_id: companyId,
            type: 'cash-out',
            amount: amount,
            added_by: username,
            added_by_user_id: userId || '00000000-0000-0000-0000-000000000000',
            category_name: 'Savings Transfer',
            customer_name: 'Savings Account',
            details: `Transfer to Savings: ${description || 'Savings deposit'}`,
            date: dateToUse.toISOString().split('T')[0],
            time: dateToUse.toTimeString().split(' ')[0].substring(0, 5)
          });

        if (tErr) throw tErr;

        // 3. Record transaction in savings_transactions
        const { error: sErr } = await supabase
          .from('savings_transactions')
          .insert({
            tenant_id: companyId,
            action_type: 'deposit',
            amount: amount,
            description: description || 'Deposit to savings',
            initiating_user: username,
            initiating_user_id: userId || null,
            balance_before: currentBalance,
            balance_after: newBalance,
            date: dateToUse.toISOString().split('T')[0],
            time: dateToUse.toTimeString().split(' ')[0].substring(0, 5),
            user_id: userId || null
          });

        if (sErr) throw sErr;

        // 4. Update company savings balance
        const { error: uErr } = await supabase
          .from('savings_balance')
          .upsert({
            tenant_id: companyId,
            current_balance: newBalance,
            updated_by: username,
            updated_by_user_id: userId || null,
            last_updated: new Date().toISOString()
          }, { onConflict: 'tenant_id' });

        if (uErr) throw uErr;

        toast.success('Amount transferred to Savings successfully');
        await Promise.all([fetchSavingsBalance(), fetchTransactions()]);
        return true;
      }

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
      
      if (companyId) {
        // Company savings withdrawal
        // 1. Get current balance of company
        const { data: balanceData, error: balErr } = await supabase
          .from('savings_balance')
          .select('*')
          .eq('tenant_id', companyId)
          .maybeSingle();

        if (balErr) throw balErr;

        const currentBalance = balanceData?.current_balance || 0;
        if (currentBalance < amount) {
          toast.error('Insufficient balance in Savings');
          return false;
        }
        const newBalance = currentBalance - amount;

        // 2. Insert cash-in transaction in mt_company_transactions
        const { error: tErr } = await supabase
          .from('mt_company_transactions')
          .insert({
            company_id: companyId,
            type: 'cash-in',
            amount: amount,
            added_by: username,
            added_by_user_id: userId || '00000000-0000-0000-0000-000000000000',
            category_name: 'Savings Transfer',
            customer_name: 'Savings Account',
            details: `Withdrawal from Savings: ${description || 'Savings withdrawal'}`,
            date: dateToUse.toISOString().split('T')[0],
            time: dateToUse.toTimeString().split(' ')[0].substring(0, 5)
          });

        if (tErr) throw tErr;

        // 3. Record transaction in savings_transactions
        const { error: sErr } = await supabase
          .from('savings_transactions')
          .insert({
            tenant_id: companyId,
            action_type: 'withdrawal',
            amount: amount,
            description: description || 'Withdrawal from savings',
            initiating_user: username,
            initiating_user_id: userId || null,
            balance_before: currentBalance,
            balance_after: newBalance,
            date: dateToUse.toISOString().split('T')[0],
            time: dateToUse.toTimeString().split(' ')[0].substring(0, 5),
            user_id: userId || null
          });

        if (sErr) throw sErr;

        // 4. Update company savings balance
        const { error: uErr } = await supabase
          .from('savings_balance')
          .upsert({
            tenant_id: companyId,
            current_balance: newBalance,
            updated_by: username,
            updated_by_user_id: userId || null,
            last_updated: new Date().toISOString()
          }, { onConflict: 'tenant_id' });

        if (uErr) throw uErr;

        toast.success('Amount withdrawn from Savings successfully');
        await Promise.all([fetchSavingsBalance(), fetchTransactions()]);
        return true;
      }

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
    const channelName = companyId 
      ? `savings_transactions_changes-${companyId}`
      : `savings_transactions_changes-${Math.random().toString(36).substring(2, 9)}`;
      
    const transactionsChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'savings_transactions',
          filter: companyId ? `tenant_id=eq.${companyId}` : undefined
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
  }, [userId, isAdmin, companyId]);

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
