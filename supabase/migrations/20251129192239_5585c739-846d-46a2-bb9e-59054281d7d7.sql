-- Create savings_balance table to track the current savings balance
CREATE TABLE IF NOT EXISTS public.savings_balance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_balance numeric NOT NULL DEFAULT 0,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  updated_by text NOT NULL,
  updated_by_user_id uuid REFERENCES public.users(id),
  CONSTRAINT positive_balance CHECK (current_balance >= 0)
);

-- Create savings_transactions table to log all savings operations
CREATE TABLE IF NOT EXISTS public.savings_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL CHECK (action_type IN ('deposit', 'withdrawal')),
  amount numeric NOT NULL CHECK (amount > 0),
  description text,
  initiating_user text NOT NULL,
  initiating_user_id uuid REFERENCES public.users(id),
  balance_before numeric NOT NULL,
  balance_after numeric NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  time time NOT NULL DEFAULT CURRENT_TIME,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.savings_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for savings_balance
CREATE POLICY "Admins can view savings balance"
  ON public.savings_balance FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.auth_user_id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can insert savings balance"
  ON public.savings_balance FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.auth_user_id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can update savings balance"
  ON public.savings_balance FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.auth_user_id = auth.uid() AND users.role = 'admin'
  ));

-- RLS Policies for savings_transactions
CREATE POLICY "Admins can view savings transactions"
  ON public.savings_transactions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.auth_user_id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can insert savings transactions"
  ON public.savings_transactions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.auth_user_id = auth.uid() AND users.role = 'admin'
  ));

