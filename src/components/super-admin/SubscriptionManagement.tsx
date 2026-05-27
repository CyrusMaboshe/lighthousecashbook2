/**
 * SubscriptionManagement.tsx
 * Super Admin – manually manage company subscription plans, billing & payment history.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard, Plus, RefreshCw, Building2, Clock, CheckCircle,
  XCircle, AlertTriangle, ChevronDown, ChevronUp, DollarSign,
  CalendarDays, ReceiptText, Pencil, Trash2, ShieldCheck, Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { SimpleCounter } from '@/components/ui/AnimatedCounter';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Company { id: string; display_name: string; name: string; }

interface Subscription {
  id: string;
  company_id: string;
  plan_name: string;
  plan_amount: number;
  currency: string;
  billing_period: string;
  start_date: string;
  expiry_date: string | null;
  status: 'active' | 'suspended' | 'expired' | 'cancelled' | 'trial';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string;
  subscription_id: string;
  company_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string;
  reference: string | null;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  trial: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  suspended: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  expired: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  active: <CheckCircle className="w-3.5 h-3.5" />,
  trial: <Zap className="w-3.5 h-3.5" />,
  suspended: <AlertTriangle className="w-3.5 h-3.5" />,
  expired: <Clock className="w-3.5 h-3.5" />,
  cancelled: <XCircle className="w-3.5 h-3.5" />,
};

// ─── Component ────────────────────────────────────────────────────────────────
export function SubscriptionManagement() {
  const { toast } = useToast();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // expanded company card
  const [expanded, setExpanded] = useState<string | null>(null);

  // Form states
  const [showSubForm, setShowSubForm] = useState<string | null>(null); // companyId
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [showPayForm, setShowPayForm] = useState<string | null>(null); // subscriptionId
  const [submitting, setSubmitting] = useState(false);

  // Sub form fields
  const [fPlan, setFPlan] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fCurrency, setFCurrency] = useState('ZMW');
  const [fBilling, setFBilling] = useState('monthly');
  const [fStart, setFStart] = useState('');
  const [fExpiry, setFExpiry] = useState('');
  const [fStatus, setFStatus] = useState('active');
  const [fNotes, setFNotes] = useState('');

  // Payment form fields
  const [pAmount, setPAmount] = useState('');
  const [pDate, setPDate] = useState('');
  const [pMethod, setPMethod] = useState('manual');
  const [pRef, setPRef] = useState('');
  const [pNotes, setPNotes] = useState('');

  // ─── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: cData }, { data: sData }, { data: pData }] = await Promise.all([
        supabase.from('mt_companies').select('id, display_name, name').order('display_name'),
        supabase.from('mt_company_subscriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('mt_subscription_payments').select('*').order('payment_date', { ascending: false }),
      ]);
      setCompanies(cData || []);
      setSubscriptions(sData || []);
      setPayments(pData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel('sub_mgmt_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mt_company_subscriptions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mt_subscription_payments' }, load)
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [load]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const getCompanySub = (companyId: string) =>
    subscriptions.filter(s => s.company_id === companyId);

  const getSubPayments = (subId: string) =>
    payments.filter(p => p.subscription_id === subId);

  const openSubForm = (companyId: string, existing?: Subscription) => {
    setShowSubForm(companyId);
    setEditingSub(existing || null);
    if (existing) {
      setFPlan(existing.plan_name);
      setFAmount(String(existing.plan_amount));
      setFCurrency(existing.currency);
      setFBilling(existing.billing_period);
      setFStart(existing.start_date.slice(0, 10));
      setFExpiry(existing.expiry_date ? existing.expiry_date.slice(0, 10) : '');
      setFStatus(existing.status);
      setFNotes(existing.notes || '');
    } else {
      setFPlan('Basic'); setFAmount(''); setFCurrency('ZMW');
      setFBilling('monthly'); setFStart(new Date().toISOString().slice(0, 10));
      setFExpiry(''); setFStatus('active'); setFNotes('');
    }
  };

  const closeSubForm = () => { setShowSubForm(null); setEditingSub(null); };

  // ─── Save Subscription ────────────────────────────────────────────────────
  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fPlan.trim() || !fAmount || !showSubForm) return;
    setSubmitting(true);
    try {
      const payload = {
        company_id: showSubForm,
        plan_name: fPlan.trim(),
        plan_amount: parseFloat(fAmount),
        currency: fCurrency,
        billing_period: fBilling,
        start_date: fStart,
        expiry_date: fExpiry || null,
        status: fStatus,
        notes: fNotes.trim() || null,
      };

      let error: any;
      if (editingSub) {
        ({ error } = await supabase.from('mt_company_subscriptions').update(payload).eq('id', editingSub.id));
      } else {
        ({ error } = await supabase.from('mt_company_subscriptions').insert(payload));
      }
      if (error) throw error;
      toast({ title: editingSub ? 'Subscription Updated' : 'Subscription Created', description: `Plan: ${fPlan}` });
      closeSubForm();
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to save subscription', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete Subscription ──────────────────────────────────────────────────
  const handleDeleteSub = async (sub: Subscription) => {
    if (!window.confirm(`Delete subscription "${sub.plan_name}"? All payment history will also be removed.`)) return;
    const { error } = await supabase.from('mt_company_subscriptions').delete().eq('id', sub.id);
    if (error) { toast({ title: 'Error', variant: 'destructive' }); return; }
    toast({ title: 'Subscription Deleted' });
    load();
  };

  // ─── Save Payment ─────────────────────────────────────────────────────────
  const handleSavePayment = async (e: React.FormEvent, subId: string, companyId: string) => {
    e.preventDefault();
    if (!pAmount || !pDate) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('mt_subscription_payments').insert({
        subscription_id: subId,
        company_id: companyId,
        amount: parseFloat(pAmount),
        currency: fCurrency || 'ZMW',
        payment_date: pDate,
        payment_method: pMethod,
        reference: pRef.trim() || null,
        recorded_by: 'super-admin',
        notes: pNotes.trim() || null,
      });
      if (error) throw error;
      toast({ title: 'Payment Recorded', description: `ZMW ${pAmount} on ${pDate}` });
      setShowPayForm(null);
      setPAmount(''); setPDate(''); setPMethod('manual'); setPRef(''); setPNotes('');
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Quick Status Toggle ───────────────────────────────────────────────────
  const quickToggleStatus = async (sub: Subscription, newStatus: Subscription['status']) => {
    await supabase.from('mt_company_subscriptions').update({ status: newStatus }).eq('id', sub.id);
    load();
    toast({ title: `Status → ${newStatus}`, description: sub.plan_name });
  };

  // ─── Summary stats ─────────────────────────────────────────────────────────
  const stats = {
    total: companies.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    suspended: subscriptions.filter(s => s.status === 'suspended' || s.status === 'expired').length,
    revenue: payments.reduce((a, p) => a + Number(p.amount), 0),
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* ── Header ── */}
      <div className="glass-card p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-indigo-500/5" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[100px] -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 border border-white/20">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Subscription Control</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mt-1">Manual Billing & Plan Management</p>
            </div>
          </div>
          <Button onClick={load} variant="ghost" className="h-11 px-6 rounded-xl border border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/5">
            <RefreshCw className="w-4 h-4 mr-2" /> Sync
          </Button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Companies', value: stats.total, color: 'indigo', icon: Building2, fmt: (v: number) => String(v) },
          { label: 'Active Plans', value: stats.active, color: 'emerald', icon: CheckCircle, fmt: (v: number) => String(v) },
          { label: 'Blocked / Expired', value: stats.suspended, color: 'rose', icon: XCircle, fmt: (v: number) => String(v) },
          { label: 'Total Revenue', value: stats.revenue, color: 'violet', icon: DollarSign, fmt: (v: number) => `ZMW ${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        ].map(({ label, value, color, icon: Icon, fmt }) => (
          <div key={label} className={cn(
            'glass-card p-5 border-white/5 group hover:scale-[1.03] transition-all duration-300',
            color === 'indigo' && 'bg-indigo-500/[0.03] border-indigo-500/10',
            color === 'emerald' && 'bg-emerald-500/[0.03] border-emerald-500/10',
            color === 'rose' && 'bg-rose-500/[0.03] border-rose-500/10',
            color === 'violet' && 'bg-violet-500/[0.03] border-violet-500/10',
          )}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
              <Icon className={cn('w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity',
                color === 'indigo' && 'text-indigo-400',
                color === 'emerald' && 'text-emerald-400',
                color === 'rose' && 'text-rose-400',
                color === 'violet' && 'text-violet-400',
              )} />
            </div>
            <div className={cn('text-2xl font-black tracking-tighter tabular-nums',
              color === 'emerald' ? 'text-emerald-400' : color === 'violet' ? 'text-violet-400' : 'text-white'
            )}>
              {fmt(value)}
            </div>
          </div>
        ))}
      </div>

      {/* ── Company List ── */}
      {loading ? (
        <div className="glass-card p-16 text-center">
          <RefreshCw className="w-8 h-8 text-slate-600 animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Loading Subscription Data…</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Building2 className="w-16 h-16 text-slate-800 mx-auto mb-4 stroke-[0.5]" />
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No Companies Found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {companies.map(company => {
            const subs = getCompanySub(company.id);
            const latestSub = subs[0] || null;
            const isExpanded = expanded === company.id;
            const hasActive = subs.some(s => s.status === 'active' || s.status === 'trial');

            return (
              <div key={company.id} className="glass-card border-white/5 overflow-hidden">
                {/* ── Company Row ── */}
                <div
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 cursor-pointer hover:bg-white/[0.02] transition-all"
                  onClick={() => setExpanded(isExpanded ? null : company.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[16px] bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">{company.display_name}</h3>
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{company.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {latestSub ? (
                      <>
                        <Badge className={cn('text-[9px] font-black uppercase tracking-wider border px-2 py-1 flex items-center gap-1.5', STATUS_COLORS[latestSub.status])}>
                          {STATUS_ICONS[latestSub.status]} {latestSub.status}
                        </Badge>
                        <span className="text-[11px] font-black text-white tabular-nums">
                          {latestSub.currency} {Number(latestSub.plan_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} / {latestSub.billing_period}
                        </span>
                        {latestSub.expiry_date && (
                          <span className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            Expires {format(parseISO(latestSub.expiry_date), 'dd MMM yyyy')}
                          </span>
                        )}
                      </>
                    ) : (
                      <Badge className="text-[9px] font-black uppercase tracking-wider border border-slate-700 bg-slate-500/10 text-slate-500 px-2 py-1">No Plan</Badge>
                    )}
                    <Button
                      size="sm"
                      onClick={ev => { ev.stopPropagation(); openSubForm(company.id); setExpanded(company.id); }}
                      className="h-9 px-4 rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-violet-600 hover:text-white transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Plan
                    </Button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>

                {/* ── Expanded Panel ── */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-white/[0.01] p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">

                    {/* ── Add/Edit Subscription Form ── */}
                    {showSubForm === company.id && (
                      <div className="glass-card p-6 border-violet-500/20 bg-violet-500/[0.02] animate-in slide-in-from-top-3 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                          <CreditCard className="w-5 h-5 text-violet-400" />
                          <h4 className="text-base font-black text-white uppercase tracking-tight">
                            {editingSub ? 'Edit Subscription' : 'New Subscription Plan'}
                          </h4>
                        </div>
                        <form onSubmit={handleSaveSub} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Plan Name</Label>
                            <Input value={fPlan} onChange={e => setFPlan(e.target.value)} placeholder="Basic / Pro / Enterprise" className="glass-input h-11 text-sm font-bold" required />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Amount</Label>
                            <Input type="number" min="0" step="0.01" value={fAmount} onChange={e => setFAmount(e.target.value)} placeholder="0.00" className="glass-input h-11 text-sm font-bold" required />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Currency</Label>
                            <Input value={fCurrency} onChange={e => setFCurrency(e.target.value)} placeholder="ZMW" className="glass-input h-11 text-sm font-bold" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Billing Period</Label>
                            <select value={fBilling} onChange={e => setFBilling(e.target.value)} className="glass-input h-11 text-sm font-bold w-full rounded-xl bg-white/5 border border-white/10 text-white px-3">
                              {['monthly', 'quarterly', 'annually', 'custom'].map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Start Date</Label>
                            <Input type="date" value={fStart} onChange={e => setFStart(e.target.value)} className="glass-input h-11 text-sm font-bold" required />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Expiry Date (blank = never)</Label>
                            <Input type="date" value={fExpiry} onChange={e => setFExpiry(e.target.value)} className="glass-input h-11 text-sm font-bold" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</Label>
                            <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="glass-input h-11 text-sm font-bold w-full rounded-xl bg-white/5 border border-white/10 text-white px-3">
                              {['active', 'trial', 'suspended', 'expired', 'cancelled'].map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                          <div className="md:col-span-2 space-y-1">
                            <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Notes</Label>
                            <Input value={fNotes} onChange={e => setFNotes(e.target.value)} placeholder="Optional notes…" className="glass-input h-11 text-sm" />
                          </div>
                          <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={closeSubForm} className="h-11 px-6 rounded-xl text-slate-500 text-[9px] font-black uppercase tracking-widest">Cancel</Button>
                            <Button type="submit" disabled={submitting} className="h-11 px-10 rounded-xl bg-violet-600 text-white text-[9px] font-black uppercase tracking-widest shadow-xl shadow-violet-500/20 active:scale-95 transition-all">
                              {submitting ? 'Saving…' : editingSub ? 'Update Plan' : 'Create Plan'}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* ── Subscription List ── */}
                    {subs.length === 0 ? (
                      <div className="text-center py-8 opacity-40">
                        <CreditCard className="w-10 h-10 text-slate-700 mx-auto mb-3 stroke-[0.5]" />
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No subscription plans yet</p>
                      </div>
                    ) : (
                      subs.map(sub => {
                        const subPays = getSubPayments(sub.id);
                        const totalPaid = subPays.reduce((a, p) => a + Number(p.amount), 0);
                        return (
                          <div key={sub.id} className="glass-card p-5 border-white/5 bg-white/[0.01] space-y-4">
                            {/* Sub header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-[14px] bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                                  <CreditCard className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-black text-white tracking-tighter uppercase">{sub.plan_name}</span>
                                    <Badge className={cn('text-[8px] font-black uppercase tracking-wider border px-1.5 py-0.5 flex items-center gap-1', STATUS_COLORS[sub.status])}>
                                      {STATUS_ICONS[sub.status]} {sub.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                    <span className="text-[10px] font-black text-slate-400">
                                      {sub.currency} {Number(sub.plan_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} / {sub.billing_period}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-600">Start: {format(parseISO(sub.start_date), 'dd MMM yyyy')}</span>
                                    {sub.expiry_date && (
                                      <span className="text-[10px] font-black text-slate-600">Expires: {format(parseISO(sub.expiry_date), 'dd MMM yyyy')}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Quick actions */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {sub.status !== 'active' && (
                                  <Button size="sm" onClick={() => quickToggleStatus(sub, 'active')} className="h-8 px-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">
                                    <CheckCircle className="w-3 h-3 mr-1" /> Activate
                                  </Button>
                                )}
                                {sub.status === 'active' && (
                                  <Button size="sm" onClick={() => quickToggleStatus(sub, 'suspended')} className="h-8 px-3 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-black uppercase hover:bg-amber-600 hover:text-white transition-all">
                                    <AlertTriangle className="w-3 h-3 mr-1" /> Suspend
                                  </Button>
                                )}
                                <Button size="sm" onClick={() => openSubForm(company.id, sub)} className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-[8px] font-black uppercase hover:bg-white/10 transition-all">
                                  <Pencil className="w-3 h-3 mr-1" /> Edit
                                </Button>
                                <Button size="sm" onClick={() => { setShowPayForm(sub.id); setPDate(new Date().toISOString().slice(0, 10)); }} className="h-8 px-3 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[8px] font-black uppercase hover:bg-violet-600 hover:text-white transition-all">
                                  <Plus className="w-3 h-3 mr-1" /> Record Payment
                                </Button>
                                <Button size="sm" onClick={() => handleDeleteSub(sub)} className="h-8 px-3 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[8px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all">
                                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                                </Button>
                              </div>
                            </div>

                            {/* Payment form */}
                            {showPayForm === sub.id && (
                              <div className="glass-card p-5 border-emerald-500/20 bg-emerald-500/[0.02] animate-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2 mb-4">
                                  <ReceiptText className="w-4 h-4 text-emerald-400" />
                                  <span className="text-sm font-black text-white uppercase tracking-tight">Record Payment</span>
                                </div>
                                <form onSubmit={e => handleSavePayment(e, sub.id, company.id)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-1">
                                    <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Amount</Label>
                                    <Input type="number" min="0" step="0.01" value={pAmount} onChange={e => setPAmount(e.target.value)} placeholder="0.00" className="glass-input h-11 font-bold" required />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Payment Date</Label>
                                    <Input type="date" value={pDate} onChange={e => setPDate(e.target.value)} className="glass-input h-11 font-bold" required />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Method</Label>
                                    <select value={pMethod} onChange={e => setPMethod(e.target.value)} className="glass-input h-11 font-bold w-full rounded-xl bg-white/5 border border-white/10 text-white px-3">
                                      {['manual', 'bank_transfer', 'mobile_money', 'cash', 'cheque'].map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reference</Label>
                                    <Input value={pRef} onChange={e => setPRef(e.target.value)} placeholder="TXN-001" className="glass-input h-11" />
                                  </div>
                                  <div className="space-y-1 md:col-span-2">
                                    <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Notes</Label>
                                    <Input value={pNotes} onChange={e => setPNotes(e.target.value)} placeholder="Optional…" className="glass-input h-11" />
                                  </div>
                                  <div className="md:col-span-3 flex justify-end gap-2 pt-1">
                                    <Button type="button" variant="ghost" onClick={() => setShowPayForm(null)} className="h-10 px-4 text-[9px] font-black uppercase text-slate-500">Cancel</Button>
                                    <Button type="submit" disabled={submitting} className="h-10 px-8 rounded-xl bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95">
                                      {submitting ? 'Saving…' : 'Save Payment'}
                                    </Button>
                                  </div>
                                </form>
                              </div>
                            )}

                            {/* Payment history */}
                            {subPays.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                    <ReceiptText className="w-3 h-3" /> Payment History
                                  </span>
                                  <span className="text-[10px] font-black text-emerald-400">
                                    Total Paid: {sub.currency} {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                  {subPays.map(pay => (
                                    <div key={pay.id} className="flex items-center justify-between px-4 py-2 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all">
                                      <div className="flex items-center gap-3">
                                        <DollarSign className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                        <span className="text-[11px] font-black text-white tabular-nums">{pay.currency} {Number(pay.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        <span className="text-[9px] font-black text-slate-500 uppercase">{pay.payment_method?.replace('_', ' ')}</span>
                                        {pay.reference && <span className="text-[9px] text-slate-600 italic">{pay.reference}</span>}
                                      </div>
                                      <span className="text-[9px] font-black text-slate-500">{format(parseISO(pay.payment_date), 'dd MMM yyyy')}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
