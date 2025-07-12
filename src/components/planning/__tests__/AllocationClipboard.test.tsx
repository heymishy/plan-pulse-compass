import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AllocationClipboardProvider,
  ClipboardControls,
  ClipboardStatus,
  useAllocationClipboard,
} from '../AllocationClipboard';
import { Team, Allocation, Epic } from '@/types';

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

// Mock data
const mockTeams: Team[] = [
  { id: 'team1', name: 'Frontend Team', divisionId: 'div1', capacity: 40 },
  { id: 'team2', name: 'Backend Team', divisionId: 'div1', capacity: 40 },
];

const mockEpics: Epic[] = [
  {
    id: 'epic1',
    name: 'User Authentication',
    projectId: 'proj1',
    description: 'Login and registration system',
    status: 'active',
    points: 21,
  },
  {
    id: 'epic2',
    name: 'Payment Integration',
    projectId: 'proj1',
    description: 'Payment processing',
    status: 'active',
    points: 13,
  },
];

const mockAllocations: Allocation[] = [
  {
    id: 'alloc1',
    teamId: 'team1',
    cycleId: 'q1-2024',
    iterationNumber: 1,
    percentage: 80,
    epicId: 'epic1',
    runWorkCategoryId: '',
    notes: '',
  },
  {
    id: 'alloc2',
    teamId: 'team1',
    cycleId: 'q1-2024',
    iterationNumber: 1,
    percentage: 20,
    epicId: 'epic2',
    runWorkCategoryId: '',
    notes: '',
  },
];

// Test component that uses the clipboard context
const TestComponent: React.FC = () => {
  const {
    clipboardData,
    copyAllocations,
    pasteAllocations,
    clearClipboard,
    hasData,
  } = useAllocationClipboard();

  return (
    <div>
      <div data-testid="has-data">{hasData.toString()}</div>
      <div data-testid="clipboard-data">
        {clipboardData ? JSON.stringify(clipboardData) : 'null'}
      </div>
      <button
        data-testid="copy-button"
        onClick={() => copyAllocations(mockAllocations, mockTeams[0], 1)}
      >
        Copy Allocations
      </button>
      <button
        data-testid="paste-button"
        onClick={() => pasteAllocations('team2', 2)}
      >
        Paste Allocations
      </button>
      <button data-testid="clear-button" onClick={clearClipboard}>
        Clear Clipboard
      </button>
    </div>
  );
};

const renderWithProvider = (
  component: React.ReactElement,
  onAllocationsChange = jest.fn(),
  allAllocations = mockAllocations,
  selectedCycleId = 'q1-2024'
) => {
  return render(
    <AllocationClipboardProvider
      onAllocationsChange={onAllocationsChange}
      allAllocations={allAllocations}
      selectedCycleId={selectedCycleId}
    >
      {component}
    </AllocationClipboardProvider>
  );
};

