
import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function TransactionNotifications() {
    const { toast } = useToast();
    const { currentUser } = useAuth();
    const { isOnline } = useNetworkStatus();

    useEffect(() => {
        if (!currentUser || !isOnline) return;

        console.log('🔔 Initializing Global Transaction Notifications');

        const channel = supabase
            .channel('global-transaction-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'transactions'
                },
                (payload) => {
                    const newTransaction = payload.new;

                    // Don't notify for own transactions (already handled by UI feedback)
                    if (newTransaction.added_by === currentUser.username) {
                        return;
                    }

                    console.log('🔔 New transaction notification received:', newTransaction);

                    const isCashIn = newTransaction.type === 'cash-in';
                    const symbol = isCashIn ? '+' : '-';
                    const amount = parseFloat(newTransaction.amount).toFixed(2);

                    toast({
                        title: isCashIn ? "New Cash In" : "New Cash Out",
                        description: `${newTransaction.added_by} processed ZMW ${amount} for ${newTransaction.customer_name}`,
                        variant: "default", // or custom variant for notifications
                        duration: 5000,
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser, isOnline, toast]);

    return null; // Headless component
}
