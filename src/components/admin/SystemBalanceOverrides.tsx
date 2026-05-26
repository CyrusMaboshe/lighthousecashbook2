
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useSystemBalance } from '@/hooks/useSystemBalance';
import { useAuth } from '@/hooks/useAuth';

export function SystemBalanceOverrides() {
  let systemState, balanceOverrides, loading, refetch, isAdmin;

  try {
    const systemBalanceHook = useSystemBalance();
    const authHook = useAuth();

    systemState = systemBalanceHook.systemState;
    balanceOverrides = systemBalanceHook.balanceOverrides;
    loading = systemBalanceHook.loading;
    refetch = systemBalanceHook.refetch;
    isAdmin = authHook.isAdmin;
  } catch (error) {
    console.error('Error in SystemBalanceOverrides hooks:', error);
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            System Balance Status - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700">
            Failed to load system balance information. Please refresh the page or contact support.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          System Balance Status & User Overrides
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800">Admin Balance</h3>
            <p className="text-2xl font-bold text-blue-900">
              ZMW {systemState.adminBalance.toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800">System Status</h3>
            <div className="flex items-center gap-2">
              {systemState.isSystemDepleted ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <Badge variant="destructive">Depleted</Badge>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Badge variant="default" className="bg-green-500">Available</Badge>
                </>
              )}
            </div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-800">Active Overrides</h3>
            <p className="text-2xl font-bold text-purple-900">
              {balanceOverrides.length}
            </p>
          </div>
        </div>

        {/* Active Balance Overrides */}
        {balanceOverrides.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Active User Balance Overrides</h3>
            <div className="space-y-2">
              {balanceOverrides.map((override) => (
                <div key={override.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-orange-800">{override.username}</p>
                      <p className="text-sm text-orange-600">{override.override_reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Original: ZMW {Number(override.original_balance).toFixed(2)}
                      </p>
                      <p className="font-bold text-orange-800">
                        Effective: ZMW {Number(override.effective_balance).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Guidelines */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">System Balance Logic</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• When admin balance reaches zero, all user balances are automatically set to zero</li>
            <li>• User transaction histories remain intact and unmodified</li>
            <li>• Balance overrides are logged and can be restored when system funds are replenished</li>
            <li>• Users see notifications explaining balance adjustments due to system liquidity</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={refetch} 
            variant="outline" 
            size="sm"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
