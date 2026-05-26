// Multi-Tenant Router - Role-based routing with tenant awareness
// This component provides secure routing based on user roles and tenant access

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useMultiTenantAuth } from '@/hooks/useMultiTenantAuth';
import { UserRole } from '@/types/multiTenant';

// Import components
import { LoginForm } from '@/components/LoginForm';
import { SuperAdminDashboard } from '@/components/super-admin/SuperAdminDashboard';
import { CompanyAdminDashboard } from '@/components/company-admin/CompanyAdminDashboard';
import { CompanyUserDashboard } from '@/components/company-user/CompanyUserDashboard';
import { HomePage } from '@/components/HomePage';
import Index from '@/pages/Index'; // Legacy system
import NotFound from '@/pages/NotFound';

// Route protection component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  requiresCompany?: boolean;
  fallbackPath?: string;
}

function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requiresCompany = false, 
  fallbackPath = '/unauthorized' 
}: ProtectedRouteProps) {
  const { currentUser, userRole, currentCompany, isInitialized } = useMultiTenantAuth();

  // Show loading while auth is initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to main login page if not authenticated
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // Check role permissions
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check company requirement
  if (requiresCompany && !currentCompany) {
    return <Navigate to="/no-company" replace />;
  }

  return <>{children}</>;
}

// Role-based redirect component
function RoleBasedRedirect() {
  const { currentUser, userRole, currentCompany } = useMultiTenantAuth();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // Check if this is a legacy user
  const isLegacyUser = currentUser.user_metadata?.legacy_user || currentUser.user_metadata?.migrated_from_legacy;

  // Redirect based on user role
  switch (userRole) {
    case 'super_admin':
      return <Navigate to="/super-admin" replace />;
    case 'company_admin':
      return currentCompany ? <Navigate to="/company-admin" replace /> : <Navigate to="/no-company" replace />;
    case 'company_user':
      return currentCompany ? <Navigate to="/company-user" replace /> : <Navigate to="/no-company" replace />;
    case 'admin':
    case 'user':
      // Legacy users - redirect to legacy system
      return <Navigate to="/legacy" replace />;
    default:
      // If it's a legacy user but role detection failed, still redirect to legacy
      if (isLegacyUser) {
        return <Navigate to="/legacy" replace />;
      }
      return <Navigate to="/unauthorized" replace />;
  }
}

// Unauthorized access component
function UnauthorizedPage() {
  const { currentUser, userRole } = useMultiTenantAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to access this page.
          </p>
          {currentUser && (
            <div className="mt-4 text-xs text-gray-400">
              <p>Current role: {userRole}</p>
              <p>User: {currentUser.email}</p>
            </div>
          )}
          <div className="mt-6">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// No company assigned component
function NoCompanyPage() {
  const { currentUser, userRole } = useMultiTenantAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Company Assigned</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't been assigned to a company yet. Please contact your administrator.
          </p>
          {currentUser && (
            <div className="mt-4 text-xs text-gray-400">
              <p>Current role: {userRole}</p>
              <p>User: {currentUser.email}</p>
            </div>
          )}
          <div className="mt-6">
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Smart Savings Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



// Main Multi-Tenant Router
export function MultiTenantRouter() {
  const { isInitialized } = useMultiTenantAuth();
  const location = useLocation();

  // Show loading while auth is initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/no-company" element={<NoCompanyPage />} />
      <Route path="/404" element={<NotFound />} />

      {/* Root redirect based on role */}
      <Route path="/" element={<RoleBasedRedirect />} />

      {/* Super Admin routes */}
      <Route 
        path="/super-admin/*" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Company Admin routes */}
      <Route 
        path="/company-admin/*" 
        element={
          <ProtectedRoute allowedRoles={['company_admin']} requiresCompany>
            <CompanyAdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Company User routes */}
      <Route 
        path="/company-user/*" 
        element={
          <ProtectedRoute allowedRoles={['company_user']} requiresCompany>
            <CompanyUserDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Legacy system routes */}
      <Route 
        path="/legacy/*" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'user']}>
            <Index />
          </ProtectedRoute>
        } 
      />

      {/* Catch all - redirect to 404 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
