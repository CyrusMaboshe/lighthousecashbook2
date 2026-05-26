
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
    Users, UserPlus, Trash2, Shield, UserCircle2, Mail,
    Search, RefreshCw, Power, PowerOff, Key, Building2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CompanyUser {
    id: string;
    company_id: string;
    username: string;
    email: string;
    role: string;
    type: 'user' | 'admin';
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export function MTUserManagement() {
    const { currentCompany, isInitialized } = useMultiTenantAuth();
    const [users, setUsers] = useState<CompanyUser[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<CompanyUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const { toast } = useToast();

    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        role: 'company_user'
    });

    const setupRealTimeSubscription = () => {
        if (!currentCompany?.id) return () => { };

        const userSub = supabase.channel('mt_users_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mt_company_users', filter: `company_id=eq.${currentCompany.id}` }, () => loadUsers())
            .subscribe();

        const adminSub = supabase.channel('mt_admins_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mt_company_admins', filter: `company_id=eq.${currentCompany.id}` }, () => loadUsers())
            .subscribe();

        return () => {
            userSub.unsubscribe();
            adminSub.unsubscribe();
        };
    };

    useEffect(() => {
        if (isInitialized && currentCompany?.id) {
            loadUsers();
            const cleanup = setupRealTimeSubscription();
            return cleanup;
        }
    }, [currentCompany?.id, isInitialized]);

    useEffect(() => {
        const filtered = users.filter(u =>
            u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredUsers(filtered);
    }, [searchTerm, users]);

    const loadUsers = async () => {
        if (!currentCompany?.id) return;
        setLoading(true);
        try {
            const [usersResponse, adminsResponse] = await Promise.all([
                supabase.from('mt_company_users').select('*').eq('company_id', currentCompany.id),
                supabase.from('mt_company_admins').select('*').eq('company_id', currentCompany.id)
            ]);

            if (usersResponse.error) throw usersResponse.error;
            if (adminsResponse.error) throw adminsResponse.error;

            const combinedUsers: CompanyUser[] = [
                ...(usersResponse.data || []).map(u => ({ ...u, type: 'user' as const })),
                ...(adminsResponse.data || []).map(a => ({ ...a, type: 'admin' as const, role: 'company_admin' }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setUsers(combinedUsers);
        } catch (error: any) {
            console.error('Error loading users:', error);
            toast({
                title: "Error",
                description: "Failed to load personnel data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCompany?.id) return;

        try {
            setLoading(true);
            const table = newUser.role === 'company_admin' ? 'mt_company_admins' : 'mt_company_users';
            const { error } = await supabase
                .from(table)
                .insert({
                    company_id: currentCompany.id,
                    username: newUser.username,
                    email: newUser.email,
                    password_hash: btoa(newUser.password), // Base64 encoding for passwords matching separateMultiTenant system
                    role: newUser.role === 'company_admin' ? 'admin' : 'user',
                    is_active: true
                });

            if (error) {
                if (error.code === '23505') throw new Error("Username or Email already exists.");
                throw error;
            }

            toast({
                title: "Staff Added",
                description: `${newUser.username} has been added to the matrix.`,
            });
            setShowAddDialog(false);
            setNewUser({ username: '', email: '', password: '', role: 'company_user' });
            loadUsers();
        } catch (error: any) {
            toast({
                title: "Provisioning Failed",
                description: error.message || "Could not add user.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (user: CompanyUser) => {
        try {
            const table = user.type === 'admin' ? 'mt_company_admins' : 'mt_company_users';
            const { error } = await supabase
                .from(table)
                .update({ is_active: !user.is_active })
                .eq('id', user.id);

            if (error) throw error;
            loadUsers();
            toast({
                title: "Status Updated",
                description: `${user.username} is now ${!user.is_active ? 'active' : 'inactive'}.`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update status.",
                variant: "destructive",
            });
        }
    };

    const deleteUser = async (user: CompanyUser) => {
        if (!confirm(`Permanently remove ${user.username} from ${currentCompany?.display_name}?`)) return;

        try {
            const table = user.type === 'admin' ? 'mt_company_admins' : 'mt_company_users';
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', user.id);

            if (error) throw error;
            loadUsers();
            toast({
                title: "User Removed",
                description: "Personnel record deleted successfully.",
            });
        } catch (error) {
            toast({
                title: "Deletion Failed",
                description: "Could not remove user.",
                variant: "destructive",
            });
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !newPassword) return;

        try {
            setLoading(true);
            const table = selectedUser.type === 'admin' ? 'mt_company_admins' : 'mt_company_users';
            const { error } = await supabase
                .from(table)
                .update({ password_hash: btoa(newPassword) })
                .eq('id', selectedUser.id);
            if (error) throw error;

            toast({
                title: "Password Updated",
                description: `Access key for ${selectedUser.username} has been reconfigured.`
            });
            setShowPasswordDialog(false);
            setNewPassword('');
            setSelectedUser(null);
        } catch (err: any) {
            toast({
                title: "Update Failed",
                description: err.message || "Failed to update password",
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 p-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-2xl">
                            <Users className="h-7 w-7 text-purple-400" />
                        </div>
                        Personnel Hub
                    </h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3 ml-1">
                        Managing Staff for {currentCompany?.display_name}
                    </p>
                </div>

                <Button
                    onClick={() => setShowAddDialog(true)}
                    className="glass-btn-primary h-14 px-8 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em]"
                >
                    <UserPlus className="w-4 h-4 mr-2 stroke-[3]" />
                    Add Personnel
                </Button>
            </div>

            <div className="relative group max-w-xl">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 h-4 w-4 group-focus-within:text-purple-400 transition-colors" />
                <Input
                    placeholder="Search staff by identifier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 glass-input h-14 text-[11px] font-black uppercase tracking-widest"
                />
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Agent</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Protocol</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Auth Scope</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Operational Status</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Syncing Personnel Data...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs italic">
                                        No matching personnel detected in Sector {currentCompany?.name.toUpperCase()}
                                    </td>
                                </tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-white/[0.03] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                                                <UserCircle2 className="w-6 h-6" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white text-lg tracking-tight">{user.username}</span>
                                                <span className="text-[10px] text-slate-500 font-medium italic">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-slate-400 text-sm font-mono">
                                            <Mail className="w-3.5 h-3.5" />
                                            {user.email}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <Badge className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                            user.role === 'company_admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        )}>
                                            {user.role === 'company_admin' ? 'Super Admin' : 'Basic Agent'}
                                        </Badge>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                            user.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", user.is_active ? "bg-emerald-500" : "bg-red-500")} />
                                            {user.is_active ? 'Operational' : 'Restricted'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => toggleUserStatus(user)}
                                                className={cn("h-10 w-10 rounded-xl", user.is_active ? "text-amber-500 hover:bg-amber-500/10" : "text-emerald-500 hover:bg-emerald-500/10")}
                                            >
                                                {user.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-xl text-blue-400 hover:bg-blue-400/10"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setNewPassword('');
                                                    setShowPasswordDialog(true);
                                                }}
                                            >
                                                <Key className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteUser(user)}
                                                className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-500/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="glass-dialog-content max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight">Provision Personnel</DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium">Add a new agent to your business cluster.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddUser} className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity</Label>
                            <Input
                                value={newUser.username}
                                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                placeholder="Agent Username"
                                className="glass-input h-14 font-bold"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Auth Email</Label>
                            <Input
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                placeholder="agent@company.com"
                                className="glass-input h-14"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Initial Password</Label>
                            <Input
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                placeholder="Secure Password"
                                className="glass-input h-14"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Operation Scope</Label>
                            <Select value={newUser.role} onValueChange={(val) => setNewUser({ ...newUser, role: val })}>
                                <SelectTrigger className="glass-input h-14">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass-select-content">
                                    <SelectItem value="company_user" className="glass-select-item">Field Agent (Basic User)</SelectItem>
                                    <SelectItem value="company_admin" className="glass-select-item">Command Core (Admin)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter className="pt-6 border-t border-white/5">
                            <Button type="submit" disabled={loading} className="w-full glass-btn-primary h-14 text-sm font-black uppercase tracking-[0.2em]">
                                {loading ? 'Initializing...' : 'Deploy Personnel'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogContent className="glass-dialog-content max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight">Reconfigure Access</DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium">Update the protocol key for {selectedUser?.username}.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleChangePassword} className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Password</Label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter secure key"
                                className="glass-input h-14"
                                required
                            />
                        </div>
                        <DialogFooter className="pt-6 border-t border-white/5">
                            <Button type="submit" disabled={loading || !newPassword} className="w-full glass-btn-primary h-14 text-sm font-black uppercase tracking-[0.2em]">
                                {loading ? 'Updating...' : 'Update Protocol'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
