import React, { useMemo, useRef, useState } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Download,
  FileText,
  BarChart3,
  Calendar,
  Users,
  TrendingUp,
  Database,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Zap,
  ShieldCheck,
  Activity,
  Layout,
  Search,
  PieChart,
  Settings,
  ArrowRightCircle,
  FileBox,
  Binary
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useTransactionFilters } from '@/hooks/useTransactionFilters';
import { exportToPDF } from '@/utils/pdfExport';
import { exportChartsToPDF } from '@/utils/chartExport';
import { exportAutomatedReportToPDF } from '@/utils/automatedReportExport';
import { logExportPDF } from '@/services/userLogService';
import { supabase } from '@/integrations/supabase/client';
import {
  exportCustomersListToPDF,
  exportTransactionHistoryToPDF,
  exportUserLogsToPDF,
  exportAdminLogsToPDF
} from '@/utils/adminPdfExports';
import { SuperAdminExportOptions } from './SuperAdminExportOptions';
import { cn } from '@/lib/utils';
import { isRefundCategory } from '@/utils/refundUtils';

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'transactions' | 'reports' | 'analytics' | 'system';
  adminOnly?: boolean;
  action: () => Promise<void> | void;
  isLoading?: boolean;
}

export function ExportCenter() {
  const { toast } = useToast();
  const { currentUser, isAdmin } = useAuth();
  const { isSuperAdmin } = useMultiTenantAuth();
  const { transactions } = useTransactions();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('transactions');

  const [allTimeExportYear, setAllTimeExportYear] = useState<string>('all');
  const [upToYear, setUpToYear] = useState<string>(new Date().getFullYear().toString());
  const [upToMonth, setUpToMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [upToDay, setUpToDay] = useState<string>(new Date().getDate().toString().padStart(2, '0'));

  const availableMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1).padStart(2, '0'),
      label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' })
    }));
  }, []);
  const availableDays = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  const getTransactionGroup = (transaction: any) => {
    const c = (transaction.category_name || '').toLowerCase();
    if (c.includes('saving') || c.includes('cash board') || c.includes('emergency fund') || (c.includes('fund') && !c.includes('investment'))) return 'Savings Group';
    if (c.includes('expense') || c.includes('food') || c.includes('airtime') || c.includes('water') || c.includes('electric') || c.includes('rent') || c.includes('transport')) return 'Expenses Group';
    if (c.includes('inflow') || c.includes('investment') || c.includes('client') || c.includes('project')) return 'Cash Inflow / Investments Group';
    return transaction.type === 'cash-in' ? 'Cash Inflow / Investments Group' : 'Expenses Group';
  };

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    (transactions || []).forEach(t => {
      const y = Number(String(t.date).slice(0, 4));
      if (Number.isFinite(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const normalizeCategoryGroup = (raw: string) => {
    const c = (raw || '').trim().toLowerCase();
    if (c.includes('studio investment fund') || c.includes('cash inflow') || c.includes('one-time cash flow') || (c.includes('cash flow') && !c.includes('soft')) || c.includes('video project received from')) return 'Studio Investment Fund / Cash Inflow / Cash Flow';
    if (c.includes('processed pictures') || c.includes('soft copy pictures') || c.includes('hard copy pictures')) return 'Pictures (Processed / Soft Copy / Hard Copy)';
    return raw || 'Uncategorized';
  };

  const monthKeyToLabel = (yyyyMm: string) => {
    const [y, m] = yyyyMm.split('-').map(Number);
    if (!y || !m) return yyyyMm;
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };

  const fetchAllTransactionsByTypeAndYear = async (type: 'cash-in' | 'cash-out', year: string) => {
    const pageSize = 1000; let from = 0; let rows: any[] = []; const maxPages = 200;
    const yearNum = year !== 'all' ? Number(year) : null;
    const startDate = yearNum ? `${yearNum}-01-01` : null;
    const endDate = yearNum ? `${yearNum}-12-31` : null;
    for (let page = 0; page < maxPages; page++) {
      let query = supabase.from('transactions').select('*').eq('type', type).order('date', { ascending: true }).order('time', { ascending: true }).range(from, from + pageSize - 1);
      if (startDate && endDate) query = query.gte('date', startDate).lte('date', endDate);
      const { data, error } = await query;
      if (error) throw error;
      const batch = data || []; rows = rows.concat(batch);
      if (batch.length < pageSize) break; from += pageSize;
    }
    return rows;
  };

  const fetchAllTransactionsUpToDate = async (type: 'cash-in' | 'cash-out', dateStr: string) => {
    const pageSize = 1000; let from = 0; let rows: any[] = []; const maxPages = 200;
    for (let page = 0; page < maxPages; page++) {
      const { data, error } = await supabase.from('transactions').select('*').eq('type', type).lte('date', dateStr).order('date', { ascending: true }).order('time', { ascending: true }).range(from, from + pageSize - 1);
      if (error) throw error;
      const batch = data || []; rows = rows.concat(batch);
      if (batch.length < pageSize) break; from += pageSize;
    }
    return rows;
  };

  const setLoading = (id: string, loading: boolean) => setLoadingStates(prev => ({ ...prev, [id]: loading }));

  const exportTransactionsPDF = async () => {
    setLoading('transactions-pdf', true);
    try {
      await exportTransactionHistoryToPDF();
      if (currentUser) logExportPDF(currentUser, { exportType: 'transactions_pdf', transactionCount: (transactions?.length || 0), timestamp: new Date().toISOString() });
      toast({ title: "Export Successful", description: "Transaction history exported to PDF" });
    } catch (error) { toast({ title: "Export Failed", description: "Failed to export PDF", variant: "destructive" }); } finally { setLoading('transactions-pdf', false); }
  };

  const exportTransactionsCSV = async () => {
    setLoading('transactions-csv', true);
    try {
      const csvContent = [['Date', 'Type', 'Category', 'Amount (ZMW)', 'Customer', 'Pictures', 'Details'].join(','), ...transactions.map(t => [t.date, t.type === 'cash-in' ? 'Cash In' : 'Cash Out', t.category_name, t.amount.toFixed(2), t.customer_name || '', t.number_of_pictures || 0, (t.details || '').replace(/,/g, ';')].join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      if (currentUser) logExportPDF(currentUser, { exportType: 'transactions_csv', transactionCount: transactions.length, timestamp: new Date().toISOString() });
      toast({ title: "Export Successful", description: "Transactions exported to CSV" });
    } catch (error) { toast({ title: "Export Failed", description: "Failed to export CSV", variant: "destructive" }); } finally { setLoading('transactions-csv', false); }
  };

  const exportAnalyticsReport = async () => {
    setLoading('analytics-report', true);
    try {
      const currentYear = new Date().getFullYear(); const currentMonth = new Date().getMonth() + 1;
      const startDate = new Date(currentYear, currentMonth - 1, 1); const endDate = new Date(currentYear, currentMonth, 0);
      const { data: monthlyTransactions, error } = await supabase.from('transactions').select('*').gte('date', startDate.toISOString().split('T')[0]).lte('date', endDate.toISOString().split('T')[0]);
      if (error) throw error;
      const totalCashIn = monthlyTransactions?.filter(t => t.type === 'cash-in').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalCashOut = monthlyTransactions?.filter(t => t.type === 'cash-out').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const operationalCashOut = monthlyTransactions?.filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const categoryTotals = monthlyTransactions?.reduce((acc, t) => { const c = t.category_name || 'Unknown'; if (!acc[c]) acc[c] = { name: c, amount: 0, count: 0 }; acc[c].amount += Number(t.amount); acc[c].count += 1; return acc; }, {} as Record<string, any>) || {};
      const topCategories = Object.values(categoryTotals).sort((a: any, b: any) => b.amount - a.amount).slice(0, 5);
      await exportAutomatedReportToPDF({ totalCashIn, totalCashOut, netBalance: totalCashIn - operationalCashOut, transactionCount: monthlyTransactions?.length || 0, topCategories: topCategories.map((c: any) => ({ name: c.name, amount: c.amount, count: c.count })) }, `${currentMonth}/${currentYear}`);
      if (currentUser) logExportPDF(currentUser, { exportType: 'analytics_report', period: `${currentMonth}/${currentYear}`, timestamp: new Date().toISOString() });
      toast({ title: "Export Successful", description: "Analytics report exported" });
    } catch (error) { toast({ title: "Export Failed", description: "Failed to export report", variant: "destructive" }); } finally { setLoading('analytics-report', false); }
  };

  const exportUserData = async () => {
    if (!isAdmin) return; setLoading('user-data', true);
    try {
      const { data: users, error } = await supabase.from('users').select('*'); if (error) throw error;
      const csvContent = [['ID', 'Username', 'Email', 'Role', 'Created At', 'Last Login'].join(','), ...users.map(u => [u.id, u.username, u.email || '', u.role, u.created_at, u.last_login || ''].join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast({ title: "Export Successful", description: `Exported ${users.length} users` });
    } catch (error) { toast({ title: "Export Failed", description: "Failed to export users", variant: "destructive" }); } finally { setLoading('user-data', false); }
  };

  const exportCategories = async () => {
    setLoading('categories', true);
    try {
      const { data: categories, error } = await supabase.from('categories').select('*'); if (error) throw error;
      const csvContent = [['ID', 'Name', 'Type', 'Created At'].join(','), ...categories.map(c => [c.id, c.name, c.type, c.created_at].join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `categories-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast({ title: "Export Successful", description: `Exported ${categories.length} categories` });
    } catch (error) { toast({ title: "Export Failed", description: "Failed to export categories", variant: "destructive" }); } finally { setLoading('categories', false); }
  };

  const exportSystemLogs = async () => {
    if (!isAdmin) return; setLoading('system-logs', true);
    try {
      const { data: logs, error } = await supabase.from('admin_logs').select('*').order('timestamp', { ascending: false }).limit(1000); if (error) throw error;
      const csvContent = [['ID', 'Action', 'Performed By', 'Timestamp', 'Details'].join(','), ...logs.map(l => [l.id, l.action, l.performed_by, l.timestamp, JSON.stringify(l.details || {}).replace(/,/g, ';')].join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `admin-logs-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast({ title: "Export Successful", description: `Exported ${logs.length} logs` });
    } catch (error) { toast({ title: "Export Failed", description: "Failed to export logs", variant: "destructive" }); } finally { setLoading('system-logs', false); }
  };

  // ---------- Shared PDF builder ----------
  const fmtZmw = (n: number) => `ZMW ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const esc = (s: any) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);

  const buildReportHTML = (opts: { title: string; subtitle: string; rangeLabel: string; color: string; trades: any[]; }) => {
    const { title, subtitle, rangeLabel, color, trades } = opts;
    const groups = trades.reduce((acc: any, t: any) => {
      const g = normalizeCategoryGroup(t.category_name);
      (acc[g] = acc[g] || []).push(t);
      return acc;
    }, {});
    const totalAmount = trades.reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalPictures = trades.reduce((s, t) => s + Number(t.number_of_pictures || 0), 0);
    const generatedAt = new Date().toLocaleString();

    const sections = Object.entries(groups).map(([g, list]: [string, any]) => {
      const arr = list as any[];
      const subTotal = arr.reduce((s, t) => s + Number(t.amount || 0), 0);
      const subPics = arr.reduce((s, t) => s + Number(t.number_of_pictures || 0), 0);
      const rows = arr.map((t: any) => `
        <tr>
          <td>${esc(t.date || '')}</td>
          <td>${esc(t.time || '-')}</td>
          <td>${esc(t.category_name || '-')}</td>
          <td>${esc(t.customer_name || '-')}</td>
          <td class="num">${fmtZmw(Number(t.amount || 0))}</td>
          <td class="num">${Number(t.number_of_pictures || 0)}</td>
          <td>${esc((t.details || '').toString().slice(0, 140))}</td>
        </tr>`).join('');
      return `
        <div class="section">
          <h3>${esc(g)} <span class="count">(${arr.length} entries)</span></h3>
          <table>
            <thead><tr>
              <th>Date</th><th>Time</th><th>Category</th><th>Customer</th>
              <th class="num">Amount</th><th class="num">Pics</th><th>Details</th>
            </tr></thead>
            <tbody>
              ${rows}
              <tr class="subtotal">
                <td colspan="4">Subtotal — ${esc(g)}</td>
                <td class="num">${fmtZmw(subTotal)}</td>
                <td class="num">${subPics}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>`;
    }).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
      <style>
        @page { margin: 16mm; }
        body { font-family: -apple-system, Arial, sans-serif; color: #111; padding: 8px; }
        .header { border-bottom: 4px solid ${color}; padding-bottom: 14px; margin-bottom: 18px; }
        .header h1 { color: ${color}; margin: 0 0 4px; font-size: 22px; }
        .header .meta { font-size: 11px; color: #555; }
        .section { margin-top: 18px; page-break-inside: auto; }
        .section h3 { background: #f3f4f6; padding: 8px 10px; margin: 0 0 6px; font-size: 13px; border-left: 4px solid ${color}; }
        .section h3 .count { color: #6b7280; font-weight: normal; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; vertical-align: top; }
        th { background: ${color}; color: #fff; font-weight: 600; }
        td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
        tr.subtotal td { background: #f9fafb; font-weight: 700; }
        .footer { margin-top: 24px; border: 2px solid ${color}; padding: 14px; background: #fafafa; }
        .footer h2 { color: ${color}; margin: 0 0 8px; font-size: 16px; }
        .grand { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .grand div { text-align: center; }
        .grand .lbl { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .grand .val { font-size: 18px; font-weight: 800; color: ${color}; margin-top: 2px; }
      </style></head><body>
      <div class="header">
        <h1>${esc(title)}</h1>
        <div class="meta">${esc(subtitle)} &middot; Range: <b>${esc(rangeLabel)}</b> &middot; Generated: ${esc(generatedAt)}</div>
      </div>
      ${sections || '<p>No transactions found.</p>'}
      <div class="footer">
        <h2>Report Summary</h2>
        <div class="grand">
          <div><div class="lbl">Total Transactions</div><div class="val">${trades.length}</div></div>
          <div><div class="lbl">Total Amount</div><div class="val">${fmtZmw(totalAmount)}</div></div>
          <div><div class="lbl">Total Pictures</div><div class="val">${totalPictures}</div></div>
        </div>
      </div>
      </body></html>`;
  };

  // ---------- Inflow Summary PDF builder ----------
  // Identical layout/CSS to buildReportHTML, but each section table shows
  // ONE aggregated row per category_name instead of individual transaction rows.
  // Subtotal per section and grand totals are preserved.
  const buildSummaryReportHTML = (opts: { title: string; subtitle: string; rangeLabel: string; color: string; trades: any[]; }) => {
    const { title, subtitle, rangeLabel, color, trades } = opts;

    // Same grouping logic as buildReportHTML
    const groups = trades.reduce((acc: any, t: any) => {
      const g = normalizeCategoryGroup(t.category_name);
      (acc[g] = acc[g] || []).push(t);
      return acc;
    }, {});

    // Refund-adjusted grand totals
    const totalAmount = trades.reduce((s, t) => {
      const amt = Number(t.amount || 0);
      return isRefundCategory(t.category_name) ? s - amt : s + amt;
    }, 0);
    const totalPictures = trades.reduce((s, t) => s + Number(t.number_of_pictures || 0), 0);
    const generatedAt = new Date().toLocaleString();

    const sections = Object.entries(groups).map(([g, list]: [string, any]) => {
      const arr = list as any[];

      // Aggregate per unique category_name within this group
      const catMap: Record<string, { total: number; count: number; pics: number }> = {};
      arr.forEach((t: any) => {
        const cat = t.category_name || 'Uncategorized';
        if (!catMap[cat]) catMap[cat] = { total: 0, count: 0, pics: 0 };
        const amt = Number(t.amount || 0);
        // Refund categories reduce the total instead of adding
        catMap[cat].total += isRefundCategory(t.category_name) ? -amt : amt;
        catMap[cat].count += 1;
        catMap[cat].pics += Number(t.number_of_pictures || 0);
      });

      // Sort categories: highest total first
      const catEntries = Object.entries(catMap).sort((a, b) => b[1].total - a[1].total);

      // Refund-adjusted subtotal for this group
      const subTotal = catEntries.reduce((s, [, v]) => s + v.total, 0);
      const subPics = catEntries.reduce((s, [, v]) => s + v.pics, 0);

      // One summary row per category_name (no individual transaction rows)
      const rows = catEntries.map(([cat, data]) => `
        <tr>
          <td>${esc(cat)}</td>
          <td class="num">${fmtZmw(data.total)}</td>
          <td class="num">${data.count}</td>
          <td class="num">${data.pics}</td>
        </tr>`).join('');

      return `
        <div class="section">
          <h3>${esc(g)} <span class="count">(${arr.length} transactions)</span></h3>
          <table>
            <thead><tr>
              <th>Category</th>
              <th class="num">Total Amount</th>
              <th class="num">Transactions</th>
              <th class="num">Pictures</th>
            </tr></thead>
            <tbody>
              ${rows}
              <tr class="subtotal">
                <td>Subtotal — ${esc(g)}</td>
                <td class="num">${fmtZmw(subTotal)}</td>
                <td class="num">${arr.length}</td>
                <td class="num">${subPics}</td>
              </tr>
            </tbody>
          </table>
        </div>`;
    }).join('');

    // Identical HTML shell, page style, header, and footer to buildReportHTML
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
      <style>
        @page { margin: 16mm; }
        body { font-family: -apple-system, Arial, sans-serif; color: #111; padding: 8px; }
        .header { border-bottom: 4px solid ${color}; padding-bottom: 14px; margin-bottom: 18px; }
        .header h1 { color: ${color}; margin: 0 0 4px; font-size: 22px; }
        .header .meta { font-size: 11px; color: #555; }
        .section { margin-top: 18px; page-break-inside: auto; }
        .section h3 { background: #f3f4f6; padding: 8px 10px; margin: 0 0 6px; font-size: 13px; border-left: 4px solid ${color}; }
        .section h3 .count { color: #6b7280; font-weight: normal; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; vertical-align: top; }
        th { background: ${color}; color: #fff; font-weight: 600; }
        td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
        tr.subtotal td { background: #f9fafb; font-weight: 700; }
        .footer { margin-top: 24px; border: 2px solid ${color}; padding: 14px; background: #fafafa; }
        .footer h2 { color: ${color}; margin: 0 0 8px; font-size: 16px; }
        .grand { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .grand div { text-align: center; }
        .grand .lbl { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .grand .val { font-size: 18px; font-weight: 800; color: ${color}; margin-top: 2px; }
      </style></head><body>
      <div class="header">
        <h1>${esc(title)}</h1>
        <div class="meta">${esc(subtitle)} &middot; Range: <b>${esc(rangeLabel)}</b> &middot; Generated: ${esc(generatedAt)}</div>
      </div>
      ${sections || '<p>No transactions found.</p>'}
      <div class="footer">
        <h2>Report Summary</h2>
        <div class="grand">
          <div><div class="lbl">Total Transactions</div><div class="val">${trades.length}</div></div>
          <div><div class="lbl">Net Inflow Total</div><div class="val">${fmtZmw(totalAmount)}</div></div>
          <div><div class="lbl">Total Pictures</div><div class="val">${totalPictures}</div></div>
        </div>
      </div>
      </body></html>`;
  };

  const buildAggregateSummaryHTML = (opts: { title: string; subtitle: string; rangeLabel: string; trades: any[]; }) => {
    const { title, subtitle, rangeLabel, trades } = opts;
    const generatedAt = new Date().toLocaleString();
    const color = '#059669';

    // Build category → refund-adjusted total map
    const categoryMap: Record<string, number> = {};
    trades.forEach((t: any) => {
      const cat = normalizeCategoryGroup(t.category_name);
      const amount = Number(t.amount || 0);
      // If this cash-in transaction is a refund, it reduces the category total
      const contribution = isRefundCategory(t.category_name) ? -amount : amount;
      categoryMap[cat] = (categoryMap[cat] || 0) + contribution;
    });

    // Sort categories by total descending
    const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

    // Grand total (refund-adjusted)
    const grandTotal = sortedCategories.reduce((sum, [, v]) => sum + v, 0);
    const hasRefunds = trades.some((t: any) => isRefundCategory(t.category_name));
    const refundTotal = trades
      .filter((t: any) => isRefundCategory(t.category_name))
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const grossTotal = trades
      .filter((t: any) => !isRefundCategory(t.category_name))
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

    const categoryRows = sortedCategories.map(([cat, total]) => {
      const isNegative = total < 0;
      return `
        <tr class="cat-row">
          <td class="cat-name">${esc(cat)}</td>
          <td class="cat-amount ${isNegative ? 'refund-val' : 'positive-val'}">${fmtZmw(total)}</td>
        </tr>`;
    }).join('');

    const refundNote = hasRefunds
      ? `<div class="refund-note">
           <span class="refund-icon">↩</span>
           Refund transactions (${fmtZmw(refundTotal)}) have been deducted from inflow totals.
         </div>`
      : '';

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
      <style>
        @page { margin: 20mm 16mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; }
        .page { max-width: 720px; margin: 0 auto; padding: 32px 24px; }
        /* Header */
        .header { border-bottom: 3px solid ${color}; padding-bottom: 20px; margin-bottom: 28px; }
        .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .brand-icon { width: 44px; height: 44px; background: linear-gradient(135deg, ${color}, #10b981); border-radius: 10px;
                      display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22px; font-weight: 900; }
        .brand-name { font-size: 18px; font-weight: 800; color: ${color}; letter-spacing: -0.5px; }
        .brand-tagline { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; }
        .report-title { font-size: 26px; font-weight: 900; color: #111; letter-spacing: -1px; margin-bottom: 6px; }
        .report-meta { font-size: 11px; color: #6b7280; display: flex; gap: 20px; flex-wrap: wrap; }
        .report-meta span { display: flex; align-items: center; gap: 4px; }
        .report-meta .highlight { color: ${color}; font-weight: 700; }
        /* Summary hero */
        .hero { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #bbf7d0;
                border-radius: 16px; padding: 24px; margin-bottom: 28px; text-align: center; }
        .hero-label { font-size: 11px; color: #059669; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; margin-bottom: 8px; }
        .hero-amount { font-size: 42px; font-weight: 900; color: #065f46; letter-spacing: -2px; line-height: 1; }
        .hero-sub { font-size: 12px; color: #6b7280; margin-top: 6px; }
        /* Category table */
        .section-title { font-size: 13px; font-weight: 800; color: #374151; text-transform: uppercase;
                          letter-spacing: 0.08em; margin-bottom: 12px; padding-bottom: 6px;
                          border-bottom: 2px solid #e5e7eb; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .cat-row { border-bottom: 1px solid #f3f4f6; }
        .cat-row:last-child { border-bottom: none; }
        .cat-row:hover { background: #f9fafb; }
        .cat-name { padding: 12px 16px 12px 0; font-size: 13px; color: #374151; font-weight: 500; }
        .cat-amount { padding: 12px 0 12px 16px; font-size: 14px; font-weight: 700;
                       text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .positive-val { color: #065f46; }
        .refund-val { color: #dc2626; }
        /* Divider row before total */
        .divider-row td { border-top: 2px solid ${color}; padding-top: 4px; }
        .total-row { background: ${color} !important; }
        .total-row td { padding: 14px 0 14px 0; color: #fff !important; font-weight: 900; font-size: 15px; }
        .total-row .cat-name { padding-left: 16px; }
        .total-row .cat-amount { padding-right: 16px; }
        /* Breakdown pills */
        .breakdown { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .pill { flex: 1; min-width: 140px; background: #f9fafb; border: 1px solid #e5e7eb;
                border-radius: 10px; padding: 12px 16px; text-align: center; }
        .pill-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
        .pill-value { font-size: 16px; font-weight: 800; color: #111; font-variant-numeric: tabular-nums; }
        .pill-value.green { color: ${color}; }
        .pill-value.red { color: #dc2626; }
        /* Refund note */
        .refund-note { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px;
                        padding: 10px 14px; font-size: 11px; color: #92400e; margin-bottom: 20px; }
        .refund-icon { margin-right: 6px; }
        /* Footer */
        .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 8px;
                   display: flex; justify-content: space-between; align-items: center;
                   font-size: 10px; color: #9ca3af; }
        .footer-brand { font-weight: 700; color: ${color}; }
      </style></head><body>
      <div class="page">
        <div class="header">
          <div class="brand">
            <div class="brand-icon">L</div>
            <div>
              <div class="brand-name">Lighthouse Media</div>
              <div class="brand-tagline">Cash Flow Management System</div>
            </div>
          </div>
          <div class="report-title">${esc(title)}</div>
          <div class="report-meta">
            <span>${esc(subtitle)}</span>
            <span>&#128197; Range: <span class="highlight">${esc(rangeLabel)}</span></span>
            <span>&#128336; Generated: <span class="highlight">${esc(generatedAt)}</span></span>
          </div>
        </div>

        <div class="hero">
          <div class="hero-label">Net Aggregate Inflow</div>
          <div class="hero-amount">${fmtZmw(grandTotal)}</div>
          <div class="hero-sub">${sortedCategories.length} categories &middot; ${trades.length} total transactions</div>
        </div>

        ${hasRefunds ? `
        <div class="breakdown">
          <div class="pill">
            <div class="pill-label">Gross Inflow</div>
            <div class="pill-value green">${fmtZmw(grossTotal)}</div>
          </div>
          <div class="pill">
            <div class="pill-label">Total Refunds</div>
            <div class="pill-value red">−${fmtZmw(refundTotal)}</div>
          </div>
          <div class="pill">
            <div class="pill-label">Net Inflow</div>
            <div class="pill-value green">${fmtZmw(grandTotal)}</div>
          </div>
        </div>` : ''}

        ${refundNote}

        <div class="section-title">Category Breakdown</div>
        <table>
          <tbody>
            ${categoryRows}
            <tr class="divider-row"><td colspan="2"></td></tr>
            <tr class="total-row">
              <td class="cat-name">&#9654; Aggregate Inflow Total</td>
              <td class="cat-amount">${fmtZmw(grandTotal)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <span class="footer-brand">Lighthouse Media &mdash; Cash Flow Management</span>
          <span>Confidential Financial Report &bull; ${esc(rangeLabel)}</span>
        </div>
      </div>
      </body></html>`;
  };

  const openPrint = (html: string) => {
    const w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
      setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 400);
    }
  };

  const exportAllTimeCashIn = async () => {
    setLoading('all-time-cash-in', true);
    try {
      const trades = await fetchAllTransactionsByTypeAndYear('cash-in', allTimeExportYear);
      if (!trades || trades.length === 0) { toast({ title: 'No Data', description: 'No cash-in transactions found.', variant: 'destructive' }); return; }
      // Uses summary builder: same structure as full report but shows category totals only
      openPrint(buildSummaryReportHTML({
        title: 'Aggregate Inflow Report', subtitle: 'Cash In — Category Summary',
        rangeLabel: allTimeExportYear === 'all' ? 'Complete History' : `Year ${allTimeExportYear}`,
        color: '#059669', trades,
      }));
      toast({ title: 'Export Successful', description: `${trades.length} transactions aggregated into category totals` });
    } catch (e) { console.error(e); toast({ title: 'Export Failed', variant: 'destructive' }); } finally { setLoading('all-time-cash-in', false); }
  };

  const exportAllTimeCashOut = async () => {
    setLoading('all-time-cash-out', true);
    try {
      const allTrades = await fetchAllTransactionsByTypeAndYear('cash-out', allTimeExportYear);
      const trades = allTrades;
      if (!trades || trades.length === 0) { toast({ title: 'No Data', description: 'No cash-out transactions found.', variant: 'destructive' }); return; }
      openPrint(buildReportHTML({
        title: 'Aggregate Outflow Report', subtitle: 'Cash Out — All Time History',
        rangeLabel: allTimeExportYear === 'all' ? 'Complete History' : `Year ${allTimeExportYear}`,
        color: '#dc2626', trades,
      }));
      toast({ title: 'Export Successful', description: `Exported ${trades.length} records` });
    } catch (e) { console.error(e); toast({ title: 'Export Failed', variant: 'destructive' }); } finally { setLoading('all-time-cash-out', false); }
  };

  const exportTotalCashIn = async () => {
    setLoading('total-cash-in-export', true);
    try {
      const dateStr = `${upToYear}-${upToMonth}-${upToDay}`;
      const trades = await fetchAllTransactionsUpToDate('cash-in', dateStr);
      if (!trades || trades.length === 0) { toast({ title: 'No Data', variant: 'destructive' }); return; }
      // Uses summary builder: same structure but category totals only (no individual rows)
      openPrint(buildSummaryReportHTML({
        title: 'Cumulative Inflow PDF', subtitle: 'Cash In — Category Summary Up to Date',
        rangeLabel: `Through ${dateStr}`, color: '#059669', trades,
      }));
      toast({ title: 'Exported', description: `${trades.length} transactions aggregated` });
    } catch (e) { console.error(e); toast({ title: 'Failed', variant: 'destructive' }); } finally { setLoading('total-cash-in-export', false); }
  };

  const exportTotalCashOut = async () => {
    setLoading('total-cash-out-export', true);
    try {
      const dateStr = `${upToYear}-${upToMonth}-${upToDay}`;
      const allTrades = await fetchAllTransactionsUpToDate('cash-out', dateStr);
      const trades = allTrades;
      if (!trades || trades.length === 0) { toast({ title: 'No Data', variant: 'destructive' }); return; }
      openPrint(buildReportHTML({
        title: 'Cumulative Outflow PDF', subtitle: 'Cash Out — Up to Date',
        rangeLabel: `Through ${dateStr}`, color: '#dc2626', trades,
      }));
      toast({ title: 'Exported', description: `${trades.length} records` });
    } catch (e) { console.error(e); toast({ title: 'Failed', variant: 'destructive' }); } finally { setLoading('total-cash-out-export', false); }
  };

  // ---------- NEW: Aggregate Inflow SUMMARY (category totals only, no rows) ----------
  const exportAggregateSummary = async () => {
    setLoading('aggregate-inflow-summary', true);
    try {
      const trades = await fetchAllTransactionsByTypeAndYear('cash-in', allTimeExportYear);
      if (!trades || trades.length === 0) { toast({ title: 'No Data', description: 'No cash-in transactions found.', variant: 'destructive' }); return; }
      openPrint(buildAggregateSummaryHTML({
        title: 'Aggregate Inflow Summary',
        subtitle: 'Cash In — Category Totals',
        rangeLabel: allTimeExportYear === 'all' ? 'Complete History' : `Year ${allTimeExportYear}`,
        trades,
      }));
      toast({ title: 'Summary Exported', description: `${trades.length} transactions aggregated into category totals` });
    } catch (e) { console.error(e); toast({ title: 'Export Failed', variant: 'destructive' }); } finally { setLoading('aggregate-inflow-summary', false); }
  };

  const exportCumulativeSummary = async () => {
    setLoading('cumulative-inflow-summary', true);
    try {
      const dateStr = `${upToYear}-${upToMonth}-${upToDay}`;
      const trades = await fetchAllTransactionsUpToDate('cash-in', dateStr);
      if (!trades || trades.length === 0) { toast({ title: 'No Data', variant: 'destructive' }); return; }
      openPrint(buildAggregateSummaryHTML({
        title: 'Cumulative Inflow Summary',
        subtitle: 'Cash In — Category Totals Up to Date',
        rangeLabel: `Through ${dateStr}`,
        trades,
      }));
      toast({ title: 'Summary Exported', description: `${trades.length} transactions aggregated` });
    } catch (e) { console.error(e); toast({ title: 'Export Failed', variant: 'destructive' }); } finally { setLoading('cumulative-inflow-summary', false); }
  };

  const exportOptions: ExportOption[] = [
    { id: 'transactions-pdf', title: 'Global Ledger PDF', description: 'Comprehensive formatting of filtered transactions.', icon: FileBox, category: 'transactions', action: exportTransactionsPDF, isLoading: loadingStates['transactions-pdf'] },
    { id: 'transactions-csv', title: 'Global Ledger CSV', description: 'Universal spreadsheet format for external analysis.', icon: Binary, category: 'transactions', action: exportTransactionsCSV, isLoading: loadingStates['transactions-csv'] },
    { id: 'all-time-cash-in', title: 'Aggregate Inflow Report', description: 'Category-level totals per group section. No individual transaction rows.', icon: TrendingUp, category: 'transactions', action: exportAllTimeCashIn, isLoading: loadingStates['all-time-cash-in'] },
    { id: 'aggregate-inflow-summary', title: 'Aggregate Inflow Summary', description: 'Clean one-page category totals. Refund-adjusted net figures.', icon: PieChart, category: 'transactions', action: exportAggregateSummary, isLoading: loadingStates['aggregate-inflow-summary'] },
    { id: 'all-time-cash-out', title: 'Aggregate Outflow Report', description: 'Historical outflow analysis across all temporal sectors.', icon: Download, category: 'transactions', action: exportAllTimeCashOut, isLoading: loadingStates['all-time-cash-out'] },
    { id: 'total-cash-in-export', title: 'Cumulative Inflow PDF', description: 'Category-level totals up to selected date. No individual transaction rows.', icon: TrendingUp, category: 'transactions', action: exportTotalCashIn, isLoading: loadingStates['total-cash-in-export'] },
    { id: 'cumulative-inflow-summary', title: 'Cumulative Inflow Summary', description: 'Clean one-page category totals up to selected date. Refund-adjusted.', icon: PieChart, category: 'transactions', action: exportCumulativeSummary, isLoading: loadingStates['cumulative-inflow-summary'] },
    { id: 'total-cash-out-export', title: 'Cumulative Outflow PDF', description: 'Ordered group reports up to a synchronized timestamp.', icon: Download, category: 'transactions', action: exportTotalCashOut, isLoading: loadingStates['total-cash-out-export'] },
    { id: 'analytics-report', title: 'Neural Analysis PDF', description: 'Current month performance metrics and top categories.', icon: BarChart3, category: 'analytics', action: exportAnalyticsReport, isLoading: loadingStates['analytics-report'] },
    { id: 'categories', title: 'Category Mapping CSV', description: 'Structural export of all transaction classifications.', icon: Database, category: 'reports', action: exportCategories, isLoading: loadingStates['categories'] },
    { id: 'user-data', title: 'Verified Agents CSV', description: 'Comprehensive administrative roster and access statistics.', icon: Users, category: 'system', adminOnly: true, action: exportUserData, isLoading: loadingStates['user-data'] },
    { id: 'system-logs', title: 'Administrative Buffer CSV', description: 'Tier-1 system activity and audit logs.', icon: FileText, category: 'system', adminOnly: true, action: exportSystemLogs, isLoading: loadingStates['system-logs'] },
    { id: 'customers-list-pdf', title: 'Client Registry PDF', description: 'Export verified customer directory with contact metadata.', icon: Users, category: 'system', adminOnly: true, action: async () => { setLoading('customers-list-pdf', true); try { await exportCustomersListToPDF(); toast({ title: "Exported" }); } finally { setLoading('customers-list-pdf', false); } }, isLoading: loadingStates['customers-list-pdf'] }
  ];

  const categories = [
    { id: 'transactions', label: 'Ledgers', icon: Database },
    { id: 'analytics', label: 'Intelligence', icon: BarChart3 },
    { id: 'reports', label: 'Structures', icon: TrendingUp },
    ...(isAdmin ? [{ id: 'system', label: 'Protocol', icon: Settings }] : [])
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="glass-card overflow-hidden p-8 md:p-12 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-indigo-500 to-blue-600 p-4 border border-white/20 shadow-2xl shadow-indigo-500/40">
                <Database className="w-full h-full text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">Export Nexus</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-2 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  Global Unified Archive Interface
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card bg-blue-500/[0.03] border-blue-500/20 px-6 py-4 flex flex-col items-end min-w-[200px] shadow-2xl">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Protocols</span>
            <span className="text-2xl font-black text-white tabular-nums tracking-tighter">{exportOptions.filter(o => !o.adminOnly || isAdmin).length} FUNCTIONS</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Navigation Matrix */}
        <div className="xl:col-span-1 space-y-3">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Data Sectors</span>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-[20px] border transition-all duration-500 group",
                activeTab === cat.id
                  ? "bg-white/[0.05] border-white/20 text-white shadow-xl translate-x-2"
                  : "bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
              )}
            >
              <div className="flex items-center gap-3">
                <cat.icon className={cn("w-4 h-4 transition-colors", activeTab === cat.id ? "text-blue-400" : "text-slate-600 group-hover:text-slate-400")} />
                <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
              </div>
              {activeTab === cat.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />}
            </button>
          ))}

          <div className="mt-8 glass-card p-6 bg-blue-500/[0.02] border-blue-500/10 hidden xl:block">
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider leading-relaxed">
              The <span className="text-white">Export Nexus</span> provides a direct uplink to the immutable ledger. All withdrawals are logged with SHA-256 integrity verification.
            </p>
          </div>
        </div>

        {/* Content Buffer */}
        <div className="xl:col-span-3 space-y-8 min-h-[600px]">
          {activeTab === 'transactions' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-6 bg-white/[0.01] border-white/5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Temporal Filter: Year</span>
                  </div>
                  <Select value={allTimeExportYear} onValueChange={setAllTimeExportYear}>
                    <SelectTrigger className="glass-input h-12 text-[11px] font-black uppercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-select-content">
                      <SelectItem value="all">Complete History</SelectItem>
                      {availableYears.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="glass-card p-6 bg-white/[0.01] border-white/5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Cumulative Up-to Date</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={upToYear} onValueChange={setUpToYear}>
                      <SelectTrigger className="glass-input h-12 text-[10px] font-black"><SelectValue /></SelectTrigger>
                      <SelectContent className="glass-select-content">{availableYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={upToMonth} onValueChange={setUpToMonth}>
                      <SelectTrigger className="glass-input h-12 text-[10px] font-black"><SelectValue /></SelectTrigger>
                      <SelectContent className="glass-select-content">{availableMonths.map(m => <SelectItem key={m.value} value={m.value}>{m.label.slice(0, 3)}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={upToDay} onValueChange={setUpToDay}>
                      <SelectTrigger className="glass-input h-12 text-[10px] font-black"><SelectValue /></SelectTrigger>
                      <SelectContent className="glass-select-content">{availableDays.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {exportOptions.filter(o => o.category === 'transactions').map((option) => (
                  <ExportFunctionCard key={option.id} option={option} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-500">
              {exportOptions.filter(o => o.category === 'analytics').map((option) => (
                <ExportFunctionCard key={option.id} option={option} />
              ))}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-500">
              {exportOptions.filter(o => o.category === 'reports').map((option) => (
                <ExportFunctionCard key={option.id} option={option} />
              ))}
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {exportOptions.filter(o => o.category === 'system' && (!o.adminOnly || isAdmin)).map((option) => (
                  <ExportFunctionCard key={option.id} option={option} />
                ))}
              </div>
              {isSuperAdmin() && (
                <div className="mt-8 border-t border-white/5 pt-8">
                  <SuperAdminExportOptions isSuperAdmin={true} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExportFunctionCard({ option }: { option: ExportOption }) {
  const Icon = option.icon;
  return (
    <div className="glass-card p-6 group relative overflow-hidden transition-all duration-500 hover:scale-[1.02] border-white/10 hover:border-white/20 bg-white/[0.01]">
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-[60px] -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-all" />
      <div className="flex gap-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-lg">
          <Icon className="w-5 h-5 text-blue-400 group-hover:text-white" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-[13px] font-black text-white uppercase tracking-tight leading-none italic">{option.title}</h4>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed line-clamp-2">{option.description}</p>
          <div className="pt-4">
            <Button
              onClick={option.action}
              disabled={option.isLoading}
              className="w-full h-10 rounded-xl glass-btn-primary bg-blue-600/10 text-blue-400 border-blue-500/20 text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-blue-600 hover:text-white"
            >
              {option.isLoading ? <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-2" />}
              {option.isLoading ? 'Processing' : 'Initiate Export'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
