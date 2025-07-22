/**
 * Keyboard Shortcuts Component
 * Provides keyboard navigation utilities and shortcuts
 */

import React, { useEffect, useCallback, useMemo } from 'react';

export interface KeyboardShortcut {
  /** Unique identifier for the shortcut */
  id: string;
  /** Key combination (e.g., 'ctrl+s', 'cmd+k', 'escape') */
  keys: string;
  /** Description of what the shortcut does */
  description: string;
  /** Handler function */
  handler: (event: KeyboardEvent) => void;
  /** Whether the shortcut is enabled */
  enabled?: boolean;
  /** Prevent default browser behavior */
  preventDefault?: boolean;
  /** Stop event propagation */
  stopPropagation?: boolean;
  /** Only trigger when these elements are focused */
  targetElements?: string[];
  /** Don't trigger when these elements are focused */
  ignoreElements?: string[];
}

export interface KeyboardShortcutsProps {
  /** Array of keyboard shortcuts to register */
  shortcuts: KeyboardShortcut[];
  /** Whether shortcuts are globally active */
  enabled?: boolean;
  /** Scope element (defaults to document) */
  scope?: HTMLElement | null;
}

// Parse key combinations into normalized format
const parseKeys = (
  keys: string
): {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
} => {
  const parts = keys.toLowerCase().split('+');
  const modifiers = {
    ctrl: parts.includes('ctrl'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
    meta: parts.includes('cmd') || parts.includes('meta'),
  };

  const key =
    parts.find(
      part => !['ctrl', 'alt', 'shift', 'cmd', 'meta'].includes(part)
    ) || '';

  return { ...modifiers, key };
};

// Check if current event matches the shortcut
const matchesShortcut = (
  event: KeyboardEvent,
  shortcut: ReturnType<typeof parseKeys>
): boolean => {
  return (
    event.key.toLowerCase() === shortcut.key &&
    event.ctrlKey === shortcut.ctrl &&
    event.altKey === shortcut.alt &&
    event.shiftKey === shortcut.shift &&
    event.metaKey === shortcut.meta
  );
};

// Check if target element should be ignored
const shouldIgnoreTarget = (
  event: KeyboardEvent,
  targetElements?: string[],
  ignoreElements?: string[]
): boolean => {
  const target = event.target as HTMLElement;
  if (!target) return false;

  // Check ignore list
  if (ignoreElements?.length) {
    const shouldIgnore = ignoreElements.some(
      selector => target.matches?.(selector) || target.closest?.(selector)
    );
    if (shouldIgnore) return true;
  }

  // Check target list (if specified, only allow these)
  if (targetElements?.length) {
    const isTargeted = targetElements.some(
      selector => target.matches?.(selector) || target.closest?.(selector)
    );
    return !isTargeted;
  }

  // Default ignore for form elements (unless specifically targeted)
  if (!targetElements?.length) {
    const formElements = [
      'input',
      'textarea',
      'select',
      '[contenteditable="true"]',
    ];
    const isFormElement = formElements.some(selector =>
      target.matches?.(selector)
    );
    if (isFormElement) return true;
  }

  return false;
};

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  shortcuts,
  enabled = true,
  scope,
}) => {
  // Parse shortcuts once
  const parsedShortcuts = useMemo(
    () =>
      shortcuts.map(shortcut => ({
        ...shortcut,
        parsed: parseKeys(shortcut.keys),
      })),
    [shortcuts]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      parsedShortcuts.forEach(shortcut => {
        if (
          !shortcut.enabled !== false &&
          matchesShortcut(event, shortcut.parsed)
        ) {
          // Check if we should ignore this target
          if (
            shouldIgnoreTarget(
              event,
              shortcut.targetElements,
              shortcut.ignoreElements
            )
          ) {
            return;
          }

          // Handle the shortcut
          if (shortcut.preventDefault) {
            event.preventDefault();
          }
          if (shortcut.stopPropagation) {
            event.stopPropagation();
          }

          shortcut.handler(event);
        }
      });
    },
    [enabled, parsedShortcuts]
  );

  useEffect(() => {
    const target = scope || document;
    target.addEventListener('keydown', handleKeyDown);

    return () => {
      target.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, scope]);

  return null;
};

