import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from '../Footer';

describe('Footer', () => {
  it('renders without crashing', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('displays version information', () => {
    render(<Footer />);

    // Check for version-related text - the footer shows "v0.0.22"
    expect(screen.getAllByText(/v\d+\.\d+\.\d+/).length).toBeGreaterThan(0);
  });

  it('has proper semantic structure', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });
});
