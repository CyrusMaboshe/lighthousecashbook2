/**
 * Smart Analysis Permissions Utility
 * 
 * This utility provides a centralized way to check if a user has access to Smart Analysis features.
 * Currently, only jonahdjbreezy@gmail.com has access to Smart Analysis across all systems.
 */

import { useAuth } from '@/hooks/useAuth';
import { useMultiTenantAuth } from '@/hooks/useMultiTenantAuth';

/**
 * The email address that has exclusive access to Smart Analysis
 */
const SMART_ANALYSIS_AUTHORIZED_EMAIL = 'jonahdjbreezy@gmail.com';

/**
 * Hook to check if the current user has access to Smart Analysis features
 * Works with both legacy authentication system and multi-tenant system
 * 
 * @returns boolean - true if user has Smart Analysis access, false otherwise
 */
export function useSmartAnalysisAccess(): boolean {
  // Try legacy auth system first
  const legacyAuth = useAuth();
  const legacyUser = legacyAuth?.currentUser;
  
  // Try multi-tenant auth system
  const multiTenantAuth = useMultiTenantAuth();
  const multiTenantUser = multiTenantAuth?.currentUser;
  
  // Check legacy system user
  if (legacyUser?.email === SMART_ANALYSIS_AUTHORIZED_EMAIL) {
    return true;
  }
  
  // Check multi-tenant system user
  if (multiTenantUser?.email === SMART_ANALYSIS_AUTHORIZED_EMAIL) {
    return true;
  }
  
  // No access by default
  return false;
}

/**
 * Utility function to check Smart Analysis access without hooks
 * Useful for non-React contexts or when you need to check permissions
 * without triggering re-renders
 * 
 * @param userEmail - The email address to check
 * @returns boolean - true if user has Smart Analysis access, false otherwise
 */
export function hasSmartAnalysisAccess(userEmail?: string | null): boolean {
  if (!userEmail) {
    return false;
  }
  
  return userEmail === SMART_ANALYSIS_AUTHORIZED_EMAIL;
}

/**
 * Get the authorized email for Smart Analysis
 * Useful for debugging or administrative purposes
 * 
 * @returns string - The authorized email address
 */
export function getSmartAnalysisAuthorizedEmail(): string {
  return SMART_ANALYSIS_AUTHORIZED_EMAIL;
}

/**
 * Check if Smart Analysis should be visible in navigation/UI
 * This is the main function components should use to determine visibility
 * 
 * @param legacyUser - User from legacy auth system
 * @param multiTenantUser - User from multi-tenant auth system
 * @returns boolean - true if Smart Analysis should be shown, false otherwise
 */
export function shouldShowSmartAnalysis(
  legacyUser?: { email?: string } | null,
  multiTenantUser?: { email?: string } | null
): boolean {
  // Check legacy user
  if (legacyUser?.email === SMART_ANALYSIS_AUTHORIZED_EMAIL) {
    return true;
  }
  
  // Check multi-tenant user
  if (multiTenantUser?.email === SMART_ANALYSIS_AUTHORIZED_EMAIL) {
    return true;
  }
  
  return false;
}
