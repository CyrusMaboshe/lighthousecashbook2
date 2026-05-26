/**
 * Access Control Panel - Quick access control management for super admins
 */

import React, { useState, useEffect } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  ShieldOff,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Users,
  DollarSign,
  Activity,
  Zap,
  Lock,
  Unlock,
  ShieldCheck,
  Layout,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { SimpleCounter } from '@/components/ui/AnimatedCounter';

interface AccessControlStats {
  totalUsers: number;
  activeUsers: number;
  revokedUsers: number;
  expiredUsers: number;
  paymentDueUsers: number;
  blockedUsers: number;
}

export function AccessControlPanel() {
  const [stats, setStats] = useState<AccessControlStats>({
    totalUsers: 0,
    activeUsers: 0,
    revokedUsers: 0,
    expiredUsers: 0,
    paymentDueUsers: 0,
    blockedUsers: 0
  });
  const [usersRequiringAttention, setUsersRequiringAttention] = useState<any>({
    expiringSoon: [],
    paymentDue: [],
    blocked: []
  });
  const [loading, setLoading] = useState(true);
  const [runningAutoCheck, setRunningAutoCheck] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    const uSub = supabase.channel(`access_control_users_changes-${Math.random().toString(36).substring(2, 9)}`).on('postgres_changes', { event: '*', schema: 'public', table: 'mt_company_users' }, () => loadData()).subscribe();
    const aSub = supabase.channel(`access_control_admins_changes-${Math.random().toString(36).substring(2, 9)}`).on('postgres_changes', { event: '*', schema: 'public', table: 'mt_company_admins' }, () => loadData()).subscribe();
    return () => { uSub.unsubscribe(); aSub.unsubscribe(); };
  }, []);

  const loadData = async () => {
    try { setLoading(true); await Promise.all([loadStats(), loadUsersRequiringAttention()]); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadStats = async () => {
    const [ur, ar] = await Promise.all([supabase.from('mt_company_users').select('*'), supabase.from('mt_company_admins').select('*')]);
    const all = [...(ur.data || []), ...(ar.data || [])];
    const n = new Date();
    setStats({
      totalUsers: all.length,
      activeUsers: all.filter(u => u.is_active && !u.access_revoked && !u.auto_blocked).length,
      revokedUsers: all.filter(u => u.access_revoked).length,
      blockedUsers: all.filter(u => u.auto_blocked || !u.is_active).length,
      expiredUsers: all.filter(u => u.access_expires_at && new Date(u.access_expires_at) < n).length,
      paymentDueUsers: all.filter(u => u.payment_required && u.payment_due_date && new Date(u.payment_due_date) < n).length
    });
  };

  const loadUsersRequiringAttention = async () => {
    const d3 = new Date(); d3.setDate(d3.getDate() + 3);
    const n = new Date();
    const [ur, ar] = await Promise.all([supabase.from('mt_company_users').select('*, company:mt_companies(display_name)'), supabase.from('mt_company_admins').select('*, company:mt_companies(display_name)')]);
    const all = [...(ur.data || []).map(u => ({ ...u, r: 'user' })), ...(ar.data || []).map(u => ({ ...u, r: 'admin' }))];
    setUsersRequiringAttention({
      expiringSoon: all.filter(u => u.is_active && !u.access_revoked && u.access_expires_at && new Date(u.access_expires_at) <= d3 && new Date(u.access_expires_at) >= n),
      paymentDue: all.filter(u => u.payment_required && u.payment_due_date && new Date(u.payment_due_date) <= n),
      blocked: all.filter(u => !u.is_active || u.auto_blocked || u.access_revoked).slice(0, 5)
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard label="Agents" value={stats.totalUsers} icon={Users} color="slate" />
        <StatsCard label="Verified" value={stats.activeUsers} icon={ShieldCheck} color="emerald" />
        <StatsCard label="Overridden" value={stats.revokedUsers} icon={ShieldOff} color="rose" />
        <StatsCard label="Expired" value={stats.expiredUsers} icon={Clock} color="orange" />
        <StatsCard label="Debt Due" value={stats.paymentDueUsers} icon={DollarSign} color="amber" />
        <StatsCard label="Firewalled" value={stats.blockedUsers} icon={AlertTriangle} color="rose" />
      </div>

      <div className="glass-card p-8 border-indigo-500/20 bg-indigo-500/[0.02] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight uppercase">Access Control Matrix</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Synchronization & Security Audit</p>
          </div>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <Button onClick={loadData} variant="ghost" className="h-12 px-6 rounded-xl border border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 italic">Sync Data</Button>
          <Button className="h-12 px-8 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/30 active:scale-95 transition-all">
            <RefreshCw className={cn("w-4 h-4 mr-2", runningAutoCheck && "animate-spin")} />
            Execute System Sweep
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <AttentionSector title="Temporal Threshold" icon={Clock} color="orange" users={usersRequiringAttention.expiringSoon} emptyMsg="No impending expiries detected" />
        <AttentionSector title="Financial Compliance" icon={DollarSign} color="amber" users={usersRequiringAttention.paymentDue} emptyMsg="No deviant settlement balances" />
        <AttentionSector title="Protocol Terminations" icon={ShieldOff} color="rose" users={usersRequiringAttention.blocked} emptyMsg="No recent blockages recorded" />
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    slate: "from-slate-500/20 text-slate-400 border-slate-500/20",
    emerald: "from-emerald-500/20 text-emerald-400 border-emerald-500/20",
    rose: "from-rose-500/20 text-rose-400 border-rose-500/20",
    orange: "from-orange-500/20 text-orange-400 border-orange-500/20",
    amber: "from-amber-500/20 text-amber-400 border-amber-500/20"
  };
  return (
    <div className={cn("glass-card p-5 bg-gradient-to-br border-white/5 transition-all duration-500 hover:scale-[1.05] group", colors[color])}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        <Icon className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="text-3xl font-black text-white tracking-tighter tabular-nums leading-none">
        <SimpleCounter amount={value} currency="" decimals={0} />
      </div>
    </div>
  );
}

function AttentionSector({ title, icon: Icon, color, users, emptyMsg }: any) {
  const colorMap: any = {
    orange: "text-orange-400 bg-orange-500/5 border-orange-500/20",
    amber: "text-amber-400 bg-amber-500/5 border-amber-500/20",
    rose: "text-rose-400 bg-rose-500/5 border-rose-500/20"
  };
  return (
    <div className="glass-card p-6 border-white/5 bg-white/[0.01] flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <Icon className={cn("w-4 h-4", colorMap[color].split(' ')[0])} />
        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{title}</h4>
      </div>
      <div className="flex-1 space-y-3">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-30 italic">
            <Layout className="w-8 h-8 mb-2 stroke-[1]" />
            <p className="text-[10px] font-bold uppercase tracking-widest">{emptyMsg}</p>
          </div>
        ) : (
          users.map((u: any) => (
            <div key={u.id} className={cn("p-4 rounded-[18px] border transition-all hover:translate-x-1 group", colorMap[color])}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-black text-white uppercase italic tracking-tighter leading-none">{u.username}</span>
                <Fingerprint className="w-3.5 h-3.5 opacity-20 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">{u.company?.display_name?.toUpperCase() || 'CORE'}</span>
                <Badge className="bg-white/10 text-inherit text-[8px] font-black h-4 px-1.5 uppercase italic">{u.access_expires_at ? format(parseISO(u.access_expires_at), 'MMM d') : 'LOCKED'}</Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
