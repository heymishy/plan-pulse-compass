/**
 * Focus Trap Component
 * Traps focus within a container for accessible modals and dialogs
 */

import React, { useEffect, useRef, useCallback } from 'react';

export interface FocusTrapProps {
  children: React.ReactNode;
  /** Whether the focus trap is active */
  active?: boolean;
  /** Element to focus when trap activates */
  initialFocus?: HTMLElement | null;
  /** Element to focus when trap deactivates */
  restoreFocus?: HTMLElement | null;
  /** Allow clicking outside to break focus */
  clickOutsideDeactivates?: boolean;
  /** Callback when focus trap deactivates */
  onDeactivate?: () => void;
  className?: string;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  initialFocus,
  restoreFocus,
  clickOutsideDeactivates = true,
  onDeactivate,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the trap
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
    ) as HTMLElement[];
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!active || event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const currentElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab: moving backwards
        if (
          currentElement === firstElement ||
          !containerRef.current?.contains(currentElement)
        ) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: moving forwards
        if (
          currentElement === lastElement ||
          !containerRef.current?.contains(currentElement)
        ) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [active, getFocusableElements]
  );

  // Handle escape key
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (active && event.key === 'Escape') {
        onDeactivate?.();
      }
    },
    [active, onDeactivate]
  );

  // Handle click outside
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        active &&
        clickOutsideDeactivates &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onDeactivate?.();
      }
    },
    [active, clickOutsideDeactivates, onDeactivate]
  );

  // Activate focus trap
  useEffect(() => {
    if (!active) return;

    // Store the previously focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Focus the initial element
    const focusTarget = initialFocus || getFocusableElements()[0];
    if (focusTarget) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => focusTarget.focus(), 0);
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleEscape);
    if (clickOutsideDeactivates) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [
    active,
    initialFocus,
    getFocusableElements,
    handleKeyDown,
    handleEscape,
    handleClickOutside,
  ]);

  // Deactivate focus trap
  useEffect(() => {
    if (active) return;

    // Restore focus to previous element
    if (restoreFocus && restoreFocus.isConnected) {
      restoreFocus.focus();
    } else if (previousActiveElementRef.current?.isConnected) {
      previousActiveElementRef.current.focus();
    }
  }, [active, restoreFocus]);

  return (
    <div
      ref={containerRef}
      className={className}
      // Ensure the container is focusable for screen readers
      tabIndex={-1}
    >
      {children}
    </div>
  );
};

// Hook for managing focus trap state
export const useFocusTrap = (active: boolean = false) => {
  const [isActive, setIsActive] = React.useState(active);
  const initialFocusRef = useRef<HTMLElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const activate = useCallback((initialFocus?: HTMLElement) => {
    restoreFocusRef.current = document.activeElement as HTMLElement;
    initialFocusRef.current = initialFocus || null;
    setIsActive(true);
  }, []);

  const deactivate = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    isActive,
    activate,
    deactivate,
    initialFocus: initialFocusRef.current,
    restoreFocus: restoreFocusRef.current,
  };
};

export default FocusTrap;
