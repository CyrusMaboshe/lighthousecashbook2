# Fix Savings Transactions Not Showing

## Problem
The transaction history under the savings tab isn't showing anything, even though the balance shows correctly.

## Root Cause
The `savings_transactions` table is **empty**. The savings balance is being calculated correctly by the RPC function, but there are no transaction records to display in the history list. This happens because:

1. The `savings_transactions` table needs to be populated from existing "Savings Transfer" transactions in the main `transactions` table
2. The backfill migration may not have been run, or
3. Historical transactions were created before the savings system was implemented

## Solution
Populate the `savings_transactions` table with historical data from the main `transactions` table, and ensure RLS policies allow viewing.

## Steps to Fix

### Step 1: Backfill Historical Transactions (REQUIRED)

This is the main fix - it will populate the empty `savings_transactions` table.

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Backfill Script**
   - Open the file: `BACKFILL_SAVINGS_TRANSACTIONS.sql`
   - Copy ALL the contents
   - Paste into the SQL Editor
   - Click "Run" or press Ctrl+Enter

4. **Check the Results**
   - The script will show you:
     - How many transactions were inserted
     - Total deposits and withdrawals
     - Latest 10 transactions
   - You should see output like:
     ```
     ✅ Backfill complete!
     Total transactions inserted: 5
     Final savings balance: 13 ZMW
     ```

### Step 2: Fix RLS Policies (If Needed)

If after Step 1 you still can't see transactions, run this:

1. **In the same SQL Editor**
   - Open the file: `FIX_SAVINGS_TRANSACTIONS.sql`
   - Copy ALL the contents
   - Paste into a new query
   - Click "Run"

2. **Verify the Policies**
   - The query will show you the active RLS policies
   - You should see policies like `allow_all_authenticated_select_savings_transactions`

### Step 3: Test in Your App

1. **Refresh your application**
   - Hard refresh the browser (Ctrl+Shift+R)

2. **Navigate to the Savings tab**
   - You should now see all historical transactions
   - The transaction list should match the balance

3. **Test new transactions**
   - Try making a new deposit or withdrawal
   - It should appear immediately in the history

## What This Fix Does

### Backfill Script (`BACKFILL_SAVINGS_TRANSACTIONS.sql`)

1. **Finds all savings-related transactions** - Searches the main `transactions` table for:
   - Transactions with category "Savings Transfer"
   - Transactions with "Savings" in the details
2. **Populates the savings_transactions table** - Creates proper savings transaction records with:
   - Action type (deposit or withdrawal)
   - Running balance calculations
   - Proper timestamps and user information
3. **Updates the savings balance** - Sets the correct balance in the `savings_balance` table
4. **Shows verification results** - Displays summary and latest transactions

### RLS Policy Fix (`FIX_SAVINGS_TRANSACTIONS.sql`)

1. **Removes old restrictive policies** - Drops all existing policies that only allowed admins
2. **Creates new permissive policies** - Allows ALL authenticated users to:
   - View savings balance
   - View savings transactions
   - Insert/update savings data (needed for deposits/withdrawals)
3. **Ensures RLS is enabled** - Keeps security enabled but with correct policies
4. **Grants necessary permissions** - Ensures the authenticated role has the right grants

## Expected Result

After applying this fix:
- ✅ All authenticated users can view savings transactions
- ✅ Transaction history will appear in the Savings tab
- ✅ Deposits and withdrawals will continue to work
- ✅ Security is maintained (only authenticated users have access)

## Troubleshooting

If transactions still don't show after applying the fix:

1. **Clear browser cache and refresh**
   - Press Ctrl+Shift+R to hard refresh

2. **Check browser console for errors**
   - Press F12 to open DevTools
   - Look for any red errors in the Console tab

3. **Verify you're logged in**
   - Make sure you're authenticated in the app

4. **Check if there are any transactions**
   - Run this query in Supabase SQL Editor:
   ```sql
   SELECT COUNT(*) FROM public.savings_transactions;
   ```
   - If count is 0, there are no transactions yet

## Need Help?

If you continue to have issues, check:
- Supabase project status (dashboard)
- Network connectivity
- Browser console for specific error messages
