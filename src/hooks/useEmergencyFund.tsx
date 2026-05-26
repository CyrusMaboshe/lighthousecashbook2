import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface EmergencyFundBalance {
    id: string;
    current_balance: number;
    last_updated: string;
    updated_by: string;
    updated_by_user_id: string | null;
}

export interface EmergencyFundTransaction {
    id: string;
    date: string;
    time: string;
    action_type: 'deposit' | 'withdrawal';
    amount: number;
    note: string | null;
    initiating_user: string;
    initiating_user_id: string | null;
    created_at: string;
    updated_at: string;
}

export const useEmergencyFund = () => {
    const [balance, setBalance] = useState<EmergencyFundBalance | null>(null);
    const [transactions, setTransactions] = useState<EmergencyFundTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { currentUser, isAdmin, logAdminAction } = useAuth();

    const fetchBalance = async () => {
        try {
            console.log('[EmergencyFund] Fetching balance records...');
            // Fetch ALL records to detect duplicates
            const { data: allRecords, error } = await supabase
                .from('emergency_fund_balance')
                .select('*')
                .order('last_updated', { ascending: false });

            if (error) {
                console.error('[EmergencyFund] Error fetching balance:', error);
                setBalance({
                    id: 'fallback',
                    current_balance: 0,
                    last_updated: new Date().toISOString(),
                    updated_by: 'System Error',
                    updated_by_user_id: null
                });
                return;
            }

            if (!allRecords || allRecords.length === 0) {
                console.log('[EmergencyFund] ⚠️ No balance records found in DB');
                setBalance({
                    id: 'initial',
                    current_balance: 0,
                    last_updated: new Date().toISOString(),
                    updated_by: 'System',
                    updated_by_user_id: null
                });
            } else {
                if (allRecords.length > 1) {
                    console.warn(`[EmergencyFund] 🚨 DETECTED ${allRecords.length} DUPLICATE BALANCE RECORDS!`, allRecords);
                    // Pick the record with the HIGHEST balance (not necessarily the latest by date)
                    // This avoids picking a stale zero-balance row that was inserted as a placeholder
                    const bestRecord = allRecords.reduce((best, current) =>
                        (Number(current.current_balance) > Number(best.current_balance)) ? current : best
                        , allRecords[0]);
                    console.log('[EmergencyFund] ✅ Using highest balance record:', bestRecord);
                    setBalance(bestRecord);
                } else {
                    console.log('[EmergencyFund] ✅ Balance fetched:', allRecords[0]);
                    setBalance(allRecords[0]);
                }
            }
        } catch (error) {
            console.error('[EmergencyFund] Exception in fetchBalance:', error);
            setBalance({
                id: 'exception-fallback',
                current_balance: 0,
                last_updated: new Date().toISOString(),
                updated_by: 'Error',
                updated_by_user_id: null
            });
        }
    };


    const fetchTransactions = async () => {
        try {
            console.log('[EmergencyFund] Fetching transactions...');
            const { data, error } = await supabase
                .from('emergency_fund_transactions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[EmergencyFund] Error fetching transactions:', error);
                setTransactions([]);
            } else {
                console.log('[EmergencyFund] ✅ Transactions fetched:', data?.length || 0, 'records');
                setTransactions(data || []);
            }
        } catch (error) {
            console.error('[EmergencyFund] Exception in fetchTransactions:', error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const depositToEmergencyFund = async (amount: number, note?: string, transactionDate?: Date) => {
        if (!currentUser) return;

        try {
            const dateToUse = transactionDate || new Date();
            console.log('[EmergencyFund] Initiating deposit:', { amount, note, date: dateToUse.toISOString().split('T')[0], user: currentUser.username });

            // Updated to match the expected signature: (amount_param, note_param, transaction_date, user_username)
            const { data: result, error } = await supabase.rpc('deposit_to_emergency_fund', {
                amount_param: amount,
                note_param: note || 'Deposit to Emergency Fund',
                transaction_date: dateToUse.toISOString().split('T')[0],
                user_username: currentUser.username
            });

            console.log('[EmergencyFund] RPC full response:', JSON.stringify({ result, error }));

            if (error) {
                console.error('[EmergencyFund] ❌ RPC error:', error.message, error.details, error.hint);
                throw error;
            }

            if (result && result.success) {
                console.log('[EmergencyFund] ✅ Deposit successful, new balance:', result.new_balance);

                if (isAdmin) {
                    logAdminAction(`Deposited ZMW ${amount.toFixed(2)} to Emergency Fund${note ? ` - ${note}` : ''}`);
                }

                toast({
                    title: "Deposit Successful",
                    description: `ZMW ${amount.toFixed(2)} deposited to Emergency Fund. New balance: ZMW ${Number(result.new_balance).toFixed(2)}`,
                });

                await fetchBalance();
                await fetchTransactions();
                return true;
            } else {
                const errMsg = result?.message || 'Deposit failed - unknown error';
                console.error('[EmergencyFund] ❌ Deposit RPC returned failure:', errMsg, result);
                throw new Error(errMsg);
            }
        } catch (error: any) {
            console.error('[EmergencyFund] Exception during deposit:', error);
            toast({
                title: "Transaction Failed",
                description: error.message || "Failed to deposit funds.",
                variant: "destructive",
            });
            return false;
        }
    };

    const withdrawFromEmergencyFund = async (amount: number, note?: string, transactionDate?: Date) => {
        if (!currentUser) return;

        try {
            const dateToUse = transactionDate || new Date();
            // Updated to match the expected signature: (amount_param, note_param, transaction_date, user_username)
            const { data: result, error } = await supabase.rpc('withdraw_from_emergency_fund', {
                amount_param: amount,
                note_param: note || 'Withdrawal from Emergency Fund',
                transaction_date: dateToUse.toISOString().split('T')[0],
                user_username: currentUser.username
            });

            if (error) throw error;

            if (result && result.success) {
                if (isAdmin) {
                    logAdminAction(`Withdrew ZMW ${amount.toFixed(2)} from Emergency Fund to main account${note ? ` - ${note}` : ''}`);
                }

                toast({
                    title: "Withdrawal Successful",
                    description: `ZMW ${amount.toFixed(2)} withdrawn back to main account.`,
                });

                await fetchBalance();
                await fetchTransactions();
                return true;
            } else {
                throw new Error(result?.message || 'Withdrawal failed');
            }
        } catch (error: any) {
            console.error('Error withdrawing from emergency fund:', error);
            toast({
                title: "Transaction Failed",
                description: error.message || "Failed to withdraw funds.",
                variant: "destructive",
            });
            return false;
        }
    };

    const withdrawCashFromEmergencyFund = async (amount: number, note?: string, transactionDate?: Date) => {
        if (!currentUser) return;

        try {
            const dateToUse = transactionDate || new Date();
            // Updated to match the expected signature: (amount_param, note_param, transaction_date, user_username)
            const { data: result, error } = await supabase.rpc('withdraw_cash_from_emergency_fund', {
                amount_param: amount,
                note_param: note || 'Direct withdrawal from Emergency Fund',
                transaction_date: dateToUse.toISOString().split('T')[0],
                user_username: currentUser.username
            });

            if (error) throw error;

            if (result && result.success) {
                if (isAdmin) {
                    logAdminAction(`Direct cash withdrawal of ZMW ${amount.toFixed(2)} from Emergency Fund${note ? ` - ${note}` : ''}`);
                }

                toast({
                    title: "Direct Withdrawal Successful",
                    description: `ZMW ${amount.toFixed(2)} withdrawn from Emergency Fund as cash.`,
                });

                await fetchBalance();
                await fetchTransactions();
                return true;
            } else {
                throw new Error(result?.message || 'Withdrawal failed');
            }
        } catch (error: any) {
            console.error('Error with direct withdrawal from emergency fund:', error);
            toast({
                title: "Transaction Failed",
                description: error.message || "Failed to withdraw cash.",
                variant: "destructive",
            });
            return false;
        }
    };

    const deleteEmergencyTransaction = async (id: string) => {
        if (!isAdmin) {
            toast({
                title: "Unauthorized",
                description: "Only administrators can delete transactions.",
                variant: "destructive",
            });
            return false;
        }

        try {
            const transactionToDelete = transactions.find(t => t.id === id);
            if (!transactionToDelete) throw new Error("Transaction not found");

            // 1. Delete the EF transaction record
            const { error: deleteError } = await supabase
                .from('emergency_fund_transactions')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            // 2. Adjust balance
            const balanceAdjustment = transactionToDelete.action_type === 'deposit'
                ? -transactionToDelete.amount
                : transactionToDelete.amount;

            const { error: balanceError } = await supabase
                .from('emergency_fund_balance')
                .update({
                    current_balance: (balance.current_balance || 0) + balanceAdjustment,
                    last_updated: new Date().toISOString()
                })
                .eq('id', balance.id);

            if (balanceError) console.error('Error updating balance after delete:', balanceError);

            // 3. Try to find and delete the corresponding main transaction
            // Main transactions for EF have category 'Emergency Fund Transfer'
            const { data: mainTx } = await supabase
                .from('transactions')
                .select('id')
                .eq('date', transactionToDelete.date)
                .eq('amount', transactionToDelete.amount)
                .ilike('category_name', '%Emergency Fund%')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (mainTx) {
                await supabase.from('transactions').delete().eq('id', mainTx.id);
            }

            logAdminAction(`Deleted EF transaction: ZMW ${transactionToDelete.amount} - ${transactionToDelete.action_type}`);
            toast({ title: "Transaction Deleted", description: "Emergency fund history and balance updated." });

            await fetchBalance();
            await fetchTransactions();
            return true;
        } catch (error: any) {
            console.error('Error deleting EF transaction:', error);
            toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
            return false;
        }
    };

    const updateEmergencyTransaction = async (id: string, updates: { amount?: number, note?: string, date?: Date }) => {
        if (!isAdmin) return false;

        try {
            const original = transactions.find(t => t.id === id);
            if (!original) throw new Error("Transaction not found");

            const updateData: any = {};
            if (updates.amount !== undefined) updateData.amount = updates.amount;
            if (updates.note !== undefined) updateData.note = updates.note;
            if (updates.date !== undefined) updateData.date = updates.date.toISOString().split('T')[0];
            updateData.updated_at = new Date().toISOString();

            // 1. Update EF record
            const { error: updateError } = await supabase
                .from('emergency_fund_transactions')
                .update(updateData)
                .eq('id', id);

            if (updateError) throw updateError;

            // 2. If amount changed, adjust balance
            if (updates.amount !== undefined && updates.amount !== original.amount) {
                const diff = updates.amount - original.amount;
                const balanceAdjustment = original.action_type === 'deposit' ? diff : -diff;

                await supabase
                    .from('emergency_fund_balance')
                    .update({
                        current_balance: (balance.current_balance || 0) + balanceAdjustment,
                        last_updated: new Date().toISOString()
                    })
                    .eq('id', balance.id);
            }

            toast({ title: "Success", description: "Transaction updated successfully." });
            await fetchBalance();
            await fetchTransactions();
            return true;
        } catch (error: any) {
            console.error('Error updating EF transaction:', error);
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
            return false;
        }
    };

    useEffect(() => {
        fetchBalance();
        fetchTransactions();

        const channel = supabase
            .channel(`emergency-fund-changes-${Math.random().toString(36).substring(2, 9)}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'emergency_fund_balance' },
                () => fetchBalance()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'emergency_fund_transactions' },
                () => fetchTransactions()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return {
        balance,
        transactions,
        loading,
        depositToEmergencyFund,
        withdrawFromEmergencyFund,
        withdrawCashFromEmergencyFund,
        deleteEmergencyTransaction,
        updateEmergencyTransaction,
        refetch: () => {
            fetchBalance();
            fetchTransactions();
        }
    };
};
