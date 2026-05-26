// Campaign Debug Component - For testing campaign system

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function CampaignDebug() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testDatabaseConnection = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Testing database connection...');

      // Test campaigns table
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*');

      if (campaignsError) {
        console.error('❌ Campaigns error:', campaignsError);
        toast({
          title: "Database Error",
          description: `Campaigns table error: ${campaignsError.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Campaigns loaded:', campaignsData);
      setCampaigns(campaignsData || []);

      if (campaignsData && campaignsData.length > 0) {
        const campaignId = campaignsData[0].id;
        console.log('🔄 Testing with campaign ID:', campaignId);

        // Test categories table
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('campaign_categories')
          .select('*')
          .eq('campaign_id', campaignId);

        if (categoriesError) {
          console.error('❌ Categories error:', categoriesError);
        } else {
          console.log('✅ Categories loaded:', categoriesData);
          setCategories(categoriesData || []);
        }

        // Test transactions table
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('campaign_transactions')
          .select('*')
          .eq('campaign_id', campaignId);

        if (transactionsError) {
          console.error('❌ Transactions error:', transactionsError);
        } else {
          console.log('✅ Transactions loaded:', transactionsData);
          setTransactions(transactionsData || []);
        }
      }

      toast({
        title: "Database Test Complete",
        description: "Check console for detailed results",
      });

    } catch (error) {
      console.error('❌ Database test error:', error);
      toast({
        title: "Database Test Failed",
        description: "Check console for error details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTestTransaction = async () => {
    if (campaigns.length === 0) {
      toast({
        title: "No Campaign",
        description: "Please test database connection first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const campaignId = campaigns[0].id;

      const { data, error } = await supabase
        .from('campaign_transactions')
        .insert([{
          campaign_id: campaignId,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          type: 'cash-in',
          category_name: 'Wedding Photography',
          amount: 2500.00,
          customer_name: 'Test Customer',
          number_of_pictures: 150,
          whatsapp_number: '+260 97 123 4567',
          details: 'Test transaction for debugging',
          added_by: 'Debug User',
          added_by_user_id: null
        }])
        .select();

      if (error) {
        console.error('❌ Create transaction error:', error);
        toast({
          title: "Transaction Creation Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('✅ Transaction created:', data);
        toast({
          title: "Transaction Created",
          description: "Test transaction created successfully",
        });
        // Reload transactions
        testDatabaseConnection();
      }
    } catch (error) {
      console.error('❌ Create transaction error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign System Debug</CardTitle>
            <CardDescription>Test database connection and campaign functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={testDatabaseConnection} 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Testing...' : 'Test Database Connection'}
              </Button>
              <Button 
                onClick={createTestTransaction} 
                disabled={isLoading || campaigns.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                Create Test Transaction
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle>Campaigns ({campaigns.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="text-gray-500">No campaigns found</p>
            ) : (
              <div className="space-y-2">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-3 bg-gray-100 rounded">
                    <p><strong>Name:</strong> {campaign.display_name}</p>
                    <p><strong>ID:</strong> {campaign.id}</p>
                    <p><strong>Active:</strong> {campaign.is_active ? 'Yes' : 'No'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categories ({categories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-gray-500">No categories found</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {categories.map((category) => (
                  <div key={category.id} className="p-2 bg-gray-100 rounded text-sm">
                    {category.name}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions ({transactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-gray-500">No transactions found</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-3 bg-gray-100 rounded">
                    <p><strong>Customer:</strong> {transaction.customer_name}</p>
                    <p><strong>Amount:</strong> ZMW {transaction.amount}</p>
                    <p><strong>Type:</strong> {transaction.type}</p>
                    <p><strong>Category:</strong> {transaction.category_name}</p>
                    <p><strong>Date:</strong> {transaction.date}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
