import { CountUp } from '@/components/ui/CountUp';
import {
  Plus, Minus, Vault, BarChart3, MessageSquare, Users, Target, PiggyBank,
  FileText, Download, Receipt, Building2, ClipboardList, Wallet, LifeBuoy, TrendingUp, Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassView } from './GlassAppShell';

interface ActionItem {
  id: string;
  icon: React.ElementType;
  label: string;
  subtitle?: string | React.ReactNode;
  view?: GlassView;
  iconColor: string;
  adminOnly?: boolean;
  onClick?: () => void;
}

interface GlassActionGridProps {
  onViewChange: (view: GlassView) => void;
  onCashIn?: () => void;
  onCashOut?: () => void;
  isAdmin: boolean;
  cashVaultBalance?: number;
  savingsBalance?: number;
  onTotalReserveClick?: () => void;
  companyId?: string;
}

export function GlassActionGrid({
  onViewChange, onCashIn, onCashOut, isAdmin,
  cashVaultBalance = 0, savingsBalance = 0,
  onTotalReserveClick, companyId
}: GlassActionGridProps) {
  const totalReserve = (cashVaultBalance || 0) + (savingsBalance || 0);

  const actions: ActionItem[] = [
    { id: 'cash-in', icon: Plus, label: 'Cash In', subtitle: 'Record income', iconColor: 'text-green-400', onClick: onCashIn },
    { id: 'cash-out', icon: Minus, label: 'Cash Out', subtitle: 'Record expense', iconColor: 'text-red-400', onClick: onCashOut },
    { id: 'vault', icon: Vault, label: 'Vault', subtitle: '***', view: 'cashvault', iconColor: 'text-blue-400', adminOnly: true },
    { id: 'savings', icon: PiggyBank, label: 'Savings', subtitle: '***', view: 'savings', iconColor: 'text-purple-400', adminOnly: true },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', subtitle: 'View insights', view: 'analytics', iconColor: 'text-cyan-400', adminOnly: true },
    { id: 'emergency-fund', icon: LifeBuoy, label: 'Emergency', subtitle: '***', view: 'emergencyfund', iconColor: 'text-green-400', adminOnly: true },
    { id: 'chat', icon: MessageSquare, label: 'Chat', subtitle: 'System messages', view: 'systemchat', iconColor: 'text-pink-400' },
    { id: 'targets', icon: Target, label: 'Targets', subtitle: 'Set goals', view: 'targets', iconColor: 'text-amber-400' },
    { id: 'studiodocuments', icon: FileText, label: 'Studio Docs', subtitle: 'Contracts', view: 'studiodocuments', iconColor: 'text-indigo-400' },
    // Admin only
    { id: 'users', icon: Users, label: 'Users', subtitle: 'Manage accounts', view: 'users', iconColor: 'text-purple-400', adminOnly: true },
    { id: 'reports', icon: FileText, label: 'Reports', subtitle: 'Financial data', view: 'reports', iconColor: 'text-blue-400' },
    { id: 'exports', icon: Download, label: 'Exports', subtitle: 'Download data', view: 'exports', iconColor: 'text-green-400', adminOnly: true },
    { id: 'invoices', icon: Receipt, label: 'Invoices', subtitle: 'Billing', view: 'invoices', iconColor: 'text-amber-400', adminOnly: true },
    { id: 'companies', icon: Building2, label: 'Companies', subtitle: 'Multi-tenant', view: 'companies', iconColor: 'text-cyan-400', adminOnly: true },
    { id: 'user-summary', icon: ClipboardList, label: 'Summary', subtitle: 'User totals', view: 'usersummary', iconColor: 'text-orange-400', adminOnly: true },
    { id: 'total-reserve', icon: Wallet, label: 'Total Reserve', subtitle: 'Secure Access', iconColor: 'text-indigo-400', adminOnly: true, onClick: onTotalReserveClick },
    { id: 'reserve-investment', icon: TrendingUp, label: 'Reserve Invest', subtitle: 'Allocations', iconColor: 'text-amber-400', view: 'reserve-investment' },
    { id: 'rent-reserved', icon: Home, label: 'Rent Reserved', subtitle: 'Target: 550', iconColor: 'text-purple-400', view: 'rent-reserved' },
  ];

  const visibleActions = actions.filter(
    a => !a.adminOnly || isAdmin || (a.id === 'savings' && !!companyId) || (a.id === 'exports' && !!companyId)
  );

  const getColorClasses = (iconColor: string) => {
    const color = iconColor.replace('text-', '').replace('-400', '');
    const colorMap: Record<string, { bg: string, border: string, icon: string, text: string, subtitle: string }> = {
      green: { bg: 'bg-green-500/20', border: 'border-green-400/30', icon: 'text-green-300', text: 'text-green-100', subtitle: 'text-green-200/70' },
      red: { bg: 'bg-red-500/20', border: 'border-red-400/30', icon: 'text-red-300', text: 'text-red-100', subtitle: 'text-red-200/70' },
      blue: { bg: 'bg-blue-500/20', border: 'border-blue-400/30', icon: 'text-blue-300', text: 'text-blue-100', subtitle: 'text-blue-200/70' },
      purple: { bg: 'bg-purple-500/20', border: 'border-purple-400/30', icon: 'text-purple-300', text: 'text-purple-100', subtitle: 'text-purple-200/70' },
      cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-400/30', icon: 'text-cyan-300', text: 'text-cyan-100', subtitle: 'text-cyan-200/70' },
      orange: { bg: 'bg-orange-500/20', border: 'border-orange-400/30', icon: 'text-orange-300', text: 'text-orange-100', subtitle: 'text-orange-200/70' },
      pink: { bg: 'bg-pink-500/20', border: 'border-pink-400/30', icon: 'text-pink-300', text: 'text-pink-100', subtitle: 'text-pink-200/70' },
      amber: { bg: 'bg-amber-500/20', border: 'border-amber-400/30', icon: 'text-amber-300', text: 'text-amber-100', subtitle: 'text-amber-200/70' },
      indigo: { bg: 'bg-indigo-500/20', border: 'border-indigo-400/30', icon: 'text-indigo-300', text: 'text-indigo-100', subtitle: 'text-indigo-200/70' },
      emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-400/30', icon: 'text-emerald-300', text: 'text-emerald-100', subtitle: 'text-emerald-200/70' },
    };
    return colorMap[color] || { bg: 'bg-white/10', border: 'border-white/20', icon: 'text-white', text: 'text-white', subtitle: 'text-slate-300' };
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {visibleActions.map((action, index) => {
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
            {action.subtitle && action.subtitle !== '***' && (
              <span className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-tighter opacity-70 group-hover:opacity-100">{action.subtitle}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
