// Company Admin Dashboard - EXACT REPLICA of the reference design
// Multi-tenant company admin interface with exact styling and layout

import React, { useState, useEffect } from 'react';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Settings,
  Bell,
  MessageSquare,
  FileText,
  Vault,
  Download,
  Receipt,
  Building2,
  LogOut,
  Home,
  Eye,
  ChevronDown,
  Camera,
  EyeOff
} from 'lucide-react';

export function CompanyAdminDashboard() {
  const { currentUser, currentCompany, signOut } = useMultiTenantAuth();
  const [currentView, setCurrentView] = useState('Trans');
  const [selectedMonth, setSelectedMonth] = useState('July 2025');
  const [hideBalances, setHideBalances] = useState(false);
  const [stats, setStats] = useState({
    totalCashIn: 6351.00,
    totalCashOut: 5910.00,
    netBalance: 441.00,
    totalPictures: 328,
    totalTransactions: 119
  });

  const handleLogout = async () => {
    console.log('🔄 Company admin logging out...');
    await signOut();
    window.location.href = '/'; // Redirect to Smart vault login page
  };

  if (!currentUser || !currentCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
          <p className="text-gray-600">Please wait while we load your company dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentCompany.display_name}
              </h1>
              <p className="text-sm text-gray-500">
                Company Admin Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{currentUser.username}</p>
              <p className="text-xs text-gray-500">Company Admin</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg mb-8">
            <h2 className="text-3xl font-bold mb-2">
              🎉 Welcome to {currentCompany.display_name}!
            </h2>
            <p className="text-blue-200 text-sm opacity-80">
              Company ID: {currentCompany.name} | Role: {currentUser.role}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Home className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Dashboard</p>
                  <p className="text-2xl font-bold text-gray-900">Active</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Users</p>
                  <p className="text-2xl font-bold text-gray-900">1</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Settings</p>
                  <p className="text-2xl font-bold text-gray-900">Ready</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Coming Soon */}
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              🚧 Company Features Coming Soon
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h4 className="font-semibold text-blue-900 mb-2">Transaction Management</h4>
                <p className="text-blue-700 text-sm">
                  Create, edit, and manage company transactions with real-time updates.
                </p>
              </div>

              <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                <h4 className="font-semibold text-green-900 mb-2">User Management</h4>
                <p className="text-green-700 text-sm">
                  Add and manage company users with role-based permissions.
                </p>
              </div>

              <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                <h4 className="font-semibold text-purple-900 mb-2">Analytics & Reports</h4>
                <p className="text-purple-700 text-sm">
                  View detailed analytics and generate comprehensive reports.
                </p>
              </div>

              <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                <h4 className="font-semibold text-orange-900 mb-2">Cash Vault</h4>
                <p className="text-orange-700 text-sm">
                  Monitor and manage company cash flow and vault operations.
                </p>
              </div>

              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <h4 className="font-semibold text-red-900 mb-2">Export & Backup</h4>
                <p className="text-red-700 text-sm">
                  Export data and create backups for your company records.
                </p>
              </div>

              <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50">
                <h4 className="font-semibold text-indigo-900 mb-2">Settings & Config</h4>
                <p className="text-indigo-700 text-sm">
                  Configure company settings and customize your dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
            <h4 className="font-semibold text-green-900 mb-2">🔒 Data Security</h4>
            <p className="text-green-800 text-sm">
              Your company data is completely isolated and secure. You only have access to
              <strong> {currentCompany.display_name}</strong> data and cannot access other companies
              or the main system data.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
