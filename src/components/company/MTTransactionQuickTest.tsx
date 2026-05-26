// Quick test component to verify MTTransactionManager functionality
// This component provides a simple interface to test cash-in and cash-out

import React, { useState } from 'react';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Building2,
  User,
  CheckCircle
} from 'lucide-react';

export function MTTransactionQuickTest() {
  const { currentUser, currentCompany } = useMultiTenantAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Quick Cash In Test
  const handleQuickCashIn = async () => {
    if (!currentUser || !currentCompany) {
      toast({
        title: "Error",
        description: "User or company not found",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('mt_company_transactions')
        .insert([{
          company_id: currentCompany.id,
          type: 'cash-in',
          category_name: 'Test Cash In',
          amount: 100.00,
          customer_name: 'Test Customer',
          whatsapp_number: '+260123456789',
          number_of_pictures: 1,
          details: 'Quick test cash-in transaction',
          added_by: currentUser.username || currentUser.email,
          added_by_user_id: currentUser.id
        }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Test cash-in transaction created successfully",
      });

    } catch (error) {
      console.error('Error creating test cash-in:', error);
      toast({
        title: "Error",
        description: "Failed to create test cash-in transaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Cash Out Test
  const handleQuickCashOut = async () => {
    if (!currentUser || !currentCompany) {
      toast({
        title: "Error",
        description: "User or company not found",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('mt_company_transactions')
        .insert([{
          company_id: currentCompany.id,
          type: 'cash-out',
          category_name: 'Test Cash Out',
          amount: 50.00,
          withdrawn_by: currentUser.username || currentUser.email,
          withdrawn_by_user_id: currentUser.id,
          added_by: currentUser.username || currentUser.email,
          added_by_user_id: currentUser.id,
          details: 'Quick test cash-out transaction',
          customer_name: '',
          whatsapp_number: '',
          number_of_pictures: 0
        }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Test cash-out transaction created successfully",
      });

    } catch (error) {
      console.error('Error creating test cash-out:', error);
      toast({
        title: "Error",
        description: "Failed to create test cash-out transaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser || !currentCompany) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600">❌ Authentication Error</p>
            <p className="text-sm text-gray-500">User or company not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Multi-Tenant Transaction Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Company:</span>
              <Badge variant="outline">{currentCompany.display_name}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-purple-600" />
              <span className="font-medium">User:</span>
              <Badge variant="outline">{currentUser.username || currentUser.email}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Transaction Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick Cash In */}
            <Button
              onClick={handleQuickCashIn}
              disabled={isLoading}
              className="h-20 flex-col bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-6 w-6 mb-2" />
              <span>Test Cash In</span>
              <span className="text-xs opacity-75">ZMW 100.00</span>
            </Button>

            {/* Quick Cash Out */}
            <Button
              onClick={handleQuickCashOut}
              disabled={isLoading}
              className="h-20 flex-col bg-red-600 hover:bg-red-700"
            >
              <Minus className="h-6 w-6 mb-2" />
              <span>Test Cash Out</span>
              <span className="text-xs opacity-75">ZMW 50.00</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. Click "Test Cash In" to create a sample cash-in transaction</p>
            <p>2. Click "Test Cash Out" to create a sample cash-out transaction</p>
            <p>3. Check the transaction history to see real-time updates</p>
            <p>4. Verify that the transactions are saved to the database</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
