/**
 * Enhanced Button Component
 * Extended button with loading states, icons, and tooltips
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { cn } from '@/lib/utils';

export interface EnhancedButtonProps extends ButtonProps {
  /** Show loading spinner and disable interaction */
  loading?: boolean;
  /** Text to display while loading (defaults to children) */
  loadingText?: string;
  /** Icon to display alongside text */
  icon?: React.ReactNode;
  /** Position of the icon */
  iconPosition?: 'left' | 'right';
  /** Tooltip text to display on hover */
  tooltip?: string;
  /** Custom loading spinner */
  loadingSpinner?: React.ReactNode;
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  (
    {
      loading = false,
      loadingText,
      icon,
      iconPosition = 'left',
      tooltip,
      loadingSpinner,
      children,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const buttonContent = (
      <Button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'relative',
          // Loading state styles
          loading && 'cursor-not-allowed',
          className
        )}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <span className="mr-2 flex items-center">
            {loadingSpinner || <Loader2 className="h-4 w-4 animate-spin" />}
          </span>
        )}

        {/* Left icon */}
        {!loading && icon && iconPosition === 'left' && (
          <span className="mr-2 flex items-center">{icon}</span>
        )}

        {/* Button text */}
        <span className={cn(loading && loadingText && 'inline-block')}>
          {loading && loadingText ? loadingText : children}
        </span>

        {/* Right icon */}
        {!loading && icon && iconPosition === 'right' && (
          <span className="ml-2 flex items-center">{icon}</span>
        )}

        {/* Loading overlay for visual consistency */}
        {loading && (
          <span
            className="absolute inset-0 bg-current opacity-10 rounded-[inherit]"
            aria-hidden="true"
          />
        )}
      </Button>
    );

    // Wrap with tooltip if provided
    if (tooltip && !loading) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent side="top">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return buttonContent;
  }
);

EnhancedButton.displayName = 'EnhancedButton';

// Preset button variants for common use cases
export const LoadingButton = React.forwardRef<
  HTMLButtonElement,
  Omit<EnhancedButtonProps, 'loading'> & { loading: boolean }
>(({ loading, children, loadingText, ...props }, ref) => (
  <EnhancedButton
    ref={ref}
    loading={loading}
    loadingText={loadingText || `${children}...`}
    {...props}
  >
    {children}
  </EnhancedButton>
));

LoadingButton.displayName = 'LoadingButton';

export const IconButton = React.forwardRef<
  HTMLButtonElement,
  Omit<EnhancedButtonProps, 'icon'> & { icon: React.ReactNode }
>(({ icon, children, ...props }, ref) => (
  <EnhancedButton ref={ref} icon={icon} {...props}>
    {children}
  </EnhancedButton>
));

IconButton.displayName = 'IconButton';

export const TooltipButton = React.forwardRef<
  HTMLButtonElement,
  Omit<EnhancedButtonProps, 'tooltip'> & { tooltip: string }
>(({ tooltip, ...props }, ref) => (
  <EnhancedButton ref={ref} tooltip={tooltip} {...props} />
));

TooltipButton.displayName = 'TooltipButton';

export { EnhancedButton };
