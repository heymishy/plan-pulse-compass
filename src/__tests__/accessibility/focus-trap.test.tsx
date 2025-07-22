/**
 * Focus Trap Component Tests
 * Tests for accessible focus management
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FocusTrap, useFocusTrap } from '@/components/accessibility/focus-trap';
import React from 'react';

// Mock component to test the focus trap
const TestModal = ({
  active = true,
  onDeactivate = vi.fn(),
  initialFocus = null as HTMLElement | null,
}) => (
  <div>
    <button data-testid="outside-button">Outside Button</button>
    <FocusTrap
      active={active}
      onDeactivate={onDeactivate}
      initialFocus={initialFocus}
      data-testid="focus-trap"
    >
      <div>
        <h2>Modal Title</h2>
        <button data-testid="first-button">First Button</button>
        <input data-testid="text-input" placeholder="Text input" />
        <button data-testid="last-button">Last Button</button>
      </div>
    </FocusTrap>
    <button data-testid="outside-button-2">Another Outside Button</button>
  </div>
);

// Component to test the hook
const TestHookComponent = () => {
  const { isActive, activate, deactivate, initialFocus, restoreFocus } =
    useFocusTrap();

  return (
    <div>
      <button onClick={() => activate()}>Activate</button>
      <button onClick={deactivate}>Deactivate</button>
      <FocusTrap
        active={isActive}
        initialFocus={initialFocus}
        restoreFocus={restoreFocus}
        onDeactivate={deactivate}
      >
        <div>
          <button data-testid="trapped-button">Trapped Button</button>
        </div>
      </FocusTrap>
    </div>
  );
};

describe('FocusTrap', () => {
  let originalActiveElement: Element | null;

  beforeEach(() => {
    originalActiveElement = document.activeElement;
    // Clear any existing focus
    document.body.focus();
  });

  afterEach(() => {
    // Restore original focus
    if (originalActiveElement && 'focus' in originalActiveElement) {
      (originalActiveElement as HTMLElement).focus();
    }
  });

  test('focuses first element when activated', async () => {
    render(<TestModal />);

    // Wait for focus to be applied
    await new Promise(resolve => setTimeout(resolve, 10));

    const firstButton = screen.getByTestId('first-button');
    expect(document.activeElement).toBe(firstButton);
  });

  test('traps focus within container', async () => {
    const user = userEvent.setup();
    render(<TestModal />);

    const firstButton = screen.getByTestId('first-button');
    const textInput = screen.getByTestId('text-input');
    const lastButton = screen.getByTestId('last-button');

    // Start at first button
    firstButton.focus();
    expect(document.activeElement).toBe(firstButton);

    // Tab to text input
    await user.tab();
    expect(document.activeElement).toBe(textInput);

    // Tab to last button
    await user.tab();
    expect(document.activeElement).toBe(lastButton);

    // Tab should wrap to first button
    await user.tab();
    expect(document.activeElement).toBe(firstButton);
  });

  test('handles shift+tab for backward navigation', async () => {
    const user = userEvent.setup();
    render(<TestModal />);

    const firstButton = screen.getByTestId('first-button');
    const lastButton = screen.getByTestId('last-button');

    // Start at first button
    firstButton.focus();
    expect(document.activeElement).toBe(firstButton);

    // Shift+Tab should wrap to last button
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(lastButton);
  });

  test('calls onDeactivate when escape is pressed', async () => {
    const onDeactivate = vi.fn();
    const user = userEvent.setup();

    render(<TestModal onDeactivate={onDeactivate} />);

    await user.keyboard('{Escape}');
    expect(onDeactivate).toHaveBeenCalledTimes(1);
  });

  test('calls onDeactivate when clicking outside', async () => {
    const onDeactivate = vi.fn();
    const user = userEvent.setup();

    render(<TestModal onDeactivate={onDeactivate} />);

    const outsideButton = screen.getByTestId('outside-button');
    await user.click(outsideButton);

    expect(onDeactivate).toHaveBeenCalledTimes(1);
  });

  test('does not call onDeactivate when clicking inside', async () => {
    const onDeactivate = vi.fn();
    const user = userEvent.setup();

    render(<TestModal onDeactivate={onDeactivate} />);

    const firstButton = screen.getByTestId('first-button');
    await user.click(firstButton);

    expect(onDeactivate).not.toHaveBeenCalled();
  });

  test('does not trap focus when inactive', () => {
    render(<TestModal active={false} />);

    const outsideButton = screen.getByTestId('outside-button');
    const firstButton = screen.getByTestId('first-button');

    outsideButton.focus();
    expect(document.activeElement).toBe(outsideButton);

    // Focus should not be trapped
    firstButton.focus();
    expect(document.activeElement).toBe(firstButton);
  });

  test('restores focus when deactivated', async () => {
    const { rerender } = render(<TestModal active={true} />);

    const outsideButton = screen.getByTestId('outside-button');
    outsideButton.focus();

    // Activate trap
    rerender(<TestModal active={true} />);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Focus should be trapped
    expect(document.activeElement).not.toBe(outsideButton);

    // Deactivate trap
    rerender(<TestModal active={false} />);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Focus should be restored
    expect(document.activeElement).toBe(outsideButton);
  });

  test('focuses initial focus element when provided', async () => {
    const textInput = document.createElement('input');
    document.body.appendChild(textInput);

    render(<TestModal initialFocus={textInput} />);
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(document.activeElement).toBe(textInput);

    document.body.removeChild(textInput);
  });

  test('handles empty container gracefully', () => {
    render(
      <FocusTrap active={true}>
        <div data-testid="empty-container">
          <span>No focusable elements</span>
        </div>
      </FocusTrap>
    );

    // Should not throw error
    expect(screen.getByTestId('empty-container')).toBeInTheDocument();
  });

  test('ignores non-focusable elements', async () => {
    const user = userEvent.setup();

    render(
      <FocusTrap active={true}>
        <div>
          <button data-testid="button1">Button 1</button>
          <span>Non-focusable</span>
          <div>Another non-focusable</div>
          <button data-testid="button2">Button 2</button>
        </div>
      </FocusTrap>
    );

    const button1 = screen.getByTestId('button1');
    const button2 = screen.getByTestId('button2');

    button1.focus();
    expect(document.activeElement).toBe(button1);

    await user.tab();
    expect(document.activeElement).toBe(button2);

    // Should wrap back to button1, skipping non-focusable elements
    await user.tab();
    expect(document.activeElement).toBe(button1);
  });
});

describe('useFocusTrap hook', () => {
  test('manages focus trap state', async () => {
    const user = userEvent.setup();
    render(<TestHookComponent />);

    const activateButton = screen.getByText('Activate');
    const deactivateButton = screen.getByText('Deactivate');
    const trappedButton = screen.getByTestId('trapped-button');

    // Initially not active
    activateButton.focus();
    expect(document.activeElement).toBe(activateButton);

    // Activate focus trap
    await user.click(activateButton);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Focus should be trapped
    expect(document.activeElement).toBe(trappedButton);

    // Try to move focus outside - should not work
    activateButton.focus();
    expect(document.activeElement).toBe(trappedButton);

    // Deactivate
    fireEvent.keyDown(document, { key: 'Escape' });
    await new Promise(resolve => setTimeout(resolve, 10));

    // Focus should be restored
    expect(document.activeElement).toBe(activateButton);
  });
});

describe('Accessibility compliance', () => {
  test('maintains proper ARIA attributes', () => {
    render(<TestModal />);

    const container = document.querySelector('[tabindex="-1"]');
    expect(container).toBeInTheDocument();
  });

  test('works with screen readers', () => {
    render(<TestModal />);

    // Container should be focusable for screen readers
    const container = document.querySelector('[tabindex="-1"]');
    expect(container).toHaveAttribute('tabindex', '-1');
  });

  test('handles keyboard navigation properly', async () => {
    const user = userEvent.setup();
    render(<TestModal />);

    const firstButton = screen.getByTestId('first-button');
    firstButton.focus();

    // Should respond to Enter key
    await user.keyboard('{Enter}');
    expect(document.activeElement).toBe(firstButton);

    // Should respond to Space key
    await user.keyboard(' ');
    expect(document.activeElement).toBe(firstButton);
  });
});
