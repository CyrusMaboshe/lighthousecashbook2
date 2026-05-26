/**
 * Session Cleanup Utilities
 * Provides functions to clear multi-tenant sessions and ensure clean authentication state
 */

/**
 * Clear all multi-tenant session data from storage
 */
export function clearMultiTenantSessions(): void {
  try {
    console.log('🧹 Clearing all multi-tenant session data...');
    
    // Clear localStorage
    localStorage.removeItem('mt_user_session');
    localStorage.removeItem('mt_session_expiry');
    
    // Clear sessionStorage
    sessionStorage.removeItem('mt_user_session');
    
    console.log('✅ Multi-tenant sessions cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing multi-tenant sessions:', error);
  }
}

/**
 * Clear all session data (both existing system and multi-tenant)
 */
export function clearAllSessions(): void {
  try {
    console.log('🧹 Clearing all session data...');
    
    // Clear existing system sessions
    localStorage.removeItem('lighthouse-current-user');
    localStorage.removeItem('lighthouse-session-expiry');
    
    // Clear multi-tenant sessions
    clearMultiTenantSessions();
    
    console.log('✅ All sessions cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing all sessions:', error);
  }
}

/**
 * Force clear sessions for specific user (jonahdjbreezy@gmail.com)
 * This ensures the user always starts with a clean slate
 */
export function forceCleanSessionForJonah(): void {
  try {
    console.log('🧹 Force clearing sessions for jonahdjbreezy@gmail.com...');
    
    // Clear all multi-tenant data
    clearMultiTenantSessions();
    
    // Also clear any existing system session to ensure fresh login
    const currentUser = localStorage.getItem('lighthouse-current-user');
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        if (user.email === 'jonahdjbreezy@gmail.com') {
          console.log('🔄 Clearing existing system session for jonahdjbreezy@gmail.com');
          localStorage.removeItem('lighthouse-current-user');
          localStorage.removeItem('lighthouse-session-expiry');
        }
      } catch (parseError) {
        console.error('Error parsing stored user data:', parseError);
        // Clear anyway to be safe
        localStorage.removeItem('lighthouse-current-user');
        localStorage.removeItem('lighthouse-session-expiry');
      }
    }
    
    console.log('✅ Sessions force cleared for jonahdjbreezy@gmail.com');
  } catch (error) {
    console.error('❌ Error force clearing sessions for Jonah:', error);
  }
}

/**
 * Check if there are any multi-tenant sessions active
 */
export function hasMultiTenantSession(): boolean {
  try {
    const mtSession = localStorage.getItem('mt_user_session');
    const mtExpiry = localStorage.getItem('mt_session_expiry');
    
    if (!mtSession || !mtExpiry) {
      return false;
    }
    
    // Check if session is expired
    const expiryTime = parseInt(mtExpiry);
    const currentTime = new Date().getTime();
    
    if (currentTime > expiryTime) {
      // Session expired, clear it
      clearMultiTenantSessions();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking multi-tenant session:', error);
    return false;
  }
}

/**
 * Get current multi-tenant user email if session exists
 */
export function getCurrentMultiTenantUserEmail(): string | null {
  try {
    if (!hasMultiTenantSession()) {
      return null;
    }
    
    const mtSession = localStorage.getItem('mt_user_session');
    if (!mtSession) {
      return null;
    }
    
    const user = JSON.parse(mtSession);
    return user.email || null;
  } catch (error) {
    console.error('Error getting multi-tenant user email:', error);
    return null;
  }
}
