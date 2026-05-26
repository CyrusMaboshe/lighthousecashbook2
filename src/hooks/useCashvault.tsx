import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { logCashvaultAction } from '@/services/userLogService';

export interface CashvaultBalance {
  id: string;
  current_balance: number;
  last_updated: string;
  updated_by: string;
  updated_by_user_id: string | null;
}

export interface CashvaultTransaction {
  id: string;
  date: string;
  time: string;
  action_type: 'deposit_from_main' | 'withdraw_from_vault';
  amount: number;
  note: string | null;
  initiating_user: string;
  initiating_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useCashvault = () => {
  const [balance, setBalance] = useState<CashvaultBalance | null>(null);
  const [transactions, setTransactions] = useState<CashvaultTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentUser, isAdmin, logAdminAction } = useAuth();

  const fetchBalance = async () => {
    try {
      console.log('Fetching cashvault balance...');
      const { data, error } = await supabase
        .from('cashvault_balance')
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No balance record found, attempting to create initial balance...');

          const { data: insertResult, error: insertError } = await supabase
            .from('cashvault_balance')
            .insert({
              current_balance: 0,
              updated_by: currentUser?.username || 'Admin',
              updated_by_user_id: null
            })
            .select()
            .maybeSingle();

          if (insertError) {
            console.error('Cannot create cashvault balance due to RLS policies:', insertError);
            setBalance({
              id: 'temp',
              current_balance: 0,
              last_updated: new Date().toISOString(),
              updated_by: currentUser?.username || 'Admin',
              updated_by_user_id: null
            });

            toast({
              title: "Cashvault Access Issue",
              description: "Cashvault needs proper database permissions. Please contact your system administrator.",
              variant: "destructive",
            });
          } else if (insertResult) {
            console.log('Initial balance created successfully:', insertResult);
            setBalance(insertResult);
          }
        } else {
          console.error('Error fetching cashvault balance:', error);
          // Set fallback balance to prevent crashes
          setBalance({
            id: 'error',
            current_balance: 0,
            last_updated: new Date().toISOString(),
            updated_by: 'System',
            updated_by_user_id: null
          });

          toast({
            title: "Error",
            description: "Failed to load Cash Vault balance. Using fallback data.",
            variant: "destructive",
          });
        }
      } else {
        console.log('Cashvault balance fetched successfully:', data);
        setBalance(data);
      }
    } catch (error) {
      console.error('Error in fetchBalance:', error);
      // Always set a fallback balance to prevent white screens
      setBalance({
        id: 'fallback',
        current_balance: 0,
        last_updated: new Date().toISOString(),
        updated_by: 'System',
        updated_by_user_id: null
      });

      toast({
        title: "Error",
        description: "Failed to load Cash Vault balance. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const fetchTransactions = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching cashvault transactions...');
      const { data, error } = await supabase
        .from('cashvault_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cashvault transactions:', error);
        // Set empty array to prevent crashes
        setTransactions([]);

        toast({
          title: "Error",
          description: "Failed to load Cash Vault transactions. Please refresh the page.",
          variant: "destructive",
        });
      } else {
        console.log('Cashvault transactions fetched:', data?.length || 0);
        setTransactions(data || []);
      }
    } catch (error) {
      console.error('Error fetching cashvault transactions:', error);
      // Always set empty array to prevent white screens
      setTransactions([]);

      toast({
        title: "Error",
        description: "Failed to load Cash Vault transactions. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const depositToCashvault = async (amount: number, note?: string, transactionDate?: Date) => {
    if (!isAdmin || !currentUser) {
      toast({
        title: "Access Denied",
        description: "Only administrators can manage the cashvault",
        variant: "destructive",
      });
      return;
    }

    if (!balance) {
      toast({
        title: "Error",
        description: "Cashvault balance not available",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`Attempting atomic deposit of ZMW ${amount} to cashvault`);

      const dateToUse = transactionDate || new Date();
      // Start transaction by using the database function that handles both operations atomically
      const { data: result, error } = await supabase.rpc('cash_out_to_cashvault', {
        amount_param: amount,
        note_param: note || 'Manual deposit to Cashvault',
        user_name: currentUser.username,
        transaction_date: dateToUse.toISOString().split('T')[0]
      });

      if (error) {
        console.error('Error in atomic cashvault deposit:', error);
        throw error;
      }

      if (result && result.success) {
        console.log('Cashvault deposit successful:', result);

        // Note: User action logging is now handled automatically by database triggers

        // Log admin action
        logAdminAction(`Deposited ZMW ${amount.toFixed(2)} to Cashvault${note ? ` - ${note}` : ''}`);

        toast({
          title: "Deposit Successful",
          description: `ZMW ${amount.toFixed(2)} deposited to Cashvault. Main balance was deducted.`,
        });

        // Refresh data
        await fetchBalance();
        await fetchTransactions();
      } else {
        throw new Error(result?.message || 'Deposit operation failed');
      }

    } catch (error) {
      console.error('Error depositing to cashvault:', error);
      toast({
        title: "Transaction Failed",
        description: "Transaction failed. No funds were moved.",
        variant: "destructive",
      });
    }
  };

  const withdrawFromCashvault = async (amount: number, note?: string, transactionDate?: Date) => {
    if (!isAdmin || !currentUser || !balance) {
      toast({
        title: "Access Denied",
        description: "Only administrators can manage the cashvault",
        variant: "destructive",
      });
      return;
    }

    if (amount > balance.current_balance) {
      toast({
        title: "Insufficient Funds",
        description: "Cannot withdraw more than current balance",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`Attempting atomic withdrawal of ZMW ${amount} from cashvault`);

      const dateToUse = transactionDate || new Date();
      // Use the database function for atomic withdrawal
      const { data: result, error } = await supabase.rpc('cash_out_from_cashvault', {
        amount_param: amount,
        note_param: note || 'Manual withdrawal from Cashvault',
        user_name: currentUser.username,
        transaction_date: dateToUse.toISOString().split('T')[0]
      });

      if (error) {
        console.error('Error in atomic cashvault withdrawal:', error);
        throw error;
      }

      if (result && result.success) {
        console.log('Cashvault withdrawal successful:', result);

        // Note: User action logging is now handled automatically by database triggers

        // Log admin action
        logAdminAction(`Withdrew ZMW ${amount.toFixed(2)} from Cashvault${note ? ` - ${note}` : ''}`);

        toast({
          title: "Withdrawal Successful",
          description: `ZMW ${amount.toFixed(2)} withdrawn from Cashvault`,
        });

        // Refresh data
        await fetchBalance();
        await fetchTransactions();
      } else {
        throw new Error(result?.message || 'Withdrawal operation failed');
      }

    } catch (error) {
      console.error('Error withdrawing from cashvault:', error);
      toast({
        title: "Transaction Failed",
        description: "Transaction failed. No funds were moved.",
        variant: "destructive",
      });
    }
  };

  const withdrawCashFromVault = async (amount: number, note?: string) => {
    if (!currentUser) {
      toast({
        title: "Access Denied",
        description: "You must be logged in to withdraw cash",
        variant: "destructive",
      });
      return;
    }

    if (!balance) {
      toast({
        title: "Error",
        description: "Cashvault balance not available",
        variant: "destructive",
      });
      return;
    }

    if (amount > balance.current_balance) {
      toast({
        title: "Insufficient Funds",
        description: "Cannot withdraw more than current balance",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`Attempting cash withdrawal of ZMW ${amount} from cashvault`);

      // Use the new database function for cash withdrawal (expense)
      const { data: result, error } = await supabase.rpc('withdraw_cash_from_vault', {
        amount_param: amount,
        note_param: note || 'Cash withdrawal from Cashvault',
        user_name: currentUser.username
      });

      if (error) {
        console.error('Error in cash withdrawal from cashvault:', error);
        throw error;
      }

      if (result && result.success) {
        console.log('Cash withdrawal from cashvault successful:', result);

        // Note: User action logging is now handled automatically by database triggers

        // Log admin action if user is admin
        if (isAdmin) {
          logAdminAction(`Cash withdrawal of ZMW ${amount.toFixed(2)} from Cashvault${note ? ` - ${note}` : ''}`);
        }

        toast({
          title: "Cash Withdrawal Successful",
          description: `ZMW ${amount.toFixed(2)} withdrawn from cashvault as cash expense.`,
        });

        // Refresh data
        await fetchBalance();
        await fetchTransactions();
      } else {
        throw new Error(result?.message || 'Cash withdrawal operation failed');
      }

    } catch (error) {
      console.error('Error withdrawing cash from cashvault:', error);
      toast({
        title: "Transaction Failed",
        description: "Failed to withdraw cash from cashvault. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportTransactionHistoryToPDF = async () => {
    if (!isAdmin || !balance || !transactions) {
      toast({
        title: "Export Failed",
        description: "Unable to export: insufficient permissions or data not available",
        variant: "destructive",
      });
      return;
    }

    try {
      const { exportCashvaultTransactionsToPDF } = await import('@/utils/cashvaultPdfExport');
      await exportCashvaultTransactionsToPDF(transactions, balance.current_balance);

      // Log the export action
      if (isAdmin) {
        logAdminAction(`Exported Cashvault transaction history (${transactions.length} transactions)`);
      }

      toast({
        title: "Export Successful",
        description: `Exported ${transactions.length} cashvault transactions to PDF`,
      });
    } catch (error) {
      console.error('Error exporting cashvault transactions:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export cashvault transactions to PDF",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    console.log('Setting up cashvault data fetching and real-time subscriptions...');

    const initializeData = async () => {
      await fetchBalance();
      await fetchTransactions();
    };

    initializeData();

    const channel = supabase
      .channel(`cashvault-changes-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cashvault_balance'
        },
        (payload) => {
          console.log('Cashvault balance changed:', payload);
          fetchBalance();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cashvault_transactions'
        },
        (payload) => {
          console.log('Cashvault transaction changed:', payload);
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up cashvault subscriptions');
      supabase.removeChannel(channel);
    };
  }, [isAdmin, currentUser]);

  return {
    balance,
    transactions,
    loading,
    depositToCashvault,
    withdrawFromCashvault,
    withdrawCashFromVault,
    exportTransactionHistoryToPDF,
    refetch: () => {
      fetchBalance();
      fetchTransactions();
    }
  };
};
