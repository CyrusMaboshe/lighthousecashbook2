/**
 * Smart Analysis Permission Test Component
 * 
 * This component helps test and debug Smart Analysis permissions
 * It shows the current user information and whether they have Smart Analysis access
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useMultiTenantAuth } from '@/hooks/useMultiTenantAuth';
import { useSmartAnalysisAccess, hasSmartAnalysisAccess, getSmartAnalysisAuthorizedEmail } from '@/utils/smartAnalysisPermissions';
import { Brain, User, Shield, AlertCircle, CheckCircle } from 'lucide-react';

export function SmartAnalysisPermissionTest() {
  // Get auth states from both systems
  const legacyAuth = useAuth();
  const multiTenantAuth = useMultiTenantAuth();
  const hasAccess = useSmartAnalysisAccess();

  const legacyUser = legacyAuth?.currentUser;
  const multiTenantUser = multiTenantAuth?.currentUser;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Smart Analysis Permission Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Access Status */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
          {hasAccess ? (
            <>
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Smart Analysis Access: GRANTED</h3>
                <p className="text-sm text-green-600">Current user has access to Smart Analysis features</p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Smart Analysis Access: DENIED</h3>
                <p className="text-sm text-red-600">Current user does not have access to Smart Analysis features</p>
              </div>
            </>
          )}
        </div>

        {/* Authorized Email */}
        <div className="p-4 rounded-lg bg-blue-50">
          <h3 className="font-semibold text-blue-800 mb-2">Authorized Email</h3>
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            {getSmartAnalysisAuthorizedEmail()}
          </Badge>
        </div>

        {/* Legacy System User */}
        <div className="p-4 rounded-lg bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Legacy System User
          </h3>
          {legacyUser ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Email:</span>
                <Badge variant={legacyUser.email === getSmartAnalysisAuthorizedEmail() ? "default" : "secondary"}>
                  {legacyUser.email}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Username:</span>
                <span className="text-sm">{legacyUser.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Role:</span>
                <Badge variant="outline">{legacyUser.role}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Smart Analysis Access:</span>
                <Badge variant={hasSmartAnalysisAccess(legacyUser.email) ? "default" : "secondary"}>
                  {hasSmartAnalysisAccess(legacyUser.email) ? "YES" : "NO"}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No legacy user logged in</p>
          )}
        </div>

        {/* Multi-Tenant System User */}
        <div className="p-4 rounded-lg bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Multi-Tenant System User
          </h3>
          {multiTenantUser ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Email:</span>
                <Badge variant={multiTenantUser.email === getSmartAnalysisAuthorizedEmail() ? "default" : "secondary"}>
                  {multiTenantUser.email}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Role:</span>
                <Badge variant="outline">{multiTenantAuth.userRole}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Smart Analysis Access:</span>
                <Badge variant={hasSmartAnalysisAccess(multiTenantUser.email) ? "default" : "secondary"}>
                  {hasSmartAnalysisAccess(multiTenantUser.email) ? "YES" : "NO"}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No multi-tenant user logged in</p>
          )}
        </div>

        {/* Debug Information */}
        <div className="p-4 rounded-lg bg-yellow-50">
          <h3 className="font-semibold text-yellow-800 mb-3">Debug Information</h3>
          <div className="text-xs font-mono space-y-1">
            <div>Legacy Auth Loading: {legacyAuth?.isLoading ? 'true' : 'false'}</div>
            <div>Multi-Tenant Auth Loading: {multiTenantAuth?.isLoading ? 'true' : 'false'}</div>
            <div>Legacy Auth Initialized: {legacyAuth?.isInitialized ? 'true' : 'false'}</div>
            <div>Multi-Tenant Auth Initialized: {multiTenantAuth?.isInitialized ? 'true' : 'false'}</div>
            <div>Hook Result: {hasAccess ? 'true' : 'false'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
