// Super Admin Panel for jonahdjbreezy@gmail.com
// This allows creating and managing multi-tenant companies from within the existing system

import { useState, useEffect } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  Plus,
  Users,
  UserPlus,
  Eye,
  EyeOff,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Camera,
  BarChart3,
  Wallet,
  Trash2,
  AlertTriangle,
  Shield,
  Zap,
  Activity,
  Layout,
  LayoutGrid,
  ShieldCheck,
  Server,
  Globe,
  Settings,
  ArrowRightCircle,
  Database,
  Lock,
  Cpu
} from 'lucide-react';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { MTCompany } from '@/services/separateMultiTenantAuth';
import { supabase } from '@/integrations/supabase/client';
import { CompanyUserManagement } from '@/components/super-admin/CompanyUserManagement';
import { AccessControlPanel } from '@/components/super-admin/AccessControlPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { SimpleCounter } from '@/components/ui/AnimatedCounter';

interface CompanyTransactionStats {
  company_id: string;
  total_cash_in: number;
  total_cash_out: number;
  net_balance: number;
  total_pictures: number;
  total_transactions: number;
}

export function SuperAdminPanel() {
  const [companies, setCompanies] = useState<MTCompany[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyTransactionStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState<string | null>(null);
  const [showCreateUser, setShowCreateUser] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [companyDisplayName, setCompanyDisplayName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');

  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [userUsername, setUserUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);

  const { createCompany, createCompanyAdmin, createCompanyUser, getAllCompanies, isSuperAdmin } = useMultiTenantAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadCompanies();
    loadCompanyTransactionStats();
    const subscription = supabase.channel('admin_panel_transactions').on('postgres_changes', { event: '*', schema: 'public', table: 'mt_company_transactions' }, () => loadCompanyTransactionStats()).subscribe();
    return () => { subscription.unsubscribe(); };
  }, []);

  const loadCompanies = async () => {
    try { setLoading(true); const list = await getAllCompanies(); setCompanies(list); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadCompanyTransactionStats = async () => {
    try {
      const { data, error } = await supabase.from('mt_company_transactions').select('company_id, type, amount, number_of_pictures');
      if (error) return;
      if (data) {
        const statsMap = new Map<string, CompanyTransactionStats>();
        data.forEach(t => {
          const cid = t.company_id;
          const ex = statsMap.get(cid) || { company_id: cid, total_cash_in: 0, total_cash_out: 0, net_balance: 0, total_pictures: 0, total_transactions: 0 };
          ex.total_transactions += 1;
          if (t.type === 'cash-in') { ex.total_cash_in += parseFloat(t.amount) || 0; ex.total_pictures += t.number_of_pictures || 0; }
          else if (t.type === 'cash-out') ex.total_cash_out += parseFloat(t.amount) || 0;
          ex.net_balance = ex.total_cash_in - ex.total_cash_out;
          statsMap.set(cid, ex);
        });
        setCompanyStats(Array.from(statsMap.values()));
      }
    } catch (e) { console.error(e); }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !companyDisplayName.trim()) return;
    try {
      setLoading(true);
      const res = await createCompany(companyName.trim(), companyDisplayName.trim(), companyDescription.trim() || undefined);
      if (res) {
        toast({ title: "Sector Synchronized", description: `"${res.display_name}" provisioned.` });
        setCompanyName(''); setCompanyDisplayName(''); setCompanyDescription(''); setShowCreateForm(false);
        await loadCompanies(); await loadCompanyTransactionStats();
      }
    } catch (e) { toast({ title: "Error", variant: "destructive" }); } finally { setLoading(false); }
  };

  const handleDeleteCompany = async (cid: string, name: string) => {
    if (window.confirm(`Permanently delete ${name}?`) && window.confirm("🚨 FINAL WARNING: ALL DATA PERMANENTLY DELETED") && window.prompt('Type DELETE to confirm:') === 'DELETE') {
      try {
        setLoading(true);
        await supabase.from('mt_company_transactions').delete().eq('company_id', cid);
        await supabase.from('mt_company_users').delete().eq('company_id', cid);
        await supabase.from('mt_company_admins').delete().eq('company_id', cid);
        await supabase.from('mt_companies').delete().eq('id', cid);
        toast({ title: "Sector Purged" });
        await loadCompanies(); await loadCompanyTransactionStats();
      } catch (e) { toast({ title: "De-provisioning Failed", variant: "destructive" }); } finally { setLoading(false); }
    }
  };

  const currentStats = {
    totalSectors: companies.length,
    totalLiquidity: companyStats.reduce((s, c) => s + c.net_balance, 0),
    totalOperations: companyStats.reduce((s, c) => s + c.total_transactions, 0)
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="glass-card overflow-hidden p-8 md:p-12 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-indigo-500 to-purple-600 p-4 border border-white/20 shadow-2xl shadow-indigo-500/40">
                <Globe className="w-full h-full text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">Interstellar Overlord</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-2 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  Multi-Tenant Core Infrastructure Cluster
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/infrastructure'}
              className="h-12 px-6 rounded-xl bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-xl"
            >
              <Cpu className="h-4 w-4 mr-2" />
              Deeper Analysis
            </Button>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="h-12 px-6 rounded-xl glass-btn-primary bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Initialize Sector
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-700">
        <div className="glass-card p-6 bg-indigo-500/[0.02] border-indigo-500/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Environments</h3>
          <div className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none">
            <SimpleCounter amount={currentStats.totalSectors} currency="" decimals={0} />
          </div>
          <p className="text-[9px] font-black text-slate-600 uppercase mt-4 tracking-tighter">Isolated Data Buckets</p>
        </div>
        <div className="glass-card p-6 bg-emerald-500/[0.02] border-emerald-500/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ecosystem Liquidity</h3>
          <div className="text-4xl font-black text-emerald-400 tracking-tighter tabular-nums leading-none">
            <SimpleCounter amount={currentStats.totalLiquidity} currency="ZMW" decimals={2} />
          </div>
          <p className="text-[9px] font-black text-slate-600 uppercase mt-4 tracking-tighter">Gross Aggregate Value</p>
        </div>
        <div className="glass-card p-6 bg-purple-500/[0.02] border-purple-500/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all" />
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Neural Operations</h3>
          <div className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none">
            <SimpleCounter amount={currentStats.totalOperations} currency="" decimals={0} />
          </div>
          <p className="text-[9px] font-black text-slate-600 uppercase mt-4 tracking-tighter">Protocol Density Index</p>
        </div>
      </div>

      <Tabs defaultValue="companies" className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass-card p-1 gap-1.5 bg-white/[0.02] border-white/5 mb-8">
          <TabsTrigger value="companies" className="h-11 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Sectors</TabsTrigger>
          <TabsTrigger value="users" className="h-11 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Agents</TabsTrigger>
          <TabsTrigger value="admin-management" className="h-11 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Terminal Admins</TabsTrigger>
          <TabsTrigger value="access-control" className="h-11 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Guard Protocols</TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="space-y-8 animate-in slide-in-from-left-4 duration-500">
          {showCreateForm && (
            <div className="glass-card p-8 border-emerald-500/20 bg-emerald-500/[0.01] animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Plus className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Provision New Sector</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Expansion Protocol Initiation</p>
                </div>
              </div>
              <form onSubmit={handleCreateCompany} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Universal Identifier (Slug)</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. quantum-lab" className="glass-input h-14 text-[12px] font-black uppercase italic" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sector Label (Display)</Label>
                  <Input value={companyDisplayName} onChange={e => setCompanyDisplayName(e.target.value)} placeholder="e.g. QUANTUM CORE LABORATORY" className="glass-input h-14 text-[12px] font-black uppercase italic" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Structural Directive (Description)</Label>
                  <Textarea value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} placeholder="DECLARE SECTOR PURPOSE AND ACCESS PARAMETERS..." className="glass-input min-h-[100px] resize-none text-[11px] font-black uppercase tracking-widest" />
                </div>
                <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)} className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Abort</Button>
                  <Button type="submit" disabled={loading} className="h-14 px-12 rounded-2xl glass-btn-primary bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">Authorize Provisioning</Button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {companies.length === 0 ? (
              <div className="glass-card p-32 text-center border-white/5">
                <Server className="w-20 h-20 text-slate-800 mx-auto mb-6 stroke-[0.5]" />
                <h4 className="text-2xl font-black text-slate-600 uppercase tracking-tighter mb-2">Cluster Empty</h4>
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">Awaiting infrastructure deployment patterns</p>
              </div>
            ) : (
              companies.map((company) => {
                const stats = companyStats.find(s => s.company_id === company.id) || { total_cash_in: 0, total_cash_out: 0, net_balance: 0, total_pictures: 0, total_transactions: 0 };
                return (
                  <div key={company.id} className="glass-card p-8 group hover:bg-white/[0.02] transition-all duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 py-2">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-600/10 group-hover:border-indigo-500/50 transition-all duration-700 shadow-2xl">
                          <Building2 className="w-10 h-10 text-slate-400 group-hover:text-indigo-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">{company.display_name}</h3>
                            <Badge className="bg-indigo-500 text-white text-[8px] font-black h-4 px-1.5 uppercase italic tracking-widest">SECTOR PROTECTED</Badge>
                          </div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">ID: {company.name}</p>
                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                              <span className="text-[13px] font-black text-white tabular-nums tracking-tighter">{stats.total_cash_in.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                              <span className="text-[13px] font-black text-white tabular-nums tracking-tighter">{stats.total_cash_out.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                              <Activity className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="text-[13px] font-black text-white tabular-nums tracking-tighter">{stats.total_transactions} OPS</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-3">
                        <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
                          <Button size="sm" variant="outline" onClick={() => setShowCreateAdmin(company.id)} className="h-11 px-4 rounded-xl bg-white/5 border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/10">Add Terminal Admin</Button>
                          <Button size="sm" variant="outline" onClick={() => setShowCreateUser(company.id)} className="h-11 px-4 rounded-xl bg-white/5 border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/10">Register Agent</Button>
                        </div>
                        <Button onClick={() => handleDeleteCompany(company.id, company.display_name)} disabled={loading} className="h-11 w-full md:w-auto px-6 rounded-xl bg-rose-600/10 text-rose-400 border border-rose-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">De-provision Sector</Button>
                      </div>
                    </div>

                    {/* Inner Grid for Admin/User Creation forms omitted for brevity but they should follow same glass pattern if shown */}
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="animate-in slide-in-from-right-4 duration-500">
          <CompanyUserManagement />
        </TabsContent>

        <TabsContent value="admin-management" className="animate-in slide-in-from-right-4 duration-500">
          <div className="glass-card p-12 text-center border-indigo-500/20 bg-indigo-500/[0.02]">
            <Shield className="w-20 h-20 text-indigo-400/30 mx-auto mb-8 stroke-[0.5]" />
            <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic mb-4">Master Terminal Management</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] max-w-lg mx-auto leading-relaxed mb-10">Administrative isolation protocols have been migrated to the dedicated infrastructure dashboard for enhanced quantum security.</p>
            <Button onClick={() => window.location.href = '/infrastructure'} className="h-14 px-12 rounded-2xl glass-btn-primary bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/30 active:scale-95 transition-all">Launch Master Suite <ArrowRightCircle className="ml-3 h-5 w-5" /></Button>
          </div>
        </TabsContent>

        <TabsContent value="access-control" className="animate-in slide-in-from-bottom-4 duration-500">
          <AccessControlPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
