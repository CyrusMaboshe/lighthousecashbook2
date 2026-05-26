/**
 * PWA Install Banner - Visible install prompt for desktop and mobile
 * Replaces the old modal-based PWAInstallPrompt with a less intrusive banner
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone, Monitor, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPromptBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    const wasDismissed = sessionStorage.getItem('pwa-banner-dismissed');
    if (wasDismissed) return;

    // Check if running as standalone PWA already
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check for iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    setIsIOS(iOS && isSafari);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show banner after delay for iOS or if prompt is available
    const timer = setTimeout(() => {
      if (iOS && isSafari) {
        setShowBanner(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa-banner-dismissed', 'true');
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl border-0">
        <CardContent className="p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                ? <Smartphone className="h-6 w-6" />
                : <Monitor className="h-6 w-6" />
              }
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Install App</h3>
              <p className="text-white/80 text-sm mb-3">
                Get quick access from your home screen
              </p>
              
              {showIOSInstructions ? (
                <div className="bg-white/10 rounded-lg p-3 text-sm space-y-1">
                  <p className="font-medium">To install on iOS:</p>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 px-2 py-0.5 rounded">1</span>
                    <span>Tap the Share button ⬆️</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 px-2 py-0.5 rounded">2</span>
                    <span>Tap "Add to Home Screen"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 px-2 py-0.5 rounded">3</span>
                    <span>Tap "Add" to confirm</span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleInstall}
                    size="sm"
                    className="bg-white text-blue-600 hover:bg-white/90"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Install
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                  >
                    Later
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Benefits */}
          <div className="flex gap-4 mt-3 pt-3 border-t border-white/20 text-xs text-white/80">
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3" /> Offline access
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3" /> Fast loading
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3" /> No browser UI
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
