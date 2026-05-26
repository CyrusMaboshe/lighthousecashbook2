-- Migration to sync Emergency Fund when main transactions are edited or deleted
-- This ensures that deleting/editing an EF transfer in the main view stays in sync

-- 1. Create a function to handle transaction syncing
CREATE OR REPLACE FUNCTION public.sync_emergency_fund_on_transaction_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    ef_record_id UUID;
    ef_amount NUMERIC;
    ef_action_type TEXT;
BEGIN
    -- Only act if it's an Emergency Fund related transaction
    IF (OLD.category_name = 'Emergency Fund Transfer' OR OLD.customer_name = 'Emergency Fund') THEN
        
        -- Find the corresponding EF transaction
        -- Since we don't have a direct link (yet), we match by date and amount (closest matching)
        SELECT id, amount, action_type INTO ef_record_id, ef_amount, ef_action_type
        FROM public.emergency_fund_transactions
        WHERE date = OLD.date 
          AND amount = OLD.amount
        ORDER BY created_at DESC
        LIMIT 1;

        IF ef_record_id IS NOT NULL THEN
            -- IF DELETING: Remove EF record and undo balance change
            IF (TG_OP = 'DELETE') THEN
                -- Delete the EF transaction record
                DELETE FROM public.emergency_fund_transactions WHERE id = ef_record_id;
                
                -- Undo balance change
                IF ef_action_type = 'deposit' THEN
                    UPDATE public.emergency_fund_balance SET current_balance = current_balance - ef_amount, last_updated = NOW();
                ELSE
                    UPDATE public.emergency_fund_balance SET current_balance = current_balance + ef_amount, last_updated = NOW();
                END IF;

            -- IF UPDATING: Sync amount/date changes
            ELSIF (TG_OP = 'UPDATE') THEN
                -- If amount changed, update EF record and balance
                IF (OLD.amount != NEW.amount) THEN
                    -- Update EF transaction record
                    UPDATE public.emergency_fund_transactions 
                    SET amount = NEW.amount, updated_at = NOW(), note = NEW.details
                    WHERE id = ef_record_id;
                    
                    -- Update balance (remove old, add new)
                    IF ef_action_type = 'deposit' THEN
                        UPDATE public.emergency_fund_balance SET current_balance = current_balance - OLD.amount + NEW.amount, last_updated = NOW();
                    ELSE
                        UPDATE public.emergency_fund_balance SET current_balance = current_balance + OLD.amount - NEW.amount, last_updated = NOW();
                    END IF;
                END IF;

                -- If date changed, update EF record
                IF (OLD.date != NEW.date) THEN
                    UPDATE public.emergency_fund_transactions SET date = NEW.date WHERE id = ef_record_id;
                END IF;
            END IF;
        END IF;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS sync_ef_transaction_trigger ON public.transactions;
CREATE TRIGGER sync_ef_transaction_trigger
    BEFORE DELETE OR UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_emergency_fund_on_transaction_change();

-- 3. Also do the same for Savings to be thorough (as per "all transactions" request)
CREATE OR REPLACE FUNCTION public.sync_savings_on_transaction_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    savings_record_id UUID;
    savings_amount NUMERIC;
    savings_action_type TEXT;
BEGIN
    IF (OLD.category_name = 'Savings Transfer' OR OLD.customer_name = 'Savings') THEN
        
        SELECT id, amount, action_type INTO savings_record_id, savings_amount, savings_action_type
        FROM public.savings_transactions
        WHERE (date = OLD.date OR created_at::date = OLD.date)
          AND amount = OLD.amount
        ORDER BY created_at DESC
        LIMIT 1;

        IF savings_record_id IS NOT NULL THEN
            IF (TG_OP = 'DELETE') THEN
                DELETE FROM public.savings_transactions WHERE id = savings_record_id;
                
                IF savings_action_type = 'deposit' THEN
                    UPDATE public.savings_balance SET current_balance = current_balance - savings_amount, last_updated = NOW();
                ELSE
                    UPDATE public.savings_balance SET current_balance = current_balance + savings_amount, last_updated = NOW();
                END IF;

            ELSIF (TG_OP = 'UPDATE') THEN
                IF (OLD.amount != NEW.amount) THEN
                    UPDATE public.savings_transactions 
                    SET amount = NEW.amount, updated_at = NOW(), description = NEW.details
                    WHERE id = savings_record_id;
                    
                    IF savings_action_type = 'deposit' THEN
                        UPDATE public.savings_balance SET current_balance = current_balance - OLD.amount + NEW.amount, last_updated = NOW();
                    ELSE
                        UPDATE public.savings_balance SET current_balance = current_balance + OLD.amount - NEW.amount, last_updated = NOW();
                    END IF;
                END IF;

                IF (OLD.date != NEW.date) THEN
                    UPDATE public.savings_transactions SET date = NEW.date WHERE id = savings_record_id;
                END IF;
            END IF;
        END IF;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS sync_savings_transaction_trigger ON public.transactions;
CREATE TRIGGER sync_savings_transaction_trigger
    BEFORE DELETE OR UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_savings_on_transaction_change();
