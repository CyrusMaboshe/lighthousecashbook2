// Company Analytics - Placeholder for analytics dashboard
// This will contain the same analytics as the existing system but company-scoped

import React from 'react';
import { TrendingUp, DollarSign, Users, FileText } from 'lucide-react';

interface CompanyAnalyticsProps {
  selectedYear: number;
  selectedMonth: number;
}

export function CompanyAnalytics({ selectedYear, selectedMonth }: CompanyAnalyticsProps) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Company Analytics - {monthNames[selectedMonth]} {selectedYear}
        </h2>
        <p className="text-gray-600 mb-6">
          Real-time analytics for your company transactions and performance.
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Income</p>
                <p className="text-2xl font-bold">$0.00</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Total Expenses</p>
                <p className="text-2xl font-bold">$0.00</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Net Profit</p>
                <p className="text-2xl font-bold">$0.00</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Transactions</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <FileText className="h-8 w-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">🚧 Analytics Dashboard Coming Soon</h3>
          <p className="text-blue-800 mb-4">
            This will include the exact same analytics features as your existing system:
          </p>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• Real-time transaction analytics</li>
            <li>• Monthly and yearly reports</li>
            <li>• Category-wise breakdowns</li>
            <li>• Interactive charts and graphs</li>
            <li>• Cash flow trends</li>
            <li>• Performance metrics</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
