/**
 * Company User Management - Super Admin Interface
 * Allows super admins to view, manage, and perform CRUD operations on users under any company
 * Includes access control, time-based restrictions, and real-time updates
 */

import React, { useState, useEffect } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  ShieldOff,
  Clock,
  Calendar,
  Building2,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  Fingerprint,
  Zap,
  Activity,
  Layout,
  ArrowRightCircle,
  ShieldCheck,
  Server,
  Lock,
  Cpu,
  Database,
  Key
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, parseISO } from 'date-fns';
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
  company?: {
    id: string;
    display_name: string;
    name: string;
  };
}

interface Company {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
}

export function CompanyUserManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<CompanyUser[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    company_id: '',
    role: 'company_user',
    access_expires_at: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
    const uSub = supabase.channel(`mt_company_users_changes-${Math.random().toString(36).substring(2, 9)}`).on('postgres_changes', { event: '*', schema: 'public', table: 'mt_company_users' }, () => loadUsers()).subscribe();
    const aSub = supabase.channel(`mt_company_admins_changes-${Math.random().toString(36).substring(2, 9)}`).on('postgres_changes', { event: '*', schema: 'public', table: 'mt_company_admins' }, () => loadUsers()).subscribe();
    const cSub = supabase.channel(`mt_companies_changes-${Math.random().toString(36).substring(2, 9)}`).on('postgres_changes', { event: '*', schema: 'public', table: 'mt_companies' }, () => loadCompanies()).subscribe();
    return () => { uSub.unsubscribe(); aSub.unsubscribe(); cSub.unsubscribe(); };
  }, []);

  useEffect(() => { filterUsers(); }, [users, selectedCompany, searchTerm]);

  const loadData = async () => {
    try { setLoading(true); await Promise.all([loadCompanies(), loadUsers()]); } catch (e) { toast({ title: "Error", variant: "destructive" }); } finally { setLoading(false); }
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
    if (searchTerm) f = f.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()) || u.company?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredUsers(f);
  };

  const handleRevokeAccess = async (uid: string, revoke: boolean) => {
    const u = users.find(x => x.id === uid);
    if (!u) return;
    const table = u.role === 'company_admin' ? 'mt_company_admins' : 'mt_company_users';
    const up: any = { access_revoked: revoke, is_active: !revoke, updated_at: new Date().toISOString() };
    if (revoke) { up.access_revoked_at = new Date().toISOString(); up.access_revoked_reason = 'System Override'; }
    await supabase.from(table).update(up).eq('id', uid);
    toast({ title: "Override Executed", description: `Access ${revoke ? 'Revoked' : 'Restored'}` });
    loadUsers();
  };

  const getUserStatusBadge = (u: CompanyUser) => {
    if (u.access_revoked) return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[8px] font-black uppercase italic tracking-widest"><ShieldOff className="h-2.5 w-2.5 mr-1" />Terminated</Badge>;
    if (u.auto_blocked) return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[8px] font-black uppercase italic tracking-widest"><AlertTriangle className="h-2.5 w-2.5 mr-1" />Firewall Block</Badge>;
    if (!u.is_active) return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 text-[8px] font-black uppercase italic tracking-widest">Inactive</Badge>;
    return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] font-black uppercase italic tracking-widest"><CheckCircle className="h-2.5 w-2.5 mr-1" />Verified</Badge>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 h-4 w-4 group-focus-within:text-indigo-400 transition-colors" />
          <Input
            placeholder="Identify Agents in Cluster..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 glass-input h-14 text-[11px] font-black uppercase tracking-widest border-white/5 focus:border-indigo-500/30 transition-all"
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="glass-select h-14 text-[11px] font-black uppercase tracking-widest">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-select-content">
              <SelectItem value="all">Global Matrix Filter</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.display_name.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="glass-card overflow-hidden border-white/5 shadow-2xl relative min-h-[500px]">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

        <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase">Agent Roster</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Multi-Tenant Personnel Matrix</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={loadData} variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            <Button onClick={() => setShowCreateForm(true)} className="h-10 px-6 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">
              <UserPlus className="h-4 w-4 mr-2" />
              Register Agent
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-32 flex flex-col items-center justify-center">
            <Activity className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Syncing Neural Data...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-32 text-center">
            <Users className="w-16 h-16 text-slate-800 mx-auto mb-6 stroke-[0.5]" />
            <h4 className="text-xl font-black text-slate-600 uppercase tracking-tighter mb-2">Matrix Depleted</h4>
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">No agents detected in current sector range</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {filteredUsers.map((user, idx) => (
              <div key={user.id} className="p-6 hover:bg-white/[0.02] transition-all duration-500 flex flex-col xl:flex-row xl:items-center justify-between gap-6 group animate-in slide-in-from-left-4" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-600/10 group-hover:border-indigo-500/50 transition-all duration-700 shadow-2xl relative">
                    <Users className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-slate-900 group-hover:scale-125 transition-all" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-black text-white tracking-tight uppercase italic leading-none">{user.username}</h3>
                      {getUserStatusBadge(user)}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic mb-3">{user.email}</p>
                    <div className="flex items-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3 text-indigo-500" /> {user.company?.display_name?.toUpperCase() || 'CORE'}</span>
                      <span className="flex items-center gap-1.5"><Layout className="w-3 h-3 text-emerald-500" /> ROLE: {user.role.toUpperCase()}</span>
                      <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> RECURRED: {format(parseISO(user.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden xl:flex flex-col items-end mr-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.access_expires_at ? 'Time-Locked' : 'Infinite Protocol'}</span>
                    <span className="text-[9px] font-black text-slate-600 uppercase mt-1">
                      {user.access_expires_at ? `Expires: ${format(parseISO(user.access_expires_at), 'MMM d')}` : 'Immortal Node'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleRevokeAccess(user.id, !user.access_revoked)} variant="ghost" className={cn("h-10 w-10 p-0 rounded-xl transition-all", user.access_revoked ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-600/10 text-rose-400 border border-rose-500/20")}>
                      {user.access_revoked ? <ShieldCheck className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 transition-all">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-orange-600/10 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/20 transition-all">
                      <Key className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => { if (confirm('Erase Agent Data?')) supabase.from(user.role === 'company_admin' ? 'mt_company_admins' : 'mt_company_users').delete().eq('id', user.id).then(() => loadUsers()) }} variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
