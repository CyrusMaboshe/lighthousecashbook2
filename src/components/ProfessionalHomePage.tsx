import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  ArrowRight,
  LogOut,
  Calendar,
  Crown,
  Plus,
  Settings,
  Bell,
  PiggyBank,
  FileText,
  Banknote,
  Wallet,
  Coins,
  Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSystemBalance } from '@/hooks/useSystemBalance';
import { useTransactions } from '@/hooks/useTransactions';
import { AnimatedProfilePicture } from '@/components/profile/AnimatedProfilePicture';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { format } from 'date-fns';
import { isRefundCategory } from '@/utils/refundUtils';

// Restricted users who cannot see Reports, Users, Settings tabs
const RESTRICTED_EMAILS = [
  'cofidencekangila3@gmail.com',
  'cyrus@gmail.com',
  'henry@gmail.com'
];

interface ProfessionalHomePageProps {
  onViewChange?: (
    view:
      | 'home'
      | 'transactions'
      | 'targets'
      | 'systemchat'
      | 'users'
      | 'logs'
      | 'settings'
      | 'reports'
      | 'cashvault'
      | 'savings'
      | 'analytics'
      | 'exports'
      | 'usersummary'
      | 'invoices'
      | 'companies'
  ) => void;
  onLogout?: () => void;
}

