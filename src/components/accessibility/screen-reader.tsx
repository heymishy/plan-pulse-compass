/**
 * Screen Reader Utilities
 * Components and hooks for enhanced screen reader accessibility
 */

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Screen reader only text
export interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  /** Make visible on focus (useful for skip links) */
  focusable?: boolean;
  className?: string;
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({
  children,
  focusable = false,
  className,
}) => (
  <span
    className={cn(
      'sr-only',
      focusable &&
        'focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50',
      className
    )}
  >
    {children}
  </span>
);

// Live region for announcements
export interface LiveRegionProps {
  /** Content to announce */
  children: React.ReactNode;
  /** Politeness level */
  politeness?: 'off' | 'polite' | 'assertive';
  /** Atomic updates (announce entire region vs just changes) */
  atomic?: boolean;
  /** Relevant changes to announce */
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  /** Clear content after announcement */
  clearAfter?: number;
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  politeness = 'polite',
  atomic = false,
  relevant = 'all',
  clearAfter,
  className,
}) => {
  const [content, setContent] = useState(children);

  useEffect(() => {
    setContent(children);

    if (clearAfter && children) {
      const timer = setTimeout(() => {
        setContent('');
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [children, clearAfter]);

  return (
    <div
      className={cn('sr-only', className)}
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      role={politeness === 'assertive' ? 'alert' : 'status'}
    >
      {content}
    </div>
  );
};

// Hook moved to @/hooks/useScreenReaderAnnouncement for react-refresh compliance

// Enhanced form field with proper labeling
export interface AccessibleFormFieldProps {
  children: React.ReactNode;
  /** Field label */
  label: string;
  /** Required field */
  required?: boolean;
  /** Help text */
  description?: string;
  /** Error message */
  error?: string;
  /** Field ID (auto-generated if not provided) */
  fieldId?: string;
  className?: string;
}

export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  children,
  label,
  required = false,
  description,
  error,
  fieldId: providedId,
  className,
}) => {
  const generatedId = useRef(`field-${Math.random().toString(36).slice(2, 9)}`);
  const fieldId = providedId || generatedId.current;
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;

  // Build describedby attribute
  const describedBy = [description && descriptionId, error && errorId]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
        {label}
        {required && (
          <>
            <span className="text-destructive ml-1" aria-hidden="true">
              *
            </span>
            <ScreenReaderOnly>(required)</ScreenReaderOnly>
          </>
        )}
      </label>

      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {/* Clone children to add accessibility attributes */}
      {React.cloneElement(children as React.ReactElement, {
        id: fieldId,
        'aria-describedby': describedBy || undefined,
        'aria-required': required,
        'aria-invalid': !!error,
      })}

      {error && (
        <p
          id={errorId}
          className="text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible heading component with proper hierarchy
export interface AccessibleHeadingProps {
  /** Heading level (1-6) */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  /** Visual size (can be different from semantic level) */
  visualSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
}

export const AccessibleHeading: React.FC<AccessibleHeadingProps> = ({
  level,
  children,
  visualSize,
  className,
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  };

  const defaultSizes = {
    1: '3xl',
    2: '2xl',
    3: 'xl',
    4: 'lg',
    5: 'base',
    6: 'sm',
  } as const;

  const size = visualSize || defaultSizes[level];

  return (
    <Tag
      className={cn(
        'font-semibold text-foreground',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </Tag>
  );
};

// Progress indicator with screen reader announcements
export interface AccessibleProgressProps {
  /** Current value */
  value: number;
  /** Maximum value */
  max?: number;
  /** Minimum value */
  min?: number;
  /** Progress label */
  label: string;
  /** Show percentage */
  showPercentage?: boolean;
  /** Announce progress changes */
  announceChanges?: boolean;
  className?: string;
}

export const AccessibleProgress: React.FC<AccessibleProgressProps> = ({
  value,
  max = 100,
  min = 0,
  label,
  showPercentage = true,
  announceChanges = false,
  className,
}) => {
  const percentage = Math.round(((value - min) / (max - min)) * 100);
  const { announce } = useScreenReaderAnnouncement();

  useEffect(() => {
    if (announceChanges) {
      announce(`${label}: ${percentage}% complete`);
    }
  }, [percentage, label, announceChanges, announce]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        {showPercentage && (
          <span className="text-sm text-muted-foreground">{percentage}%</span>
        )}
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-label={`${label}: ${percentage}% complete`}
        />
      </div>
    </div>
  );
};

// Export removed - useScreenReaderAnnouncement is now in @/hooks/useScreenReaderAnnouncement
