import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface VisuallyHiddenProps {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
}

/**
 * VisuallyHidden component for screen reader only content
 * Follows WCAG guidelines for accessible hidden content
 */
export function VisuallyHidden({ children, className, asChild = false }: VisuallyHiddenProps) {
  const hiddenClasses = cn(
    "absolute w-px h-px p-0 m-[-1px] overflow-hidden",
    "clip-path-[inset(50%)] border-0",
    "sr-only", // Tailwind utility for screen reader only
    className
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(children.props.className, hiddenClasses)
    });
  }

  return (
    <span className={hiddenClasses}>
      {children}
    </span>
  );
}

/**
 * Hook to conditionally show content only to screen readers
 */
export function useScreenReaderOnly(show: boolean = true) {
  return show ? "sr-only" : "";
}