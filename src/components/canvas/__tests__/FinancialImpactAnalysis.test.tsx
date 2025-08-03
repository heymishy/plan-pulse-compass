import { render, screen } from '@testing-library/react';
import FinancialImpactAnalysis from '../FinancialImpactAnalysis';
import { useApp } from '@/context/AppContext';

vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

describe('FinancialImpactAnalysis', () => {
  it('renders the component and calculates the financial impact', () => {
    (useApp as jest.Mock).mockReturnValue({
      people: [{ id: '1', name: 'John Doe', annualSalary: 120000 }],
      teams: [],
      allocations: [],
    });

    render(<FinancialImpactAnalysis />);
    expect(screen.getByText('Financial Impact Analysis')).toBeInTheDocument();
    expect(screen.getByText('$120,000')).toBeInTheDocument();
  });
});
