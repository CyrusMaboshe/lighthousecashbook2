// Company Header - Exact replica of existing header but for company system
// This provides the same header functionality as the existing system

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Menu, LogOut, Building2, Clock } from 'lucide-react';
import { MTCurrentUser, MTCompany } from '@/services/separateMultiTenantAuth';

interface CompanyHeaderProps {
  currentUser: MTCurrentUser;
  currentCompany: MTCompany;
  onAddTransaction: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
  sidebarVisible: boolean;
}

export function CompanyHeader({
  currentUser,
  currentCompany,
  onAddTransaction,
  onLogout,
  onToggleSidebar,
  sidebarVisible
}: CompanyHeaderProps) {
  const currentTime = new Date().toLocaleTimeString();
  const currentDate = new Date().toLocaleDateString();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {!sidebarVisible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="text-gray-600 hover:text-gray-900"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {currentCompany.display_name}
              </h1>
              <p className="text-sm text-gray-500">
                Company Cash Flow Management
              </p>
            </div>
          </div>
        </div>

        {/* Center Section - Company Info */}
        <div className="hidden md:flex items-center space-x-4">
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Company System
          </Badge>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">{currentDate}</p>
            <p className="text-xs text-gray-500">{currentTime}</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Add Transaction Button */}
          <Button
            onClick={onAddTransaction}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>

          {/* User Info */}
          <div className="hidden sm:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{currentUser.username}</p>
              <p className="text-xs text-gray-500">
                {currentUser.role === 'company_admin' ? 'Company Admin' : 'Company User'}
              </p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {currentUser.username?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="text-gray-600 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Mobile Company Info */}
      <div className="md:hidden mt-4 flex items-center justify-between">
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          Company System
        </Badge>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{currentDate}</p>
          <p className="text-xs text-gray-500">{currentTime}</p>
        </div>
      </div>
    </header>
  );
}
