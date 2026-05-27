import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useDeviceInfo } from '@/hooks/use-mobile';
import { useTenant } from '@/contexts/TenantContext';

interface ModernMobileWrapperProps {
  children: React.ReactNode;
  className?: string;
  showStatusBar?: boolean;
  showScrollIndicator?: boolean;
}

export function ModernMobileWrapper({ 
  children, 
  className, 
  showStatusBar = true,
  showScrollIndicator = true 
}: ModernMobileWrapperProps) {
  const { isMobile } = useDeviceInfo();
  const [scrollProgress, setScrollProgress] = useState(0);
  const { company } = useTenant();
  const companyName = company?.name || 'Lighthouse';

  useEffect(() => {
    if (!isMobile || !showScrollIndicator) return;

    const updateScrollProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, [isMobile, showScrollIndicator]);

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("mobile-container", className)}>
      {/* Modern Mobile Status Bar */}
      {showStatusBar && (
        <div className="mobile-status-bar">
          <div className="flex items-center justify-between">
            <span>{companyName}</span>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-2 bg-white/30 rounded-sm">
                <div className="w-3/4 h-full bg-white rounded-sm"></div>
              </div>
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modern Mobile Scroll Indicator */}
      {showScrollIndicator && (
        <div 
          className="mobile-scroll-indicator"
          style={{ width: `${scrollProgress}%` }}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

interface ModernMobileCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function ModernMobileCard({ children, className, hover = true }: ModernMobileCardProps) {
  const { isMobile } = useDeviceInfo();

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-sm border border-gray-200",
      isMobile && "mobile-card",
      !hover && isMobile && "hover:transform-none hover:shadow-sm",
      className
    )}>
      {children}
    </div>
  );
}

interface ModernMobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function ModernMobileButton({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: ModernMobileButtonProps) {
  const { isMobile } = useDeviceInfo();

  const variants = {
    primary: "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:from-green-700 hover:to-green-800",
    secondary: "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:from-blue-700 hover:to-blue-800",
    outline: "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
  };

  const sizes = {
    sm: isMobile ? "px-4 py-2 text-sm min-h-[40px]" : "px-3 py-2 text-sm",
    md: isMobile ? "px-6 py-3 text-base min-h-[48px]" : "px-4 py-2 text-sm",
    lg: isMobile ? "px-8 py-4 text-lg min-h-[52px]" : "px-6 py-3 text-base"
  };

  return (
    <button
      className={cn(
        "font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
        variants[variant],
        sizes[size],
        isMobile && "mobile-button",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface ModernMobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function ModernMobileInput({ 
  label, 
  error, 
  className, 
  ...props 
}: ModernMobileInputProps) {
  const { isMobile } = useDeviceInfo();

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm",
          "focus:ring-2 focus:ring-green-500 focus:border-green-500",
          "transition-all duration-200",
          isMobile && "mobile-input",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
          className
        )}
        style={isMobile ? { fontSize: 'max(16px, 1rem)' } : {}}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

interface ModernMobileTabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function ModernMobileTabs({ tabs, activeTab, onTabChange, className }: ModernMobileTabsProps) {
  const { isMobile } = useDeviceInfo();

  return (
    <div className={cn(
      "flex gap-2 p-2 bg-gray-100 rounded-lg",
      isMobile && "gap-1 p-1",
      className
    )}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200",
            isMobile && "mobile-tab",
            activeTab === tab.id 
              ? (isMobile ? "active" : "bg-white text-green-600 shadow-sm")
              : (isMobile ? "" : "text-gray-600 hover:text-gray-800")
          )}
        >
          {tab.icon}
          <span className={cn(
            "font-medium",
            isMobile ? "text-sm" : "text-sm"
          )}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
