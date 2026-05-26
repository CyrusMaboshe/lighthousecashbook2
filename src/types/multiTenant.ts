// Multi-Tenant Type Definitions
// This file contains all TypeScript types for the multi-tenant architecture

export type UserRole = 'super_admin' | 'company_admin' | 'company_user' | 'admin' | 'user';

export interface Company {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  logo_url?: string;
  settings: CompanySettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanySettings {
  show_full_balance_to_users: boolean;
  current_visible_month: number;
  current_visible_year: number;
  allow_user_transaction_creation: boolean;
  allow_user_transaction_editing: boolean;
  require_receipt_printing: boolean;
  [key: string]: any;
}

export interface CompanyAdmin {
  id: string;
  auth_user_id: string;
  company_id: string;
  permissions: CompanyAdminPermissions;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  company?: Company;
}

export interface CompanyAdminPermissions {
  manage_users: boolean;
  manage_transactions: boolean;
  view_reports: boolean;
  manage_categories: boolean;
  manage_notifications: boolean;
  export_data: boolean;
  [key: string]: boolean;
}

export interface CompanyUser {
  id: string;
  auth_user_id: string;
  company_id: string;
  user_metadata: CompanyUserMetadata;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  company?: Company;
}

export interface CompanyUserMetadata {
  can_create_transactions: boolean;
  can_edit_own_transactions: boolean;
  can_view_all_transactions: boolean;
  [key: string]: any;
}

export interface CompanyTransaction {
  id: string;
  company_id: string;
  user_id?: string;
  admin_id?: string;
  date: string;
  time?: string;
  type: 'cash-in' | 'cash-out';
  amount: number;
  category_name: string;
  customer_name: string;
  number_of_pictures?: number;
  whatsapp_number?: string;
  details?: string;
  added_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  company?: Company;
  user?: CompanyUser;
  admin?: CompanyAdmin;
}

export interface CompanyCategory {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  // Joined data
  company?: Company;
}

export interface CompanyNotification {
  id: string;
  company_id: string;
  title: string;
  message: string;
  priority: 'serious' | 'not-serious' | 'moderate' | 'very-urgent' | 'very-serious' | 'appointment' | 'todo' | 'future-plans' | 'schedule';
  created_by_admin_id?: string;
  created_by: string;
  is_read: boolean;
  created_at: string;
  // Joined data
  company?: Company;
  created_by_admin?: CompanyAdmin;
}

export interface CompanyMessage {
  id: string;
  company_id: string;
  conversation_id: string;
  sender_admin_id?: string;
  sender_user_id?: string;
  sender: string;
  sender_role: 'admin' | 'user';
  message: string;
  message_type?: string;
  is_read: boolean;
  created_at: string;
  // Joined data
  company?: Company;
  sender_admin?: CompanyAdmin;
  sender_user?: CompanyUser;
}

// Enhanced User type with multi-tenant support
export interface MultiTenantUser {
  id: string;
  email?: string;
  user_metadata: {
    user_role: UserRole;
    company_id?: string;
    company_name?: string;
    display_name?: string;
    [key: string]: any;
  };
  // Supabase Auth fields
  aud: string;
  role: string;
  created_at: string;
  updated_at: string;
  // Multi-tenant relationships
  company_admin?: CompanyAdmin;
  company_user?: CompanyUser;
  companies?: Company[]; // For super admins
}

// Authentication context types
export interface MultiTenantAuthContextType {
  currentUser: MultiTenantUser | null;
  userRole: UserRole;
  currentCompany: Company | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Authentication methods
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  createSuperAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  
  // Super admin methods
  createCompany: (companyData: Partial<Company>) => Promise<Company>;
  assignCompanyAdmin: (userId: string, companyId: string, permissions?: CompanyAdminPermissions) => Promise<CompanyAdmin>;
  assignCompanyUser: (userId: string, companyId: string, metadata?: CompanyUserMetadata) => Promise<CompanyUser>;
  
  // Company management
  updateCompanySettings: (companyId: string, settings: Partial<CompanySettings>) => Promise<void>;
  switchCompany: (companyId: string) => Promise<void>;
  
  // Utility methods
  hasPermission: (permission: string) => boolean;
  isSuperAdmin: () => boolean;
  isCompanyAdmin: (companyId?: string) => boolean;
  isCompanyUser: (companyId?: string) => boolean;
}

// API Response types
export interface CreateCompanyRequest {
  name: string;
  display_name: string;
  description?: string;
  settings?: Partial<CompanySettings>;
}

export interface CreateCompanyResponse {
  company: Company;
  success: boolean;
  message: string;
}

export interface AssignUserRequest {
  auth_user_id: string;
  company_id: string;
  role: 'admin' | 'user';
  permissions?: CompanyAdminPermissions;
  metadata?: CompanyUserMetadata;
}

export interface AssignUserResponse {
  user: CompanyAdmin | CompanyUser;
  success: boolean;
  message: string;
}

// Filter and query types
export interface CompanyTransactionFilters {
  company_id: string;
  date_from?: string;
  date_to?: string;
  type?: 'cash-in' | 'cash-out' | 'all';
  category_name?: string;
  user_id?: string;
  admin_id?: string;
  search?: string;
}

export interface CompanyDashboardStats {
  total_transactions: number;
  total_cash_in: number;
  total_cash_out: number;
  net_balance: number;
  active_users: number;
  categories_count: number;
  recent_transactions: CompanyTransaction[];
  top_categories: Array<{
    name: string;
    total_amount: number;
    transaction_count: number;
  }>;
}

// Navigation and routing types
export interface MultiTenantRoute {
  path: string;
  component: React.ComponentType;
  allowedRoles: UserRole[];
  requiresCompany?: boolean;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  path: string;
  allowedRoles: UserRole[];
  requiresCompany?: boolean;
  children?: NavigationItem[];
}

// Form types
export interface CompanyFormData {
  name: string;
  display_name: string;
  description: string;
  settings: CompanySettings;
}

export interface UserInviteFormData {
  email: string;
  role: 'admin' | 'user';
  company_id: string;
  permissions?: CompanyAdminPermissions;
  metadata?: CompanyUserMetadata;
}

export interface TransactionFormData {
  date: string;
  time?: string;
  type: 'cash-in' | 'cash-out';
  amount: number;
  category_name: string;
  customer_name: string;
  number_of_pictures?: number;
  whatsapp_number?: string;
  details?: string;
}

// Error types
export interface MultiTenantError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Constants
export const USER_ROLES: Record<UserRole, string> = {
  super_admin: 'Super Administrator',
  company_admin: 'Company Administrator',
  company_user: 'Company User',
  admin: 'Administrator (Legacy)',
  user: 'User (Legacy)'
};

export const TRANSACTION_TYPES = {
  'cash-in': 'Cash In',
  'cash-out': 'Cash Out'
} as const;

export const NOTIFICATION_PRIORITIES = {
  'serious': 'Serious',
  'not-serious': 'Not Serious',
  'moderate': 'Moderate',
  'very-urgent': 'Very Urgent',
  'very-serious': 'Very Serious',
  'appointment': 'Appointment',
  'todo': 'To Do',
  'future-plans': 'Future Plans',
  'schedule': 'Schedule'
} as const;
