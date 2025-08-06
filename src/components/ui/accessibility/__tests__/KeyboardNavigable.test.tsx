import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { KeyboardNavigable, useSimpleKeyboardNav, KeyboardNavigableRef } from '../KeyboardNavigable';

describe('KeyboardNavigable', () => {
  const mockItems = ['Item 1', 'Item 2', 'Item 3'];
  const mockOnSelect = vi.fn();
  const mockOnEscape = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render items with keyboard navigation', () => {
    render(
      <KeyboardNavigable
        items={mockItems}
        onSelect={mockOnSelect}
        onEscape={mockOnEscape}
      >
        {(item, index, isFocused) => (
          <div key={index} className={isFocused ? 'focused' : ''}>
            {item}
          </div>
        )}
      </KeyboardNavigable>
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(
      <KeyboardNavigable
        items={mockItems}
        ariaLabel="Test Navigation"
        ariaDescription="Navigate with arrow keys"
      >
        {(item) => <div>{item}</div>}
      </KeyboardNavigable>
    );

    const container = screen.getByLabelText('Test Navigation');
    expect(container).toHaveAttribute('role', 'listbox');
    expect(container).toHaveAttribute('tabindex', '0');
    expect(container).toHaveAttribute('aria-orientation', 'vertical');
    expect(container).toHaveAttribute('aria-describedby', 'Test Navigation-description');

    expect(screen.getByText('Navigate with arrow keys')).toHaveClass('sr-only');
  });

  it('should handle arrow down navigation', () => {
    render(
      <KeyboardNavigable items={mockItems}>
        {(item, index, isFocused) => (
          <div className={isFocused ? 'focused' : ''}>{item}</div>
        )}
      </KeyboardNavigable>
    );

    const container = screen.getByRole('listbox');
    
    fireEvent.keyDown(container, { key: 'ArrowDown' });
    
    expect(screen.getByText('Item 1')).toHaveClass('focused');
  });

  it('should handle arrow up navigation', () => {
    render(
      <KeyboardNavigable items={mockItems}>
        {(item, index, isFocused) => (
          <div className={isFocused ? 'focused' : ''}>{item}</div>
        )}
      </KeyboardNavigable>
    );

    const container = screen.getByRole('listbox');
    
    fireEvent.keyDown(container, { key: 'ArrowUp' });
    
    // Should wrap to last item
    expect(screen.getByText('Item 3')).toHaveClass('focused');
  });

  it('should handle Home and End keys', () => {
    render(
      <KeyboardNavigable items={mockItems}>
        {(item, index, isFocused) => (
          <div className={isFocused ? 'focused' : ''}>{item}</div>
        )}
      </KeyboardNavigable>
    );

    const container = screen.getByRole('listbox');
    
    fireEvent.keyDown(container, { key: 'Home' });
    expect(screen.getByText('Item 1')).toHaveClass('focused');
    
    fireEvent.keyDown(container, { key: 'End' });
    expect(screen.getByText('Item 3')).toHaveClass('focused');
  });

  it('should call onSelect when Enter is pressed', () => {
    render(
      <KeyboardNavigable items={mockItems} onSelect={mockOnSelect}>
        {(item, index, isFocused) => (
          <div className={isFocused ? 'focused' : ''}>{item}</div>
        )}
      </KeyboardNavigable>
    );

    const container = screen.getByRole('listbox');
    
    // Navigate to first item
    fireEvent.keyDown(container, { key: 'ArrowDown' });
    // Select it
    fireEvent.keyDown(container, { key: 'Enter' });
    
    expect(mockOnSelect).toHaveBeenCalledWith('Item 1', 0);
  });

  it('should call onSelect when Space is pressed', () => {
    render(
      <KeyboardNavigable items={mockItems} onSelect={mockOnSelect}>
        {(item, index, isFocused) => (
          <div className={isFocused ? 'focused' : ''}>{item}</div>
        )}
      </KeyboardNavigable>
    );

    const container = screen.getByRole('listbox');
    
    // Navigate to second item
    fireEvent.keyDown(container, { key: 'ArrowDown' });
    fireEvent.keyDown(container, { key: 'ArrowDown' });
    // Select it
    fireEvent.keyDown(container, { key: ' ' });
    
    expect(mockOnSelect).toHaveBeenCalledWith('Item 2', 1);
  });

  it('should call onEscape when Escape is pressed', () => {
    render(
      <KeyboardNavigable items={mockItems} onEscape={mockOnEscape}>
        {(item) => <div>{item}</div>}
      </KeyboardNavigable>
    );

    const container = screen.getByRole('listbox');
    
    fireEvent.keyDown(container, { key: 'Escape' });
    
    expect(mockOnEscape).toHaveBeenCalled();
  });

  it('should support horizontal orientation', () => {
    render(
      <KeyboardNavigable items={mockItems} orientation="horizontal">
        {(item) => <div>{item}</div>}
      </KeyboardNavigable>
    );

    const container = screen.getByRole('listbox');
    expect(container).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('should support custom role', () => {
    render(
      <KeyboardNavigable items={mockItems} role="menu">
        {(item) => <div>{item}</div>}
      </KeyboardNavigable>
    );

    const container = screen.getByRole('menu');
    expect(container).toBeInTheDocument();
  });

  it('should provide ref methods', () => {
    const ref = React.createRef<KeyboardNavigableRef>();
    
    render(
      <KeyboardNavigable ref={ref} items={mockItems}>
        {(item) => <div>{item}</div>}
      </KeyboardNavigable>
    );

    expect(ref.current).toBeDefined();
    expect(typeof ref.current?.focus).toBe('function');
    expect(typeof ref.current?.resetFocus).toBe('function');
    expect(typeof ref.current?.setFocusedIndex).toBe('function');
  });

  it('should render option elements with proper ARIA attributes', () => {
    render(
      <KeyboardNavigable items={mockItems}>
        {(item, index, isFocused) => (
          <div className={isFocused ? 'focused' : ''}>{item}</div>
        )}
      </KeyboardNavigable>
    );

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    
    options.forEach((option, index) => {
      expect(option).toHaveAttribute('aria-selected', 'false');
    });
  });

  it('should update aria-selected when item is focused', () => {
    render(
      <KeyboardNavigable items={mockItems}>
        {(item, index, isFocused) => (
          <div className={isFocused ? 'focused' : ''}>{item}</div>
        )}
      </KeyboardNavigable>
    );

    const container = screen.getByRole('listbox');
    const options = screen.getAllByRole('option');
    
    fireEvent.keyDown(container, { key: 'ArrowDown' });
    
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
    expect(options[2]).toHaveAttribute('aria-selected', 'false');
  });
});

describe('useSimpleKeyboardNav', () => {
  function TestUseSimpleKeyboardNav({ itemCount }: { itemCount: number }) {
    const { focusedIndex, setFocusedIndex, handleKeyDown } = useSimpleKeyboardNav(
      itemCount,
      (index) => console.log('Selected:', index)
    );

    return (
      <div onKeyDown={handleKeyDown} tabIndex={0}>
        <div data-testid="focused-index">{focusedIndex}</div>
        <button onClick={() => setFocusedIndex(1)}>Set Focus to 1</button>
        {Array.from({ length: itemCount }, (_, i) => (
          <div key={i} className={focusedIndex === i ? 'focused' : ''}>
            Item {i}
          </div>
        ))}
      </div>
    );
  }

  it('should initialize with focused index -1', () => {
    render(<TestUseSimpleKeyboardNav itemCount={3} />);
    
    expect(screen.getByTestId('focused-index')).toHaveTextContent('-1');
  });

  it('should handle arrow down navigation', () => {
    render(<TestUseSimpleKeyboardNav itemCount={3} />);
    
    const container = screen.getByRole('generic');
    
    fireEvent.keyDown(container, { key: 'ArrowDown' });
    expect(screen.getByTestId('focused-index')).toHaveTextContent('0');
    
    fireEvent.keyDown(container, { key: 'ArrowDown' });
    expect(screen.getByTestId('focused-index')).toHaveTextContent('1');
  });

  it('should handle arrow up navigation', () => {
    render(<TestUseSimpleKeyboardNav itemCount={3} />);
    
    const container = screen.getByRole('generic');
    
    fireEvent.keyDown(container, { key: 'ArrowUp' });
    expect(screen.getByTestId('focused-index')).toHaveTextContent('2'); // Wraps to last
  });

  it('should handle Home and End keys', () => {
    render(<TestUseSimpleKeyboardNav itemCount={3} />);
    
    const container = screen.getByRole('generic');
    
    fireEvent.keyDown(container, { key: 'Home' });
    expect(screen.getByTestId('focused-index')).toHaveTextContent('0');
    
    fireEvent.keyDown(container, { key: 'End' });
    expect(screen.getByTestId('focused-index')).toHaveTextContent('2');
  });

  it('should allow manual focus setting', () => {
    render(<TestUseSimpleKeyboardNav itemCount={3} />);
    
    fireEvent.click(screen.getByText('Set Focus to 1'));
    expect(screen.getByTestId('focused-index')).toHaveTextContent('1');
  });

  it('should handle Escape key', () => {
    render(<TestUseSimpleKeyboardNav itemCount={3} />);
    
    const container = screen.getByRole('generic');
    
    // Set focus first
    fireEvent.keyDown(container, { key: 'ArrowDown' });
    expect(screen.getByTestId('focused-index')).toHaveTextContent('0');
    
    // Escape should reset
    fireEvent.keyDown(container, { key: 'Escape' });
    expect(screen.getByTestId('focused-index')).toHaveTextContent('-1');
  });
});