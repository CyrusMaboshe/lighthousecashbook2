// Campaign Sidebar - Replicates CashBookSidebar for campaign dashboards
// This provides the same navigation structure as the existing system

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  BarChart3, 
  Download, 
  Vault, 
  DollarSign,
  Receipt,
  Building2,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Camera,
  Target
} from 'lucide-react';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly: boolean;
  badge?: string;
}

interface CampaignSidebarProps {
  selectedYear: number;
  selectedMonth: number;
  onYearChange?: (year: number) => void;
  onMonthChange?: (month: number) => void;
  onClose?: () => void;
  currentView: string;
  onViewChange: (view: any) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  campaignName: string;
}

export function CampaignSidebar({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  onClose,
  currentView,
  onViewChange,
  isCollapsed = false,
  onToggleCollapse,
  campaignName
}: CampaignSidebarProps) {
  // const { currentUser } = useMultiTenantAuth(); // Not using multi-tenant auth for campaigns
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);

  const isAdmin = true; // Campaign users have admin rights within their campaign

  // Navigation items (same as existing system)
  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home, adminOnly: false },
    { id: 'transactions', label: 'Transactions', icon: FileText, adminOnly: false },
    { id: 'targets', label: 'Targets', icon: Target, adminOnly: false, badge: 'NEW' },
    { id: 'cashvault', label: 'Cash Vault', icon: Vault, adminOnly: true },
    { id: 'users', label: 'Users', icon: Users, adminOnly: true },
    { id: 'usersummary', label: 'User Summary', icon: DollarSign, adminOnly: true },
    { id: 'logs', label: 'Admin Logs', icon: FileText, adminOnly: true },
    { id: 'userlogs', label: 'My Logs', icon: FileText, adminOnly: false },
    { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
    { id: 'reports', label: 'Reports', icon: BarChart3, adminOnly: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, adminOnly: false },
    { id: 'exports', label: 'Exports', icon: Download, adminOnly: true },
    { id: 'invoices', label: 'Invoices', icon: Receipt, adminOnly: true }
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const handleNavClick = (itemId: string) => {
    onViewChange(itemId);
    onClose?.();
  };

  const handleProfileClick = () => {
    window.dispatchEvent(new CustomEvent('openCampaignProfileModal'));
  };

  return (
    <div className={`h-full bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-80'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white truncate max-w-[200px]">
                  {campaignName}
                </h2>
                <p className="text-xs text-slate-300">Campaign Dashboard</p>
              </div>
            </div>
          )}
          
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="text-slate-300 hover:text-white hover:bg-slate-700"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Date Selectors */}
      {!isCollapsed && (
        <div className="p-4 space-y-3 border-b border-slate-700">
          {/* Year Selector */}
          <div className="relative">
            <Button
              variant="outline"
              className="w-full justify-between bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              onClick={() => setShowYearSelector(!showYearSelector)}
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {selectedYear}
              </span>
            </Button>
            
            {showYearSelector && (
              <Card className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800 border-slate-600">
                <CardContent className="p-2 max-h-48 overflow-y-auto">
                  {years.map((year) => (
                    <Button
                      key={year}
                      variant="ghost"
                      className="w-full justify-start text-white hover:bg-slate-700"
                      onClick={() => {
                        onYearChange?.(year);
                        setShowYearSelector(false);
                      }}
                    >
                      {year}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Month Selector */}
          <div className="relative">
            <Button
              variant="outline"
              className="w-full justify-between bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              onClick={() => setShowMonthSelector(!showMonthSelector)}
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {months[selectedMonth]}
              </span>
            </Button>
            
            {showMonthSelector && (
              <Card className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800 border-slate-600">
                <CardContent className="p-2 max-h-48 overflow-y-auto">
                  {months.map((month, index) => (
                    <Button
                      key={month}
                      variant="ghost"
                      className="w-full justify-start text-white hover:bg-slate-700"
                      onClick={() => {
                        onMonthChange?.(index);
                        setShowMonthSelector(false);
                      }}
                    >
                      {month}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 text-left transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              } ${isCollapsed ? 'px-3' : 'px-4'}`}
              onClick={() => handleNavClick(item.id)}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0`} />
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          );
        })}
      </nav>

      {/* User Profile Section */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-700">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-700"
            onClick={handleProfileClick}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-white">
                Campaign User
              </p>
              <p className="text-xs text-slate-400">
                Smart Savings - Cashbook
              </p>
            </div>
          </Button>
        </div>
      )}

      {/* Campaign Info Footer */}
      {!isCollapsed && (
        <div className="p-4 bg-slate-900 border-t border-slate-700">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Lighthouse Media Cashbook</p>
            <p className="text-xs text-slate-500">Campaign Management System</p>
          </div>
        </div>
      )}
    </div>
  );
}
