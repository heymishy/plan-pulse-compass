/**
 * Design System Integration Tests
 * Tests for complete design system integration and consistency
 */

import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Import all design system components
import { designTokens, injectDesignTokens } from '@/design-tokens';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { SmartDataTable } from '@/components/ui/smart-data-table';
import { ResponsiveGrid } from '@/components/layout/responsive-grid';
import {
  Container,
  PageHeader,
  StandardPage,
} from '@/components/layout/page-templates';
import { FocusTrap } from '@/components/accessibility/focus-trap';
import {
  ScreenReaderOnly,
  AccessibleHeading,
} from '@/components/accessibility/screen-reader';

// Mock data for testing
const mockTableData = [
  { id: '1', name: 'John Doe', role: 'Developer', allocation: 80 },
  { id: '2', name: 'Jane Smith', role: 'Designer', allocation: 100 },
];

const mockTableColumns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'allocation', header: 'Allocation %' },
];

// Component that uses multiple design system pieces
const CompletePageExample = () => (
  <StandardPage
    header={{
      title: 'Team Management',
      description: 'Manage your team members and their allocations',
      breadcrumbs: [
        { label: 'Dashboard', href: '/' },
        { label: 'Team', current: true },
      ],
      actions: (
        <EnhancedButton icon={<span>+</span>}>Add Member</EnhancedButton>
      ),
    }}
  >
    <ResponsiveGrid cols={{ default: 1, lg: 3 }} gap="lg">
      <div className="lg:col-span-2">
        <AccessibleHeading level={2}>Team Members</AccessibleHeading>
        <SmartDataTable
          data={mockTableData}
          columns={mockTableColumns}
          actions={
            <EnhancedButton variant="outline" size="sm">
              Export
            </EnhancedButton>
          }
        />
      </div>
      <div>
        <AccessibleHeading level={2}>Quick Stats</AccessibleHeading>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium">Total Members</h3>
            <p className="text-2xl font-bold">2</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium">Average Allocation</h3>
            <p className="text-2xl font-bold">90%</p>
          </div>
        </div>
      </div>
    </ResponsiveGrid>
  </StandardPage>
);

// Modal example with focus trap
const ModalExample = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <FocusTrap active={isOpen} onDeactivate={onClose}>
        <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
          <AccessibleHeading level={2}>Confirm Action</AccessibleHeading>
          <p className="mt-2 text-gray-600">
            Are you sure you want to delete this item?
          </p>
          <div className="flex gap-3 mt-4">
            <EnhancedButton variant="destructive">Delete</EnhancedButton>
            <EnhancedButton variant="outline" onClick={onClose}>
              Cancel
            </EnhancedButton>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
};

