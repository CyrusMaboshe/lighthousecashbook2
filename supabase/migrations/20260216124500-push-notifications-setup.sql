
-- Migration to create push_subscriptions table for background push notifications

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT, -- Fallback for legacy users
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own subscriptions" 
ON public.push_subscriptions
FOR ALL 
TO authenticated
USING (auth.uid() = user_id);

-- Legacy policy for username-based matching if needed
CREATE POLICY "Users can manage by username"
ON public.push_subscriptions
FOR ALL
TO authenticated
USING (username = (SELECT username FROM public.users WHERE id = auth.uid()));

-- Index for performance
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_username_idx ON public.push_subscriptions(username);

-- Function to clean up old subscriptions
CREATE OR REPLACE FUNCTION public.cleanup_push_subscriptions()
RETURNS trigger AS $$
BEGIN
    -- Delete other subscriptions for the same endpoint if they exist
    DELETE FROM public.push_subscriptions WHERE endpoint = NEW.endpoint AND id != NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_push_subscriptions
BEFORE INSERT ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.cleanup_push_subscriptions();

-- Add entries to user_preferences to track if notifications are enabled
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT true;
