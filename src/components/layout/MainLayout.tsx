
import { SidebarProvider } from '@/components/ui/sidebar';
import { CashBookSidebar } from '@/components/CashBookSidebar';
import { InfoBar } from '@/components/InfoBar';
import { Footer } from '@/components/Footer';
import { useIsMobile, useDeviceInfo } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, User, DollarSign, X, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { ProfileManagementModal } from '@/components/profile/ProfileManagementModal';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { InstallPromptBanner } from '@/components/pwa/InstallPromptBanner';
import { SystemChat, ChatButton } from '@/components/chat/SystemChat';

interface MainLayoutProps {
  children: React.ReactNode;
  selectedYear: number;
  selectedMonth: number;
  onYearChange?: (year: number) => void;
  onMonthChange?: (month: number) => void;
  currentView: 'home' | 'transactions' | 'targets' | 'users' | 'logs' | 'userlogs' | 'settings' | 'reports' | 'cashvault' | 'savings' | 'analytics' | 'exports' | 'usersummary' | 'invoices' | 'companies' | 'systemchat';
  onViewChange: (view: 'home' | 'transactions' | 'targets' | 'users' | 'logs' | 'userlogs' | 'settings' | 'reports' | 'cashvault' | 'savings' | 'analytics' | 'exports' | 'usersummary' | 'invoices' | 'companies' | 'systemchat') => void;
  onExportPDF: () => void;
  onLogout: () => void;
  isAdmin: boolean;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export function MainLayout({
  children,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  currentView,
  onViewChange,
  onExportPDF,
  onLogout,
  isAdmin,
  showSidebar,
  onToggleSidebar,
  sidebarCollapsed = false,
  onToggleSidebarCollapse
}: MainLayoutProps) {
  const isMobile = useIsMobile();
  const { isTouchDevice, orientation } = useDeviceInfo();
  const { currentUser } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatFullscreen, setChatFullscreen] = useState(false);

  // Listen for profile modal open event from sidebar
  useEffect(() => {
    const handleOpenProfileModal = () => setShowProfileModal(true);
    window.addEventListener('openProfileModal', handleOpenProfileModal);
    return () => window.removeEventListener('openProfileModal', handleOpenProfileModal);
  }, []);

  // Close mobile sidebar when view changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [currentView]);

