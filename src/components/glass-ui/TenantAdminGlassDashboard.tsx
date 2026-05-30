// TenantAdminGlassDashboard.tsx
// iPhone Glass Morphism Dashboard for Tenant Super Admin Users
// Wraps the proven CompanyAdminDashboardExact content in the same glass morphism shell
// as the main Lighthouse GlassMainApp dashboard.

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { GlassAppShell, GlassView } from './GlassAppShell';
import { GlassViewWrapper } from './GlassViewWrapper';
import { GlassBalanceHero } from './GlassBalanceHero';
import { GlassTransactionList } from './GlassTransactionList';

// Shared transactions UI — same component used by all roles
import { GlassTransactionsView } from './GlassTransactionsView';
import { TransactionModals } from '@/components/transactions/TransactionModals';
import { TransactionDetailDialog } from './TransactionDetailDialog';
import { useMTTransactionAdapter } from '@/hooks/useMTTransactionAdapter';
import { useTransactionFilters } from '@/hooks/useTransactionFilters';
import { Transaction } from '@/hooks/useTransactions';

// Import all multi-tenant company views
import { MTTransactionManager } from '@/components/company/MTTransactionManager';
import { UserLogs } from '@/components/company/UserLogs';
import { MTUserManagement } from '@/components/company/MTUserManagement';
import { ReportsLayout } from '@/components/ReportsClean';
import { CustomerAnalytics } from '@/components/company/CustomerAnalytics';
import { CompanyBrandingManager } from '@/components/company/CompanyBrandingManager';
import { UniversalPasswordChange } from '@/components/auth/UniversalPasswordChange';
import { StudioDocuments } from '@/components/studio-documents/StudioDocuments';
import { CorePlanView } from '@/components/core-plan/CorePlanView';
import { TargetsView } from '@/components/views/TargetsView';
import { ReserveInvestmentView } from '@/components/views/ReserveInvestmentView';
import { SavingsView } from '@/components/views/SavingsView';
import { ExportCenter } from '@/components/export/ExportCenter';

import {
    Plus, Minus, Vault, BarChart3, MessageSquare, Users, Target, PiggyBank,
    FileText, Download, Receipt, Building2, ClipboardList, Wallet, LifeBuoy,
    Activity, Settings, LayoutDashboard, TrendingUp, Sun, Moon, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import './GlassTheme.css';

// ─── Shared Transactions View (wraps GlassTransactionsView with MT data) ──────
/**
 * MTGlassTransactionsView
 * Renders the exact same GlassTransactionsView used by regular/admin users,
 * but fed with data from mt_company_transactions via the adapter hook.
 * Zero financial logic changes — only the UI source is unified.
 */
function MTGlassTransactionsView({
  companyId,
  selectedMonth: initialSelectedMonth,
}: {
  companyId: string;
  selectedMonth: string;
}) {
  const [year, monthStr] = initialSelectedMonth.split('-');
  const [selectedYear, setSelectedYear] = useState(parseInt(year));
  const [selectedMonthNum, setSelectedMonthNum] = useState(parseInt(monthStr) - 1); // 0-indexed

  const selectedMonth = `${selectedYear}-${String(selectedMonthNum + 1).padStart(2, '0')}`;

  const {
    transactions,
    categories,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
  } = useMTTransactionAdapter(companyId, selectedMonth);

  const { filters, setFilters, getFilteredTransactions } = useTransactionFilters(
    transactions,
    selectedYear,
    selectedMonthNum
  );

  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionType, setTransactionType] = useState<'cash-in' | 'cash-out'>('cash-in');
  const [newlyCreatedTransaction, setNewlyCreatedTransaction] = useState<Transaction | null>(null);
  const [showNewTransactionDetail, setShowNewTransactionDetail] = useState(false);

  const handleAddTransaction = async (tx: Omit<Transaction, 'id' | 'added_by'>) => {
    setShowTransactionForm(false);
    const added = await addTransaction({
      ...tx,
      time: tx.time || format(new Date(), 'HH:mm'),
    });
    if (added && added.type === 'cash-in') {
      setNewlyCreatedTransaction(added);
      setShowNewTransactionDetail(true);
    }
  };

  const filteredTransactions = getFilteredTransactions();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <GlassTransactionsView
        transactions={transactions}
        filteredTransactions={filteredTransactions}
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        isAdmin={true}
        currentUser={null}
        selectedYear={selectedYear}
        selectedMonth={selectedMonthNum}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonthNum}
        onDeleteTransaction={deleteTransaction}
        onUpdateTransaction={updateTransaction}
        onAddTransaction={handleAddTransaction}
        onAddCategory={addCategory}
      />

      <TransactionModals
        showTransactionForm={showTransactionForm}
        showTopCustomers={false}
        showCustomerList={false}
        transactionType={transactionType}
        categories={categories}
        filteredTransactions={filteredTransactions}
        onCloseTransactionForm={() => setShowTransactionForm(false)}
        onCloseTopCustomers={() => {}}
        onCloseCustomerList={() => {}}
        onAddTransaction={handleAddTransaction}
        onAddCategory={addCategory}
      />

      <TransactionDetailDialog
        transaction={newlyCreatedTransaction}
        isOpen={showNewTransactionDetail}
        onClose={() => {
          setShowNewTransactionDetail(false);
          setNewlyCreatedTransaction(null);
        }}
        isAdmin={true}
        onDelete={deleteTransaction}
      />
    </>
  );
}

