// Safe Multi-Tenant Transaction Manager - Simplified version to prevent white page
// This component provides basic transaction functionality with error boundaries

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
import { 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  FileText,
  Building2,
  User,
  AlertCircle
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

interface Stats {
  total_cash_in: number;
  total_cash_out: number;
  net_balance: number;
  total_pictures: number;
  total_transactions: number;
}

export function MTTransactionManagerSafe() {
  const { currentUser, currentCompany } = useMultiTenantAuth();
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_cash_in: 0,
    total_cash_out: 0,
    net_balance: 0,
    total_pictures: 0,
    total_transactions: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCashInDialog, setShowCashInDialog] = useState(false);
  const [showCashOutDialog, setShowCashOutDialog] = useState(false);
  const [isSubmittingCashIn, setIsSubmittingCashIn] = useState(false);
  const [isSubmittingCashOut, setIsSubmittingCashOut] = useState(false);
  
  // Simple form states
  const [cashInForm, setCashInForm] = useState({
    category_name: 'General',
    amount: '100',
    customer_name: '',
    whatsapp_number: '',
    details: ''
  });
  
  const [cashOutForm, setCashOutForm] = useState({
    category_name: 'General',
    amount: '50',
    details: ''
  });

  // Check if user and company are available
  if (!currentUser || !currentCompany) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-600 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please log in to access transaction management.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    loadData();
  }, [currentCompany]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await loadTransactions();
      await loadStats();
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load transaction data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('mt_company_transactions')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      throw error;
    }
  };

  const loadStats = async () => {
    try {
      // Simple stats calculation without stored procedure
      const { data, error } = await supabase
        .from('mt_company_transactions')
        .select('type, amount, number_of_pictures')
        .eq('company_id', currentCompany.id);

      if (error) throw error;

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
    } catch (error) {
      console.error('Error loading stats:', error);
      // Don't throw here, just use default stats
    }
  };

  const handleCashIn = async () => {
    // ULTIMATE duplicate submission prevention (Safe version)
    if (isSubmittingCashIn) {
      console.log('🚫 Cash-in submission already in progress, ignoring duplicate request');
      return;
    }

    if (!cashInForm.customer_name || !cashInForm.whatsapp_number) {
      toast({
        title: "Validation Error",
        description: "Customer name and WhatsApp number are required for cash-in.",
        variant: "destructive",
      });
      return;
    }

    // Generate a unique transaction identifier for this submission
    const submissionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    setIsSubmittingCashIn(true);
    try {
      console.log('💰 Submitting cash-in transaction (Safe):', {
        submissionId,
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
        console.log('🚫 STRICT duplicate transaction detected (Safe), aborting submission');
        console.log('Recent transactions found:', recentTransactions);
        toast({
          title: "Duplicate Transaction Detected",
          description: "A similar transaction was just created. Please check your transaction history.",
          variant: "destructive",
        });
        return;
      }

      const insertData = {
        company_id: currentCompany.id,
        type: 'cash-in' as const,
        category_name: cashInForm.category_name,
        amount: parseFloat(cashInForm.amount),
        customer_name: cashInForm.customer_name,
        whatsapp_number: cashInForm.whatsapp_number,
        number_of_pictures: 1,
        details: cashInForm.details,
        added_by: currentUser.username || currentUser.email,
        added_by_user_id: currentUser.id
      };

      console.log('📝 Inserting transaction data (Safe):', insertData);

      const { data: insertedData, error } = await supabase
        .from('mt_company_transactions')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Database insertion error (Safe):', error);
        throw error;
      }

      console.log('✅ Transaction inserted successfully (Safe):', insertedData);
      console.log('✅ Cash-in transaction saved successfully (Safe) with ID:', insertedData.id);

      toast({
        title: "Success!",
        description: `Cash-in of ZMW ${parseFloat(cashInForm.amount).toFixed(2)} recorded successfully.`,
      });

      setShowCashInDialog(false);
      setCashInForm({
        category_name: 'General',
        amount: '100',
        customer_name: '',
        whatsapp_number: '',
        details: ''
      });

      // Force reload data after successful insertion
      setTimeout(() => {
        loadData();
      }, 1000);

    } catch (error) {
      console.error('❌ Error creating cash-in (Safe):', error);

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
          description: "Failed to record cash-in transaction.",
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

    setIsSubmittingCashOut(true);
    try {
      console.log('💸 Submitting cash-out transaction (Safe):', {
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

      console.log('✅ Cash-out transaction saved successfully (Safe)');
      toast({
        title: "Success!",
        description: `Cash-out of ZMW ${parseFloat(cashOutForm.amount).toFixed(2)} recorded successfully.`,
      });

      setShowCashOutDialog(false);
      setCashOutForm({
        category_name: 'General',
        amount: '50',
        details: ''
      });

      loadData(); // Reload data
    } catch (error) {
      console.error('❌ Error creating cash-out:', error);
      toast({
        title: "Error",
        description: "Failed to record cash-out transaction.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingCashOut(false);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadData}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            {currentCompany.display_name} - Transaction Management
          </CardTitle>
          <CardDescription>
            Real-time cash-in and cash-out transactions
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Cash In</p>
                <p className="text-xl font-bold text-green-600">
                  ZMW {stats.total_cash_in.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Total Cash Out</p>
                <p className="text-xl font-bold text-red-600">
                  ZMW {stats.total_cash_out.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Net Balance</p>
                <p className="text-xl font-bold text-blue-600">
                  ZMW {stats.net_balance.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-xl font-bold text-purple-600">
                  {stats.total_transactions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Dialog open={showCashInDialog} onOpenChange={setShowCashInDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Cash In
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Cash In</DialogTitle>
              <DialogDescription>
                Add a new cash-in transaction
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Amount (ZMW)</Label>
                <Input
                  type="number"
                  value={cashInForm.amount}
                  onChange={(e) => setCashInForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div>
                <Label>Customer Name *</Label>
                <Input
                  value={cashInForm.customer_name}
                  onChange={(e) => setCashInForm(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label>WhatsApp Number *</Label>
                <Input
                  value={cashInForm.whatsapp_number}
                  onChange={(e) => setCashInForm(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                  placeholder="+260..."
                />
              </div>
              <div>
                <Label>Details</Label>
                <Textarea
                  value={cashInForm.details}
                  onChange={(e) => setCashInForm(prev => ({ ...prev, details: e.target.value }))}
                  placeholder="Transaction details"
                />
              </div>
              <div className="flex gap-2">
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
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <Minus className="h-4 w-4 mr-2" />
              Cash Out
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Cash Out</DialogTitle>
              <DialogDescription>
                Add a new cash-out transaction
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Amount (ZMW)</Label>
                <Input
                  type="number"
                  value={cashOutForm.amount}
                  onChange={(e) => setCashOutForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div>
                <Label>Details</Label>
                <Textarea
                  value={cashOutForm.details}
                  onChange={(e) => setCashOutForm(prev => ({ ...prev, details: e.target.value }))}
                  placeholder="Transaction details"
                />
              </div>
              <div className="flex gap-2">
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

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    transaction.type === 'cash-in'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {transaction.type === 'cash-in' ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">
                        {transaction.type === 'cash-in' ? 'Cash In' : 'Cash Out'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {transaction.customer_name || transaction.withdrawn_by}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.type === 'cash-in' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ZMW {transaction.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
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
