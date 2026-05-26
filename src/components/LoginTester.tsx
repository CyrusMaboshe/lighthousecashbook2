import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authenticateUser } from '@/services/authService';

export function LoginTester() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const testLogin = async (testEmail: string, testPassword: string) => {
    setLoading(true);
    try {
      console.log(`Testing login for: ${testEmail} with password: ${testPassword}`);
      const user = await authenticateUser(testEmail, testPassword);
      
      if (user) {
        toast({
          title: "Login Test Successful! ✅",
          description: `${testEmail} can login with password: "${testPassword}"`,
        });
        console.log('✅ Login successful for:', testEmail);
      } else {
        toast({
          title: "Login Test Failed ❌",
          description: `${testEmail} cannot login with password: "${testPassword}"`,
          variant: "destructive",
        });
        console.log('❌ Login failed for:', testEmail);
      }
    } catch (error) {
      toast({
        title: "Test Error",
        description: "An error occurred during login test",
        variant: "destructive",
      });
      console.error('Login test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    await testLogin(email.trim(), password);
  };

  const knownUsers = [
    { email: 'cofidencekangila3@gmail.com', password: 'confidence', name: 'Dence' },
    { email: 'cyrus@gmail.com', password: 'cyrus', name: 'Cyrus' },
    { email: 'henry@gmail.com', password: 'henry', name: 'Henry' }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Login Testing Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Test for Known Users */}
        <div>
          <h3 className="font-medium mb-3">Test Known Users</h3>
          <div className="space-y-2">
            {knownUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-slate-600">{user.email}</p>
                  <p className="text-sm text-slate-500">Password: {user.password}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => testLogin(user.email, user.password)}
                  disabled={loading}
                >
                  Test Login
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Test */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Custom Login Test</h3>
          <form onSubmit={handleCustomTest} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              Test Custom Login
            </Button>
          </form>
        </div>

        {/* Instructions */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-2">Instructions</h3>
          <div className="text-sm text-slate-600 space-y-1">
            <p>1. Click "Test Login" for any of the known users to verify they can login</p>
            <p>2. Use the custom form to test other email/password combinations</p>
            <p>3. Check the browser console for detailed authentication logs</p>
            <p>4. Green toast = successful login, Red toast = failed login</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
