import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@/test/utils/test-utils';
import DashboardHeader from '../DashboardHeader';

describe('DashboardHeader', () => {
  it('renders without crashing', () => {
    render(<DashboardHeader />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('displays the correct heading', () => {
    render(<DashboardHeader />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Dashboard');
  });

  it('has proper accessibility attributes', () => {
    render(<DashboardHeader />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveAttribute(
      'class',
      'text-3xl font-bold text-gray-900 mb-2'
    );
  });
});
