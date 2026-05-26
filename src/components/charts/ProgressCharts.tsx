import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  LineChart, 
  PieChart,
  Calendar,
  Download
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Transaction {
  id: string;
  type: 'cash-in' | 'cash-out';
  amount: number;
  date: string;
  category_name?: string;
  number_of_pictures?: number;
}

interface ProgressChartsProps {
  transactions: Transaction[];
  balancesVisible: boolean;
}

type ChartType = 'cashflow' | 'balance' | 'categories' | 'trends';
type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

export function ProgressCharts({ transactions, balancesVisible }: ProgressChartsProps) {
  const [activeChart, setActiveChart] = useState<ChartType>('cashflow');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Filter transactions based on time range
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        return transactions;
    }
    
    return transactions.filter(t => new Date(t.date) >= startDate);
  }, [transactions, timeRange]);

  // Prepare cash flow data
  const cashFlowData = useMemo(() => {
    const dailyData: { [key: string]: { cashIn: number; cashOut: number; date: Date } } = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { cashIn: 0, cashOut: 0, date };
      }
      
      if (transaction.type === 'cash-in') {
        dailyData[dateKey].cashIn += transaction.amount;
      } else {
        dailyData[dateKey].cashOut += transaction.amount;
      }
    });
    
    const sortedData = Object.values(dailyData).sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return {
      labels: sortedData.map(d => d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Cash In',
          data: sortedData.map(d => balancesVisible ? d.cashIn : 0),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Cash Out',
          data: sortedData.map(d => balancesVisible ? d.cashOut : 0),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [filteredTransactions, balancesVisible]);

  // Prepare net balance data
  const balanceData = useMemo(() => {
    let runningBalance = 0;
    const dailyData: { [key: string]: { balance: number; date: Date } } = {};
    
    const sortedTransactions = [...filteredTransactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    sortedTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const dateKey = date.toISOString().split('T')[0];
      
      if (transaction.type === 'cash-in') {
        runningBalance += transaction.amount;
      } else {
        runningBalance -= transaction.amount;
      }
      
      dailyData[dateKey] = { balance: runningBalance, date };
    });
    
    const sortedData = Object.values(dailyData).sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return {
      labels: sortedData.map(d => d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Net Balance',
          data: sortedData.map(d => balancesVisible ? d.balance : 0),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [filteredTransactions, balancesVisible]);

  // Prepare category data
  const categoryData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    
    filteredTransactions.forEach(transaction => {
      const category = transaction.category_name || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
    });
    
    const sortedCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8);
    
    const colors = [
      'rgb(239, 68, 68)', 'rgb(34, 197, 94)', 'rgb(59, 130, 246)', 'rgb(168, 85, 247)',
      'rgb(245, 158, 11)', 'rgb(236, 72, 153)', 'rgb(14, 165, 233)', 'rgb(139, 69, 19)'
    ];
    
    return {
      labels: sortedCategories.map(([name]) => name),
      datasets: [
        {
          data: sortedCategories.map(([, amount]) => balancesVisible ? amount : 0),
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };
  }, [filteredTransactions, balancesVisible]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#6b7280',
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#6b7280',
          callback: function(value: any) {
            return balancesVisible ? `ZMW ${value.toLocaleString()}` : '••••••';
          },
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          generateLabels: function(chart: any) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => ({
                text: balancesVisible ? `${label}: ZMW ${data.datasets[0].data[i].toLocaleString()}` : `${label}: ••••••`,
                fillStyle: data.datasets[0].backgroundColor[i],
                strokeStyle: data.datasets[0].backgroundColor[i],
                pointStyle: 'circle',
              }));
            }
            return [];
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            return balancesVisible ? `${context.label}: ZMW ${context.parsed.toLocaleString()}` : `${context.label}: ••••••`;
          },
        },
      },
    },
  };

  const renderChart = () => {
    switch (activeChart) {
      case 'cashflow':
        return (
          <div className="h-96">
            <Line data={cashFlowData} options={chartOptions} />
          </div>
        );
      case 'balance':
        return (
          <div className="h-96">
            <Line data={balanceData} options={chartOptions} />
          </div>
        );
      case 'categories':
        return (
          <div className="h-96">
            <Doughnut data={categoryData} options={doughnutOptions} />
          </div>
        );
      case 'trends':
        return (
          <div className="h-96">
            <Bar data={cashFlowData} options={chartOptions} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeChart === 'cashflow' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveChart('cashflow')}
            className="flex items-center gap-2"
          >
            <LineChart className="w-4 h-4" />
            Cash Flow
          </Button>
          <Button
            variant={activeChart === 'balance' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveChart('balance')}
            className="flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Net Balance
          </Button>
          <Button
            variant={activeChart === 'categories' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveChart('categories')}
            className="flex items-center gap-2"
          >
            <PieChart className="w-4 h-4" />
            Categories
          </Button>
          <Button
            variant={activeChart === 'trends' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveChart('trends')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Trends
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart Display */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {activeChart === 'cashflow' && <LineChart className="w-5 h-5 text-blue-600" />}
              {activeChart === 'balance' && <TrendingUp className="w-5 h-5 text-green-600" />}
              {activeChart === 'categories' && <PieChart className="w-5 h-5 text-purple-600" />}
              {activeChart === 'trends' && <BarChart3 className="w-5 h-5 text-orange-600" />}
              {activeChart === 'cashflow' && 'Cash Flow Analysis'}
              {activeChart === 'balance' && 'Net Balance Progression'}
              {activeChart === 'categories' && 'Category Distribution'}
              {activeChart === 'trends' && 'Trend Analysis'}
            </span>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!balancesVisible ? (
            <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Charts Hidden</h3>
                <p className="text-gray-600">Enable "Show Balances" to view charts</p>
              </div>
            </div>
          ) : (
            renderChart()
          )}
        </CardContent>
      </Card>
    </div>
  );
}
