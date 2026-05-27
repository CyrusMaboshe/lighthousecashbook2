import React from 'react';
import { CountUp } from '@/components/ui/CountUp';
import { GlassBalanceHero } from './GlassBalanceHero';
import { GlassActionGrid } from './GlassActionGrid';
import { GlassTransactionList } from './GlassTransactionList';
import { TransactionDetailDialog } from './TransactionDetailDialog';
import { TransactionForm } from '@/components/TransactionForm';
import { GlassView } from './GlassAppShell';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import { useSystemBalance } from '@/hooks/useSystemBalance';
import { useSavings } from '@/hooks/useSavings';
import { useCashvault } from '@/hooks/useCashvault';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { verifyUserPassword } from '@/services/passwordVerificationService';

interface GlassHomeViewProps {
  onViewChange: (view: GlassView) => void;
  onCashIn: () => void;
  onCashOut: () => void;
  companyId?: string;
}

export function GlassHomeView({ onViewChange, onCashIn, onCashOut, companyId }: GlassHomeViewProps) {
  const [showPasswordDialog, setShowPasswordDialog] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<'hide' | 'reveal' | 'view-total-reserve' | null>(null);
  const [showTotalReserve, setShowTotalReserve] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);
  const [showTransactionDetail, setShowTransactionDetail] = React.useState(false);
  const [showTransactionForm, setShowTransactionForm] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);

  const { transactions, updateTransaction, deleteTransaction } = useTransactions();
  const { systemState } = useSystemBalance();
  const { balance: vaultBalance } = useCashvault();
  const { savingsBalance } = useSavings({ companyId });
  const { isAdmin, currentUser, systemSettings } = useAuth();
  const { categories, addCategory } = useCategories();
  const { preferences, updatePreferences, loading: preferencesLoading } = useUserPreferences();
  const { toast } = useToast();

  // Use persistent preference instead of local state
  const hideBalance = preferences.hideHomepageBalance;

  // Handle balance visibility toggle request with password verification
  const handleToggleRequest = () => {
    setPendingAction(hideBalance ? 'reveal' : 'hide');
    setShowPasswordDialog(true);
  };

  const handleTotalReserveRequest = () => {
    setPendingAction('view-total-reserve');
    setShowPasswordDialog(true);
  };

  // Verify admin password
  const verifyPassword = async () => {
    if (!currentUser || !password.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      const isPasswordCorrect = await verifyUserPassword(currentUser.email || '', password);

      if (isPasswordCorrect) {
        // Password verified - execute the pending action
        try {
          if (pendingAction === 'view-total-reserve') {
            setShowTotalReserve(true);
          } else if (pendingAction === 'hide' || pendingAction === 'reveal') {
            const newHideState = pendingAction === 'hide';
            await updatePreferences({ hideHomepageBalance: newHideState });
            toast({
              title: newHideState ? "Balance Hidden" : "Balance Revealed",
              description: newHideState ? "Balance information is now hidden" : "Balance information is visible",
            });
          }

          // Close dialog and reset
          setShowPasswordDialog(false);
          setPassword('');
          setPendingAction(null);
        } catch (error) {
          console.error('Action failed:', error);
        }
      } else {
        toast({
          title: "Access Denied",
          description: "Incorrect password. Please try again.",
          variant: "destructive",
        });
        setPassword('');
      }
    } catch (error) {
      console.error('Password verification error:', error);
      toast({
        title: "Verification Failed",
        description: "Unable to verify password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyPassword();
  };

  const handleDialogClose = () => {
    setShowPasswordDialog(false);
    setPassword('');
    setShowPassword(false);
    setPendingAction(null);
  };

  // Handle transaction edit
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
    setShowTransactionDetail(false);
  };

  // Handle transaction delete
  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
      toast({
        title: "Transaction Deleted",
        description: "The transaction has been successfully deleted.",
      });
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      toast({
        title: "Delete Failed",
        description: "Unable to delete transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle transaction update
  const handleUpdateTransaction = async (id: string, updatedData: Partial<Transaction>) => {
    try {
      await updateTransaction(id, updatedData);
      setShowTransactionForm(false);
      setEditingTransaction(null);
      toast({
        title: "Transaction Updated",
        description: "The transaction has been successfully updated.",
      });
    } catch (error) {
      console.error('Failed to update transaction:', error);
      toast({
        title: "Update Failed",
        description: "Unable to update transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const totals = React.useMemo(() => {
    const relevantTx = isAdmin ? transactions : transactions.filter(t => t.added_by === currentUser?.username);
    const cashIn = relevantTx.filter(t => t.type === 'cash-in').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    // All cash-outs including reserve — kept for reference / future use
    // const cashOutFull = relevantTx.filter(t => t.type === 'cash-out').reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
    // Operational cash-out: EXCLUDES Reserve Investment Withdrawals.
    // Reserve withdrawals are internal reserve-liquidity movements, not new operational expenses.
    // They must NOT inflate the homepage outgoing balance.
    const operationalCashOut = relevantTx
      .filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal')
      .reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);

    // Calculate total pictures
    const pictures = relevantTx
      .filter(t => t.type === 'cash-in')
      .reduce((s, t) => s + (Number(t.number_of_pictures) || 0), 0);

    return { cashIn, operationalCashOut, net: cashIn - operationalCashOut, pictures };
  }, [transactions, isAdmin, currentUser]);

  const activityTransactions = React.useMemo(() => {
    // Show only cash-in (deposit) transactions, most recent 25
    return [...transactions]
      .filter(t => t.type === 'cash-in')
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return b.id.localeCompare(a.id);
      })
      .slice(0, 25);
  }, [transactions]);

  return (
    <div className="w-full">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0">
        <GlassBalanceHero
          netBalance={isAdmin ? systemState.netSystemBalance : totals.net}
          totalCashIn={isAdmin ? systemState.totalCashIn : totals.cashIn}
          totalCashOut={
            // HOMEPAGE OUTGOING: excludes Reserve Investment Withdrawals.
            // These are internal reserve-liquidity movements, not operational expenses.
            // Admin: uses operationalCashOut from DB (get_system_balance_status → operational_cash_out)
            // User:  uses operationalCashOut computed from transactions (already filtered above)
            isAdmin ? systemState.operationalCashOut : totals.operationalCashOut
          }
          totalPictures={totals.pictures}
          hideBalance={hideBalance}
          onToggleHide={handleToggleRequest}
          isAdmin={isAdmin}
        />

        <div className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight text-white/90 px-2">Quick Actions</h3>
          <GlassActionGrid
            onViewChange={onViewChange}
            onCashIn={onCashIn}
            onCashOut={onCashOut}
            isAdmin={isAdmin}
            cashVaultBalance={vaultBalance?.current_balance || 0}
            savingsBalance={savingsBalance?.current_balance || 0}
            onTotalReserveClick={handleTotalReserveRequest}
            companyId={companyId}
          />
        </div>

        <div className="pt-2 w-full">
          <GlassTransactionList
            transactions={activityTransactions as any}
            onTransactionClick={(transaction) => {
              if (hideBalance) return;
              setSelectedTransaction(transaction as Transaction);
              setShowTransactionDetail(true);
            }}
            showViewAll={false}
            maxItems={1000}
            hideDetails={hideBalance}
            onRevealClick={handleToggleRequest}
          />
        </div>
      </div>

      {/* Transaction Detail Dialog */}
      <TransactionDetailDialog
        transaction={selectedTransaction}
        isOpen={showTransactionDetail}
        onClose={() => {
          setShowTransactionDetail(false);
          setSelectedTransaction(null);
        }}
        isAdmin={isAdmin}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
      />

      {/* Admin Password Verification Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="!bg-[#0f172a]/95 backdrop-blur-3xl border-white/10 sm:max-w-md fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] gap-4 shadow-2xl z-[100] !animate-none duration-0 !transition-none text-white outline-none rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Shield className="w-5 h-5 text-cyan-400" />
              Secure Access Required
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              {pendingAction === 'view-total-reserve'
                ? 'Enter your password to view secure reserve.'
                : 'Enter your password to continue.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-white">Admin Password</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isVerifying}
                    className="glass-input pr-10"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-white/10"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isVerifying}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isVerifying || !password.trim()}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400/30"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Password'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
                  disabled={isVerifying}
                  className="glass-button border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>


      {/* Transaction Form Dialog for Editing */}
      <Dialog open={showTransactionForm} onOpenChange={(open) => {
        setShowTransactionForm(open);
        if (!open) {
          setEditingTransaction(null);
        }
      }}>
        <DialogContent className="glass-card-static border-white/10 max-w-2xl w-[95vw] fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-h-[90vh] overflow-hidden p-0 outline-none flex flex-col z-[100] !animate-none transition-none">
          <TransactionForm
            type={editingTransaction?.type || 'cash-in'}
            onSubmit={async (transaction) => {
              // This is only called if NOT editing (creating new)
              // We don't need this path in home view since we only edit here
            }}
            onCancel={() => {
              setShowTransactionForm(false);
              setEditingTransaction(null);
            }}
            onAddCategory={addCategory}
            categories={categories}
            initialTransaction={editingTransaction || undefined}
            onUpdate={handleUpdateTransaction}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showTotalReserve} onOpenChange={setShowTotalReserve}>
        <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] sm:max-w-md p-8 shadow-[0_0_60px_-15px_rgba(59,130,246,0.5)] z-[100] gap-6 !animate-none duration-0 !transition-none !bg-gradient-to-br !from-[#020817]/95 !to-[#0f172a]/95 backdrop-blur-3xl border border-blue-500/30 outline-none rounded-3xl overflow-hidden">
          {/* Decorative background glows */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-[60px] pointer-events-none" />

          <DialogHeader className="mb-2 relative z-10">
            <DialogTitle className="text-2xl font-black text-center text-white flex flex-col items-center gap-3 tracking-tight">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center border border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <Shield className="w-7 h-7 text-blue-400" />
              </div>
              Total Reserve
              <span className="text-xs font-semibold text-blue-200/70 uppercase tracking-[0.2em] mt-1">Combined secure holdings</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-8 py-2 relative z-10">
            <div className="text-center w-full relative">
              <div className="text-[56px] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-100 to-blue-300 drop-shadow-sm tracking-tighter mb-4 animate-in slide-in-from-bottom-2 duration-700">
                <CountUp
                  end={(vaultBalance?.current_balance || 0) + (savingsBalance?.current_balance || 0)}
                  prefix="ZMW "
                  decimals={2}
                  duration={2.5}
                />
              </div>
              <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-[#0f172a]/40 rounded-2xl p-5 border border-blue-500/20 flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-[1.02] duration-300">
                <span className="text-[10px] text-blue-300/80 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 blur-[1px]"></div>
                  Cash Vault
                </span>
                <span className="text-xl font-bold text-white tracking-tight">
                  <CountUp end={vaultBalance?.current_balance || 0} prefix="ZMW " />
                </span>
              </div>
              <div className="bg-[#0f172a]/40 rounded-2xl p-5 border border-blue-500/20 flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-[1.02] duration-300">
                <span className="text-[10px] text-blue-300/80 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 blur-[1px]"></div>
                  Savings
                </span>
                <span className="text-xl font-bold text-white tracking-tight">
                  <CountUp end={savingsBalance?.current_balance || 0} prefix="ZMW " />
                </span>
              </div>
            </div>

            <Button
              onClick={() => setShowTotalReserve(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/25 border-none h-14 rounded-2xl font-bold text-lg mt-4 transition-all duration-300"
            >
              Secure & Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
