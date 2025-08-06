import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VisuallyHidden, useScreenReaderOnly } from '../VisuallyHidden';

describe('VisuallyHidden', () => {
  it('should render children with screen reader only classes', () => {
    render(
      <VisuallyHidden>
        <span>Hidden content</span>
      </VisuallyHidden>
    );

    const hiddenContent = screen.getByText('Hidden content');
    expect(hiddenContent.parentElement).toHaveClass('sr-only');
  });

  it('should apply custom className', () => {
    render(
      <VisuallyHidden className="custom-hidden">
        <span>Hidden content</span>
      </VisuallyHidden>
    );

    const hiddenContent = screen.getByText('Hidden content');
    expect(hiddenContent.parentElement).toHaveClass('sr-only', 'custom-hidden');
  });

  it('should clone element when asChild is true', () => {
    render(
      <VisuallyHidden asChild>
        <button className="original-class">Hidden button</button>
      </VisuallyHidden>
    );

    const hiddenButton = screen.getByText('Hidden button');
    expect(hiddenButton).toHaveClass('original-class', 'sr-only');
    expect(hiddenButton.tagName).toBe('BUTTON');
  });

  it('should render as span wrapper when asChild is false', () => {
    render(
      <VisuallyHidden>
        <button>Hidden button</button>
      </VisuallyHidden>
    );

    const button = screen.getByText('Hidden button');
    expect(button.tagName).toBe('BUTTON');
    expect(button.parentElement?.tagName).toBe('SPAN');
    expect(button.parentElement).toHaveClass('sr-only');
  });

  it('should handle text content', () => {
    render(
      <VisuallyHidden>
        This is hidden text
      </VisuallyHidden>
    );

    const hiddenText = screen.getByText('This is hidden text');
    expect(hiddenText.parentElement).toHaveClass('sr-only');
  });

  it('should apply all accessibility classes', () => {
    render(
      <VisuallyHidden>
        <span>Content</span>
      </VisuallyHidden>
    );

    const content = screen.getByText('Content');
    const wrapper = content.parentElement;
    
    expect(wrapper).toHaveClass(
      'absolute',
      'w-px',
      'h-px',
      'p-0',
      'm-[-1px]',
      'overflow-hidden',
      'border-0',
      'sr-only'
    );
  });
});

describe('useScreenReaderOnly', () => {
  function TestComponent({ show }: { show?: boolean }) {
    const className = useScreenReaderOnly(show);
    return <div className={className}>Test content</div>;
  }

  it('should return sr-only class when show is true', () => {
    render(<TestComponent show={true} />);
    
    const element = screen.getByText('Test content');
    expect(element).toHaveClass('sr-only');
  });

  it('should return empty string when show is false', () => {
    render(<TestComponent show={false} />);
    
    const element = screen.getByText('Test content');
    expect(element).not.toHaveClass('sr-only');
    expect(element.className).toBe('');
  });

  it('should default to true when no parameter provided', () => {
    render(<TestComponent />);
    
    const element = screen.getByText('Test content');
    expect(element).toHaveClass('sr-only');
  });
});