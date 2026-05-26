// Campaign Settings - Settings management for campaigns

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

interface CampaignSettingsProps {
  campaignId: string;
}

export function CampaignSettings({ campaignId }: CampaignSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Campaign Settings</h1>
        <p className="text-gray-600">Configure your campaign preferences and settings</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>Manage campaign configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Settings functionality will be implemented here</p>
        </CardContent>
      </Card>
    </div>
  );
}
