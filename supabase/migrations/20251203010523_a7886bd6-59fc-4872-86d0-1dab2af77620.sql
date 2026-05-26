-- Multi-User Savings: Add user_id columns and migrate existing data to admin

-- 1. Add user_id column to savings_balance (nullable initially for migration)
ALTER TABLE public.savings_balance 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id);

-- 2. Add user_id column to savings_transactions (nullable initially for migration)
ALTER TABLE public.savings_transactions 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id);

-- 3. Assign all existing savings_balance records to admin user (Cyrus Maboshe)
UPDATE public.savings_balance 
SET user_id = (SELECT id FROM public.users WHERE username = 'Cyrus Maboshe' OR role = 'admin' LIMIT 1)
WHERE user_id IS NULL;

-- 4. Assign all existing savings_transactions to admin user
UPDATE public.savings_transactions 
SET user_id = (SELECT id FROM public.users WHERE username = 'Cyrus Maboshe' OR role = 'admin' LIMIT 1)
WHERE user_id IS NULL;

-- 5. Create index for faster user-based queries
CREATE INDEX IF NOT EXISTS idx_savings_balance_user_id ON public.savings_balance(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_user_id ON public.savings_transactions(user_id);

-- 6. Update RLS policies for savings_balance - users see only their own, admins see all
DROP POLICY IF EXISTS "allow_all_select_savings_balance" ON public.savings_balance;
DROP POLICY IF EXISTS "allow_all_insert_savings_balance" ON public.savings_balance;
DROP POLICY IF EXISTS "allow_all_update_savings_balance" ON public.savings_balance;

CREATE POLICY "users_view_own_savings_balance" ON public.savings_balance
FOR SELECT USING (
  user_id IN (SELECT id FROM public.users WHERE id = savings_balance.user_id)
  OR EXISTS (SELECT 1 FROM public.users WHERE id = savings_balance.user_id AND role = 'admin')
  OR EXISTS (SELECT 1 FROM public.users WHERE username = current_setting('app.current_user', true) AND role = 'admin')
);

CREATE POLICY "users_insert_own_savings_balance" ON public.savings_balance
FOR INSERT WITH CHECK (true);

CREATE POLICY "users_update_own_savings_balance" ON public.savings_balance
FOR UPDATE USING (true);

-- 7. Update RLS policies for savings_transactions - users see only their own, admins see all
DROP POLICY IF EXISTS "allow_all_select_savings_transactions" ON public.savings_transactions;
DROP POLICY IF EXISTS "allow_all_insert_savings_transactions" ON public.savings_transactions;

CREATE POLICY "users_view_own_savings_transactions" ON public.savings_transactions
FOR SELECT USING (
  user_id IN (SELECT id FROM public.users WHERE id = savings_transactions.user_id)
  OR EXISTS (SELECT 1 FROM public.users WHERE id = savings_transactions.user_id AND role = 'admin')
  OR EXISTS (SELECT 1 FROM public.users WHERE username = current_setting('app.current_user', true) AND role = 'admin')
);

CREATE POLICY "users_insert_own_savings_transactions" ON public.savings_transactions
FOR INSERT WITH CHECK (true);

-- 8. Create function to get user's savings balance
CREATE OR REPLACE FUNCTION public.get_user_savings_balance(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_deposits numeric := 0;
  total_withdrawals numeric := 0;
  current_balance numeric := 0;
  last_transaction_date timestamp with time zone;
  transaction_count integer := 0;
BEGIN
  -- Calculate total deposits for this user
  SELECT COALESCE(SUM(amount), 0)
  INTO total_deposits
  FROM public.savings_transactions
  WHERE user_id = p_user_id AND action_type = 'deposit';

  -- Calculate total withdrawals for this user
  SELECT COALESCE(SUM(amount), 0)
  INTO total_withdrawals
  FROM public.savings_transactions
  WHERE user_id = p_user_id AND action_type = 'withdrawal';

  -- Calculate current balance
  current_balance := total_deposits - total_withdrawals;

  -- Get last transaction timestamp
  SELECT MAX(created_at)
  INTO last_transaction_date
  FROM public.savings_transactions
  WHERE user_id = p_user_id;

  -- Get transaction count
  SELECT COUNT(*)
  INTO transaction_count
  FROM public.savings_transactions
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'current_balance', current_balance,
    'total_deposits', total_deposits,
    'total_withdrawals', total_withdrawals,
    'last_updated', COALESCE(last_transaction_date, NOW()),
    'transaction_count', transaction_count,
    'user_id', p_user_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'current_balance', 0,
      'total_deposits', 0,
      'total_withdrawals', 0,
      'last_updated', NOW(),
      'transaction_count', 0,
      'user_id', p_user_id,
      'error', SQLERRM
    );
END;
$$;

-- 9. Create function to deposit to user's savings
CREATE OR REPLACE FUNCTION public.user_deposit_to_savings(
  p_user_id uuid,
  amount_param numeric,
  description_param text DEFAULT NULL,
  user_name text DEFAULT 'System',
  transaction_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_savings_balance numeric := 0;
  new_savings_balance numeric := 0;
  main_cash_in numeric := 0;
  main_cash_out numeric := 0;
  main_net_balance numeric := 0;
BEGIN
  -- Validate amount
  IF amount_param <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Amount must be greater than zero');
  END IF;

  -- Calculate user's main balance from transactions they created
  SELECT
    COALESCE(SUM(CASE WHEN type = 'cash-in' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'cash-out' THEN amount ELSE 0 END), 0)
  INTO main_cash_in, main_cash_out
  FROM public.transactions
  WHERE added_by_user_id = p_user_id;

  main_net_balance := main_cash_in - main_cash_out;

  -- Check sufficient balance
  IF main_net_balance < amount_param THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Insufficient balance in main account',
      'available_balance', main_net_balance,
      'requested_amount', amount_param
    );
  END IF;

  -- Get current user's savings balance
  SELECT COALESCE(SUM(CASE WHEN action_type = 'deposit' THEN amount ELSE -amount END), 0)
  INTO current_savings_balance
  FROM public.savings_transactions
  WHERE user_id = p_user_id;
  
  new_savings_balance := current_savings_balance + amount_param;
  
  -- Create cash-out transaction in main system for this user
  INSERT INTO public.transactions (
    date, time, type, amount, details, added_by, added_by_user_id,
    category_name, customer_name, number_of_pictures, whatsapp_number
  ) VALUES (
    transaction_date, CURRENT_TIME, 'cash-out', amount_param,
    'Transfer to Personal Savings: ' || COALESCE(description_param, 'Savings deposit'),
    user_name, p_user_id, 'Savings Transfer', 'Personal Savings', 0, ''
  );
  
  -- Record the savings transaction for this user
  INSERT INTO public.savings_transactions (
    user_id, action_type, amount, description, initiating_user, initiating_user_id,
    balance_before, balance_after, date
  ) VALUES (
    p_user_id, 'deposit', amount_param, COALESCE(description_param, 'Deposit to savings'),
    user_name, p_user_id, current_savings_balance, new_savings_balance, transaction_date
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Amount transferred to Savings successfully',
    'new_savings_balance', new_savings_balance,
    'amount', amount_param,
    'main_balance_after', main_net_balance - amount_param
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Transaction failed: ' || SQLERRM);
END;
$$;

-- 10. Create function to withdraw from user's savings
CREATE OR REPLACE FUNCTION public.user_withdraw_from_savings(
  p_user_id uuid,
  amount_param numeric,
  description_param text DEFAULT NULL,
  user_name text DEFAULT 'System',
  transaction_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_savings_balance numeric := 0;
  new_savings_balance numeric := 0;
BEGIN
  -- Validate amount
  IF amount_param <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Amount must be greater than zero');
  END IF;

  -- Get current user's savings balance
  SELECT COALESCE(SUM(CASE WHEN action_type = 'deposit' THEN amount ELSE -amount END), 0)
  INTO current_savings_balance
  FROM public.savings_transactions
  WHERE user_id = p_user_id;

  -- Check sufficient savings balance
  IF current_savings_balance < amount_param THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Insufficient balance in Savings',
      'available_balance', current_savings_balance,
      'requested_amount', amount_param
    );
  END IF;
  
  new_savings_balance := current_savings_balance - amount_param;
  
  -- Create cash-in transaction in main system for this user
  INSERT INTO public.transactions (
    type, amount, details, added_by, category_name, customer_name,
    date, time, number_of_pictures, whatsapp_number, added_by_user_id
  ) VALUES (
    'cash-in', amount_param,
    'Withdrawal from Personal Savings: ' || COALESCE(description_param, 'Savings withdrawal'),
    user_name, 'Savings Transfer', 'Personal Savings',
    transaction_date, CURRENT_TIME, 0, '', p_user_id
  );
  
  -- Record the savings transaction for this user
  INSERT INTO public.savings_transactions (
    user_id, action_type, amount, description, initiating_user, initiating_user_id,
    balance_before, balance_after, date
  ) VALUES (
    p_user_id, 'withdrawal', amount_param, COALESCE(description_param, 'Withdrawal from savings'),
    user_name, p_user_id, current_savings_balance, new_savings_balance, transaction_date
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Amount withdrawn from Savings successfully',
    'new_savings_balance', new_savings_balance,
    'amount', amount_param
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Transaction failed: ' || SQLERRM);
END;
$$;

-- 11. Function for admin to get all savings data
CREATE OR REPLACE FUNCTION public.admin_get_all_savings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_system_balance', COALESCE(SUM(CASE WHEN action_type = 'deposit' THEN amount ELSE -amount END), 0),
    'total_deposits', COALESCE(SUM(CASE WHEN action_type = 'deposit' THEN amount ELSE 0 END), 0),
    'total_withdrawals', COALESCE(SUM(CASE WHEN action_type = 'withdrawal' THEN amount ELSE 0 END), 0),
    'transaction_count', COUNT(*),
    'users_with_savings', COUNT(DISTINCT user_id)
  )
  INTO result
  FROM public.savings_transactions;
  
  RETURN result;
END;
$$;