/**
 * PayrollManagement.tsx
 * Super Admin – manage employee payroll entries per company tenant.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Users, Plus, RefreshCw, Building2, CheckCircle, Clock,
  XCircle, Pencil, Trash2, ChevronDown, ChevronUp,
  Banknote, CalendarDays, UserCircle2, Briefcase
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Company { id: string; display_name: string; name: string; }

interface Payroll {
  id: string;
  company_id: string;
  employee_name: string;
  position: string | null;
  salary: number;
  currency: string;
  pay_period: string;
  period_label: string | null;
  payment_date: string;
  status: 'pending' | 'paid' | 'cancelled';
  notes: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  paid: <CheckCircle className="w-3.5 h-3.5" />,
  pending: <Clock className="w-3.5 h-3.5" />,
  cancelled: <XCircle className="w-3.5 h-3.5" />,
};

// ─── Component ────────────────────────────────────────────────────────────────
export function PayrollManagement() {
  const { toast } = useToast();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<string | null>(null); // companyId
  const [editingEntry, setEditingEntry] = useState<Payroll | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form fields
  const [fName, setFName] = useState('');
  const [fPosition, setFPosition] = useState('');
  const [fSalary, setFSalary] = useState('');
  const [fCurrency, setFCurrency] = useState('ZMW');
  const [fPayPeriod, setFPayPeriod] = useState('monthly');
  const [fPeriodLabel, setFPeriodLabel] = useState('');
  const [fPayDate, setFPayDate] = useState('');
  const [fStatus, setFStatus] = useState('pending');
  const [fNotes, setFNotes] = useState('');

  // ─── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: cData }, { data: pData }] = await Promise.all([
        supabase.from('mt_companies').select('id, display_name, name').order('display_name'),
        supabase.from('mt_company_payroll').select('*').order('payment_date', { ascending: false }),
      ]);
      setCompanies(cData || []);
      setPayrollEntries(pData || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel('payroll_mgmt_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mt_company_payroll' }, load)
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [load]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const getCompanyPayroll = (companyId: string) => {
    let entries = payrollEntries.filter(p => p.company_id === companyId);
    if (filterStatus !== 'all') entries = entries.filter(p => p.status === filterStatus);
    return entries;
  };

  const openForm = (companyId: string, entry?: Payroll) => {
    setShowForm(companyId);
    setEditingEntry(entry || null);
    if (entry) {
      setFName(entry.employee_name);
      setFPosition(entry.position || '');
      setFSalary(String(entry.salary));
      setFCurrency(entry.currency);
      setFPayPeriod(entry.pay_period);
      setFPeriodLabel(entry.period_label || '');
      setFPayDate(entry.payment_date.slice(0, 10));
      setFStatus(entry.status);
      setFNotes(entry.notes || '');
    } else {
      const now = new Date();
      setFName(''); setFPosition(''); setFSalary(''); setFCurrency('ZMW');
      setFPayPeriod('monthly');
      setFPeriodLabel(now.toLocaleString('default', { month: 'long', year: 'numeric' }));
      setFPayDate(now.toISOString().slice(0, 10));
      setFStatus('pending'); setFNotes('');
    }
  };

  const closeForm = () => { setShowForm(null); setEditingEntry(null); };

  // ─── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim() || !fSalary || !showForm) return;
    setSubmitting(true);
    try {
      const payload = {
        company_id: showForm,
        employee_name: fName.trim(),
        position: fPosition.trim() || null,
        salary: parseFloat(fSalary),
        currency: fCurrency,
        pay_period: fPayPeriod,
        period_label: fPeriodLabel.trim() || null,
        payment_date: fPayDate,
        status: fStatus,
        notes: fNotes.trim() || null,
      };
      let error: any;
      if (editingEntry) {
        ({ error } = await supabase.from('mt_company_payroll').update(payload).eq('id', editingEntry.id));
      } else {
        ({ error } = await supabase.from('mt_company_payroll').insert(payload));
      }
      if (error) throw error;
      toast({ title: editingEntry ? 'Payroll Updated' : 'Payroll Entry Created', description: fName });
      closeForm();
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to save', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (entry: Payroll) => {
    if (!window.confirm(`Delete payroll entry for "${entry.employee_name}"?`)) return;
    await supabase.from('mt_company_payroll').delete().eq('id', entry.id);
    toast({ title: 'Entry Deleted' });
    load();
  };

  // ─── Quick Status ──────────────────────────────────────────────────────────
  const quickStatus = async (entry: Payroll, newStatus: Payroll['status']) => {
    await supabase.from('mt_company_payroll').update({ status: newStatus }).eq('id', entry.id);
    load();
    toast({ title: `Marked as ${newStatus}`, description: entry.employee_name });
  };

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const totalPayroll = payrollEntries.filter(p => p.status !== 'cancelled').reduce((a, p) => a + Number(p.salary), 0);
  const pendingCount = payrollEntries.filter(p => p.status === 'pending').length;
  const paidCount = payrollEntries.filter(p => p.status === 'paid').length;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* ── Header ── */}
      <div className="glass-card p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40 border border-white/20">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Payroll Control</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mt-1">Employee Salary & Period Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button onClick={load} variant="ghost" className="h-11 px-6 rounded-xl border border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/5">
              <RefreshCw className="w-4 h-4 mr-2" /> Sync
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Companies', value: companies.length, color: 'indigo', suffix: '' },
          { label: 'Pending Pay', value: pendingCount, color: 'amber', suffix: '' },
          { label: 'Paid', value: paidCount, color: 'emerald', suffix: '' },
          { label: 'Gross Payroll', value: totalPayroll, color: 'teal', suffix: 'ZMW ', decimals: 2 },
        ].map(({ label, value, color, suffix, decimals }) => (
          <div key={label} className={cn(
            'glass-card p-5 border-white/5 hover:scale-[1.03] transition-all duration-300 group',
            color === 'indigo' && 'bg-indigo-500/[0.03] border-indigo-500/10',
            color === 'amber' && 'bg-amber-500/[0.03] border-amber-500/10',
            color === 'emerald' && 'bg-emerald-500/[0.03] border-emerald-500/10',
            color === 'teal' && 'bg-teal-500/[0.03] border-teal-500/10',
          )}>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">{label}</span>
            <div className={cn('text-2xl font-black tracking-tighter tabular-nums',
              color === 'emerald' ? 'text-emerald-400' : color === 'teal' ? 'text-teal-400' : color === 'amber' ? 'text-amber-400' : 'text-white',
            )}>
              {suffix}{decimals ? value.toLocaleString(undefined, { minimumFractionDigits: decimals }) : value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Company List ── */}
      {loading ? (
        <div className="glass-card p-16 text-center">
          <RefreshCw className="w-8 h-8 text-slate-600 animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Loading Payroll Data…</p>
        </div>
      ) : (
        <div className="space-y-4">
          {companies.map(company => {
            const entries = getCompanyPayroll(company.id);
            const rawEntries = payrollEntries.filter(p => p.company_id === company.id);
            const totalSalary = rawEntries.filter(p => p.status !== 'cancelled').reduce((a, p) => a + Number(p.salary), 0);
            const isExpanded = expanded === company.id;

            return (
              <div key={company.id} className="glass-card border-white/5 overflow-hidden">
                {/* Company Row */}
                <div
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 cursor-pointer hover:bg-white/[0.02] transition-all"
                  onClick={() => setExpanded(isExpanded ? null : company.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[16px] bg-white/5 border border-white/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">{company.display_name}</h3>
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{rawEntries.length} payroll entries</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {totalSalary > 0 && (
                      <span className="text-[11px] font-black text-emerald-400 tabular-nums">
                        ZMW {totalSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })} gross
                      </span>
                    )}
                    <Button
                      size="sm"
                      onClick={ev => { ev.stopPropagation(); openForm(company.id); setExpanded(company.id); }}
                      className="h-9 px-4 rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Entry
                    </Button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-white/[0.01] p-6 space-y-4 animate-in slide-in-from-top-2 duration-300">

                    {/* Form */}
                    {showForm === company.id && (
                      <div className="glass-card p-6 border-emerald-500/20 bg-emerald-500/[0.02] animate-in slide-in-from-top-3 duration-300">
                        <div className="flex items-center gap-3 mb-5">
                          <UserCircle2 className="w-5 h-5 text-emerald-400" />
                          <h4 className="text-base font-black text-white uppercase tracking-tight">
                            {editingEntry ? 'Edit Payroll Entry' : 'New Payroll Entry'}
                          </h4>
                        </div>
                        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Employee Name</Label>
                            <Input value={fName} onChange={e => setFName(e.target.value)} placeholder="Full Name" className="glass-input h-11 font-bold" required />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Position / Role</Label>
                            <Input value={fPosition} onChange={e => setFPosition(e.target.value)} placeholder="e.g. Accountant" className="glass-input h-11 font-bold" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Salary</Label>
                            <Input type="number" min="0" step="0.01" value={fSalary} onChange={e => setFSalary(e.target.value)} placeholder="0.00" className="glass-input h-11 font-bold" required />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Currency</Label>
                            <Input value={fCurrency} onChange={e => setFCurrency(e.target.value)} placeholder="ZMW" className="glass-input h-11 font-bold" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pay Period</Label>
                            <select value={fPayPeriod} onChange={e => setFPayPeriod(e.target.value)} className="glass-input h-11 font-bold w-full rounded-xl bg-white/5 border border-white/10 text-white px-3">
                              {['weekly', 'bi-weekly', 'monthly', 'custom'].map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Period Label (e.g. May 2026)</Label>
                            <Input value={fPeriodLabel} onChange={e => setFPeriodLabel(e.target.value)} placeholder="May 2026" className="glass-input h-11 font-bold" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Payment Date</Label>
                            <Input type="date" value={fPayDate} onChange={e => setFPayDate(e.target.value)} className="glass-input h-11 font-bold" required />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</Label>
                            <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="glass-input h-11 font-bold w-full rounded-xl bg-white/5 border border-white/10 text-white px-3">
                              {['pending', 'paid', 'cancelled'].map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Notes</Label>
                            <Input value={fNotes} onChange={e => setFNotes(e.target.value)} placeholder="Optional notes…" className="glass-input h-11" />
                          </div>
                          <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={closeForm} className="h-11 px-6 rounded-xl text-slate-500 text-[9px] font-black uppercase">Cancel</Button>
                            <Button type="submit" disabled={submitting} className="h-11 px-10 rounded-xl bg-emerald-600 text-white text-[9px] font-black uppercase shadow-xl shadow-emerald-500/20 active:scale-95">
                              {submitting ? 'Saving…' : editingEntry ? 'Update Entry' : 'Create Entry'}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Entries table */}
                    {entries.length === 0 ? (
                      <div className="text-center py-8 opacity-40">
                        <Banknote className="w-10 h-10 text-slate-700 mx-auto mb-3 stroke-[0.5]" />
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                          {filterStatus !== 'all' ? `No ${filterStatus} entries` : 'No payroll entries yet'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Column headers */}
                        <div className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-2 px-4 pb-1">
                          {['Employee', 'Period', 'Salary', 'Date', 'Status', 'Actions'].map(h => (
                            <span key={h} className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{h}</span>
                          ))}
                        </div>
                        {entries.map(entry => (
                          <div key={entry.id} className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-2 items-center px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group">
                            {/* Employee */}
                            <div className="flex items-center gap-2 min-w-0">
                              <UserCircle2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[12px] font-black text-white truncate">{entry.employee_name}</p>
                                {entry.position && <p className="text-[9px] text-slate-600 uppercase tracking-widest truncate">{entry.position}</p>}
                              </div>
                            </div>
                            {/* Period */}
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                              <span className="text-[10px] font-black text-slate-400">{entry.period_label || entry.pay_period}</span>
                            </div>
                            {/* Salary */}
                            <span className="text-[12px] font-black text-white tabular-nums whitespace-nowrap">
                              {entry.currency} {Number(entry.salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            {/* Date */}
                            <span className="text-[9px] font-black text-slate-500 whitespace-nowrap">
                              {format(parseISO(entry.payment_date), 'dd MMM yyyy')}
                            </span>
                            {/* Status */}
                            <Badge className={cn('text-[8px] font-black uppercase tracking-wider border px-1.5 py-0.5 flex items-center gap-1 whitespace-nowrap', STATUS_COLORS[entry.status])}>
                              {STATUS_ICONS[entry.status]} {entry.status}
                            </Badge>
                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {entry.status === 'pending' && (
                                <Button size="sm" onClick={() => quickStatus(entry, 'paid')} className="h-7 px-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                              )}
                              <Button size="sm" onClick={() => { openForm(company.id, entry); setExpanded(company.id); }} className="h-7 px-2 rounded-lg bg-white/5 text-slate-400 text-[8px] uppercase hover:bg-white/10 transition-all">
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button size="sm" onClick={() => handleDelete(entry)} className="h-7 px-2 rounded-lg bg-rose-500/10 text-rose-400 text-[8px] uppercase hover:bg-rose-600 hover:text-white transition-all">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
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
