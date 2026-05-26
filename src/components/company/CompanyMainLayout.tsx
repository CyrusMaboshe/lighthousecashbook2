// Company Main Layout - Exact replica of existing MainLayout but for company system
// This provides the same interface structure as the existing system

import React, { useState } from 'react';
import { CompanyCashBookSidebar } from './CompanyCashBookSidebar';
import { CompanyHeader } from './CompanyHeader';
import { MTCurrentUser, MTCompany } from '@/services/separateMultiTenantAuth';

interface CompanyMainLayoutProps {
  children: React.ReactNode;
  currentUser: MTCurrentUser;
  currentCompany: MTCompany;
  currentView: 'home' | 'transactions' | 'targets' | 'users' | 'logs' | 'userlogs' | 'settings' | 'reports' | 'cashvault' | 'analytics' | 'exports' | 'usersummary' | 'invoices';
  onViewChange: (view: 'home' | 'transactions' | 'targets' | 'users' | 'logs' | 'userlogs' | 'settings' | 'reports' | 'cashvault' | 'analytics' | 'exports' | 'usersummary' | 'invoices') => void;
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onAddTransaction: () => void;
  onLogout: () => void;
}

export function CompanyMainLayout({
  children,
  currentUser,
  currentCompany,
  currentView,
  onViewChange,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  onAddTransaction,
  onLogout
}: CompanyMainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleCloseSidebar = () => {
    setShowSidebar(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      {showSidebar && (
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 ease-in-out`}>
          <CompanyCashBookSidebar
            currentUser={currentUser}
            currentCompany={currentCompany}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={onYearChange}
            onMonthChange={onMonthChange}
            onClose={handleCloseSidebar}
            currentView={currentView}
            onViewChange={onViewChange}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <CompanyHeader
          currentUser={currentUser}
          currentCompany={currentCompany}
          onAddTransaction={onAddTransaction}
          onLogout={onLogout}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          sidebarVisible={showSidebar}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
