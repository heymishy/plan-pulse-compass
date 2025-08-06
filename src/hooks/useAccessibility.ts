import { useEffect, useRef, useState, useCallback } from 'react';

// Accessibility preferences hook
export function useAccessibilityPreferences() {
  const [preferences, setPreferences] = useState({
    reducedMotion: false,
    highContrast: false,
    screenReader: false,
    keyboardNavigation: false
  });

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPreferences(prev => ({ ...prev, reducedMotion: mediaQuery.matches }));

    const handleChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, reducedMotion: e.matches }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Check for high contrast preference
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPreferences(prev => ({ ...prev, highContrast: mediaQuery.matches }));

    const handleChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, highContrast: e.matches }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Detect screen reader usage
    const detectScreenReader = () => {
      const hasScreenReader = window.navigator.userAgent.includes('NVDA') ||
        window.navigator.userAgent.includes('JAWS') ||
        window.speechSynthesis?.speaking ||
        document.querySelector('[aria-live]') !== null;
      
      setPreferences(prev => ({ ...prev, screenReader: hasScreenReader }));
    };

    detectScreenReader();
  }, []);

  return preferences;
}

// Focus management hook
export function useFocusManagement() {
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const focusTrapRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    lastFocusedElement.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (lastFocusedElement.current) {
      lastFocusedElement.current.focus();
      lastFocusedElement.current = null;
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    focusTrapRef.current = container;
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, []);

  const releaseFocusTrap = useCallback(() => {
    focusTrapRef.current = null;
  }, []);

  return {
    saveFocus,
    restoreFocus,
    trapFocus,
    releaseFocusTrap
  };
}

// Keyboard navigation hook
export function useKeyboardNavigation<T>(
  items: T[],
  onSelect?: (item: T, index: number) => void,
  onEscape?: () => void
) {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev <= 0 ? items.length - 1 : prev - 1);
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(items.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < items.length && onSelect) {
          onSelect(items[focusedIndex], focusedIndex);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setFocusedIndex(-1);
        onEscape?.();
        break;
    }
  }, [items, focusedIndex, onSelect, onEscape]);

  const resetFocus = useCallback(() => {
    setFocusedIndex(-1);
  }, []);

  return {
    focusedIndex,
    handleKeyDown,
    resetFocus,
    setFocusedIndex
  };
}

// Announcement hook for screen readers
export function useAnnouncements() {
  const announcementRef = useRef<HTMLDivElement | null>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcementRef.current) {
      const element = document.createElement('div');
      element.setAttribute('aria-live', priority);
      element.setAttribute('aria-atomic', 'true');
      element.className = 'sr-only';
      document.body.appendChild(element);
      announcementRef.current = element;
    }

    announcementRef.current.setAttribute('aria-live', priority);
    announcementRef.current.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = '';
      }
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (announcementRef.current) {
        document.body.removeChild(announcementRef.current);
      }
    };
  }, []);

  return { announce };
}

// Skip links hook
export function useSkipLinks() {
  const skipLinksRef = useRef<HTMLDivElement | null>(null);
  const [skipLinks, setSkipLinks] = useState<Array<{ id: string; label: string }>>([]);

  const registerSkipLink = useCallback((id: string, label: string) => {
    setSkipLinks(prev => {
      const exists = prev.find(link => link.id === id);
      if (exists) return prev;
      return [...prev, { id, label }];
    });
  }, []);

  const unregisterSkipLink = useCallback((id: string) => {
    setSkipLinks(prev => prev.filter(link => link.id !== id));
  }, []);

  const skipToContent = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return {
    skipLinks,
    registerSkipLink,
    unregisterSkipLink,
    skipToContent,
    skipLinksRef
  };
}

// High contrast hook
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleHighContrast = useCallback(() => {
    setIsHighContrast(prev => {
      const newValue = !prev;
      document.documentElement.classList.toggle('high-contrast', newValue);
      return newValue;
    });
  }, []);

  return {
    isHighContrast,
    toggleHighContrast
  };
}

// ARIA describedby hook
export function useAriaDescribedBy() {
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});

  const addDescription = useCallback((id: string, description: string) => {
    setDescriptions(prev => ({ ...prev, [id]: description }));
  }, []);

  const removeDescription = useCallback((id: string) => {
    setDescriptions(prev => {
      const newDescriptions = { ...prev };
      delete newDescriptions[id];
      return newDescriptions;
    });
  }, []);

  const getDescribedBy = useCallback((ids: string[]) => {
    return ids.filter(id => descriptions[id]).join(' ');
  }, [descriptions]);

  return {
    descriptions,
    addDescription,
    removeDescription,
    getDescribedBy
  };
}