// Ultra-simple test component to debug white page issue

import React from 'react';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';

export function MTTransactionTest() {
  const { currentUser, currentCompany } = useMultiTenantAuth();

  console.log('🔍 MTTransactionTest rendering...');
  console.log('🔍 currentUser:', currentUser);
  console.log('🔍 currentCompany:', currentCompany);

  return (
    <div className="p-8 bg-white">
      <h1 className="text-2xl font-bold text-green-600 mb-4">✅ Transaction Test Component Working!</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Authentication Status:</h2>
          <p><strong>User:</strong> {currentUser ? '✅ Loaded' : '❌ Not loaded'}</p>
          <p><strong>Company:</strong> {currentCompany ? '✅ Loaded' : '❌ Not loaded'}</p>
        </div>

        {currentUser && (
          <div className="p-4 bg-blue-100 rounded">
            <h2 className="font-semibold">User Details:</h2>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Username:</strong> {currentUser.username || 'Not set'}</p>
            <p><strong>ID:</strong> {currentUser.id}</p>
          </div>
        )}

        {currentCompany && (
          <div className="p-4 bg-green-100 rounded">
            <h2 className="font-semibold">Company Details:</h2>
            <p><strong>Name:</strong> {currentCompany.display_name}</p>
            <p><strong>ID:</strong> {currentCompany.id}</p>
          </div>
        )}

        <div className="p-4 bg-yellow-100 rounded">
          <h2 className="font-semibold">Next Steps:</h2>
          <p>If you can see this, the component is loading correctly!</p>
          <p>Check the browser console for any additional debug information.</p>
        </div>
      </div>
    </div>
  );
}
