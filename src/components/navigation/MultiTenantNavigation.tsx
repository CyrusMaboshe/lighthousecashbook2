// Multi-Tenant Navigation - Role-aware navigation component
// This component provides navigation that adapts to user roles and company context

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Shield,
  Home,
  Bell,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMultiTenantAuth } from '@/hooks/useMultiTenantAuth';
import { UserRole } from '@/types/multiTenant';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  allowedRoles: UserRole[];
  requiresCompany?: boolean;
  badge?: string;
}

// Navigation items configuration
const getNavigationItems = (): NavigationItem[] => [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/',
    allowedRoles: ['super_admin', 'company_admin', 'company_user', 'admin', 'user']
  },
  {
    id: 'super-admin',
    label: 'System Admin',
    icon: Shield,
    path: '/super-admin',
    allowedRoles: ['super_admin']
  },
  {
    id: 'company-admin',
    label: 'Company Dashboard',
    icon: Building2,
    path: '/company-admin',
    allowedRoles: ['company_admin'],
    requiresCompany: true
  },
  {
    id: 'company-user',
    label: 'My Dashboard',
    icon: Users,
    path: '/company-user',
    allowedRoles: ['company_user'],
    requiresCompany: true
  },
  {
    id: 'legacy',
    label: 'Legacy System',
    icon: BarChart3,
    path: '/legacy',
    allowedRoles: ['admin', 'user']
  }
];

interface MultiTenantNavigationProps {
  className?: string;
}

export function MultiTenantNavigation({ className }: MultiTenantNavigationProps) {
  const { 
    currentUser, 
    userRole, 
    currentCompany, 
    signOut, 
    isSuperAdmin,
    isCompanyAdmin,
    isCompanyUser 
  } = useMultiTenantAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/'; // Redirect to Smart vault login page
  };

  const getFilteredNavigationItems = (): NavigationItem[] => {
    return getNavigationItems().filter(item => {
      // Check role permissions
      if (!item.allowedRoles.includes(userRole)) {
        return false;
      }

      // Check company requirement
      if (item.requiresCompany && !currentCompany) {
        return false;
      }

      return true;
    });
  };

  const isActiveRoute = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case 'super_admin':
        return 'Super Administrator';
      case 'company_admin':
        return 'Company Administrator';
      case 'company_user':
        return 'Company User';
      case 'admin':
        return 'Administrator';
      case 'user':
        return 'User';
      default:
        return 'Unknown';
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'company_admin':
        return 'default';
      case 'company_user':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!currentUser) {
    return null;
  }

  const navigationItems = getFilteredNavigationItems();

  return (
    <nav className={`bg-white shadow-sm border-b ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Lighthouse
              </span>
              {currentCompany && (
                <span className="ml-2 text-sm text-gray-500">
                  / {currentCompany.display_name}
                </span>
              )}
            </div>

            {/* Desktop navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.path);

                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                    {item.badge && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side - user menu and actions */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>

            {/* Messages */}
            <Button variant="ghost" size="sm">
              <MessageSquare className="h-4 w-4" />
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {currentUser.email}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getRoleDisplayName(userRole)}
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(userRole)} className="text-xs">
                    {userRole.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                {currentCompany && (
                  <DropdownMenuItem>
                    <Building2 className="mr-2 h-4 w-4" />
                    Company: {currentCompany.display_name}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.path);

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                    {item.badge && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Mobile user info */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-1">
                <div className="text-base font-medium text-gray-800">
                  {currentUser.email}
                </div>
                <div className="text-sm text-gray-500">
                  {getRoleDisplayName(userRole)}
                </div>
                {currentCompany && (
                  <div className="text-xs text-gray-400">
                    {currentCompany.display_name}
                  </div>
                )}
              </div>
              <Badge variant={getRoleBadgeVariant(userRole)} className="text-xs">
                {userRole.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={handleSignOut}
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 w-full text-left"
              >
                <LogOut className="h-5 w-5 mr-3 inline" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