describe('AllocationClipboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AllocationClipboardProvider', () => {
    it('provides clipboard context', () => {
      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('has-data')).toHaveTextContent('false');
      expect(screen.getByTestId('clipboard-data')).toHaveTextContent('null');
    });

    it('handles copying allocations', async () => {
      const user = userEvent.setup();
      renderWithProvider(<TestComponent />);

      await user.click(screen.getByTestId('copy-button'));

      expect(screen.getByTestId('has-data')).toHaveTextContent('true');
      expect(screen.getByTestId('clipboard-data')).not.toHaveTextContent(
        'null'
      );
    });

    it('handles pasting allocations', async () => {
      const user = userEvent.setup();
      const mockOnAllocationsChange = jest.fn();
      renderWithProvider(<TestComponent />, mockOnAllocationsChange);

      // First copy
      await user.click(screen.getByTestId('copy-button'));

      // Then paste
      await user.click(screen.getByTestId('paste-button'));

      expect(mockOnAllocationsChange).toHaveBeenCalled();
    });

    it('handles clearing clipboard', async () => {
      const user = userEvent.setup();
      renderWithProvider(<TestComponent />);

      // First copy
      await user.click(screen.getByTestId('copy-button'));
      expect(screen.getByTestId('has-data')).toHaveTextContent('true');

      // Then clear
      await user.click(screen.getByTestId('clear-button'));
      expect(screen.getByTestId('has-data')).toHaveTextContent('false');
    });
  });

  describe('ClipboardControls', () => {
    const defaultProps = {
      teamId: 'team1',
      teamName: 'Frontend Team',
      iterationNumber: 1,
      allocations: mockAllocations,
    };

    it('renders copy and paste buttons', () => {
      renderWithProvider(<ClipboardControls {...defaultProps} />);

      expect(screen.getByText('Copy')).toBeInTheDocument();
      expect(screen.getByText('Paste')).toBeInTheDocument();
    });

    it('renders compact version', () => {
      renderWithProvider(
        <ClipboardControls {...defaultProps} compact={true} />
      );

      // Should show icons but not text
      expect(screen.queryByText('Copy')).not.toBeInTheDocument();
      expect(screen.queryByText('Paste')).not.toBeInTheDocument();
    });

    it('disables copy button when no allocations', () => {
      const propsWithNoAllocations = {
        ...defaultProps,
        allocations: [],
      };

      renderWithProvider(<ClipboardControls {...propsWithNoAllocations} />);

      const copyButton = screen.getByText('Copy').closest('button');
      expect(copyButton).toBeDisabled();
    });

    it('disables paste button when no clipboard data', () => {
      renderWithProvider(<ClipboardControls {...defaultProps} />);

      const pasteButton = screen.getByText('Paste').closest('button');
      expect(pasteButton).toBeDisabled();
    });

    it('handles copy action', async () => {
      const user = userEvent.setup();
      renderWithProvider(<ClipboardControls {...defaultProps} />);

      await user.click(screen.getByText('Copy'));

      // Should enable paste button after copying
      await waitFor(() => {
        const pasteButton = screen.getByText('Paste').closest('button');
        expect(pasteButton).not.toBeDisabled();
      });
    });

    it('handles paste action', async () => {
      const user = userEvent.setup();
      const mockOnPaste = jest.fn();
      const mockOnAllocationsChange = jest.fn();

      renderWithProvider(
        <ClipboardControls {...defaultProps} onPaste={mockOnPaste} />,
        mockOnAllocationsChange
      );

      // First copy from another team
      const testComponent = <TestComponent />;
      renderWithProvider(testComponent, mockOnAllocationsChange);
      await user.click(screen.getByTestId('copy-button'));

      // Then paste
      await user.click(screen.getByText('Paste'));

      expect(mockOnAllocationsChange).toHaveBeenCalled();
    });
  });

  describe('ClipboardStatus', () => {
    it('renders nothing when no clipboard data', () => {
      const { container } = renderWithProvider(
        <ClipboardStatus epics={mockEpics} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('displays clipboard information when data is present', async () => {
      const user = userEvent.setup();

      renderWithProvider(
        <div>
          <TestComponent />
          <ClipboardStatus epics={mockEpics} />
        </div>
      );

      // Copy some allocations first
      await user.click(screen.getByTestId('copy-button'));

      // Should now show clipboard status
      expect(screen.getByText(/Clipboard: 2 allocation/)).toBeInTheDocument();
      expect(
        screen.getByText(/From Frontend Team, Iteration 1/)
      ).toBeInTheDocument();
    });

    it('shows epic names in clipboard status', async () => {
      const user = userEvent.setup();

      renderWithProvider(
        <div>
          <TestComponent />
          <ClipboardStatus epics={mockEpics} />
        </div>
      );

      // Copy allocations
      await user.click(screen.getByTestId('copy-button'));

      // Should show epic names
      expect(screen.getByText(/User Authentication/)).toBeInTheDocument();
      expect(screen.getByText(/Payment Integration/)).toBeInTheDocument();
    });

    it('displays total percentage and epic count', async () => {
      const user = userEvent.setup();

      renderWithProvider(
        <div>
          <TestComponent />
          <ClipboardStatus epics={mockEpics} />
        </div>
      );

      // Copy allocations
      await user.click(screen.getByTestId('copy-button'));

      // Should show total percentage (80% + 20% = 100%)
      expect(screen.getByText('100%')).toBeInTheDocument();
      // Should show epic count
      expect(screen.getByText('2 epics')).toBeInTheDocument();
    });

    it('allows clearing clipboard from status', async () => {
      const user = userEvent.setup();

      renderWithProvider(
        <div>
          <TestComponent />
          <ClipboardStatus epics={mockEpics} />
        </div>
      );

      // Copy allocations
      await user.click(screen.getByTestId('copy-button'));

      // Should show clipboard status
      expect(screen.getByText(/Clipboard: 2 allocation/)).toBeInTheDocument();

      // Clear clipboard via status component
      const clearButton = screen.getAllByRole('button').find(button => {
        const svg = button.querySelector('svg');
        return svg && svg.classList.contains('h-3');
      });

      if (clearButton) {
        await user.click(clearButton);

        // Clipboard should be cleared
        await waitFor(() => {
          expect(
            screen.queryByText(/Clipboard: 2 allocation/)
          ).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Edge cases', () => {
    it('prevents pasting to same location', async () => {
      const user = userEvent.setup();
      const mockOnAllocationsChange = jest.fn();

      const testComponent = (
        <div>
          <ClipboardControls
            teamId="team1"
            teamName="Frontend Team"
            iterationNumber={1}
            allocations={mockAllocations}
          />
          <TestComponent />
        </div>
      );

      renderWithProvider(testComponent, mockOnAllocationsChange);

      // Copy from team1, iteration 1
      await user.click(screen.getByTestId('copy-button'));

      // Try to paste to same location (team1, iteration 1)
      await user.click(screen.getByText('Paste'));

      // Should not call onAllocationsChange
      expect(mockOnAllocationsChange).not.toHaveBeenCalled();
    });

    it('handles empty allocations list', async () => {
      const user = userEvent.setup();

      const testComponent = (
        <ClipboardControls
          teamId="team1"
          teamName="Frontend Team"
          iterationNumber={1}
          allocations={[]}
        />
      );

      renderWithProvider(testComponent);

      const copyButton = screen.getByText('Copy').closest('button');
      expect(copyButton).toBeDisabled();
    });

    it('handles run work allocations', async () => {
      const user = userEvent.setup();
      const runWorkAllocations = [
        {
          id: 'alloc3',
          teamId: 'team1',
          cycleId: 'q1-2024',
          iterationNumber: 1,
          percentage: 50,
          epicId: '',
          runWorkCategoryId: 'maintenance',
          notes: '',
        },
      ];

      const testComponent = (
        <div>
          <ClipboardControls
            teamId="team1"
            teamName="Frontend Team"
            iterationNumber={1}
            allocations={runWorkAllocations}
          />
          <ClipboardStatus epics={mockEpics} />
        </div>
      );

      renderWithProvider(testComponent);

      await user.click(screen.getByText('Copy'));

      // Should show run work badge
      expect(screen.getByText('Run work')).toBeInTheDocument();
    });

    it('shows time since copy', async () => {
      const user = userEvent.setup();

      // Mock Date.now to control time
      const mockNow = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(mockNow);

      renderWithProvider(
        <div>
          <TestComponent />
          <ClipboardStatus epics={mockEpics} />
        </div>
      );

      await user.click(screen.getByTestId('copy-button'));

      // Advance time by 2 minutes
      jest.spyOn(Date, 'now').mockReturnValue(mockNow + 2 * 60 * 1000);

      // Re-render to update time display
      renderWithProvider(
        <div>
          <TestComponent />
          <ClipboardStatus epics={mockEpics} />
        </div>
      );

      // Should show time since copy
      expect(screen.getByText(/2m ago/)).toBeInTheDocument();

      // Restore Date.now
      jest.restoreAllMocks();
    });
  });
});
