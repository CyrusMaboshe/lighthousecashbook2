import { Home, ArrowLeftRight, BarChart3, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassView } from './GlassAppShell';

interface NavItem {
  id: GlassView;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { id: 'reports', icon: BarChart3, label: 'Reports' },
  { id: 'profile', icon: User, label: 'Profile' },
];

interface GlassBottomNavProps {
  currentView: GlassView;
  onViewChange: (view: GlassView) => void;
  isAdmin: boolean;
  companyName?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function GlassBottomNav({
  currentView, onViewChange, isAdmin, companyName,
  isCollapsed = false, onToggleCollapse
}: GlassBottomNavProps) {
  const isActive = (id: GlassView) => {
    if (id === 'profile') {
      return ['profile', 'settings', 'userlogs'].includes(currentView);
    }
    if (id === 'home') {
      return ['home', 'analytics', 'systemchat', 'cashvault', 'savings', 'reserve-investment'].includes(currentView);
    }
    if (id === 'transactions') {
      return ['transactions', 'targets', 'invoices'].includes(currentView);
    }
    if (id === 'reports') {
      return ['reports', 'financialreports', 'exports', 'usersummary', 'users', 'logs', 'companies', 'studiodocuments', 'core-plan', 'customers'].includes(currentView);
    }

    return currentView === id;
  };

  const visibleNavItems = navItems;


  return (
    <nav className={cn("glass-nav", isCollapsed && "collapsed")}>
      {/* Desktop Logo/Brand Area */}
      <div className="hidden lg:flex items-center gap-3 mb-8 px-2 overflow-hidden whitespace-nowrap">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex-shrink-0 flex items-center justify-center shadow-md">
          <span className="text-white text-lg font-bold">L</span>
        </div>
        {!isCollapsed && (
          <div className="glass-animate-fade-in truncate">
            <h1 className="text-lg font-bold text-white/90 truncate">{companyName || "Lighthouse Media"}</h1>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex items-center justify-around lg:flex-col lg:items-stretch lg:justify-start lg:gap-2">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.id);

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                // Mobile: Vertical compact layout
                'flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-300 min-w-[60px]',
                // Desktop: Horizontal full-width layout
                'lg:flex-row lg:justify-start lg:w-full lg:py-3 lg:px-4 lg:gap-3',
                active
                  ? 'bg-blue-600/20 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)] border border-blue-500/20'
                  : 'bg-[#0f172a]/40 text-slate-400 hover:text-slate-200 hover:bg-blue-600/10 border border-white/5'
              )}
            >
              <Icon className={cn(
                'w-6 h-6 transition-all',
                active && 'text-white'
              )} />
              <span className={cn(
                'text-xs mt-1 font-medium',
                // Desktop: Larger text, no top margin
                'lg:text-sm lg:mt-0',
                active ? 'text-white' : 'text-slate-400'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop Collapse Toggle */}
      <div className="hidden lg:block mt-auto pt-4 border-t border-white/5">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:bg-white/5 hover:text-white transition-all"
        >
          {isCollapsed ? (
            <ChevronRight className="w-6 h-6 mx-auto" />
          ) : (
            <>
              <ChevronLeft className="w-6 h-6" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
}
