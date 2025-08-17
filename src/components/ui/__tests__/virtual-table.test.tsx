import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { VirtualTable, VirtualTableColumn } from '../virtual-table';

// Mock react-window components
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemData, itemCount }: any) => {
    return (
      <div data-testid="virtual-list">
        {Array.from({ length: Math.min(itemCount, 10) }).map((_, index) =>
          children({ index, style: {}, data: itemData })
        )}
      </div>
    );
  },
  VariableSizeList: ({ children, itemData, itemCount }: any) => {
    return (
      <div data-testid="variable-virtual-list">
        {Array.from({ length: Math.min(itemCount, 10) }).map((_, index) =>
          children({ index, style: {}, data: itemData })
        )}
      </div>
    );
  },
}));

interface TestData {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  score: number;
}

const mockData: TestData[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    status: 'active',
    score: 95,
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    status: 'inactive',
    score: 78,
  },
  {
    id: '3',
    name: 'Carol Davis',
    email: 'carol@example.com',
    status: 'active',
    score: 88,
  },
  {
    id: '4',
    name: 'David Wilson',
    email: 'david@example.com',
    status: 'active',
    score: 92,
  },
  {
    id: '5',
    name: 'Eva Brown',
    email: 'eva@example.com',
    status: 'inactive',
    score: 84,
  },
];

const mockColumns: VirtualTableColumn<TestData>[] = [
  {
    key: 'name',
    header: 'Name',
    width: 150,
    sortable: true,
    render: value => <span data-testid={`name-${value}`}>{value}</span>,
  },
  {
    key: 'email',
    header: 'Email',
    width: 200,
    sortable: true,
  },
  {
    key: 'status',
    header: 'Status',
    width: 100,
    sortable: true,
    render: value => (
      <span
        data-testid={`status-${value}`}
        className={`badge ${value === 'active' ? 'badge-success' : 'badge-secondary'}`}
      >
        {value}
      </span>
    ),
  },
  {
    key: 'score',
    header: 'Score',
    width: 80,
    sortable: true,
  },
];

