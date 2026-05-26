# 🚀 REQUIRED: Run This SQL Migration

## What This Does

Creates the `user_preferences` table in your Supabase database to store persistent balance visibility settings for each user.

## How to Run This Migration

### Method 1: Supabase Dashboard (Easiest)

1. Go to your Supabase project at https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **+ New Query**
5. Copy the ENTIRE contents of `20260209000000-create-user-preferences-table.sql`
6. Paste into the SQL editor
7. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
8. ✅ You should see "Success. No rows returned"

### Method 2: Supabase CLI

```bash
npx supabase db push
```

## Verify the Migration Worked

1. In Supabase Dashboard, go to **Table Editor**
2. Look for `user_preferences` table in the list
3. It should have these columns:
   - id
   - user_id
   - username
   - show_balances
   - hide_homepage_balance
   - created_at
   - updated_at

## What Happens After Migration

- All users will have their balance hide/reveal preferences saved to the database
- Preferences persist across logout, refresh, and different devices
- Each user has independent settings that don't affect other users
- Frontend will automatically start using the database for preferences

## Rollback (If Needed)

If you need to remove this table:

```sql
DROP TABLE IF EXISTS public.user_preferences CASCADE;
```

---

**⚠️ Important:** You must run this migration BEFORE the frontend changes will work properly!