export function ProfessionalHomePage({ onViewChange, onLogout }: ProfessionalHomePageProps = {}) {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [showNotifications, setShowNotifications] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);
  const [realStats, setRealStats] = useState({
    totalCashIn: 0,
    totalCashOut: 0,
    netBalance: 0,
    totalTransactions: 0,
    recentTransactions: []
  });

  const { currentUser, isAdmin, logout } = useAuth();
  const { systemState, loading: systemLoading } = useSystemBalance();
  const { transactions, loading: transactionsLoading } = useTransactions();

  // Check if current user is restricted from seeing certain tabs
  const isRestrictedUser = currentUser?.email && RESTRICTED_EMAILS.includes(currentUser.email.toLowerCase());
  const canSeeAdminTabs = isAdmin && !isRestrictedUser;

  // Load real transaction data
  useEffect(() => {
    if (systemLoading || transactionsLoading || !transactions) return;

    // Calculate real statistics from actual transaction data
    const cashInTransactions = transactions.filter(t => t.type === 'cash-in');
    const cashOutTransactions = transactions.filter(t => t.type === 'cash-out');
    const operationalCashOutTransactions = transactions.filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal');

    // Refund-adjusted cash-in: refund-category transactions reduce inflow
    const totalCashIn = cashInTransactions.reduce((sum, t) => {
      const amount = Number(t.amount) || 0;
      return isRefundCategory(t.category_name) ? sum - amount : sum + amount;
    }, 0);
    const totalCashOut = cashOutTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const netBalance = totalCashIn - operationalCashOutTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // Get recent transactions (last 10)
    const recentTransactions = transactions.slice(0, 10);

    setRealStats({
      totalCashIn,
      totalCashOut,
      netBalance,
      totalTransactions: transactions.length,
      recentTransactions
    });
  }, [transactions, systemLoading, transactionsLoading]);

  // User stats for demonstration (keeping some demo data for desktop view)
  const userStats = {
    totalTransactions: realStats.totalTransactions,
    monthlyGrowth: 15.8,
    accountBalance: realStats.netBalance,
    level: isAdmin ? 'Administrator' : 'User',
    joinDate: new Date(2024, 0, 15),
    todayTransactions: realStats.recentTransactions.filter(t =>
      new Date(t.date).toDateString() === new Date().toDateString()
    ).length,
    weeklyGoal: 85,
    goalProgress: 72
  };

  // Period options for financial overview
  const periodOptions = ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'];





  // Build quick actions based on user permissions
  const quickActions = [
    {
      icon: Plus,
      label: "Add Transaction",
      action: () => onViewChange?.('transactions'),
      color: "bg-gradient-to-r from-emerald-500 to-green-600",
      description: "Record new income or expense"
    },
    {
      icon: BarChart3,
      label: "Analytics",
      action: () => onViewChange?.('analytics'),
      color: "bg-gradient-to-r from-blue-500 to-cyan-600",
      description: "View detailed insights"
    },
    {
      icon: Bell,
      label: "System Chat",
      action: () => onViewChange?.('systemchat'),
      color: "bg-gradient-to-r from-fuchsia-500 to-purple-600",
      description: "Send messages quickly"
    },
    // Reports - Only show for admin users who are NOT restricted
    ...(canSeeAdminTabs ? [{
      icon: FileText,
      label: "Reports",
      action: () => onViewChange?.('reports'),
      color: "bg-gradient-to-r from-purple-500 to-violet-600",
      description: "Generate financial reports"
    }] : []),
    // Users - Only show for admin users who are NOT restricted
    ...(canSeeAdminTabs ? [{
      icon: Users,
      label: "Users",
      action: () => onViewChange?.('users'),
      color: "bg-gradient-to-r from-pink-500 to-rose-600",
      description: "Manage user accounts"
    }] : []),
    // Settings - Only show for admin users who are NOT restricted
    ...(canSeeAdminTabs ? [{
      icon: Settings,
      label: "Settings",
      action: () => onViewChange?.('settings'),
      color: "bg-gradient-to-r from-orange-500 to-red-600",
      description: "Manage your account"
    }] : [])
  ];

  return (
    <>
      {/* PWA Install Prompt for Mobile Users */}
      <PWAInstallPrompt />
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Modern Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-gradient-to-r from-violet-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-transparent to-white/30"></div>
      </div>

      {/* Floating Cash Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`
            }}
          >
            {i % 4 === 0 && <Coins className="h-6 w-6 text-emerald-500" />}
            {i % 4 === 1 && <Banknote className="h-6 w-6 text-blue-500" />}
            {i % 4 === 2 && <PiggyBank className="h-6 w-6 text-purple-500" />}
            {i % 4 === 3 && <Wallet className="h-6 w-6 text-orange-500" />}
          </div>
        ))}
      </div>

      {/* Modern Header */}
      <header className="relative z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <PiggyBank className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Lighthouse Media
                </h1>
                <p className="text-sm text-gray-600 font-medium">Professional Cash Flow Management</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Period Selector */}
              <div className="hidden md:flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-white/50 border border-gray-200 rounded-lg px-3 py-1 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {periodOptions.map(period => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
              </div>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>

              {/* User Profile */}
              {currentUser && (
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-gray-900 font-semibold">{currentUser.username}</p>
                    <p className="text-gray-500 text-sm flex items-center gap-1">
                      <Crown className="h-3 w-3 text-emerald-500" />
                      {userStats.level}
                    </p>
                  </div>
                  <div className="relative">
                    <AnimatedProfilePicture
                      src={currentUser.profile_picture_url}
                      size="md"
                      className="transition-all duration-300 hover:scale-110 ring-2 ring-emerald-200 hover:ring-emerald-300"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout || logout}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section */}
        <div className="py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Welcome Section */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                    Lighthouse Media
                  </h1>
                  <p className="text-lg text-gray-600 font-medium">
                    {currentUser ? `Welcome back, ${currentUser.username}!` : 'Welcome to Lighthouse Media Cashbook'}
                  </p>
                </div>
              </div>

              <div className="max-w-3xl mx-auto">
                <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                  Take control of your finances with our professional cash flow management system.
                  Track income, monitor expenses, and achieve your financial goals.
                </p>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {quickActions.map((action, index) => (
                    <div
                      key={index}
                      className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 overflow-hidden rounded-xl"
                      onClick={action.action}
                    >
                      <div className={`p-4 ${action.color} text-white relative overflow-hidden rounded-xl`}>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                              <action.icon className="h-5 w-5 text-white" />
                            </div>
                            <ArrowRight className="h-4 w-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                          </div>
                          <h3 className="text-sm font-bold text-white mb-1">{action.label}</h3>
                          <p className="text-white/80 text-xs">{action.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>







        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-lg flex items-center justify-center">
                    <PiggyBank className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Lighthouse Media</h3>
                </div>
                <p className="text-gray-400 mb-4">
                  Professional cash flow management system designed to help you take control of your finances and achieve your goals.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4">Features</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>• Real-time transaction tracking</li>
                  <li>• Advanced analytics & reports</li>
                  <li>• Multi-user collaboration</li>
                  <li>• Secure data encryption</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4">Account</h4>
                {currentUser && (
                  <div className="text-gray-400">
                    <p className="mb-2">Welcome, {currentUser.username}</p>
                    <p className="mb-2">Member since {format(userStats.joinDate, 'MMMM yyyy')}</p>
                    <p className="text-emerald-400 font-medium">Level: {userStats.level}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8 text-center">
              <p className="text-gray-400">
                © 2024 Lighthouse Media. All rights reserved. • Professional Cash Flow Management
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
    </>
  );
}
