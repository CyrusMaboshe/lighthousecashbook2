/**
 * Tenant Reports - Multi-Tenant Reports (Rebuilt)
 *
 * Glassmorphism design that mirrors the super-admin Reports look,
 * but is fully scoped to the current tenant company. No data from
 * any other company can ever be loaded here — every query is
 * filtered by `company_id = currentCompany.id`.
 *
 * Features:
 *  - Period selector (Monthly / Yearly / All-Time)
 *  - Month + Year navigation for monthly view
 *  - Live financial summary (Cash In / Cash Out / Net / Tx count / Pictures)
 *  - Top categories breakdown with bar visualization
 *  - PDF export of the currently displayed period
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Camera,
  Activity,
  BarChart3,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';
import jsPDF from 'jspdf';

type Period = 'monthly' | 'yearly' | 'alltime';

interface Tx {
  id: string;
  type: 'cash-in' | 'cash-out' | string;
  amount: number;
  number_of_pictures?: number | null;
  category_name?: string | null;
  date: string;
  customer_name?: string | null;
  details?: string | null;
}

interface Stats {
  totalCashIn: number;
  totalCashOut: number;
  netBalance: number;
  totalTransactions: number;
  totalPictures: number;
  topCategories: { name: string; amount: number; count: number }[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function buildStats(transactions: Tx[]): Stats {
  const cashIn = transactions.filter(t => t.type === 'cash-in');
  const cashOut = transactions.filter(t => t.type === 'cash-out');
  const totalCashIn = cashIn.reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalCashOut = cashOut.reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalCashOutOperational = cashOut
    .filter(t => t.category_name !== 'Reserve Investment Withdrawal')
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalPictures = transactions.reduce((s, t) => s + Number(t.number_of_pictures || 0), 0);

  const map = new Map<string, { amount: number; count: number }>();
  transactions.forEach(t => {
    const name = (t.category_name || 'Uncategorized').trim();
    const existing = map.get(name) || { amount: 0, count: 0 };
    map.set(name, { amount: existing.amount + Number(t.amount || 0), count: existing.count + 1 });
  });
  const topCategories = Array.from(map.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  return {
    totalCashIn,
    totalCashOut,
    netBalance: totalCashIn - totalCashOutOperational,
    totalTransactions: transactions.length,
    totalPictures,
    topCategories,
  };
}

export function TenantReports() {
  const { currentCompany } = useMultiTenantAuth();
  const { toast } = useToast();

  const [period, setPeriod] = useState<Period>('monthly');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => now - i);
  }, []);

  // Load tenant transactions — strictly scoped to this company.
  const loadData = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mt_company_transactions')
        .select('id,type,amount,number_of_pictures,category_name,date,customer_name,details')
        .eq('company_id', currentCompany.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions((data || []) as Tx[]);
    } catch (e: any) {
      console.error('TenantReports: load failed', e);
      toast({ title: 'Failed to load reports', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [currentCompany?.id]);

  // Realtime updates so reports stay fresh after new transactions.
  useEffect(() => {
    if (!currentCompany?.id) return;
    const channel = supabase
      .channel(`tenant-reports-${currentCompany.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mt_company_transactions',
        filter: `company_id=eq.${currentCompany.id}`,
      }, () => loadData())
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [currentCompany?.id]);

  const filtered = useMemo(() => {
    if (period === 'alltime') return transactions;
    return transactions.filter(t => {
      if (!t.date) return false;
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return false;
      if (d.getFullYear() !== year) return false;
      if (period === 'monthly' && d.getMonth() + 1 !== month) return false;
      return true;
    });
  }, [transactions, period, month, year]);

  const stats = useMemo(() => buildStats(filtered), [filtered]);

  const periodLabel = useMemo(() => {
    if (period === 'alltime') return 'All Time';
    if (period === 'yearly') return `Year ${year}`;
    return `${MONTH_NAMES[month - 1]} ${year}`;
  }, [period, month, year]);

  const fmt = (n: number) => `ZMW ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const exportPDF = async () => {
    if (!currentCompany) return;
    setExporting(true);
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 50;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(currentCompany.display_name || 'Company', 40, y);
      y += 22;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Financial Report — ${periodLabel}`, 40, y);
      y += 16;
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Generated ${new Date().toLocaleString()}`, 40, y);
      doc.setTextColor(0);
      y += 24;

      doc.setDrawColor(220);
      doc.line(40, y, pageWidth - 40, y);
      y += 24;

      // Summary block
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('Summary', 40, y);
      y += 18;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const rows: [string, string][] = [
        ['Total Cash In', fmt(stats.totalCashIn)],
        ['Total Cash Out', fmt(stats.totalCashOut)],
        ['Net Balance', fmt(stats.netBalance)],
        ['Transactions', String(stats.totalTransactions)],
        ['Pictures', String(stats.totalPictures)],
      ];
      rows.forEach(([k, v]) => {
        doc.text(k, 50, y);
        doc.text(v, pageWidth - 50, y, { align: 'right' });
        y += 16;
      });
      y += 14;

      // Categories
      if (stats.topCategories.length) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('Top Categories', 40, y);
        y += 18;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        stats.topCategories.forEach((c, i) => {
          if (y > 760) { doc.addPage(); y = 50; }
          doc.text(`${i + 1}. ${c.name}`, 50, y);
          doc.text(`${fmt(c.amount)}  (${c.count})`, pageWidth - 50, y, { align: 'right' });
          y += 16;
        });
        y += 10;
      }

      // Transactions list (capped for PDF readability)
      if (filtered.length) {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(`Transactions (${filtered.length})`, 40, y);
        y += 18;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const sorted = [...filtered].sort((a, b) => (a.date < b.date ? 1 : -1));
        sorted.slice(0, 200).forEach(t => {
          if (y > 800) { doc.addPage(); y = 50; }
          const dateStr = new Date(t.date).toLocaleDateString();
          const sign = t.type === 'cash-in' ? '+' : '-';
          const line = `${dateStr}  ${sign}${fmt(Number(t.amount || 0))}  ${t.category_name || ''}`;
          doc.text(line.substring(0, 90), 50, y);
          y += 13;
        });
      }

      const safe = (currentCompany.display_name || 'company').replace(/[^a-z0-9]+/gi, '_');
      doc.save(`${safe}_report_${periodLabel.replace(/\s+/g, '_')}.pdf`);
      toast({ title: 'Report exported', description: `${periodLabel} PDF downloaded.` });
    } catch (e: any) {
      console.error('PDF export failed', e);
      toast({ title: 'Export failed', description: e.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">No company selected</p>
      </div>
    );
  }

  const cards = [
    { label: 'Total Cash In', value: fmt(stats.totalCashIn), icon: TrendingUp, accent: 'from-emerald-500/20 to-emerald-500/5', text: 'text-emerald-400', ring: 'border-emerald-500/30' },
    { label: 'Total Cash Out', value: fmt(stats.totalCashOut), icon: TrendingDown, accent: 'from-rose-500/20 to-rose-500/5', text: 'text-rose-400', ring: 'border-rose-500/30' },
    { label: 'Net Balance', value: fmt(stats.netBalance), icon: Wallet, accent: 'from-blue-500/20 to-blue-500/5', text: stats.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400', ring: 'border-blue-500/30' },
    { label: 'Transactions', value: String(stats.totalTransactions), icon: Activity, accent: 'from-indigo-500/20 to-indigo-500/5', text: 'text-indigo-300', ring: 'border-indigo-500/30' },
    { label: 'Pictures', value: String(stats.totalPictures), icon: Camera, accent: 'from-purple-500/20 to-purple-500/5', text: 'text-purple-300', ring: 'border-purple-500/30' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="rounded-3xl p-6 md:p-8 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">Reports</h1>
              <p className="text-sm text-muted-foreground">{currentCompany.display_name} · {periodLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={loadData} variant="outline" disabled={loading} className="rounded-xl">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={exportPDF} disabled={exporting || loading} className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90">
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting…' : 'Export PDF'}
            </Button>
          </div>
        </div>
      </div>

      {/* Period selector */}
      <div className="rounded-2xl p-4 bg-white/50 dark:bg-slate-900/30 backdrop-blur-xl border border-white/20 dark:border-white/10 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Period</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['monthly', 'yearly', 'alltime'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                period === p
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'bg-white/60 dark:bg-white/5 text-foreground hover:bg-white/80 dark:hover:bg-white/10 border border-white/30 dark:border-white/10'
              }`}
            >
              {p === 'monthly' ? 'Monthly' : p === 'yearly' ? 'Yearly' : 'All Time'}
            </button>
          ))}
        </div>
        {period !== 'alltime' && (
          <div className="flex items-center gap-2 md:ml-auto">
            {period === 'monthly' && (
              <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
                <SelectTrigger className="w-40 rounded-xl bg-white/70 dark:bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-32 rounded-xl bg-white/70 dark:bg-white/5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`rounded-2xl p-5 bg-gradient-to-br ${c.accent} backdrop-blur-xl border ${c.ring} dark:bg-slate-900/40 shadow-lg hover:shadow-xl transition-all`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</span>
                <Icon className={`w-5 h-5 ${c.text}`} />
              </div>
              <div className={`text-2xl font-bold tabular-nums ${c.text}`}>{c.value}</div>
            </div>
          );
        })}
      </div>

      {/* Top categories */}
      <div className="rounded-2xl p-6 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Top Categories</h3>
          <span className="text-xs text-muted-foreground">{periodLabel}</span>
        </div>
        {stats.topCategories.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No transactions in this period.</div>
        ) : (
          <div className="space-y-4">
            {stats.topCategories.map((c, i) => {
              const max = stats.topCategories[0].amount || 1;
              const pct = Math.max(2, (c.amount / max) * 100);
              return (
                <div key={c.name}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-400 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground">· {c.count} tx</span>
                    </div>
                    <span className="font-semibold tabular-nums">{fmt(c.amount)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/40 dark:bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
