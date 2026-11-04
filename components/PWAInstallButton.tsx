'use client';

import React, { useEffect, useState } from 'react';
import { Download, WifiOff, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() =>
    typeof window !== 'undefined' ? (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    ) : false
  );
  const [isIOS, setIsIOS] = useState(() =>
    typeof window !== 'undefined' ? /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) : false
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isInstallable) {
            install();
          } else {
            setShowGuide(true);
          }
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0"
        aria-label="Install NETI BHARATHAM Mobile App"
      >
        <Smartphone className="w-3.5 h-3.5 text-red-400" />
        <span>Install App</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-modal-title"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 id="pwa-modal-title" className="text-base font-bold text-slate-900">
                Install NETI BHARATHAM (నేటి భారతం) App
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1 text-slate-500 hover:text-slate-900"
                aria-label="Close install guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">
                Get real-time Telugu breaking news & Press ID access directly on your mobile home screen:
              </p>
              {isIOS ? (
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
                  <li>Tap the <strong>Share</strong> icon in your Safari bottom toolbar.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong> to launch NETI BHARATHAM in full-screen standalone mode.</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
                  <li>Open your browser menu (three dots in Chrome/Edge).</li>
                  <li>Select <strong>Install App</strong> or <strong>Add to Home screen</strong>.</li>
                  <li>Launch <strong>నేటి భారతం</strong> directly from your phone launcher.</li>
                </ol>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-md"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-md bg-amber-700 px-3.5 py-2 text-xs font-semibold text-white shadow-lg"
    >
      <WifiOff className="w-4 h-4" />
      <span>Offline Mode — Viewing cached NETI BHARATHAM articles</span>
    </div>
  );
};
