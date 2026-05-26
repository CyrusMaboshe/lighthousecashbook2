
// Supabase Edge Function: send-push
// This function sends web push notifications to subscribed users

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import WebPush from "https://esm.sh/web-push@3.6.4"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // VAPID keys from environment variables
        const vapidSubject = `mailto:${Deno.env.get('ADMIN_EMAIL') ?? 'admin@example.com'}`;
        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';

        WebPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

        const { transaction } = await req.json()

        if (!transaction) {
            return new Response(JSON.stringify({ error: 'Missing transaction data' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Fetch all active push subscriptions
        const { data: subscriptions, error: subError } = await supabaseClient
            .from('push_subscriptions')
            .select('*')

        if (subError) throw subError

        const notificationPayload = JSON.stringify({
            title: transaction.type === 'cash-in' ? '💰 New Deposit' : '💸 New Withdrawal',
            body: `${transaction.added_by} processed ZMW ${transaction.amount.toFixed(2)} for ${transaction.customer_name}`,
            icon: '/cash-wallet-icon.svg',
            url: `/transactions/${transaction.id}`
        })

        const results = await Promise.allSettled(
            subscriptions.map(async (sub: { endpoint: string; p256dh: string; auth: string; id: string }) => {
                try {
                    const pushSubscription = {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth,
                        }
                    }

                    return await WebPush.sendNotification(
                        pushSubscription,
                        notificationPayload
                    )
                } catch (err: unknown) {
                    const pushErr = err as { statusCode?: number };
                    console.error(`Error sending to ${sub.endpoint}:`, err)
                    if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                        await supabaseClient.from('push_subscriptions').delete().eq('id', sub.id)
                    }
                    throw err
                }
            })
        )

        return new Response(JSON.stringify({ success: true, dispatched: results.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: errMsg }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})