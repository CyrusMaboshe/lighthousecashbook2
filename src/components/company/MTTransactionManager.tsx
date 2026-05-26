// Multi-Tenant Transaction Manager - Real-time transaction system
// Handles cash-in/cash-out with all specified requirements

import React, { useState, useEffect } from 'react';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';
import { CashInCounter, CashOutCounter, BalanceCounter, SimpleCounter } from '@/components/ui/AnimatedCounter';
import {
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Camera,
  DollarSign,
  Calendar,
  Clock,
  User,
  Phone,
  FileText,
  Trash2,
  Eye,
  EyeOff,
  Edit,
  Wallet,
  ShoppingBag,
  Heart,
  Wrench,
  Briefcase
} from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  time: string;
  type: 'cash-in' | 'cash-out';
  category_name: string;
  amount: number;
  customer_name?: string;
  whatsapp_number?: string;
  number_of_pictures: number;
  details?: string;
  withdrawn_by?: string;
  added_by: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  type: 'cash-in' | 'cash-out' | 'both';
}

interface Stats {
  total_cash_in: number;
  total_cash_out: number;
  net_balance: number;
  total_pictures: number;
  total_transactions: number;
}

interface MTTransactionManagerProps {
  selectedMonth?: string;
  hideBalances?: boolean;
}

