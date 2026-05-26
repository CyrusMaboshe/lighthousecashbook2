import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCashvault } from '@/hooks/useCashvault';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Vault, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CashVaultWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CashVaultWithdrawModal({ isOpen, onClose }: CashVaultWithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { balance, withdrawFromCashvault } = useCashvault();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      await withdrawFromCashvault(parseFloat(amount), note || 'Withdrawal from Cash Vault');

      // Reset form and close modal
      setAmount('');
      setNote('');
      onClose();

      toast({
        title: "Success",
        description: `ZMW ${parseFloat(amount).toFixed(2)} withdrawn from Cash Vault successfully`,
      });
    } catch (error) {
      console.error('Error withdrawing to cash vault:', error);
      toast({
        title: "Error",
        description: "Failed to withdraw to Cash Vault. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setAmount('');
      setNote('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card sm:max-w-md border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Vault className="w-5 h-5 text-red-400" />
            Withdraw from Cash Vault
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-red-500/10 border-red-500/30 text-red-200">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription>
              This will transfer money from the Cash Vault back to your main account.
            </AlertDescription>
          </Alert>

          {balance && (
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
              <p className="text-sm text-slate-300">
                Current Cash Vault Balance
              </p>
              <p className="text-2xl font-black text-white mt-1">
                ZMW {balance.current_balance.toFixed(2)}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount" className="text-sm font-bold text-slate-200 mb-2 block">Amount (ZMW)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to withdraw"
                disabled={isProcessing}
                required
                max={balance?.current_balance || 0}
                className="glass-input-danger h-11"
              />
            </div>

            <div>
              <Label htmlFor="note" className="text-sm font-bold text-slate-200 mb-2 block">Note (Optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason for withdrawal from Cash Vault"
                disabled={isProcessing}
                rows={3}
                className="glass-input-danger min-h-[100px] py-3"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1 h-12 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > (balance?.current_balance || 0)}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white border border-red-400/30 font-black uppercase tracking-widest transition-all"
              >
                {isProcessing ? 'Processing...' : 'Withdraw'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
