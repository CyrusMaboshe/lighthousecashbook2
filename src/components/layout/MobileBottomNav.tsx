import { Home, BarChart3, CreditCard, Settings } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function MobileBottomNav({ activeTab = 'dashboard', onTabChange }: MobileBottomNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'history', label: 'History', icon: BarChart3 },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: Settings },
  ];

  return (
    <div className="mobile-action-grid">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            className={`mobile-action-button ${isActive ? 'bg-blue-50' : ''}`}
            onClick={() => onTabChange?.(tab.id)}
          >
            <div className={`mobile-action-icon ${isActive ? 'text-blue-600' : ''}`}>
              <Icon className="w-full h-full" />
            </div>
            <div className={`mobile-action-label ${isActive ? 'text-blue-600 font-semibold' : ''}`}>
              {tab.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
