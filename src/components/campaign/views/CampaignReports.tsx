import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  Calendar, Download, BarChart3, PieChart, 
  Activity, ArrowUpRight, ArrowDownRight, Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

interface CampaignReportsProps {
  campaignId: string;
  stats: any;
}

interface CategoryBreakdown {
  category: string;
  cashIn: number;
  cashOut: number;
  netAmount: number;
  transactionCount: number;
  percentage: number;
}

interface MonthlyTrend {
  month: string;
  cashIn: number;
  cashOut: number;
  netBalance: number;
  transactions: number;
}

export function CampaignReports({ campaignId, stats }: CampaignReportsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);

  // Fetch all-time campaign data
  useEffect(() => {
    fetchAllTimeData();

    // Real-time subscription
    const channel = supabase
      .channel(`campaign-reports-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_transactions',
          filter: `campaign_id=eq.${campaignId}`
        },
        () => {
          fetchAllTimeData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const fetchAllTimeData = async () => {
    try {
      setLoading(true);

      // Fetch all transactions
      const { data: transactions, error } = await supabase
        .from('campaign_transactions')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('date', { ascending: false });

      if (error) throw error;

      setAllTransactions(transactions || []);
      processAnalytics(transactions || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = (transactions: any[]) => {
    // Category breakdown
    const categoryMap = new Map<string, CategoryBreakdown>();
    
    transactions.forEach(t => {
      const category = t.category_name || 'Uncategorized';
      const existing = categoryMap.get(category) || {
        category,
        cashIn: 0,
        cashOut: 0,
        netAmount: 0,
        transactionCount: 0,
        percentage: 0
      };

      if (t.type === 'cash-in') {
        existing.cashIn += Number(t.amount);
        existing.netAmount += Number(t.amount);
      } else {
        existing.cashOut += Number(t.amount);
        existing.netAmount -= Number(t.amount);
      }
      existing.transactionCount++;

      categoryMap.set(category, existing);
    });

    const categories = Array.from(categoryMap.values());
    const totalAmount = categories.reduce((sum, c) => sum + Math.abs(c.netAmount), 0);
    
    categories.forEach(c => {
      c.percentage = totalAmount > 0 ? (Math.abs(c.netAmount) / totalAmount) * 100 : 0;
    });

    setCategoryBreakdown(categories.sort((a, b) => Math.abs(b.netAmount) - Math.abs(a.netAmount)));

    // Monthly trends
    const monthMap = new Map<string, MonthlyTrend>();
    
    transactions.forEach(t => {
      const monthKey = format(new Date(t.date), 'MMM yyyy');
      const existing = monthMap.get(monthKey) || {
        month: monthKey,
        cashIn: 0,
        cashOut: 0,
        netBalance: 0,
        transactions: 0
      };

      if (t.type === 'cash-in') {
        existing.cashIn += Number(t.amount);
      } else {
        existing.cashOut += Number(t.amount);
      }
      existing.netBalance = existing.cashIn - existing.cashOut;
      existing.transactions++;

      monthMap.set(monthKey, existing);
    });

    setMonthlyTrends(Array.from(monthMap.values()).reverse());

    // Top customers
    const customerMap = new Map<string, { name: string; totalSpent: number; transactions: number }>();
    
    transactions.filter(t => t.type === 'cash-in').forEach(t => {
      const customer = t.customer_name || 'Unknown';
      const existing = customerMap.get(customer) || { name: customer, totalSpent: 0, transactions: 0 };
      existing.totalSpent += Number(t.amount);
      existing.transactions++;
      customerMap.set(customer, existing);
    });

    setTopCustomers(
      Array.from(customerMap.values())
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10)
    );
  };

  const allTimeStats = useMemo(() => {
    const totalCashIn = allTransactions
      .filter(t => t.type === 'cash-in')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalCashOut = allTransactions
      .filter(t => t.type === 'cash-out')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netProfit = totalCashIn - totalCashOut;
    const profitMargin = totalCashIn > 0 ? (netProfit / totalCashIn) * 100 : 0;
    
    const totalPictures = allTransactions.reduce((sum, t) => sum + (Number(t.number_of_pictures) || 0), 0);
    
    const uniqueCustomers = new Set(allTransactions.map(t => t.customer_name)).size;

    return {
      totalCashIn,
      totalCashOut,
      netProfit,
      profitMargin,
      totalTransactions: allTransactions.length,
      totalPictures,
      uniqueCustomers,
      avgTransactionValue: allTransactions.length > 0 ? totalCashIn / allTransactions.length : 0
    };
  }, [allTransactions]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('All-Time Campaign Financial Report', 105, yPos, { align: 'center' });
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 105, yPos, { align: 'center' });
    
    yPos += 15;

    // Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Revenue: ZMW ${allTimeStats.totalCashIn.toFixed(2)}`, 20, yPos);
    yPos += 6;
    doc.text(`Total Expenses: ZMW ${allTimeStats.totalCashOut.toFixed(2)}`, 20, yPos);
    yPos += 6;
    doc.text(`Net Profit: ZMW ${allTimeStats.netProfit.toFixed(2)}`, 20, yPos);
    yPos += 6;
    doc.text(`Profit Margin: ${allTimeStats.profitMargin.toFixed(2)}%`, 20, yPos);
    yPos += 6;
    doc.text(`Total Transactions: ${allTimeStats.totalTransactions}`, 20, yPos);
    yPos += 6;
    doc.text(`Unique Customers: ${allTimeStats.uniqueCustomers}`, 20, yPos);
    yPos += 15;

    // Category Breakdown
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Category Breakdown', 20, yPos);
    yPos += 8;

    doc.setFontSize(9);
    categoryBreakdown.slice(0, 10).forEach(cat => {
      doc.setFont('helvetica', 'normal');
      doc.text(`${cat.category}:`, 20, yPos);
      doc.text(`ZMW ${cat.netAmount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`, 120, yPos);
      yPos += 6;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        'Campaign Financial Report',
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`campaign-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    toast({
      title: 'Success',
      description: 'Report exported successfully'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">All-time comprehensive financial insights</p>
        </div>
        <Button onClick={exportToPDF} className="gap-2">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Real-time indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Zap className="h-4 w-4 text-green-500 animate-pulse" />
        <span>Real-time data updates</span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ZMW {allTimeStats.totalCashIn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All-time cash inflow</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ZMW {allTimeStats.totalCashOut.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All-time cash outflow</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${allTimeStats.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ZMW {allTimeStats.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {allTimeStats.netProfit >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {allTimeStats.profitMargin.toFixed(2)}% margin
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Unique Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {allTimeStats.uniqueCustomers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {allTimeStats.totalTransactions} total transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories" className="gap-2">
            <PieChart className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <Activity className="h-4 w-4" />
            Monthly Trends
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-2">
            <Users className="h-4 w-4" />
            Top Customers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Category Performance Analysis
              </CardTitle>
              <CardDescription>All-time breakdown by transaction category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryBreakdown.map((cat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{cat.category}</span>
                      <span className="text-sm text-muted-foreground">
                        {cat.transactionCount} transactions
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${cat.netAmount >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right min-w-[120px]">
                        <div className={`font-bold ${cat.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ZMW {cat.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {cat.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="text-green-600">In: ZMW {cat.cashIn.toFixed(2)}</span>
                      <span className="text-red-600">Out: ZMW {cat.cashOut.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Performance Trends
              </CardTitle>
              <CardDescription>Historical month-by-month breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthlyTrends.map((trend, index) => (
                  <div key={index} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{trend.month}</span>
                      <span className="text-sm text-muted-foreground">{trend.transactions} transactions</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">Revenue</div>
                        <div className="font-semibold text-green-600">ZMW {trend.cashIn.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Expenses</div>
                        <div className="font-semibold text-red-600">ZMW {trend.cashOut.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Net</div>
                        <div className={`font-semibold ${trend.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          ZMW {trend.netBalance.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Customers by Revenue
              </CardTitle>
              <CardDescription>All-time highest contributing customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.transactions} transactions</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        ZMW {customer.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Avg: ZMW {(customer.totalSpent / customer.transactions).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