// ─── Shared Reports View (wraps ReportsClean with MT data) ────────────────────
/**
 * MTGlassReportsView
 * Renders the exact same Reports UI used by platform admin users,
 * but fed with isolated company data from useMTTransactionAdapter.
 */
function MTGlassReportsView({
  companyId,
  currentUserEmail,
}: {
  companyId: string;
  currentUserEmail?: string;
}) {
  const {
    transactions,
    categories,
    loading,
  } = useMTTransactionAdapter(companyId, ''); // empty selectedMonth fetches all transactions

  return (
    <ReportsLayout
      transactions={transactions}
      categories={categories}
      loading={loading}
      isCompanyView={true}
      currentUser={currentUserEmail ? { email: currentUserEmail } : null}
      hasSmartAnalysisAccess={currentUserEmail === 'jonahdjbreezy@gmail.com'}
    />
  );
}

// ─── Action Grid for Tenant Admin ─────────────────────────────────────────────
interface ActionItem {
    id: string;
    icon: React.ElementType;
    label: string;
    subtitle?: string;
    view?: GlassView;
    iconColor: string;
    onClick?: () => void;
}

function TenantAdminActionGrid({
    onViewChange,
    onCashIn,
    onCashOut,
}: {
    onViewChange: (view: GlassView) => void;
    onCashIn: () => void;
    onCashOut: () => void;
}) {
    const actions: ActionItem[] = [
        { id: 'cash-in', icon: Plus, label: 'Cash In', subtitle: 'Record income', iconColor: 'text-green-400', onClick: onCashIn },
        { id: 'cash-out', icon: Minus, label: 'Cash Out', subtitle: 'Record expense', iconColor: 'text-red-400', onClick: onCashOut },
        { id: 'users', icon: Users, label: 'Personnel', subtitle: 'Staffing', iconColor: 'text-violet-400', view: 'users' },
        { id: 'targets', icon: Target, label: 'Milestones', subtitle: 'Goals', iconColor: 'text-cyan-400', view: 'targets' },
        { id: 'analytics', icon: BarChart3, label: 'Insights', subtitle: 'Analytics', iconColor: 'text-purple-400', view: 'analytics' },
        { id: 'reports', icon: FileText, label: 'Financials', subtitle: 'Reports', iconColor: 'text-blue-400', view: 'reports' },
        { id: 'exports', icon: Download, label: 'Export Center', subtitle: 'Download data', iconColor: 'text-emerald-400', view: 'exports' },
        { id: 'logs', icon: Activity, label: 'Activity', subtitle: 'Logs', iconColor: 'text-slate-400', view: 'userlogs' },
        { id: 'settings', icon: Settings, label: 'Branding', subtitle: 'Settings', iconColor: 'text-slate-400', view: 'settings' },
        { id: 'reserve-investment', icon: TrendingUp, label: 'Reserve Invest', subtitle: 'Allocations', iconColor: 'text-amber-400', view: 'reserve-investment' },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                    <button
                        key={action.id}
                        onClick={() => action.onClick ? action.onClick() : action.view && onViewChange(action.view)}
                        className="glass-action-card group border-white/5 bg-white/[0.03]"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/[0.03] border border-white/5 shadow-[inner_0_1px_1px_rgba(255,255,255,0.05)] group-hover:bg-white/10 transition-colors">
                            <Icon className={cn('w-6 h-6 transition-transform group-hover:scale-110 opacity-70 group-hover:opacity-100', action.iconColor)} />
                        </div>
                        <span className="text-[13px] font-bold text-slate-400 group-hover:text-white transition-colors">{action.label}</span>
                        {action.subtitle && (
                            <span className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-tighter opacity-70 group-hover:opacity-100">
                                {action.subtitle}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Home View (balance hero + action grid + recent activity) ─────────────────
function TenantAdminHomeView({
    onViewChange,
    onCashIn,
    onCashOut,
    companyId,
}: {
    onViewChange: (view: GlassView) => void;
    onCashIn: () => void;
    onCashOut: () => void;
    companyId: string;
}) {
    const [hideBalance, setHideBalance] = useState(false);
    const [stats, setStats] = useState({
        totalCashIn: 0,
        totalCashOut: 0,
        netBalance: 0,
        totalPictures: 0,
        recentTransactions: [] as any[],
    });

    useEffect(() => {
        if (!companyId) return;

        const loadStats = async () => {
            try {
                const { data: transactions, error } = await supabase
                    .from('mt_company_transactions')
                    .select('*')
                    .eq('company_id', companyId)
                    .order('created_at', { ascending: false });

                if (error) { console.error('Error loading stats:', error); return; }

                const cashIn = (transactions || []).filter(t => t.type === 'cash-in');
                const cashOut = (transactions || []).filter(t => t.type === 'cash-out');

                setStats({
                    totalCashIn: cashIn.reduce((s, t) => s + Number(t.amount || 0), 0),
                    totalCashOut: cashOut.reduce((s, t) => s + Number(t.amount || 0), 0),
                    netBalance: cashIn.reduce((s, t) => s + Number(t.amount || 0), 0) - cashOut.reduce((s, t) => s + Number(t.amount || 0), 0),
                    totalPictures: cashIn.reduce((s, t) => s + (Number(t.pictures) || 0), 0),
                    // Activity: only cash-in (deposits), most recent 25
                    recentTransactions: (transactions || [])
                        .filter(t => t.type === 'cash-in')
                        .slice(0, 25),
                });
            } catch (err) {
                console.error('Error in TenantAdminHomeView:', err);
            }
        };

        loadStats();

        const channel = supabase
            .channel(`tenant-home-stats-${companyId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mt_company_transactions', filter: `company_id=eq.${companyId}` }, loadStats)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [companyId]);

    return (
        <div className="w-full">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0">
                {/* Balance Hero */}
                <GlassBalanceHero
                    netBalance={stats.netBalance}
                    totalCashIn={stats.totalCashIn}
                    totalCashOut={stats.totalCashOut}
                    totalPictures={stats.totalPictures}
                    hideBalance={hideBalance}
                    onToggleHide={() => setHideBalance(h => !h)}
                    isAdmin={true}
                />

                {/* Quick Actions */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold tracking-tight text-white/90 px-2">Quick Actions</h3>
                    <TenantAdminActionGrid
                        onViewChange={onViewChange}
                        onCashIn={onCashIn}
                        onCashOut={onCashOut}
                    />
                </div>

                {/* Recent Activity */}
                <div className="pt-2 w-full">
                    <GlassTransactionList
                        transactions={stats.recentTransactions as any}
                        onTransactionClick={() => { }}
                        showViewAll={false}
                        maxItems={1000}
                        hideDetails={hideBalance}
                        onRevealClick={() => setHideBalance(false)}
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Main Tenant Admin Glass Dashboard ────────────────────────────────────────
export function TenantAdminGlassDashboard() {
    // Try the legacy MT auth system first (for company_admin users)
    const mtAuth = useMultiTenantAuth();
    // And get the new tenant context
    const { company: tenantCompany, role: tenantRole } = useTenant();
    const { theme, setTheme } = useTheme();

    const [currentView, setCurrentView] = useState<GlassView>(() => {
        return (localStorage.getItem('tenantAdminView') as GlassView) || 'home';
    });

    const [supabaseUser, setSupabaseUser] = useState<any>(null);

    // Load Supabase session user info for new auth system
    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setSupabaseUser(session.user);
            }
        };
        getUser();
    }, []);

    // Save view state
    React.useEffect(() => {
        localStorage.setItem('tenantAdminView', currentView);
    }, [currentView]);

    // Resolve the current user and company from any available auth source
    const resolveAuth = () => {
        // Priority 1: Legacy MT auth system (company_admin / super_admin from mt_users)
        if (mtAuth.currentUser && mtAuth.currentCompany) {
            return {
                user: mtAuth.currentUser,
                company: mtAuth.currentCompany,
                companyId: mtAuth.currentCompany.id,
                username: mtAuth.currentUser.username || 'Admin User',
                companyName: mtAuth.currentCompany.display_name || mtAuth.currentCompany.name || 'Company',
                isLegacyMT: true,
            };
        }

        // Priority 2: New Supabase tenant auth (tenant_super_admin from rebuilt_profiles)
        if (tenantCompany && tenantRole === 'tenant_super_admin') {
            return {
                user: supabaseUser,
                company: tenantCompany,
                companyId: (tenantCompany as any).id,
                username: supabaseUser?.user_metadata?.username || supabaseUser?.email?.split('@')[0] || 'Admin User',
                companyName: (tenantCompany as any).display_name || (tenantCompany as any).name || 'Company',
                isLegacyMT: false,
            };
        }

        return null;
    };

    const auth = resolveAuth();

    const handleLogout = async () => {
        console.log('🔄 Tenant admin logging out...');
        if (auth?.isLegacyMT) {
            await mtAuth.signOut();
        } else {
            await supabase.auth.signOut();
        }
        localStorage.removeItem('tenantAdminView');
        window.location.href = '/';
    };

    const handleViewChange = (view: GlassView) => setCurrentView(view);

    // Loading state - wait a moment for auth systems to initialize
    const [waitingForAuth, setWaitingForAuth] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setWaitingForAuth(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    if (waitingForAuth && !auth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="text-center relative z-10 animate-in fade-in zoom-in-95 duration-700">
                    <div className="w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-[28px] border border-white/10 backdrop-blur-xl flex items-center justify-center mx-auto mb-6 shadow-2xl relative">
                        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Initializing Platform...</p>
                </div>
            </div>
        );
    }

    if (!auth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="text-center text-white">
                    <p className="text-lg font-bold mb-2">Session Loading...</p>
                    <p className="text-slate-400 text-sm">Please wait or refresh the page.</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm">Refresh</button>
                </div>
            </div>
        );
    }

    const { companyId, username, companyName } = auth;
    const selectedMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const renderView = () => {
        switch (currentView) {
            case 'home':
                return <TenantAdminHomeView onViewChange={handleViewChange} onCashIn={() => handleViewChange('transactions')} onCashOut={() => handleViewChange('transactions')} companyId={companyId} />;
            case 'transactions':
                return (
                    <div className="animate-in fade-in duration-700">
                        <MTGlassTransactionsView companyId={companyId} selectedMonth={selectedMonth} />
                    </div>
                );
            case 'reports':
                return (
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl overflow-hidden animate-in fade-in duration-700">
                        <MTGlassReportsView companyId={companyId} currentUserEmail={auth?.user?.email} />
                    </div>
                );
            case 'exports':
                return (
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl overflow-hidden animate-in fade-in duration-700">
                        <GlassViewWrapper title="Export Center" subtitle="Download reports and spreadsheets" onBack={() => handleViewChange('home')}>
                            <ExportCenter companyId={companyId} />
                        </GlassViewWrapper>
                    </div>
                );
            case 'analytics':
                return (
                    <GlassViewWrapper title="Analytics" subtitle="Company performance">
                        <CustomerAnalytics selectedMonth={selectedMonth} />
                    </GlassViewWrapper>
                );
            case 'users':
                return (
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl overflow-hidden animate-in fade-in duration-700">
                        <MTUserManagement />
                    </div>
                );
            case 'userlogs':
            case 'logs':
                return (
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl overflow-hidden animate-in fade-in duration-700">
                        <UserLogs selectedMonth={selectedMonth} />
                    </div>
                );
            case 'targets':
                return <TargetsView />;
            case 'settings':
                return (
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl overflow-hidden animate-in fade-in duration-700 p-8">
                        <CompanyBrandingManager />
                    </div>
                );
            case 'profile':
                return (
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl overflow-hidden animate-in fade-in duration-700">
                        <GlassViewWrapper title="Profile Settings" subtitle="Manage your account preferences and theme" onBack={() => handleViewChange('home')}>
                            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                                {/* Left Column: Theme / Settings */}
                                <div className="space-y-6">
                                    <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900/80 via-blue-900/20 to-slate-900/60 backdrop-blur-xl shadow-xl">
                                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-500/10 rounded-full blur-[30px] pointer-events-none" />
                                        <div className="relative z-10 p-5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-400/25 flex items-center justify-center shadow-inner">
                                                    {theme === 'dark' ? (
                                                        <Moon className="w-4 h-4 text-blue-300" />
                                                    ) : (
                                                        <Sun className="w-4 h-4 text-amber-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-widest text-blue-300">Appearance</p>
                                                    <h3 className="text-base font-bold text-white leading-tight">System Theme</h3>
                                                </div>
                                            </div>

                                            {/* Toggle buttons */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    id="theme-dark-btn"
                                                    onClick={() => setTheme('dark')}
                                                    className={cn(
                                                        'flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-xl border font-bold text-sm transition-all duration-300',
                                                        theme === 'dark'
                                                            ? 'bg-slate-800 border-blue-500/40 text-blue-300 shadow-lg shadow-blue-500/20 scale-[1.02]'
                                                            : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/8 hover:text-slate-300'
                                                    )}
                                                >
                                                    <Moon className={cn('w-5 h-5 transition-all', theme === 'dark' ? 'text-blue-400 drop-shadow-sm' : 'text-slate-600')} />
                                                    <span>Dark 🌙</span>
                                                    {theme === 'dark' && (
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-400/80">Active</span>
                                                    )}
                                                </button>

                                                <button
                                                    id="theme-light-btn"
                                                    onClick={() => setTheme('light')}
                                                    className={cn(
                                                        'flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-xl border font-bold text-sm transition-all duration-300',
                                                        theme === 'light'
                                                            ? 'bg-amber-50/10 border-amber-400/40 text-amber-300 shadow-lg shadow-amber-500/15 scale-[1.02]'
                                                            : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/8 hover:text-slate-300'
                                                    )}
                                                >
                                                    <Sun className={cn('w-5 h-5 transition-all', theme === 'light' ? 'text-amber-400 drop-shadow-sm' : 'text-slate-600')} />
                                                    <span>Light ☀️</span>
                                                    {theme === 'light' && (
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-400/80">Active</span>
                                                    )}
                                                </button>
                                            </div>

                                            <p className="mt-3 text-[10px] text-slate-500 text-center">
                                                Switches instantly across the entire app for multi-tenant users.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Company Savings / Withdrawal access for multitenant admin */}
                                    <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-slate-900/80 via-rose-900/10 to-slate-900/60 backdrop-blur-xl shadow-xl">
                                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-rose-500/10 rounded-full blur-[30px] pointer-events-none" />
                                        <div className="relative z-10 p-5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-400/25 flex items-center justify-center shadow-inner">
                                                    <PiggyBank className="w-4.5 h-4.5 text-rose-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-widest text-rose-300">Capital Reserve</p>
                                                    <h3 className="text-base font-bold text-white leading-tight">Company Savings</h3>
                                                </div>
                                            </div>

                                            <p className="text-xs text-slate-400 mb-4">
                                                Access the capital reserve and withdraw savings for {companyName}.
                                            </p>

                                            <Button
                                                onClick={() => handleViewChange('savings')}
                                                className="w-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold justify-between h-10 rounded-xl"
                                            >
                                                <span>Open Savings Vault</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Password Change */}
                                <div className="space-y-6">
                                    <UniversalPasswordChange />
                                </div>
                            </div>
                        </GlassViewWrapper>
                    </div>
                );
            case 'savings':
                return (
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl overflow-hidden animate-in fade-in duration-700">
                        <GlassViewWrapper title="Company Savings" subtitle="Regulated capital reserve" onBack={() => handleViewChange('home')}>
                            <SavingsView currentUser={auth.user} companyId={companyId} />
                        </GlassViewWrapper>
                    </div>
                );
            case 'reserve-investment':
                return (
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl overflow-hidden animate-in fade-in duration-700">
                        <ReserveInvestmentView forceAdmin={true} companyId={companyId} />
                    </div>
                );
            case 'studiodocuments':
                return <StudioDocuments />;
            case 'core-plan':
                return <CorePlanView />;
            default:
                return <TenantAdminHomeView onViewChange={handleViewChange} onCashIn={() => handleViewChange('transactions')} onCashOut={() => handleViewChange('transactions')} companyId={companyId} />;
        }
    };

    return (
        <GlassAppShell
            currentView={currentView}
            onViewChange={handleViewChange}
            onLogout={handleLogout}
            isAdmin={true}
            companyName={companyName}
            username={username}
            profilePictureUrl={null}
            onFabClick={() => handleViewChange('transactions')}
        >
            {renderView()}
        </GlassAppShell>
    );
}
