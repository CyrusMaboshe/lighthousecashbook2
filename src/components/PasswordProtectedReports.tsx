
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { verifyUserPassword } from '@/services/passwordVerificationService';

interface PasswordProtectedReportsProps {
  children: React.ReactNode;
  onAccessGranted: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function PasswordProtectedReports({
  children,
  onAccessGranted,
  isOpen,
  onClose
}: PasswordProtectedReportsProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const verifyPassword = async () => {
    if (!currentUser || !password.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      // Use the proper password verification service
      const isPasswordCorrect = await verifyUserPassword(currentUser.email || '', password);

      if (isPasswordCorrect) {
        setHasAccess(true);
        onAccessGranted();
        toast({
          title: "Access Granted",
          description: "You can now view the business reports",
        });
        onClose();
      } else {
        toast({
          title: "Access Denied",
          description: "Incorrect password.",
          variant: "destructive",
        });
        setPassword('');
      }
    } catch (error) {
      console.error('Password verification error:', error);
      toast({
        title: "Verification Failed",
        description: "Unable to verify password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyPassword();
  };

  // If user has access, show the protected content
  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md !bg-[#0f172a]/95 backdrop-blur-3xl border-white/10 shadow-2xl text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Password Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Access to the Overall Business Report Summary requires password verification.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Enter Your Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  disabled={isVerifying}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isVerifying}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isVerifying || !password.trim()}
                className="flex-1"
              >
                {isVerifying ? 'Verifying...' : 'Verify Password'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isVerifying}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
