// Simplified Multi-Tenant Transaction Manager for debugging
// This is a minimal version to test if the component loads

import React, { useState, useEffect } from 'react';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  Camera, 
  DollarSign,
  Plus,
  Minus,
  FileText
} from 'lucide-react';

interface Stats {
  total_cash_in: number;
  total_cash_out: number;
  net_balance: number;
  total_pictures: number;
  total_transactions: number;
}

export function MTTransactionManagerSimple() {
  const { currentUser, currentCompany } = useMultiTenantAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<Stats>({
    total_cash_in: 0,
    total_cash_out: 0,
    net_balance: 0,
    total_pictures: 0,
    total_transactions: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (currentCompany) {
      loadData();
    }
  }, [currentCompany]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading transaction data for company:', currentCompany?.id);
      
      // Load transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('mt_company_transactions')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (transactionError) {
        console.error('❌ Error loading transactions:', transactionError);
        toast({
          title: "Error Loading Transactions",
          description: "Failed to load transaction data. Please refresh the page.",
          variant: "destructive",
        });
      } else {
        console.log('✅ Loaded transactions:', transactionData?.length || 0);
        setTransactions(transactionData || []);
        
        // Calculate stats manually
        const cashIn = transactionData?.filter(t => t.type === 'cash-in').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
        const cashOut = transactionData?.filter(t => t.type === 'cash-out').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
        const pictures = transactionData?.reduce((sum, t) => sum + (t.number_of_pictures || 0), 0) || 0;
        
        setStats({
          total_cash_in: cashIn,
          total_cash_out: cashOut,
          net_balance: cashIn - cashOut,
          total_pictures: pictures,
          total_transactions: transactionData?.length || 0
        });
      }
    } catch (error) {
      console.error('❌ Error in loadData:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestCashIn = async () => {
    try {
      console.log('🔄 Creating test cash-in transaction...');
      
      const { error } = await supabase
        .from('mt_company_transactions')
        .insert([{
          company_id: currentCompany.id,
          type: 'cash-in',
          category_name: 'Wedding Photography',
          amount: 500.00,
          customer_name: 'Test Customer',
          whatsapp_number: '+260971234567',
          number_of_pictures: 50,
          details: 'Test cash-in transaction',
          added_by: currentUser.username || currentUser.email,
          added_by_user_id: currentUser.id
        }]);

      if (error) {
        console.error('❌ Error creating transaction:', error);
        toast({
          title: "Error",
          description: `Failed to create transaction: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('✅ Test transaction created successfully');
        toast({
          title: "Success",
          description: "Test cash-in transaction created successfully!",
        });
        loadData(); // Reload data
      }
    } catch (error) {
      console.error('❌ Error in handleTestCashIn:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  if (!currentUser || !currentCompany) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
        <p className="text-gray-600">Please log in to access the transaction system.</p>
      </div>
    );
  }

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
    <div className="space-y-6">
      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Company:</strong> {currentCompany.display_name}</p>
            <p><strong>Company ID:</strong> {currentCompany.id}</p>
            <p><strong>User:</strong> {currentUser.username || currentUser.email}</p>
            <p><strong>Transactions Loaded:</strong> {transactions.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* Balance Cards - Simplified */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Cash In - White */}
        <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-6 text-white border border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-8 w-8 text-gray-300" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-200 mb-1">Total Cash In</h3>
            <p className="text-3xl font-bold mb-1 text-white">
              {stats.total_cash_in.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-300">Income transactions</p>
          </div>
        </div>

        {/* Total Cash Out - White */}
        <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-6 text-white border border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <TrendingDown className="h-8 w-8 text-gray-300" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-200 mb-1">Total Cash Out</h3>
            <p className="text-3xl font-bold mb-1 text-white">
              {stats.total_cash_out.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-300">Expense transactions</p>
          </div>
        </div>

        {/* Net Balance - White */}
        <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-6 text-white border border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-8 w-8 text-gray-300" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-200 mb-1">Net Balance</h3>
            <p className="text-3xl font-bold mb-1 text-white">
              {stats.net_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-lg font-normal ml-1">ZMW</span>
            </p>
            <p className="text-sm text-gray-300">Available balance</p>
          </div>
        </div>

        {/* Total Pictures - Purple */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Camera className="h-8 w-8 text-purple-100" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-purple-100 mb-1">Total Pictures</h3>
            <p className="text-3xl font-bold mb-1">{stats.total_pictures}</p>
            <p className="text-sm text-purple-100">Pictures captured</p>
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="flex gap-4">
        <Button onClick={handleTestCashIn} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Test Cash In
        </Button>
        <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Reload Data
        </Button>
      </div>

      {/* Simple Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
              <p className="text-gray-600 mb-4">Click "Test Cash In" to create your first transaction.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{transaction.type === 'cash-in' ? 'Cash In' : 'Cash Out'}</p>
                    <p className="text-sm text-gray-600">{transaction.category_name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${transaction.type === 'cash-in' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'cash-in' ? '+' : '-'}ZMW {parseFloat(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">{new Date(transaction.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
