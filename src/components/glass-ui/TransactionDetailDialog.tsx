import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Phone,
    MessageCircle,
    Copy,
    TrendingUp,
    TrendingDown,
    Calendar,
    Clock,
    User,
    Tag,
    FileText,
    Camera,
    Check,
    Edit,
    Trash2,
    Download,
    Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { useTenant } from '@/contexts/TenantContext';
import { useTheme } from '@/contexts/ThemeContext';

interface Transaction {
    id: string;
    date: string;
    time?: string;
    type: 'cash-in' | 'cash-out';
    category_name: string;
    amount: number;
    customer_name: string;
    number_of_pictures: number;
    whatsapp_number: string;
    details: string;
    added_by: string;
}

interface TransactionDetailDialogProps {
    transaction: Transaction | null;
    isOpen: boolean;
    onClose: () => void;
    isAdmin?: boolean;
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (transactionId: string) => void;
}

export function TransactionDetailDialog({ transaction, isOpen, onClose, isAdmin, onEdit, onDelete }: TransactionDetailDialogProps) {
    const [copied, setCopied] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<'details' | 'receipt'>('details');
    const [isDownloading, setIsDownloading] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);
    const { company } = useTenant();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    // Reset tab when dialog opens/closes or transaction changes
    useEffect(() => {
        if (isOpen) {
            setActiveTab('details');
        }
    }, [isOpen, transaction?.id]);

    // Debug logging
    console.log('TransactionDetailDialog - isAdmin:', isAdmin);
    console.log('TransactionDetailDialog - onEdit:', !!onEdit);
    console.log('TransactionDetailDialog - onDelete:', !!onDelete);
    console.log('TransactionDetailDialog - Show buttons?', isAdmin && onEdit && onDelete);

    if (!transaction) return null;

    const companyName = company?.name || 'Lighthouse';
    const companyLogo = company?.logo_url || '';

    // Guess payment method based on details
    const guessPaymentMethod = () => {
        if (!transaction) return 'Cash';
        const detailsLower = (transaction.details || '').toLowerCase();
        if (detailsLower.includes('mtn') || detailsLower.includes('momo') || detailsLower.includes('mobile money')) return 'MTN Mobile Money';
        if (detailsLower.includes('airtel')) return 'Airtel Money';
        if (detailsLower.includes('card') || detailsLower.includes('pos') || detailsLower.includes('swipe')) return 'Card / POS';
        if (detailsLower.includes('bank') || detailsLower.includes('transfer') || detailsLower.includes('fnb') || detailsLower.includes('eft')) return 'Bank Transfer';
        if (detailsLower.includes('cheque')) return 'Cheque';
        return 'Cash';
    };

    // Account affected
    const getAccountAffected = () => {
        if (!transaction) return 'Main Cashbook';
        if (transaction.category_name === 'Savings' || transaction.category_name.toLowerCase().includes('savings')) {
            return 'Savings Account';
        }
        return 'Main Cash Vault';
    };

    const handleDownloadReceipt = async () => {
        if (!receiptRef.current) return;
        setIsDownloading(true);
        try {
            // Give layout a brief moment to settle
            await new Promise(resolve => setTimeout(resolve, 150));

            const canvas = await html2canvas(receiptRef.current, {
                backgroundColor: null,
                scale: 3, // high-res
                useCORS: true,
                allowTaint: true,
                logging: false,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById('digital-receipt-container');
                    if (clonedElement) {
                        clonedElement.style.transform = 'none';
                        clonedElement.style.width = '420px';
                        clonedElement.style.height = 'auto';
                        clonedElement.style.margin = '0';
                        clonedElement.style.padding = '32px';
                        clonedElement.style.borderRadius = '24px';
                        clonedElement.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.6)';
                        clonedElement.style.overflow = 'visible';
                        
                        if (isLight) {
                            clonedElement.style.background = 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)';
                            clonedElement.style.borderColor = '#e2e8f0';
                            clonedElement.style.color = '#0f172a';
                        } else {
                            clonedElement.style.background = 'linear-gradient(135deg, #090d16 0%, #151a29 100%)';
                            clonedElement.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            clonedElement.style.color = '#ffffff';
                        }

                        const glows = clonedElement.querySelectorAll('.ambient-glow');
                        glows.forEach((glow: any) => {
                            glow.style.display = 'block';
                            glow.style.opacity = isLight ? '0.25' : '0.18';
                        });
                    }
                }
            });

            const dataUrl = canvas.toDataURL('image/png', 1.0);
            const link = document.createElement('a');
            const fileName = `Receipt_${transaction.customer_name.replace(/\s+/g, '_')}_${transaction.id.substring(0, 8)}.png`;
            link.download = fileName;
            link.href = dataUrl;
            link.click();

            toast({
                title: "Receipt Downloaded",
                description: "Digital receipt PNG saved to your device.",
            });
        } catch (error) {
            console.error('Error generating receipt image:', error);
            toast({
                title: "Download Failed",
                description: "Could not export receipt image. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const isIncome = transaction.type === 'cash-in';

    // Handle phone number copy
    const handleCopyPhone = async () => {
        if (!transaction.whatsapp_number) {
            toast({
                title: "No Phone Number",
                description: "This transaction doesn't have a phone number",
                variant: "destructive",
            });
            return;
        }

        try {
            await navigator.clipboard.writeText(transaction.whatsapp_number);
            setCopied(true);
            toast({
                title: "Copied!",
                description: "Phone number copied to clipboard",
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast({
                title: "Copy Failed",
                description: "Unable to copy phone number",
                variant: "destructive",
            });
        }
    };

    // Handle phone dialer
    const handleCallPhone = () => {
        if (!transaction.whatsapp_number) {
            toast({
                title: "No Phone Number",
                description: "This transaction doesn't have a phone number",
                variant: "destructive",
            });
            return;
        }

        // Use tel: protocol to open device dialer
        window.location.href = `tel:${transaction.whatsapp_number}`;
    };

    // Handle WhatsApp
    const handleOpenWhatsApp = () => {
        if (!transaction.whatsapp_number) {
            toast({
                title: "No Phone Number",
                description: "This transaction doesn't have a phone number",
                variant: "destructive",
            });
            return;
        }

        // Remove any non-numeric characters and format for WhatsApp
        const cleanNumber = transaction.whatsapp_number.replace(/\D/g, '');

        // Use wa.me link for WhatsApp
        window.open(`https://wa.me/${cleanNumber}`, '_blank');
    };

    // Handle delete with confirmation
    const handleDelete = () => {
        if (!transaction) return;
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (!transaction || !onDelete) return;
        onDelete(transaction.id);
        setShowDeleteConfirm(false);
        onClose();
        toast({
            title: "Transaction Deleted",
            description: "The transaction has been successfully deleted.",
        });
    };

    // Handle edit
    const handleEdit = () => {
        if (!transaction || !onEdit) return;
        onEdit(transaction);
        onClose();
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="fixed left-[50%] top-[50%] z-[100] w-[95vw] sm:w-full max-w-lg md:max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-0 border border-white/10 bg-[#0f172a] shadow-2xl transition-none rounded-2xl backdrop-blur-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 duration-200 p-0">
                    <div className="flex flex-row items-center justify-between p-4 sm:px-6 sm:py-4 border-b border-white/10 flex-shrink-0 z-20 bg-slate-900/50 backdrop-blur-md">
                        <DialogTitle className="flex items-center gap-3 text-white m-0">
                            <div className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center border shadow-md',
                                isIncome ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'
                            )}>
                                {isIncome ? (
                                    <TrendingUp className="w-5 h-5 text-green-300" />
                                ) : (
                                    <TrendingDown className="w-5 h-5 text-red-300" />
                                )}
                            </div>
                            <div>
                                <div className="text-lg font-bold tracking-tight">Transaction Details</div>
                                <div className={cn(
                                    'text-[10px] font-bold uppercase tracking-widest opacity-70',
                                    isIncome ? 'text-green-300' : 'text-red-300'
                                )}>
                                    {isIncome ? 'Cash In' : 'Cash Out'}
                                </div>
                            </div>
                        </DialogTitle>
                    </div>

                    {/* Tab Bar (Only show if type is cash-in) */}
                    {transaction.type === 'cash-in' && (
                        <div className={cn(
                            "flex border-b flex-shrink-0 z-20 px-4 sm:px-6",
                            isLight ? "border-slate-200 bg-slate-50/50" : "border-white/10 bg-slate-900/20"
                        )}>
                            <button
                                onClick={() => setActiveTab('details')}
                                className={cn(
                                    "py-3.5 px-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all relative flex items-center gap-2",
                                    activeTab === 'details'
                                        ? isLight ? "border-cyan-600 text-cyan-700 font-extrabold" : "border-cyan-500 text-cyan-400"
                                        : isLight ? "border-transparent text-slate-500 hover:text-slate-800" : "border-transparent text-slate-400 hover:text-slate-200"
                                )}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                Details
                            </button>
                            <button
                                onClick={() => setActiveTab('receipt')}
                                className={cn(
                                    "py-3.5 px-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all relative flex items-center gap-2",
                                    activeTab === 'receipt'
                                        ? isLight ? "border-cyan-600 text-cyan-700 font-extrabold" : "border-cyan-500 text-cyan-400"
                                        : isLight ? "border-transparent text-slate-500 hover:text-slate-800" : "border-transparent text-slate-400 hover:text-slate-200"
                                )}
                            >
                                <Receipt className="w-3.5 h-3.5" />
                                Receipt
                                <span className={cn(
                                    "absolute -top-1 -right-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold border",
                                    isLight 
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                )}>
                                    New
                                </span>
                            </button>
                        </div>
                    )}

                    {activeTab === 'details' ? (
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar animate-in fade-in duration-200">
                            {/* Amount - Prominent Display */}
                            <div className={cn(
                                'p-6 sm:p-8 rounded-2xl text-center backdrop-blur-md border relative overflow-hidden',
                                isIncome ? 'bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-400/20' : 'bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-400/20'
                            )}>
                                <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">Amount</div>
                                <div className={cn(
                                    'text-3xl sm:text-4xl font-black tracking-tight break-all sm:break-normal',
                                    isIncome ? 'glass-text-success' : 'glass-text-danger'
                                )}>
                                    {isIncome ? '+' : '-'} {transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    <span className="text-base sm:text-lg ml-1 sm:ml-2 font-bold opacity-70">ZMW</span>
                                </div>
                                {/* Decorative background glow */}
                                <div className={cn(
                                    "absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-20",
                                    isIncome ? "bg-green-400" : "bg-red-400"
                                )} />
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 gap-2 sm:gap-3">
                                {/* Customer Name */}
                                <div className="flex items-start gap-3 p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm transition-all hover:bg-white/10">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0">
                                        <User className="w-5 h-5 text-blue-300" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Customer</div>
                                        <div className="font-bold text-white text-base sm:text-lg break-words">{transaction.customer_name}</div>
                                    </div>
                                </div>

                                {/* Phone Number Actions */}
                                {transaction.whatsapp_number && (
                                    <div className="space-y-2 sm:space-y-3">
                                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm transition-all hover:bg-white/10">
                                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center flex-shrink-0">
                                                <Phone className="w-5 h-5 text-purple-300" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Contact Details</div>
                                                <div className="font-bold text-white text-base sm:text-lg break-all sm:break-normal">{transaction.whatsapp_number}</div>
                                            </div>
                                        </div>

                                        {/* Phone Action Buttons */}
                                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCallPhone}
                                                className="flex flex-col items-center gap-1 h-auto py-3 bg-white/5 border-white/10 hover:bg-blue-500/20 hover:border-blue-400/30 transition-all group"
                                            >
                                                <Phone className="w-4 h-4 text-blue-300 group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Call</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleOpenWhatsApp}
                                                className="flex flex-col items-center gap-1 h-auto py-3 bg-white/5 border-white/10 hover:bg-green-500/20 hover:border-green-400/30 transition-all group"
                                            >
                                                <MessageCircle className="w-4 h-4 text-green-300 group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">WhatsApp</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCopyPhone}
                                                className="flex flex-col items-center gap-1 h-auto py-3 bg-white/5 border-white/10 hover:bg-purple-500/20 hover:border-purple-400/30 transition-all group"
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check className="w-4 h-4 text-green-300" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-green-300">Copied!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-4 h-4 text-purple-300 group-hover:scale-110 transition-transform" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Copy</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Category */}
                                <div className="flex items-start gap-3 p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm transition-all hover:bg-white/10">
                                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-400/30 flex items-center justify-center flex-shrink-0">
                                        <Tag className="w-5 h-5 text-orange-300" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Category</div>
                                        <div className="font-bold text-white uppercase tracking-tight text-sm sm:text-base break-words">{transaction.category_name}</div>
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                    <div className="flex items-start gap-3 p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm transition-all hover:bg-white/10">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center flex-shrink-0">
                                            <Calendar className="w-4 h-4 text-indigo-300" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Date</div>
                                            <div className="font-bold text-white text-sm sm:text-base break-words">
                                                {format(new Date(transaction.date), 'MMM d, yyyy')}
                                            </div>
                                        </div>
                                    </div>

                                    {transaction.time && (
                                        <div className="flex items-start gap-3 p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm transition-all hover:bg-white/10">
                                            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center flex-shrink-0">
                                                <Clock className="w-4 h-4 text-cyan-300" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Time</div>
                                                <div className="font-bold text-white text-sm sm:text-base">{transaction.time}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Number of Pictures */}
                                {transaction.number_of_pictures > 0 && (
                                    <div className="flex items-start gap-3 p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm transition-all hover:bg-white/10">
                                        <div className="w-10 h-10 rounded-lg bg-pink-500/20 border border-pink-400/30 flex items-center justify-center flex-shrink-0">
                                            <Camera className="w-5 h-5 text-pink-300" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Gallery Info</div>
                                            <div className="font-bold text-white text-base sm:text-lg">
                                                {transaction.number_of_pictures} {transaction.number_of_pictures === 1 ? 'picture' : 'pictures'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Details/Notes */}
                                {transaction.details && (
                                    <div className="flex items-start gap-3 p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm col-span-full transition-all hover:bg-white/10">
                                        <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-5 h-5 text-teal-300" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Additional Notes</div>
                                            <div className="font-medium text-slate-200 text-sm whitespace-pre-wrap leading-relaxed break-words">{transaction.details}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Info */}
                            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl flex-wrap gap-2">
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Recorded By</div>
                                <div className="text-sm font-bold text-cyan-400 truncate max-w-[150px] sm:max-w-none text-right">{transaction.added_by}</div>
                            </div>
                        </div>
                    ) : (
                        <div className={cn(
                            "flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar flex items-center justify-center animate-in fade-in duration-200 transition-colors",
                            isLight ? "bg-slate-100/50" : "bg-slate-950/20"
                        )}>
                            <div 
                                id="digital-receipt-container"
                                ref={receiptRef}
                                className={cn(
                                    "relative w-full max-w-[420px] mx-auto p-6 sm:p-8 rounded-3xl overflow-hidden border shadow-2xl flex flex-col gap-6 transition-all duration-300",
                                    isLight 
                                        ? "border-slate-200/80 text-slate-800 bg-white/75" 
                                        : "border-white/10 text-white bg-[#090d16]/75"
                                )}
                                style={{
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)'
                                }}
                            >
                                {/* Ambient Glows */}
                                <div 
                                    className="ambient-glow absolute -top-20 -right-20 w-44 h-44 rounded-full pointer-events-none" 
                                    style={{
                                        background: isLight 
                                            ? 'radial-gradient(circle at center, rgba(56, 189, 248, 0.25) 0%, rgba(56, 189, 248, 0) 70%)'
                                            : 'radial-gradient(circle at center, rgba(6, 182, 212, 0.18) 0%, rgba(6, 182, 212, 0) 70%)'
                                    }}
                                />
                                <div 
                                    className="ambient-glow absolute -bottom-20 -left-20 w-44 h-44 rounded-full pointer-events-none" 
                                    style={{
                                        background: isLight 
                                            ? 'radial-gradient(circle at center, rgba(244, 63, 94, 0.15) 0%, rgba(244, 63, 94, 0) 70%)'
                                            : 'radial-gradient(circle at center, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0) 70%)'
                                    }}
                                />
                                <div 
                                    className="ambient-glow absolute top-[40%] left-[30%] w-32 h-32 rounded-full pointer-events-none" 
                                    style={{
                                        background: isLight 
                                            ? 'radial-gradient(circle at center, rgba(45, 212, 191, 0.12) 0%, rgba(45, 212, 191, 0) 70%)'
                                            : 'radial-gradient(circle at center, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0) 70%)'
                                    }}
                                />

                                {/* Header */}
                                <div className="flex flex-col items-center text-center gap-2 relative z-10">
                                    {companyLogo ? (
                                        <img src={companyLogo} alt={companyName} className="w-12 h-12 object-contain rounded-lg mb-1 animate-in zoom-in-50 duration-500" />
                                    ) : (
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg mb-1 shadow-md animate-in zoom-in-50 duration-500",
                                            isLight 
                                                ? "bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 text-cyan-600 shadow-[0_4px_12px_rgba(6,182,212,0.15)]" 
                                                : "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                                        )}>
                                            {companyName.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <h2 className={cn("text-sm font-black uppercase tracking-[0.2em]", isLight ? "text-slate-800" : "text-white/90")}>{companyName}</h2>
                                    <p className={cn("text-[10px] font-bold uppercase tracking-[0.15em]", isLight ? "text-slate-500" : "text-slate-400")}>Digital Transaction Receipt</p>
                                </div>

                                {/* Status & Amount */}
                                <div className={cn("flex flex-col items-center gap-3 py-3 border-y relative z-10", isLight ? "border-slate-100" : "border-white/5")}>
                                    <div className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                        isLight 
                                            ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    )}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Paid / Successful
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Amount Paid</p>
                                        <p className={cn(
                                            "text-3xl font-black tracking-tight",
                                            isLight 
                                                ? "text-slate-900" 
                                                : "text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400"
                                        )}>
                                            ZMW {transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="flex flex-col gap-3.5 relative z-10">
                                    <div className={cn("flex justify-between items-center text-xs pb-1 border-b", isLight ? "border-slate-100" : "border-white/5")}>
                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Receipt ID</span>
                                        <span className={cn("font-mono break-all select-all font-semibold text-right max-w-[200px] truncate", isLight ? "text-slate-600" : "text-white/90")}>{transaction.id}</span>
                                    </div>
                                    <div className={cn("flex justify-between items-center text-xs pb-1 border-b", isLight ? "border-slate-100" : "border-white/5")}>
                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Client Name</span>
                                        <span className={cn("font-bold text-right", isLight ? "text-slate-800" : "text-white")}>{transaction.customer_name}</span>
                                    </div>
                                    <div className={cn("flex justify-between items-center text-xs pb-1 border-b", isLight ? "border-slate-100" : "border-white/5")}>
                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Category</span>
                                        <span className={cn("font-bold uppercase tracking-tight text-right", isLight ? "text-slate-800" : "text-white")}>{transaction.category_name}</span>
                                    </div>
                                    {transaction.number_of_pictures > 0 && (
                                        <div className={cn("flex justify-between items-center text-xs pb-1 border-b", isLight ? "border-slate-100" : "border-white/5")}>
                                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Pictures</span>
                                            <span className={cn("font-bold text-right", isLight ? "text-slate-800" : "text-white")}>{transaction.number_of_pictures}</span>
                                        </div>
                                    )}
                                    <div className={cn("flex justify-between items-center text-xs pb-1 border-b", isLight ? "border-slate-100" : "border-white/5")}>
                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Date & Time</span>
                                        <span className={cn("font-bold text-right", isLight ? "text-slate-800" : "text-white")}>
                                            {format(new Date(transaction.date), 'MMM d, yyyy')}{transaction.time ? ` @ ${transaction.time}` : ''}
                                        </span>
                                    </div>
                                    <div className={cn("flex justify-between items-center text-xs pb-1 border-b", isLight ? "border-slate-100" : "border-white/5")}>
                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Payment Method</span>
                                        <span className={cn("font-bold text-right", isLight ? "text-slate-800" : "text-white")}>{guessPaymentMethod()}</span>
                                    </div>
                                    <div className={cn("flex justify-between items-center text-xs pb-1 border-b", isLight ? "border-slate-100" : "border-white/5")}>
                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Account Affected</span>
                                        <span className={cn("font-bold text-right", isLight ? "text-slate-800" : "text-white")}>{getAccountAffected()}</span>
                                    </div>
                                    <div className={cn("flex justify-between items-center text-xs pb-1 border-b", isLight ? "border-slate-100" : "border-white/5")}>
                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Cashier / Staff</span>
                                        <span className={cn("font-bold text-right text-cyan-600", isLight ? "text-cyan-600" : "text-cyan-400")}>{transaction.added_by}</span>
                                    </div>
                                </div>

                                {/* Notes */}
                                {transaction.details && (
                                    <div className={cn(
                                        "p-3.5 border rounded-2xl relative z-10",
                                        isLight 
                                            ? "bg-slate-50 border-slate-200/80 text-slate-700" 
                                            : "bg-white/5 border-white/5 text-slate-300"
                                    )}>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Description / Notes</p>
                                        <p className="text-xs font-medium leading-relaxed break-words">{transaction.details}</p>
                                    </div>
                                )}

                                {/* Barcode Mockup */}
                                <div className="flex flex-col items-center gap-1.5 mt-2 relative z-10">
                                    <div className="flex items-center gap-[1.5px] h-10 w-44 bg-transparent">
                                        {[1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2].map((width, idx) => (
                                            <div 
                                                key={idx} 
                                                className={cn("h-full", isLight ? "bg-slate-800" : "bg-white/70")} 
                                                style={{ flexGrow: width }} 
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[8px] font-mono tracking-[0.3em] text-slate-500 uppercase">
                                        {transaction.id.substring(0, 16).toUpperCase()}
                                    </span>
                                </div>

                                {/* Footer Branding */}
                                <div className="text-center text-[8px] font-bold tracking-[0.2em] text-slate-500 uppercase mt-1 relative z-10">
                                    Powered by Smart Finance
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-4 sm:p-6 border-t border-white/10 bg-slate-900/50 backdrop-blur-md flex-shrink-0">
                        <div className="space-y-2 sm:space-y-3">
                            {activeTab === 'receipt' ? (
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                    <Button
                                        onClick={handleDownloadReceipt}
                                        disabled={isDownloading}
                                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold h-12 rounded-xl border border-emerald-400/20 shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {isDownloading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Generating PNG...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-5 h-5" />
                                                <span>Download Receipt</span>
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={() => setActiveTab('details')}
                                        variant="outline"
                                        className="w-full sm:w-auto px-6 bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold h-12 rounded-xl"
                                    >
                                        Back to Details
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {isAdmin && (
                                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                            <Button
                                                onClick={handleEdit}
                                                variant="outline"
                                                className="w-full bg-blue-500/10 border-blue-400/30 hover:bg-blue-500/20 text-blue-200 hover:text-white font-bold h-12 rounded-xl transition-all"
                                                disabled={!onEdit}
                                            >
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit Record
                                            </Button>
                                            <Button
                                                onClick={handleDelete}
                                                variant="outline"
                                                className="w-full bg-red-500/10 border-red-400/30 hover:bg-red-500/20 text-red-200 hover:text-white font-bold h-12 rounded-xl transition-all"
                                                disabled={!onDelete}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </Button>
                                        </div>
                                    )}
                                    <Button
                                        onClick={onClose}
                                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold h-12 rounded-xl border border-white/10 shadow-lg"
                                    >
                                        Close Details
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog >

            {/* Delete Confirmation Dialog - Moved outside to fix blackout/nesting issues */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="fixed left-[50%] top-[50%] z-[200] w-[95vw] sm:w-full max-w-sm sm:max-w-md translate-x-[-50%] translate-y-[-50%] gap-3 sm:gap-4 border border-white/10 bg-[#0f172a]/95 shadow-2xl backdrop-blur-3xl p-5 sm:p-6 rounded-2xl outline-none">
                    <div className="flex items-center gap-3 text-white mb-1 sm:mb-2">
                        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <div className="text-xl font-bold">Confirm Deletion</div>
                            <div className="text-sm font-normal text-slate-400 tracking-tight">This action cannot be undone</div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <p className="text-slate-300 text-sm leading-relaxed">
                            Are you sure you want to delete this transaction? It will be permanently removed from the system and all historical records.
                        </p>
                        {transaction && (
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Transaction Summary</div>
                                <div className="font-bold text-white text-base mb-1">{transaction.customer_name}</div>
                                <div className={cn(
                                    "text-lg font-black",
                                    isIncome ? "text-green-400" : "text-red-400"
                                )}>
                                    {isIncome ? '+' : '-'} ZMW {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-2">
                                    {format(new Date(transaction.date), 'MMM d, yyyy')} • {transaction.category_name}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-2 sm:gap-3">
                        <Button
                            onClick={() => setShowDeleteConfirm(false)}
                            variant="outline"
                            className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold h-12 rounded-xl transition-all"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 rounded-xl border-0 shadow-lg shadow-red-900/20 transition-all active:scale-95"
                        >
                            Confirm Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
