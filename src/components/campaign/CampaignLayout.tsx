// Campaign Layout - Replicates MainLayout for campaign dashboards
// This provides the same layout structure as the existing system

import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CampaignSidebar } from './CampaignSidebar';
import { CampaignInfoBar } from './CampaignInfoBar';
import { CampaignFooter } from './CampaignFooter';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, User } from 'lucide-react';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { CampaignProfileModal } from './CampaignProfileModal';

interface CampaignLayoutProps {
  children: React.ReactNode;
  selectedYear: number;
  selectedMonth: number;
  onYearChange?: (year: number) => void;
  onMonthChange?: (month: number) => void;
  currentView: 'home' | 'transactions' | 'users' | 'logs' | 'userlogs' | 'settings' | 'reports' | 'cashvault' | 'analytics' | 'exports' | 'usersummary' | 'invoices';
  onViewChange: (view: 'home' | 'transactions' | 'users' | 'logs' | 'userlogs' | 'settings' | 'reports' | 'cashvault' | 'analytics' | 'exports' | 'usersummary' | 'invoices') => void;
  onExportPDF: () => void;
  onLogout: () => void;
  isAdmin: boolean;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  campaignName: string;
}

export function CampaignLayout({
  children,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  currentView,
  onViewChange,
  onExportPDF,
  onLogout,
  isAdmin,
  showSidebar,
  onToggleSidebar,
  sidebarCollapsed = false,
  onToggleSidebarCollapse,
  campaignName
}: CampaignLayoutProps) {
  const isMobile = useIsMobile();
  // const { currentUser } = useMultiTenantAuth(); // Not using multi-tenant auth for campaigns
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Listen for profile modal open event from sidebar
  useEffect(() => {
    const handleOpenProfileModal = () => setShowProfileModal(true);
    window.addEventListener('openCampaignProfileModal', handleOpenProfileModal);
    return () => window.removeEventListener('openCampaignProfileModal', handleOpenProfileModal);
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <div className="flex w-full">
          {/* Responsive Sidebar */}
          {(isMobile ? showSidebar : true) && (
            <div className={`
              ${isMobile
                ? `fixed left-0 top-0 h-full w-80 z-50 transform transition-transform duration-300 ${showSidebar ? 'translate-x-0' : '-translate-x-full'} max-w-[85vw]`
                : `relative transition-all duration-300 flex-shrink-0 ${sidebarCollapsed ? 'w-20' : 'w-80'}`
              }
            `}>
              <CampaignSidebar
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                onYearChange={onYearChange}
                onMonthChange={onMonthChange}
                onClose={isMobile ? onToggleSidebar : undefined}
                currentView={currentView}
                onViewChange={onViewChange}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={onToggleSidebarCollapse}
                campaignName={campaignName}
              />
            </div>
          )}

          {/* Responsive Main Content */}
          <main className={`
            flex-1 overflow-auto w-full transition-all duration-300
            ${isMobile
              ? 'w-full'
              : sidebarCollapsed
                ? 'ml-0'
                : 'ml-0'
            }
          `}>
            <div className="responsive-container max-w-7xl mx-auto">
              <div className="space-y-4 sm:space-y-6">
                {/* Simplified Header */}
                <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    {isMobile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleSidebar}
                        className="p-1"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    )}
                    <h1 className="text-xl font-bold text-slate-800">
                      💰 {campaignName} - Lighthouse media cashbook
                    </h1>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Profile Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowProfileModal(true)}
                      className="flex items-center gap-2 hover:bg-slate-100"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="hidden sm:inline text-sm font-medium text-slate-700">
                        Campaign User
                      </span>
                    </Button>

                    {/* Logout Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onLogout}
                      className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">Logout</span>
                    </Button>
                  </div>
                </div>

                {/* Info Bar */}
                <CampaignInfoBar
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  onYearChange={onYearChange}
                  onMonthChange={onMonthChange}
                  onExportPDF={onExportPDF}
                  currentView={currentView}
                  campaignName={campaignName}
                />

                {/* Main Content */}
                <div className="min-h-[calc(100vh-200px)]">
                  {children}
                </div>

                {/* Footer */}
                <CampaignFooter campaignName={campaignName} />
              </div>
            </div>
          </main>
        </div>

        {/* Mobile Overlay */}
        {isMobile && showSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onToggleSidebar}
          />
        )}

        {/* Profile Modal */}
        {showProfileModal && (
          <CampaignProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
          />
        )}
      </div>
    </SidebarProvider>
  );
}
