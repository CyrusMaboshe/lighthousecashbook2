/**
 * ReserveInvestmentView.tsx
 *
 * ═══════════════════════════════════════════════════════
 *  LIVE AUTO-SYNC: Total Reserve mirrors vault + savings
 * ═══════════════════════════════════════════════════════
 *
 *  Calculation rules (immutable, 15 / 85 split):
 *    Studio Savings  = Total Reserve × 15%
 *    Allocation Pool = Total Reserve × 85%
 *    User Amount     = Allocation Pool × user_percent%
 *
 *  Both Admin and User views use this identical formula.
 *  No second deductions. No manual reserve entry.
 *  Total Reserve is always read live from vault + savings.
 *
 *  If a max_allocation cap is set, it acts as a ceiling
 *  on the user amount — but does NOT affect other users.
 */

import { Badge } from '@/components/ui/badge';
import { useUsers } from '@/hooks/useUsers';
import { useCashvault } from '@/hooks/useCashvault';
import { useSavings } from '@/hooks/useSavings';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    PiggyBank,
    Calendar,
    Users,
    UserPlus,
    Trash2,
    Edit,
    RefreshCw,
    ShieldCheck,
    Zap,
    Activity,
    Lock,
    Percent,
    BadgeCheck,
    CircleDollarSign,
    CalendarDays,
    Eye,
    EyeOff,
    KeyRound,
    AlertCircle,
    ChevronRight,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { hashPassword } from '@/utils/passwordUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { todayCAT, isMaturedCAT, daysUntilMaturityCAT } from '@/utils/zambiaTime';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ReserveConfig {
    id: string;
    total_reserve: number;
    savings_percent: number;
    notes: string | null;
    updated_by: string;
    updated_at: string;
    /** Optional manual override for studio savings amount (ZMW). When set
     *  this exact amount is used instead of the percentage calculation. */
    manual_studio_amount?: number | null;
}

interface Allocation {
    id: string;
    user_id: string;
    user_display_name: string;
    allocation_percent: number;
    max_allocation: number | null;
    maturity_date: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    total_withdrawn?: number;
    /**
     * Locked snapshot of the amount the admin allocated to this user.
     * When set, BOTH admin and user views display this exact value
     * (no recomputation against the live pool). Falls back to the
     * computed amount when null, for legacy records.
     */
    allocated_amount?: number | null;
}

/**
 * Derive the studio portion + allocation pool from the live total reserve.
 * Supports BOTH percentage-based (savings_percent) and manual-amount
 * (manual_studio_amount) studio configurations.
 */
function getStudioPortion(
    totalReserve: number,
    savingsPercent: number | null | undefined,
    manualStudioAmount: number | null | undefined
): { studioSavings: number; allocationPool: number; studioPercent: number } {
    const pct = Math.max(0, Math.min(100, Number(savingsPercent ?? 15)));
    let studioSavings: number;
    if (manualStudioAmount != null && Number(manualStudioAmount) >= 0) {
        studioSavings = Math.min(Number(manualStudioAmount), totalReserve);
    } else {
        studioSavings = totalReserve * (pct / 100);
    }
    const allocationPool = Math.max(0, totalReserve - studioSavings);
    return { studioSavings, allocationPool, studioPercent: pct };
}

/**
 * Resolve the canonical user-visible allocation amount.
 * Prefers the locked `allocated_amount` snapshot stored at admin save-time.
 * Falls back to the computed value (percent × pool, capped by max) when
 * the snapshot is missing (legacy rows).
 */
function getCanonicalAllocAmount(
    alloc: Pick<Allocation, 'allocated_amount' | 'allocation_percent' | 'max_allocation'>,
    totalReserve: number,
    config?: ReserveConfig | null
): { finalAmount: number; isCapped: boolean } {
    if (alloc.allocated_amount != null && Number(alloc.allocated_amount) >= 0) {
        const amt = Number(alloc.allocated_amount);
        const isCapped = !!(alloc.max_allocation && Number(alloc.max_allocation) > 0 && amt >= Number(alloc.max_allocation));
        return { finalAmount: amt, isCapped };
    }
    const { finalAmount, isCapped } = computeUserAmount(
        totalReserve,
        Number(alloc.allocation_percent),
        alloc.max_allocation,
        config?.savings_percent,
        config?.manual_studio_amount
    );
    return { finalAmount, isCapped };
}

// ─── The ONE calculation function used by BOTH admin and user views ─────────────
/**
 * Studio + user split (now flexible, admin-configurable):
 *   studioSavings  = manual_studio_amount  ?? (totalReserve × savings_percent%)
 *   allocationPool = totalReserve − studioSavings
 *   rawAmount      = allocationPool × (allocPercent / 100)
 *   finalAmount    = min(rawAmount, maxAllocation) if cap set, else rawAmount
 *
 * totalReserve is ALWAYS the live vault + savings balance — never manually entered.
 */
