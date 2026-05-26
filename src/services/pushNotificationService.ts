
import { supabase } from '@/integrations/supabase/client';

// Public VAPID key (should be replaced with actual key in production)
// You can generate this using `npx web-push generate-vapid-keys`
const PUBLIC_VAPID_KEY = 'BHUP6h0iPZiOiKbvtFD_L-9H3mNZOHuFOvef9i2KLWFdV0zBJCeQNc8nUkwEX8Q8inRo2VdLqNa5ZlQs1kOBnyo';

export const isPushSupported = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
};

export const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const subscribeToPush = async (userId: string | undefined, username: string | undefined) => {
    if (!isPushSupported() || !('Notification' in window)) {
        console.warn('Push notifications not supported in this browser');
        return null;
    }

    try {
        let permission = Notification.permission;

        // Request permission if not already granted or denied
        if (permission === 'default') {
            permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
            console.warn('Notification permission denied');
            return null;
        }

        const registration = await navigator.serviceWorker.ready;

        // Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Subscribe
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });
        }

        console.log('🔔 Push Subscription successful:', subscription);

        // Convert subscription to readable format for DB
        const subscriptionJSON = subscription.toJSON();

        if (!subscriptionJSON.endpoint) return null;

        const { data, error } = await supabase
            .from('push_subscriptions' as any)
            .upsert({
                user_id: userId,
                username: username,
                endpoint: subscriptionJSON.endpoint,
                p256dh: subscriptionJSON.keys?.p256dh,
                auth: subscriptionJSON.keys?.auth,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'endpoint'
            });

        if (error) {
            console.error('❌ Error saving push subscription to Supabase:', error);
            throw error;
        }

        return subscription;
    } catch (error) {
        console.error('❌ Failed to subscribe to push notifications:', error);
        return null;
    }
};

export const unsubscribeFromPush = async () => {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            const endpoint = subscription.endpoint;
            await subscription.unsubscribe();

            // Remove from Supabase
            await supabase
                .from('push_subscriptions' as any)
                .delete()
                .eq('endpoint', endpoint);

            console.log('🔕 Unsubscribed from push notifications');
        }
    } catch (error) {
        console.error('❌ Error during unsubscription:', error);
    }
};

export const checkPushStatus = async () => {
    if (!isPushSupported() || !('Notification' in window)) return 'not_supported';

    if (Notification.permission === 'denied') return 'denied';

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            return 'subscribed';
        } else {
            return Notification.permission === 'granted' ? 'permission_granted' : 'not_subscribed';
        }
    } catch (e) {
        console.error('Error checking push status:', e);
        return 'not_supported';
    }
};
