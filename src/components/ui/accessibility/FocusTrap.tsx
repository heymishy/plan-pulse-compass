import React, { useEffect, useRef, ReactNode } from 'react';
import { useAccessibility } from './AccessibilityProvider';

interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  restoreFocus?: boolean;
  className?: string;
}

/**
 * FocusTrap component that manages focus within a contained area
 * Commonly used in modals, dropdowns, and other overlay components
 */
export function FocusTrap({ 
  children, 
  active = true, 
  restoreFocus = true,
  className 
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { focus } = useAccessibility();

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Save the currently focused element
    if (restoreFocus) {
      focus.saveFocus();
    }

    // Set up focus trap
    const cleanup = focus.trapFocus(containerRef.current);

    // Focus the first focusable element
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    return () => {
      cleanup();
      focus.releaseFocusTrap();
      
      // Restore focus when component unmounts or becomes inactive
      if (restoreFocus) {
        focus.restoreFocus();
      }
    };
  }, [active, restoreFocus, focus]);

  return (
    <div 
      ref={containerRef} 
      className={className}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}

/**
 * Hook to manually control focus trapping
 */
export function useFocusTrap() {
  const { focus } = useAccessibility();
  const containerRef = useRef<HTMLElement | null>(null);

  const enableTrap = (container?: HTMLElement) => {
    const element = container || containerRef.current;
    if (!element) return;

    focus.saveFocus();
    return focus.trapFocus(element);
  };

  const disableTrap = () => {
    focus.releaseFocusTrap();
    focus.restoreFocus();
  };

  return {
    containerRef,
    enableTrap,
    disableTrap
  };
}