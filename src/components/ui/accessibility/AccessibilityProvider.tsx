import React, { createContext, useContext, ReactNode } from 'react';
import { useAccessibilityPreferences, useFocusManagement, useAnnouncements, useSkipLinks } from '@/hooks/useAccessibility';

interface AccessibilityContextType {
  preferences: {
    reducedMotion: boolean;
    highContrast: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
  };
  focus: {
    saveFocus: () => void;
    restoreFocus: () => void;
    trapFocus: (container: HTMLElement) => () => void;
    releaseFocusTrap: () => void;
  };
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  skipLinks: {
    skipLinks: Array<{ id: string; label: string }>;
    registerSkipLink: (id: string, label: string) => void;
    unregisterSkipLink: (id: string) => void;
    skipToContent: (id: string) => void;
  };
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const preferences = useAccessibilityPreferences();
  const focus = useFocusManagement();
  const { announce } = useAnnouncements();
  const skipLinks = useSkipLinks();

  const contextValue: AccessibilityContextType = {
    preferences,
    focus,
    announce,
    skipLinks
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}