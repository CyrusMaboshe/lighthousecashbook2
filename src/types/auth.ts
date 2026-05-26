
export interface User {
  id?: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  email?: string;
  profile_picture_url?: string;
  profilePictureUrl?: string;
  is_super_admin?: boolean;
}

export interface AdminLog {
  id: string;
  action: string;
  performed_by: string;
  username: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface UserLog {
  id: string;
  user_id: string;
  username: string;
  action_type: string;
  action_description: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  created_at: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'moderate' | 'high';
  created_at: string;
  is_read: boolean;
}

export interface SystemSettings {
  currentVisibleYear: number;
  currentVisibleMonth: number;
  showFullBalanceToUsers: boolean;
  maxPictureCount: number;
  defaultAmounts: number[];
}

export interface UserGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
}

export interface UserAnalyticsData {
  totalRevenue: number;
  totalTransactions: number;
  totalCustomers: number;
  avgTransactionValue: number;
  monthlyGrowth: number;
  topCategories: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
  recentTrends: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
  customerRetention: number;
  goals: UserGoal[];
}

export interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isLoggingOut: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  logAdminAction: (action: string) => void;
  systemSettings: SystemSettings;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  notifications: AdminNotification[];
  addNotification: (notification: Omit<AdminNotification, 'id' | 'created_at'>) => void;
  deleteNotification: (id: string) => void;
  refreshUserData: () => Promise<void>;
}

// Export Message type for chat functionality
export interface Message {
  id: string;
  sender: string;
  sender_role: string;
  message: string;
  created_at: string;
  conversation_id?: string;
  title?: string;
  priority?: 'low' | 'moderate' | 'high';
  is_read?: boolean;
}
