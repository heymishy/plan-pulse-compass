import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AccessibilityProvider, useAccessibility } from '../AccessibilityProvider';

// Mock the accessibility hooks
vi.mock('@/hooks/useAccessibility', () => ({
  useAccessibilityPreferences: vi.fn(() => ({
    reducedMotion: false,
    highContrast: false,
    screenReader: false,
    keyboardNavigation: false
  })),
  useFocusManagement: vi.fn(() => ({
    saveFocus: vi.fn(),
    restoreFocus: vi.fn(),
    trapFocus: vi.fn(),
    releaseFocusTrap: vi.fn()
  })),
  useAnnouncements: vi.fn(() => ({
    announce: vi.fn()
  })),
  useSkipLinks: vi.fn(() => ({
    skipLinks: [],
    registerSkipLink: vi.fn(),
    unregisterSkipLink: vi.fn(),
    skipToContent: vi.fn()
  }))
}));

// Test component that uses the accessibility context
function TestComponent() {
  const { preferences, focus, announce, skipLinks } = useAccessibility();

  return (
    <div>
      <span data-testid="reduced-motion">{preferences.reducedMotion.toString()}</span>
      <span data-testid="high-contrast">{preferences.highContrast.toString()}</span>
      <span data-testid="screen-reader">{preferences.screenReader.toString()}</span>
      <span data-testid="keyboard-nav">{preferences.keyboardNavigation.toString()}</span>
      <button onClick={() => focus.saveFocus()}>Save Focus</button>
      <button onClick={() => focus.restoreFocus()}>Restore Focus</button>
      <button onClick={() => announce('Test message')}>Announce</button>
      <span data-testid="skip-links-count">{skipLinks.skipLinks.length}</span>
    </div>
  );
}

describe('AccessibilityProvider', () => {
  it('should provide accessibility context to children', () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false');
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');
    expect(screen.getByTestId('screen-reader')).toHaveTextContent('false');
    expect(screen.getByTestId('keyboard-nav')).toHaveTextContent('false');
    expect(screen.getByTestId('skip-links-count')).toHaveTextContent('0');
  });

  it('should provide focus management functions', () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(screen.getByText('Save Focus')).toBeInTheDocument();
    expect(screen.getByText('Restore Focus')).toBeInTheDocument();
  });

  it('should provide announcement function', () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(screen.getByText('Announce')).toBeInTheDocument();
  });

  it('should throw error when used outside provider', () => {
    // Temporarily suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAccessibility must be used within an AccessibilityProvider');

    consoleSpy.mockRestore();
  });
});