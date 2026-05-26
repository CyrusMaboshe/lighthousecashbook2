// Campaign Balance Cards - EXACT REPLICA of existing BalanceCards
// This replicates the exact styling, colors, and layout of the existing system

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Camera } from 'lucide-react';

interface CampaignBalanceCardsProps {
  totalCashIn: number;
  totalCashOut: number;
  netBalance: number;
  totalPictures: number;
  isLoading?: boolean;
}

export function CampaignBalanceCards({
  totalCashIn,
  totalCashOut,
  netBalance,
  totalPictures,
  isLoading = false
}: CampaignBalanceCardsProps) {
  
  // Format currency as ZMW (Zambian Kwacha) - EXACT same format as existing system
  const formatCurrency = (amount: number) => {
    return `ZMW ${amount.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mobile-balance-grid">
      {/* Cash In Card - Resized for Mobile */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 mobile-balance-item">
        <CardContent className="p-3 md:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-green-700 mb-1">Cash In</p>
              <p className="text-lg md:text-xl lg:text-2xl font-bold text-green-800">
                {formatCurrency(totalCashIn)}
              </p>
              <p className="text-xs text-green-600 mt-1 hidden md:block">
                Revenue Generated
              </p>
            </div>
            <div className="bg-green-100 p-2 md:p-3 rounded-full">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Out Card - Resized for Mobile */}
      <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 mobile-balance-item">
        <CardContent className="p-3 md:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-red-700 mb-1">Cash Out</p>
              <p className="text-lg md:text-xl lg:text-2xl font-bold text-red-800">
                {formatCurrency(totalCashOut)}
              </p>
              <p className="text-xs text-red-600 mt-1 hidden md:block">
                Expenses Incurred
              </p>
            </div>
            <div className="bg-red-100 p-2 md:p-3 rounded-full">
              <TrendingDown className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net Balance Card - Resized for Mobile */}
      <Card className={`bg-gradient-to-br shadow-lg hover:shadow-xl transition-all duration-300 mobile-balance-item ${
        netBalance >= 0
          ? 'from-blue-50 to-indigo-50 border-blue-200'
          : 'from-orange-50 to-amber-50 border-orange-200'
      }`}>
        <CardContent className="p-3 md:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs md:text-sm font-medium mb-1 ${
                netBalance >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}>
                Net Balance
              </p>
              <p className={`text-lg md:text-xl lg:text-2xl font-bold ${
                netBalance >= 0 ? 'text-blue-800' : 'text-orange-800'
              }`}>
                {formatCurrency(netBalance)}
              </p>
              <p className={`text-xs mt-1 hidden md:block ${
                netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {netBalance >= 0 ? 'Profit Made' : 'Loss Incurred'}
              </p>
            </div>
            <div className={`p-2 md:p-3 rounded-full ${
              netBalance >= 0 ? 'bg-blue-100' : 'bg-orange-100'
            }`}>
              <DollarSign className={`h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 ${
                netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Pictures Card - Resized for Mobile */}
      <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 mobile-balance-item">
        <CardContent className="p-3 md:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-purple-700 mb-1">Pictures</p>
              <p className="text-lg md:text-xl lg:text-2xl font-bold text-purple-800">
                {totalPictures.toLocaleString()}
              </p>
              <p className="text-xs text-purple-600 mt-1 hidden md:block">
                Photos Captured
              </p>
            </div>
            <div className="bg-purple-100 p-2 md:p-3 rounded-full">
              <Camera className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
