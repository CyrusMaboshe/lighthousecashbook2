/**
 * All-Time User Cash Summary
 * Shows comprehensive cash in/out totals for each user across all months and years
 * Company-specific data only
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Users,
  Calendar,
  Activity,
  Target,
  AlertCircle
} from 'lucide-react';
import { AnimatedNumber } from '@/components/AnimatedNumber';

interface UserCashSummary {
  user_id: string;
  username: string;
  email: string;
  total_cash_in: number;
  total_cash_out: number;
  net_balance: number;
  transaction_count: number;
  first_transaction: string | null;
  last_transaction: string | null;
  avg_transaction_value: number;
}

export function AllTimeUserCashSummary() {
  const { currentCompany } = useMultiTenantAuth();
  const { toast } = useToast();
  const [userSummaries, setUserSummaries] = useState<UserCashSummary[]>([]);
  const [filteredSummaries, setFilteredSummaries] = useState<UserCashSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof UserCashSummary>('username');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch all-time user cash summaries for the current company
  const fetchAllTimeUserSummaries = async () => {
    if (!currentCompany?.id) return;

    try {
      setLoading(true);
      console.log(`🔄 Fetching all-time user summaries for company: ${currentCompany.display_name}`);

      // Get all company users
      const { data: companyUsers, error: usersError } = await supabase
        .from('mt_company_users')
        .select('id, username, email, company_id')
        .eq('company_id', currentCompany.id);

      if (usersError) {
        console.error('❌ Error fetching company users:', usersError);
        throw usersError;
      }

      console.log('✅ Fetched company users:', companyUsers?.length);

      // Get ALL transactions for this company (all-time)
      const { data: allTransactions, error: transError } = await supabase
        .from('mt_company_transactions')
        .select('*')
        .eq('company_id', currentCompany.id);

      if (transError) {
        console.error('❌ Error fetching company transactions:', transError);
        throw transError;
      }

      console.log('✅ Fetched all-time transactions:', allTransactions?.length);

      // Calculate all-time summaries for each user
      const summaries: UserCashSummary[] = [];

      for (const user of companyUsers || []) {
        // Filter transactions for this user
        const userTransactions = allTransactions?.filter(t => t.added_by_user_id === user.id) || [];

        console.log(`📊 User ${user.username}: ${userTransactions.length} all-time transactions`);

        // Calculate totals
        const cashInTransactions = userTransactions.filter(t => t.type === 'cash-in');
        const cashOutTransactions = userTransactions.filter(t => t.type === 'cash-out');

        const totalCashIn = cashInTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const totalCashOut = cashOutTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const netBalance = totalCashIn - totalCashOut;
        const transactionCount = userTransactions.length;

        // Calculate additional metrics
        const avgTransactionValue = cashInTransactions.length > 0 ? totalCashIn / cashInTransactions.length : 0;
        
        // Get first and last transaction dates
        const sortedTransactions = userTransactions.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const firstTransaction = sortedTransactions.length > 0 ? sortedTransactions[0].created_at : null;
        const lastTransaction = sortedTransactions.length > 0 ? sortedTransactions[sortedTransactions.length - 1].created_at : null;

        summaries.push({
          user_id: user.id,
          username: user.username || user.email,
          email: user.email,
          total_cash_in: totalCashIn,
          total_cash_out: totalCashOut,
          net_balance: netBalance,
          transaction_count: transactionCount,
          first_transaction: firstTransaction,
          last_transaction: lastTransaction,
          avg_transaction_value: avgTransactionValue
        });
      }

      console.log('✅ All-time user summaries calculated:', summaries.length);
      setUserSummaries(summaries);
      setFilteredSummaries(summaries);

    } catch (error) {
      console.error('Error fetching all-time user summaries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user cash summaries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort summaries
  useEffect(() => {
    let filtered = userSummaries.filter(summary =>
      summary.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort summaries
    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    setFilteredSummaries(filtered);
  }, [userSummaries, searchTerm, sortBy, sortOrder]);

  // Load data on component mount
  useEffect(() => {
    if (currentCompany?.id) {
      fetchAllTimeUserSummaries();
    }
  }, [currentCompany?.id]);

  // Real-time subscription for updates
  useEffect(() => {
    if (!currentCompany?.id) return;

    const subscription = supabase
      .channel(`user_summary_${currentCompany.id}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mt_company_transactions',
          filter: `company_id=eq.${currentCompany.id}`
        },
        (payload) => {
          console.log('🔄 Real-time update for user summaries:', payload);
          fetchAllTimeUserSummaries();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentCompany?.id]);

  const formatCurrency = (amount: number) => {
    return `ZMW ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleSort = (column: keyof UserCashSummary) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Calculate totals
  const totalStats = {
    totalUsers: filteredSummaries.length,
    totalCashIn: filteredSummaries.reduce((sum, u) => sum + u.total_cash_in, 0),
    totalCashOut: filteredSummaries.reduce((sum, u) => sum + u.total_cash_out, 0),
    totalTransactions: filteredSummaries.reduce((sum, u) => sum + u.transaction_count, 0),
    netBalance: filteredSummaries.reduce((sum, u) => sum + u.net_balance, 0)
  };

  if (!currentCompany) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No company selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading all-time user summaries...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All-Time User Cash Summary</h1>
          <p className="text-gray-600">
            Comprehensive cash flow overview for all users in {currentCompany.display_name} across all months and years
          </p>
        </div>
        <Button
          onClick={fetchAllTimeUserSummaries}
          variant="outline"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-xl font-bold text-blue-600">
                  <AnimatedNumber value={totalStats.totalUsers} decimals={0} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Cash In</p>
                <p className="text-xl font-bold text-green-600">
                  ZMW <AnimatedNumber value={totalStats.totalCashIn} decimals={2} />
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
                  ZMW <AnimatedNumber value={totalStats.totalCashOut} decimals={2} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className={`h-5 w-5 ${totalStats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className="text-sm text-gray-600">Net Balance</p>
                <p className={`text-xl font-bold ${totalStats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ZMW <AnimatedNumber value={totalStats.netBalance} decimals={2} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-xl font-bold text-purple-600">
                  <AnimatedNumber value={totalStats.totalTransactions} decimals={0} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline" className="text-sm">
              {filteredSummaries.length} of {userSummaries.length} users
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* User Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            All-Time User Cash Summary ({filteredSummaries.length} users)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th 
                    className="text-left p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('username')}
                  >
                    Username {sortBy === 'username' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('total_cash_in')}
                  >
                    Total Cash In {sortBy === 'total_cash_in' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('total_cash_out')}
                  >
                    Total Cash Out {sortBy === 'total_cash_out' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('net_balance')}
                  >
                    Net Balance {sortBy === 'net_balance' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-center p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('transaction_count')}
                  >
                    Transactions {sortBy === 'transaction_count' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('avg_transaction_value')}
                  >
                    Avg Value {sortBy === 'avg_transaction_value' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3">Period</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummaries.map((summary) => (
                  <tr key={summary.user_id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium text-gray-900">{summary.username}</p>
                        <p className="text-sm text-gray-500">{summary.email}</p>
                      </div>
                    </td>
                    <td className="p-3 text-right text-green-600 font-semibold">
                      {formatCurrency(summary.total_cash_in)}
                    </td>
                    <td className="p-3 text-right text-red-600 font-semibold">
                      {formatCurrency(summary.total_cash_out)}
                    </td>
                    <td className={`p-3 text-right font-bold ${
                      summary.net_balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(summary.net_balance)}
                    </td>
                    <td className="p-3 text-center text-blue-600 font-medium">
                      {summary.transaction_count}
                    </td>
                    <td className="p-3 text-right text-purple-600 font-medium">
                      {formatCurrency(summary.avg_transaction_value)}
                    </td>
                    <td className="p-3 text-center text-sm text-gray-600">
                      <div>
                        <p>First: {formatDate(summary.first_transaction)}</p>
                        <p>Last: {formatDate(summary.last_transaction)}</p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredSummaries.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found matching your search criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
