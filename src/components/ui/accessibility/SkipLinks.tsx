import React from 'react';
import { cn } from '@/lib/utils';
import { useAccessibility } from './AccessibilityProvider';

interface SkipLinksProps {
  className?: string;
}

export function SkipLinks({ className }: SkipLinksProps) {
  const { skipLinks } = useAccessibility();

  if (skipLinks.skipLinks.length === 0) {
    return null;
  }

  return (
    <div 
      className={cn(
        "absolute top-0 left-0 z-[9999] bg-primary text-primary-foreground rounded-md shadow-lg",
        "transform -translate-y-full focus-within:translate-y-0",
        "transition-transform duration-200",
        className
      )}
      role="navigation"
      aria-label="Skip navigation links"
    >
      <ul className="flex flex-col p-2 space-y-1">
        {skipLinks.skipLinks.map(({ id, label }) => (
          <li key={id}>
            <button
              onClick={() => skipLinks.skipToContent(id)}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded",
                "focus:outline-none focus:ring-2 focus:ring-primary-foreground",
                "hover:bg-primary/80 transition-colors"
              )}
            >
              Skip to {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Hook to register skip links in components
export function useSkipLink(id: string, label: string) {
  const { skipLinks } = useAccessibility();

  React.useEffect(() => {
    skipLinks.registerSkipLink(id, label);
    return () => skipLinks.unregisterSkipLink(id);
  }, [id, label, skipLinks]);
}