  return (
    <SidebarProvider>
      {/* PWA Install Prompt for Mobile Users */}
      <PWAInstallPrompt />
      
      {/* Install Banner - visible on all devices */}
      <InstallPromptBanner />
      
      {/* System Chat */}
      <SystemChat 
        isOpen={showChat} 
        onClose={() => setShowChat(false)}
        isFullscreen={chatFullscreen}
        onToggleFullscreen={() => setChatFullscreen(!chatFullscreen)}
      />
      
      {/* Chat Button - visible when chat is closed */}
      {!showChat && <ChatButton onClick={() => setShowChat(true)} />}
      
      <div className={cn(
        "min-h-screen flex flex-col w-full overflow-x-hidden bg-background",
        isTouchDevice && "touch-manipulation"
      )}>

        <div className={cn(
          "flex flex-1 relative w-full max-w-full z-10",
          orientation === 'landscape' && isMobile && "landscape:h-lvh"
        )}>
          {/* Mobile Sidebar Overlay */}
          {isMobile && mobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

          {/* Responsive Sidebar */}
          <div className={cn(
            isMobile
              ? `fixed left-0 top-0 h-full w-80 max-w-[85vw] z-50 transform transition-transform duration-300 ease-in-out ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
              : `relative transition-all duration-300 flex-shrink-0 border-r border-border bg-card shadow-premium ${sidebarCollapsed ? 'w-20' : 'w-80'}`
          )}>
            {isMobile && mobileSidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSidebarOpen(false)}
                className="absolute top-4 right-4 z-50 bg-white/90 hover:bg-white shadow-md rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
            <CashBookSidebar
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onYearChange={onYearChange}
              onMonthChange={onMonthChange}
              onClose={isMobile ? () => setMobileSidebarOpen(false) : undefined}
              currentView={currentView}
              onViewChange={onViewChange}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={onToggleSidebarCollapse}
            />
          </div>

          {/* Main Content */}
          <main className={cn(
            "flex-1 overflow-auto w-full transition-all duration-500",
            isMobile && "w-full overscroll-behavior-contain",
            isTouchDevice && "scroll-smooth",
            "pb-safe-bottom"
          )}>
            <div className={cn(
              "responsive-container max-w-7xl mx-auto",
              isMobile ? "px-3 py-3" : "px-6 py-4"
            )}>
              <div className={cn(
                "space-y-4 sm:space-y-6 animate-fade-in-up",
                isMobile && "space-y-3"
              )}>
                {/* Clean Professional Header */}
                <div className={cn(
                  "flex items-center justify-between bg-card shadow-premium border border-border rounded-premium",
                  isMobile ? "p-3" : "p-6"
                )}>
                  <div className="flex items-center gap-3">
                    {isMobile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMobileSidebarOpen(true)}
                        className={cn(
                          "p-2 min-w-[44px] min-h-[44px] hover:bg-slate-100 transition-all duration-200",
                          "touch-manipulation"
                        )}
                      >
                        <Menu className="h-5 w-5 text-slate-700" />
                      </Button>
                    )}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={cn(
                        "bg-primary rounded-xl flex items-center justify-center shadow-premium",
                        isMobile ? "w-8 h-8" : "w-10 h-10"
                      )}>
                        <DollarSign className={cn(
                          "text-primary-foreground",
                          isMobile ? "w-5 h-5" : "w-6 h-6"
                        )} />
                      </div>
                      <div>
                        <h1 className={cn(
                          "font-bold text-foreground",
                          isMobile ? "text-lg" : "text-28px leading-tight"
                        )}>
                          Lighthouse Media
                        </h1>
                        <p className={cn(
                          "text-secondary-foreground font-medium",
                          isMobile ? "text-xs" : "text-sm"
                        )}>Cash Management System</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    {currentUser && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowProfileModal(true)}
                        className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-slate-100 transition-all duration-200"
                      >
                        <div className="relative">
                          {currentUser.profile_picture_url ? (
                            <img
                              src={currentUser.profile_picture_url}
                              alt="Profile"
                              className={cn(
                                "rounded-full object-cover",
                                isMobile ? "h-7 w-7" : "h-8 w-8"
                              )}
                            />
                          ) : (
                            <div className={cn(
                              "rounded-full bg-blue-600 flex items-center justify-center",
                              isMobile ? "h-7 w-7" : "h-8 w-8"
                            )}>
                              <User className={cn(
                                "text-white",
                                isMobile ? "h-3 w-3" : "h-4 w-4"
                              )} />
                            </div>
                          )}
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        {!isMobile && (
                          <div className="text-left">
                            <p className="font-semibold text-slate-800">{currentUser.username}</p>
                            <p className="text-xs text-slate-600">Online</p>
                          </div>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onLogout}
                      className={cn(
                        "flex items-center gap-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200",
                        isMobile ? "px-2 py-2" : "px-3 py-2"
                      )}
                    >
                      <LogOut className="h-4 w-4" />
                      {!isMobile && <span className="font-medium">Logout</span>}
                    </Button>
                  </div>
                </div>

                {/* Info Bar - Hidden on mobile */}
                <div className="hidden lg:block">
                  <div className="bg-card shadow-premium border border-border rounded-premium p-6">
                    <InfoBar
                      selectedMonth={selectedMonth}
                      selectedYear={selectedYear}
                    />
                  </div>
                </div>

                {/* Main Content Container */}
                <div className="min-h-[60vh]">
                  {children}
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Responsive Footer - Hidden on very small screens */}
        <div className="hidden md:block">
          <Footer />
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileManagementModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </SidebarProvider>
  );
}
