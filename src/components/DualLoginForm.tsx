// Dual Login Form - Provides both existing system login and new multi-tenant company login
// This preserves the existing system completely while adding multi-tenant capabilities

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useMultiTenantAuth } from '@/hooks/useMultiTenantAuth';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Building2, Users, Shield } from 'lucide-react';

interface DualLoginFormProps {
  onLoginSuccess?: () => void;
  onCompanyLoginSuccess?: () => void;
}

export function DualLoginForm({ onLoginSuccess, onCompanyLoginSuccess }: DualLoginFormProps) {
  // Existing system login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Multi-tenant login state
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPassword, setCompanyPassword] = useState('');
  const [companyLoading, setCompanyLoading] = useState(false);
  
  // Super admin creation state
  const [superAdminEmail, setSuperAdminEmail] = useState('');
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [superAdminConfirmPassword, setSuperAdminConfirmPassword] = useState('');
  const [superAdminLoading, setSuperAdminLoading] = useState(false);
  const [showSuperAdminCreation, setShowSuperAdminCreation] = useState(false);

  const { login } = useAuth(); // Existing system
  const { signIn, createSuperAdmin } = useMultiTenantAuth(); // New multi-tenant system
  const { toast } = useToast();

  // Handle existing system login (unchanged)
  const handleExistingLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const success = await login(email.trim(), password);
      if (success) {
        toast({
          title: "Welcome Back!",
          description: "Successfully logged into Lighthouse system.",
        });
        onLoginSuccess?.();
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password for existing system.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle company login (new multi-tenant system)
  const handleCompanyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyEmail.trim() || !companyPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setCompanyLoading(true);
    try {
      const success = await signIn(companyEmail.trim(), companyPassword);
      if (success) {
        toast({
          title: "Welcome!",
          description: "Successfully logged into company system.",
        });
        onCompanyLoginSuccess?.();
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid company credentials or company not found.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Company login failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompanyLoading(false);
    }
  };

  // Handle super admin creation
  const handleCreateSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!superAdminEmail.trim() || !superAdminPassword.trim() || !superAdminConfirmPassword.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (superAdminPassword !== superAdminConfirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (superAdminPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setSuperAdminLoading(true);
    try {
      const success = await createSuperAdmin(superAdminEmail.trim(), superAdminPassword);
      if (success) {
        toast({
          title: "Super Admin Created!",
          description: "You can now login as super admin to manage companies.",
        });
        setShowSuperAdminCreation(false);
        // Clear form
        setSuperAdminEmail('');
        setSuperAdminPassword('');
        setSuperAdminConfirmPassword('');
        // Switch to company login tab
        setCompanyEmail(superAdminEmail);
      } else {
        toast({
          title: "Creation Failed",
          description: "Failed to create super admin. Email might already exist.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Super admin creation failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSuperAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="w-full max-w-lg bg-white/90 backdrop-blur-sm shadow-2xl border border-white/20">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            Lighthouse Cash Book
          </CardTitle>
          <p className="text-slate-600 mt-2">
            Choose your login method
          </p>
          <p className="text-slate-500 mt-2 font-semibold italic">
            Lighthouse media the future is here
          </p>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="existing" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Existing System
              </TabsTrigger>
              <TabsTrigger value="company" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Login
              </TabsTrigger>
            </TabsList>

            {/* Existing System Login */}
            <TabsContent value="existing" className="space-y-4">
              <div className="text-center mb-4">
                <Badge variant="outline" className="mb-2">
                  Original Lighthouse System
                </Badge>
                <p className="text-sm text-slate-600">
                  Login to your existing Lighthouse account
                </p>
              </div>

              <form onSubmit={handleExistingLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="mt-1"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 rounded-lg transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In to Existing System'}
                </Button>
              </form>
            </TabsContent>

            {/* Company Login */}
            <TabsContent value="company" className="space-y-4">
              <div className="text-center mb-4">
                <Badge variant="default" className="mb-2">
                  Multi-Tenant Company System
                </Badge>
                <p className="text-sm text-slate-600">
                  Login as Super Admin or Company User
                </p>
              </div>

              {!showSuperAdminCreation ? (
                <>
                  <form onSubmit={handleCompanyLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="companyEmail" className="text-sm font-medium text-slate-700">
                        Company Email
                      </Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        placeholder="Enter company email"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="companyPassword" className="text-sm font-medium text-slate-700">
                        Password
                      </Label>
                      <Input
                        id="companyPassword"
                        type="password"
                        value={companyPassword}
                        onChange={(e) => setCompanyPassword(e.target.value)}
                        placeholder="Enter password"
                        className="mt-1"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-2 rounded-lg transition-all duration-200"
                      disabled={companyLoading}
                    >
                      {companyLoading ? 'Signing In...' : 'Sign In to Company'}
                    </Button>
                  </form>

                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowSuperAdminCreation(true)}
                      className="text-sm"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Create Super Admin
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <Badge variant="destructive" className="mb-2">
                      Create Super Administrator
                    </Badge>
                    <p className="text-sm text-slate-600">
                      Create the first super admin to manage companies
                    </p>
                  </div>

                  <form onSubmit={handleCreateSuperAdmin} className="space-y-4">
                    <div>
                      <Label htmlFor="superAdminEmail" className="text-sm font-medium text-slate-700">
                        Super Admin Email
                      </Label>
                      <Input
                        id="superAdminEmail"
                        type="email"
                        value={superAdminEmail}
                        onChange={(e) => setSuperAdminEmail(e.target.value)}
                        placeholder="Enter super admin email"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="superAdminPassword" className="text-sm font-medium text-slate-700">
                        Password
                      </Label>
                      <Input
                        id="superAdminPassword"
                        type="password"
                        value={superAdminPassword}
                        onChange={(e) => setSuperAdminPassword(e.target.value)}
                        placeholder="Enter password (min 6 characters)"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="superAdminConfirmPassword" className="text-sm font-medium text-slate-700">
                        Confirm Password
                      </Label>
                      <Input
                        id="superAdminConfirmPassword"
                        type="password"
                        value={superAdminConfirmPassword}
                        onChange={(e) => setSuperAdminConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowSuperAdminCreation(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white font-medium py-2 rounded-lg transition-all duration-200"
                        disabled={superAdminLoading}
                      >
                        {superAdminLoading ? 'Creating...' : 'Create Super Admin'}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