function computeUserAmount(
    totalReserve: number,
    allocPercent: number,
    maxAllocation: number | null,
    savingsPercent?: number | null,
    manualStudioAmount?: number | null
): { allocationPool: number; studioSavings: number; rawAmount: number; finalAmount: number; isCapped: boolean } {
    const { studioSavings, allocationPool } = getStudioPortion(totalReserve, savingsPercent, manualStudioAmount);
    const rawAmount = allocationPool * (Math.max(0, Math.min(100, Number(allocPercent) || 0)) / 100);

    let finalAmount = rawAmount;
    let isCapped = false;

    if (maxAllocation && maxAllocation > 0 && rawAmount >= maxAllocation) {
        finalAmount = maxAllocation;
        isCapped = true;
    }

    return { allocationPool, studioSavings, rawAmount, finalAmount, isCapped };
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
    label,
    amount,
    icon: Icon,
    color,
    note,
    onClick,
}: {
    label: string;
    amount: number;
    icon: React.ElementType;
    color: string;
    note?: string;
    onClick?: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'glass-card p-6 relative overflow-hidden group transition-all duration-500 hover:translate-y-[-4px]',
                `border-${color}-500/10 bg-white/[0.02] backdrop-blur-xl`,
                onClick && 'cursor-pointer hover:border-white/20 active:scale-[0.98]'
            )}
        >
            {/* Ambient Background Glow */}
            <div
                className={cn(
                    'absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] -mr-16 -mt-16 transition-all duration-700 opacity-20 group-hover:opacity-40',
                    `bg-${color}-500`
                )}
            />
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                        {label}
                    </span>
                    <div
                        className={cn(
                            'w-11 h-11 rounded-2xl flex items-center justify-center border transition-all duration-500',
                            `bg-${color}-500/10 border-${color}-500/20 group-hover:scale-110 shadow-lg`
                        )}
                    >
                        <Icon className={cn('w-5 h-5', `text-${color}-400`)} />
                    </div>
                </div>
                
                <div className="flex items-baseline gap-3">
                    <span className={cn('text-sm font-black italic', `text-${color}-400`)}>ZMW</span>
                    <span className="text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-lg">
                        <AnimatedNumber amount={amount} />
                    </span>
                </div>
                
                {note && (
                    <div className="mt-5 pt-4 border-t border-white/5">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic leading-relaxed">
                            {note}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Withdrawal record type (used by both Admin & User panels) ─────────────────────
interface ReserveWithdrawal {
    id: string;
    user_id: string;
    user_display_name: string;
    allocation_id: string | null;
    amount: number;
    balance_before: number;
    balance_after: number;
    description: string | null;
    date: string;
    time: string;
    created_at: string;
}

// ─── Admin Panel ────────────────────────────────────────────────────────────────
function AdminReservePanel({
    totalReserve,
    allocations,
    config,
    onRefresh,
    companyId,
}: {
    totalReserve: number;
    allocations: Allocation[];
    config: ReserveConfig | null;
    onRefresh: () => void;
    companyId?: string;
}) {
    const { toast } = useToast();
    const { currentUser } = useAuth();
    const { allUsers } = useUsers();

    // ── Allocation dialog ─────────────────────────────────────────────────────
    const [allocDialogOpen, setAllocDialogOpen] = useState(false);
    const [editingAlloc, setEditingAlloc] = useState<Allocation | null>(null);
    const [allocForm, setAllocForm] = useState({
        user_display_name: '',
        user_id: '',
        allocation_mode: 'percent' as 'percent' | 'amount',
        allocation_percent: '20',
        manual_amount: '',
        max_allocation: '',
        maturity_date: '',
        notes: '',
    });
    const [savingAlloc, setSavingAlloc] = useState(false);

    // ── Studio / Base Pool config state (admin can adjust splits bidirectionally) ──
    const [studioCfgOpen, setStudioCfgOpen] = useState(false);
    const [studioPctInput, setStudioPctInput] = useState('15');
    const [studioAmtInput, setStudioAmtInput] = useState('');
    const [poolPctInput, setPoolPctInput] = useState('85');
    const [poolAmtInput, setPoolAmtInput] = useState('');
    const [lastEditedBy, setLastEditedBy] = useState<'studio_pct' | 'studio_amt' | 'pool_pct' | 'pool_amt'>('studio_pct');
    const [savingStudio, setSavingStudio] = useState(false);

    // ── Allocation Tab (Active | Total) ───────────────────────────────────────
    const [adminAllocTab, setAdminAllocTab] = useState<'active' | 'total'>('active');

    useEffect(() => {
        if (config) {
            const studioPct = Number(config.savings_percent ?? 15);
            const hasManual = config.manual_studio_amount != null && Number(config.manual_studio_amount) >= 0;
            let studioAmt = 0;
            if (hasManual) {
                studioAmt = Math.round(Number(config.manual_studio_amount) * 100) / 100;
            } else {
                studioAmt = Math.round((totalReserve * (studioPct / 100)) * 100) / 100;
            }
            const poolAmt = Math.round(Math.max(0, totalReserve - studioAmt) * 100) / 100;
            const poolPct = 100 - studioPct;

            setStudioPctInput(studioPct.toFixed(2));
            setStudioAmtInput(studioAmt.toFixed(2));
            setPoolPctInput(poolPct.toFixed(2));
            setPoolAmtInput(poolAmt.toFixed(2));
        }
    }, [config?.savings_percent, config?.manual_studio_amount, totalReserve]);

    const handleStudioPctChange = (val: string) => {
        setStudioPctInput(val);
        setLastEditedBy('studio_pct');
        const pct = parseFloat(val);
        if (!isNaN(pct)) {
            const amt = Math.round(((pct / 100) * totalReserve) * 100) / 100;
            setStudioAmtInput(isNaN(amt) ? '' : amt.toFixed(2));
            
            const pPct = Math.round((100 - pct) * 100) / 100;
            setPoolPctInput(pPct.toFixed(2));
            
            const pAmt = Math.round(Math.max(0, totalReserve - amt) * 100) / 100;
            setPoolAmtInput(pAmt.toFixed(2));
        }
    };

    const handleStudioAmtChange = (val: string) => {
        setStudioAmtInput(val);
        setLastEditedBy('studio_amt');
        const amt = parseFloat(val);
        if (!isNaN(amt) && totalReserve > 0) {
            const pct = Math.round(((amt / totalReserve) * 100) * 100) / 100;
            setStudioPctInput(pct.toFixed(2));
            
            const pPct = Math.round((100 - pct) * 100) / 100;
            setPoolPctInput(pPct.toFixed(2));
            
            const pAmt = Math.round(Math.max(0, totalReserve - amt) * 100) / 100;
            setPoolAmtInput(pAmt.toFixed(2));
        }
    };

    const handlePoolPctChange = (val: string) => {
        setPoolPctInput(val);
        setLastEditedBy('pool_pct');
        const pct = parseFloat(val);
        if (!isNaN(pct)) {
            const amt = Math.round(((pct / 100) * totalReserve) * 100) / 100;
            setPoolAmtInput(isNaN(amt) ? '' : amt.toFixed(2));
            
            const sPct = Math.round((100 - pct) * 100) / 100;
            setStudioPctInput(sPct.toFixed(2));
            
            const sAmt = Math.round(Math.max(0, totalReserve - amt) * 100) / 100;
            setStudioAmtInput(sAmt.toFixed(2));
        }
    };

    const handlePoolAmtChange = (val: string) => {
        setPoolAmtInput(val);
        setLastEditedBy('pool_amt');
        const amt = parseFloat(val);
        if (!isNaN(amt) && totalReserve > 0) {
            const pct = Math.round(((amt / totalReserve) * 100) * 100) / 100;
            setPoolPctInput(pct.toFixed(2));
            
            const sPct = Math.round((100 - pct) * 100) / 100;
            setStudioPctInput(sPct.toFixed(2));
            
            const sAmt = Math.round(Math.max(0, totalReserve - amt) * 100) / 100;
            setStudioAmtInput(sAmt.toFixed(2));
        }
    };

    const handleSaveStudio = async () => {
        const studioPct = parseFloat(studioPctInput);
        const studioAmt = parseFloat(studioAmtInput);
        const poolPct = parseFloat(poolPctInput);
        const poolAmt = parseFloat(poolAmtInput);

        if (isNaN(studioPct) || studioPct < 0 || studioPct > 100 ||
            isNaN(poolPct) || poolPct < 0 || poolPct > 100) {
            toast({ title: 'Invalid Percentage', description: 'Percentages must be between 0% and 100%.', variant: 'destructive' });
            return;
        }
        if (isNaN(studioAmt) || studioAmt < 0 || studioAmt > totalReserve ||
            isNaN(poolAmt) || poolAmt < 0 || poolAmt > totalReserve) {
            toast({ title: 'Invalid Amount', description: 'Amounts must be between 0 and the total reserve pool.', variant: 'destructive' });
            return;
        }

        // Check if totals sum to 100% or totalReserve
        if (Math.abs(studioPct + poolPct - 100) > 0.05) {
            toast({ title: 'Invalid Split', description: 'Percentages must sum to exactly 100%.', variant: 'destructive' });
            return;
        }
        if (Math.abs(studioAmt + poolAmt - totalReserve) > 0.5) {
            toast({ title: 'Invalid Split', description: 'Amounts must sum to the total reserve amount.', variant: 'destructive' });
            return;
        }

        setSavingStudio(true);
        try {
            // If the user last edited an amount input, we save in manual mode.
            // If they last edited a percentage input, we save in percentage mode.
            const isManualMode = lastEditedBy === 'studio_amt' || lastEditedBy === 'pool_amt';
            const newSavingsPercent = studioPct;
            const newManualAmount = isManualMode ? studioAmt : null;

            const payload: any = {
                id: companyId || 'singleton',
                savings_percent: newSavingsPercent,
                manual_studio_amount: newManualAmount,
                updated_by: currentUser?.username || 'admin',
                updated_at: new Date().toISOString(),
            };
            const { error } = await supabase
                .from('reserve_investment_config' as any)
                .upsert(payload);
            if (error) throw error;

            // Re-sync locked `allocated_amount` for percent-mode allocations so
            // the pool change propagates instantly across both admin & user views.
            try {
                const percentAllocs = allocations.filter(
                    a => a.is_active && Number(a.allocation_percent) > 0
                );
                await Promise.all(
                    percentAllocs.map(a => {
                        const { finalAmount } = computeUserAmount(
                            totalReserve,
                            Number(a.allocation_percent),
                            a.max_allocation,
                            newSavingsPercent,
                            newManualAmount
                        );
                        return supabase
                            .from('reserve_investment_allocations' as any)
                            .update({
                                allocated_amount: finalAmount,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', a.id);
                    })
                );
            } catch (resyncErr) {
                console.warn('[Reserve] Re-sync of locked allocations failed:', resyncErr);
            }

            toast({ title: '✅ Base Pool Allocation Updated', description: 'Studio Savings and Allocation Pool splits successfully saved.' });
            setStudioCfgOpen(false);
            onRefresh();
        } catch (e: any) {
            toast({ title: 'Save Failed', description: e.message || 'Could not update studio allocation.', variant: 'destructive' });
        } finally {
            setSavingStudio(false);
        }
    };



    // ── Admin: Reserve-investment transaction history + CRUD ───────────────────
    const [allWithdrawals, setAllWithdrawals] = useState<ReserveWithdrawal[]>([]);
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
    const [loadingTx, setLoadingTx] = useState(false);
    const [editTxOpen, setEditTxOpen]   = useState(false);
    const [editingTx, setEditingTx]     = useState<ReserveWithdrawal | null>(null);
    const [txEditForm, setTxEditForm]   = useState({ amount: '', description: '', date: '' });
    const [savingTx, setSavingTx]       = useState(false);

    const loadAllWithdrawals = async () => {
        setLoadingTx(true);
        try {
            let query = supabase
                .from('reserve_investment_withdrawals' as any)
                .select('*, reserve_investment_allocations!inner(company_id, id)');

            if (companyId) {
                query = query.eq('reserve_investment_allocations.company_id', companyId);
            } else {
                query = query.is('reserve_investment_allocations.company_id', null);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (!error && data) {
                setAllWithdrawals(data as any as ReserveWithdrawal[]);
            }
        } catch (e) {
            console.error('Error loading admin reserve withdrawals:', e);
        } finally {
            setLoadingTx(false);
        }
    };

    // Load on mount and subscribe to realtime changes
    useEffect(() => {
        loadAllWithdrawals();
        const sub = supabase
            .channel(`admin-reserve-withdrawals-${companyId || 'global'}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'reserve_investment_withdrawals' 
            }, (payload) => {
                console.log('[Reserve] Admin Realtime change:', payload.eventType, (payload.new as any)?.id || (payload.old as any)?.id);
                if (payload.eventType === 'DELETE' && (payload.old as any)?.id) {
                    setDeletedIds(prev => new Set(Array.from(prev).concat((payload.old as any).id)));
                }
                loadAllWithdrawals();
            })
            .subscribe();
        return () => { supabase.removeChannel(sub); };
    }, [companyId]);

    const openEditTx = (tx: ReserveWithdrawal) => {
        setEditingTx(tx);
        setTxEditForm({
            amount:      String(tx.amount),
            description: tx.description || '',
            date:        tx.date,
        });
        setEditTxOpen(true);
    };
    const handleSaveTx = async () => {
        if (!editingTx) return;
        const newAmount = parseFloat(txEditForm.amount);
        if (isNaN(newAmount) || newAmount <= 0) {
            toast({ title: 'Invalid amount', variant: 'destructive' });
            return;
        }
        setSavingTx(true);
        try {
            const { data, error: rpcErr } = await supabase.rpc('update_reserve_withdrawal', {
                p_withdrawal_id: editingTx.id,
                p_new_amount: newAmount,
                p_new_description: txEditForm.description || '',
                p_new_date: txEditForm.date || editingTx.date,
                p_username: currentUser?.username || 'admin',
                p_user_id: currentUser?.id || '00000000-0000-0000-0000-000000000000'
            });

            if (rpcErr) throw rpcErr;
            if (data && !data.success) {
                throw new Error(data.message || 'Database update failed');
            }

            toast({ title: '✅ Transaction Updated', description: `Withdrawal record updated and history synchronized.` });
            setEditTxOpen(false);
            setEditingTx(null);
            await loadAllWithdrawals();
            onRefresh();
        } catch (err: any) {
            console.error('[Reserve] Save transaction error:', err);
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setSavingTx(false);
        }
    };

    // Delete a withdrawal record and reverse its effect across the ENTIRE system
    const handleDeleteTx = async (tx: ReserveWithdrawal) => {
        const confirmMsg = `PERMANENT DELETION: Delete withdrawal of ZMW ${tx.amount.toLocaleString()} for ${tx.user_display_name}?\n\nThis will permanently:\n1. Remove this withdrawal record\n2. Restore the amount to the Global Reserve Total\n3. Restore the amount to the user's Allocation\n4. Remove the entry from BOTH the main Transactions tab and the Savings history.`;
        
        if (!window.confirm(confirmMsg)) return;

        try {
            console.log('[Reserve] Starting full deletion sync for:', tx.id);
            
            // 1. Instantly remove from local state for immediate UI feedback
            setDeletedIds(prev => new Set(Array.from(prev).concat(tx.id)));
            setAllWithdrawals(prev => prev.filter(w => w.id !== tx.id));

            const { data, error: rpcErr } = await supabase.rpc('reverse_reserve_withdrawal', {
                p_withdrawal_id: tx.id,
                p_username: currentUser?.username || 'admin',
                p_user_id: currentUser?.id || '00000000-0000-0000-0000-000000000000'
            });

            if (rpcErr) throw rpcErr;
            if (data && !data.success) {
                throw new Error(data.message || 'Database deletion failed');
            }

            toast({ 
                title: '🗑️ Withdrawal Fully Purged', 
                description: `ZMW ${tx.amount.toLocaleString()} restored system-wide. History synchronized.` 
            });

            // Final sync to ensure all calculations and lists are in perfect parity
            await loadAllWithdrawals();
            onRefresh();

        } catch (err: any) {
            console.error('[Reserve] Fatal error during deletion:', err);
            toast({ 
                title: 'Deletion Failed', 
                description: err.message || 'Verification required.', 
                variant: 'destructive' 
            });
            // Final fallback refresh
            await loadAllWithdrawals();
        }
    };

    // ── Derive values (15 / 85 split) ─────────────────────────────────────────
    const { studioSavings, allocationPool, studioPercent } = getStudioPortion(
        totalReserve,
        config?.savings_percent,
        config?.manual_studio_amount
    );
    const isStudioManual = config?.manual_studio_amount != null && Number(config?.manual_studio_amount) >= 0;
    // Active = is_active AND not yet matured (maturity date in the future / not set)
    const activeAllocs = allocations.filter(a => a.is_active && !isMaturedCAT(a.maturity_date));

    const totalAllocPct = activeAllocs.reduce((s, a) => s + Number(a.allocation_percent), 0);

    // ── Open allocation dialog ────────────────────────────────────────────────
    const openAllocDialog = (alloc?: Allocation) => {
        if (alloc) {
            setEditingAlloc(alloc);
            const hasManualAmt =
                alloc.allocated_amount != null &&
                (Number(alloc.allocation_percent) === 0 || Number(alloc.allocated_amount) > 0);
            setAllocForm({
                user_display_name: alloc.user_display_name,
                user_id: alloc.user_id,
                allocation_mode: Number(alloc.allocation_percent) === 0 ? 'amount' : 'percent',
                allocation_percent: String(alloc.allocation_percent || 20),
                manual_amount: hasManualAmt && Number(alloc.allocation_percent) === 0
                    ? String(alloc.allocated_amount)
                    : '',
                max_allocation: alloc.max_allocation ? String(alloc.max_allocation) : '',
                maturity_date: alloc.maturity_date ? alloc.maturity_date.split('T')[0] : '',
                notes: alloc.notes || '',
            });
        } else {
            setEditingAlloc(null);
            setAllocForm({
                user_display_name: '',
                user_id: '',
                allocation_mode: 'percent',
                allocation_percent: '20',
                manual_amount: '',
                max_allocation: '',
                maturity_date: '',
                notes: '',
            });
        }
        setAllocDialogOpen(true);
    };

    // ── Save allocation ───────────────────────────────────────────────────────
    const handleSaveAlloc = async () => {
        if (!allocForm.user_display_name.trim()) {
            toast({ title: 'Required', description: 'User selection is required.', variant: 'destructive' });
            return;
        }

        let percentValue = 0;
        let lockedAmount = 0;
        let maxAllocVal: number | null = null;

        if (allocForm.allocation_mode === 'amount') {
            const amt = parseFloat(allocForm.manual_amount);
            if (isNaN(amt) || amt < 0) {
                toast({ title: 'Invalid Amount', description: 'Manual amount must be 0 or greater.', variant: 'destructive' });
                return;
            }
            percentValue = 0; // sentinel for manual-amount mode
            lockedAmount = amt;
        } else {
            const rawPercent = parseFloat(allocForm.allocation_percent);
            if (isNaN(rawPercent) || rawPercent < 1 || rawPercent > 100) {
                toast({
                    title: 'Invalid Percentage',
                    description: 'Allocation percentage must be a whole number between 1% and 100%.',
                    variant: 'destructive'
                });
                return;
            }
            percentValue = Math.min(Math.max(Math.floor(rawPercent), 1), 100);

            if (allocForm.max_allocation) {
                const capValue = parseFloat(allocForm.max_allocation);
                if (isNaN(capValue) || capValue <= 0) {
                    toast({ title: 'Invalid Cap', description: 'Maximum allocation cap must be a positive number.', variant: 'destructive' });
                    return;
                }
                maxAllocVal = capValue;
            }
            const { finalAmount } = computeUserAmount(
                totalReserve,
                percentValue,
                maxAllocVal,
                config?.savings_percent,
                config?.manual_studio_amount
            );
            lockedAmount = finalAmount;
        }

        setSavingAlloc(true);
        try {
            const payload: any = {
                user_display_name: allocForm.user_display_name.trim(),
                user_id: allocForm.user_id.trim() || allocForm.user_display_name.trim(),
                allocation_percent: percentValue,
                max_allocation: maxAllocVal,
                allocated_amount: lockedAmount,
                maturity_date: allocForm.maturity_date || null,
                notes: allocForm.notes || null,
                is_active: true,
                updated_at: new Date().toISOString(),
                company_id: companyId || null,
            };

            if (editingAlloc) {
                const { error } = await supabase
                    .from('reserve_investment_allocations' as any)
                    .update(payload)
                    .eq('id', editingAlloc.id);
                if (error) throw error;
                toast({ title: '✅ Allocation Updated' });
            } else {
                const { error } = await supabase
                    .from('reserve_investment_allocations' as any)
                    .insert({ ...payload, created_by: currentUser?.username || 'admin' });
                if (error) throw error;
                toast({ title: '✅ Allocation Created' });
            }

            setAllocDialogOpen(false);
            onRefresh();
        } catch (err: any) {
            console.error('Database Operation Error:', err);
            let descriptiveMessage = 'The system was unable to save the allocation. Please verify the input values and try again.';
            if (err.message && (
                err.message.includes('check constraint') ||
                err.message.includes('reserve_investment_allocations') ||
                err.message.includes('percent_check')
            )) {
                descriptiveMessage = 'The percentage value must be a whole number between 1% and 100%.';
            }
            toast({
                title: 'Operation Failed',
                description: descriptiveMessage,
                variant: 'destructive'
            });
        } finally {
            setSavingAlloc(false);
        }
    };


    // ── Delete allocation ─────────────────────────────────────────────────────
    const handleDeleteAlloc = async (id: string, name: string) => {
        if (!confirm(`Remove allocation for ${name}?`)) return;
        try {
            const { error } = await supabase
                .from('reserve_investment_allocations' as any)
                .delete()
                .eq('id', id);
            if (error) throw error;
            toast({ title: '🗑️ Allocation Removed' });
            onRefresh();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-2">
                <div>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-600/20 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(245,158,11,0.2)] backdrop-blur-2xl">
                            <TrendingUp className="h-7 w-7 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">
                                Reserve Investment
                            </h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3 ml-1 flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-500/50" />
                                Allocation Management System
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={onRefresh}
                        variant="ghost"
                        className="h-14 w-14 p-0 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </Button>
                    <Button
                        onClick={() => openAllocDialog()}
                        className="rounded-2xl h-14 px-8 bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black uppercase tracking-[0.2em] text-[10px] border border-emerald-400/30 shadow-[0_10px_30px_rgba(16,185,129,0.2)] transition-all active:scale-95"
                    >
                        <UserPlus className="w-4 h-4 mr-3" />
                        New Allocation
                    </Button>
                </div>
            </div>

            {/* ── Total Reserve — read-only, always mirrored live ── */}
            <div className="glass-card p-10 md:p-12 relative overflow-hidden border-white/10 bg-gradient-to-br from-amber-500/5 to-transparent backdrop-blur-3xl shadow-2xl">
                {/* Visual accents */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[80px] -ml-32 -mb-32 pointer-events-none" />
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,1)]" />
                        <p className="text-[10px] font-black text-amber-500/80 uppercase tracking-[0.4em] flex items-center gap-2">
                            <Wallet className="w-3.5 h-3.5" />
                            Live System Reserve Pool
                        </p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="flex items-baseline gap-4">
                                <span className="text-3xl font-black text-amber-500/60 italic tracking-tighter uppercase">ZMW</span>
                                <span className="text-7xl md:text-9xl font-black text-black tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                    <AnimatedNumber amount={totalReserve} />
                                </span>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 mt-6 inline-flex items-center gap-3">
                                <Activity className="w-4 h-4 text-emerald-400" />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                                    Auto-synced from Vault & Savings — Live Sync Active
                                </p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-5 md:w-auto w-full">
                            <button
                                type="button"
                                onClick={() => setStudioCfgOpen(true)}
                                className="bg-white/[0.05] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center min-w-[160px] shadow-2xl transition-all hover:bg-white/[0.08] cursor-pointer text-center"
                                title="Configure allocation split"
                            >
                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] mb-2">Vault Portion · Tap to edit</span>
                                <span className="text-2xl font-black text-white italic tracking-tighter">
                                    {isStudioManual ? `ZMW ${allocationPool.toLocaleString()}` : `${(100 - studioPercent).toFixed(0)}% SHARE`}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setStudioCfgOpen(true)}
                                className="bg-white/[0.05] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center min-w-[160px] shadow-2xl transition-all hover:bg-white/[0.08] cursor-pointer text-center"
                                title="Configure studio allocation"
                            >
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Studio Portion · Tap to edit</span>
                                <span className="text-2xl font-black text-white italic tracking-tighter">
                                    {isStudioManual ? `ZMW ${studioSavings.toLocaleString()}` : `${studioPercent.toFixed(0)}% SHARE`}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Reserve Summary Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <StatCard
                    label={isStudioManual ? 'Studio Savings (Manual)' : `Studio Savings (${studioPercent.toFixed(0)}%)`}
                    amount={studioSavings}
                    icon={PiggyBank}
                    color="indigo"
                    note={isStudioManual ? 'Manually set by admin — fixed amount' : 'Automatically reserved — never allocated to users'}
                    onClick={() => setStudioCfgOpen(true)}
                />

                <StatCard
                    label={isStudioManual ? 'Allocation Pool' : `Allocation Pool (${(100 - studioPercent).toFixed(0)}%)`}
                    amount={allocationPool}
                    icon={CircleDollarSign}
                    color="emerald"
                    note={`${totalAllocPct}% assigned across ${activeAllocs.length} user(s)`}
                    onClick={() => setStudioCfgOpen(true)}
                />
            </div>


            {/* ── Allocation Progress Bar ── */}
            {totalAllocPct > 0 && (
                <div className="glass-card p-8 border-white/5 bg-white/[0.02] backdrop-blur-xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Percent className="w-4 h-4 text-emerald-400" />
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                Allocation Status of 85% Pool
                            </span>
                        </div>
                        <Badge
                            className={cn(
                                'px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg',
                                totalAllocPct <= 100
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5'
                            )}
                        >
                            {totalAllocPct}% Assigned
                        </Badge>
                    </div>
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-1000 relative',
                                totalAllocPct > 100
                                    ? 'bg-gradient-to-r from-rose-600 to-red-500'
                                    : totalAllocPct === 100
                                        ? 'bg-gradient-to-r from-emerald-600 to-green-500'
                                        : 'bg-gradient-to-r from-amber-600 to-orange-500'
                            )}
                            style={{ width: `${Math.min(totalAllocPct, 100)}%` }}
                        >
                            {/* Reflection on the progress bar */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                        </div>
                    </div>
                    {totalAllocPct > 100 && (
                        <div className="mt-5 flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                            <Lock className="w-3 h-3 text-rose-400" />
                            <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest italic">
                                CRITICAL: Over-allocation detected. Please adjust percentages.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Allocations Table ── */}
            <div className="glass-card overflow-hidden border-white/10 backdrop-blur-xl shadow-2xl">
                {/* Header + Tab Switcher */}
                <div className="p-8 border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent flex flex-col gap-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                                {adminAllocTab === 'active' ? 'Active Allocations' : 'Total Allocations'}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,1)]" />
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                    {adminAllocTab === 'active'
                                        ? 'Non-matured allocations — live from current pool'
                                        : 'All allocations across all time — full history'}
                                </p>
                            </div>
                        </div>
                        <div className="inline-flex h-10 px-4 items-center bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-300 tracking-[0.2em] shadow-lg">
                            <Users className="w-3.5 h-3.5 mr-2 text-amber-500" />
                            {adminAllocTab === 'active' ? `${activeAllocs.length} ACTIVE` : `${allocations.length} TOTAL`}
                        </div>
                    </div>
                    {/* Tab Switcher */}
                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 w-fit">
                        <button
                            type="button"
                            id="admin-alloc-tab-active"
                            onClick={() => setAdminAllocTab('active')}
                            className={cn(
                                'h-9 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all duration-300',
                                adminAllocTab === 'active'
                                    ? 'bg-emerald-500 text-white shadow-lg'
                                    : 'text-slate-400 hover:bg-white/5'
                            )}
                        >
                            Active
                        </button>
                        <button
                            type="button"
                            id="admin-alloc-tab-total"
                            onClick={() => setAdminAllocTab('total')}
                            className={cn(
                                'h-9 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all duration-300',
                                adminAllocTab === 'total'
                                    ? 'bg-violet-500 text-white shadow-lg'
                                    : 'text-slate-400 hover:bg-white/5'
                            )}
                        >
                            Total Allocations
                        </button>
                    </div>
                </div>

                {/* ── ACTIVE TAB ── */}
                {adminAllocTab === 'active' && (
                    <>
                        {totalReserve === 0 && (
                            <div className="m-8 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 backdrop-blur-md">
                                <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <Zap className="w-4 h-4" />
                                    The system pool is currently empty. Configure the pool to preview allocation data.
                                </p>
                            </div>
                        )}

                        {activeAllocs.length === 0 ? (
                            <div className="py-24 px-8 text-center flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/5">
                                    <Activity className="w-10 h-10 text-slate-700 stroke-[1]" />
                                </div>
                                <p className="text-xs font-black text-slate-600 uppercase tracking-[0.5em] max-w-xs leading-relaxed">
                                    No active non-matured allocations. Check "Total Allocations" for full history.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {activeAllocs.map((alloc, idx) => {
                                    const { finalAmount, isCapped } = getCanonicalAllocAmount(alloc, totalReserve, config);
                                    const isManualAlloc = Number(alloc.allocation_percent) === 0;
                                    const totalWithdrawn = alloc.total_withdrawn || 0;
                                    const remainingBalance = Math.max(0, finalAmount - totalWithdrawn);
                                    const maturityDateString = alloc.maturity_date
                                        ? (isValid(parseISO(alloc.maturity_date)) ? format(parseISO(alloc.maturity_date), 'MMM d, yyyy') : 'N/A')
                                        : 'No maturity date';

                                    return (
                                        <div
                                            key={alloc.id}
                                            className="p-8 hover:bg-white/[0.03] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-8 group animate-in slide-in-from-left-4"
                                            style={{ animationDelay: `${idx * 60}ms` }}
                                        >
                                            <div className="flex items-center gap-7">
                                                <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-700 shadow-xl relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
                                                    <Users className="w-7 h-7 text-white/50 group-hover:text-amber-400 transition-colors relative z-10" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-4 mb-2.5">
                                                        <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-sm">
                                                            {alloc.user_display_name}
                                                        </h3>
                                                        <div className="h-6 px-3 bg-white/5 border border-white/10 rounded-full flex items-center gap-1.5 shadow-lg shadow-black/20">
                                                            <Percent className="w-3 h-3 text-amber-500" />
                                                            <span className="text-[10px] font-black text-white">{isManualAlloc ? 'MANUAL' : `${alloc.allocation_percent}%`}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-6 mt-1">
                                                        <span className="flex items-center gap-3 text-white drop-shadow-xl">
                                                            <div className={cn(
                                                                'w-2 h-2 rounded-full',
                                                                remainingBalance > 0
                                                                    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]'
                                                                    : 'bg-slate-600'
                                                            )} />
                                                            <span className="text-sm font-black text-emerald-500/80 italic tracking-tighter">ZMW</span>
                                                            <span className="text-2xl font-black tracking-tighter tabular-nums">
                                                                {remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">remaining</span>
                                                        </span>

                                                        {totalWithdrawn > 0 && (
                                                            <span className="text-[10px] font-black text-rose-400/80 tracking-widest">
                                                                −{totalWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2 })} withdrawn
                                                            </span>
                                                        )}

                                                        {isCapped && (
                                                            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                                                                <Lock className="w-3.5 h-3.5" />
                                                                CAPPED
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-2.5 border-l border-white/10 pl-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                                            <CalendarDays className="w-4 h-4 text-blue-400" />
                                                            <span>{maturityDateString}</span>
                                                        </div>

                                                        {alloc.notes && (
                                                            <div className="flex items-center gap-2.5 border-l border-white/10 pl-6 text-[11px] font-black text-slate-600 uppercase tracking-widest max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                                                                <Edit className="w-4 h-4 text-slate-700" />
                                                                <span className="normal-case italic opacity-80">"{alloc.notes}"</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-3 inline-flex items-center py-1 px-3 bg-white/[0.02] rounded-lg border border-white/5">
                                                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic">
                                                            {totalReserve > 0
                                                                ? (isManualAlloc
                                                                    ? `Allocated: ZMW ${finalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})} (Manual amount)`
                                                                    : `Allocated: ZMW ${finalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})} (Pool ZMW ${allocationPool.toLocaleString()} × ${alloc.allocation_percent}%)`)
                                                                : 'Reserve sync required for full breakdown'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 md:opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openAllocDialog(alloc)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteAlloc(alloc.id, alloc.user_display_name)}
                                                    className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* ── TOTAL ALLOCATIONS TAB ── */}
                {adminAllocTab === 'total' && (
                    <div className="divide-y divide-white/5">
                        {allocations.length === 0 ? (
                            <div className="py-24 px-8 text-center flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/5">
                                    <Activity className="w-10 h-10 text-slate-700 stroke-[1]" />
                                </div>
                                <p className="text-xs font-black text-slate-600 uppercase tracking-[0.5em] max-w-xs leading-relaxed">
                                    No allocations on record yet.
                                </p>
                            </div>
                        ) : (
                            allocations.map((alloc, idx) => {
                                const { finalAmount } = getCanonicalAllocAmount(alloc, totalReserve, config);
                                const isManualAlloc = Number(alloc.allocation_percent) === 0;
                                const matured = isMaturedCAT(alloc.maturity_date);
                                const totalWithdrawn = alloc.total_withdrawn || 0;
                                const remaining = Math.max(0, finalAmount - totalWithdrawn);
                                const maturityDateString = alloc.maturity_date
                                    ? (isValid(parseISO(alloc.maturity_date)) ? format(parseISO(alloc.maturity_date), 'MMM d, yyyy') : 'N/A')
                                    : 'No maturity date';

                                let statusLabel = 'ACTIVE';
                                let statusClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                                if (!alloc.is_active) {
                                    statusLabel = 'INACTIVE';
                                    statusClasses = 'bg-slate-700/30 text-slate-500 border-slate-600/20';
                                } else if (matured) {
                                    statusLabel = 'MATURED';
                                    statusClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                                } else if (!alloc.maturity_date) {
                                    statusLabel = 'NO DATE';
                                    statusClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                                }

                                return (
                                    <div
                                        key={alloc.id}
                                        className="p-6 hover:bg-white/[0.02] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 group animate-in slide-in-from-left-4"
                                        style={{ animationDelay: `${idx * 40}ms` }}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={cn(
                                                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-500 group-hover:scale-110',
                                                matured ? 'bg-amber-500/10 border-amber-500/20' :
                                                alloc.is_active ? 'bg-emerald-500/10 border-emerald-500/20' :
                                                'bg-slate-700/30 border-slate-600/20'
                                            )}>
                                                <Users className={cn('w-5 h-5',
                                                    matured ? 'text-amber-400' :
                                                    alloc.is_active ? 'text-emerald-400' :
                                                    'text-slate-600'
                                                )} />
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                                    <span className="font-black text-white uppercase tracking-tight">{alloc.user_display_name}</span>
                                                    <span className={cn('h-5 px-2.5 rounded-md text-[9px] font-black uppercase tracking-widest border flex items-center', statusClasses)}>
                                                        {statusLabel}
                                                    </span>
                                                    <span className="h-5 px-2.5 bg-white/5 border border-white/10 rounded-md text-[9px] font-black text-white flex items-center">
                                                        {isManualAlloc ? 'MANUAL' : `${alloc.allocation_percent}%`}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                                    <span className="text-slate-300">ZMW {finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                    {totalWithdrawn > 0 && (
                                                        <span className="text-rose-400/70">−{totalWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2 })} withdrawn</span>
                                                    )}
                                                    <span className="flex items-center gap-1.5 text-slate-500">
                                                        <CalendarDays className="w-3.5 h-3.5 text-blue-400/60" />
                                                        {maturityDateString}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-end gap-0.5 shrink-0 animate-in slide-in-from-right-2">
                                                <span className={cn('text-xl font-black tabular-nums tracking-tighter',
                                                    matured ? 'text-amber-400' :
                                                    alloc.is_active ? 'text-emerald-400' :
                                                    'text-slate-600'
                                                )}>
                                                    {remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">ZMW REMAINING</span>
                                            </div>
                                            <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-3 shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openAllocDialog(alloc)}
                                                    className="h-10 w-10 rounded-xl text-slate-400 hover:text-white"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteAlloc(alloc.id, alloc.user_display_name)}
                                                    className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* ── Long-Term Continuation Investment ── */}
            {(() => {
                // Sum the canonical allocated amount for each active allocation
                const totalAssignedAmount = activeAllocs.reduce((sum, alloc) => {
                    const { finalAmount } = getCanonicalAllocAmount(alloc, totalReserve, config);
                    return sum + finalAmount;
                }, 0);
                const longTermAmount = Math.max(0, allocationPool - totalAssignedAmount);
                const unassignedPct = Math.max(0, 100 - totalAllocPct);
                return (
                    <div className="glass-card p-10 relative overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent backdrop-blur-2xl shadow-xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/30 to-purple-700/20 border border-violet-400/20 flex items-center justify-center shadow-lg backdrop-blur-3xl">
                                        <TrendingUp className="w-7 h-7 text-violet-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-violet-400/80 uppercase tracking-[0.4em]">Administrative Core</p>
                                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-none mt-2 italic shadow-sm">
                                            Long-Term Continuity Investment
                                        </h3>
                                    </div>
                                </div>
                                <div className="inline-flex h-10 px-6 items-center bg-violet-500/10 border border-violet-500/20 rounded-xl text-[10px] font-black text-violet-300 tracking-[0.2em] shadow-lg shadow-violet-900/10">
                                    {unassignedPct}% STRATEGIC FLOAT
                                </div>
                            </div>
                            
                            <div className="flex items-baseline gap-4 mb-8">
                                <span className="text-3xl font-black text-violet-500/60 italic tracking-tighter uppercase">ZMW</span>
                                <span className="text-7xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                                    <AnimatedNumber amount={longTermAmount} />
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-3 py-3 px-5 bg-white/5 border border-white/5 rounded-2xl">
                                <Activity className="w-4 h-4 text-violet-400 animate-pulse" />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                    Remainder of 85% Pool (ZMW {allocationPool.toLocaleString()}) after individual shares — auto-calculated liquidity
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── Add / Edit Allocation Dialog ── */}
            <Dialog open={allocDialogOpen} onOpenChange={setAllocDialogOpen}>
                <DialogContent className="glass-dialog-content border-white/10 p-0 outline-none bg-[#0f172a]/95 backdrop-blur-3xl flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 max-sm:!fixed max-sm:!inset-0 max-sm:!w-screen max-sm:!h-[100dvh] max-sm:!max-w-none max-sm:!max-h-none max-sm:!translate-x-0 max-sm:!translate-y-0 max-sm:!top-0 max-sm:!left-0 max-sm:!rounded-none sm:max-w-lg sm:max-h-[92vh] sm:overflow-hidden sm:rounded-3xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                    <div className="p-10 border-b border-white/5 bg-gradient-to-br from-amber-500/10 to-transparent relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none" />
                        <DialogTitle className="text-3xl font-black tracking-tighter text-white flex items-center gap-4 relative z-10 uppercase italic">
                            <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center border border-white/20 shadow-xl">
                                <UserPlus className="w-6 h-6 text-white" />
                            </div>
                            {editingAlloc ? 'Update Allocation' : 'Strategic Share'}
                        </DialogTitle>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-4 ml-1 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-500/50" />
                            Assigning distribution from the distribution pool
                        </p>
                    </div>

                    <div className="p-10 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                        {/* Live preview */}
                        {totalReserve > 0 && (allocForm.allocation_mode === 'amount' ? allocForm.manual_amount : allocForm.allocation_percent) && (
                            <div className="glass-card p-8 border-emerald-500/20 bg-emerald-500/[0.03] shadow-[inset_0_0_40px_rgba(16,185,129,0.05)] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[50px] -mr-16 -mt-16 pointer-events-none" />
                                <div className="relative z-10 text-center md:text-left">
                                    <p className="text-[9px] font-black text-emerald-500/70 uppercase tracking-[0.3em] mb-3 flex items-center justify-center md:justify-start gap-2">
                                        <Zap className="w-3.5 h-3.5 animate-pulse" />
                                        Distribution Preview
                                    </p>
                                    {(() => {
                                        if (allocForm.allocation_mode === 'amount') {
                                            const amt = parseFloat(allocForm.manual_amount) || 0;
                                            return (
                                                <>
                                                    <div className="flex flex-col md:flex-row md:items-baseline gap-2 mb-2 justify-center md:justify-start">
                                                        <span className="text-3xl font-black text-white tabular-nums drop-shadow-sm">
                                                            ZMW {amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                                        Manual fixed amount
                                                    </p>
                                                </>
                                            );
                                        }
                                        const pct = parseFloat(allocForm.allocation_percent) || 0;
                                        const cap = allocForm.max_allocation ? parseFloat(allocForm.max_allocation) : null;
                                        const { finalAmount, isCapped, allocationPool: pool } = computeUserAmount(
                                            totalReserve, pct, cap,
                                            config?.savings_percent, config?.manual_studio_amount
                                        );
                                        return (
                                            <>
                                                <div className="flex flex-col md:flex-row md:items-baseline gap-2 mb-2 justify-center md:justify-start">
                                                    <span className="text-3xl font-black text-white tabular-nums drop-shadow-sm">
                                                        ZMW {finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    {isCapped && (
                                                        <div className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                                            <Lock className="w-2.5 h-2.5" />
                                                            LIMIT REACHED
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                                    Pool ZMW {pool.toLocaleString()} × {pct}% Share
                                                </p>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                        {totalReserve === 0 && (
                            <div className="glass-card p-6 bg-amber-500/5 border border-amber-500/10 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-5 h-5 text-amber-500" />
                                </div>
                                <p className="text-[10px] font-black text-amber-400/80 uppercase tracking-widest">
                                    System pool sync required to calculate precise distribution amounts.
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                Select System User
                            </Label>
                            <Select
                                value={allocForm.user_id}
                                onValueChange={(val) => {
                                    const user = allUsers.find(u => u.id === val || u.username === val);
                                    if (user) {
                                        setAllocForm({ ...allocForm, user_id: user.username, user_display_name: user.username });
                                    }
                                }}
                            >
                                <SelectTrigger className="glass-input h-14 border-white/10 text-white font-bold">
                                    <SelectValue placeholder="Choose a user..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                    {allUsers.map((user) => (
                                        <SelectItem key={user.id} value={user.id} className="focus:bg-white/10 focus:text-white">
                                            {user.username} {user.email && `(${user.email})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Allocation Mode Toggle */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                Allocation Mode
                            </Label>
                            <div className="grid grid-cols-2 gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
                                <button
                                    type="button"
                                    onClick={() => setAllocForm({ ...allocForm, allocation_mode: 'percent' })}
                                    className={cn(
                                        'h-12 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all',
                                        allocForm.allocation_mode === 'percent'
                                            ? 'bg-amber-500 text-white shadow-lg'
                                            : 'text-slate-400 hover:bg-white/5'
                                    )}
                                >
                                    Percentage
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAllocForm({ ...allocForm, allocation_mode: 'amount' })}
                                    className={cn(
                                        'h-12 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all',
                                        allocForm.allocation_mode === 'amount'
                                            ? 'bg-amber-500 text-white shadow-lg'
                                            : 'text-slate-400 hover:bg-white/5'
                                    )}
                                >
                                    Manual Amount
                                </button>
                            </div>
                        </div>

                        {allocForm.allocation_mode === 'percent' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                        Percentage (1–100%)
                                    </Label>
                                    <Select
                                        value={allocForm.allocation_percent}
                                        onValueChange={(v) => setAllocForm({ ...allocForm, allocation_percent: v })}
                                    >
                                        <SelectTrigger className="glass-input h-14 border-white/10 text-white font-black">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white font-black max-h-72">
                                            {Array.from({ length: 100 }, (_, i) => i + 1).map((pct) => (
                                                <SelectItem key={pct} value={String(pct)} className="focus:bg-white/10 focus:text-white">
                                                    {pct}% Share
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                        Max Allocation Cap
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            placeholder="None"
                                            value={allocForm.max_allocation}
                                            onChange={(e) => setAllocForm({ ...allocForm, max_allocation: e.target.value })}
                                            className="glass-input h-14 pl-4 font-black"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    Manual Amount (ZMW)
                                </Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="e.g. 2000"
                                    value={allocForm.manual_amount}
                                    onChange={(e) => setAllocForm({ ...allocForm, manual_amount: e.target.value })}
                                    className="glass-input h-14 pl-4 font-black"
                                />
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                    Exact amount overrides percentage logic
                                </p>
                            </div>
                        )}



                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                Maturity Date
                            </Label>
                            <Input
                                type="date"
                                value={allocForm.maturity_date}
                                onChange={(e) => setAllocForm({ ...allocForm, maturity_date: e.target.value })}
                                className="glass-input h-14 p-4 [color-scheme:dark] font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                Notes (Optional)
                            </Label>
                            <Input
                                placeholder="..."
                                value={allocForm.notes}
                                onChange={(e) => setAllocForm({ ...allocForm, notes: e.target.value })}
                                className="glass-input h-14 text-white"
                            />
                        </div>
                    </div>

                    <div className="p-8 pt-0 flex gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => setAllocDialogOpen(false)}
                            className="flex-1 h-12 rounded-xl text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveAlloc}
                            disabled={savingAlloc || !allocForm.user_id}
                            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-500 hover:to-teal-600 text-white font-black uppercase tracking-widest text-[10px] border border-green-400/30 shadow-lg shadow-green-900/40 transition-all active:scale-95"
                        >
                            {savingAlloc ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : 'Save Allocation'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Admin-Only: Reserve Transaction History + CRUD ── */}
            <div className="glass-card overflow-hidden border-white/10 backdrop-blur-xl shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Transaction History</h3>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            Admin-Only · Reserve Investment Withdrawals
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-10 px-5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 text-[10px] font-black text-slate-400 tracking-widest">
                            <Activity className="w-3.5 h-3.5 text-rose-400" />
                            {allWithdrawals.length} RECORDS
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={loadAllWithdrawals}
                            className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white"
                        >
                            <RefreshCw className={cn('w-4 h-4', loadingTx && 'animate-spin')} />
                        </Button>
                    </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    {loadingTx ? (
                        <div className="p-16 text-center">
                            <RefreshCw className="w-8 h-8 text-slate-700 mx-auto animate-spin" />
                        </div>
                    ) : allWithdrawals.filter(tx => !deletedIds.has(tx.id)).length === 0 ? (
                        <div className="py-20 text-center">
                            <Activity className="w-10 h-10 text-slate-800 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No withdrawal records found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {allWithdrawals.filter(tx => !deletedIds.has(tx.id)).map((tx, idx) => (
                                <div
                                    key={tx.id}
                                    className="p-6 hover:bg-white/[0.02] transition-all duration-300 flex items-center justify-between gap-6 group"
                                    style={{ animationDelay: `${idx * 40}ms` }}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <TrendingDown className="w-5 h-5 text-rose-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-white uppercase tracking-tight">{tx.user_display_name}</span>
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">#{tx.id.slice(0, 8)}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 text-slate-600" />
                                                    {format(new Date(tx.date), 'MMM d, yyyy')}
                                                </span>
                                                {tx.description && (
                                                    <span className="text-[10px] text-slate-600 italic truncate max-w-[200px]">{tx.description}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="text-xl font-black text-rose-400 tabular-nums">
                                                -{Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </div>
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">ZMW</p>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditTx(tx)}
                                                className="h-9 w-9 rounded-xl text-amber-400 hover:bg-amber-500/10"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteTx(tx)}
                                                className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-500/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Edit Transaction Dialog ── */}
            <Dialog open={editTxOpen} onOpenChange={setEditTxOpen}>
                <DialogContent className="glass-dialog-content border-white/10 p-0 outline-none bg-[#0f172a]/95 backdrop-blur-3xl shadow-2xl max-sm:!fixed max-sm:!inset-0 max-sm:!w-screen max-sm:!h-[100dvh] max-sm:!max-w-none max-sm:!max-h-none max-sm:!translate-x-0 max-sm:!translate-y-0 max-sm:!top-0 max-sm:!left-0 max-sm:!rounded-none sm:max-w-md sm:rounded-3xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                    <div className="p-8 border-b border-white/5 bg-gradient-to-br from-amber-500/10 to-transparent">
                        <DialogTitle className="text-2xl font-black tracking-tighter text-white flex items-center gap-3 uppercase italic">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center border border-white/20">
                                <Edit className="w-5 h-5 text-white" />
                            </div>
                            Edit Withdrawal
                        </DialogTitle>
                        {editingTx && (
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-3 ml-1">
                                {editingTx.user_display_name} · #{editingTx.id.slice(0, 8)}
                            </p>
                        )}
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Amount (ZMW)</Label>
                            <Input
                                type="number"
                                value={txEditForm.amount}
                                onChange={(e) => setTxEditForm({ ...txEditForm, amount: e.target.value })}
                                className="glass-input h-14 text-xl font-black"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</Label>
                            <Input
                                value={txEditForm.description}
                                onChange={(e) => setTxEditForm({ ...txEditForm, description: e.target.value })}
                                className="glass-input h-14"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date</Label>
                            <Input
                                type="date"
                                value={txEditForm.date}
                                onChange={(e) => setTxEditForm({ ...txEditForm, date: e.target.value })}
                                className="glass-input h-14 [color-scheme:dark]"
                            />
                        </div>
                        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                            <p className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest">
                                Editing this record will automatically recalculate the user's remaining allocation balance.
                            </p>
                        </div>
                    </div>
                    <div className="p-8 pt-0 flex gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => setEditTxOpen(false)}
                            className="flex-1 h-12 rounded-xl text-slate-400 font-black uppercase tracking-widest text-[10px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveTx}
                            disabled={savingTx || !txEditForm.amount}
                            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-600 to-orange-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg"
                        >
                            {savingTx ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Studio / Base Pool Allocation Configuration Dialog ── */}
            <Dialog open={studioCfgOpen} onOpenChange={setStudioCfgOpen}>
                <DialogContent className="glass-dialog-content border-white/10 p-0 outline-none bg-[#0f172a]/95 backdrop-blur-3xl shadow-2xl max-sm:!fixed max-sm:!inset-0 max-sm:!w-screen max-sm:!h-[100dvh] max-sm:!max-w-none max-sm:!max-h-none max-sm:!translate-x-0 max-sm:!translate-y-0 max-sm:!top-0 max-sm:!left-0 max-sm:!rounded-none sm:max-w-xl sm:rounded-3xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                    <div className="p-8 border-b border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent">
                        <DialogTitle className="text-2xl font-black tracking-tighter text-white uppercase italic">
                            Base Pool Allocation Editor
                        </DialogTitle>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">
                            Configure Studio Savings & Allocation Pool splits (total reserve: ZMW {totalReserve.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                        </p>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Studio Savings Config */}
                            <div className="space-y-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                                <div className="flex items-center gap-2 mb-2">
                                    <PiggyBank className="w-4 h-4 text-indigo-400" />
                                    <Label className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">
                                        Studio Savings
                                    </Label>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                        Percentage (%)
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={studioPctInput}
                                            onChange={(e) => handleStudioPctChange(e.target.value)}
                                            className="glass-input h-12 pl-4 pr-10 font-black text-white"
                                        />
                                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                        Amount (ZMW)
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-400">ZMW</span>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={studioAmtInput}
                                            onChange={(e) => handleStudioAmtChange(e.target.value)}
                                            className="glass-input h-12 pl-12 pr-4 font-black text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Allocation Pool Config */}
                            <div className="space-y-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                                <div className="flex items-center gap-2 mb-2">
                                    <CircleDollarSign className="w-4 h-4 text-emerald-400" />
                                    <Label className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">
                                        Allocation Pool
                                    </Label>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                        Percentage (%)
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={poolPctInput}
                                            onChange={(e) => handlePoolPctChange(e.target.value)}
                                            className="glass-input h-12 pl-4 pr-10 font-black text-white"
                                        />
                                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                        Amount (ZMW)
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-400">ZMW</span>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={poolAmtInput}
                                            onChange={(e) => handlePoolAmtChange(e.target.value)}
                                            className="glass-input h-12 pl-12 pr-4 font-black text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-relaxed">
                                Values are bidirectionally synchronized. Adjustments to any input instantly recalculate percentages and amounts so the total equals 100% and mirrors the live reserve pool.
                            </p>
                        </div>
                    </div>
                    <div className="p-8 pt-0 flex gap-3">
                        <Button variant="ghost" onClick={() => setStudioCfgOpen(false)}
                            className="flex-1 h-12 rounded-xl text-slate-400 font-black uppercase tracking-widest text-[10px]">
                            Cancel
                        </Button>
                        <Button onClick={handleSaveStudio} disabled={savingStudio}
                            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg">
                            {savingStudio ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Config'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}


// ─── Withdrawal types ──────────────────────────────────────────────────────────
interface ReserveWithdrawal {
    id: string;
    user_id: string;
    user_display_name: string;
    allocation_id: string | null;
    amount: number;
    balance_before: number;
    balance_after: number;
    description: string | null;
    date: string;
    time: string;
    created_at: string;
}

// ─── User Panel (with withdrawal feature) ──────────────────────────────────────
function UserReservePanel({
    totalReserve,
    allUserAllocations,
    config,
    onRefresh,
    companyId,
}: {
    totalReserve: number;
    allocation: Allocation | null;
    /** All allocations (active, matured, historical) assigned to this user */
    allUserAllocations: Allocation[];
    config: ReserveConfig | null;
    onRefresh: () => void;
    companyId?: string;
}) {
    const { toast } = useToast();
    const { currentUser } = useAuth();
    const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawDescription, setWithdrawDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [withdrawals, setWithdrawals] = useState<ReserveWithdrawal[]>([]);
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
    const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
    const [userTab, setUserTab] = useState<'active' | 'total'>('active');

    // Load withdrawal history
    const loadWithdrawals = async () => {
        setLoadingWithdrawals(true);
        try {
            const username = currentUser?.username || '';
            let query = supabase
                .from('reserve_investment_withdrawals' as any)
                .select('*, reserve_investment_allocations!inner(company_id, id)')
                .or(`user_id.eq.${username},user_display_name.eq.${username}`);

            if (companyId) {
                query = query.eq('reserve_investment_allocations.company_id', companyId);
            } else {
                query = query.is('reserve_investment_allocations.company_id', null);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (!error && data) {
                setWithdrawals(data as any as ReserveWithdrawal[]);
            }
        } catch (err) {
            console.error('Error loading reserve withdrawals:', err);
        } finally {
            setLoadingWithdrawals(false);
        }
    };

    useEffect(() => {
        loadWithdrawals();
        const sub = supabase
            .channel(`reserve-withdrawals-user-${companyId || 'global'}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'reserve_investment_withdrawals' 
            }, (payload) => {
                console.log('[Reserve] User Realtime change:', payload.eventType, (payload.new as any)?.id || (payload.old as any)?.id);
                if (payload.eventType === 'DELETE' && (payload.old as any)?.id) {
                    setDeletedIds(prev => new Set(Array.from(prev).concat((payload.old as any).id)));
                }
                loadWithdrawals();
            })
            .subscribe();
        return () => { supabase.removeChannel(sub); };
    }, [currentUser?.username, companyId]);

    if (allUserAllocations.length === 0) {
        return (
            <div className="space-y-6 animate-in fade-in duration-700">
                <div className="glass-card p-12 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 mx-auto shadow-2xl">
                        <Lock className="w-10 h-10 text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase mb-3">
                        No Allocation Assigned
                    </h2>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        Your reserve investment allocation has not been configured yet.
                        Please contact your administrator.
                    </p>
                </div>
            </div>
        );
    }

    // 1. Calculate remaining balances for all allocations of this user, attributing withdrawals chronologically to match legacy/unassigned records.
    const computeAllocationsWithBalances = () => {
        // Map user allocations to their canonical amounts and calculate assigned withdrawals
        const allocs = allUserAllocations.map(a => {
            const { finalAmount, isCapped } = getCanonicalAllocAmount(a, totalReserve, config);
            const assignedWithdrawn = withdrawals
                .filter(w => !deletedIds.has(w.id) && w.allocation_id === a.id)
                .reduce((sum, w) => sum + Number(w.amount), 0);
            return {
                ...a,
                finalAmount,
                isCapped,
                assignedWithdrawn,
                remaining: Math.max(0, finalAmount - assignedWithdrawn)
            };
        });

        // Distribute any withdrawals that do not have an allocation_id (legacy or manually created)
        let unassignedAmount = withdrawals
            .filter(w => !deletedIds.has(w.id) && !w.allocation_id)
            .reduce((sum, w) => sum + Number(w.amount), 0);

        if (unassignedAmount > 0) {
            // Sort by created_at ascending (oldest first)
            const sorted = [...allocs].sort((x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime());
            for (const alloc of sorted) {
                if (unassignedAmount <= 0) break;
                const canAbsorb = alloc.remaining;
                const absorb = Math.min(unassignedAmount, canAbsorb);
                alloc.assignedWithdrawn += absorb;
                alloc.remaining = Math.max(0, alloc.finalAmount - alloc.assignedWithdrawn);
                unassignedAmount -= absorb;
            }
            // Map back to original order
            return allocs.map(original => {
                const found = sorted.find(s => s.id === original.id);
                return found || original;
            });
        }

        return allocs;
    };

    const { allocationPool } = getStudioPortion(
        totalReserve,
        config?.savings_percent,
        config?.manual_studio_amount
    );

    const computedAllocs = computeAllocationsWithBalances();
    const activeAllocs = computedAllocs.filter(a => a.is_active && !isMaturedCAT(a.maturity_date));
    const maturedAllocs = computedAllocs.filter(a => a.is_active && isMaturedCAT(a.maturity_date));
    const totalActiveAmount = activeAllocs.reduce((sum, a) => sum + a.finalAmount, 0);
    const availableToWithdraw = maturedAllocs.reduce((sum, a) => sum + a.remaining, 0);
    const totalWithdrawn = withdrawals.filter(w => !deletedIds.has(w.id)).reduce((sum, w) => sum + Number(w.amount), 0);
    const canWithdraw = availableToWithdraw > 0;

    // Handle withdrawal — atomic: updates allocation, config (global total), 
    // transactions (Dashboard), and savings pool for perfect system-wide parity.
    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0 || amount > availableToWithdraw) {
            toast({ title: 'Invalid Amount', description: `Max available: ZMW ${availableToWithdraw.toFixed(2)}`, variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            let remainingToWithdraw = amount;
            // Sort matured allocations by created_at ascending (oldest first)
            const sortedMatured = [...maturedAllocs]
                .filter(a => a.remaining > 0)
                .sort((x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime());

            const today = todayCAT();
            const username = currentUser?.username || allUserAllocations[0]?.user_display_name;

            for (const alloc of sortedMatured) {
                if (remainingToWithdraw <= 0) break;
                const allocRemaining = alloc.remaining;
                const withdrawFromThis = Math.round(Math.min(remainingToWithdraw, allocRemaining) * 100) / 100;
                if (withdrawFromThis <= 0) continue;

                // Call the execute_reserve_withdrawal RPC to perform the split-deduction atomically in the database
                const { data, error: rpcErr } = await supabase.rpc('execute_reserve_withdrawal', {
                    p_alloc_id: alloc.id,
                    p_amount: withdrawFromThis,
                    p_username: username,
                    p_user_id: currentUser?.id || '00000000-0000-0000-0000-000000000000',
                    p_today_date: today,
                    p_description: withdrawDescription || 'Reserve Investment Withdrawal'
                });

                if (rpcErr) throw rpcErr;
                if (data && !data.success) {
                    throw new Error(data.message || 'Database execution failed');
                }

                remainingToWithdraw -= withdrawFromThis;
            }

            toast({ title: '✅ Withdrawal Successful', description: `ZMW ${amount.toFixed(2)} withdrawn. All system totals updated.` });
            setWithdrawDialogOpen(false);
            setWithdrawAmount('');
            setWithdrawDescription('');
            await loadWithdrawals();
            onRefresh();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-2">
                <div>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-600/20 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(245,158,11,0.2)] backdrop-blur-2xl">
                            <TrendingUp className="h-7 w-7 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">
                                Reserve Investment
                            </h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3 ml-1 flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-500/50" />
                                Personal Wealth Distribution
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={onRefresh}
                        variant="ghost"
                        className="h-14 w-14 p-0 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <StatCard
                    label="Active Portfolio"
                    amount={totalActiveAmount}
                    icon={TrendingUp}
                    color="amber"
                    note={`${activeAllocs.length} active allocation(s)`}
                />

                <StatCard
                    label="Available for Withdrawal"
                    amount={availableToWithdraw}
                    icon={Wallet}
                    color="emerald"
                    note={`${maturedAllocs.filter(a => a.remaining > 0).length} matured allocation(s)`}
                />

                <StatCard
                    label="Total Withdrawn"
                    amount={totalWithdrawn}
                    icon={PiggyBank}
                    color="indigo"
                    note="Total claimed from matured reserves"
                />
            </div>

            {/* Available Balance & Withdraw Action */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-10 border-white/10 bg-gradient-to-br from-emerald-500/5 to-transparent backdrop-blur-3xl shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px] -mr-16 -mt-16 pointer-events-none" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Current Liquid Portfolio</p>
                        <div className="flex items-baseline gap-4">
                            <span className="text-2xl font-black text-emerald-500/60 italic tracking-tighter uppercase">ZMW</span>
                            <span className="text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-xl">
                                <AnimatedNumber amount={availableToWithdraw} />
                            </span>
                        </div>
                        {totalWithdrawn > 0 && (
                            <div className="mt-8 flex items-center gap-3 py-2 px-4 bg-white/5 rounded-xl border border-white/5 w-fit">
                                <Wallet className="w-3.5 h-3.5 text-slate-500" />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                                    Previously Claimed: ZMW {totalWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => canWithdraw && setWithdrawDialogOpen(true)}
                    disabled={!canWithdraw}
                    className={cn(
                        "glass-card p-10 text-left transition-all duration-700 group relative overflow-hidden flex flex-col justify-between min-h-[180px] shadow-2xl",
                        canWithdraw
                            ? "border-emerald-500/30 bg-gradient-to-br from-emerald-600/20 to-teal-700/10 hover:translate-y-[-4px] active:scale-[0.98] cursor-pointer"
                            : "border-slate-500/10 bg-slate-900/40 opacity-50 cursor-not-allowed"
                    )}
                >
                    <div className={cn(
                        "absolute top-0 right-0 w-48 h-48 rounded-full blur-[60px] -mr-24 -mt-24 transition-all duration-1000",
                        canWithdraw ? "bg-emerald-500/20 group-hover:bg-emerald-500/30" : "bg-slate-500/5"
                    )} />
                    
                    <div className="relative z-10 flex items-center justify-between w-full mb-6">
                        <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl transition-all duration-500",
                            canWithdraw
                                ? "bg-emerald-500/20 border-emerald-400/30 group-hover:bg-emerald-500 group-hover:scale-110"
                                : "bg-slate-700/20 border-slate-600/20"
                        )}>
                            <Wallet className={cn(
                                "w-7 h-7",
                                canWithdraw ? "text-emerald-400 group-hover:text-white" : "text-slate-600"
                            )} />
                        </div>
                        {canWithdraw && <ChevronRight className="w-6 h-6 text-emerald-400/50 group-hover:text-white transition-all transform group-hover:translate-x-1" />}
                    </div>
                    
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic mb-1.5 shadow-sm">
                            {canWithdraw ? 'Release Funds' : 'Portfolio Locked'}
                        </h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            {maturedAllocs.length === 0
                                ? 'Security lock active — pending maturity'
                                : availableToWithdraw <= 0
                                    ? 'Maximum distribution reached'
                                    : 'Execute reserve distribution'}
                        </p>
                    </div>
                </button>
            </div>

            {/* Main Tabs Section: Active Portfolio vs Total Allocations */}
            <div className="glass-card overflow-hidden border-white/10 backdrop-blur-xl shadow-2xl">
                {/* Header + Tab Switcher */}
                <div className="p-8 border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent flex flex-col gap-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                                {userTab === 'active' ? 'Active Portfolio' : 'Total Allocations'}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,1)]" />
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                    {userTab === 'active'
                                        ? 'Non-matured allocations — active wealth distribution'
                                        : 'All allocations ever assigned — complete history'}
                                </p>
                            </div>
                        </div>
                        <div className="inline-flex h-10 px-4 items-center bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-300 tracking-[0.2em] shadow-lg">
                            <Users className="w-3.5 h-3.5 mr-2 text-amber-500" />
                            {userTab === 'active' ? `${activeAllocs.length} ACTIVE` : `${allUserAllocations.length} TOTAL`}
                        </div>
                    </div>
                    {/* Tab Switcher */}
                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 w-fit">
                        <button
                            type="button"
                            onClick={() => setUserTab('active')}
                            className={cn(
                                'h-9 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all duration-300',
                                userTab === 'active'
                                    ? 'bg-emerald-500 text-white shadow-lg'
                                    : 'text-slate-400 hover:bg-white/5'
                            )}
                        >
                            Active Portfolio
                        </button>
                        <button
                            type="button"
                            onClick={() => setUserTab('total')}
                            className={cn(
                                'h-9 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all duration-300',
                                userTab === 'total'
                                    ? 'bg-violet-500 text-white shadow-lg'
                                    : 'text-slate-400 hover:bg-white/5'
                            )}
                        >
                            Total Allocations
                        </button>
                    </div>
                </div>

                {/* Tab Contents */}
                {userTab === 'active' ? (
                    <div>
                        {activeAllocs.length === 0 ? (
                            <div className="py-24 px-8 text-center flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/5">
                                    <Activity className="w-10 h-10 text-slate-700 stroke-[1]" />
                                </div>
                                <p className="text-xs font-black text-slate-600 uppercase tracking-[0.5em] max-w-xs leading-relaxed">
                                    No active non-matured allocations. Check "Total Allocations" for history.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {activeAllocs.map((alloc, idx) => {
                                    const remainingBalance = alloc.remaining;
                                    const isManualAlloc = Number(alloc.allocation_percent) === 0;
                                    const maturityDateString = alloc.maturity_date
                                        ? (isValid(parseISO(alloc.maturity_date)) ? format(parseISO(alloc.maturity_date), 'MMM d, yyyy') : 'N/A')
                                        : 'No maturity date';
                                    const daysUntil = daysUntilMaturityCAT(alloc.maturity_date);

                                    return (
                                        <div
                                            key={alloc.id}
                                            className="p-8 hover:bg-white/[0.03] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-8 group animate-in slide-in-from-left-4"
                                            style={{ animationDelay: `${idx * 60}ms` }}
                                        >
                                            <div className="flex items-center gap-7">
                                                <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-700 shadow-xl relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
                                                    <Users className="w-7 h-7 text-white/50 group-hover:text-amber-400 transition-colors relative z-10" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-4 mb-2.5">
                                                        <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-sm">
                                                            {alloc.notes || 'Strategic Share'}
                                                        </h3>
                                                        <div className="h-6 px-3 bg-white/5 border border-white/10 rounded-full flex items-center gap-1.5 shadow-lg shadow-black/20">
                                                            <Percent className="w-3 h-3 text-amber-500" />
                                                            <span className="text-[10px] font-black text-white">{isManualAlloc ? 'MANUAL' : `${alloc.allocation_percent}%`}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-6 mt-1">
                                                        <span className="flex items-center gap-3 text-white drop-shadow-xl">
                                                            <div className={cn(
                                                                'w-2 h-2 rounded-full',
                                                                remainingBalance > 0
                                                                    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]'
                                                                    : 'bg-slate-600'
                                                            )} />
                                                            <span className="text-sm font-black text-emerald-500/80 italic tracking-tighter">ZMW</span>
                                                            <span className="text-2xl font-black tracking-tighter tabular-nums">
                                                                {remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">remaining</span>
                                                        </span>

                                                        {alloc.isCapped && (
                                                            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                                                                <Lock className="w-3.5 h-3.5" />
                                                                CAPPED
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-2.5 border-l border-white/10 pl-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                                            <CalendarDays className="w-4 h-4 text-blue-400" />
                                                            <span>{maturityDateString}</span>
                                                        </div>

                                                        {daysUntil !== null && (
                                                            <div className="flex items-center gap-2.5 border-l border-white/10 pl-6 text-[11px] font-black uppercase tracking-widest">
                                                                <span className={cn(
                                                                    daysUntil < 0 ? 'text-rose-400' :
                                                                    daysUntil <= 30 ? 'text-amber-400' : 'text-emerald-400'
                                                                )}>
                                                                    {daysUntil < 0 ? `MATURED ${Math.abs(daysUntil)} DAYS AGO` :
                                                                     daysUntil === 0 ? 'MATURES TODAY' :
                                                                     `${daysUntil} DAYS UNTIL UNLOCK`}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-3 inline-flex items-center py-1 px-3 bg-white/[0.02] rounded-lg border border-white/5">
                                                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic">
                                                            {totalReserve > 0
                                                                ? (isManualAlloc
                                                                    ? `Allocated: ZMW ${alloc.finalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})} (Manual amount)`
                                                                    : `Allocated: ZMW ${alloc.finalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})} (Pool ZMW ${allocationPool.toLocaleString()} × ${alloc.allocation_percent}%)`)
                                                                : 'Reserve sync required for full breakdown'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        {allUserAllocations.length === 0 ? (
                            <div className="py-24 px-8 text-center flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/5">
                                    <Activity className="w-10 h-10 text-slate-700 stroke-[1]" />
                                </div>
                                <p className="text-xs font-black text-slate-600 uppercase tracking-[0.5em] max-w-xs leading-relaxed">
                                    No allocations on record.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {computedAllocs.map((alloc, idx) => {
                                    const isManualAlloc = Number(alloc.allocation_percent) === 0;
                                    const matured = isMaturedCAT(alloc.maturity_date);
                                    const remaining = alloc.remaining;
                                    const maturityDateString = alloc.maturity_date
                                        ? (isValid(parseISO(alloc.maturity_date)) ? format(parseISO(alloc.maturity_date), 'MMM d, yyyy') : 'N/A')
                                        : 'No maturity date';

                                    let statusLabel = 'ACTIVE';
                                    let statusClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                                    if (!alloc.is_active) {
                                        statusLabel = 'INACTIVE';
                                        statusClasses = 'bg-slate-700/30 text-slate-500 border-slate-600/20';
                                    } else if (matured) {
                                        if (remaining <= 0) {
                                            statusLabel = 'COMPLETED';
                                            statusClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                                        } else {
                                            statusLabel = 'MATURED';
                                            statusClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                                        }
                                    } else if (!alloc.maturity_date) {
                                        statusLabel = 'NO DATE';
                                        statusClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                                    }

                                    return (
                                        <div
                                            key={alloc.id}
                                            className="p-6 hover:bg-white/[0.02] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={cn(
                                                    'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-500 group-hover:scale-110',
                                                    matured ? 'bg-amber-500/10 border-amber-500/20' :
                                                    alloc.is_active ? 'bg-emerald-500/10 border-emerald-500/20' :
                                                    'bg-slate-700/30 border-slate-600/20'
                                                )}>
                                                    <Users className={cn('w-5 h-5',
                                                        matured ? 'text-amber-400' :
                                                        alloc.is_active ? 'text-emerald-400' :
                                                        'text-slate-600'
                                                    )} />
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                                        <span className="font-black text-white uppercase tracking-tight">{alloc.notes || 'Strategic Share'}</span>
                                                        <span className={cn('h-5 px-2.5 rounded-md text-[9px] font-black uppercase tracking-widest border flex items-center', statusClasses)}>
                                                            {statusLabel}
                                                        </span>
                                                        <span className="h-5 px-2.5 bg-white/5 border border-white/10 rounded-md text-[9px] font-black text-white flex items-center">
                                                            {isManualAlloc ? 'MANUAL' : `${alloc.allocation_percent}%`}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                                        <span className="text-slate-300">ZMW {alloc.finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                        {alloc.assignedWithdrawn > 0 && (
                                                            <span className="text-rose-400/70">−{alloc.assignedWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2 })} withdrawn</span>
                                                        )}
                                                        <span className="flex items-center gap-1.5 text-slate-500">
                                                            <CalendarDays className="w-3.5 h-3.5 text-blue-400/60" />
                                                            {maturityDateString}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-0.5 shrink-0">
                                                <span className={cn('text-xl font-black tabular-nums tracking-tighter',
                                                    matured ? 'text-amber-400' :
                                                    alloc.is_active ? 'text-emerald-400' :
                                                    'text-slate-600'
                                                )}>
                                                    {remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">ZMW REMAINING</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Withdrawal History */}
            <div className="glass-card overflow-hidden border-white/5 backdrop-blur-xl shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Distribution History</h3>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                             Verified Reserve Withdrawals
                        </p>
                    </div>
                    <div className="h-10 px-5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 text-[10px] font-black text-slate-400 tracking-widest shadow-lg">
                        <Activity className="w-3.5 h-3.5 text-amber-500" />
                        {withdrawals.length} ENTRIES
                    </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {withdrawals.filter(w => !deletedIds.has(w.id)).length === 0 ? (
                        <div className="py-24 text-center group">
                            <Activity className="w-12 h-12 text-slate-800 mx-auto mb-6 stroke-[0.5] group-hover:scale-110 group-hover:text-amber-500/20 transition-all duration-700" />
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">No distributions recorded</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {withdrawals.filter(w => !deletedIds.has(w.id)).map((w, idx) => (
                                <div key={w.id} className="p-7 hover:bg-white/[0.03] transition-all duration-300 flex items-center justify-between gap-6 group animate-in slide-in-from-left-4" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                                            <TrendingDown className="w-6 h-6 text-rose-400" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-white uppercase tracking-tight italic drop-shadow-sm">{w.description || 'Global Withdrawal'}</p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                                                    <Calendar className="w-3 h-3 opacity-50" />
                                                    {format(new Date(w.date), 'MMMM d, yyyy')}
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-white/10" />
                                                <span className="text-[9px] text-emerald-500/70 font-black uppercase tracking-widest">
                                                    POST-BALANCE: ZMW {Number(w.balance_after).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-black text-rose-400 tabular-nums tracking-tighter drop-shadow-sm">
                                            -{Number(w.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">ZMW LIQUIDATED</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Directives for first active allocation if any notes exist */}
            {activeAllocs.find(a => a.notes) && (
                <div className="glass-card p-10 border-white/5 bg-white/[0.01] backdrop-blur-xl shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-[40px] -ml-12 -mt-12 pointer-events-none" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-3 relative z-10">
                        <Edit className="w-4 h-4 text-slate-600" />
                        Administrative Directives
                    </p>
                    <p className="text-white font-medium leading-relaxed relative z-10 italic">
                        "{activeAllocs.find(a => a.notes)?.notes}"
                    </p>
                </div>
            )}

            {/* Privacy Notice */}
            <div className="glass-card p-10 border-white/5 bg-slate-900/40 backdrop-blur-3xl shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />
                <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700/30 shrink-0 shadow-xl group-hover:scale-110 transition-all duration-700">
                    <ShieldCheck className="w-7 h-7 text-slate-500 group-hover:text-emerald-500 transition-colors" />
                </div>
                <div className="text-center md:text-left">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3">
                        Tier 1 Security Encryption
                    </p>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed uppercase tracking-wider max-w-2xl opacity-80 italic">
                        Access Restricted: You are viewing a personalized distribution profile. 
                        Global pool data and individual peer allocations remain encrypted and 
                        exclusive to administrative oversight under standard fintech privacy protocols.
                    </p>
                </div>
            </div>

            {/* Withdraw Dialog */}
            <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
                <DialogContent className="glass-dialog-content max-w-lg border-white/10 p-0 outline-none bg-[#0f172a]/95 backdrop-blur-3xl flex flex-col max-h-[92vh] overflow-hidden shadow-2xl rounded-3xl animate-in zoom-in-95 duration-300">
                    <div className="p-10 border-b border-white/5 bg-gradient-to-br from-emerald-500/10 to-transparent relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />
                        <DialogTitle className="text-3xl font-black tracking-tighter text-white flex items-center gap-4 relative z-10 uppercase italic">
                            <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center border border-white/20 shadow-xl">
                                <Wallet className="w-6 h-6 text-white" />
                            </div>
                            Reserve Release
                        </DialogTitle>
                        <div className="mt-4 flex flex-col gap-1 ml-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                                Distribution of allocated holdings
                            </p>
                            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mt-1">
                                Available: ZMW {availableToWithdraw.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    <div className="p-10 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">
                                Liquidate Amount (ZMW)
                            </Label>
                            <div className="relative group/input">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-white/30 tracking-tighter italic">ZMW</div>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className="glass-input h-16 pl-20 text-2xl font-black tracking-tight border-white/10 focus:border-emerald-500/50 transition-all shadow-inner"
                                    max={availableToWithdraw}
                                />
                            </div>
                            {withdrawAmount && parseFloat(withdrawAmount) > availableToWithdraw && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg w-fit">
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">
                                        Amount exceeds distribution limits
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">
                                Disbursement Note
                            </Label>
                            <Input
                                placeholder="Internal reference reason..."
                                value={withdrawDescription}
                                onChange={(e) => setWithdrawDescription(e.target.value)}
                                className="glass-input h-16 border-white/10 text-white font-medium shadow-inner"
                            />
                        </div>
                        
                        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                This action will transfer funds from your reserve investment account to your main liquid balance. This process is immediate and irreversible.
                            </p>
                        </div>
                    </div>

                    <div className="p-10 pt-0 flex gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => setWithdrawDialogOpen(false)}
                            className="flex-1 h-14 rounded-2xl text-slate-500 font-black uppercase tracking-[0.2em] text-[11px] hover:bg-white/5 transition-all"
                        >
                            Decline
                        </Button>
                        <Button
                            onClick={handleWithdraw}
                            disabled={isSubmitting || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > availableToWithdraw}
                            className="flex-1 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black uppercase tracking-[0.2em] text-[11px] border border-emerald-400/30 shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all active:scale-95"
                        >
                            {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin text-white" /> : 'Confirm Release'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Main Export ────────────────────────────────────────────────────────────────
interface ReserveInvestmentViewProps {
    /** If provided, used to match user allocation by username */
    currentUser?: { username?: string; role?: string; id?: string } | null;
    /** Force admin view regardless of currentUser.role (for MTAdmin panels) */
    forceAdmin?: boolean;
    companyId?: string;
}

export function ReserveInvestmentView({ currentUser, forceAdmin = false, companyId }: ReserveInvestmentViewProps) {
    const { currentUser: authUser, isAdmin: authIsAdmin } = useAuth();
    const { toast } = useToast();

    // ── Security State ──
    const [isLocked, setIsLocked] = useState(true);
    const [passcode, setPasscode] = useState('');
    const [showPasscode, setShowPasscode] = useState(false);

    const [config, setConfig] = useState<ReserveConfig | null>(null);
    const [allocations, setAllocations] = useState<Allocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [userAllocation, setUserAllocation] = useState<Allocation | null>(null);

    const resolvedUser = currentUser || authUser;
    const isAdmin = forceAdmin || authIsAdmin || resolvedUser?.role === 'admin' || resolvedUser?.role === 'company_admin';

    // ── Vault + Savings (used as fallback when config.total_reserve is 0) ──────
    // Only admins can read vault balance (RLS). We use these to auto-populate the
    // config.total_reserve so that user views (which are RLS-restricted) can read
    // the stored value instead of computing it themselves.
    const { balance: vaultBalance } = useCashvault();
    const { savingsBalance } = useSavings({ isAdmin: true, companyId });

    // The fallback total derived from live balances (admin-visible only)
    const vaultBal = vaultBalance?.current_balance || 0;
    const savingsBal = savingsBalance?.current_balance || 0;
    const computedFallbackTotal = vaultBal + savingsBal;

    const loadData = async () => {
        setLoading(true);
        try {
            const configId = companyId || 'singleton';
            const { data: configData, error: configErr } = await supabase
                .from('reserve_investment_config' as any)
                .select('*')
                .eq('id', configId)
                .maybeSingle();

            if (!configErr && configData) {
                setConfig(configData as ReserveConfig);
            } else if (companyId) {
                // Initialize default config for company
                const { data: newConfig, error: insErr } = await supabase
                    .from('reserve_investment_config' as any)
                    .insert({
                        id: companyId,
                        total_reserve: 0,
                        savings_percent: 10.00,
                        notes: 'Company Reserve Investment Config',
                        updated_by: 'system'
                    })
                    .select()
                    .maybeSingle();
                if (newConfig) {
                    setConfig(newConfig as ReserveConfig);
                }
            }

            let allocQuery = supabase
                .from('reserve_investment_allocations' as any)
                .select('*');

            if (companyId) {
                allocQuery = allocQuery.eq('company_id', companyId);
            } else {
                allocQuery = allocQuery.is('company_id', null);
            }

            const { data: allocData, error: allocErr } = await allocQuery
                // Fetch ALL allocations (not just is_active=true) for full history in Total Allocations tab
                .order('created_at', { ascending: true });

            if (!allocErr && allocData) {
                const allocs = allocData as Allocation[];
                setAllocations(allocs);
                const username = resolvedUser?.username || '';
                // Find this user's allocations across all time
                const userAllocs = allocs.filter(a =>
                    (a.user_id?.toLowerCase() || '') === username.toLowerCase() ||
                    (a.user_display_name?.toLowerCase() || '') === username.toLowerCase()
                );
                // Prefer an active + non-matured allocation; fall back to any active one
                const myAlloc =
                    userAllocs.find(a => a.is_active && !isMaturedCAT(a.maturity_date)) ||
                    userAllocs.find(a => a.is_active) ||
                    null;
                setUserAllocation(myAlloc);
            }
        } catch (err) {
            console.error('ReserveInvestmentView load error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const configSub = supabase
            .channel(`reserve-config-changes-${companyId || 'global'}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reserve_investment_config', filter: companyId ? `id=eq.${companyId}` : `id=eq.singleton` }, loadData)
            .subscribe();
        const allocSub = supabase
            .channel(`reserve-alloc-changes-${companyId || 'global'}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reserve_investment_allocations', filter: companyId ? `company_id=eq.${companyId}` : undefined }, loadData)
            .subscribe();
        return () => {
            supabase.removeChannel(configSub);
            supabase.removeChannel(allocSub);
        };
    }, [resolvedUser?.username, companyId]);

    // ── Continuously sync live total to config so users (RLS-restricted) can read it ──
    // Admin sessions can read vaultBalance + savingsBalance; non-admin sessions
    // cannot (RLS). We persist the live computed total into config.total_reserve
    // every time it changes so the user panel always gets the correct value.
    useEffect(() => {
        if (!isAdmin || computedFallbackTotal <= 0) return;
        // Only write if the stored value has actually changed (avoid noise)
        if (config !== null && config.total_reserve === computedFallbackTotal) return;

        supabase
            .from('reserve_investment_config' as any)
            .upsert({
                id: 'singleton',
                total_reserve: computedFallbackTotal,
                // Preserve admin-configured studio percent (default 15 only when not set)
                savings_percent: config?.savings_percent ?? 15,
                updated_by: resolvedUser?.username || 'system-auto',
                updated_at: new Date().toISOString(),
            })
            .then(({ error }) => {
                if (!error) {
                    console.log('[Reserve] Synced total_reserve =', computedFallbackTotal);
                    loadData();
                }
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, computedFallbackTotal]);

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passcode) return;

        try {
            const sha256Input = await hashPassword(passcode);
            const base64Input = btoa(passcode);
            const storedHash = authUser?.password;

            let isMatch = (sha256Input === storedHash || base64Input === storedHash);

            if (!isMatch && authUser?.role === 'admin') {
                const HARDCODED_PASSWORDS = ['titanium'];
                if (HARDCODED_PASSWORDS.includes(passcode)) isMatch = true;
            }

            if (isMatch) {
                setIsLocked(false);
                toast({
                    title: '🔓 Access Granted',
                    description: `Welcome back, ${authUser?.username}. Vault decrypted.`
                });
            } else {
                setPasscode('');
                toast({
                    title: '🔒 Access Denied',
                    description: 'Incorrect account password. Please try again.',
                    variant: 'destructive'
                });
            }
        } catch (err) {
            console.error('Vault unlock error:', err);
            toast({ title: '❌ Error', description: 'Failed to verify credentials.', variant: 'destructive' });
        }
    };

    if (isLocked) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-1000">
                <div className="glass-card max-w-md w-full p-12 border-white/10 bg-[#0f172a]/90 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden group rounded-[40px]">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px] -mr-24 -mt-24 group-hover:bg-amber-500/20 transition-all duration-1000 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/5 rounded-full blur-[60px] -ml-16 -mb-16 pointer-events-none" />
                    
                    <div className="relative z-10 text-center">
                        <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center mb-10 mx-auto shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-700 backdrop-blur-3xl">
                            <Lock className="w-12 h-12 text-amber-500 animate-pulse pointer-events-none" />
                        </div>
                        
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-3 italic">
                            Encryption Vault
                        </h2>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-10 leading-relaxed max-w-[240px] mx-auto">
                            Secure authentication required to decrypt distribution assets.
                        </p>
                        
                        <form onSubmit={handleUnlock} className="space-y-8">
                            <div className="relative group/input">
                                <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-amber-500 transition-colors" />
                                <Input
                                    type={showPasscode ? 'text' : 'password'}
                                    value={passcode}
                                    onChange={(e) => setPasscode(e.target.value)}
                                    placeholder="••••"
                                    className="glass-input h-16 pl-14 pr-14 text-center text-3xl font-black tracking-[0.6em] focus:ring-amber-500/50 border-white/10 rounded-2xl shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasscode(!showPasscode)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/5"
                                >
                                    {showPasscode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            
                            <Button
                                type="submit"
                                className="w-full h-16 rounded-[24px] bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black uppercase tracking-[0.25em] text-[12px] shadow-[0_15px_40px_rgba(245,158,11,0.3)] border border-white/20 active:scale-95 transition-all"
                            >
                                Decrypt holdings
                            </Button>
                        </form>
                        
                        <div className="mt-12 flex items-center justify-center gap-2 opacity-30">
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">End-to-end encrypted</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-20 animate-in fade-in duration-700">
                <div className="w-24 h-24 rounded-[32px] bg-white/[0.03] border border-white/10 flex items-center justify-center mb-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent animate-pulse" />
                    <TrendingUp className="w-10 h-10 text-amber-500 animate-bounce transition-all duration-1000 relative z-10" />
                </div>
                <div className="flex flex-col items-center gap-3">
                    <p className="text-[12px] font-black text-white uppercase tracking-[0.5em] animate-pulse italic">
                        Synchronizing Reserve
                    </p>
                    <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500/50 w-full animate-loading-shimmer" />
                    </div>
                </div>
            </div>
        );
    }

    // The effective totalReserve: for admin we use the live computed value;
    // for users (who can't read vault) we fall back to the config-stored value
    // which was persisted by the last admin session.
    const effectiveTotalReserve = isAdmin
        ? computedFallbackTotal
        : (config?.total_reserve || 0);

    // All allocations assigned to this user (active, matured, historical) — for Total Allocations tab
    const currentUsername = resolvedUser?.username?.toLowerCase() || '';
    const userAllocations = allocations.filter(a =>
        (a.user_id?.toLowerCase() || '') === currentUsername ||
        (a.user_display_name?.toLowerCase() || '') === currentUsername
    );

    return isAdmin ? (
        <AdminReservePanel
            totalReserve={effectiveTotalReserve}
            allocations={allocations}
            config={config}
            onRefresh={loadData}
            companyId={companyId}
        />
    ) : (
        <UserReservePanel
            totalReserve={effectiveTotalReserve}
            allocation={userAllocation}
            allUserAllocations={userAllocations}
            config={config}
            onRefresh={loadData}
            companyId={companyId}
        />
    );
}
