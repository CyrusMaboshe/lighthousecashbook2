// Test page for Multi-Tenant Transaction functionality
// This page allows testing the cash-in and cash-out features

import React from 'react';
import { SeparateMultiTenantAuthProvider } from '@/hooks/useSeparateMultiTenantAuth';
import { MTTransactionManager } from '@/components/company/MTTransactionManager';
import { MTTransactionQuickTest } from '@/components/company/MTTransactionQuickTest';
import { SystemHealthCheck } from '@/components/debug/SystemHealthCheck';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, DollarSign, TrendingUp } from 'lucide-react';

export function TestMultiTenantTransactions() {
  return (
    <SeparateMultiTenantAuthProvider>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                Multi-Tenant Transaction System Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Cash In/Out</p>
                    <p className="text-sm text-gray-500">Real-time transactions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">ZMW Amounts</p>
                    <p className="text-sm text-gray-500">20-2000 increments</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Multi-Tenant</p>
                    <p className="text-sm text-gray-500">Company isolation</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    ✅ Ready to Test
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Health Check */}
          <SystemHealthCheck />

          {/* Quick Test Component */}
          <MTTransactionQuickTest />

          {/* Full Transaction Manager */}
          <MTTransactionManager />

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">🔍 What to Test:</h4>
                  <ul className="space-y-1 text-sm text-gray-600 ml-4">
                    <li>• Cash-in transactions with customer details</li>
                    <li>• Cash-out transactions with auto withdraw-by</li>
                    <li>• Real-time transaction history updates</li>
                    <li>• ZMW amount selection (20-2000 increments)</li>
                    <li>• Picture count selection (1-500)</li>
                    <li>• Mandatory customer name and WhatsApp for cash-in</li>
                    <li>• Auto date/time stamping</li>
                    <li>• Manual category selection</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">✅ Expected Behavior:</h4>
                  <ul className="space-y-1 text-sm text-gray-600 ml-4">
                    <li>• Transactions save to Supabase immediately</li>
                    <li>• Real-time updates without page refresh</li>
                    <li>• Statistics update automatically</li>
                    <li>• Form validation for required fields</li>
                    <li>• Success/error toast notifications</li>
                    <li>• Company-specific data isolation</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">🚀 How to Access:</h4>
                  <ul className="space-y-1 text-sm text-gray-600 ml-4">
                    <li>• Company Admin Dashboard → Trans tab</li>
                    <li>• Company User Dashboard → Transactions tab</li>
                    <li>• Quick Actions buttons on Overview tab</li>
                    <li>• Direct URL: /test-mt-transactions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SeparateMultiTenantAuthProvider>
  );
}
