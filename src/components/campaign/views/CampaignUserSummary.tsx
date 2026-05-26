// Campaign User Summary - User summary for campaigns

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface CampaignUserSummaryProps {
  campaignId: string;
  stats: any;
}

export function CampaignUserSummary({ campaignId, stats }: CampaignUserSummaryProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Summary</h1>
        <p className="text-gray-600">Overview of user performance and contributions</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Performance
          </CardTitle>
          <CardDescription>Summary of user activities and achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">User summary functionality will be implemented here</p>
        </CardContent>
      </Card>
    </div>
  );
}
