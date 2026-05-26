
import { Calendar, X, Home, FileText, BarChart3, Vault, Users, Settings, Download, User, ChevronLeft, ChevronRight, DollarSign, Receipt, Building2, Sparkles, TrendingUp, Shield, Zap, Target, PiggyBank, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { DigitalClock } from '@/components/DigitalClock';
import { DigitalClockFullscreen } from '@/components/DigitalClockFullscreen';
import { MotivationalQuotes } from '@/components/MotivationalQuotes';
import { PhotographyTips } from '@/components/PhotographyTips';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CashBookSidebarProps {
  selectedYear: number;
  selectedMonth: number;
  onYearChange?: (year: number) => void;
  onMonthChange?: (month: number) => void;
  onClose?: () => void;
  currentView?: string;
  onViewChange?: (view: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  adminOnly: boolean;
  superAdminOnly?: boolean;
}

export function CashBookSidebar({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  onClose,
  currentView,
  onViewChange,
  isCollapsed = false,
  onToggleCollapse,
}: CashBookSidebarProps) {
  const { isAdmin, currentUser } = useAuth();
  const isMobile = useIsMobile();
  const [showClockFullscreen, setShowClockFullscreen] = useState(false);

  // Restricted users who cannot see Reports, Users, Settings tabs
  const RESTRICTED_EMAILS = [
    'cofidencekangila3@gmail.com',
    'cyrus@gmail.com',
    'henry@gmail.com'
  ];

  // Check if current user is restricted from seeing certain tabs
  const isRestrictedUser = currentUser?.email && RESTRICTED_EMAILS.includes(currentUser.email.toLowerCase());

  // Debug logging
  console.log('🔍 CashBookSidebar - Current User:', {
    currentUser,
    email: currentUser?.email,
    role: currentUser?.role,
    isAdmin,
    is_super_admin: currentUser?.is_super_admin,
    isRestrictedUser
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  // Extended years range from 5 years ago to 2090
  const years = Array.from({ length: 2090 - (currentYear - 5) + 1 }, (_, i) => currentYear - 5 + i);

  // Navigation items
  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home, adminOnly: false },
    { id: 'transactions', label: 'Trans', icon: FileText, adminOnly: false },
    { id: 'targets', label: 'Targets', icon: Target, adminOnly: false },
    { id: 'systemchat', label: 'System Chat', icon: MessageCircle, adminOnly: false },
    { id: 'cashvault', label: 'Vault', icon: Vault, adminOnly: true },
    { id: 'savings', label: 'Savings', icon: PiggyBank, adminOnly: true },
    { id: 'users', label: 'Users', icon: Users, adminOnly: true },
    { id: 'usersummary', label: 'User Summary', icon: DollarSign, adminOnly: true },
    { id: 'logs', label: 'Admin Logs', icon: FileText, adminOnly: true },
    { id: 'userlogs', label: 'My Logs', icon: FileText, adminOnly: false },
    { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
    { id: 'reports', label: 'Reports', icon: BarChart3, adminOnly: true },
    { id: 'exports', label: 'Exports', icon: Download, adminOnly: true },
    { id: 'invoices', label: 'Invoices', icon: Receipt, adminOnly: true },
    { id: 'companies', label: 'Companies', icon: Building2, adminOnly: true },
  ];

  // Tabs to hide for restricted users
  const restrictedTabs = ['reports', 'users', 'settings'];

  const visibleNavItems = navItems.filter(item => {
    // Show admin-only items only to admin
    if (item.adminOnly && !isAdmin) return false;
    // Hide restricted tabs for restricted users
    if (isRestrictedUser && restrictedTabs.includes(item.id)) return false;
    return true;
  });

  console.log('🔍 Navigation items:', {
    allNavItems: navItems.map(item => ({ id: item.id, adminOnly: item.adminOnly, superAdminOnly: item.superAdminOnly })),
    visibleNavItems: visibleNavItems.map(item => ({ id: item.id, adminOnly: item.adminOnly, superAdminOnly: item.superAdminOnly })),
    isAdmin,
    is_super_admin: currentUser?.is_super_admin,
    isRestrictedUser
  });

  const handleYearChange = (year: string) => {
    if (onYearChange) {
      onYearChange(parseInt(year));
    }
  };

  const handleMonthChange = (month: string) => {
    if (onMonthChange) {
      onMonthChange(parseInt(month));
    }
  };

  const handleClockClick = () => {
    setShowClockFullscreen(true);
  };

  const handleCloseClockFullscreen = () => {
    setShowClockFullscreen(false);
  };

  // Handle ESC key to close fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showClockFullscreen) {
        setShowClockFullscreen(false);
      }
    };

    if (showClockFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [showClockFullscreen]);

  if (showClockFullscreen) {
    return <DigitalClockFullscreen onClose={handleCloseClockFullscreen} />;
  }

  if (isMobile) {
    return (
      <div className="h-full w-full p-4 bg-background">
        <div className="bg-card border border-border rounded-premium shadow-premium h-full">
          <CardHeader className="pb-3 p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                Period Selection
              </CardTitle>
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2 h-8 w-8 rounded-full bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {/* ... keep existing code (Year and Month selectors and selected period display) */}
            <div className="mobile-stats-card">
              <label className="font-medium text-slate-600 mb-2 block text-sm">
                Year
              </label>
              <Select
                value={selectedYear.toString()}
                onValueChange={handleYearChange}
                disabled={!isAdmin}
              >
                <SelectTrigger className="bg-white border-slate-200 w-full rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mobile-stats-card">
              <label className="font-medium text-slate-600 mb-2 block text-sm">
                Month
              </label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={handleMonthChange}
                disabled={!isAdmin}
              >
                <SelectTrigger className="bg-white border-slate-200 w-full rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mobile-stats-card text-center">
              <p className="text-slate-600 text-sm font-medium">
                Selected Period
              </p>
              <p className="text-slate-800 font-bold text-lg mt-1">
                {monthNames[selectedMonth]} {selectedYear}
              </p>
              {!isAdmin && (
                <p className="text-orange-600 mt-2 text-xs">
                  Period controlled by admin
                </p>
              )}
            </div>

            {/* Digital Clock */}
            <div className="mobile-stats-card">
              <div className="flex justify-center">
                <DigitalClock onClick={handleClockClick} />
              </div>
            </div>

            {/* Motivational Quotes */}
            <MotivationalQuotes isMobile={true} />

            {/* Photography Tips */}
            <PhotographyTips isMobile={true} />
          </CardContent>
        </div>
      </div>
    );
  }

  // Clean Professional Desktop Sidebar
  return (
    <div className={`h-full transition-all duration-300 ${isCollapsed ? 'w-20 p-2' : 'w-full p-4'}`}>
      <Card className={`bg-card shadow-premium border border-border h-full transition-all duration-300 rounded-premium`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <CardTitle className="text-20px font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Dashboard
              </CardTitle>
            )}
            <div className="flex items-center gap-1">
              {onToggleCollapse && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleCollapse}
                  className="p-1 h-8 w-8"
                  title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
              )}
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-1 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className={`space-y-4 ${isCollapsed ? 'px-2' : ''}`}>
          {/* Clean Navigation Section */}
          {!isCollapsed && (
            <div className="space-y-4">
              <h3 className="font-medium text-secondary-foreground text-12px uppercase tracking-wider mb-2">Main Menu</h3>
              <div className="space-y-1">
                {visibleNavItems.map((item, index) => (
                  <Button
                    key={item.id}
                    variant={currentView === item.id ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      console.log('Sidebar navigation clicked:', item.id);
                      onViewChange?.(item.id);
                    }}
                    className={`w-full justify-start gap-4 h-11 px-4 rounded-button transition-all duration-200 ${
                      currentView === item.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-secondary-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <item.icon className={cn("h-4 w-4", currentView === item.id ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
                    <span className="font-medium text-14px">{item.label}</span>
                  </Button>
                ))}

                {/* Enhanced Profile Button */}
                {currentUser && (
                  <div className="mt-4 pt-4 border-t border-slate-200/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // This will be handled by the parent component
                        const event = new CustomEvent('openProfileModal');
                        window.dispatchEvent(event);
                      }}
                      className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:via-purple-50 hover:to-pink-50 hover:border-blue-200/50 border border-transparent transition-all duration-300"
                    >
                      <div className="relative">
                        {currentUser.profile_picture_url ? (
                          <img
                            src={currentUser.profile_picture_url}
                            alt="Profile"
                            className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-500/20"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-professional-pulse"></div>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-slate-800">My Profile</div>
                        <div className="text-xs text-slate-600">Manage Settings</div>
                      </div>
                      <Shield className="w-4 h-4 ml-auto text-blue-500" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collapsed Navigation - Icon Only */}
          {isCollapsed && (
            <div className="space-y-1">
              {visibleNavItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onViewChange?.(item.id)}
                  className="w-full h-9 p-0 flex items-center justify-center"
                  title={item.label}
                >
                  <item.icon className="h-4 w-4" />
                </Button>
              ))}

              {/* Profile Picture Button - Collapsed */}
              {currentUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const event = new CustomEvent('openProfileModal');
                    window.dispatchEvent(event);
                  }}
                  className="w-full h-9 p-0 flex items-center justify-center"
                  title="Profile Picture"
                >
                  {currentUser.profile_picture_url ? (
                    <img
                      src={currentUser.profile_picture_url}
                      alt="Profile"
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Divider */}
          {!isCollapsed && <div className="border-t border-slate-200 my-4"></div>}

          {/* Period Selection Section */}
          {!isCollapsed && (
            <div className="space-y-4">
              <h3 className="font-medium text-slate-600 text-sm">Period Selection</h3>
          <div>
            <label className="font-medium text-slate-600 mb-2 block text-sm">
              Year
            </label>
            <Select
              value={selectedYear.toString()}
              onValueChange={handleYearChange}
              disabled={!isAdmin}
            >
              <SelectTrigger className="bg-white/80 border-slate-200 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="font-medium text-slate-600 mb-2 block text-sm">
              Month
            </label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={handleMonthChange}
              disabled={!isAdmin}
            >
              <SelectTrigger className="bg-white/80 border-slate-200 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-center border-t border-slate-200 pt-2">
            <p className="text-slate-600 text-sm">
              Selected: {monthNames[selectedMonth]} {selectedYear}
            </p>
            {!isAdmin && (
              <p className="text-orange-600 mt-1 text-xs">
                Period controlled by admin
              </p>
            )}
          </div>
          </div>
          )}

          {/* Digital Clock */}
          {!isCollapsed && (
            <div className="border-t border-slate-200 pt-4">
              <div className="flex justify-center">
                <DigitalClock onClick={handleClockClick} />
              </div>
            </div>
          )}

          {/* Motivational Quotes */}
          {!isCollapsed && <MotivationalQuotes isMobile={false} />}

          {/* Photography Tips */}
          {!isCollapsed && <PhotographyTips isMobile={false} />}
        </CardContent>
      </Card>
    </div>
  );
}
