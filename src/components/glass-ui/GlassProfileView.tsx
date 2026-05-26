import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { GlassView } from './GlassAppShell';
import { Settings, FileText, LogOut, ChevronRight, Shield, Edit2, User as UserIcon, Calendar, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, updateUserPassword, uploadProfilePicture } from '@/services/userService';
import { logProfileUpdate } from '@/services/userLogService';
import { AppleControlList, AppleControlItem } from './AppleControlList';
import { Camera, Sun, Moon } from 'lucide-react';
import { useGlobalMonthControl } from '@/hooks/useGlobalMonthControl';
import { format } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';

interface ProfileMenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  subtitle: string;
  view?: GlassView;
  action?: () => void;
  danger?: boolean;
  adminOnly?: boolean;
}

interface GlassProfileViewProps {
  onViewChange: (view: GlassView) => void;
  onLogout: () => void;
}

export function GlassProfileView({ onViewChange, onLogout }: GlassProfileViewProps) {
  const { currentUser, isAdmin, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    password: '',
    confirmPassword: ''
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Global month control
  const { month: globalMonth, year: globalYear, setByAdmin, setGlobalMonth, resetToCurrentMonth } = useGlobalMonthControl();
  const { theme, setTheme } = useTheme();
  const [localMonth, setLocalMonth] = useState(globalMonth);
  const [localYear, setLocalYear] = useState(globalYear);
  const [isSavingMonth, setIsSavingMonth] = useState(false);

  // Sync local pickers when global state changes
  React.useEffect(() => {
    setLocalMonth(globalMonth);
    setLocalYear(globalYear);
  }, [globalMonth, globalYear]);

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentCalYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentCalYear - 2 + i);

  const menuItems: ProfileMenuItem[] = [
    { id: 'my-logs', icon: FileText, label: 'My Activity', subtitle: 'View your transaction history', view: 'userlogs' },
    { id: 'settings', icon: Settings, label: 'Settings', subtitle: 'App preferences and configuration', view: 'settings' },
    { id: 'admin-logs', icon: Shield, label: 'Admin Logs', subtitle: 'System administration logs', view: 'logs', adminOnly: true },
    { id: 'logout', icon: LogOut, label: 'Logout', subtitle: 'Sign out of your account', action: onLogout, danger: true },
  ];

  const visibleItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  const handleEditProfile = () => {
    setFormData({
      username: currentUser?.username || '',
      email: currentUser?.email || '',
      password: '',
      confirmPassword: ''
    });
    setShowEditModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Profile picture must be under 5MB.",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      await uploadProfilePicture(file, currentUser.id);
      await refreshUserData();
      toast({ title: "Profile Picture Updated", description: "Your new profile picture has been saved successfully." });
    } catch (error) {
      console.error('Image upload error:', error);
      toast({ title: "Upload Failed", description: "Failed to upload profile picture.", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;

    setIsUpdating(true);
    try {
      const result = await updateUserProfile(
        currentUser.id,
        {
          username: formData.username,
          email: formData.email
        },
        currentUser.id,
        isAdmin
      );

      if (result.success) {
        // Log the profile update
        logProfileUpdate(currentUser, {
          action: 'profile_info_update',
          oldUsername: currentUser.username,
          newUsername: formData.username,
          oldEmail: currentUser.email,
          newEmail: formData.email
        });

        // Refresh user data to reflect changes
        await refreshUserData();

        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });

        // Optionally password change
        if (formData.password && formData.password === formData.confirmPassword) {
          const pwdResult = await updateUserPassword(currentUser.id, formData.password, currentUser.id, isAdmin);
          if (!pwdResult.success) {
            toast({
              title: "Password Update Failed",
              description: pwdResult.error || "Could not update password.",
              variant: "destructive"
            });
          } else {
            toast({ title: "Password Updated", description: "Your password has been successfully updated." });
          }
        }

        setShowEditModal(false);
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // ─── Admin: apply new month selection ─────────────────────────────────────
  const handleApplyMonth = async () => {
    setIsSavingMonth(true);
    try {
      await setGlobalMonth(localMonth, localYear);
      toast({
        title: '✅ Month Updated',
        description: `All users now see ${MONTH_NAMES[localMonth]} ${localYear}.`,
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to update month. Try again.', variant: 'destructive' });
    } finally {
      setIsSavingMonth(false);
    }
  };

  const handleResetMonth = async () => {
    setIsSavingMonth(true);
    try {
      await resetToCurrentMonth();
      toast({
        title: '🔄 Reset to Current Month',
        description: 'All users now see the current month automatically.',
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to reset. Try again.', variant: 'destructive' });
    } finally {
      setIsSavingMonth(false);
    }
  };

  const isDirty = localMonth !== globalMonth || localYear !== globalYear;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <GlassCard className="text-center py-8 relative">
        <button
          onClick={handleEditProfile}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-blue-50/10 hover:bg-blue-50/20 shadow-md flex items-center justify-center transition-colors !border border-blue-400/30"
          title="Edit Profile"
        >
          <Edit2 className="w-3.5 h-3.5 text-blue-400" />
        </button>

        <div className="relative inline-block mb-4 group cursor-pointer" onClick={() => document.getElementById('propic-upload')?.click()}>
          <input type="file" id="propic-upload" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
          {currentUser?.profile_picture_url ? (
            <img src={currentUser.profile_picture_url} alt={currentUser.username}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/30 mx-auto" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mx-auto ring-4 ring-blue-500/30">
              <span className="text-4xl font-bold text-white">
                {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
            <Camera className="w-6 h-6 text-white drop-shadow-lg" />
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-[#0f172a]"></div>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-1">{currentUser?.username || 'User'}</h2>
        <p className="text-sm text-slate-600 mb-2">{currentUser?.email || ''}</p>
        <div className={cn(
          "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium",
          isAdmin ? "bg-purple-50 text-purple-600 border border-purple-200" : "bg-blue-50 text-blue-600 border border-blue-200"
        )}>
          <Shield className="w-3 h-3" />
          {isAdmin ? 'Administrator' : 'User'}
        </div>
      </GlassCard>

      {/* ─── Admin: Month Control Panel ─────────────────────────────────── */}
      {isAdmin ? (
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-900/30 via-indigo-900/20 to-slate-900/40 backdrop-blur-xl shadow-xl">
          {/* Decorative glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/20 rounded-full blur-[40px] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/15 rounded-full blur-[40px] pointer-events-none" />

          <div className="relative z-10 p-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center shadow-inner">
                <Calendar className="w-4.5 h-4.5 text-violet-300" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-violet-300">Admin Control</p>
                <h3 className="text-base font-bold text-white leading-tight">Active Month</h3>
              </div>
              {setByAdmin && (
                <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">Custom</span>
              )}
            </div>

            {/* Current active month badge */}
            <div className="mb-4 rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Currently Visible To All Users</p>
                <p className="text-lg font-black text-white tracking-tight">
                  {MONTH_NAMES[globalMonth]} {globalYear}
                </p>
              </div>
              {!setByAdmin && (
                <span className="text-[9px] text-emerald-300 font-bold uppercase tracking-widest bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">Auto</span>
              )}
            </div>

            {/* Month / Year pickers */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Month</label>
                <select
                  value={localMonth}
                  onChange={e => setLocalMonth(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={i} value={i} className="bg-slate-900">{name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year</label>
                <select
                  value={localYear}
                  onChange={e => setLocalYear(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                >
                  {yearOptions.map(y => (
                    <option key={y} value={y} className="bg-slate-900">{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleApplyMonth}
                disabled={isSavingMonth || !isDirty}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                  isDirty && !isSavingMonth
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25"
                    : "bg-white/5 text-slate-500 cursor-not-allowed"
                )}
              >
                {isSavingMonth ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Apply to All
              </button>
              <button
                onClick={handleResetMonth}
                disabled={isSavingMonth || !setByAdmin}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                  setByAdmin && !isSavingMonth
                    ? "bg-white/10 hover:bg-white/15 text-slate-300 border border-white/10"
                    : "bg-white/5 text-slate-600 cursor-not-allowed border border-white/5"
                )}
                title="Reset to current month"
              >
                <RotateCcw className={cn("w-3.5 h-3.5", isSavingMonth && "animate-spin")} />
                Reset
              </button>
            </div>

            <p className="mt-3 text-[10px] text-slate-500 text-center">
              Changes apply instantly across all users and devices.
            </p>
          </div>
        </div>
      ) : (
        /* Regular user: read-only active month chip */
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
          <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Viewing Period</p>
            <p className="text-sm font-semibold text-white">{MONTH_NAMES[globalMonth]} {globalYear}</p>
          </div>
        </div>
      )}

      {/* ─── Theme Switcher ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900/80 via-blue-900/20 to-slate-900/60 backdrop-blur-xl shadow-xl">
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-500/10 rounded-full blur-[30px] pointer-events-none" />
        <div className="relative z-10 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-400/25 flex items-center justify-center shadow-inner">
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-blue-300" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-blue-300">Appearance</p>
              <h3 className="text-base font-bold text-white leading-tight">Theme</h3>
            </div>
          </div>

          {/* Toggle buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="theme-dark-btn"
              onClick={() => setTheme('dark')}
              className={cn(
                'flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-xl border font-bold text-sm transition-all duration-300',
                theme === 'dark'
                  ? 'bg-slate-800 border-blue-500/40 text-blue-300 shadow-lg shadow-blue-500/20 scale-[1.02]'
                  : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/8 hover:text-slate-300'
              )}
            >
              <Moon className={cn('w-5 h-5 transition-all', theme === 'dark' ? 'text-blue-400 drop-shadow-sm' : 'text-slate-600')} />
              <span>Dark 🌙</span>
              {theme === 'dark' && (
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-400/80">Active</span>
              )}
            </button>

            <button
              id="theme-light-btn"
              onClick={() => setTheme('light')}
              className={cn(
                'flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-xl border font-bold text-sm transition-all duration-300',
                theme === 'light'
                  ? 'bg-amber-50/10 border-amber-400/40 text-amber-300 shadow-lg shadow-amber-500/15 scale-[1.02]'
                  : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/8 hover:text-slate-300'
              )}
            >
              <Sun className={cn('w-5 h-5 transition-all', theme === 'light' ? 'text-amber-400 drop-shadow-sm' : 'text-slate-600')} />
              <span>Light ☀️</span>
              {theme === 'light' && (
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-400/80">Active</span>
              )}
            </button>
          </div>

          <p className="mt-3 text-[10px] text-slate-500 text-center">
            Switches instantly across the entire app.
          </p>
        </div>
      </div>

      {/* Menu Items */}
      <AppleControlList>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <AppleControlItem
              key={item.id}
              icon={Icon}
              label={item.label}
              className={item.danger ? "border-red-500/10" : ""}
            >
              <div className="space-y-4">
                <p className="text-slate-400 text-sm">{item.subtitle}</p>
                <Button
                  onClick={() => item.action ? item.action() : item.view && onViewChange(item.view)}
                  className={cn(
                    "w-full justify-between h-12 rounded-xl",
                    item.danger ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20" : "bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/20"
                  )}
                >
                  <span>Open {item.label}</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </AppleControlItem>
          );
        })}
      </AppleControlList>

      <GlassCard padding="sm" className="text-center">
        <p className="text-xs text-slate-500">Lighthouse Media Cash Management v1.0</p>
        <p className="text-xs text-slate-500">© 2024 All rights reserved</p>
      </GlassCard>

      {/* Edit Profile Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <UserIcon className="w-5 h-5 text-blue-400" />
              Edit Profile
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Update your profile information. Changes will be reflected immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
                disabled={isUpdating}
                className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500"
              />
            </div>
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email"
              disabled={isUpdating}
              className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2 pt-4 border-t border-white/5">
            <Label htmlFor="password" className="text-slate-300">New Password (Optional)</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Leave blank to keep current"
              disabled={isUpdating}
              className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          {formData.password && (
            <div className="space-y-2 pb-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                disabled={isUpdating}
                className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500"
              />
              {formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match.</p>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={isUpdating}
              className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={isUpdating || !formData.username.trim() || !formData.email.trim() || (!!formData.password && formData.password !== formData.confirmPassword)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
