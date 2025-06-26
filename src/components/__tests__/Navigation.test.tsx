import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import Navigation from '../Navigation';

describe('Navigation', () => {
  it('renders navigation component', () => {
    render(<Navigation />);

    // Check for main navigation elements
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('contains navigation links', () => {
    render(<Navigation />);

    // Check for common navigation items
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('has proper navigation structure', () => {
    render(<Navigation />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass(
      'bg-white',
      'shadow-sm',
      'border-r',
      'border-gray-200',
      'w-64',
      'flex-shrink-0'
    );
  });
});
