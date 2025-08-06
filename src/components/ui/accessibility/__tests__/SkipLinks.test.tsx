import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SkipLinks, useSkipLink } from '../SkipLinks';
import { AccessibilityProvider } from '../AccessibilityProvider';

// Mock the accessibility context
const mockSkipToContent = vi.fn();
const mockRegisterSkipLink = vi.fn();
const mockUnregisterSkipLink = vi.fn();

vi.mock('../AccessibilityProvider', () => ({
  useAccessibility: vi.fn(() => ({
    skipLinks: {
      skipLinks: [
        { id: 'main-content', label: 'Main Content' },
        { id: 'navigation', label: 'Navigation' }
      ],
      registerSkipLink: mockRegisterSkipLink,
      unregisterSkipLink: mockUnregisterSkipLink,
      skipToContent: mockSkipToContent
    }
  })),
  AccessibilityProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe('SkipLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render skip links when available', () => {
    render(<SkipLinks />);

    expect(screen.getByRole('navigation', { name: 'Skip navigation links' })).toBeInTheDocument();
    expect(screen.getByText('Skip to Main Content')).toBeInTheDocument();
    expect(screen.getByText('Skip to Navigation')).toBeInTheDocument();
  });

  it('should not render when no skip links are available', () => {
    vi.mocked(require('../AccessibilityProvider').useAccessibility).mockReturnValue({
      skipLinks: {
        skipLinks: [],
        registerSkipLink: mockRegisterSkipLink,
        unregisterSkipLink: mockUnregisterSkipLink,
        skipToContent: mockSkipToContent
      }
    });

    const { container } = render(<SkipLinks />);
    expect(container.firstChild).toBeNull();
  });

  it('should call skipToContent when skip link is clicked', () => {
    render(<SkipLinks />);

    fireEvent.click(screen.getByText('Skip to Main Content'));
    expect(mockSkipToContent).toHaveBeenCalledWith('main-content');

    fireEvent.click(screen.getByText('Skip to Navigation'));
    expect(mockSkipToContent).toHaveBeenCalledWith('navigation');
  });

  it('should apply custom className', () => {
    render(<SkipLinks className="custom-class" />);

    const skipLinksContainer = screen.getByRole('navigation');
    expect(skipLinksContainer).toHaveClass('custom-class');
  });

  it('should have proper ARIA attributes', () => {
    render(<SkipLinks />);

    const navigation = screen.getByRole('navigation', { name: 'Skip navigation links' });
    expect(navigation).toBeInTheDocument();
  });
});

describe('useSkipLink', () => {
  function TestUseSkipLink({ id, label }: { id: string; label: string }) {
    useSkipLink(id, label);
    return <div>Test Component</div>;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register skip link on mount', () => {
    render(
      <AccessibilityProvider>
        <TestUseSkipLink id="test-content" label="Test Content" />
      </AccessibilityProvider>
    );

    expect(mockRegisterSkipLink).toHaveBeenCalledWith('test-content', 'Test Content');
  });

  it('should unregister skip link on unmount', () => {
    const { unmount } = render(
      <AccessibilityProvider>
        <TestUseSkipLink id="test-content" label="Test Content" />
      </AccessibilityProvider>
    );

    unmount();

    expect(mockUnregisterSkipLink).toHaveBeenCalledWith('test-content');
  });

  it('should re-register when id or label changes', () => {
    const { rerender } = render(
      <AccessibilityProvider>
        <TestUseSkipLink id="test-1" label="Test 1" />
      </AccessibilityProvider>
    );

    expect(mockRegisterSkipLink).toHaveBeenCalledWith('test-1', 'Test 1');

    rerender(
      <AccessibilityProvider>
        <TestUseSkipLink id="test-2" label="Test 2" />
      </AccessibilityProvider>
    );

    expect(mockUnregisterSkipLink).toHaveBeenCalledWith('test-1');
    expect(mockRegisterSkipLink).toHaveBeenCalledWith('test-2', 'Test 2');
  });
});