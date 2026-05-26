import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeparateMultiTenantAuth } from '@/services/separateMultiTenantAuth';

export function JonahLoginTest() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('Testing login...');
    
    try {
      console.log('🔄 Testing Jonah login...');
      const loginResult = await SeparateMultiTenantAuth.signIn('jonahdjbreezy@gmail.com', 'titanium');
      
      console.log('🔍 Login result:', loginResult);
      
      if (loginResult.user) {
        setResult(`✅ Login successful!
Email: ${loginResult.user.email}
Role: ${loginResult.user.role}
ID: ${loginResult.user.id}`);
        
        // Store session
        localStorage.setItem('mt_user_session', JSON.stringify(loginResult.user));
        localStorage.setItem('mt_session_expiry', (new Date().getTime() + 24 * 60 * 60 * 1000).toString());

        // REMOVED: Automatic redirect to super-admin
        // Let the user navigate manually based on their actual role
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setResult(`❌ Login failed: ${loginResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Login test error:', error);
      setResult(`❌ Login error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const checkSession = () => {
    const session = localStorage.getItem('mt_user_session');
    const expiry = localStorage.getItem('mt_session_expiry');
    
    if (session) {
      try {
        const user = JSON.parse(session);
        setResult(`📋 Current session:
Email: ${user.email}
Role: ${user.role}
Expiry: ${expiry ? new Date(parseInt(expiry)).toLocaleString() : 'No expiry'}`);
      } catch (error) {
        setResult(`❌ Invalid session data: ${error}`);
      }
    } else {
      setResult('ℹ️ No session found');
    }
  };

  const clearSession = () => {
    localStorage.removeItem('mt_user_session');
    localStorage.removeItem('mt_session_expiry');
    setResult('🗑️ Session cleared');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">🔧 Jonah Login Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testLogin} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Login as jonahdjbreezy@gmail.com'}
          </Button>
          
          <Button 
            onClick={checkSession} 
            variant="outline"
            className="w-full"
          >
            Check Current Session
          </Button>
          
          <Button 
            onClick={clearSession} 
            variant="destructive"
            className="w-full"
          >
            Clear Session
          </Button>
          
          <Button 
            onClick={() => window.location.href = '/super-admin'} 
            variant="secondary"
            className="w-full"
          >
            Go to Super Admin Dashboard
          </Button>
          
          {result && (
            <div className="mt-4 p-3 bg-gray-50 rounded text-sm whitespace-pre-line">
              {result}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
