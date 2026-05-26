# Company User Login Debug Guide

## Issue
Company users are being redirected back to the main login page instead of their dashboard after logging in.

## Debug Steps Added

### 1. Enhanced Debug Route
- **URL**: `/debug`
- **Purpose**: Shows complete authentication state
- **What to check**:
  - Is `mtUser` populated?
  - What is `mtUser.role`?
  - What is `userRole` from the hook?
  - Does the company exist?

### 2. Force Dashboard Route
- **URL**: `/force-dashboard`
- **Purpose**: Tests if the CompanyUserDashboard component works independently
- **What to check**: Does the dashboard render without authentication checks?

### 3. Enhanced Logging
- Added more detailed console logging in App.tsx
- Shows both `mtUser.role` and `userRole` values

## Testing Process

### Step 1: Test Company User Login
1. Go to `/company-login`
2. Login with company user credentials
3. Should redirect to `/debug` (temporarily changed)
4. Check the debug information displayed

### Step 2: Check Authentication State
Look for these values in the debug page:
- **mtUser exists**: Should be "YES"
- **mtUser.role**: Should be "company_user"
- **userRole (from hook)**: Should be "company_user"
- **Company exists**: Should be "YES"

### Step 3: Test Role Matching
Check the role comparison results:
- `userRole === 'company_user'`: Should be "TRUE"

### Step 4: Test Dashboard Component
1. Go to `/force-dashboard`
2. Should show the CompanyUserDashboard regardless of authentication

## Expected vs Actual Results

### Expected:
```
mtUser exists: YES
mtUser.role: company_user
userRole (from hook): company_user
Company exists: YES
userRole === 'company_user': TRUE
```

### If you see different results:

#### Case 1: mtUser is null
- **Problem**: Authentication not working
- **Check**: Database tables, login credentials, authentication service

#### Case 2: mtUser exists but role is wrong
- **Problem**: Role mapping issue in authentication service
- **Check**: `separateMultiTenantAuth.ts` line 289

#### Case 3: mtUser.role is correct but userRole is null/different
- **Problem**: Hook not extracting role correctly
- **Check**: `useSeparateMultiTenantAuth.tsx` line 185

#### Case 4: Everything looks correct but routing fails
- **Problem**: Timing issue or React state update issue
- **Solution**: Add loading states or use useEffect

## Quick Fixes to Try

### Fix 1: Add Loading State
If authentication state is not ready when routing decisions are made:

```javascript
// In App.tsx, add loading check
if (mtUser && !userRole) {
  return <div>Loading user role...</div>;
}
```

### Fix 2: Force Role from User Object
If userRole is not being set correctly:

```javascript
// In useSeparateMultiTenantAuth.tsx
const userRole: MTUserRole | null = currentUser?.role || null;
```

### Fix 3: Add Fallback Route
If role detection fails but user is valid:

```javascript
// In App.tsx
{mtUser && !['super_admin', 'company_admin', 'company_user'].includes(userRole) && (
  <Route path="*" element={<CompanyUserDashboard />} />
)}
```

## Database Check

Verify company user exists in database:
```sql
SELECT * FROM mt_company_users WHERE email = 'your-test-email@example.com';
```

Should show:
- `role`: 'user' (in database)
- `is_active`: true
- `company_id`: valid company ID

## Console Logs to Watch

Look for these in browser console:
1. `🔄 MT sign in attempt: [email]`
2. `🔍 Company user result: {...}`
3. `✅ MT Company user sign in successful`
4. `🔍 Setting MT user state: {...}`
5. `🔍 AppContent - Current state: {...}`

## Next Steps

1. **Run the debug test** and share the results
2. **Check browser console** for any errors
3. **Verify database data** for the test user
4. **Test the force dashboard route** to isolate component issues

## Temporary Workaround

If you need immediate access, you can temporarily modify App.tsx:

```javascript
// Replace the company_user check with:
{(userRole === 'company_user' || (mtUser && mtUser.role === 'company_user')) && (
  // ... routes
)}
```

This will work even if the userRole hook has issues.
