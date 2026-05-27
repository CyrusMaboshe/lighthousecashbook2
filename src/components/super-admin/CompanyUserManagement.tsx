/**
 * Company User Management - Super Admin Interface
 * Allows super admins to view, manage, and perform CRUD operations on users under any company.
 * Redesigned: clean, minimal, modern — all original logic preserved.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Users, UserPlus, Edit, Trash2, Shield, ShieldOff, Clock,
  Calendar, Building2, Search, RefreshCw, AlertTriangle,
  CheckCircle, XCircle, DollarSign, Fingerprint, Key,
  ShieldCheck, ChevronRight, Mail, Crown, User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface CompanyUser {
  id: string;
  company_id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  access_expires_at?: string;
  access_revoked?: boolean;
  access_granted_at?: string;
  access_revoked_at?: string;
  access_revoked_reason?: string;
  payment_required?: boolean;
  payment_due_date?: string;
  grace_period_days?: number;
  auto_blocked?: boolean;
  auto_blocked_at?: string;
  auto_blocked_reason?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  company?: { id: string; display_name: string; name: string; };
}

interface Company {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
}

// ─── Status helpers ────────────────────────────────────────────────────────────
function getUserStatus(u: CompanyUser): { label: string; color: string; dot: string } {
  if (u.access_revoked)  return { label: 'Revoked',  color: 'text-rose-400 bg-rose-500/8 border-rose-500/20',   dot: 'bg-rose-400' };
  if (u.auto_blocked)    return { label: 'Blocked',  color: 'text-amber-400 bg-amber-500/8 border-amber-500/20', dot: 'bg-amber-400' };
  if (!u.is_active)      return { label: 'Inactive', color: 'text-slate-400 bg-slate-500/8 border-slate-500/20', dot: 'bg-slate-500' };
  return { label: 'Active', color: 'text-emerald-400 bg-emerald-500/8 border-emerald-500/20', dot: 'bg-emerald-400' };
}

// ─── Component ────────────────────────────────────────────────────────────────
export function CompanyUserManagement() {
  const [companies, setCompanies]       = useState<Company[]>([]);
  const [users, setUsers]               = useState<CompanyUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<CompanyUser[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [searchTerm, setSearchTerm]     = useState('');
  const [loading, setLoading]           = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: '', email: '', password: '', company_id: '',
    role: 'company_user', access_expires_at: '', is_active: true
  });

  // ── Real-time subscriptions ─────────────────────────────────────────────────
  useEffect(() => {
    loadData();
    const uid = Math.random().toString(36).slice(2, 9);
    const uSub = supabase.channel(`mu_${uid}`).on('postgres_changes', { event: '*', schema: 'public', table: 'mt_company_users' }, loadUsers).subscribe();
    const aSub = supabase.channel(`ma_${uid}`).on('postgres_changes', { event: '*', schema: 'public', table: 'mt_company_admins' }, loadUsers).subscribe();
    const cSub = supabase.channel(`mc_${uid}`).on('postgres_changes', { event: '*', schema: 'public', table: 'mt_companies' }, loadCompanies).subscribe();
    return () => { uSub.unsubscribe(); aSub.unsubscribe(); cSub.unsubscribe(); };
  }, []);

  useEffect(() => { filterUsers(); }, [users, selectedCompany, searchTerm]);

  // ── Data loading ────────────────────────────────────────────────────────────
  const loadData = async () => {
    try { setLoading(true); await Promise.all([loadCompanies(), loadUsers()]); } 
    catch (e) { toast({ title: 'Error loading data', variant: 'destructive' }); } 
    finally { setLoading(false); }
  };

  const loadCompanies = async () => {
    const { data } = await supabase.from('mt_companies').select('id, name, display_name, is_active').order('display_name');
    setCompanies(data || []);
  };

  const loadUsers = async () => {
    const [ur, ar] = await Promise.all([
      supabase.from('mt_company_users').select('*, company:mt_companies(id, display_name, name)').order('created_at', { ascending: false }),
      supabase.from('mt_company_admins').select('*, company:mt_companies(id, display_name, name)').order('created_at', { ascending: false })
    ]);
    const all = [
      ...(ur.data || []).map(u => ({ ...u, role: 'company_user' })),
      ...(ar.data || []).map(a => ({ ...a, role: 'company_admin' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setUsers(all);
  };

  const filterUsers = () => {
    let f = users;
    if (selectedCompany !== 'all') f = f.filter(u => u.company_id === selectedCompany);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      f = f.filter(u =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.company?.display_name?.toLowerCase().includes(q)
      );
    }
    setFilteredUsers(f);
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleRevokeAccess = async (uid: string, revoke: boolean) => {
    const u = users.find(x => x.id === uid);
    if (!u) return;
    const table = u.role === 'company_admin' ? 'mt_company_admins' : 'mt_company_users';
    const up: any = { access_revoked: revoke, is_active: !revoke, updated_at: new Date().toISOString() };
    if (revoke) { up.access_revoked_at = new Date().toISOString(); up.access_revoked_reason = 'Manual Override'; }
    await supabase.from(table).update(up).eq('id', uid);
    toast({ title: revoke ? 'Access Revoked' : 'Access Restored', description: u.username });
    loadUsers();
  };

  const handleDelete = async (u: CompanyUser) => {
    if (!window.confirm(`Permanently delete "${u.username}"? This cannot be undone.`)) return;
    const table = u.role === 'company_admin' ? 'mt_company_admins' : 'mt_company_users';
    await supabase.from(table).delete().eq('id', u.id);
    toast({ title: 'User Deleted', description: u.username });
    loadUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password || !formData.company_id) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' }); return;
    }
    setSubmitting(true);
    try {
      const table = formData.role === 'company_admin' ? 'mt_company_admins' : 'mt_company_users';
      const payload: any = {
        company_id: formData.company_id,
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password_hash: btoa(formData.password),
        role: formData.role,
        is_active: formData.is_active,
      };
      if (formData.access_expires_at) payload.access_expires_at = formData.access_expires_at;
      const { error } = await supabase.from(table).insert(payload);
      if (error) throw error;
      toast({ title: 'User Created', description: `${formData.username} added successfully` });
      setFormData({ username: '', email: '', password: '', company_id: '', role: 'company_user', access_expires_at: '', is_active: true });
      setShowCreateForm(false);
      loadUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to create user', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  // ── Stats ───────────────────────────────────────────────────────────────────
  const activeCount  = users.filter(u => u.is_active && !u.access_revoked && !u.auto_blocked).length;
  const blockedCount = users.filter(u => u.access_revoked || u.auto_blocked || !u.is_active).length;
  const adminCount   = users.filter(u => u.role === 'company_admin').length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">User Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} total users across {companies.length} companies</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-xl border border-white/8 text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
          <Button
            onClick={() => setShowCreateForm(v => !v)}
            size="sm"
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Add User
          </Button>
        </div>
      </div>

      {/* ── Stat pills ── */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Active', value: activeCount, color: 'text-emerald-400 bg-emerald-500/8 border-emerald-500/15' },
          { label: 'Blocked', value: blockedCount, color: 'text-rose-400 bg-rose-500/8 border-rose-500/15' },
          { label: 'Admins', value: adminCount, color: 'text-violet-400 bg-violet-500/8 border-violet-500/15' },
          { label: 'Total', value: users.length, color: 'text-slate-400 bg-white/4 border-white/10' },
        ].map(({ label, value, color }) => (
          <div key={label} className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold', color)}>
            <span className="text-[10px] text-current opacity-70 uppercase tracking-wider">{label}</span>
            <span className="font-bold">{value}</span>
          </div>
        ))}
      </div>

      {/* ── Create User Form ── */}
      {showCreateForm && (
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.03] p-6 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Create New User</h3>
                <p className="text-xs text-slate-500">Add a user or admin to a company</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)} className="h-8 w-8 p-0 rounded-xl text-slate-500 hover:text-white hover:bg-white/5">
              <XCircle className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400 font-medium">Username *</Label>
              <Input value={formData.username} onChange={e => setFormData(p => ({ ...p, username: e.target.value }))} placeholder="john_doe" className="glass-input h-10 text-sm" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400 font-medium">Email *</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="john@company.com" className="glass-input h-10 text-sm" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400 font-medium">Password *</Label>
              <Input type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" className="glass-input h-10 text-sm" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400 font-medium">Company *</Label>
              <select value={formData.company_id} onChange={e => setFormData(p => ({ ...p, company_id: e.target.value }))} className="glass-input h-10 text-sm w-full rounded-xl bg-white/5 border border-white/10 text-white px-3" required>
                <option value="">Select company…</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400 font-medium">Role</Label>
              <select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))} className="glass-input h-10 text-sm w-full rounded-xl bg-white/5 border border-white/10 text-white px-3">
                <option value="company_user">User</option>
                <option value="company_admin">Admin</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400 font-medium">Access Expires (optional)</Label>
              <Input type="date" value={formData.access_expires_at} onChange={e => setFormData(p => ({ ...p, access_expires_at: e.target.value }))} className="glass-input h-10 text-sm" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)} className="h-9 px-4 text-xs text-slate-500">Cancel</Button>
              <Button type="submit" disabled={submitting} className="h-9 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
                {submitting ? 'Creating…' : 'Create User'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search + Filter ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <Input
            placeholder="Search users, emails, companies…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 glass-input h-10 text-sm"
          />
        </div>
        <Select value={selectedCompany} onValueChange={setSelectedCompany}>
          <SelectTrigger className="glass-input h-10 text-sm w-full sm:w-56">
            <SelectValue placeholder="All companies" />
          </SelectTrigger>
          <SelectContent className="glass-select-content">
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.display_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── User List ── */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-600 uppercase tracking-widest">Loading users…</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
              <Users className="w-6 h-6 text-slate-700" />
            </div>
            <p className="text-sm font-medium text-slate-600">No users found</p>
            <p className="text-xs text-slate-700">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredUsers.map((user, idx) => {
              const status = getUserStatus(user);
              const isAdmin = user.role === 'company_admin';
              return (
                <div
                  key={user.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group animate-in fade-in"
                  style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                >
                  {/* Left: avatar + info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center border',
                        isAdmin
                          ? 'bg-violet-500/10 border-violet-500/20'
                          : 'bg-slate-500/10 border-slate-500/15'
                      )}>
                        {isAdmin
                          ? <Crown className="w-4.5 h-4.5 text-violet-400" />
                          : <User className="w-4.5 h-4.5 text-slate-400" />
                        }
                      </div>
                      {/* Status dot */}
                      <span className={cn('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0d0d0f]', status.dot)} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white truncate">{user.username}</span>
                        <Badge className={cn('text-[9px] font-semibold uppercase tracking-wider border px-1.5 py-0 rounded-md', status.color)}>
                          {status.label}
                        </Badge>
                        {isAdmin && (
                          <Badge className="text-[9px] font-semibold uppercase tracking-wider border px-1.5 py-0 rounded-md text-violet-400 bg-violet-500/8 border-violet-500/20">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />{user.email}
                        </span>
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {user.company?.display_name || '—'}
                        </span>
                        {user.access_expires_at && (
                          <span className="text-xs text-amber-500/80 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expires {format(parseISO(user.access_expires_at), 'dd MMM yyyy')}
                          </span>
                        )}
                        <span className="text-xs text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(user.created_at), 'dd MMM yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: action buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    {/* Revoke / Restore */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevokeAccess(user.id, !user.access_revoked)}
                      title={user.access_revoked ? 'Restore access' : 'Revoke access'}
                      className={cn(
                        'h-8 w-8 p-0 rounded-xl border transition-all',
                        user.access_revoked
                          ? 'text-emerald-400 bg-emerald-500/8 border-emerald-500/20 hover:bg-emerald-600 hover:text-white'
                          : 'text-rose-400 bg-rose-500/8 border-rose-500/20 hover:bg-rose-600 hover:text-white'
                      )}
                    >
                      {user.access_revoked ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                    </Button>

                    {/* Delete */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(user)}
                      title="Delete user"
                      className="h-8 w-8 p-0 rounded-xl border text-slate-500 border-white/8 hover:bg-rose-600 hover:text-white hover:border-rose-500/30 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer count */}
        {filteredUsers.length > 0 && (
          <div className="px-5 py-3 border-t border-white/[0.04] bg-white/[0.01]">
            <p className="text-xs text-slate-700">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
