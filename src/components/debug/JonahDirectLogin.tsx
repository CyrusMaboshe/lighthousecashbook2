import React, { useState } from 'react';
import { SeparateMultiTenantAuth } from '@/services/separateMultiTenantAuth';
import { setupSuperAdmin } from '@/utils/setupSuperAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, User, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export function JonahDirectLogin() {
  const [email, setEmail] = useState('jonahdjbreezy@gmail.com');
  const [password, setPassword] = useState('titanium');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setMessage('Attempting login...');
      setMessageType('info');

      console.log('🔄 Direct login attempt for:', email);
      const result = await SeparateMultiTenantAuth.signIn(email, password);
      
      if (result.user) {
        console.log('✅ Login successful:', result.user);
        
        // Store session
        localStorage.setItem('mt_user_session', JSON.stringify(result.user));
        localStorage.setItem('mt_session_expiry', (new Date().getTime() + 24 * 60 * 60 * 1000).toString());
        
        setMessage('Login successful! Redirecting to main page...');
        setMessageType('success');

        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        console.log('❌ Login failed:', result.error);
        setMessage(`Login failed: ${result.error || 'Unknown error'}`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage(`Login error: ${error}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupSuperAdmin = async () => {
    try {
      setIsLoading(true);
      setMessage('Setting up super admin user...');
      setMessageType('info');

      const result = await setupSuperAdmin();
      
      if (result.success) {
        setMessage(result.message);
        setMessageType('success');
        
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage(`Setup failed: ${result.message}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Setup error: ${error}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectAccess = () => {
    // Create a mock session for testing (as regular user, not super admin)
    const mockUser = {
      id: 'mock-user-id',
      email: 'jonahdjbreezy@gmail.com',
      role: 'company_user', // Changed from super_admin to regular user
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    localStorage.setItem('mt_user_session', JSON.stringify(mockUser));
    localStorage.setItem('mt_session_expiry', (new Date().getTime() + 24 * 60 * 60 * 1000).toString());

    setMessage('Mock session created! Redirecting...');
    setMessageType('success');

    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Shield className="h-6 w-6 text-blue-600" />
            Jonah Super Admin Login
          </CardTitle>
          <CardDescription>
            Direct login for jonahdjbreezy@gmail.com super admin access
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              messageType === 'success' ? 'bg-green-50 text-green-700' :
              messageType === 'error' ? 'bg-red-50 text-red-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {messageType === 'success' ? <CheckCircle className="h-4 w-4" /> :
               messageType === 'error' ? <AlertCircle className="h-4 w-4" /> :
               <AlertCircle className="h-4 w-4" />}
              {message}
            </div>
          )}

          <div className="space-y-2">
            <Button 
              onClick={handleLogin} 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login to Super Admin'}
            </Button>
            
            <Button 
              onClick={handleSetupSuperAdmin} 
              variant="outline" 
              className="w-full" 
              disabled={isLoading}
            >
              Setup Super Admin User
            </Button>
            
            <Button 
              onClick={handleDirectAccess} 
              variant="secondary" 
              className="w-full" 
              disabled={isLoading}
            >
              Create Mock Session (Testing)
            </Button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">Debug Options:</p>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={() => window.location.href = '/auth-debug'} 
                variant="ghost" 
                size="sm"
              >
                Auth Debug
              </Button>
              <Button 
                onClick={() => window.location.href = '/force-super-admin'} 
                variant="ghost" 
                size="sm"
              >
                Force Access
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
