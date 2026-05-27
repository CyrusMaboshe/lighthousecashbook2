import React from 'react';
import { BarChart3, Download, FileText, Users, Building2, ClipboardList, BookOpen, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { GlassView } from './GlassAppShell';

interface ReportItem {
  id: string;
  icon: React.ElementType;
  label: string;
  subtitle: string;
  view: GlassView;
  iconBg: string;
  iconColor: string;
  adminOnly?: boolean;
}

interface GlassReportsViewProps {
  onViewChange: (view: GlassView) => void;
  isCompanyUser?: boolean;
}

export function GlassReportsView({ onViewChange, isCompanyUser = false }: GlassReportsViewProps) {
  const { isAdmin } = useAuth();

  const reportItems: ReportItem[] = [
    { id: 'reports', icon: BarChart3, label: 'Financial Reports', subtitle: 'Monthly & yearly summaries', view: 'financialreports', iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400', adminOnly: true },
    { id: 'exports', icon: Download, label: 'Export Data', subtitle: 'Download PDFs & spreadsheets', view: 'exports', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', adminOnly: true },
    { id: 'user-summary', icon: ClipboardList, label: 'User Summary', subtitle: 'Individual user totals', view: 'usersummary', iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400', adminOnly: true },
    { id: 'users', icon: Users, label: 'User Management', subtitle: 'Manage user accounts', view: 'users', iconBg: 'bg-orange-500/15', iconColor: 'text-orange-400', adminOnly: true },
    { id: 'admin-logs', icon: FileText, label: 'Admin Logs', subtitle: 'System activity logs', view: 'logs', iconBg: 'bg-cyan-500/15', iconColor: 'text-cyan-400', adminOnly: true },
    { id: 'companies', icon: Building2, label: 'Companies', subtitle: 'Multi-tenant management', view: 'companies', iconBg: 'bg-pink-500/15', iconColor: 'text-pink-400', adminOnly: true },
    { id: 'core-plan', icon: BookOpen, label: 'Core Plan', subtitle: 'Strategic financial roadmap', view: 'core-plan', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', adminOnly: false },
    { id: 'studio-documents', icon: FileText, label: 'Studio Documents', subtitle: 'Contracts and presentations', view: 'studiodocuments', iconBg: 'bg-indigo-500/15', iconColor: 'text-indigo-400', adminOnly: false },
    { id: 'customers', icon: Users, label: 'Customers', subtitle: 'Customer acquisition and history', view: 'customers', iconBg: 'bg-cyan-500/15', iconColor: 'text-cyan-400', adminOnly: false },
  ];

  const visibleItems = reportItems.filter(item => {
    if (!item.adminOnly) return true;
    if (isAdmin) return true;
    if (isCompanyUser && (item.id === 'reports' || item.id === 'exports')) return true;
    return false;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-1">
        <h2 className="text-2xl font-bold text-white tracking-tight">Reports</h2>
        <p className="text-sm text-slate-400 mt-1">View and export financial data</p>
      </div>

      <div className="space-y-2.5">
        {visibleItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.view)}
              className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/10 transition-all duration-300 group active:scale-[0.98]"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0 border border-white/[0.05]`}>
                <Icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[15px] font-semibold text-white/90 truncate">{item.label}</p>
                <p className="text-[12px] text-slate-500 truncate">{item.subtitle}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
