import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FocusTrap, useFocusTrap } from '../FocusTrap';

// Mock the accessibility context
const mockSaveFocus = vi.fn();
const mockRestoreFocus = vi.fn();
const mockTrapFocus = vi.fn(() => vi.fn()); // Return cleanup function
const mockReleaseFocusTrap = vi.fn();

vi.mock('../AccessibilityProvider', () => ({
  useAccessibility: vi.fn(() => ({
    focus: {
      saveFocus: mockSaveFocus,
      restoreFocus: mockRestoreFocus,
      trapFocus: mockTrapFocus,
      releaseFocusTrap: mockReleaseFocusTrap
    }
  }))
}));

describe('FocusTrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children', () => {
    render(
      <FocusTrap>
        <button>Test Button</button>
        <input placeholder="Test Input" />
      </FocusTrap>
    );

    expect(screen.getByText('Test Button')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Test Input')).toBeInTheDocument();
  });

  it('should set up focus trap when active', () => {
    render(
      <FocusTrap active={true}>
        <button>Button 1</button>
        <button>Button 2</button>
      </FocusTrap>
    );

    expect(mockSaveFocus).toHaveBeenCalled();
    expect(mockTrapFocus).toHaveBeenCalled();
  });

  it('should not set up focus trap when inactive', () => {
    render(
      <FocusTrap active={false}>
        <button>Button 1</button>
        <button>Button 2</button>
      </FocusTrap>
    );

    expect(mockSaveFocus).not.toHaveBeenCalled();
    expect(mockTrapFocus).not.toHaveBeenCalled();
  });

  it('should restore focus on unmount when restoreFocus is true', () => {
    const { unmount } = render(
      <FocusTrap active={true} restoreFocus={true}>
        <button>Test Button</button>
      </FocusTrap>
    );

    unmount();

    expect(mockRestoreFocus).toHaveBeenCalled();
    expect(mockReleaseFocusTrap).toHaveBeenCalled();
  });

  it('should not restore focus on unmount when restoreFocus is false', () => {
    const { unmount } = render(
      <FocusTrap active={true} restoreFocus={false}>
        <button>Test Button</button>
      </FocusTrap>
    );

    unmount();

    expect(mockRestoreFocus).not.toHaveBeenCalled();
    expect(mockReleaseFocusTrap).toHaveBeenCalled();
  });

  it('should focus first focusable element when trap is activated', () => {
    const mockFocus = vi.fn();
    
    // Mock querySelector to return a focusable element
    const mockButton = { focus: mockFocus };
    const originalQuerySelectorAll = Element.prototype.querySelectorAll;
    Element.prototype.querySelectorAll = vi.fn(() => [mockButton] as any);

    render(
      <FocusTrap active={true}>
        <button>Test Button</button>
      </FocusTrap>
    );

    expect(mockFocus).toHaveBeenCalled();

    // Restore original method
    Element.prototype.querySelectorAll = originalQuerySelectorAll;
  });

  it('should apply custom className', () => {
    const { container } = render(
      <FocusTrap className="custom-trap">
        <button>Test Button</button>
      </FocusTrap>
    );

    expect(container.firstChild).toHaveClass('custom-trap');
  });

  it('should have tabIndex -1 on container', () => {
    const { container } = render(
      <FocusTrap>
        <button>Test Button</button>
      </FocusTrap>
    );

    expect(container.firstChild).toHaveAttribute('tabindex', '-1');
  });
});

describe('useFocusTrap', () => {
  function TestUseFocusTrap() {
    const { containerRef, enableTrap, disableTrap } = useFocusTrap();

    return (
      <div>
        <div ref={containerRef as React.RefObject<HTMLDivElement>} data-testid="container">
          <button>Trapped Button</button>
        </div>
        <button onClick={() => enableTrap()}>Enable Trap</button>
        <button onClick={disableTrap}>Disable Trap</button>
      </div>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide containerRef', () => {
    render(<TestUseFocusTrap />);

    expect(screen.getByTestId('container')).toBeInTheDocument();
  });

  it('should enable focus trap when enableTrap is called', () => {
    render(<TestUseFocusTrap />);

    fireEvent.click(screen.getByText('Enable Trap'));

    expect(mockSaveFocus).toHaveBeenCalled();
    expect(mockTrapFocus).toHaveBeenCalled();
  });

  it('should disable focus trap when disableTrap is called', () => {
    render(<TestUseFocusTrap />);

    fireEvent.click(screen.getByText('Disable Trap'));

    expect(mockReleaseFocusTrap).toHaveBeenCalled();
    expect(mockRestoreFocus).toHaveBeenCalled();
  });

  it('should handle enableTrap with custom container', () => {
    function TestWithCustomContainer() {
      const { enableTrap, disableTrap } = useFocusTrap();
      const customContainer = React.useRef<HTMLDivElement>(null);

      return (
        <div>
          <div ref={customContainer} data-testid="custom-container">
            <button>Custom Trapped Button</button>
          </div>
          <button onClick={() => enableTrap(customContainer.current!)}>
            Enable Custom Trap
          </button>
          <button onClick={disableTrap}>Disable Trap</button>
        </div>
      );
    }

    render(<TestWithCustomContainer />);

    fireEvent.click(screen.getByText('Enable Custom Trap'));

    expect(mockSaveFocus).toHaveBeenCalled();
    expect(mockTrapFocus).toHaveBeenCalled();
  });
});