-- Clear Emergency Fund data as requested
DELETE FROM public.emergency_fund_transactions;
UPDATE public.emergency_fund_balance SET current_balance = 0, last_updated = NOW(), updated_by = 'System';