export function MTTransactionManager({ selectedMonth, hideBalances: propHideBalances = false }: MTTransactionManagerProps) {
  const { currentUser, currentCompany } = useMultiTenantAuth();
  const { toast } = useToast();

  // Early return if authentication is not ready
  if (!currentUser || !currentCompany) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transaction manager...</p>
        </div>
      </div>
    );
  }
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_cash_in: 0,
    total_cash_out: 0,
    net_balance: 0,
    total_pictures: 0,
    total_transactions: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [showCashInDialog, setShowCashInDialog] = useState(false);
  const [showCashOutDialog, setShowCashOutDialog] = useState(false);
  const [isSubmittingCashIn, setIsSubmittingCashIn] = useState(false);
  const [isSubmittingCashOut, setIsSubmittingCashOut] = useState(false);
  const [showCashInCelebration, setShowCashInCelebration] = useState(false);
  const [lastCashInAmount, setLastCashInAmount] = useState(0);
  const [hideBalances, setHideBalances] = useState(propHideBalances);

  // Manual category state
  const [showManualCategoryInput, setShowManualCategoryInput] = useState(false);
  const [manualCategoryName, setManualCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
  // Cash-in form state
  const [cashInForm, setCashInForm] = useState({
    category_name: '',
    amount: '',
    customer_name: '',
    whatsapp_number: '',
    number_of_pictures: '1',
    details: '',
    date: new Date().toISOString().split('T')[0] // Default to today
  });

  // Cash-out form state
  const [cashOutForm, setCashOutForm] = useState({
    category_name: '',
    amount: '',
    details: '',
    date: new Date().toISOString().split('T')[0] // Default to today
  });

  // Amount options (20, 40, 60... up to 2000)
  const amountOptions = Array.from({ length: 100 }, (_, i) => (i + 1) * 20);
  
  // Picture options (1 to 500)
  const pictureOptions = Array.from({ length: 500 }, (_, i) => i + 1);

  // Get the appropriate icon for the business metric
  const getMetricIcon = () => {
    const metricName = currentCompany?.settings?.metric_name || 'pictures';
    switch (metricName.toLowerCase()) {
      case 'pictures':
        return Camera;
      case 'products':
        return ShoppingBag;
      case 'customers':
        return Heart;
      case 'services':
        return Wrench;
      case 'orders':
        return Briefcase;
      default:
        return Camera;
    }
  };

  const MetricIcon = getMetricIcon();

  useEffect(() => {
    if (currentCompany) {
      loadData();
      setupRealTimeSubscription();
    }
  }, [currentCompany, selectedMonth]);

  // Force re-render when company settings change (for branding updates)
  useEffect(() => {
    console.log('🎨 MTTransactionManager - Company settings updated:', {
      metricName: currentCompany?.settings?.metric_name,
      businessType: currentCompany?.settings?.business_type,
      primaryColor: currentCompany?.settings?.primary_color
    });
    // Component will automatically re-render with new company data
  }, [currentCompany?.settings?.metric_name, currentCompany?.settings?.business_type, currentCompany?.settings?.primary_color, currentCompany?.logo_url]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadTransactions(),
        loadCategories(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load transaction data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      if (!currentCompany?.id) {
        console.warn('No company ID available for loading transactions');
        return;
      }

      let query = supabase
        .from('mt_company_transactions')
        .select('*')
        .eq('company_id', currentCompany.id);

      // Filter by selected month if provided
      if (selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        const startDate = `${selectedMonth}-01`;
        // Get last day of the month
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        query = query.gte('date', startDate).lte('date', endDate);
        console.log(`🔍 Filtering transactions for period: ${selectedMonth} (${startDate} to ${endDate})`);
      } else {
        console.log(`🔍 Loading ALL transactions (no month filter)`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading transactions:', error);
        return;
      }

      setTransactions(data || []);
    } catch (error) {
      console.error('Unexpected error loading transactions:', error);
    }
  };

  const loadCategories = async () => {
    try {
      if (!currentCompany?.id) {
        console.warn('No company ID available for loading categories');
        return;
      }

      const { data, error } = await supabase
        .from('mt_company_categories')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('name');

      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Unexpected error loading categories:', error);
    }
  };

  const loadStats = async () => {
    try {
      if (!currentCompany?.id) {
        console.warn('No company ID available for loading stats');
        return;
      }

      // Always use fallback for month-specific filtering
      // The stored procedure doesn't support month filtering yet
      await loadStatsFallback();
    } catch (error) {
      console.error('Unexpected error loading stats:', error);
      await loadStatsFallback();
    }
  };

  const loadStatsFallback = async () => {
    try {
      let query = supabase
        .from('mt_company_transactions')
        .select('type, amount, number_of_pictures, date')
        .eq('company_id', currentCompany.id);

      // Filter by selected month if provided
      if (selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        const startDate = `${selectedMonth}-01`;
        // Get last day of the month
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        query = query.gte('date', startDate).lte('date', endDate);
        console.log(`🔍 Filtering stats for period: ${selectedMonth} (${startDate} to ${endDate})`);
      } else {
        console.log(`🔍 Loading ALL transaction stats (no month filter)`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error in stats fallback:', error);
        return;
      }

      const cashIn = data?.filter(t => t.type === 'cash-in') || [];
      const cashOut = data?.filter(t => t.type === 'cash-out') || [];

      const totalCashIn = cashIn.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalCashOut = cashOut.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalPictures = cashIn.reduce((sum, t) => sum + (t.number_of_pictures || 0), 0);

      setStats({
        total_cash_in: totalCashIn,
        total_cash_out: totalCashOut,
        net_balance: totalCashIn - totalCashOut,
        total_pictures: totalPictures,
        total_transactions: data?.length || 0
      });

      console.log(`📊 Stats loaded for period: ${selectedMonth || 'All time'}`, {
        totalCashIn,
        totalCashOut,
        netBalance: totalCashIn - totalCashOut,
        totalTransactions: data?.length || 0
      });
    } catch (error) {
      console.error('Error in stats fallback calculation:', error);
    }
  };

  const setupRealTimeSubscription = () => {
    try {
      if (!currentCompany?.id) {
        console.warn('No company ID available for real-time subscription');
        return () => {};
      }

      const subscription = supabase
        .channel('mt_transactions')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'mt_company_transactions',
            filter: `company_id=eq.${currentCompany.id}`
          },
          (payload) => {
            // Add safeguard to prevent processing our own insertions
            console.log('🔄 Real-time change detected:', payload.eventType);

            // Only reload data if we're not currently submitting
            if (!isSubmittingCashIn && !isSubmittingCashOut) {
              console.log('📊 Reloading data due to external change');
              loadData();
            } else {
              console.log('🚫 Skipping reload - submission in progress');
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      return () => {};
    }
  };

  // Add manual category function
  const addManualCategory = async (categoryName: string, categoryType: 'cash-in' | 'cash-out' | 'both') => {
    if (!categoryName.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name cannot be empty.",
        variant: "destructive",
      });
      return false;
    }

    setIsAddingCategory(true);
    try {
      const { error } = await supabase
        .from('mt_company_categories')
        .insert([{
          company_id: currentCompany.id,
          name: categoryName.trim(),
          type: categoryType,
          created_by_user_id: currentUser.id,
          created_by_username: currentUser.username || currentUser.email
        }]);

      if (error) throw error;

      toast({
        title: "Category Added",
        description: `Category "${categoryName}" has been added successfully.`,
      });

      // Reload categories
      await loadData();

      setManualCategoryName('');
      setShowManualCategoryInput(false);
      return true;
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleCashIn = async () => {
    // ULTIMATE duplicate submission prevention
    if (isSubmittingCashIn) {
      console.log('🚫 Cash-in submission already in progress, ignoring duplicate request');
      return;
    }

    // Validate required fields (details is now optional)
    if (!cashInForm.category_name || !cashInForm.amount || !cashInForm.customer_name ||
        !cashInForm.whatsapp_number) {
      toast({
        title: "Validation Error",
        description: "Category, amount, customer name, and WhatsApp number are required.",
        variant: "destructive",
      });
      return;
    }

    // Generate a unique transaction identifier for this submission
    const submissionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    setIsSubmittingCashIn(true);

    // Create a unique transaction key to prevent duplicates
    const transactionKey = `${currentCompany.id}-${parseFloat(cashInForm.amount)}-${cashInForm.customer_name}-${Date.now()}`;

    try {
      console.log('💰 Submitting cash-in transaction:', {
        submissionId,
        transactionKey,
        company_id: currentCompany.id,
        amount: parseFloat(cashInForm.amount),
        customer_name: cashInForm.customer_name
      });

      // STRICT duplicate check - look for ANY similar transaction in the last 10 seconds
      const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
      const { data: recentTransactions } = await supabase
        .from('mt_company_transactions')
        .select('id, amount, customer_name, created_at, added_by_user_id')
        .eq('company_id', currentCompany.id)
        .eq('type', 'cash-in')
        .eq('amount', parseFloat(cashInForm.amount))
        .eq('customer_name', cashInForm.customer_name)
        .eq('added_by_user_id', currentUser.id)
        .gte('created_at', tenSecondsAgo);

      if (recentTransactions && recentTransactions.length > 0) {
        console.log('🚫 STRICT duplicate transaction detected, aborting submission');
        console.log('Recent transactions found:', recentTransactions);
        toast({
          title: "Duplicate Transaction Detected",
          description: "A similar transaction was just created. Please check your transaction history.",
          variant: "destructive",
        });
        return;
      }

      // Use a transaction with explicit error handling
      const insertData = {
        company_id: currentCompany.id,
        type: 'cash-in' as const,
        category_name: cashInForm.category_name,
        amount: parseFloat(cashInForm.amount),
        customer_name: cashInForm.customer_name,
        whatsapp_number: cashInForm.whatsapp_number,
        number_of_pictures: parseInt(cashInForm.number_of_pictures),
        details: cashInForm.details,
        date: cashInForm.date,
        added_by: currentUser.username || currentUser.email,
        added_by_user_id: currentUser.id
      };

      console.log('📝 Inserting transaction data:', insertData);

      const { data: insertedData, error } = await supabase
        .from('mt_company_transactions')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Database insertion error:', error);
        throw error;
      }

      console.log('✅ Transaction inserted successfully:', insertedData);

      const transactionDate = new Date(cashInForm.date);
      const isToday = cashInForm.date === new Date().toISOString().split('T')[0];

      console.log('✅ Cash-in transaction saved successfully with ID:', insertedData.id);

      // Show celebration animation
      setLastCashInAmount(parseFloat(cashInForm.amount));
      setShowCashInCelebration(true);
      setTimeout(() => setShowCashInCelebration(false), 3000);

      toast({
        title: "💰 Cash-In Successful!",
        description: isToday
          ? `ZMW ${parseFloat(cashInForm.amount).toFixed(2)} added successfully.`
          : `ZMW ${parseFloat(cashInForm.amount).toFixed(2)} added successfully for ${transactionDate.toLocaleDateString()}.`,
      });

      // Reset form and close dialog
      setCashInForm({
        category_name: '',
        amount: '',
        customer_name: '',
        whatsapp_number: '',
        number_of_pictures: '1',
        details: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowCashInDialog(false);

      // Force reload data after successful insertion
      console.log('🔄 Reloading data after successful cash-in transaction...');
      setTimeout(() => {
        loadData();
        console.log('✅ Data reload completed after cash-in');
      }, 1000);

    } catch (error) {
      console.error('❌ Error creating cash-in transaction:', error);

      // Check if it's a duplicate key error
      if (error.message && error.message.includes('duplicate')) {
        toast({
          title: "Duplicate Transaction",
          description: "This transaction has already been recorded.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create cash-in transaction. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmittingCashIn(false);
    }
  };

  const handleCashOut = async () => {
    // Prevent duplicate submissions
    if (isSubmittingCashOut) {
      console.log('🚫 Cash-out submission already in progress, ignoring duplicate request');
      return;
    }

    // Validate required fields
    if (!cashOutForm.category_name || !cashOutForm.amount) {
      toast({
        title: "Validation Error",
        description: "Category and amount are required for cash-out transactions.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingCashOut(true);
    try {
      console.log('💸 Submitting cash-out transaction:', {
        company_id: currentCompany.id,
        amount: parseFloat(cashOutForm.amount),
        withdrawn_by: currentUser.username || currentUser.email
      });

      const { error } = await supabase
        .from('mt_company_transactions')
        .insert([{
          company_id: currentCompany.id,
          type: 'cash-out',
          category_name: cashOutForm.category_name,
          amount: parseFloat(cashOutForm.amount),
          date: cashOutForm.date, // Use selected date
          withdrawn_by: currentUser.username || currentUser.email,
          withdrawn_by_user_id: currentUser.id,
          added_by: currentUser.username || currentUser.email,
          added_by_user_id: currentUser.id,
          details: cashOutForm.details,
          customer_name: '',
          whatsapp_number: '',
          number_of_pictures: 0
        }]);

      if (error) throw error;

      const transactionDate = new Date(cashOutForm.date);
      const isToday = cashOutForm.date === new Date().toISOString().split('T')[0];

      console.log('✅ Cash-out transaction saved successfully');
      toast({
        title: "Cash-Out Successful",
        description: isToday
          ? `ZMW ${parseFloat(cashOutForm.amount).toFixed(2)} withdrawn successfully.`
          : `ZMW ${parseFloat(cashOutForm.amount).toFixed(2)} withdrawn successfully for ${transactionDate.toLocaleDateString()}.`,
      });

      // Reset form and close dialog
      setCashOutForm({
        category_name: '',
        amount: '',
        details: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowCashOutDialog(false);

    } catch (error) {
      console.error('❌ Error creating cash-out transaction:', error);
      toast({
        title: "Error",
        description: "Failed to create cash-out transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingCashOut(false);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    // TODO: Implement edit functionality
    toast({
      title: "Edit Transaction",
      description: "Edit functionality will be implemented soon.",
    });
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    // Find the transaction to delete for optimistic update
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) {
      toast({
        title: "Error",
        description: "Transaction not found.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete this ${transactionToDelete.type} transaction for ${transactionToDelete.customer_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Optimistic update - remove transaction from local state immediately
      setTransactions(prev => prev.filter(t => t.id !== transactionId));

      // Update stats optimistically
      const amount = transactionToDelete.amount;
      const pictures = transactionToDelete.number_of_pictures || 0;
      const isIncome = transactionToDelete.type === 'cash-in';

      setStats(prev => ({
        ...prev,
        total_cash_in: isIncome ? prev.total_cash_in - amount : prev.total_cash_in,
        total_cash_out: !isIncome ? prev.total_cash_out - amount : prev.total_cash_out,
        net_balance: isIncome ? prev.net_balance - amount : prev.net_balance + amount,
        total_pictures: prev.total_pictures - pictures,
        total_transactions: prev.total_transactions - 1
      }));

      // Show immediate feedback
      toast({
        title: "Transaction Deleted",
        description: `${transactionToDelete.type} transaction for ${transactionToDelete.customer_name} is being removed...`,
      });

      // Perform actual deletion
      const { error } = await supabase
        .from('mt_company_transactions')
        .delete()
        .eq('id', transactionId)
        .eq('company_id', currentCompany.id); // Security: only delete from current company

      if (error) {
        // Revert optimistic update on error
        setTransactions(prev => [...prev, transactionToDelete].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));

        setStats(prev => ({
          ...prev,
          total_cash_in: isIncome ? prev.total_cash_in + amount : prev.total_cash_in,
          total_cash_out: !isIncome ? prev.total_cash_out + amount : prev.total_cash_out,
          net_balance: isIncome ? prev.net_balance + amount : prev.net_balance - amount,
          total_pictures: prev.total_pictures + pictures,
          total_transactions: prev.total_transactions + 1
        }));

        throw error;
      }

      // Final success notification
      toast({
        title: "Success!",
        description: "Transaction deleted successfully.",
      });

    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Cash-In Celebration Animation */}
      {showCashInCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-green-500 text-white p-8 rounded-lg shadow-2xl animate-bounce">
            <div className="text-center">
              <div className="text-6xl mb-4">💰</div>
              <h2 className="text-2xl font-bold mb-2">Cash In Successful!</h2>
              <CashInCounter
                amount={lastCashInAmount}
                currency="ZMW"
                showCelebration={true}
              />
            </div>
          </div>

          {/* Confetti Effect */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hide Balances Button - Positioned above balance cards */}
      <div className="flex justify-end mb-4 px-2 sm:px-0">
        <Button
          onClick={() => setHideBalances(!hideBalances)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 rounded-xl border-gray-300 hover:bg-gray-50 bg-white/80 backdrop-blur-sm"
        >
          {hideBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {hideBalances ? 'Show' : 'Hide'} Balances
        </Button>
      </div>

      {/* Balance Cards - Enhanced Design with Darker Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-2 sm:px-0">
        {/* Total Cash In - Darker Green Background */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-4 sm:p-6 text-white border border-green-500 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Total Cash In</h3>
            <p className="text-2xl sm:text-3xl font-bold mb-1 text-white">
              {hideBalances ? (
                <span className="text-white">••••••</span>
              ) : (
                <SimpleCounter
                  amount={stats.total_cash_in}
                  currency="ZMW"
                  className="text-2xl sm:text-3xl font-bold text-white"
                />
              )}
            </p>
            <p className="text-xs sm:text-sm text-white/90 font-medium">Income transactions</p>
          </div>
        </div>

        {/* Total Cash Out - Darker Red Background */}
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-4 sm:p-6 text-white border border-red-500 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Total Cash Out</h3>
            <p className="text-2xl sm:text-3xl font-bold mb-1 text-white">
              {hideBalances ? (
                <span className="text-white">••••••</span>
              ) : (
                <SimpleCounter
                  amount={stats.total_cash_out}
                  currency="ZMW"
                  className="text-2xl sm:text-3xl font-bold text-white"
                />
              )}
            </p>
            <p className="text-xs sm:text-sm text-white/90 font-medium">Expense transactions</p>
          </div>
        </div>

        {/* Net Balance - Darker Light Green Background */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-4 sm:p-6 text-white border border-emerald-500 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Net Balance</h3>
            <p className="text-2xl sm:text-3xl font-bold mb-1 text-white">
              {hideBalances ? (
                <span className="text-white">••••••</span>
              ) : (
                <SimpleCounter
                  amount={stats.net_balance}
                  currency="ZMW"
                  className="text-2xl sm:text-3xl font-bold text-white"
                />
              )}
            </p>
            <p className="text-xs sm:text-sm text-white/90 font-medium">Available balance</p>
          </div>
        </div>

        {/* Business Metric - Darker Purple */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-4 sm:p-6 text-white border border-purple-500 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <MetricIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
              Total {currentCompany?.settings?.metric_name ?
                currentCompany.settings.metric_name.charAt(0).toUpperCase() + currentCompany.settings.metric_name.slice(1) :
                'Pictures'}
            </h3>
            <p className="text-2xl sm:text-3xl font-bold mb-1">
              <SimpleCounter
                amount={stats.total_pictures}
                currency=""
                className="text-2xl sm:text-3xl font-bold text-white"
                decimals={0}
              />
            </p>
            <p className="text-xs sm:text-sm text-white/90 font-medium">
              {currentCompany?.settings?.metric_name ?
                currentCompany.settings.metric_name.charAt(0).toUpperCase() + currentCompany.settings.metric_name.slice(1) + ' captured' :
                'Pictures captured'
              }
            </p>
          </div>
        </div>

      </div>

      {/* Total Transactions - Text Format */}
      <div className="text-center py-4">
        <p className="text-lg text-gray-600">
          Total Transactions: <AnimatedNumber
            value={stats.total_transactions}
            formatFunction={(val) => Math.round(val).toString()}
            className="font-bold text-gray-900"
          />
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Dialog open={showCashInDialog} onOpenChange={setShowCashInDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 mobile:min-h-[56px] mobile:px-8 mobile:text-lg mobile:font-semibold">
              <Plus className="h-4 w-4 mobile:h-6 mobile:w-6" />
              Cash In
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto mobile:max-h-[95vh] mobile:w-[98vw] mobile:max-w-none mobile:mx-1 mobile:min-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Cash In Transaction
              </DialogTitle>
              <DialogDescription>
                Add money to the system. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mobile:space-y-5 mobile:pb-4">
              {/* Transaction Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cash-in-date" className="text-sm font-medium">Transaction Date *</Label>
                  <Input
                    id="cash-in-date"
                    type="date"
                    value={cashInForm.date}
                    onChange={(e) => setCashInForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full mobile:min-h-[44px] mobile:text-base"
                    style={{ fontSize: 'max(16px, 1rem)' }}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Select any date (past, present, or future)</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Time</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="cash-in-category" className="text-sm font-medium">Category *</Label>
                <Select value={cashInForm.category_name} onValueChange={(value) => {
                  if (value === 'add-manual') {
                    setShowManualCategoryInput(true);
                  } else {
                    setCashInForm(prev => ({ ...prev, category_name: value }));
                  }
                }}>
                  <SelectTrigger className="mobile:min-h-[44px] mobile:text-base">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(cat => cat.type === 'cash-in' || cat.type === 'both').map(category => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="add-manual" className="text-blue-600 font-medium">
                      + Add New Category
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Manual Category Input */}
                {showManualCategoryInput && (
                  <div className="mt-3 p-3 border rounded-lg bg-blue-50">
                    <Label className="text-sm font-medium text-blue-800">Add New Category</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={manualCategoryName}
                        onChange={(e) => setManualCategoryName(e.target.value)}
                        placeholder="Enter category name"
                        className="flex-1 mobile:min-h-[44px] mobile:text-base"
                        style={{ fontSize: 'max(16px, 1rem)' }}
                      />
                      <Button
                        onClick={async () => {
                          const success = await addManualCategory(manualCategoryName, 'cash-in');
                          if (success) {
                            setCashInForm(prev => ({ ...prev, category_name: manualCategoryName }));
                          }
                        }}
                        disabled={isAddingCategory || !manualCategoryName.trim()}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isAddingCategory ? 'Adding...' : 'Add'}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowManualCategoryInput(false);
                          setManualCategoryName('');
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount - Manual Entry Only */}
              <div>
                <Label htmlFor="cash-in-amount" className="text-sm font-medium">Amount (ZMW) *</Label>
                <Input
                  id="cash-in-amount"
                  type="number"
                  value={cashInForm.amount}
                  onChange={(e) => setCashInForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter amount (e.g., 100)"
                  className="mobile:min-h-[44px] mobile:text-base"
                  style={{ fontSize: 'max(16px, 1rem)' }}
                  min="1"
                  step="1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter the cash-in amount manually</p>
              </div>

              {/* Number of Pictures - Manual Entry Only */}
              <div>
                <Label htmlFor="cash-in-pictures" className="text-sm font-medium">Number of Pictures</Label>
                <Input
                  id="cash-in-pictures"
                  type="number"
                  value={cashInForm.number_of_pictures}
                  onChange={(e) => setCashInForm(prev => ({ ...prev, number_of_pictures: e.target.value }))}
                  placeholder="Enter number of pictures (e.g., 5)"
                  className="mobile:min-h-[44px] mobile:text-base"
                  style={{ fontSize: 'max(16px, 1rem)' }}
                  min="0"
                  step="1"
                />
                <p className="text-xs text-gray-500 mt-1">Enter the number of pictures manually</p>
              </div>

              {/* Customer Name */}
              <div>
                <Label htmlFor="cash-in-customer" className="text-sm font-medium">Customer Name *</Label>
                <Input
                  id="cash-in-customer"
                  value={cashInForm.customer_name}
                  onChange={(e) => setCashInForm(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Enter customer name"
                  className="mobile:min-h-[44px] mobile:text-base"
                  style={{ fontSize: 'max(16px, 1rem)' }}
                  required
                />
              </div>

              {/* WhatsApp Number */}
              <div>
                <Label htmlFor="cash-in-whatsapp" className="text-sm font-medium">WhatsApp Number *</Label>
                <Input
                  id="cash-in-whatsapp"
                  value={cashInForm.whatsapp_number}
                  onChange={(e) => setCashInForm(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                  placeholder="+260 97 123 4567"
                  className="mobile:min-h-[44px] mobile:text-base"
                  style={{ fontSize: 'max(16px, 1rem)' }}
                  required
                />
              </div>

              {/* Details */}
              <div>
                <Label htmlFor="cash-in-details" className="text-sm font-medium">Details (Optional)</Label>
                <Textarea
                  id="cash-in-details"
                  value={cashInForm.details}
                  onChange={(e) => setCashInForm(prev => ({ ...prev, details: e.target.value }))}
                  placeholder="Enter transaction details (optional)"
                  className="mobile:min-h-[88px] mobile:text-base"
                  style={{ fontSize: 'max(16px, 1rem)' }}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCashIn();
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isSubmittingCashIn}
                  type="button"
                >
                  {isSubmittingCashIn ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Cash In'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCashInDialog(false)}
                  disabled={isSubmittingCashIn}
                  type="button"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showCashOutDialog} onOpenChange={setShowCashOutDialog}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 mobile:min-h-[56px] mobile:px-8 mobile:text-lg mobile:font-semibold">
              <Minus className="h-4 w-4 mobile:h-6 mobile:w-6" />
              Cash Out
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto mobile:max-h-[95vh] mobile:w-[98vw] mobile:max-w-none mobile:mx-1 mobile:min-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Minus className="h-5 w-5 text-red-600" />
                Cash Out Transaction
              </DialogTitle>
              <DialogDescription>
                Withdraw money from the system.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mobile:space-y-5 mobile:pb-4">
              {/* Transaction Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cash-out-date" className="text-sm font-medium">Transaction Date *</Label>
                  <Input
                    id="cash-out-date"
                    type="date"
                    value={cashOutForm.date}
                    onChange={(e) => setCashOutForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full mobile:min-h-[44px] mobile:text-base"
                    style={{ fontSize: 'max(16px, 1rem)' }}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Select any date (past, present, or future)</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Time</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Withdrawn By (Auto-set) */}
              <div>
                <Label className="text-sm font-medium">Withdrawn By</Label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{currentUser.username || currentUser.email}</span>
                </div>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="cash-out-category" className="text-sm font-medium">Category *</Label>
                <Select value={cashOutForm.category_name} onValueChange={(value) => {
                  if (value === 'add-manual') {
                    setShowManualCategoryInput(true);
                  } else {
                    setCashOutForm(prev => ({ ...prev, category_name: value }));
                  }
                }}>
                  <SelectTrigger className="mobile:min-h-[44px] mobile:text-base">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(cat => cat.type === 'cash-out' || cat.type === 'both').map(category => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="add-manual" className="text-blue-600 font-medium">
                      + Add New Category
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Manual Category Input */}
                {showManualCategoryInput && (
                  <div className="mt-3 p-3 border rounded-lg bg-blue-50">
                    <Label className="text-sm font-medium text-blue-800">Add New Category</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={manualCategoryName}
                        onChange={(e) => setManualCategoryName(e.target.value)}
                        placeholder="Enter category name"
                        className="flex-1 mobile:min-h-[44px] mobile:text-base"
                        style={{ fontSize: 'max(16px, 1rem)' }}
                      />
                      <Button
                        onClick={async () => {
                          const success = await addManualCategory(manualCategoryName, 'cash-out');
                          if (success) {
                            setCashOutForm(prev => ({ ...prev, category_name: manualCategoryName }));
                          }
                        }}
                        disabled={isAddingCategory || !manualCategoryName.trim()}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isAddingCategory ? 'Adding...' : 'Add'}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowManualCategoryInput(false);
                          setManualCategoryName('');
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount - Manual Entry Only */}
              <div>
                <Label htmlFor="cash-out-amount" className="text-sm font-medium">Amount (ZMW) *</Label>
                <Input
                  id="cash-out-amount"
                  type="number"
                  value={cashOutForm.amount}
                  onChange={(e) => setCashOutForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter amount (e.g., 50)"
                  className="mobile:min-h-[44px] mobile:text-base"
                  style={{ fontSize: 'max(16px, 1rem)' }}
                  min="1"
                  step="1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter the cash-out amount manually</p>
              </div>

              {/* Details */}
              <div>
                <Label htmlFor="cash-out-details" className="text-sm font-medium">Details</Label>
                <Textarea
                  id="cash-out-details"
                  value={cashOutForm.details}
                  onChange={(e) => setCashOutForm(prev => ({ ...prev, details: e.target.value }))}
                  placeholder="Enter withdrawal details (optional)"
                  className="mobile:min-h-[88px] mobile:text-base"
                  style={{ fontSize: 'max(16px, 1rem)' }}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCashOut}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={isSubmittingCashOut}
                >
                  {isSubmittingCashOut ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Cash Out'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCashOutDialog(false)}
                  disabled={isSubmittingCashOut}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Transaction History - Real-time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            Real-time transaction history for {currentCompany.display_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
              <p className="text-gray-600 mb-4">Start by creating your first cash-in or cash-out transaction.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Customer/Withdrawn By</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Pictures</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">WhatsApp</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Entry by</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{new Date(transaction.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">{transaction.time}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={transaction.type === 'cash-in' ? 'default' : 'destructive'}
                          className={transaction.type === 'cash-in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          {transaction.type === 'cash-in' ? (
                            <><TrendingUp className="h-3 w-3 mr-1" /> Cash In</>
                          ) : (
                            <><TrendingDown className="h-3 w-3 mr-1" /> Cash Out</>
                          )}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">{transaction.category_name}</td>
                      <td className="py-3 px-4 text-sm font-medium">
                        <span className={transaction.type === 'cash-in' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'cash-in' ? '+' : '-'}ZMW {transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {transaction.type === 'cash-in' ? transaction.customer_name : transaction.withdrawn_by}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {transaction.number_of_pictures > 0 && (
                          <div className="flex items-center gap-1">
                            <Camera className="h-4 w-4 text-gray-400" />
                            <span>{transaction.number_of_pictures}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {transaction.whatsapp_number && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{transaction.whatsapp_number}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTransaction(transaction)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{transaction.added_by || 'System'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>


            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
