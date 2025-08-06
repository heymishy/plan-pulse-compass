import React, { ReactNode, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LiveRegionProps {
  children: ReactNode;
  priority?: 'off' | 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  className?: string;
  id?: string;
}

/**
 * LiveRegion component for announcing dynamic content changes to screen readers
 * Used for status updates, error messages, and other important notifications
 */
export function LiveRegion({ 
  children, 
  priority = 'polite',
  atomic = true,
  relevant = 'all',
  className,
  id
}: LiveRegionProps) {
  return (
    <div
      id={id}
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn("sr-only", className)}
    >
      {children}
    </div>
  );
}

/**
 * Status component for announcing status changes
 */
interface StatusProps {
  children: ReactNode;
  className?: string;
}

export function Status({ children, className }: StatusProps) {
  return (
    <LiveRegion 
      priority="polite" 
      className={className}
      role="status"
    >
      {children}
    </LiveRegion>
  );
}

/**
 * Alert component for urgent announcements
 */
interface AlertProps {
  children: ReactNode;
  className?: string;
}

export function Alert({ children, className }: AlertProps) {
  return (
    <LiveRegion 
      priority="assertive" 
      className={className}
      role="alert"
    >
      {children}
    </LiveRegion>
  );
}

/**
 * Hook for temporary announcements
 */
export function useTemporaryAnnouncement() {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [announcement, setAnnouncement] = React.useState<string>('');

  const announce = (message: string, duration: number = 3000) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setAnnouncement(message);

    // Clear announcement after duration
    timeoutRef.current = setTimeout(() => {
      setAnnouncement('');
    }, duration);
  };

  const clearAnnouncement = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setAnnouncement('');
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    announcement,
    announce,
    clearAnnouncement
  };
}