
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToPush, checkPushStatus, isPushSupported } from '@/services/pushNotificationService';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PushNotificationManager() {
    const { currentUser } = useAuth();
    const [status, setStatus] = useState<'loading' | 'subscribed' | 'not_subscribed' | 'permission_granted' | 'not_supported' | 'denied'>('loading');
    const [dismissed, setDismissed] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!currentUser) return;

        if (localStorage.getItem('push_prompt_dismissed') === 'true') {
            setDismissed(true);
        }

        const syncStatus = async () => {
            const pushStatus = await checkPushStatus();
            setStatus(pushStatus as any);

            // Auto-subscribe if permission is already granted but no subscription exists
            if (pushStatus === 'permission_granted') {
                await handleSubscribe();
            }
        };

        syncStatus();
    }, [currentUser]);

    const handleSubscribe = async () => {
        if (!currentUser) return;

        setStatus('loading');
        const subscription = await subscribeToPush(currentUser.id, currentUser.username);

        if (subscription) {
            setStatus('subscribed');
            toast({
                title: "Notifications Enabled",
                description: "You will now receive background alerts for important transactions.",
            });
        } else {
            setStatus('denied');
            toast({
                title: "Updates Disabled",
                description: "We couldn't enable background notifications. Please check your browser settings.",
                variant: "destructive"
            });
        }
    };

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDismissed(true);
        localStorage.setItem('push_prompt_dismissed', 'true');
    }

    if (!isPushSupported() || !currentUser || dismissed) return null;

    // Don't show if denied or not supported
    if (status === 'not_supported' || status === 'denied') return null;

    // We can show a small prompt if not subscribed
    if (status === 'not_subscribed') {
        return (
            <div className="fixed top-24 right-4 z-50 animate-in fade-in slide-in-from-top-5">
                <div className="relative group">
                    <Button
                        onClick={handleSubscribe}
                        className="bg-[#0a0a0b]/80 backdrop-blur-xl border border-white/10 hover:bg-[#1a1a1c] text-white shadow-2xl flex items-center gap-3 rounded-full pl-4 pr-10 py-6 ring-1 ring-white/5"
                    >
                        <div className="bg-emerald-500/20 p-2 rounded-full ring-1 ring-emerald-500/30">
                            <Bell className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="text-left leading-tight">
                            <p className="text-sm font-bold text-slate-200">Enable Alerts</p>
                            <p className="text-[10px] text-slate-400">Get notified on deposits</p>
                        </div>
                    </Button>
                    <button
                        onClick={handleDismiss}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>
            </div>
        );
    }

    return null; // Headless if already subscribed
}
