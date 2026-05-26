
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SystemBalanceState {
  adminBalance: number;
  isSystemDepleted: boolean;
  totalCashIn: number;
  totalCashOut: number;        // includes Reserve Investment Withdrawals (for history/display)
  operationalCashOut: number; // excludes Reserve Investment Withdrawals (for homepage outgoing card)
  netSystemBalance: number;
  totalSystemCashIn: number;
  totalSystemCashOut: number;
}

export interface BalanceOverride {
  id: string;
  username: string;
  user_id: string | null;
  original_balance: number;
  effective_balance: number;
  override_reason: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSystemBalance = () => {
  const [systemState, setSystemState] = useState<SystemBalanceState>({
    adminBalance: 0,
    isSystemDepleted: false,
    totalCashIn: 0,
    totalCashOut: 0,
    operationalCashOut: 0,
    netSystemBalance: 0,
    totalSystemCashIn: 0,
    totalSystemCashOut: 0,
  });
  const [balanceOverrides, setBalanceOverrides] = useState<BalanceOverride[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSystemBalanceStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('get_system_balance_status');

      if (error) {
        console.error('Supabase RPC error:', error);
        // Set fallback state to prevent crashes
        setSystemState({
          adminBalance: 0,
          isSystemDepleted: true,
          totalCashIn: 0,
          totalCashOut: 0,
          netSystemBalance: 0,
          totalSystemCashIn: 0,
          totalSystemCashOut: 0,
        });
        return;
      }

      if (data) {
        // REAL-TIME SYNC: Calculate admin totals from all transactions
        const newSystemState = {
          adminBalance: Number(data.admin_balance || 0),
          isSystemDepleted: Number(data.admin_balance || 0) <= 0,
          totalCashIn: Number(data.total_cash_in || 0),          // all cash-in
          totalCashOut: Number(data.total_cash_out || 0),        // all cash-outs incl. reserve (for history)
          operationalCashOut: Number(data.operational_cash_out || data.total_cash_out || 0), // excl. reserve (homepage outgoing)
          netSystemBalance: Number(data.net_system_balance || 0), // net excl. reserve
          totalSystemCashIn: Number(data.total_cash_in || 0),
          totalSystemCashOut: Number(data.total_cash_out || 0),
        };

        console.log('Real-time admin balance state updated:', newSystemState);
        setSystemState(newSystemState);
      } else {
        // Set fallback state if no data returned
        setSystemState({
          adminBalance: 0,
          isSystemDepleted: true,
          totalCashIn: 0,
          totalCashOut: 0,
          operationalCashOut: 0,
          netSystemBalance: 0,
          totalSystemCashIn: 0,
          totalSystemCashOut: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching system balance status:', error);
      // Set fallback state to prevent crashes
      setSystemState({
        adminBalance: 0,
        isSystemDepleted: true,
        totalCashIn: 0,
        totalCashOut: 0,
        operationalCashOut: 0,
        netSystemBalance: 0,
        totalSystemCashIn: 0,
        totalSystemCashOut: 0,
      });

      toast({
        title: "Warning",
        description: "Using fallback data due to connection issues",
        variant: "destructive",
      });
    }
  };

  const fetchBalanceOverrides = async () => {
    try {
      const { data, error } = await supabase
        .from('user_balance_overrides')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching balance overrides:', error);
        setBalanceOverrides([]); // Set empty array as fallback
        return;
      }

      setBalanceOverrides(data || []);
    } catch (error) {
      console.error('Error fetching balance overrides:', error);
      setBalanceOverrides([]); // Set empty array as fallback
      toast({
        title: "Warning",
        description: "Using fallback data for balance overrides",
        variant: "destructive",
      });
    }
  };

  // REAL-TIME SYNC: User effective balance calculation with admin constraint
  const getUserEffectiveBalance = async (username: string, userCashIn: number, userCashOut: number): Promise<number> => {
    console.log('Real-time sync: getUserEffectiveBalance called:', {
      username,
      userCashIn,
      userCashOut,
      adminNetBalance: systemState.netSystemBalance
    });

    // Calculate user_net_balance = user_total_cashin - user_total_cashout
    const userNetBalance = userCashIn - userCashOut;
    console.log('User net balance calculated:', userNetBalance);

    // EXTRA RULE: Real-time Admin Sync Control
    // If admin_net_balance < user_net_balance, set user_net_balance = admin_net_balance
    const effectiveBalance = Math.min(Math.max(userNetBalance, 0), Math.max(systemState.netSystemBalance, 0));
    
    console.log('Real-time sync applied:', {
      userNetBalance,
      adminNetBalance: systemState.netSystemBalance,
      effectiveBalance
    });

    return effectiveBalance;
  };

  // LOGIC FLOW: When a User Cashes In
  const processCashIn = async (username: string, amount: number) => {
    try {
      setLoading(true);
      
      console.log(`Real-time cash-in processing for ${username}: ZMW ${amount}`);
      console.log('1. Adding amount to user_total_cashin (handled by transaction)');
      console.log('2. Adding same amount to admin_total_cashin');
      console.log('3. Recalculating balances');
      
      // The transaction addition is handled by the transactions hook
      // We just need to refresh the system state to reflect the new admin totals
      await fetchSystemBalanceStatus();
      
      console.log('Real-time cash-in processed successfully');
      
      toast({
        title: "Cash In Processed",
        description: `ZMW ${amount.toFixed(2)} added successfully with real-time sync`,
      });
      
    } catch (error) {
      console.error('Error processing cash-in:', error);
      toast({
        title: "Error",
        description: "Failed to process cash-in transaction",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // LOGIC FLOW: When a User Cashes Out
  const processCashOut = async (username: string, amount: number, userNetBalance: number) => {
    try {
      setLoading(true);
      
      console.log(`Real-time cash-out processing for ${username}: ZMW ${amount}`);
      console.log('Validations:');
      console.log(`1. user_net_balance (${userNetBalance}) > 0: ${userNetBalance > 0}`);
      console.log(`2. admin_net_balance (${systemState.netSystemBalance}) >= amount (${amount}): ${systemState.netSystemBalance >= amount}`);
      
      // Validation: Ensure user_net_balance > 0
      if (userNetBalance <= 0) {
        throw new Error('Insufficient user balance for cash-out');
      }
      
      // Validation: Ensure admin_net_balance >= user_cashout_amount
      if (systemState.netSystemBalance < amount) {
        throw new Error('Insufficient admin backing funds for cash-out');
      }
      
      console.log('3. Deducting from user_net_balance (handled by transaction)');
      console.log('4. Adding to admin_total_cashout');
      console.log('5. Recalculating admin_net_balance');
      
      // The transaction addition is handled by the transactions hook
      // We just need to refresh the system state
      await fetchSystemBalanceStatus();
      
      console.log('Real-time cash-out processed successfully');
      
      toast({
        title: "Cash Out Processed",
        description: `ZMW ${amount.toFixed(2)} withdrawn successfully with real-time sync`,
      });
      
    } catch (error) {
      console.error('Error processing cash-out:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process cash-out transaction",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // LOGIC FLOW: When Admin Withdraws All Funds
  const adminWithdrawAll = async () => {
    try {
      setLoading(true);
      
      console.log('Real-time admin withdraw all processing');
      console.log('1. Setting admin_total_cashout = admin_total_cashin');
      console.log('2. Setting admin_net_balance = 0');
      console.log('3. All users will sync to admin_net_balance = 0 on next load');
      
      // Use cashvault function to withdraw all remaining balance
      const { data, error } = await supabase.rpc('cash_out_from_cashvault', {
        amount_param: systemState.netSystemBalance,
        note_param: 'Admin withdrawal of all funds - Real-time sync reset',
        user_name: 'Admin'
      });
      
      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      // Refresh system state to reflect the changes
      await fetchSystemBalanceStatus();
      
      console.log('Real-time admin withdraw all completed');
      console.log('All user accounts will show zero balance due to real-time sync control');
      
      toast({
        title: "All Funds Withdrawn",
        description: "Admin has withdrawn all funds. All user balances reset to zero via real-time sync.",
      });
      
    } catch (error) {
      console.error('Error in admin withdraw all:', error);
      toast({
        title: "Error",
        description: "Failed to withdraw all funds",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createBalanceOverride = async (
    username: string,
    originalBalance: number,
    effectiveBalance: number,
    reason: string
  ) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_balance_overrides')
        .insert({
          username,
          original_balance: originalBalance,
          effective_balance: effectiveBalance,
          override_reason: reason,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Balance Override Created",
        description: `Balance override created for ${username}`,
      });

      await fetchBalanceOverrides();
      return data;
    } catch (error) {
      console.error('Error creating balance override:', error);
      toast({
        title: "Error",
        description: "Failed to create balance override",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateBalanceOverride = async (
    id: string,
    updates: Partial<BalanceOverride>
  ) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_balance_overrides')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Balance Override Updated",
        description: "Balance override has been updated successfully",
      });

      await fetchBalanceOverrides();
      return data;
    } catch (error) {
      console.error('Error updating balance override:', error);
      toast({
        title: "Error",
        description: "Failed to update balance override",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSystemBalanceStatus(),
        fetchBalanceOverrides()
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Setting up real-time system balance synchronization');
    refetch();
    
    // REAL-TIME COMMUNICATION: Set up real-time listeners for balance changes
    const channel = supabase
      .channel(`real-time-balance-sync-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cashvault_balance'
        },
        () => {
          console.log('Real-time: Cashvault balance changed, syncing admin state');
          fetchSystemBalanceStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cashvault_transactions'
        },
        () => {
          console.log('Real-time: Cashvault transaction detected, syncing admin state');
          fetchSystemBalanceStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        () => {
          console.log('Real-time: Transaction detected, syncing admin state');
          fetchSystemBalanceStatus();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time balance sync listeners');
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    systemState,
    balanceOverrides,
    loading,
    getUserEffectiveBalance,
    processCashIn,
    processCashOut,
    adminWithdrawAll,
    createBalanceOverride,
    updateBalanceOverride,
    refetch
  };
};
