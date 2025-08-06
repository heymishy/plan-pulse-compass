import React, { ReactNode, forwardRef, useImperativeHandle, useRef } from 'react';
import { useKeyboardNavigation } from '@/hooks/useAccessibility';
import { cn } from '@/lib/utils';

interface KeyboardNavigableProps<T> {
  items: T[];
  children: (item: T, index: number, isFocused: boolean) => ReactNode;
  onSelect?: (item: T, index: number) => void;
  onEscape?: () => void;
  className?: string;
  role?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  orientation?: 'vertical' | 'horizontal';
}

export interface KeyboardNavigableRef {
  focus: () => void;
  resetFocus: () => void;
  setFocusedIndex: (index: number) => void;
}

/**
 * KeyboardNavigable component that provides keyboard navigation for lists of items
 * Supports arrow keys, Home/End keys, Enter/Space for selection, and Escape
 */
export const KeyboardNavigable = forwardRef<KeyboardNavigableRef, KeyboardNavigableProps<any>>(
  function KeyboardNavigable<T>({
    items,
    children,
    onSelect,
    onEscape,
    className,
    role = 'listbox',
    ariaLabel,
    ariaDescription,
    orientation = 'vertical'
  }: KeyboardNavigableProps<T>, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { focusedIndex, handleKeyDown, resetFocus, setFocusedIndex } = useKeyboardNavigation(
      items,
      onSelect,
      onEscape
    );

    useImperativeHandle(ref, () => ({
      focus: () => {
        containerRef.current?.focus();
      },
      resetFocus,
      setFocusedIndex
    }));

    return (
      <div
        ref={containerRef}
        role={role}
        tabIndex={0}
        className={cn("focus:outline-none", className)}
        aria-label={ariaLabel}
        aria-describedby={ariaDescription ? `${ariaLabel}-description` : undefined}
        aria-orientation={orientation}
        onKeyDown={handleKeyDown}
      >
        {ariaDescription && (
          <div id={`${ariaLabel}-description`} className="sr-only">
            {ariaDescription}
          </div>
        )}
        {items.map((item, index) => (
          <div
            key={index}
            role="option"
            aria-selected={focusedIndex === index}
            className={cn(focusedIndex === index && "focused")}
          >
            {children(item, index, focusedIndex === index)}
          </div>
        ))}
      </div>
    );
  }
);

/**
 * Simplified keyboard navigation hook for custom implementations
 */
export function useSimpleKeyboardNav(itemCount: number, onSelect?: (index: number) => void) {
  const [focusedIndex, setFocusedIndex] = React.useState(-1);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % itemCount);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev <= 0 ? itemCount - 1 : prev - 1);
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(itemCount - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < itemCount && onSelect) {
          onSelect(focusedIndex);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setFocusedIndex(-1);
        break;
    }
  }, [itemCount, focusedIndex, onSelect]);

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown
  };
}