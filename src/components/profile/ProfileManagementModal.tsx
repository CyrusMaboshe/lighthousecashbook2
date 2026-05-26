import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfilePictureUpload } from './ProfilePictureUpload';
import { useAuth } from '@/hooks/useAuth';
import { uploadProfilePicture, deleteProfilePicture } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { User, Settings, RefreshCw } from 'lucide-react';
import { logProfileUpdate, USER_ACTION_TYPES } from '@/services/userLogService';
import { UniversalPasswordChange } from '../auth/UniversalPasswordChange';

interface ProfileManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileManagementModal({
  isOpen,
  onClose
}: ProfileManagementModalProps) {
  const { currentUser, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpload = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      console.log('Starting profile picture upload...');
      const imageUrl = await uploadProfilePicture(file, currentUser?.id || '');

      console.log('Upload successful, refreshing user data...');

      // Refresh user data from database
      await refreshUserData();

      // Log profile picture update action
      if (currentUser) {
        logProfileUpdate(currentUser, {
          action: 'profile_picture_upload',
          imageUrl: imageUrl,
          fileSize: file.size,
          fileType: file.type
        });
      }

      toast({
        title: "Success!",
        description: "Profile picture uploaded successfully!",
      });

      // Close modal after successful upload
      setTimeout(() => {
        onClose();
      }, 1500);

      return imageUrl;
    } catch (error) {
      console.error('Upload error in modal:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      console.log('Starting profile picture deletion...');
      await deleteProfilePicture(currentUser?.id || '');

      console.log('Deletion successful, refreshing user data...');

      // Refresh user data from database
      await refreshUserData();

      // Log profile picture deletion action
      if (currentUser) {
        logProfileUpdate(currentUser, {
          action: 'profile_picture_delete'
        });
      }

      toast({
        title: "Success!",
        description: "Profile picture removed successfully!",
      });

      // Close modal after successful deletion
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Delete error in modal:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to remove profile picture. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card sm:max-w-md border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Settings className="w-5 h-5 text-cyan-400" />
            Profile Settings
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Manage your profile picture and account settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info Card */}
          <div className="glass-card p-4 border border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-cyan-400" />
              Account Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-400">Username</span>
                <span className="text-sm font-bold text-white">{currentUser?.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-400">Role</span>
                <span className="text-sm font-bold text-cyan-300 capitalize">{currentUser?.role}</span>
              </div>
              {currentUser?.email && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">Email</span>
                  <span className="text-sm font-bold text-white">{currentUser.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Picture Management */}
          <div className="glass-card p-4 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Profile Picture</h3>
            <ProfilePictureUpload
              currentImageUrl={currentUser?.profile_picture_url}
              onUpload={handleUpload}
              onDelete={handleDelete}
              isUploading={isUploading}
              isDeleting={isDeleting}
            />
          </div>

          {/* Password Change */}
          <div className="glass-card border border-white/10 p-1">
            <UniversalPasswordChange />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshUserData}
            className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="glass-button border-white/10 text-white hover:bg-white/10"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
