import { useState, useEffect } from 'react';

export interface PWAInstallPrompt extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  installPrompt: PWAInstallPrompt | null;
  install: () => Promise<void>;
  isSupported: boolean;
}

export function usePWA(): PWAState {
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(
    null
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check PWA support
    const checkPWASupport = () => {
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasManifest = 'manifest' in document.createElement('link');
      const hasBeforeInstallPrompt = 'onbeforeinstallprompt' in window;

      setIsSupported(hasServiceWorker && hasManifest);
    };

    // Check if app is already installed
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia(
        '(display-mode: standalone)'
      ).matches;
      const isFullscreen = window.matchMedia(
        '(display-mode: fullscreen)'
      ).matches;
      const isMinimalUI = window.matchMedia(
        '(display-mode: minimal-ui)'
      ).matches;
      const isNavigatorStandalone =
        (window.navigator as any).standalone === true;

      setIsInstalled(
        isStandalone || isFullscreen || isMinimalUI || isNavigatorStandalone
      );
    };

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event received');
      e.preventDefault();
      setInstallPrompt(e as PWAInstallPrompt);
    };

    // Handle app installed
    const handleAppInstalled = () => {
      console.log('PWA: App installed');
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    // Handle online/offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Set up event listeners
    checkPWASupport();
    checkInstallStatus();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) {
      console.warn('PWA: No install prompt available');
      return;
    }

    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
      } else {
        console.log('PWA: User dismissed the install prompt');
      }

      setInstallPrompt(null);
    } catch (error) {
      console.error('PWA: Install failed:', error);
    }
  };

  return {
    isInstallable: !!installPrompt && !isInstalled,
    isInstalled,
    isOffline,
    installPrompt,
    install,
    isSupported,
  };
}

// Hook for service worker registration
export function useServiceWorker() {
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          console.log('SW: Registering service worker...');
          const reg = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

          setRegistration(reg);
          console.log('SW: Service worker registered successfully');

          // Handle updates
          reg.addEventListener('updatefound', () => {
            console.log('SW: New service worker version available');
            const newWorker = reg.installing;

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  console.log('SW: New version ready - reload required');
                  // Could show update notification here
                }
              });
            }
          });
        } catch (error) {
          console.error('SW: Service worker registration failed:', error);
          setError(`Service worker registration failed: ${error}`);
        }
      } else {
        setError('Service workers not supported');
      }

      setIsLoading(false);
    };

    registerServiceWorker();
  }, []);

  return { registration, isLoading, error };
}
