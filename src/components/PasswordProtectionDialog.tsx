
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from '@/hooks/useAuth';
import { verifyUserPassword } from '@/services/passwordVerificationService';

interface PasswordProtectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  currentUser: User | null;
}

export function PasswordProtectionDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  currentUser,
}: PasswordProtectionDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleConfirm = async () => {
    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setError('Please enter your password');
      return;
    }

    if (!currentUser || !currentUser.email) {
      setError('No user session found');
      console.error('[PasswordProtectionDialog] No currentUser or email on confirm. currentUser:', currentUser);
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      console.log('[PasswordProtectionDialog] Verifying password for user:', currentUser.email);
      console.log('[PasswordProtectionDialog] Username:', currentUser.username);

      // Use the refactored password verification service
      const isValidPassword = await verifyUserPassword(currentUser.email, trimmedPassword);

      if (isValidPassword) {
        console.log('[PasswordProtectionDialog] ✅ Password verification successful for user:', currentUser.email);
        onConfirm();
        handleClose();
      } else {
        console.log('[PasswordProtectionDialog] ❌ Password verification failed for user:', currentUser.email);
        setError('Incorrect password. Please enter the same password you use to log in.');
      }
    } catch (error) {
      console.error('[PasswordProtectionDialog] Error validating password:', error);
      setError('Failed to validate password. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setIsValidating(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isValidating) {
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] !bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 shadow-2xl text-white outline-none">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {description}
            <br />
            <span className="text-sm text-emerald-400 mt-2 block">
              Use the same password you use to log into the application.
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="password">Login Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your login password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(''); // Clear error when user starts typing
              }}
              onKeyDown={handleKeyDown}
              disabled={isValidating}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isValidating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isValidating}
          >
            {isValidating ? 'Verifying...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