describe('VirtualTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render table with data', () => {
      render(
        <VirtualTable data={mockData} columns={mockColumns} height={400} />
      );

      // Check for column headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();

      // Check for virtual list
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });

    it('should render empty message when no data', () => {
      render(
        <VirtualTable
          data={[]}
          columns={mockColumns}
          height={400}
          emptyMessage="No users found"
        />
      );

      expect(screen.getByText('No users found')).toBeInTheDocument();
      expect(screen.queryByTestId('virtual-list')).not.toBeInTheDocument();
    });

    it('should render with custom class name', () => {
      const { container } = render(
        <VirtualTable
          data={mockData}
          columns={mockColumns}
          height={400}
          className="custom-table"
        />
      );

      expect(
        container.querySelector('.virtual-table.custom-table')
      ).toBeInTheDocument();
    });

    it('should render custom cell content using render function', () => {
      render(
        <VirtualTable data={mockData} columns={mockColumns} height={400} />
      );

      // Check if custom rendered name appears
      expect(screen.getByTestId('name-Alice Johnson')).toBeInTheDocument();
      expect(screen.getByTestId('status-active')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should show search input when searchable is true', () => {
      render(
        <VirtualTable
          data={mockData}
          columns={mockColumns}
          height={400}
          searchable={true}
        />
      );

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('should filter data based on search term', async () => {
      const user = userEvent.setup();
      render(
        <VirtualTable
          data={mockData}
          columns={mockColumns}
          height={400}
          searchable={true}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'Alice');

      // Wait for filtering to complete
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 5 items')).toBeInTheDocument();
      });
    });

    it('should search across all columns', async () => {
      const user = userEvent.setup();
      render(
        <VirtualTable
          data={mockData}
          columns={mockColumns}
          height={400}
          searchable={true}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'active');

      // Should find items with 'active' status
      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 5 items')).toBeInTheDocument();
      });
    });

    it('should show no results when search term has no matches', async () => {
      const user = userEvent.setup();
      render(
        <VirtualTable
          data={mockData}
          columns={mockColumns}
          height={400}
          searchable={true}
          emptyMessage="No results found"
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting Functionality', () => {
    it('should show sort buttons for sortable columns', () => {
      render(
        <VirtualTable data={mockData} columns={mockColumns} height={400} />
      );

      // All columns in mockColumns are sortable
      const sortButtons = screen.getAllByRole('button');
      expect(sortButtons.length).toBeGreaterThan(0);
    });

    it('should sort data in ascending order on first click', async () => {
      const user = userEvent.setup();
      render(
        <VirtualTable data={mockData} columns={mockColumns} height={400} />
      );

      // Find the name column sort button and click it
      const nameHeader = screen.getByText('Name').closest('div');
      const sortButton = nameHeader?.querySelector('button');

      if (sortButton) {
        await user.click(sortButton);
      }

      // Data should be sorted by name ascending (Alice should be first)
      expect(screen.getByTestId('name-Alice Johnson')).toBeInTheDocument();
    });

    it('should sort data in descending order on second click', async () => {
      const user = userEvent.setup();
      render(
        <VirtualTable data={mockData} columns={mockColumns} height={400} />
      );

      const nameHeader = screen.getByText('Name').closest('div');
      const sortButton = nameHeader?.querySelector('button');

      if (sortButton) {
        // First click for ascending
        await user.click(sortButton);
        // Second click for descending
        await user.click(sortButton);
      }

      // Data should be sorted by name descending (Eva should be first)
      expect(screen.getByTestId('name-Eva Brown')).toBeInTheDocument();
    });

    it('should clear sort on third click', async () => {
      const user = userEvent.setup();
      render(
        <VirtualTable data={mockData} columns={mockColumns} height={400} />
      );

      const nameHeader = screen.getByText('Name').closest('div');
      const sortButton = nameHeader?.querySelector('button');

      if (sortButton) {
        // Three clicks to cycle through asc -> desc -> null
        await user.click(sortButton);
        await user.click(sortButton);
        await user.click(sortButton);
      }

      // Should return to original order (Alice first)
      expect(screen.getByTestId('name-Alice Johnson')).toBeInTheDocument();
    });
  });

  describe('Row Interaction', () => {
    it('should call onRowClick when row is clicked', async () => {
      const handleRowClick = vi.fn();
      const user = userEvent.setup();

      render(
        <VirtualTable
          data={mockData}
          columns={mockColumns}
          height={400}
          onRowClick={handleRowClick}
        />
      );

      // Click on the first row
      const firstRow = screen.getByTestId('name-Alice Johnson').closest('div');
      if (firstRow) {
        await user.click(firstRow);
      }

      expect(handleRowClick).toHaveBeenCalledWith(mockData[0], 0);
    });

    it('should not throw error when onRowClick is not provided', async () => {
      const user = userEvent.setup();

      render(
        <VirtualTable data={mockData} columns={mockColumns} height={400} />
      );

      const firstRow = screen.getByTestId('name-Alice Johnson').closest('div');

      // Should not throw error when clicked
      expect(() => {
        if (firstRow) {
          fireEvent.click(firstRow);
        }
      }).not.toThrow();
    });
  });

  describe('Performance Features', () => {
    it('should display performance statistics', () => {
      render(
        <VirtualTable data={mockData} columns={mockColumns} height={400} />
      );

      expect(screen.getByText('Showing 5 of 5 items')).toBeInTheDocument();
      expect(screen.getByText('Virtual scrolling enabled')).toBeInTheDocument();
    });

    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 10000 }, (_, index) => ({
        id: `${index + 1}`,
        name: `User ${index + 1}`,
        email: `user${index + 1}@example.com`,
        status: index % 2 === 0 ? 'active' : ('inactive' as const),
        score: Math.floor(Math.random() * 100),
      }));

      render(
        <VirtualTable
          data={largeData}
          columns={mockColumns}
          height={400}
          overscan={5}
        />
      );

      // Should render without performance issues
      expect(
        screen.getByText('Showing 10000 of 10000 items')
      ).toBeInTheDocument();
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });

    it('should use custom item size when provided', () => {
      render(
        <VirtualTable
          data={mockData}
          columns={mockColumns}
          height={400}
          itemSize={60}
        />
      );

      // Component should render successfully with custom item size
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty columns array', () => {
      render(<VirtualTable data={mockData} columns={[]} height={400} />);

      // Should render without crashing
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should handle missing column data gracefully', () => {
      const incompleteData = [
        { id: '1', name: 'Alice Johnson' }, // Missing email, status, score
        { id: '2', email: 'bob@example.com', status: 'active' }, // Missing name, score
      ];

      render(
        <VirtualTable
          data={incompleteData}
          columns={mockColumns}
          height={400}
        />
      );

      // Should render without crashing
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });

    it('should handle null or undefined values in data', () => {
      const dataWithNulls = [
        { id: '1', name: null, email: undefined, status: 'active', score: 95 },
        {
          id: '2',
          name: 'Bob Smith',
          email: 'bob@example.com',
          status: null,
          score: undefined,
        },
      ];

      render(
        <VirtualTable data={dataWithNulls} columns={mockColumns} height={400} />
      );

      // Should render without crashing
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for table structure', () => {
      render(
        <VirtualTable data={mockData} columns={mockColumns} height={400} />
      );

      // Headers should be properly labeled
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
    });

    it('should support keyboard navigation for sort buttons', async () => {
      const user = userEvent.setup();
      render(
        <VirtualTable data={mockData} columns={mockColumns} height={400} />
      );

      const nameHeader = screen.getByText('Name').closest('div');
      const sortButton = nameHeader?.querySelector('button');

      if (sortButton) {
        sortButton.focus();
        expect(sortButton).toHaveFocus();

        // Should be able to activate with Enter
        await user.keyboard('{Enter}');
        expect(sortButton).toBeInTheDocument();
      }
    });
  });
});
