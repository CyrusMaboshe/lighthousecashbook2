/**
 * useGlobalMonthControl
 *
 * Provides a system-wide, admin-controlled active month/year that:
 * - Is persisted in Supabase (admin_logs table with a special sentinel action)
 * - Syncs in real-time to all sessions via Supabase Realtime channel broadcast
 * - Falls back to the current month when no admin override exists
 * - Only admins can write; all users read the same value
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SENTINEL_ACTION = 'system_config:active_month';
const CHANNEL_NAME = 'global-month-control';

export interface GlobalMonthState {
    month: number; // 0-based (Jan=0)
    year: number;
    setByAdmin: boolean;
    isLoading: boolean;
}

interface GlobalMonthContextType extends GlobalMonthState {
    setGlobalMonth: (month: number, year: number) => Promise<void>;
    resetToCurrentMonth: () => Promise<void>;
}

const GlobalMonthContext = createContext<GlobalMonthContextType | undefined>(undefined);

// Helper to get the current wall-clock month/year
function currentMonthYear() {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
}

export function GlobalMonthProvider({ children }: { children: ReactNode }) {
    const { month: curMonth, year: curYear } = currentMonthYear();

    const [state, setState] = useState<GlobalMonthState>({
        month: curMonth,
        year: curYear,
        setByAdmin: false,
        isLoading: true,
    });

    // ─── Load existing config from Supabase ───────────────────────────────────
    const loadFromSupabase = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('admin_logs')
                .select('details, timestamp')
                .eq('action', SENTINEL_ACTION)
                .order('timestamp', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                console.warn('[GlobalMonth] Failed to load config:', error.message);
                setState(s => ({ ...s, isLoading: false }));
                return;
            }

            if (data && data.details) {
                const details = data.details as Record<string, unknown>;
                const savedMonth = typeof details.month === 'number' ? details.month : null;
                const savedYear = typeof details.year === 'number' ? details.year : null;
                const { month: nowM, year: nowY } = currentMonthYear();

                if (savedMonth !== null && savedYear !== null) {
                    // Admin has a stored setting — use it even across month boundaries
                    setState({
                        month: savedMonth,
                        year: savedYear,
                        setByAdmin: true,
                        isLoading: false,
                    });
                    console.log(`[GlobalMonth] Loaded admin setting: ${savedMonth + 1}/${savedYear}`);
                    return;
                }
            }

            // No admin setting → default to current month
            setState({ month: curMonth, year: curYear, setByAdmin: false, isLoading: false });
        } catch (err) {
            console.error('[GlobalMonth] Load error:', err);
            setState(s => ({ ...s, isLoading: false }));
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Realtime: subscribe to changes so all sessions update live ──────────
    useEffect(() => {
        loadFromSupabase();

        // Listen for new inserts to admin_logs with our sentinel action
        const channel = supabase
            .channel(`${CHANNEL_NAME}-${Math.random().toString(36).substring(2, 9)}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'admin_logs',
                    filter: `action=eq.${SENTINEL_ACTION}`,
                },
                (payload) => {
                    const details = payload.new?.details as Record<string, unknown> | undefined;
                    if (!details) return;
                    const m = typeof details.month === 'number' ? details.month : null;
                    const y = typeof details.year === 'number' ? details.year : null;
                    if (m !== null && y !== null) {
                        const isReset = details.reset === true;
                        setState({
                            month: isReset ? currentMonthYear().month : m,
                            year: isReset ? currentMonthYear().year : y,
                            setByAdmin: !isReset,
                            isLoading: false,
                        });
                        console.log(`[GlobalMonth] Real-time update: ${m + 1}/${y} (reset=${isReset})`);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadFromSupabase]);

    // ─── Admin: write new month selection to Supabase ────────────────────────
    const setGlobalMonth = useCallback(async (month: number, year: number) => {
        try {
            const { error } = await supabase.from('admin_logs').insert({
                action: SENTINEL_ACTION,
                performed_by: 'admin',
                details: { month, year, reset: false, updated_at: new Date().toISOString() },
            });

            if (error) {
                console.error('[GlobalMonth] Failed to save:', error.message);
                throw error;
            }

            // Optimistic update for the admin's own session
            setState({ month, year, setByAdmin: true, isLoading: false });
            console.log(`[GlobalMonth] Saved: ${month + 1}/${year}`);
        } catch (err) {
            console.error('[GlobalMonth] setGlobalMonth error:', err);
            throw err;
        }
    }, []);

    // ─── Admin: reset to current month ────────────────────────────────────────
    const resetToCurrentMonth = useCallback(async () => {
        const { month, year } = currentMonthYear();
        try {
            const { error } = await supabase.from('admin_logs').insert({
                action: SENTINEL_ACTION,
                performed_by: 'admin',
                details: { month, year, reset: true, updated_at: new Date().toISOString() },
            });

            if (error) {
                console.error('[GlobalMonth] Failed to reset:', error.message);
                throw error;
            }

            setState({ month, year, setByAdmin: false, isLoading: false });
            console.log(`[GlobalMonth] Reset to current: ${month + 1}/${year}`);
        } catch (err) {
            console.error('[GlobalMonth] resetToCurrentMonth error:', err);
            throw err;
        }
    }, []);

    return (
        <GlobalMonthContext.Provider value={{ ...state, setGlobalMonth, resetToCurrentMonth }}>
            {children}
        </GlobalMonthContext.Provider>
    );
}

export function useGlobalMonthControl() {
    const ctx = useContext(GlobalMonthContext);
    if (!ctx) throw new Error('useGlobalMonthControl must be used within GlobalMonthProvider');
    return ctx;
}
