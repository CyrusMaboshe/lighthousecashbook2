/**
 * useMTTransactionAdapter
 *
 * Adapts the multi-tenant company transaction data (mt_company_transactions)
 * to the Transaction interface used by GlassTransactionsView and TransactionModals.
 *
 * DATA FLOW:
 *   mt_company_transactions  ──adapt──▶  Transaction[]
 *   mt_company_categories    ──adapt──▶  string[]  (category names)
 *
 * CRUD operations write back to mt_company_transactions — no financial logic changed.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { Transaction } from '@/hooks/useTransactions';

export interface UseMTTransactionAdapterResult {
  transactions: Transaction[];
  categories: string[];
  loading: boolean;
  addTransaction: (tx: Omit<Transaction, 'id' | 'added_by'>) => Promise<Transaction | null>;
  updateTransaction: (id: string, partial: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (name: string) => void; // no-op adapter — real add happens in form
}

export function useMTTransactionAdapter(
  companyId: string,
  selectedMonth: string
): UseMTTransactionAdapterResult {
  const { currentUser } = useMultiTenantAuth();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadTransactions = useCallback(async () => {
    if (!companyId) return;
    try {
      let query = supabase
        .from('mt_company_transactions')
        .select('*')
        .eq('company_id', companyId);

      if (selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        const startDate = `${selectedMonth}-01`;
        const endDate = new Date(parseInt(year), parseInt(month), 0)
          .toISOString()
          .split('T')[0];
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) { console.error('useMTTransactionAdapter loadTransactions:', error); return; }

      // Adapt mt_company_transactions rows → Transaction interface
      const adapted: Transaction[] = (data || []).map((row: any) => ({
        id: row.id,
        date: row.date,
        time: row.time || undefined,
        type: row.type as 'cash-in' | 'cash-out',
        category_name: row.category_name || '',
        amount: Number(row.amount),
        customer_name: row.customer_name || row.withdrawn_by || '',
        number_of_pictures: Number(row.number_of_pictures) || 0,
        whatsapp_number: row.whatsapp_number || '',
        details: row.details || '',
        added_by: row.added_by || '',
      }));

      setTransactions(adapted);
    } catch (err) {
      console.error('useMTTransactionAdapter loadTransactions error:', err);
    }
  }, [companyId, selectedMonth]);

  const loadCategories = useCallback(async () => {
    if (!companyId) return;
    try {
      const { data, error } = await supabase
        .from('mt_company_categories')
        .select('name')
        .eq('company_id', companyId)
        .order('name');
      if (error) { console.error('useMTTransactionAdapter loadCategories:', error); return; }
      setCategories((data || []).map((c: any) => c.name));
    } catch (err) {
      console.error('useMTTransactionAdapter loadCategories error:', err);
    }
  }, [companyId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadTransactions(), loadCategories()]);
    setLoading(false);
  }, [loadTransactions, loadCategories]);

  // Initial load + reload on month change
  useEffect(() => {
    if (!companyId) return;
    loadAll();
  }, [companyId, selectedMonth, loadAll]);

  // Real-time subscription — mirrors MTTransactionManager behaviour
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`mt-adapter-${companyId}-${selectedMonth}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mt_company_transactions',
          filter: `company_id=eq.${companyId}`,
        },
        () => { loadTransactions(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [companyId, selectedMonth, loadTransactions]);

  // ── CRUD — identical logic to MTTransactionManager, same table ─────────────

  const addTransaction = useCallback(
    async (tx: Omit<Transaction, 'id' | 'added_by'>): Promise<Transaction | null> => {
      if (!currentUser || !companyId) return null;

      try {
        // Duplicate check — same as MTTransactionManager
        if (tx.type === 'cash-in') {
          const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
          const { data: recent } = await supabase
            .from('mt_company_transactions')
            .select('id')
            .eq('company_id', companyId)
            .eq('type', 'cash-in')
            .eq('amount', tx.amount)
            .eq('customer_name', tx.customer_name)
            .eq('added_by_user_id', currentUser.id)
            .gte('created_at', tenSecondsAgo);

          if (recent && recent.length > 0) {
            toast({
              title: 'Duplicate Transaction Detected',
              description: 'A similar transaction was just created. Please check your transaction history.',
              variant: 'destructive',
            });
            return null;
          }
        }

        const insertData: any = {
          company_id: companyId,
          type: tx.type,
          category_name: tx.category_name,
          amount: tx.amount,
          date: tx.date,
          added_by: currentUser.username || currentUser.email,
          added_by_user_id: currentUser.id,
          details: tx.details || '',
          number_of_pictures: tx.number_of_pictures || 0,
        };

        if (tx.type === 'cash-in') {
          insertData.customer_name = tx.customer_name;
          insertData.whatsapp_number = tx.whatsapp_number || '';
        } else {
          insertData.withdrawn_by = currentUser.username || currentUser.email;
          insertData.withdrawn_by_user_id = currentUser.id;
          insertData.customer_name = '';
          insertData.whatsapp_number = '';
        }

        const { data, error } = await supabase
          .from('mt_company_transactions')
          .insert([insertData])
          .select()
          .single();

        if (error) throw error;

        const adapted: Transaction = {
          id: data.id,
          date: data.date,
          time: data.time || undefined,
          type: data.type as 'cash-in' | 'cash-out',
          category_name: data.category_name || '',
          amount: Number(data.amount),
          customer_name: data.customer_name || data.withdrawn_by || '',
          number_of_pictures: Number(data.number_of_pictures) || 0,
          whatsapp_number: data.whatsapp_number || '',
          details: data.details || '',
          added_by: data.added_by || '',
        };

        toast({
          title: tx.type === 'cash-in' ? '💰 Cash-In Successful!' : 'Cash-Out Successful',
          description: `ZMW ${tx.amount.toFixed(2)} recorded successfully.`,
        });

        // Reload after a short delay to avoid race with realtime
        setTimeout(() => loadTransactions(), 800);
        return adapted;
      } catch (err: any) {
        console.error('useMTTransactionAdapter addTransaction error:', err);
        toast({
          title: 'Error',
          description: err?.message || 'Failed to add transaction. Please try again.',
          variant: 'destructive',
        });
        return null;
      }
    },
    [companyId, currentUser, toast, loadTransactions]
  );

  const updateTransaction = useCallback(
    async (id: string, partial: Partial<Transaction>): Promise<void> => {
      try {
        const { error } = await supabase
          .from('mt_company_transactions')
          .update({
            date: partial.date,
            time: partial.time,
            type: partial.type,
            category_name: partial.category_name,
            amount: partial.amount,
            customer_name: partial.customer_name,
            number_of_pictures: partial.number_of_pictures,
            whatsapp_number: partial.whatsapp_number,
            details: partial.details,
          })
          .eq('id', id)
          .eq('company_id', companyId);

        if (error) throw error;

        toast({ title: 'Transaction Updated', description: 'Changes saved successfully.' });
        await loadTransactions();
      } catch (err: any) {
        console.error('useMTTransactionAdapter updateTransaction error:', err);
        toast({
          title: 'Error',
          description: 'Failed to update transaction.',
          variant: 'destructive',
        });
      }
    },
    [companyId, toast, loadTransactions]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from('mt_company_transactions')
          .delete()
          .eq('id', id)
          .eq('company_id', companyId); // security: only delete within this company

        if (error) throw error;

        toast({ title: 'Transaction Deleted', description: 'Transaction removed successfully.' });
        await loadTransactions();
      } catch (err: any) {
        console.error('useMTTransactionAdapter deleteTransaction error:', err);
        toast({
          title: 'Error',
          description: 'Failed to delete transaction.',
          variant: 'destructive',
        });
      }
    },
    [companyId, toast, loadTransactions]
  );

  // addCategory is a no-op at this layer — the form handles it internally via
  // the 'add-manual' select option inside GlassTransactionsView's TransactionModals.
  // After the modal closes, the realtime subscription will pick up the new category.
  const addCategory = useCallback((_name: string) => {
    // Trigger a reload of categories after a brief delay
    setTimeout(() => loadCategories(), 500);
  }, [loadCategories]);

  return {
    transactions,
    categories,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
  };
}
