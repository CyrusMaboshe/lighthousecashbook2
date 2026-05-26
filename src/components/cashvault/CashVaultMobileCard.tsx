import React, { useState, useEffect } from 'react';
import { Vault } from 'lucide-react';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface CashVaultBalance {
  id: string;
  current_balance: string;
  last_updated: string;
  updated_by: string;
  updated_by_user_id: string | null;
}

export function CashVaultMobileCard() {
  const { isAdmin, currentUser } = useAuth();
  const [balance, setBalance] = useState<CashVaultBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch data for admin users
    if (!isAdmin || !currentUser) {
      setLoading(false);
      return;
    }

    const fetchBalance = async () => {
      try {
        console.log('Fetching Cash Vault balance for mobile...');
        const { data, error } = await supabase
          .from('cashvault_balance')
          .select('*')
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No balance record found, create initial balance
            console.log('Creating initial Cash Vault balance...');
            const { data: insertData, error: insertError } = await supabase
              .from('cashvault_balance')
              .insert({
                current_balance: 0,
                updated_by: currentUser.username || 'Admin',
                updated_by_user_id: currentUser.id
              })
              .select()
              .single();

            if (insertError) {
              console.error('Error creating initial balance:', insertError);
              setError('Failed to initialize Cash Vault');
            } else {
              console.log('Initial balance created:', insertData);
              setBalance(insertData);
            }
          } else {
            console.error('Error fetching balance:', error);
            setError('Failed to fetch Cash Vault balance');
          }
        } else {
          console.log('Cash Vault balance fetched:', data);
          setBalance(data);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();

    // Set up real-time subscription for balance updates
    const balanceSubscription = supabase
      .channel('cashvault_balance_mobile_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cashvault_balance'
        },
        (payload) => {
          console.log('Cash Vault balance updated (mobile):', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setBalance(payload.new as CashVaultBalance);
          }
        }
      )
      .subscribe();

    return () => {
      balanceSubscription.unsubscribe();
    };
  }, [isAdmin, currentUser]);

  // Don't render anything for non-admin users
  if (!isAdmin) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="mobile-balance-item bg-gradient-to-br from-gray-400 to-gray-500">
        <div className="mobile-icon-wrapper">
          <Vault className="w-5 h-5 text-white" />
        </div>
        <div className="mobile-balance-content">
          <p className="mobile-balance-label">Cash Vault</p>
          <p className="mobile-balance-value">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mobile-balance-item bg-gradient-to-br from-red-500 to-red-600">
        <div className="mobile-icon-wrapper">
          <Vault className="w-5 h-5 text-white" />
        </div>
        <div className="mobile-balance-content">
          <p className="mobile-balance-label">Cash Vault</p>
          <p className="mobile-balance-value">Error</p>
        </div>
      </div>
    );
  }

  // Normal state with balance
  return (
    <div className="mobile-balance-item bg-gradient-to-br from-indigo-500 to-indigo-600">
      <div className="mobile-icon-wrapper">
        <Vault className="w-5 h-5 text-white" />
      </div>
      <div className="mobile-balance-content">
        <p className="mobile-balance-label">Cash Vault</p>
        <p className="mobile-balance-value">
          ZMW <AnimatedNumber value={Number(balance?.current_balance) || 0} decimals={2} />
        </p>
      </div>
    </div>
  );
}

// Masked version for when balances are hidden
export function CashVaultMobileCardMasked() {
  const { isAdmin } = useAuth();

  // Don't render anything for non-admin users
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="mobile-balance-item bg-gradient-to-br from-indigo-500 to-indigo-600">
      <div className="mobile-icon-wrapper">
        <Vault className="w-5 h-5 text-white" />
      </div>
      <div className="mobile-balance-content">
        <p className="mobile-balance-label">Cash Vault</p>
        <p className="mobile-balance-value">****</p>
      </div>
    </div>
  );
}
