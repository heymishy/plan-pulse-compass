import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DashboardHeader from '../DashboardHeader';

describe('DashboardHeader', () => {
  it('renders without crashing', () => {
    render(<DashboardHeader />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('displays the correct heading', () => {
    render(<DashboardHeader />);

    const heading = screen.getByRole('heading', { name: 'Dashboard' });
    expect(heading).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<DashboardHeader />);

    const heading = screen.getByRole('heading', { name: 'Dashboard' });
    expect(heading).toBeInTheDocument();
  });
});
