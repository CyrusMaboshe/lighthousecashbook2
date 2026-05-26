import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share, Plus, Smartphone, X } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';

export function InstallPrompt() {
    const [isOpen, setIsOpen] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Get auth state from both auth hooks
    const { currentUser: existingUser } = useAuth();
    const { currentUser: mtUser } = useMultiTenantAuth();
    const isAuthenticated = !!(existingUser || mtUser);

    useEffect(() => {
        setMounted(true);

        // Check if standalone
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://');

        setIsStandalone(isStandaloneMode);

        // Check if iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // Handler for beforeinstallprompt
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // We don't show it here immediately, wait for useEffect to check auth and viewed state
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    // Effect to manage visibility
    useEffect(() => {
        if (!mounted) return;

        // Condition: Authenticated AND Not Standalone AND (iOS OR prompt captured)
        if (isAuthenticated && !isStandalone) {
            // Check if already seen
            const hasSeen = localStorage.getItem('install_prompt_seen_v2'); // Incremented version to reshow with new design
            if (!hasSeen) {
                // Show after a delay to not be intrusive immediately
                const timer = setTimeout(() => {
                    // Only show if we can actually install (Android) or if it's iOS (manual instructions)
                    if (isIOS || deferredPrompt) {
                        setIsOpen(true);
                    }
                }, 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [isAuthenticated, isStandalone, deferredPrompt, isIOS, mounted]);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                localStorage.setItem('install_prompt_seen_v2', 'true');
                setIsOpen(false);
            }
            // We don't nullify deferredPrompt here in case they cancel and want to try again later
            // But usually the event is one-time use per page load.
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('install_prompt_seen_v2', 'true');
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleClose();
        }}>
            <DialogContent className="sm:max-w-md bg-[#0a0a0b]/95 backdrop-blur-xl border-white/10 text-white shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

                <DialogHeader className="space-y-4 pt-6">
                    <div className="mx-auto bg-gradient-to-br from-blue-500/20 to-indigo-500/20 p-4 rounded-full w-fit shadow-lg shadow-blue-500/10 ring-1 ring-white/10">
                        <Smartphone className="h-8 w-8 text-blue-400" />
                    </div>
                    <DialogTitle className="text-center text-2xl font-bold tracking-tight text-white">
                        Install App
                    </DialogTitle>
                    <DialogDescription className="text-center text-slate-400 text-base leading-relaxed max-w-[280px] mx-auto">
                        Get the full experience. Install to your home screen for quick access and offline mode.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {isIOS ? (
                        <div className="space-y-4 px-2">
                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3">
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold text-white">1</span>
                                    <span>Tap the <Share className="h-4 w-4 inline mx-1 text-blue-400" /> <span className="text-white font-medium">Share</span> button at the bottom</span>
                                </div>
                                <div className="w-full h-px bg-white/5" />
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold text-white">2</span>
                                    <span>Select <span className="font-bold text-white">Add to Home Screen</span> <Plus className="h-4 w-4 inline mx-1 text-white" /></span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mx-2">
                            <p className="text-sm text-blue-200 text-center font-medium">
                                Fast • Secure • Offline Capable
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col gap-3 sm:gap-3 pb-2">
                    {!isIOS && (
                        <Button
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-12 rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 border-0"
                            onClick={handleInstall}
                        >
                            <Download className="mr-2 h-5 w-5" /> Install Now
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        className="w-full text-slate-400 hover:text-white hover:bg-white/5 h-10 rounded-xl font-medium"
                        onClick={handleClose}
                    >
                        Maybe Later
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
