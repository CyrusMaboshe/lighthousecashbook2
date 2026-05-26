
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Image, TrendingUp } from 'lucide-react';
import { Transaction } from '@/hooks/useTransactions';

interface PictureStatisticsProps {
  transactions: Transaction[];
}

export function PictureStatistics({ transactions }: PictureStatisticsProps) {
  // Filter cash-in transactions that have pictures
  const pictureTransactions = transactions.filter(t => 
    t.type === 'cash-in' && 
    t.number_of_pictures && 
    typeof t.number_of_pictures === 'number' && 
    t.number_of_pictures > 0
  );

  const totalPictures = pictureTransactions.reduce((sum, t) => sum + (t.number_of_pictures || 0), 0);
  const averagePicturesPerTransaction = pictureTransactions.length > 0 
    ? Math.round(totalPictures / pictureTransactions.length) 
    : 0;

  // Find the customer with most pictures
  const customerStats = pictureTransactions.reduce((acc, t) => {
    const customer = t.customer_name;
    if (!acc[customer]) {
      acc[customer] = { pictures: 0, transactions: 0 };
    }
    acc[customer].pictures += t.number_of_pictures || 0;
    acc[customer].transactions += 1;
    return acc;
  }, {} as Record<string, { pictures: number; transactions: number }>);

  const topCustomer = Object.entries(customerStats)
    .sort(([,a], [,b]) => b.pictures - a.pictures)[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-700">Total Pictures</CardTitle>
          <Camera className="h-5 w-5 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-800">
            {totalPictures.toLocaleString()}
          </div>
          <p className="text-xs text-purple-600 mt-1">
            From {pictureTransactions.length} transactions
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Average per Transaction</CardTitle>
          <Image className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-800">
            {averagePicturesPerTransaction}
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Pictures per session
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-emerald-700">Top Customer</CardTitle>
          <TrendingUp className="h-5 w-5 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-emerald-800 truncate">
            {topCustomer ? topCustomer[0] : 'N/A'}
          </div>
          <p className="text-xs text-emerald-600 mt-1">
            {topCustomer ? `${topCustomer[1].pictures} pictures` : 'No data'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
