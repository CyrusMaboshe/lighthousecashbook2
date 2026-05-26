// System Health Check Component
// This component verifies that all critical systems are working

import React, { useState, useEffect } from 'react';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Database,
  Users,
  Building2,
  Zap
} from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export function SystemHealthCheck() {
  const { currentUser, currentCompany, isInitialized } = useMultiTenantAuth();
  const [checks, setChecks] = useState<HealthCheck[]>([
    { name: 'Authentication System', status: 'checking', message: 'Checking authentication...' },
    { name: 'Database Connection', status: 'checking', message: 'Testing database connection...' },
    { name: 'Multi-Tenant Tables', status: 'checking', message: 'Verifying table structure...' },
    { name: 'Transaction System', status: 'checking', message: 'Testing transaction operations...' },
    { name: 'Real-time Features', status: 'checking', message: 'Checking real-time subscriptions...' }
  ]);

  const updateCheck = (name: string, status: HealthCheck['status'], message: string, details?: string) => {
    setChecks(prev => prev.map(check => 
      check.name === name ? { ...check, status, message, details } : check
    ));
  };

  useEffect(() => {
    runHealthChecks();
  }, [currentUser, currentCompany, isInitialized]);

  const runHealthChecks = async () => {
    // 1. Authentication Check
    if (!isInitialized) {
      updateCheck('Authentication System', 'warning', 'Authentication not initialized');
    } else if (!currentUser || !currentCompany) {
      updateCheck('Authentication System', 'error', 'User or company not found', 
        `User: ${currentUser ? '✓' : '✗'}, Company: ${currentCompany ? '✓' : '✗'}`);
    } else {
      updateCheck('Authentication System', 'success', 
        `Authenticated as ${currentUser.username || currentUser.email}`,
        `Company: ${currentCompany.display_name}, Role: ${currentUser.role}`);
    }

    // 2. Database Connection Check
    try {
      const { data, error } = await supabase
        .from('mt_companies')
        .select('id')
        .limit(1);

      if (error) {
        updateCheck('Database Connection', 'error', 'Database connection failed', error.message);
      } else {
        updateCheck('Database Connection', 'success', 'Database connection successful');
      }
    } catch (error) {
      updateCheck('Database Connection', 'error', 'Database connection error', 
        error instanceof Error ? error.message : 'Unknown error');
    }

    // 3. Multi-Tenant Tables Check
    try {
      const tables = ['mt_companies', 'mt_company_users', 'mt_company_admins', 'mt_company_transactions', 'mt_company_categories'];
      const tableChecks = await Promise.all(
        tables.map(async (table) => {
          const { error } = await supabase.from(table).select('*').limit(1);
          return { table, exists: !error };
        })
      );

      const missingTables = tableChecks.filter(check => !check.exists);
      if (missingTables.length > 0) {
        updateCheck('Multi-Tenant Tables', 'error', 
          `Missing tables: ${missingTables.map(t => t.table).join(', ')}`);
      } else {
        updateCheck('Multi-Tenant Tables', 'success', 'All required tables exist');
      }
    } catch (error) {
      updateCheck('Multi-Tenant Tables', 'error', 'Table verification failed');
    }

    // 4. Transaction System Check
    if (currentCompany) {
      try {
        const { data, error } = await supabase
          .from('mt_company_transactions')
          .select('*')
          .eq('company_id', currentCompany.id)
          .limit(1);

        if (error) {
          updateCheck('Transaction System', 'error', 'Transaction query failed', error.message);
        } else {
          updateCheck('Transaction System', 'success', 
            `Transaction system operational (${data?.length || 0} sample records)`);
        }
      } catch (error) {
        updateCheck('Transaction System', 'error', 'Transaction system error');
      }
    } else {
      updateCheck('Transaction System', 'warning', 'No company context for testing');
    }

    // 5. Real-time Features Check
    try {
      const channel = supabase.channel('health_check');
      const subscription = channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          updateCheck('Real-time Features', 'success', 'Real-time subscriptions working');
          channel.unsubscribe();
        } else if (status === 'CHANNEL_ERROR') {
          updateCheck('Real-time Features', 'error', 'Real-time subscription failed');
        }
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (checks.find(c => c.name === 'Real-time Features')?.status === 'checking') {
          updateCheck('Real-time Features', 'warning', 'Real-time check timeout');
          channel.unsubscribe();
        }
      }, 5000);
    } catch (error) {
      updateCheck('Real-time Features', 'error', 'Real-time setup failed');
    }
  };

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: HealthCheck['status']) => {
    switch (status) {
      case 'checking':
        return 'bg-blue-100 text-blue-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const overallStatus = checks.every(c => c.status === 'success') ? 'success' :
                       checks.some(c => c.status === 'error') ? 'error' :
                       checks.some(c => c.status === 'checking') ? 'checking' : 'warning';

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          System Health Check
          <Badge className={getStatusColor(overallStatus)}>
            {overallStatus.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checks.map((check) => (
            <div key={check.name} className="flex items-start gap-3 p-3 border rounded-lg">
              {getStatusIcon(check.status)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{check.name}</h4>
                  <Badge variant="outline" className={getStatusColor(check.status)}>
                    {check.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{check.message}</p>
                {check.details && (
                  <p className="text-xs text-gray-500 mt-1">{check.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <Button onClick={runHealthChecks} variant="outline">
            Run Checks Again
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            Reload Page
          </Button>
        </div>

        {/* System Information */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">System Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <strong>Environment:</strong> {import.meta.env.MODE || 'development'}
            </div>
            <div>
              <strong>Timestamp:</strong> {new Date().toLocaleString()}
            </div>
            <div>
              <strong>User Agent:</strong> {navigator.userAgent.split(' ')[0]}
            </div>
            <div>
              <strong>URL:</strong> {window.location.href}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
