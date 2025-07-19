import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from '../Footer';

describe('Footer', () => {
  it('renders without crashing', () => {
    render(<Footer />);
    // Use getAllByRole to handle multiple footer elements
    const footers = screen.getAllByRole('contentinfo');
    expect(footers.length).toBeGreaterThan(0);
  });

  it('displays version information', () => {
    render(<Footer />);

    // Check for version-related text - the footer shows "v0.0.22"
    expect(screen.getAllByText(/v\d+\.\d+\.\d+/).length).toBeGreaterThan(0);
  });

  it('has proper semantic structure', () => {
    render(<Footer />);

    // Use getAllByRole to get all footer elements and verify at least one exists
    const footers = screen.getAllByRole('contentinfo');
    expect(footers.length).toBeGreaterThan(0);
  });
});