// Hook for using keyboard shortcuts
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true,
  scope?: HTMLElement | null
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach(shortcut => {
        if (shortcut.enabled !== false) {
          const parsed = parseKeys(shortcut.keys);
          if (matchesShortcut(event, parsed)) {
            if (
              shouldIgnoreTarget(
                event,
                shortcut.targetElements,
                shortcut.ignoreElements
              )
            ) {
              return;
            }

            if (shortcut.preventDefault) {
              event.preventDefault();
            }
            if (shortcut.stopPropagation) {
              event.stopPropagation();
            }

            shortcut.handler(event);
          }
        }
      });
    };

    const target = scope || document;
    target.addEventListener('keydown', handleKeyDown);

    return () => {
      target.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled, scope]);
};

// Common keyboard navigation patterns
export const useArrowNavigation = (options: {
  /** CSS selector for navigable elements */
  selector: string;
  /** Container element (defaults to document) */
  container?: HTMLElement | null;
  /** Whether to wrap around at ends */
  wrap?: boolean;
  /** Orientation of navigation */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /** Callback when navigation occurs */
  onNavigate?: (element: HTMLElement, direction: string) => void;
}) => {
  const {
    selector,
    container,
    wrap = true,
    orientation = 'both',
    onNavigate,
  } = options;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event;
      const isArrowKey = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
      ].includes(key);

      if (!isArrowKey) return;

      const target = container || document;
      const elements = Array.from(
        target.querySelectorAll(selector)
      ) as HTMLElement[];
      const currentElement = document.activeElement as HTMLElement;
      const currentIndex = elements.indexOf(currentElement);

      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      let direction = '';

      // Handle arrow key navigation based on orientation
      if (orientation === 'horizontal' || orientation === 'both') {
        if (key === 'ArrowLeft') {
          direction = 'left';
          nextIndex = wrap
            ? (currentIndex - 1 + elements.length) % elements.length
            : Math.max(0, currentIndex - 1);
        } else if (key === 'ArrowRight') {
          direction = 'right';
          nextIndex = wrap
            ? (currentIndex + 1) % elements.length
            : Math.min(elements.length - 1, currentIndex + 1);
        }
      }

      if (orientation === 'vertical' || orientation === 'both') {
        if (key === 'ArrowUp') {
          direction = 'up';
          nextIndex = wrap
            ? (currentIndex - 1 + elements.length) % elements.length
            : Math.max(0, currentIndex - 1);
        } else if (key === 'ArrowDown') {
          direction = 'down';
          nextIndex = wrap
            ? (currentIndex + 1) % elements.length
            : Math.min(elements.length - 1, currentIndex + 1);
        }
      }

      if (nextIndex !== currentIndex) {
        event.preventDefault();
        const nextElement = elements[nextIndex];
        nextElement?.focus();
        onNavigate?.(nextElement, direction);
      }
    };

    const target = container || document;
    target.addEventListener('keydown', handleKeyDown);

    return () => {
      target.removeEventListener('keydown', handleKeyDown);
    };
  }, [selector, container, wrap, orientation, onNavigate]);
};

// Skip link component for accessibility
export interface SkipLinkProps {
  /** Target element ID to skip to */
  targetId: string;
  /** Skip link text */
  children: React.ReactNode;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  children,
  className,
}) => (
  <a
    href={`#${targetId}`}
    className={`
      sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
      focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground
      focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 
      focus:ring-ring focus:ring-offset-2
      ${className}
    `}
    onFocus={e => {
      // Ensure target element exists and is focusable
      const target = document.getElementById(targetId);
      if (target && !target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
    }}
  >
    {children}
  </a>
);

export default KeyboardShortcuts;
