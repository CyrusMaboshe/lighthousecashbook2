import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { GlassHeader } from './GlassHeader';
import { GlassBottomNav } from './GlassBottomNav';
import { GlassFloatingActionButton } from './GlassFloatingActionButton';
import './GlassTheme.css';

export type GlassView =
  | 'home'
  | 'transactions'
  | 'reports'
  | 'financialreports'
  | 'profile'
  | 'targets'
  | 'users'
  | 'logs'
  | 'userlogs'
  | 'settings'
  | 'cashvault'
  | 'savings'
  | 'analytics'
  | 'exports'
  | 'usersummary'
  | 'invoices'
  | 'companies'
  | 'systemchat'
  | 'emergencyfund'
  | 'studiodocuments'
  | 'core-plan'
  | 'customers'
  | 'infrastructure'
  | 'rent-reserved'
  | 'reserve-investment';


interface GlassAppShellProps {
  children: React.ReactNode;
  currentView: GlassView;
  onViewChange: (view: GlassView) => void;
  onLogout: () => void;
  isAdmin: boolean;
  companyName?: string;
  username?: string;
  profilePictureUrl?: string | null;
  onFabClick?: () => void;
}

export function GlassAppShell({
  children, currentView, onViewChange, onLogout, isAdmin,
  companyName, username, profilePictureUrl, onFabClick
}: GlassAppShellProps) {
  const [showFab, setShowFab] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isHeaderVisible = true;

  // Detect if on desktop to disable certain auto-hide behaviors
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const hideFabViews = ['settings', 'users', 'logs', 'userlogs'];
    setShowFab(!hideFabViews.includes(currentView));
  }, [currentView]);

  return (
    <div className={cn(
      'glass-app',
      isAdmin && 'glass-is-admin',
      (!isSidebarVisible && !isLargeScreen) && 'glass-sidebar-hidden',
      isSidebarCollapsed && 'glass-sidebar-collapsed',
      !isHeaderVisible && 'glass-header-hidden',
      !isLargeScreen && 'glass-mobile-mode'
    )}>
      <div className="glass-mobile-container">
        <div 
          className={cn(
            "glass-header-wrapper transition-all duration-500 fixed top-0 right-0 z-[1000]",
            !isHeaderVisible ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100",
            isLargeScreen
              ? (!isSidebarVisible ? "left-0" : (isSidebarCollapsed ? "left-[80px]" : "left-[280px]"))
              : "left-0"
          )}
        >
          <GlassHeader
            username={username}
            profilePictureUrl={profilePictureUrl}
            onLogout={onLogout}
            onProfileClick={() => onViewChange('profile')}
            showWelcome={currentView === 'home'}
          />
        </div>

        <main
          className={cn(
            "relative z-10 transition-all duration-500 px-4 min-h-[calc(100vh-140px)] min-h-[calc(100dvh-140px)]",
            !isHeaderVisible ? "mt-0 pt-4" : "pt-4",
            (!isSidebarVisible && !isLargeScreen) ? "pb-4" : "pb-24",
            isLargeScreen && (isSidebarCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"),
            isLargeScreen && "lg:pb-8 lg:pt-8"
          )}
          style={{
            paddingBottom: (!isSidebarVisible && !isLargeScreen) ? 'env(safe-area-inset-bottom, 20px)' : (isLargeScreen ? '2rem' : 'calc(100px + env(safe-area-inset-bottom, 0px))'),
            marginTop: !isHeaderVisible ? '-64px' : '0'
          }}
        >
          <div className={cn(
            "glass-animate-fade-in transition-transform duration-500"
          )}>
            {children}
          </div>
        </main>

        {showFab && (
          <GlassFloatingActionButton
            onClick={onFabClick || (() => onViewChange('transactions'))}
          />
        )}

        <div className={cn(
          "glass-nav-wrapper transition-all duration-500 fixed bottom-0 left-0 right-0 z-[100] lg:contents",
          // ALWAYS show nav on mobile, only hide if sidebar hidden on DESKTOP
          (!isSidebarVisible && isLargeScreen) ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        )}>
          <GlassBottomNav
            currentView={currentView}
            onViewChange={onViewChange}
            isAdmin={isAdmin}
            companyName={companyName}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

      </div>
    </div>
  );
}
