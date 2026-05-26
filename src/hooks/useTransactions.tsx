
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/contexts/TenantContext';
import { logTransactionCreate, logTransactionUpdate, logTransactionDelete } from '@/services/userLogService';
import { offlineCacheManager } from '@/services/offlineCacheManager';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export interface Transaction {
  id: string;
  date: string;
  time?: string;
  type: 'cash-in' | 'cash-out';
  category_name: string;
  amount: number;
  customer_name: string;
  number_of_pictures: number;
  whatsapp_number: string;
  details: string;
  added_by: string;
}

// Module-level global state cache
let globalTransactions: Transaction[] = [];
let globalLoading = true;
let isFetching = false;
let currentFetchPromise: Promise<Transaction[]> | null = null;
let currentTenantId: string | null = undefined;
let currentRole: string | null = null;
let currentIsOnline: boolean | null = null;

// Subscribers callback functions
const subscribers = new Set<(data: { transactions: Transaction[]; loading: boolean }) => void>();

// Real-time channel singleton
let globalChannel: any = null;
let debounceRef: NodeJS.Timeout | null = null;

const notifySubscribers = () => {
  subscribers.forEach(sub => sub({ transactions: globalTransactions, loading: globalLoading }));
};

const fetchTransactionsShared = async (
  tenantId: string | null,
  role: string | null,
  isOnline: boolean | null
) => {
  console.log(`🔄 Starting shared transaction fetch for tenant: ${tenantId || 'all'}...`);

  // Check sessionStorage cache first (for quick access)
  const cacheKey = `transactions_tenant_${tenantId || 'all'}_v2`;
  const cached = sessionStorage.getItem(cacheKey);
  const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);

  // Use sessionStorage cache if less than 30 seconds old
  if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 30000) {
    console.log(`📦 Using sessionStorage cached transaction data for tenant: ${tenantId}`);
    const cachedData = JSON.parse(cached);
    globalTransactions = cachedData;
    globalLoading = false;
    notifySubscribers();
    return;
  }

  // If explicitly offline (not just initializing), try IndexedDB cache
  if (isOnline === false) {
    console.log('📴 Offline mode detected - loading from IndexedDB');
    try {
      const cachedTransactions = await offlineCacheManager.getCachedTransactions();
      const tenantFiltered = tenantId
        ? cachedTransactions.filter((t: any) => t.tenant_id === tenantId)
        : cachedTransactions;

      if (tenantFiltered.length > 0) {
        console.log(`📦 Loaded ${tenantFiltered.length} transactions from IndexedDB`);
        globalTransactions = tenantFiltered;
        globalLoading = false;
        notifySubscribers();
        return;
      }
    } catch (error) {
      console.error('❌ Error loading from IndexedDB:', error);
    }
  }

  // Deduplicate active fetches
  if (isFetching && currentFetchPromise) {
    try {
      await currentFetchPromise;
    } catch (e) {
      // ignore errors
    }
    return;
  }

  isFetching = true;
  globalLoading = true;
  notifySubscribers();

  currentFetchPromise = (async () => {
    console.log(`📡 Making paginated Supabase queries for transactions for tenant: ${tenantId}...`);
    const pageSize = 1000;
    let from = 0;
    let allRows: any[] = [];
    const maxPages = 200; // 200k rows cap
    
    for (let page = 0; page < maxPages; page++) {
      const to = from + pageSize - 1;
      let query = supabase
        .from('transactions')
        .select(`
          id,
          date,
          time,
          type,
          category_name,
          amount,
          customer_name,
          number_of_pictures,
          whatsapp_number,
          details,
          added_by,
          created_at,
          tenant_id
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      } else if (role !== 'main_super_admin') {
        query = query.is('tenant_id', null);
      }

      const { data, error } = await query;
      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      const batch = data || [];
      allRows = allRows.concat(batch);
      if (batch.length < pageSize) break;
      from += pageSize;
    }

    const formattedTransactions: Transaction[] = allRows.map((t: any) => ({
      id: t.id,
      date: t.date,
      time: t.time || undefined,
      type: t.type as 'cash-in' | 'cash-out',
      category_name: t.category_name,
      amount: Number(t.amount),
      customer_name: t.customer_name,
      number_of_pictures: t.number_of_pictures || 0,
      whatsapp_number: t.whatsapp_number || '',
      details: t.details || '',
      added_by: t.added_by,
    }));

    return formattedTransactions;
  })();

  try {
    const results = await currentFetchPromise;
    if (results) {
      globalTransactions = results;
      sessionStorage.setItem(cacheKey, JSON.stringify(results));
      sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      await offlineCacheManager.cacheTransactions(results);
    }
    globalLoading = false;
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    if (cached) {
      console.log('📦 Using stale sessionStorage cache due to error');
      globalTransactions = JSON.parse(cached);
    } else {
      try {
        const cachedTransactions = await offlineCacheManager.getCachedTransactions();
        if (cachedTransactions.length > 0) {
          globalTransactions = cachedTransactions;
        }
      } catch (cacheError) {
        console.error('❌ Error loading from cache:', cacheError);
      }
    }
    globalLoading = false;
  } finally {
    isFetching = false;
    currentFetchPromise = null;
    notifySubscribers();
  }
};

const setupGlobalRealtime = () => {
  if (globalChannel) return;

  console.log('🚀 Setting up shared global real-time transaction channel');
  const channelName = `global-realtime-transactions-${Date.now()}`;

  globalChannel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions'
      },
      (payload) => {
        console.log('🔄 Global real-time transaction change detected:', payload.eventType);
        
        clearTimeout(debounceRef);
        debounceRef = setTimeout(() => {
          const cacheKey = `transactions_tenant_${currentTenantId || 'all'}_v2`;
          sessionStorage.removeItem(cacheKey);
          sessionStorage.removeItem(`${cacheKey}_time`);
          fetchTransactionsShared(currentTenantId, currentRole, currentIsOnline);
        }, 1500);
      }
    )
    .subscribe();
};

const cleanupGlobalRealtime = () => {
  if (globalChannel) {
    console.log('🧹 Cleaning up shared global real-time transaction channel');
    supabase.removeChannel(globalChannel);
    globalChannel = null;
  }
};

export const useTransactions = () => {
  const { toast } = useToast();
  const { currentUser, isAdmin, logAdminAction } = useAuth();
  const { tenantId, role } = useTenant();
  const { isOnline, isConnected } = useNetworkStatus();

  const [transactions, setTransactions] = useState<Transaction[]>(globalTransactions);
  const [loading, setLoading] = useState<boolean>(globalLoading);

  // Sync latest hook state inputs with global tracker
  currentTenantId = tenantId;
  currentRole = role;
  currentIsOnline = isOnline;

  useEffect(() => {
    // If tenant context has changed, flush previous cache
    const isTenantChanged = tenantId !== currentTenantId;
    if (isTenantChanged) {
      currentTenantId = tenantId;
      globalTransactions = [];
      globalLoading = true;
    }

    const subscriber = (data: { transactions: Transaction[]; loading: boolean }) => {
      setTransactions(data.transactions);
      setLoading(data.loading);
    };

    subscribers.add(subscriber);

    if (isTenantChanged || (globalTransactions.length === 0 && globalLoading && !isFetching)) {
      fetchTransactionsShared(tenantId, role, isOnline);
    } else {
      setTransactions(globalTransactions);
      setLoading(globalLoading);
    }

    setupGlobalRealtime();

    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        cleanupGlobalRealtime();
      }
    };
  }, [tenantId, role, isOnline]);

  const getOrCreateCategory = async (categoryName: string): Promise<string | null> => {
    try {
      const { data: existingCategory, error: findError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .single();

      if (existingCategory) {
        return existingCategory.id;
      }

      if (findError?.code === 'PGRST116') {
        console.log('Creating new category:', categoryName);
        const { data: newCategory, error: createError } = await supabase
          .from('categories')
          .insert([{
            name: categoryName,
            tenant_id: tenantId
          }])
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating category:', createError);
          return null;
        }

        return newCategory.id;
      }

      console.error('Error finding category:', findError);
      return null;
    } catch (error) {
      console.error('Error in getOrCreateCategory:', error);
      return null;
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'added_by'>) => {
    try {
      console.log('🔄 Starting transaction processing:', {
        type: transaction.type,
        amount: transaction.amount,
        category_name: transaction.category_name,
        customer_name: transaction.customer_name,
        date: transaction.date,
        currentUser: currentUser?.username,
        currentUserId: currentUser?.id,
        isOnline,
        isConnected
      });

      if (!transaction.type || !transaction.amount || !transaction.category_name || !transaction.customer_name) {
        throw new Error('Missing required transaction fields');
      }

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      if (isOnline === false) {
        console.log('📴 Offline mode - queuing transaction for sync');
        const offlineTransaction: Transaction = {
          id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...transaction,
          added_by: currentUser?.username || 'Unknown'
        };

        await offlineCacheManager.cacheSingleTransaction(offlineTransaction);
        await offlineCacheManager.queueOfflineChange('create', 'transactions', offlineTransaction);

        globalTransactions = [offlineTransaction, ...globalTransactions];
        notifySubscribers();

        toast({
          title: "Offline Mode",
          description: "Transaction saved locally and will sync when online.",
        });

        return offlineTransaction;
      }

      if (transaction.type === 'cash-in') {
        const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
        const { data: recentTransactions } = await supabase
          .from('transactions')
          .select('id, amount, customer_name, created_at')
          .eq('type', 'cash-in')
          .eq('amount', transaction.amount)
          .eq('customer_name', transaction.customer_name)
          .eq('added_by_user_id', currentUser.id)
          .gte('created_at', tenSecondsAgo);

        if (recentTransactions && recentTransactions.length > 0) {
          console.log('🚫 Duplicate cash-in transaction detected, aborting');
          throw new Error('Duplicate transaction detected. Please wait before creating another identical transaction.');
        }
      }

      let categoryId = null;
      try {
        categoryId = await getOrCreateCategory(transaction.category_name);
        console.log('✅ Category ID obtained:', categoryId);
      } catch (categoryError) {
        console.warn('⚠️ Category lookup failed, proceeding without category_id:', categoryError);
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          date: transaction.date,
          time: transaction.time,
          type: transaction.type,
          category_id: categoryId,
          category_name: transaction.category_name,
          amount: transaction.amount,
          customer_name: transaction.customer_name,
          number_of_pictures: transaction.number_of_pictures,
          whatsapp_number: transaction.whatsapp_number,
          details: transaction.details,
          added_by: currentUser?.username || 'Unknown',
          added_by_user_id: currentUser?.id || null,
          tenant_id: tenantId
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message || 'Unknown error'}`);
      }

      const formattedTransaction: Transaction = {
        id: data.id,
        date: data.date,
        time: data.time || undefined,
        type: data.type as 'cash-in' | 'cash-out',
        category_name: data.category_name,
        amount: Number(data.amount),
        customer_name: data.customer_name,
        number_of_pictures: data.number_of_pictures || 0,
        whatsapp_number: data.whatsapp_number || '',
        details: data.details || '',
        added_by: data.added_by,
      };

      await offlineCacheManager.cacheSingleTransaction(formattedTransaction);

      if (isAdmin) {
        logAdminAction(`Added ${transaction.type} transaction: ZMW ${transaction.amount} for ${transaction.customer_name}`);
      }

      toast({
        title: "Transaction Added",
        description: `${transaction.type === 'cash-in' ? 'Cash In' : 'Cash Out'} transaction of ZMW ${transaction.amount.toFixed(2)} added successfully.`,
      });

      setTimeout(() => {
        fetchTransactionsShared(tenantId, role, isOnline);
      }, 500);

      return data;
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add transaction",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateTransaction = async (id: string, updatedTransaction: Partial<Transaction>) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can edit transactions.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Real-time transaction update:', id, updatedTransaction);

      const { data, error } = await supabase
        .from('transactions')
        .update({
          date: updatedTransaction.date,
          time: updatedTransaction.time,
          type: updatedTransaction.type,
          category_name: updatedTransaction.category_name,
          amount: updatedTransaction.amount,
          customer_name: updatedTransaction.customer_name,
          number_of_pictures: updatedTransaction.number_of_pictures,
          whatsapp_number: updatedTransaction.whatsapp_number,
          details: updatedTransaction.details
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      logAdminAction(`Edited transaction ID: ${id} - ${updatedTransaction.customer_name || 'Unknown'} - ZMW ${updatedTransaction.amount || 0}`);

      toast({
        title: "Transaction Updated",
        description: "Transaction updated with real-time balance sync.",
      });

      await fetchTransactionsShared(tenantId, role, isOnline);
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can delete transactions.",
        variant: "destructive",
      });
      return;
    }

    try {
      const transactionToDelete = globalTransactions.find(t => t.id === id);
      console.log('Real-time transaction deletion:', id, transactionToDelete);

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (transactionToDelete) {
        logAdminAction(`Deleted ${transactionToDelete.type} transaction: ZMW ${transactionToDelete.amount} for ${transactionToDelete.customer_name}`);
      }

      toast({
        title: "Transaction Deleted",
        description: "Transaction removed with real-time balance sync.",
      });

      await fetchTransactionsShared(tenantId, role, isOnline);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
      throw error;
    }
  };

  const refetch = async () => {
    await fetchTransactionsShared(tenantId, role, isOnline);
  };

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch
  };
};
