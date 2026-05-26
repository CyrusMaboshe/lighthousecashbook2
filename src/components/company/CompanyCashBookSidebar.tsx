// Company Cash Book Sidebar - Exact replica of existing sidebar but for company system
// This provides the same navigation as the existing system

import React, { useState } from 'react';
import { Calendar, X, Home, FileText, BarChart3, Vault, Users, Settings, Download, User, ChevronLeft, ChevronRight, DollarSign, Receipt, Building2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MTCurrentUser, MTCompany } from '@/services/separateMultiTenantAuth';

interface CompanyCashBookSidebarProps {
  currentUser: MTCurrentUser;
  currentCompany: MTCompany;
  selectedYear: number;
  selectedMonth: number;
  onYearChange?: (year: number) => void;
  onMonthChange?: (month: number) => void;
  onClose?: () => void;
  currentView?: string;
  onViewChange?: (view: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  adminOnly: boolean;
}

export function CompanyCashBookSidebar({
  currentUser,
  currentCompany,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  onClose,
  currentView,
  onViewChange,
  isCollapsed = false,
  onToggleCollapse
}: CompanyCashBookSidebarProps) {
  const [showClockFullscreen, setShowClockFullscreen] = useState(false);
  
  const isAdmin = currentUser?.role === 'company_admin';
  
  // Navigation items (same as existing system)
  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home, adminOnly: false },
    { id: 'transactions', label: 'Trans', icon: FileText, adminOnly: false },
    { id: 'targets', label: 'Targets', icon: Target, adminOnly: false },
    { id: 'cashvault', label: 'Vault', icon: Vault, adminOnly: true },
    { id: 'users', label: 'Users', icon: Users, adminOnly: true },
    { id: 'usersummary', label: 'User Summary', icon: DollarSign, adminOnly: true },
    { id: 'logs', label: 'Admin Logs', icon: FileText, adminOnly: true },
    { id: 'userlogs', label: 'My Logs', icon: FileText, adminOnly: false },
    { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
    { id: 'reports', label: 'Reports', icon: BarChart3, adminOnly: true },
    { id: 'exports', label: 'Exports', icon: Download, adminOnly: true },
    { id: 'invoices', label: 'Invoices', icon: Receipt, adminOnly: true },
  ];

  const visibleNavItems = navItems.filter(item => {
    // Show admin-only items only to admin
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return (
    <div className={`bg-gradient-to-b from-slate-900 to-slate-800 text-white h-full flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-blue-400" />
              <div>
                <h2 className="font-bold text-sm truncate">{currentCompany.display_name}</h2>
                <p className="text-xs text-slate-400 truncate">{currentUser.username}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="text-slate-400 hover:text-white p-1"
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            )}
            {onClose && !isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Company Info */}
      {!isCollapsed && (
        <div className="p-4 bg-slate-800/50">
          <div className="text-center">
            <Badge variant="outline" className="text-blue-400 border-blue-400 mb-2">
              Company System
            </Badge>
            <p className="text-xs text-slate-400">
              ID: {currentCompany.name}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange?.(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Date Selector */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-700">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-400">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Period</span>
            </div>
            
            <div className="space-y-2">
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange?.(parseInt(e.target.value))}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedYear}
                onChange={(e) => onYearChange?.(parseInt(e.target.value))}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentUser.username}</p>
              <p className="text-xs text-slate-400 truncate">
                {currentUser.role === 'company_admin' ? 'Company Admin' : 'Company User'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
