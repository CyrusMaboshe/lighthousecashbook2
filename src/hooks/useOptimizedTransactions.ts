import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys, performanceMonitor, cacheManager } from '@/lib/queryClient';
import { Transaction } from '@/hooks/useTransactions';

interface TransactionFilters {
  type?: 'cash-in' | 'cash-out' | 'all';
  category?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

// Optimized transaction fetching with React Query
export function useOptimizedTransactions(filters: TransactionFilters = {}) {
  const { currentUser, isAdmin } = useAuth();
  const { toast } = useToast();

  return useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: async () => {
      const startTime = performance.now();
      
      try {
        console.log('🔄 Fetching transactions with filters:', filters);
        
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
            created_at
          `)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters.type && filters.type !== 'all') {
          query = query.eq('type', filters.type);
        }

        if (filters.category) {
          query = query.eq('category_name', filters.category);
        }

        if (filters.search) {
          query = query.or(`customer_name.ilike.%${filters.search}%,details.ilike.%${filters.search}%`);
        }

        if (filters.dateFrom) {
          query = query.gte('date', filters.dateFrom);
        }

        if (filters.dateTo) {
          query = query.lte('date', filters.dateTo);
        }

        // Apply pagination
        const limit = filters.limit || 500;
        const offset = filters.offset || 0;
        query = query.range(offset, offset + limit - 1);

        const { data, error } = await query;

        if (error) {
          console.error('❌ Transaction fetch error:', error);
          throw error;
        }

        const formattedTransactions: Transaction[] = (data || []).map(t => ({
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
          added_by: t.added_by
        }));

        console.log('✅ Transactions fetched:', formattedTransactions.length);
        
        // Track performance
        performanceMonitor.trackQuery('transactions', startTime);
        
        return formattedTransactions;
      } catch (error) {
        console.error('❌ Error fetching transactions:', error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for real-time data
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    enabled: !!currentUser, // Only fetch when user is authenticated
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// Optimized transaction creation
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'added_by'>) => {
      console.log('🔄 Creating transaction:', transaction);

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Get or create category
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', transaction.category_name)
        .single();

      let categoryId = categoryData?.id;

      if (categoryError && categoryError.code === 'PGRST116') {
        // Category doesn't exist, create it
        const { data: newCategory, error: createError } = await supabase
          .from('categories')
          .insert([{ name: transaction.category_name, type: transaction.type }])
          .select('id')
          .single();

        if (createError) throw createError;
        categoryId = newCategory.id;
      } else if (categoryError) {
        throw categoryError;
      }

      // Create transaction
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
          added_by: currentUser.username || 'Unknown',
          added_by_user_id: currentUser.id || null
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch transaction queries
      cacheManager.invalidateTransactions();
      cacheManager.invalidateStats();
      
      toast({
        title: "Success",
        description: "Transaction created successfully",
      });
    },
    onError: (error: any) => {
      console.error('❌ Transaction creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create transaction",
        variant: "destructive",
      });
    },
  });
}

// Optimized transaction update
export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      console.log('🔄 Updating transaction:', id, updates);

      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      cacheManager.invalidateTransactions();
      cacheManager.invalidateStats();
      
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('❌ Transaction update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update transaction",
        variant: "destructive",
      });
    },
  });
}

// Optimized transaction deletion
export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🔄 Deleting transaction:', id);

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      cacheManager.invalidateTransactions();
      cacheManager.invalidateStats();
      
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('❌ Transaction deletion error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete transaction",
        variant: "destructive",
      });
    },
  });
}

// Hook for real-time transaction updates
export function useTransactionRealtime(filters: TransactionFilters = {}) {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  React.useEffect(() => {
    if (!currentUser) return;

    console.log('🚀 Setting up real-time transaction subscription');

    const channel = supabase
      .channel(`transactions-realtime-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('🔄 Real-time transaction change:', payload.eventType);
          
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [currentUser, queryClient]);
}
