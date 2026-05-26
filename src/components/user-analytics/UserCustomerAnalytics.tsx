import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Star, 
  TrendingUp, 
  Search,
  Calendar,
  DollarSign,
  Award,
  Heart,
  UserCheck,
  Repeat
} from 'lucide-react';
import { User } from '@/types/auth';

interface UserCustomerAnalyticsProps {
  transactions: any[];
  currentUser: User | null;
  selectedMonth?: string;
}

interface CustomerData {
  name: string;
  totalSpent: number;
  visitCount: number;
  lastVisit: string;
  avgTransactionValue: number;
  loyaltyScore: number;
  category: 'VIP' | 'Regular' | 'New';
}

export function UserCustomerAnalytics({ transactions, currentUser, selectedMonth }: UserCustomerAnalyticsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'totalSpent' | 'visitCount' | 'lastVisit'>('totalSpent');

  // Process customer data
  const customerData = useMemo(() => {
    let userTransactions = transactions.filter(
      t => t.added_by === currentUser?.username &&
           t.type === 'cash-in' &&
           t.customer_name &&
           t.customer_name.trim() !== ''
    );

    // Filter by selected month if provided
    if (selectedMonth) {
      userTransactions = userTransactions.filter(t => {
        const transactionMonth = t.date.slice(0, 7); // YYYY-MM format
        return transactionMonth === selectedMonth;
      });
    }

    const customerMap = new Map<string, CustomerData>();

    userTransactions.forEach(transaction => {
      const customerName = transaction.customer_name.trim();
      
      if (!customerMap.has(customerName)) {
        customerMap.set(customerName, {
          name: customerName,
          totalSpent: 0,
          visitCount: 0,
          lastVisit: transaction.created_at,
          avgTransactionValue: 0,
          loyaltyScore: 0,
          category: 'New'
        });
      }

      const customer = customerMap.get(customerName)!;
      customer.totalSpent += transaction.amount || 0;
      customer.visitCount += 1;
      
      // Update last visit if this transaction is more recent
      if (new Date(transaction.created_at) > new Date(customer.lastVisit)) {
        customer.lastVisit = transaction.created_at;
      }
    });

    // Calculate derived metrics and categorize customers
    const customers = Array.from(customerMap.values()).map(customer => {
      customer.avgTransactionValue = customer.totalSpent / customer.visitCount;
      
      // Calculate loyalty score (0-100)
      const spentScore = Math.min(customer.totalSpent / 1000, 1) * 40; // Max 40 points for spending
      const visitScore = Math.min(customer.visitCount / 10, 1) * 30; // Max 30 points for visits
      const recencyScore = (() => {
        const daysSinceLastVisit = Math.floor(
          (Date.now() - new Date(customer.lastVisit).getTime()) / (1000 * 60 * 60 * 24)
        );
        return Math.max(0, (30 - daysSinceLastVisit) / 30) * 30; // Max 30 points for recency
      })();
      
      customer.loyaltyScore = Math.round(spentScore + visitScore + recencyScore);

      // Categorize customer
      if (customer.loyaltyScore >= 70 || customer.visitCount >= 5) {
        customer.category = 'VIP';
      } else if (customer.visitCount >= 2) {
        customer.category = 'Regular';
      } else {
        customer.category = 'New';
      }

      return customer;
    });

    return customers;
  }, [transactions, currentUser, selectedMonth]);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = customerData.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'totalSpent':
          return b.totalSpent - a.totalSpent;
        case 'visitCount':
          return b.visitCount - a.visitCount;
        case 'lastVisit':
          return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
        default:
          return b.totalSpent - a.totalSpent;
      }
    });

    return filtered;
  }, [customerData, searchTerm, sortBy]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalCustomers = customerData.length;
    const vipCustomers = customerData.filter(c => c.category === 'VIP').length;
    const regularCustomers = customerData.filter(c => c.category === 'Regular').length;
    const newCustomers = customerData.filter(c => c.category === 'New').length;

    // BUSINESS RULE: Total Revenue MUST equal Total Cash-In for user analytics
    const totalCashIn = customerData.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalRevenue = totalCashIn; // Enforce: Revenue = Cash-In

    const avgCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const repeatCustomers = customerData.filter(c => c.visitCount > 1).length;
    const retentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    // Validation: Ensure revenue equals cash-in
    if (totalRevenue !== totalCashIn) {
      console.error('❌ CUSTOMER ANALYTICS VALIDATION ERROR: Revenue does not equal Cash-In!', {
        totalRevenue,
        totalCashIn,
        difference: totalRevenue - totalCashIn
      });
    }

    return {
      totalCustomers,
      vipCustomers,
      regularCustomers,
      newCustomers,
      totalRevenue,
      avgCustomerValue,
      repeatCustomers,
      retentionRate
    };
  }, [customerData]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'VIP': return 'bg-yellow-100 text-yellow-800';
      case 'Regular': return 'bg-blue-100 text-blue-800';
      case 'New': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'VIP': return Star;
      case 'Regular': return UserCheck;
      case 'New': return Users;
      default: return Users;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Customers</p>
                <p className="text-2xl font-bold text-blue-600">
                  {summaryStats.totalCustomers}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">VIP Customers</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {summaryStats.vipCustomers}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Retention Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {summaryStats.retentionRate.toFixed(1)}%
                </p>
              </div>
              <Repeat className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg. Customer Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  ZMW {summaryStats.avgCustomerValue.toFixed(0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              VIP Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {summaryStats.vipCustomers}
              </div>
              <p className="text-sm text-slate-600">
                {summaryStats.totalCustomers > 0 
                  ? ((summaryStats.vipCustomers / summaryStats.totalCustomers) * 100).toFixed(1)
                  : 0}% of total customers
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-500" />
              Regular Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {summaryStats.regularCustomers}
              </div>
              <p className="text-sm text-slate-600">
                {summaryStats.totalCustomers > 0 
                  ? ((summaryStats.regularCustomers / summaryStats.totalCustomers) * 100).toFixed(1)
                  : 0}% of total customers
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              New Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {summaryStats.newCustomers}
              </div>
              <p className="text-sm text-slate-600">
                {summaryStats.totalCustomers > 0 
                  ? ((summaryStats.newCustomers / summaryStats.totalCustomers) * 100).toFixed(1)
                  : 0}% of total customers
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customer Directory</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="totalSpent">Sort by Spending</option>
                <option value="visitCount">Sort by Visits</option>
                <option value="lastVisit">Sort by Last Visit</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredCustomers.slice(0, 10).map((customer, index) => {
              const CategoryIcon = getCategoryIcon(customer.category);
              return (
                <div key={customer.name} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{customer.name}</h4>
                        <Badge className={getCategoryColor(customer.category)}>
                          <CategoryIcon className="w-3 h-3 mr-1" />
                          {customer.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {customer.visitCount} visit{customer.visitCount !== 1 ? 's' : ''} • 
                        Last: {new Date(customer.lastVisit).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">ZMW {customer.totalSpent.toFixed(2)}</p>
                    <p className="text-sm text-slate-600">
                      Avg: ZMW {customer.avgTransactionValue.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Heart className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-slate-500">{customer.loyaltyScore}% loyalty</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredCustomers.length > 10 && (
            <div className="text-center mt-4">
              <Button variant="outline">
                View All {filteredCustomers.length} Customers
              </Button>
            </div>
          )}
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No customers found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
