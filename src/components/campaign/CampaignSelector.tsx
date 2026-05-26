// Campaign Selector - For testing campaign system
// This allows users to select and enter a campaign

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, Users, Calendar, ArrowRight } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  display_name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  settings: any;
}

interface CampaignSelectorProps {
  onCampaignSelect: (campaignId: string, campaignName: string) => void;
}

export function CampaignSelector({ onCampaignSelect }: CampaignSelectorProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading available campaigns...');

      const { data: campaignsData, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading campaigns:', error);
        toast({
          title: "Error Loading Campaigns",
          description: "Failed to load available campaigns. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Loaded campaigns:', campaignsData?.length || 0);
      setCampaigns(campaignsData || []);
    } catch (error) {
      console.error('❌ Error in loadCampaigns:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading campaigns.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCampaignSelect = (campaign: Campaign) => {
    console.log('🎯 Selected campaign:', campaign.display_name, 'ID:', campaign.id);
    onCampaignSelect(campaign.id, campaign.display_name);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading Campaigns...</h2>
          <p className="text-gray-600">Please wait while we load available campaigns</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Smart Savings - Cashbook
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Campaign Management System
          </p>
          <p className="text-gray-500">
            Select a campaign to access its dedicated dashboard
          </p>
        </div>

        {/* Campaigns Grid */}
        {campaigns.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Campaigns Available</h3>
              <p className="text-gray-600 mb-4">
                No active campaigns found. Contact your administrator to create campaigns.
              </p>
              <Button onClick={loadCampaigns} variant="outline">
                Refresh
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {campaigns.map((campaign) => (
              <Card 
                key={campaign.id} 
                className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-300"
                onClick={() => handleCampaignSelect(campaign)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {campaign.display_name}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {campaign.description || 'Photography campaign management'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      Created {new Date(campaign.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      Campaign ID: {campaign.name}
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCampaignSelect(campaign);
                    }}
                  >
                    Enter Campaign
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            Lighthouse Media Cashbook • Powered by Lighthouse Media • Created By Cyrus Maboshe
          </p>
        </div>
      </div>
    </div>
  );
}