-- Create function to deposit money into savings
CREATE OR REPLACE FUNCTION public.deposit_to_savings(
  amount_param numeric,
  description_param text DEFAULT NULL,
  user_name text DEFAULT 'System'
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
  user_id_param uuid;
  result jsonb;
BEGIN
  -- Get user ID
  SELECT id INTO user_id_param
  FROM public.users
  WHERE username = user_name
  LIMIT 1;

  -- Calculate current main system balance
  SELECT
    COALESCE(SUM(CASE WHEN type = 'cash-in' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'cash-out' THEN amount ELSE 0 END), 0)
  INTO main_cash_in, main_cash_out
  FROM public.transactions;

  main_net_balance := main_cash_in - main_cash_out;

  -- Check if there's enough balance in main account
  IF main_net_balance < amount_param THEN
    result := jsonb_build_object(
      'success', false,
      'message', 'Insufficient balance in main account',
      'available_balance', main_net_balance,
      'requested_amount', amount_param
    );
    RETURN result;
  END IF;

  -- Get or create savings balance
  SELECT current_balance INTO current_savings_balance
  FROM public.savings_balance
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.savings_balance (current_balance, updated_by, updated_by_user_id)
    VALUES (0, user_name, user_id_param);
    current_savings_balance := 0;
  END IF;
  
  new_savings_balance := current_savings_balance + amount_param;
  
  -- ATOMIC TRANSACTION
  BEGIN
    -- Update savings balance
    UPDATE public.savings_balance 
    SET current_balance = new_savings_balance,
        updated_by = user_name,
        updated_by_user_id = user_id_param,
        last_updated = NOW()
    WHERE id = (SELECT id FROM public.savings_balance LIMIT 1);
    
    -- Create cash-out transaction in main system
    INSERT INTO public.transactions (
      date, time, type, amount, details, added_by, added_by_user_id,
      category_name, customer_name, number_of_pictures, whatsapp_number
    ) VALUES (
      CURRENT_DATE, CURRENT_TIME, 'cash-out', amount_param,
      'Transfer to Savings: ' || COALESCE(description_param, 'Savings deposit'),
      user_name, user_id_param, 'Savings Transfer', user_name, 0, ''
    );
    
    -- Record the savings transaction
    INSERT INTO public.savings_transactions (
      action_type, amount, description, initiating_user, initiating_user_id,
      balance_before, balance_after
    ) VALUES (
      'deposit', amount_param, COALESCE(description_param, 'Deposit to savings'),
      user_name, user_id_param, current_savings_balance, new_savings_balance
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      result := jsonb_build_object(
        'success', false,
        'message', 'Transaction failed: ' || SQLERRM,
        'error_code', SQLSTATE
      );
      RETURN result;
  END;
  
  result := jsonb_build_object(
    'success', true,
    'message', 'Amount transferred to Savings successfully',
    'new_savings_balance', new_savings_balance,
    'amount', amount_param,
    'main_balance_after', main_net_balance - amount_param
  );
  
  RETURN result;
END;
$$;

-- Create function to withdraw money from savings
CREATE OR REPLACE FUNCTION public.withdraw_from_savings(
  amount_param numeric,
  description_param text DEFAULT NULL,
  user_name text DEFAULT 'System'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_savings_balance numeric := 0;
  new_savings_balance numeric := 0;
  user_id_param uuid;
  result jsonb;
BEGIN
  -- Get user ID
  SELECT id INTO user_id_param
  FROM public.users
  WHERE username = user_name
  LIMIT 1;

  -- Get current savings balance
  SELECT current_balance INTO current_savings_balance
  FROM public.savings_balance
  LIMIT 1;

  IF NOT FOUND THEN
    result := jsonb_build_object(
      'success', false,
      'message', 'Savings account not initialized',
      'available_balance', 0,
      'requested_amount', amount_param
    );
    RETURN result;
  END IF;

  -- Check if there's enough balance in savings
  IF current_savings_balance < amount_param THEN
    result := jsonb_build_object(
      'success', false,
      'message', 'Insufficient balance in Savings',
      'available_balance', current_savings_balance,
      'requested_amount', amount_param
    );
    RETURN result;
  END IF;
  
  new_savings_balance := current_savings_balance - amount_param;
  
  -- ATOMIC TRANSACTION
  BEGIN
    -- Update savings balance
    UPDATE public.savings_balance 
    SET current_balance = new_savings_balance,
        updated_by = user_name,
        updated_by_user_id = user_id_param,
        last_updated = NOW()
    WHERE id = (SELECT id FROM public.savings_balance LIMIT 1);
    
    -- Create cash-in transaction in main system
    INSERT INTO public.transactions (
      type, amount, details, added_by, category_name, customer_name,
      date, time, number_of_pictures, whatsapp_number, added_by_user_id
    ) VALUES (
      'cash-in', amount_param,
      'Withdrawal from Savings: ' || COALESCE(description_param, 'Savings withdrawal'),
      user_name, 'Savings Transfer', user_name,
      CURRENT_DATE, CURRENT_TIME, 0, '', user_id_param
    );
    
    -- Record the savings transaction
    INSERT INTO public.savings_transactions (
      action_type, amount, description, initiating_user, initiating_user_id,
      balance_before, balance_after
    ) VALUES (
      'withdrawal', amount_param, COALESCE(description_param, 'Withdrawal from savings'),
      user_name, user_id_param, current_savings_balance, new_savings_balance
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      result := jsonb_build_object(
        'success', false,
        'message', 'Transaction failed: ' || SQLERRM,
        'error_code', SQLSTATE
      );
      RETURN result;
  END;
  
  result := jsonb_build_object(
    'success', true,
    'message', 'Amount withdrawn from Savings successfully',
    'new_savings_balance', new_savings_balance,
    'amount', amount_param
  );
  
  RETURN result;
END;
$$;

-- Create trigger function for logging savings actions
CREATE OR REPLACE FUNCTION public.log_savings_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  action_desc text;
  action_type_val text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.action_type = 'deposit' THEN
      action_type_val := 'savings_deposit';
      action_desc := format('Savings deposit: ZMW %s', NEW.amount);
    ELSE
      action_type_val := 'savings_withdrawal';
      action_desc := format('Savings withdrawal: ZMW %s', NEW.amount);
    END IF;

    PERFORM public.log_user_action(
      NEW.initiating_user_id,
      NEW.initiating_user,
      action_type_val,
      action_desc,
      jsonb_build_object(
        'savings_transaction_id', NEW.id,
        'action_type', NEW.action_type,
        'amount', NEW.amount,
        'description', NEW.description,
        'balance_before', NEW.balance_before,
        'balance_after', NEW.balance_after
      )
    );
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- Create trigger for savings transactions
CREATE TRIGGER log_savings_transaction_trigger
  AFTER INSERT ON public.savings_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_savings_action();

-- Create index for better query performance
CREATE INDEX idx_savings_transactions_user_id ON public.savings_transactions(initiating_user_id);
CREATE INDEX idx_savings_transactions_date ON public.savings_transactions(date DESC);

COMMENT ON TABLE public.savings_balance IS 'Stores the current savings account balance';
COMMENT ON TABLE public.savings_transactions IS 'Logs all savings deposit and withdrawal transactions';
COMMENT ON FUNCTION public.deposit_to_savings IS 'Deposits money from main account to savings';
COMMENT ON FUNCTION public.withdraw_from_savings IS 'Withdraws money from savings to main account';