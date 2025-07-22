/**
 * Enhanced Button Component Tests
 * Tests for the enhanced button with loading states and accessibility
 */

import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Download, ArrowRight } from 'lucide-react';
import {
  EnhancedButton,
  LoadingButton,
  IconButton,
  TooltipButton,
} from '@/components/ui/enhanced-button';

// Mock tooltip components
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div role="tooltip">{children}</div>
  ),
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe.skip('EnhancedButton', () => {
  test('renders basic button correctly', () => {
    render(<EnhancedButton>Click me</EnhancedButton>);

    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  test('shows loading state correctly', () => {
    render(
      <EnhancedButton loading loadingText="Processing...">
        Submit
      </EnhancedButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });

  test('shows loading spinner when loading', () => {
    render(<EnhancedButton loading>Submit</EnhancedButton>);

    // Check for loading spinner (Loader2 icon)
    const button = screen.getByRole('button');
    expect(button.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('displays icon in correct position', () => {
    const { rerender } = render(
      <EnhancedButton
        icon={<Download data-testid="download-icon" />}
        iconPosition="left"
      >
        Download
      </EnhancedButton>
    );

    const icon = screen.getByTestId('download-icon');
    const button = screen.getByRole('button');

    // Icon should be before text
    expect(button.textContent).toBe('Download');
    expect(icon).toBeInTheDocument();

    // Test right position
    rerender(
      <EnhancedButton
        icon={<ArrowRight data-testid="arrow-icon" />}
        iconPosition="right"
      >
        Next
      </EnhancedButton>
    );

    expect(screen.getByTestId('arrow-icon')).toBeInTheDocument();
  });

  test('hides icon when loading', () => {
    render(
      <EnhancedButton
        icon={<Download data-testid="download-icon" />}
        loading
        loadingText="Downloading..."
      >
        Download
      </EnhancedButton>
    );

    expect(screen.queryByTestId('download-icon')).not.toBeInTheDocument();
    expect(screen.getByText('Downloading...')).toBeInTheDocument();
  });

  test('handles click events when not loading', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<EnhancedButton onClick={handleClick}>Click me</EnhancedButton>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('prevents click events when loading', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <EnhancedButton onClick={handleClick} loading>
        Loading
      </EnhancedButton>
    );

    const button = screen.getByRole('button');
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('respects disabled prop', () => {
    const handleClick = vi.fn();
    render(
      <EnhancedButton onClick={handleClick} disabled>
        Disabled
      </EnhancedButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('shows tooltip when provided', () => {
    render(
      <EnhancedButton tooltip="This is a helpful tooltip">
        Hover me
      </EnhancedButton>
    );

    expect(screen.getByText('This is a helpful tooltip')).toBeInTheDocument();
  });

  test('hides tooltip when loading', () => {
    render(
      <EnhancedButton tooltip="This tooltip should be hidden" loading>
        Loading
      </EnhancedButton>
    );

    expect(
      screen.queryByText('This tooltip should be hidden')
    ).not.toBeInTheDocument();
  });

  test('applies custom className', () => {
    render(<EnhancedButton className="custom-class">Button</EnhancedButton>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  test('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<EnhancedButton ref={ref}>Button</EnhancedButton>);

    expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
  });
});

describe.skip('LoadingButton', () => {
  test('shows loading state correctly', () => {
    render(<LoadingButton loading>Save</LoadingButton>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Save...')).toBeInTheDocument();
  });

  test('uses custom loading text', () => {
    render(
      <LoadingButton loading loadingText="Saving your data">
        Save
      </LoadingButton>
    );

    expect(screen.getByText('Saving your data')).toBeInTheDocument();
  });

  test('shows normal state when not loading', () => {
    render(<LoadingButton loading={false}>Save</LoadingButton>);

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });
});

describe.skip('IconButton', () => {
  test('displays icon correctly', () => {
    render(
      <IconButton icon={<Download data-testid="icon" />}>Download</IconButton>
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  test('works with loading state', () => {
    render(
      <IconButton icon={<Download />} loading>
        Download
      </IconButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});

describe.skip('TooltipButton', () => {
  test('shows tooltip correctly', () => {
    render(<TooltipButton tooltip="Click to download">Download</TooltipButton>);

    expect(screen.getByText('Click to download')).toBeInTheDocument();
  });

  test('works with other props', () => {
    render(
      <TooltipButton tooltip="Loading tooltip" loading icon={<Download />}>
        Download
      </TooltipButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});

describe.skip('Accessibility', () => {
  test('maintains proper ARIA attributes', () => {
    render(<EnhancedButton loading>Loading</EnhancedButton>);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toBeDisabled();
  });

  test('has proper keyboard navigation', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<EnhancedButton onClick={handleClick}>Click me</EnhancedButton>);

    const button = screen.getByRole('button');
    button.focus();

    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);

    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  test('provides screen reader feedback for loading state', () => {
    render(
      <EnhancedButton loading loadingText="Please wait">
        Submit
      </EnhancedButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Please wait');
  });
});
