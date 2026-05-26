import React, { useState } from 'react';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { SeparateMultiTenantAuth } from '@/services/separateMultiTenantAuth';
import { setupSuperAdmin, checkSuperAdminStatus } from '@/utils/setupSuperAdmin';

export function AuthDebug() {
  const { currentUser, userRole, isLoading, isInitialized, isSuperAdmin } = useMultiTenantAuth();
  const [setupStatus, setSetupStatus] = useState<string>('');

  return (
    <div className="p-6 bg-white border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Authentication Debug</h2>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <h3 className="font-semibold mb-2">Auth State:</h3>
          <p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
          <p><strong>Is Initialized:</strong> {isInitialized ? 'Yes' : 'No'}</p>
          <p><strong>Current User:</strong> {currentUser?.email || 'None'}</p>
          <p><strong>User Role:</strong> {userRole || 'None'}</p>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Permissions:</h3>
          <p><strong>Is Super Admin:</strong> {isSuperAdmin() ? 'Yes' : 'No'}</p>
          <p><strong>Is Jonah User:</strong> {currentUser?.email === 'jonahdjbreezy@gmail.com' ? 'Yes' : 'No'}</p>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold mb-2">Local Storage:</h3>
        <div className="bg-gray-100 p-2 rounded text-xs">
          <p><strong>MT Session:</strong> {localStorage.getItem('mt_user_session') || 'None'}</p>
          <p><strong>Session Expiry:</strong> {localStorage.getItem('mt_session_expiry') || 'None'}</p>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold mb-2">Current User Object:</h3>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
          {JSON.stringify(currentUser, null, 2)}
        </pre>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            const jonahUser = {
              id: 'test-id',
              email: 'jonahdjbreezy@gmail.com',
              role: 'super_admin',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            localStorage.setItem('mt_user_session', JSON.stringify(jonahUser));
            localStorage.setItem('mt_session_expiry', (new Date().getTime() + 24 * 60 * 60 * 1000).toString());
            window.location.reload();
          }}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
        >
          Set Jonah Session
        </button>
        
        <button
          onClick={() => {
            localStorage.removeItem('mt_user_session');
            localStorage.removeItem('mt_session_expiry');
            window.location.reload();
          }}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm"
        >
          Clear Session
        </button>
        
        <button
          onClick={() => window.location.href = '/super-admin'}
          className="px-3 py-1 bg-green-600 text-white rounded text-sm"
        >
          Go to Super Admin
        </button>

        <button
          onClick={async () => {
            try {
              console.log('🔄 Testing Jonah login...');
              const result = await SeparateMultiTenantAuth.signIn('jonahdjbreezy@gmail.com', 'titanium');
              console.log('🔍 Login result:', result);

              if (result.user) {
                localStorage.setItem('mt_user_session', JSON.stringify(result.user));
                localStorage.setItem('mt_session_expiry', (new Date().getTime() + 24 * 60 * 60 * 1000).toString());
                alert('Login successful! Reloading...');
                window.location.reload();
              } else {
                alert('Login failed: ' + (result.error || 'Unknown error'));
              }
            } catch (error) {
              console.error('Login test error:', error);
              alert('Login test error: ' + error);
            }
          }}
          className="px-3 py-1 bg-purple-600 text-white rounded text-sm"
        >
          Test Jonah Login
        </button>

        <button
          onClick={async () => {
            try {
              setSetupStatus('Setting up super admin...');
              const result = await setupSuperAdmin();
              setSetupStatus(result.message);
              if (result.success) {
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              }
            } catch (error) {
              setSetupStatus('Setup failed: ' + error);
            }
          }}
          className="px-3 py-1 bg-orange-600 text-white rounded text-sm"
        >
          Setup Super Admin
        </button>

        <button
          onClick={async () => {
            try {
              const status = await checkSuperAdminStatus();
              setSetupStatus(JSON.stringify(status, null, 2));
            } catch (error) {
              setSetupStatus('Check failed: ' + error);
            }
          }}
          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm"
        >
          Check Status
        </button>
      </div>

      {setupStatus && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Setup Status:</h3>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
            {setupStatus}
          </pre>
        </div>
      )}
    </div>
  );
}
