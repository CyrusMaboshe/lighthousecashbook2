/**
 * Universal Password Change Component
 * Works for all user types: super_admin, company_admin, company_user, admin, user
 * Provides secure password change functionality with real-time database updates
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { hashPassword } from '@/utils/passwordUtils';
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  isValid: boolean;
}

export function UniversalPasswordChange() {
  const { currentUser: legacyUser } = useAuth();
  const { currentUser: mtUser } = useMultiTenantAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<PasswordChangeFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isValid: false
  });

  // Determine current user and system type
  const currentUser = mtUser || legacyUser;
  const isMultiTenant = !!mtUser;
  const userType = isMultiTenant ? mtUser.role : legacyUser?.role;

  // Password strength checker
  const checkPasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one uppercase letter');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one lowercase letter');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one number');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one special character');
    }

    return {
      score,
      feedback,
      isValid: score >= 4 && password.length >= 8
    };
  };

  // Handle form input changes
  const handleInputChange = (field: keyof PasswordChangeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Check password strength for new password
    if (field === 'newPassword') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!passwordStrength.isValid) {
      newErrors.newPassword = 'Password does not meet security requirements';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Verify current password
  const verifyCurrentPassword = async (): Promise<boolean> => {
    try {
      if (isMultiTenant) {
        // Multi-tenant password verification
        const { data, error } = await supabase
          .from(mtUser.role === 'super_admin' ? 'mt_super_admins' :
                mtUser.role === 'company_admin' ? 'mt_company_admins' : 'mt_company_users')
          .select('password_hash')
          .eq('id', mtUser.id)
          .single();

        if (error || !data) {
          console.error('Error fetching user for password verification:', error);
          return false;
        }

        // Multi-tenant uses base64 encoding
        const storedHash = data.password_hash;
        const inputHashBase64 = btoa(formData.currentPassword);

        // Try both base64 and plain text for compatibility
        return storedHash === inputHashBase64 || storedHash === formData.currentPassword;
      } else {
        // Legacy system password verification
        console.log('🔍 Fetching legacy user password hash for ID:', legacyUser.id);

        const { data, error } = await supabase
          .from('users')
          .select('password_hash, email, username')
          .eq('id', legacyUser.id)
          .single();

        if (error || !data) {
          console.error('❌ Error fetching user for password verification:', error);
          return false;
        }

        console.log('✅ User data fetched:', { email: data.email, username: data.username });

        // Legacy system uses SHA-256 hashing
        const storedHash = data.password_hash;
        const inputHashSHA256 = await hashPassword(formData.currentPassword);

        console.log('🔍 Password verification debug:');
        console.log('Stored hash:', storedHash);
        console.log('Input hash (SHA-256):', inputHashSHA256);
        console.log('Input password length:', formData.currentPassword.length);
        console.log('Match:', storedHash === inputHashSHA256);

        return storedHash === inputHashSHA256;
      }
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  };

  // Update password in database
  const updatePassword = async (): Promise<boolean> => {
    try {
      if (isMultiTenant) {
        // Multi-tenant password update (uses base64)
        const newPasswordHash = btoa(formData.newPassword);
        const tableName = mtUser.role === 'super_admin' ? 'mt_super_admins' :
                         mtUser.role === 'company_admin' ? 'mt_company_admins' : 'mt_company_users';

        const { error } = await supabase
          .from(tableName)
          .update({
            password_hash: newPasswordHash,
            updated_at: new Date().toISOString()
          })
          .eq('id', mtUser.id);

        if (error) {
          console.error('Error updating MT password:', error);
          return false;
        }

        console.log('✅ Multi-tenant password updated successfully');
      } else {
        // Legacy system password update (uses SHA-256)
        const newPasswordHash = await hashPassword(formData.newPassword);

        console.log('🔍 Password update debug:');
        console.log('New password hash (SHA-256):', newPasswordHash);
        console.log('New password length:', formData.newPassword.length);
        console.log('User ID:', legacyUser.id);
        console.log('User email:', legacyUser.email);

        const { data, error } = await supabase
          .from('users')
          .update({
            password_hash: newPasswordHash,
            updated_at: new Date().toISOString()
          })
          .eq('id', legacyUser.id)
          .select();

        if (error) {
          console.error('❌ Error updating legacy password:', error);
          console.error('Error details:', error);
          return false;
        }

        console.log('✅ Legacy password updated successfully');
        console.log('Updated rows:', data?.length);

        // Verify the update worked
        const { data: verifyData, error: verifyError } = await supabase
          .from('users')
          .select('password_hash')
          .eq('id', legacyUser.id)
          .single();

        if (verifyError) {
          console.error('❌ Error verifying password update:', verifyError);
        } else {
          console.log('🔍 Verification - New stored hash:', verifyData.password_hash);
          console.log('🔍 Verification - Matches expected:', verifyData.password_hash === newPasswordHash);
        }
      }

      return true;
    } catch (error) {
      console.error('Password update error:', error);
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Starting password change process...');
      console.log('🔍 User details:', {
        isMultiTenant,
        legacyUser: legacyUser ? { id: legacyUser.id, email: legacyUser.email, role: legacyUser.role } : null,
        mtUser: mtUser ? { id: mtUser.id, email: mtUser.email, role: mtUser.role } : null
      });

      // Step 1: Verify current password
      console.log('🔍 Step 1: Verifying current password...');
      const isCurrentPasswordValid = await verifyCurrentPassword();
      if (!isCurrentPasswordValid) {
        console.log('❌ Current password verification failed');
        setErrors({ currentPassword: 'Current password is incorrect' });
        return;
      }

      console.log('✅ Current password verified');

      // Step 2: Update password in database
      console.log('🔍 Step 2: Updating password in database...');
      const updateSuccess = await updatePassword();
      if (!updateSuccess) {
        console.log('❌ Password update failed');
        toast({
          title: "Error",
          description: "Failed to update password. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Password updated successfully');

      // Step 3: Success feedback
      toast({
        title: "Password Changed!",
        description: "Your password has been updated successfully. Please use your new password for future logins.",
      });

      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordStrength({ score: 0, feedback: [], isValid: false });

    } catch (error) {
      console.error('❌ Password change error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (!currentUser) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You must be logged in to change your password.
        </AlertDescription>
      </Alert>
    );
  }

  // Debug current user info
  console.log('🔍 UniversalPasswordChange - Current user info:', {
    isMultiTenant,
    legacyUser: legacyUser ? {
      id: legacyUser.id,
      email: legacyUser.email,
      username: legacyUser.username,
      role: legacyUser.role
    } : null,
    mtUser: mtUser ? {
      id: mtUser.id,
      email: mtUser.email,
      role: mtUser.role
    } : null
  });

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Change Password
          </CardTitle>
          <p className="text-sm text-gray-600">
            Update your password for {currentUser.email}
          </p>
          <div className="text-xs text-gray-500">
            User Type: {userType} | System: {isMultiTenant ? 'Multi-Tenant' : 'Legacy'}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  className={errors.currentPassword ? 'border-red-500' : ''}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.currentPassword && (
                <p className="text-sm text-red-600 mt-1">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  className={errors.newPassword ? 'border-red-500' : ''}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-600 mt-1">{errors.newPassword}</p>
              )}
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          passwordStrength.score <= 2 ? 'bg-red-500' :
                          passwordStrength.score <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs ${
                      passwordStrength.score <= 2 ? 'text-red-600' :
                      passwordStrength.score <= 3 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {passwordStrength.score <= 2 ? 'Weak' :
                       passwordStrength.score <= 3 ? 'Medium' : 'Strong'}
                    </span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="text-xs text-gray-600 space-y-1">
                      {passwordStrength.feedback.map((item, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
              )}
              {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
                  <CheckCircle className="h-3 w-3" />
                  Passwords match
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full cursor-pointer hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Changing Password...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
