// Campaign Info Bar - Replicates InfoBar for campaign dashboards

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Calendar, Building2 } from 'lucide-react';

interface CampaignInfoBarProps {
  selectedYear: number;
  selectedMonth: number;
  onYearChange?: (year: number) => void;
  onMonthChange?: (month: number) => void;
  onExportPDF: () => void;
  currentView: string;
  campaignName: string;
}

export function CampaignInfoBar({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  onExportPDF,
  currentView,
  campaignName
}: CampaignInfoBarProps) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getViewTitle = () => {
    switch (currentView) {
      case 'transactions': return 'Transaction Management';
      case 'users': return 'User Management';
      case 'logs': return 'Admin Logs';
      case 'userlogs': return 'My Activity Logs';
      case 'settings': return 'Campaign Settings';
      case 'reports': return 'Reports & Analytics';
      case 'cashvault': return 'Cash Vault';
      case 'analytics': return 'Analytics Dashboard';
      case 'exports': return 'Export Center';
      case 'usersummary': return 'User Summary';
      case 'invoices': return 'Invoice Management';
      default: return 'Campaign Dashboard';
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <h2 className="font-semibold text-gray-900">{getViewTitle()}</h2>
                <p className="text-sm text-gray-600">{campaignName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{months[selectedMonth]} {selectedYear}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExportPDF}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
