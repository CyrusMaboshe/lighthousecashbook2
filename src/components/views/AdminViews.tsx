
import React from 'react';
import { UserManagement } from '@/components/UserManagement';
import { AdminLogs } from '@/components/AdminLogs';
import { UserLogs } from '@/components/UserLogs';
import { AdminSettings } from '@/components/AdminSettings';
import { Reports } from '@/components/ReportsClean';
import { CashvaultView } from '@/components/views/CashvaultView';
import { ExportCenter } from '@/components/export/ExportCenter';
import { InvoiceGenerator } from '@/components/InvoiceGenerator';
import { SuperAdminPanel } from '@/components/admin/SuperAdminPanel';
import { SeparateMultiTenantAuthProvider } from '@/hooks/useSeparateMultiTenantAuth';
import { LegacyAllTimeUserCashSummary } from '@/components/views/LegacyAllTimeUserCashSummary';
import { TargetsView } from '@/components/views/TargetsView';

import { AlertTriangle } from 'lucide-react';
import { SavingsView } from '@/components/views/SavingsView';
import { SystemChatView } from '@/components/views/SystemChatView';
import { EmergencyFundView } from '@/components/views/EmergencyFundView';
import { User } from '@/types/auth';

interface AdminViewsProps {
  currentView: 'transactions' | 'targets' | 'users' | 'logs' | 'userlogs' | 'settings' | 'reports' | 'cashvault' | 'savings' | 'exports' | 'invoices' | 'companies' | 'usersummary' | 'systemchat' | 'emergencyfund';
  currentUser?: User;
  companyId?: string;
}

export function AdminViews({ currentView, currentUser, companyId }: AdminViewsProps) {
  try {
    switch (currentView) {
      case 'users':
        return <UserManagement />;
      case 'logs':
        return <AdminLogs />;
      case 'userlogs':
        return <UserLogs />;
      case 'settings':
        return <AdminSettings />;
      case 'reports':
        return <Reports />;
      case 'targets':
        return <TargetsView />;
      case 'cashvault':
        return <CashvaultView />;
      case 'savings':
        return currentUser ? <SavingsView currentUser={currentUser} companyId={companyId} /> : null;
      case 'exports':
        return <ExportCenter />;
      case 'invoices':
        return <InvoiceGenerator />;
      case 'companies':
        return (
          <SeparateMultiTenantAuthProvider>
            <SuperAdminPanel />
          </SeparateMultiTenantAuthProvider>
        );
      case 'usersummary':
        return <LegacyAllTimeUserCashSummary />;
      case 'systemchat':
        return <SystemChatView />;

      case 'emergencyfund':
        return <EmergencyFundView />;
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error in AdminViews for view ${currentView}:`, error);
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Admin View Error</h2>
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
          Refresh Page
        </button>
      </div>
    );
  }
}
