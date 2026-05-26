// Campaign Views - Replicates AdminViews for campaign dashboards
// This provides the same admin functionality but campaign-scoped

import React from 'react';
import { CampaignUserManagement } from './views/CampaignUserManagement';
import { CampaignAdminLogs } from './views/CampaignAdminLogs';
import { CampaignUserLogs } from './views/CampaignUserLogs';
import { CampaignSettings } from './views/CampaignSettings';
import { CampaignReports } from './views/CampaignReports';
import { CampaignCashVault } from './views/CampaignCashVault';
import { CampaignExports } from './views/CampaignExports';
import { CampaignInvoices } from './views/CampaignInvoices';
import { CampaignUserSummary } from './views/CampaignUserSummary';
import { CampaignTargets } from './views/CampaignTargets';
import { AlertTriangle } from 'lucide-react';

interface CampaignViewsProps {
  currentView: 'users' | 'logs' | 'userlogs' | 'settings' | 'reports' | 'cashvault' | 'exports' | 'invoices' | 'usersummary' | 'targets';
  campaignId: string;
  stats: any;
  username?: string;
  isAdmin?: boolean;
}

export function CampaignViews({ currentView, campaignId, stats, username = 'Campaign User', isAdmin = true }: CampaignViewsProps) {
  try {
    switch (currentView) {
      case 'users':
        return <CampaignUserManagement campaignId={campaignId} />;
      case 'logs':
        return <CampaignAdminLogs campaignId={campaignId} />;
      case 'userlogs':
        return <CampaignUserLogs campaignId={campaignId} />;
      case 'settings':
        return <CampaignSettings campaignId={campaignId} />;
      case 'reports':
        return <CampaignReports campaignId={campaignId} stats={stats} />;
      case 'targets':
        return <CampaignTargets companyId={campaignId} username={username} isAdmin={isAdmin} />;
      case 'cashvault':
        return <CampaignCashVault campaignId={campaignId} stats={stats} />;
      case 'exports':
        return <CampaignExports campaignId={campaignId} />;
      case 'invoices':
        return <CampaignInvoices campaignId={campaignId} />;
      case 'usersummary':
        return <CampaignUserSummary campaignId={campaignId} stats={stats} />;
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error in CampaignViews for view ${currentView}:`, error);
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Campaign View Error</h2>
        </div>
        <p className="text-red-700 mb-4">
          There was an error loading the {currentView} view. This could be due to:
        </p>
        <ul className="text-sm text-red-600 space-y-1 mb-4">
          <li>• Network connectivity issues</li>
          <li>• Database connection problems</li>
          <li>• Missing permissions</li>
          <li>• Component loading errors</li>
        </ul>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }
}
