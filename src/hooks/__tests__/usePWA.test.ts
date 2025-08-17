import { renderHook, act } from '@testing-library/react';
import { usePWA, useServiceWorker } from '../usePWA';

// Mock window properties
const mockBeforeInstallPrompt = {
  platforms: ['web'],
  userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
  prompt: vi.fn().mockResolvedValue(undefined),
  preventDefault: vi.fn(),
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn().mockResolvedValue({
      addEventListener: vi.fn(),
      installing: null,
    }),
  },
});

describe('usePWA', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset window properties
    delete (window as any).beforeinstallprompt;
    delete (window as any).appinstalled;

    // Mock addEventListener and removeEventListener
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePWA());

    expect(result.current).toEqual({
      isInstallable: false,
      isInstalled: false,
      isOffline: false,
      installPrompt: null,
      install: expect.any(Function),
      isSupported: true, // serviceWorker and manifest are mocked as supported
    });
  });

  it('should detect PWA support correctly', () => {
    // Mock unsupported environment
    const originalServiceWorker = navigator.serviceWorker;
    delete (navigator as any).serviceWorker;

    const { result } = renderHook(() => usePWA());

    expect(result.current.isSupported).toBe(false);

    // Restore
    (navigator as any).serviceWorker = originalServiceWorker;
  });

  it('should handle beforeinstallprompt event', () => {
    let beforeInstallPromptHandler: (event: Event) => void;

    window.addEventListener = vi.fn().mockImplementation((event, handler) => {
      if (event === 'beforeinstallprompt') {
        beforeInstallPromptHandler = handler;
      }
    });

    const { result } = renderHook(() => usePWA());

    act(() => {
      beforeInstallPromptHandler?.(mockBeforeInstallPrompt as any);
    });

    expect(result.current.isInstallable).toBe(true);
    expect(result.current.installPrompt).toBe(mockBeforeInstallPrompt);
  });

  it('should handle install function', async () => {
    let beforeInstallPromptHandler: (event: Event) => void;

    window.addEventListener = vi.fn().mockImplementation((event, handler) => {
      if (event === 'beforeinstallprompt') {
        beforeInstallPromptHandler = handler;
      }
    });

    const { result } = renderHook(() => usePWA());

    // Set up install prompt
    act(() => {
      beforeInstallPromptHandler?.(mockBeforeInstallPrompt as any);
    });

    // Test install
    await act(async () => {
      await result.current.install();
    });

    expect(mockBeforeInstallPrompt.prompt).toHaveBeenCalled();
    expect(result.current.installPrompt).toBe(null);
  });

  it('should handle app installed event', () => {
    let appInstalledHandler: () => void;

    window.addEventListener = vi.fn().mockImplementation((event, handler) => {
      if (event === 'appinstalled') {
        appInstalledHandler = handler;
      }
    });

    const { result } = renderHook(() => usePWA());

    act(() => {
      appInstalledHandler?.();
    });

    expect(result.current.isInstalled).toBe(true);
  });

  it('should handle online/offline status', () => {
    let onlineHandler: () => void;
    let offlineHandler: () => void;

    window.addEventListener = vi.fn().mockImplementation((event, handler) => {
      if (event === 'online') {
        onlineHandler = handler;
      } else if (event === 'offline') {
        offlineHandler = handler;
      }
    });

    // Start offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => usePWA());

    expect(result.current.isOffline).toBe(true);

    // Go online
    act(() => {
      onlineHandler?.();
    });

    expect(result.current.isOffline).toBe(false);

    // Go offline
    act(() => {
      offlineHandler?.();
    });

    expect(result.current.isOffline).toBe(true);
  });

  it('should detect installed app from display mode', () => {
    (window.matchMedia as any).mockImplementation(query => {
      if (query.includes('display-mode: standalone')) {
        return { matches: true };
      }
      return { matches: false };
    });

    const { result } = renderHook(() => usePWA());

    expect(result.current.isInstalled).toBe(true);
  });
});

describe('useServiceWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register service worker successfully', async () => {
    const mockRegistration = {
      addEventListener: vi.fn(),
      installing: null,
    };

    (navigator.serviceWorker.register as any).mockResolvedValue(
      mockRegistration
    );

    const { result } = renderHook(() => useServiceWorker());

    // Wait for async registration
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', {
      scope: '/',
    });
    expect(result.current.registration).toBe(mockRegistration);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle service worker registration failure', async () => {
    const mockError = new Error('Registration failed');
    (navigator.serviceWorker.register as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => useServiceWorker());

    // Wait for async registration
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.registration).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(
      `Service worker registration failed: ${mockError}`
    );
  });

  it('should handle service worker update', async () => {
    const mockRegistration = {
      addEventListener: vi.fn(),
      installing: {
        addEventListener: vi.fn(),
        state: 'installed',
      },
    };

    (navigator.serviceWorker.register as any).mockResolvedValue(
      mockRegistration
    );

    const { result } = renderHook(() => useServiceWorker());

    // Wait for async registration
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Simulate updatefound event
    const updateHandler = (
      mockRegistration.addEventListener as any
    ).mock.calls.find(([event]: any) => event === 'updatefound')[1];

    act(() => {
      updateHandler();
    });

    // Verify update handling is set up
    expect(mockRegistration.installing?.addEventListener).toHaveBeenCalledWith(
      'statechange',
      expect.any(Function)
    );
  });

  it('should handle unsupported service worker', async () => {
    const originalServiceWorker = navigator.serviceWorker;
    delete (navigator as any).serviceWorker;

    const { result } = renderHook(() => useServiceWorker());

    // Wait for async check
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.registration).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Service workers not supported');

    // Restore
    (navigator as any).serviceWorker = originalServiceWorker;
  });
});
