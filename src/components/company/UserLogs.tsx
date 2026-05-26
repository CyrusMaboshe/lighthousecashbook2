// User Logs Component - Shows all transaction logs (Cash in and Cash Out only)
// This component displays a comprehensive log of all transactions

import React, { useState, useEffect } from 'react';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Calendar,
  User,
  Phone,
  DollarSign,
  Clock,
  FileText
} from 'lucide-react';

interface TransactionLog {
  id: string;
  date: string;
  time: string;
  type: 'cash-in' | 'cash-out';
  category_name: string;
  amount: number;
  customer_name?: string;
  whatsapp_number?: string;
  withdrawn_by?: string;
  added_by: string;
  details?: string;
  created_at: string;
}

interface UserLogsProps {
  selectedMonth?: string;
}

export function UserLogs({ selectedMonth }: UserLogsProps) {
  const { currentUser, currentCompany, isLoading: authLoading, isInitialized } = useMultiTenantAuth();

  // Debug logging
  console.log('🔍 UserLogs - Props and auth state:', {
    selectedMonth,
    currentUser: currentUser?.email,
    currentCompany: currentCompany?.display_name,
    companyId: currentCompany?.id,
    authLoading,
    isInitialized
  });

  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<TransactionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'cash-in' | 'cash-out'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isInitialized && currentCompany?.id) {
      loadLogs();
      const cleanup = setupRealTimeSubscription();
      return cleanup;
    } else if (isInitialized && !currentCompany) {
      setError('No company selected');
      setIsLoading(false);
    }
  }, [currentCompany, isInitialized]);

  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm, filterType, filterDate, selectedMonthFilter]);

  const loadLogs = async () => {
    if (!currentCompany?.id) {
      console.warn('UserLogs: Cannot load logs - no company ID');
      setError('No company selected');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('mt_company_transactions')
        .select('*')
        .eq('company_id', currentCompany.id);

      // USER LOGS SHOULD SHOW ALL-TIME HISTORY - NO MONTH FILTERING
      // The selectedMonth prop is ignored for user logs to show complete history
      console.log('📋 UserLogs: Loading ALL transaction logs (no month filtering for user logs)');

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
      console.log('UserLogs: Loaded', data?.length || 0, 'transaction logs');
    } catch (error) {
      console.error('Error loading transaction logs:', error);
      setError(error instanceof Error ? error.message : 'Failed to load transaction logs');
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealTimeSubscription = () => {
    if (!currentCompany?.id) {
      console.warn('UserLogs: Cannot setup real-time subscription - no company ID');
      return () => {};
    }

    const subscription = supabase
      .channel('user_logs')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mt_company_transactions',
          filter: `company_id=eq.${currentCompany.id}`
        },
        () => {
          loadLogs();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const applyFilters = () => {
    let filtered = logs;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.whatsapp_number?.includes(searchTerm) ||
        log.withdrawn_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.added_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date
    if (filterDate) {
      filtered = filtered.filter(log =>
        log.date === filterDate ||
        log.created_at.startsWith(filterDate)
      );
    }

    // Filter by selected month
    if (selectedMonthFilter) {
      const startDate = `${selectedMonthFilter}-01`;
      const endDate = new Date(parseInt(selectedMonthFilter.split('-')[0]), parseInt(selectedMonthFilter.split('-')[1]), 0)
        .toISOString().split('T')[0];
      filtered = filtered.filter(log => {
        const logDate = log.date || log.created_at.split('T')[0];
        return logDate >= startDate && logDate <= endDate;
      });
    }

    setFilteredLogs(filtered);
  };

  const formatCurrency = (amount: number) => {
    return `ZMW ${amount.toFixed(2)}`;
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  // Show loading state while authentication is initializing
  if (!isInitialized || authLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error if user or company is not available
  if (!currentUser || !currentCompany) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600">Authentication required</p>
            <p className="text-gray-500 text-sm mt-2">
              {!currentUser ? 'Please sign in to view user logs.' : 'No company selected.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600">Error loading user logs</p>
            <p className="text-gray-500 text-sm mt-2">{error}</p>
            <button
              onClick={() => {
                setError(null);
                loadLogs();
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            User Transaction Logs
          </CardTitle>
          <CardDescription>
            Complete log of all cash-in and cash-out transactions for {currentCompany.display_name}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search by name, phone, user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Transaction Type</label>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="cash-in">Cash In Only</SelectItem>
                  <SelectItem value="cash-out">Cash Out Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date Filter</label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <div className="text-sm">
                <p className="font-medium">Total Logs: {filteredLogs.length}</p>
                <p className="text-gray-500">
                  Cash In: {filteredLogs.filter(l => l.type === 'cash-in').length} | 
                  Cash Out: {filteredLogs.filter(l => l.type === 'cash-out').length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Month Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Month Selection
          </CardTitle>
          <CardDescription>
            View transactions and data for specific months
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-3 block">Select Month to View Data</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1;
                  const monthStr = month.toString().padStart(2, '0');
                  const monthValue = `${selectedYear}-${monthStr}`;
                  const monthName = new Date(selectedYear, i).toLocaleDateString('en-US', { month: 'short' });
                  const isSelected = selectedMonthFilter === monthValue;

                  return (
                    <button
                      key={monthValue}
                      onClick={() => {
                        if (selectedMonthFilter === monthValue) {
                          setSelectedMonthFilter(''); // Deselect if already selected
                        } else {
                          setSelectedMonthFilter(monthValue);
                        }
                      }}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {monthName}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Click any month to filter transactions, or click again to show all
              </p>
            </div>
          </div>

          {selectedMonthFilter && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-700">
                <strong>Viewing:</strong> {new Date(selectedYear, parseInt(selectedMonthFilter.split('-')[1]) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} transactions
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading transaction logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No transaction logs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    log.type === 'cash-in'
                      ? 'bg-green-50 border-l-green-500'
                      : 'bg-red-50 border-l-red-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {log.type === 'cash-in' ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                        <Badge variant={log.type === 'cash-in' ? 'default' : 'destructive'}>
                          {log.type === 'cash-in' ? 'Cash In' : 'Cash Out'}
                        </Badge>
                        <span className="text-sm text-gray-500">{log.category_name}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Amount</span>
                          </div>
                          <p className={`font-bold ${
                            log.type === 'cash-in' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(log.amount)}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">
                              {log.type === 'cash-in' ? 'Customer' : 'Withdrawn By'}
                            </span>
                          </div>
                          <p>{log.customer_name || log.withdrawn_by || 'N/A'}</p>
                          {log.whatsapp_number && (
                            <div className="flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{log.whatsapp_number}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Date & Time</span>
                          </div>
                          <p>{formatDateTime(log.created_at)}</p>
                          <p className="text-xs text-gray-500">Added by: {log.added_by}</p>
                        </div>
                      </div>

                      {log.details && (
                        <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
                          <strong>Details:</strong> {log.details}
                        </div>
                      )}
                    </div>
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