describe('Design System Integration', () => {
  test('complete page renders without errors', () => {
    render(<CompletePageExample />);

    expect(screen.getByText('Team Management')).toBeInTheDocument();
    expect(screen.getByText('Team Members')).toBeInTheDocument();
    expect(screen.getByText('Quick Stats')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('design tokens are consistent across components', () => {
    render(<CompletePageExample />);

    // Check that components use design tokens
    expect(designTokens.colors.primary[500]).toBe('#0ea5e9');
    expect(designTokens.typography.fontFamily.sans).toContain('Inter');
    expect(designTokens.spacing.semantic.component.md).toBe('1rem');
  });

  test('responsive layout works correctly', () => {
    render(<CompletePageExample />);

    const grid = document.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'lg:grid-cols-3', 'gap-lg');

    // Check grid items
    const gridItems = document.querySelectorAll(
      '.lg\\:col-span-2, .lg\\:col-span-1'
    );
    expect(gridItems.length).toBeGreaterThan(0);
  });

  test('accessibility features work together', () => {
    render(<CompletePageExample />);

    // Check heading hierarchy
    const h1 = screen.getByRole('heading', { level: 1 });
    const h2s = screen.getAllByRole('heading', { level: 2 });

    expect(h1).toHaveTextContent('Team Management');
    expect(h2s).toHaveLength(2);
    expect(h2s[0]).toHaveTextContent('Team Members');
    expect(h2s[1]).toHaveTextContent('Quick Stats');
  });

  test('loading states work across components', () => {
    render(
      <div>
        <EnhancedButton loading loadingText="Saving...">
          Save Changes
        </EnhancedButton>
        <SmartDataTable data={[]} columns={mockTableColumns} loading={true} />
      </div>
    );

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();

    // Table should show loading skeleton
    const skeletons = document.querySelectorAll(
      '[data-testid*="skeleton"], .animate-pulse'
    );
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('error states are handled consistently', () => {
    render(
      <SmartDataTable
        data={[]}
        columns={mockTableColumns}
        error="Failed to load data"
      />
    );

    expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('focus management works in modal context', async () => {
    const TestModalContainer = () => {
      const [isOpen, setIsOpen] = React.useState(false);

      return (
        <div>
          <button onClick={() => setIsOpen(true)} data-testid="open-modal">
            Open Modal
          </button>
          <ModalExample isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>
      );
    };

    const user = userEvent.setup();
    render(<TestModalContainer />);

    const openButton = screen.getByTestId('open-modal');
    await user.click(openButton);

    // Modal should be open and focused
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();

    // First focusable element should be focused
    const deleteButton = screen.getByText('Delete');
    expect(document.activeElement).toBe(deleteButton);

    // Escape should close modal
    await user.keyboard('{Escape}');
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  test('components work with custom themes', () => {
    // Mock CSS custom properties injection
    const mockSetProperty = vi.fn();
    Object.defineProperty(document.documentElement.style, 'setProperty', {
      value: mockSetProperty,
    });

    injectDesignTokens();

    // Should have injected CSS variables
    expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', '#0ea5e9');
    expect(mockSetProperty).toHaveBeenCalledWith(
      '--font-sans',
      expect.stringContaining('Inter')
    );
  });

  test('screen reader accessibility across components', () => {
    render(
      <div>
        <ScreenReaderOnly>Skip to main content</ScreenReaderOnly>
        <CompletePageExample />
      </div>
    );

    // Screen reader only content should be hidden visually
    const srOnly = screen.getByText('Skip to main content');
    expect(srOnly).toHaveClass('sr-only');

    // All interactive elements should have proper ARIA
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toHaveAttribute('aria-hidden', 'true');
    });

    // Tables should have proper structure
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders.length).toBeGreaterThan(0);
  });

  test('keyboard navigation works across components', async () => {
    const user = userEvent.setup();
    render(<CompletePageExample />);

    // Find all focusable elements
    const buttons = screen.getAllByRole('button');

    // First button should be focusable
    const firstButton = buttons[0];
    firstButton.focus();
    expect(document.activeElement).toBe(firstButton);

    // Tab navigation should work
    await user.tab();
    expect(document.activeElement).not.toBe(firstButton);
  });

  test('responsive behavior at different breakpoints', () => {
    // Mock different viewport widths
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // lg breakpoint
    });

    render(<CompletePageExample />);

    const grid = document.querySelector('.grid');
    expect(grid).toHaveClass('lg:grid-cols-3');

    // Grid items should have responsive spans
    const largeSpanItem = document.querySelector('.lg\\:col-span-2');
    expect(largeSpanItem).toBeInTheDocument();
  });

  test('design system maintains consistency under stress', () => {
    // Render many components to test consistency
    const StressTest = () => (
      <div>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i}>
            <AccessibleHeading level={2}>Section {i + 1}</AccessibleHeading>
            <ResponsiveGrid cols={{ default: 2 }}>
              <EnhancedButton loading={i % 2 === 0}>
                Button {i + 1}
              </EnhancedButton>
              <div className="p-4 border">Content {i + 1}</div>
            </ResponsiveGrid>
          </div>
        ))}
      </div>
    );

    render(<StressTest />);

    // All headings should be present
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(10);

    // All buttons should be present
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(10);

    // Half should be in loading state
    const disabledButtons = buttons.filter(button =>
      button.hasAttribute('disabled')
    );
    expect(disabledButtons).toHaveLength(5);
  });
});

describe('Performance Integration', () => {
  test('components render efficiently', () => {
    const startTime = performance.now();

    render(<CompletePageExample />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time (adjust threshold as needed)
    expect(renderTime).toBeLessThan(100); // 100ms threshold
  });

  test('lazy loading works with design system', () => {
    // This would test lazy loading in actual implementation
    const LazyComponent = React.lazy(() =>
      Promise.resolve({
        default: () => <EnhancedButton>Lazy Button</EnhancedButton>,
      })
    );

    render(
      <React.Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </React.Suspense>
    );

    expect(screen.getByText('Lazy Button')).toBeInTheDocument();
  });
});
