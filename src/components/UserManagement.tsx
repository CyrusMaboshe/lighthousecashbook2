import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth, User } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Users, Power, PowerOff, Lock, Mail, Shield, UserCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ExtendedUser extends User {
  is_active?: boolean;
}

export function UserManagement() {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [loading, setLoading] = useState(false);
  const [togglingUser, setTogglingUser] = useState<string | null>(null);

  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ExtendedUser | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const { currentUser, logAdminAction } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    loadUsers();
  }, []);

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        toast({
          title: "Error",
          description: "Failed to load users from database.",
          variant: "destructive",
        });
        return;
      }

      const formattedUsers: ExtendedUser[] = data?.map(dbUser => ({
        id: dbUser.id,
        username: dbUser.username,
        password: dbUser.password_hash,
        role: dbUser.role as 'admin' | 'user',
        email: dbUser.email,
        is_active: (dbUser as any).is_active !== false
      })) || [];

      setUsers(formattedUsers);
      localStorage.setItem('lighthouse-users', JSON.stringify(formattedUsers));
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter username, email, and password.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('username, email')
        .or(`username.eq.${newUsername.trim()},email.eq.${newEmail.trim()}`);

      if (checkError) throw checkError;

      if (existingUsers && existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        if (existingUser.username === newUsername.trim()) {
          toast({ title: "Error", description: "Username already exists.", variant: "destructive" });
        } else if (existingUser.email === newEmail.trim()) {
          toast({ title: "Error", description: "Email already exists.", variant: "destructive" });
        }
        setLoading(false);
        return;
      }

      const hashedPassword = await hashPassword(newPassword);

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          username: newUsername.trim(),
          email: newEmail.trim(),
          password_hash: hashedPassword,
          role: newRole,
          is_admin: newRole === 'admin',
          is_active: true
        } as any);

      if (insertError) throw insertError;

      await loadUsers();
      logAdminAction(`Created ${newRole} user: ${newUsername.trim()} (${newEmail.trim()})`);
      toast({ title: "User Added", description: `${newRole} user ${newUsername.trim()} has been created.` });

      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating user:', error);
      toast({ title: "Error", description: "Failed to create user.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: ExtendedUser) => {
    if (user.username === currentUser?.username) {
      toast({ title: "Error", description: "You cannot deactivate your own account.", variant: "destructive" });
      return;
    }

    if (user.username === 'Cyrus Maboshe') {
      toast({ title: "Error", description: "Cannot modify the main admin account.", variant: "destructive" });
      return;
    }

    setTogglingUser(user.id);
    try {
      const newStatus = !user.is_active;
      const { error } = await supabase
        .from('users')
        .update({ is_active: newStatus } as any)
        .eq('id', user.id);

      if (error) throw error;
      await loadUsers();
      logAdminAction(`${newStatus ? 'Activated' : 'Deactivated'} user: ${user.username}`);
      toast({
        title: newStatus ? "User Activated" : "User Deactivated",
        description: `User ${user.username} has been ${newStatus ? 'activated' : 'deactivated'}.`,
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({ title: "Error", description: "Failed to update user status.", variant: "destructive" });
    } finally {
      setTogglingUser(null);
    }
  };

  const initiateDelete = (user: ExtendedUser) => {
    if (user.username === currentUser?.username) {
      toast({ title: "Error", description: "You cannot delete your own account.", variant: "destructive" });
      return;
    }
    if (user.username === 'Cyrus Maboshe') {
      toast({ title: "Error", description: "Cannot delete the main admin account.", variant: "destructive" });
      return;
    }
    setUserToDelete(user);
    setDeletePassword('');
    setShowDeleteDialog(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || !deletePassword.trim()) {
      toast({ title: "Error", description: "Please enter your password to confirm deletion.", variant: "destructive" });
      return;
    }

    setDeleting(true);
    try {
      const hashedInputPassword = await hashPassword(deletePassword);
      const { data: adminUser, error: verifyError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', currentUser?.id)
        .single();

      if (verifyError || !adminUser) throw new Error('Could not verify password');

      if (adminUser.password_hash !== hashedInputPassword) {
        toast({ title: "Error", description: "Incorrect password. User was not deleted.", variant: "destructive" });
        setDeleting(false);
        return;
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('username', userToDelete.username);

      if (error) throw error;
      await loadUsers();
      logAdminAction(`Deleted user: ${userToDelete.username}`);
      toast({ title: "User Deleted", description: `User ${userToDelete.username} has been deleted.` });
      setShowDeleteDialog(false);
      setUserToDelete(null);
      setDeletePassword('');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (currentUser?.role !== 'admin') return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="glass-card overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-white/10 shadow-inner">
              <Users className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">User Directory</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Personnel Management Control</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={loading}
            className="glass-btn-primary h-14 px-8 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4 mr-2 stroke-[3]" />
            Provision New Account
          </Button>
        </div>

        <CardContent className="p-0">
          {showAddForm && (
            <div className="p-8 bg-white/[0.02] border-b border-white/5 animate-in slide-in-from-top-4 duration-500">
              <form onSubmit={handleAddUser} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity</Label>
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Username"
                      className="glass-input h-14"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Communication</Label>
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Email Address"
                      className="glass-input h-14"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Key</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="glass-input h-14"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Authorization</Label>
                    <Select value={newRole} onValueChange={(value: 'admin' | 'user') => setNewRole(value)}>
                      <SelectTrigger className="glass-input h-14">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-select-content">
                        <SelectItem value="user">Operational User</SelectItem>
                        <SelectItem value="admin">System Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="glass-btn-primary h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {loading ? 'Initializing...' : 'Confirm Provisioning'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddForm(false)}
                    className="h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
                  >
                    Abort
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">User Profile</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Contact Metadata</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Scope</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Operational Status</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center border border-white/5 text-indigo-400 group-hover:scale-110 transition-transform">
                          <UserCircle2 className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-lg tracking-tight">{user.username}</span>
                          {user.username === currentUser?.username && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 mt-0.5 mt-[-2px]">Active Session</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-600" />
                        {user.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm",
                        user.role === 'admin'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      )}>
                        {user.role === 'admin' ? (
                          <>
                            <Shield className="w-3 h-3" />
                            Admin
                          </>
                        ) : (
                          <>
                            <Users className="w-3 h-3" />
                            Operator
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest",
                        user.is_active !== false
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", user.is_active !== false ? 'bg-emerald-400' : 'bg-red-400')} />
                        {user.is_active !== false ? 'Operational' : 'Restricted'}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {user.username !== currentUser?.username && user.username !== 'Cyrus Maboshe' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleUserStatus(user)}
                              disabled={togglingUser === user.id}
                              className={cn(
                                "h-10 w-10 p-0 rounded-xl transition-all duration-300",
                                user.is_active !== false
                                  ? 'text-amber-500 hover:bg-amber-500/20'
                                  : 'text-emerald-500 hover:bg-emerald-500/20'
                              )}
                            >
                              {user.is_active !== false ? <PowerOff className="h-5 w-5" /> : <Power className="h-5 w-5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => initiateDelete(user)}
                              disabled={loading}
                              className="h-10 w-10 p-0 rounded-xl text-red-500 hover:bg-red-500/20"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="glass-dialog-content max-w-md p-0 overflow-hidden">
          <div className="p-8 border-b border-white/5 bg-red-500/5">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-6 mx-auto shadow-2xl shadow-red-500/20">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <DialogTitle className="text-2xl font-black text-white text-center tracking-tight">Access Revocation Control</DialogTitle>
            <DialogDescription className="text-center text-slate-400 text-sm font-medium mt-2 leading-relaxed">
              You are initiating permanent account termination for <span className="text-red-400 font-bold">{userToDelete?.username}</span>. This protocol is irreversible.
            </DialogDescription>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Administrator Authorization Key</Label>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter security credentials"
                className="glass-input h-14"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setUserToDelete(null);
                  setDeletePassword('');
                }}
                disabled={deleting}
                className="flex-1 h-14 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
              >
                Abort Protocol
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={!deletePassword.trim() || deleting}
                className="flex-[2] h-14 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20"
              >
                {deleting ? 'Processing...' : 'Execute Termination'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
