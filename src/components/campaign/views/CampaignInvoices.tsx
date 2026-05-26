// Campaign Invoices - Invoice management for campaigns

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt } from 'lucide-react';

interface CampaignInvoicesProps {
  campaignId: string;
}

export function CampaignInvoices({ campaignId }: CampaignInvoicesProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
        <p className="text-gray-600">Create and manage invoices for your campaign</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Invoices
          </CardTitle>
          <CardDescription>Generate and track client invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Invoice functionality will be implemented here</p>
        </CardContent>
      </Card>
    </div>
  );
}
