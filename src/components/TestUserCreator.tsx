import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createTestUser, createMultipleTestUsers, testUserLogin, TEST_USERS } from '@/utils/createTestUser';
import { testAllFailingUsers, testSpecificPassword } from '@/utils/passwordTester';

export function TestUserCreator() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateSingleTestUser = async () => {
    setLoading(true);
    try {
      const user = await createTestUser();
      if (user) {
        toast({
          title: "Test User Created",
          description: `User created: testuser@lighthouse.com (password: test123)`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create test user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create test user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMultipleTestUsers = async () => {
    setLoading(true);
    try {
      const users = await createMultipleTestUsers();
      toast({
        title: "Test Users Created",
        description: `Created ${users.length} test users`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create test users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const success = await testUserLogin(email, password);
      toast({
        title: success ? "Login Test Passed" : "Login Test Failed",
        description: `Testing ${email} with password ${password}`,
        variant: success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Test Error",
        description: "Failed to test login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestFailingUsers = async () => {
    setLoading(true);
    try {
      await testAllFailingUsers();
      toast({
        title: "Password Testing Complete",
        description: "Check console for results",
      });
    } catch (error) {
      toast({
        title: "Test Error",
        description: "Failed to test failing users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestSpecificUserPassword = async (email: string, password: string) => {
    setLoading(true);
    try {
      const success = await testSpecificPassword(email, password);
      toast({
        title: success ? "Password Match!" : "Password Mismatch",
        description: `${email} with password "${password}"`,
        variant: success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Test Error",
        description: "Failed to test password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Test User Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={handleCreateSingleTestUser} 
            disabled={loading}
            variant="outline"
          >
            Create Single Test User
          </Button>
          
          <Button 
            onClick={handleCreateMultipleTestUsers} 
            disabled={loading}
            variant="outline"
          >
            Create Multiple Test Users
          </Button>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Test Login Credentials</h3>
          <div className="space-y-2">
            {TEST_USERS.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-slate-600">{user.email}</p>
                  <p className="text-sm text-slate-500">Password: {user.password}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestLogin(user.email, user.password)}
                  disabled={loading}
                >
                  Test Login
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Password Recovery for Failing Users</h3>
          <div className="space-y-3">
            <Button
              onClick={handleTestFailingUsers}
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              Test Passwords for Failing Users
            </Button>

            <div className="grid grid-cols-1 gap-2">
              <div className="text-sm font-medium">Quick Test Common Passwords:</div>
              {[
                { email: 'cofidencekangila3@gmail.com', passwords: ['titanium', 'confidence', 'dence', 'kangila'] },
                { email: 'cyrus@gmail.com', passwords: ['titanium', 'cyrus', 'maboshe', 'admin'] },
                { email: 'henry@gmail.com', passwords: ['titanium', 'henry', 'user', 'admin'] }
              ].map((user) => (
                <div key={user.email} className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">{user.email}</p>
                  <div className="flex flex-wrap gap-1">
                    {user.passwords.map((password) => (
                      <Button
                        key={password}
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestSpecificUserPassword(user.email, password)}
                        disabled={loading}
                        className="text-xs"
                      >
                        {password}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium mb-2">Instructions</h3>
          <div className="text-sm text-slate-600 space-y-1">
            <p>1. Click "Test Passwords for Failing Users" to check all common passwords</p>
            <p>2. Or click individual password buttons to test specific combinations</p>
            <p>3. Check browser console for detailed password testing results</p>
            <p>4. Once correct password is found, users can login normally</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
