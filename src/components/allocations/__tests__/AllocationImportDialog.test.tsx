import React from 'react';
import { screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
} from 'vitest';
import AllocationImportDialog from '../AllocationImportDialog';
import { render } from '@/test/utils/test-utils';
import * as allocationImportUtils from '@/utils/allocationImportUtils';
import { useApp } from '@/context/AppContext';

// Mock the utils module with enhanced cleanup
vi.mock('@/utils/allocationImportUtils', () => ({
  parseAllocationCSV: vi.fn(),
  validateAllocationImport: vi.fn(),
  convertImportToAllocations: vi.fn(),
  downloadAllocationSampleCSV: vi.fn(),
}));

// Mock the context with enhanced cleanup
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

const mockOnImportComplete = vi.fn();

const mockAllocationData = [
  {
    teamName: 'Team A',
    epicName: 'Epic 1',
    epicType: 'Project Epic',
    sprintNumber: '1',
    percentage: 50,
    quarter: 'Q1 2024',
  },
];

const mockValidationResult = {
  valid: mockAllocationData,
  errors: [],
};

const mockTeams = [{ id: '1', name: 'Team A', divisionId: '1', capacity: 100 }];

const mockEpics = [
  {
    id: '1',
    name: 'Epic 1',
    projectId: '1',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
  },
];

const mockRunWorkCategories = [
  { id: '1', name: 'Development', color: '#3b82f6' },
];

const mockCycles = [
  { id: '1', name: 'Q1 2024', startDate: '2024-01-01', endDate: '2024-03-31' },
];

const mockAllocations = [
  {
    id: '1',
    teamId: '1',
    epicId: '1',
    runWorkCategoryId: '1',
    cycleId: '1',
    allocation: 50,
  },
];

describe('AllocationImportDialog', () => {
  const mockAppData = {
    teams: mockTeams,
    epics: mockEpics,
    runWorkCategories: mockRunWorkCategories,
    cycles: mockCycles,
    allocations: [],
    isSetupComplete: true,
    isDataLoading: false,
    setAllocations: vi.fn(),
  };

  // Enhanced setup/teardown for better isolation
  beforeAll(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useApp).mockReturnValue(mockAppData);
    vi.mocked(allocationImportUtils.parseAllocationCSV).mockReturnValue(
      mockAllocationData
    );
    vi.mocked(allocationImportUtils.validateAllocationImport).mockReturnValue(
      mockValidationResult
    );
    vi.mocked(allocationImportUtils.convertImportToAllocations).mockReturnValue(
      mockAllocations
    );
  });

  afterEach(() => {
    // Clear mocks and timers, but don't let global setup clear DOM between tests in same file
    vi.clearAllMocks();
    vi.clearAllTimers();
    // Only cleanup React components, not the entire DOM
    // cleanup(); // This is handled by global setup
  });

  afterAll(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  const renderComponent = () => {
    return render(
      <AllocationImportDialog onImportComplete={mockOnImportComplete} />
    );
  };

  it('renders trigger button', () => {
    renderComponent();
    expect(screen.getByText('Import Allocations')).toBeInTheDocument();
  });

  it('opens dialog when trigger button is clicked', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      expect(screen.getByText('Import Team Allocations')).toBeInTheDocument();
    });
  });

  it('displays file upload input', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
      expect(
        screen.getByText(/Import team allocations for the quarter/)
      ).toBeInTheDocument();
    });
  });

  it('displays sample download button', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      expect(screen.getByText('Sample CSV')).toBeInTheDocument();
    });
  });

  it('handles file upload and parsing', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      const fileInput = screen.getByDisplayValue('');

      const file = new File(
        [
          'teamName,epicName,epicType,sprintNumber,percentage,quarter\nTeam A,Epic 1,Project Epic,1,50,Q1 2024',
        ],
        'test.csv',
        {
          type: 'text/csv',
        }
      );

      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(allocationImportUtils.parseAllocationCSV).toHaveBeenCalled();
      expect(allocationImportUtils.validateAllocationImport).toHaveBeenCalled();
    });
  });

  it('displays validation errors', async () => {
    const errorResult = {
      valid: [],
      errors: ['Invalid team name: Team X'],
    };

    vi.mocked(allocationImportUtils.validateAllocationImport).mockReturnValue(
      errorResult
    );

    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      const fileInput = screen.getByDisplayValue('');

      const file = new File(
        [
          'teamName,epicName,epicType,sprintNumber,percentage,quarter\nTeam X,Epic 1,Project Epic,1,50,Q1 2024',
        ],
        'test.csv',
        {
          type: 'text/csv',
        }
      );

      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid team name: Team X')).toBeInTheDocument();
    });
  });

  it('displays preview table with valid data', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      const fileInput = screen.getByDisplayValue('');

      const file = new File(
        [
          'teamName,epicName,epicType,sprintNumber,percentage,quarter\nTeam A,Epic 1,Project Epic,1,50,Q1 2024',
        ],
        'test.csv',
        {
          type: 'text/csv',
        }
      );

      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText('Data Preview (1 records)')).toBeInTheDocument();
      expect(screen.getByText('Team A')).toBeInTheDocument();
      expect(screen.getByText('Epic 1')).toBeInTheDocument();
      expect(screen.getByText('Project Epic')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Q1 2024')).toBeInTheDocument();
    });
  });

  it('enables import button when valid data is present', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      const fileInput = screen.getByDisplayValue('');

      const file = new File(
        [
          'teamName,epicName,epicType,sprintNumber,percentage,quarter\nTeam A,Epic 1,Project Epic,1,50,Q1 2024',
        ],
        'test.csv',
        {
          type: 'text/csv',
        }
      );

      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      const importButton = screen.getByText('Import 1 Records');
      expect(importButton).not.toBeDisabled();
    });
  });

  it('disables import button when no valid data', async () => {
    const errorResult = {
      valid: [],
      errors: ['Invalid data'],
    };

    vi.mocked(allocationImportUtils.validateAllocationImport).mockReturnValue(
      errorResult
    );

    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      const fileInput = screen.getByDisplayValue('');

      const file = new File(
        [
          'teamName,epicName,epicType,sprintNumber,percentage,quarter\nInvalid,Data,Here,1,50,Q1 2024',
        ],
        'test.csv',
        {
          type: 'text/csv',
        }
      );

      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      const importButton = screen.getByText('Import 0 Records');
      expect(importButton).toBeDisabled();
    });
  });

  it('handles successful import', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      const fileInput = screen.getByDisplayValue('');

      const file = new File(
        [
          'teamName,epicName,epicType,sprintNumber,percentage,quarter\nTeam A,Epic 1,Project Epic,1,50,Q1 2024',
        ],
        'test.csv',
        {
          type: 'text/csv',
        }
      );

      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      const importButton = screen.getByText('Import 1 Records');
      fireEvent.click(importButton);
    });

    await waitFor(() => {
      expect(
        allocationImportUtils.convertImportToAllocations
      ).toHaveBeenCalledWith(
        mockAllocationData,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );
      expect(mockOnImportComplete).toHaveBeenCalled();
    });
  });

  it('handles download sample CSV', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      const downloadButton = screen.getByText('Sample CSV');
      fireEvent.click(downloadButton);
    });

    expect(
      allocationImportUtils.downloadAllocationSampleCSV
    ).toHaveBeenCalled();
  });

  it('handles file parsing errors', async () => {
    vi.mocked(allocationImportUtils.parseAllocationCSV).mockImplementation(
      () => {
        throw new Error('Parse error');
      }
    );

    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      const fileInput = screen.getByDisplayValue('');

      const file = new File(['invalid,csv,data'], 'test.csv', {
        type: 'text/csv',
      });

      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(
        screen.getByText('Failed to parse CSV file. Please check the format.')
      ).toBeInTheDocument();
    });
  });

  it.skip('displays processing state during import', async () => {
    // Create a promise that we can control manually
    let resolveImport: (value: any) => void;
    const importPromise = new Promise(resolve => {
      resolveImport = resolve;
    });

    // Mock a controlled import to catch the processing state
    vi.mocked(allocationImportUtils.convertImportToAllocations).mockReturnValue(
      importPromise as Promise<any>
    );

    renderComponent();

    // Open the dialog
    fireEvent.click(screen.getByText('Import Allocations'));

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText('Import Team Allocations')).toBeInTheDocument();
    });

    const fileInput = screen.getByDisplayValue('');
    const file = new File(
      [
        'teamName,epicName,epicType,sprintNumber,percentage,quarter\nTeam A,Epic 1,Project Epic,1,50,Q1 2024',
      ],
      'test.csv',
      {
        type: 'text/csv',
      }
    );

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for file processing to complete
    await waitFor(() => {
      const importButton = screen.getByText('Import 1 Records');
      expect(importButton).not.toBeDisabled();
    });

    // Click the import button to start the process
    const importButton = screen.getByText('Import 1 Records');
    fireEvent.click(importButton);

    // Check for processing state - should appear immediately
    await waitFor(() => {
      expect(screen.getByText('Importing...')).toBeInTheDocument();
    });

    // Resolve the promise to finish the test
    resolveImport!(mockAllocations);
  });

  it('handles empty file selection', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      const fileInput = screen.getByDisplayValue('');
      fireEvent.change(fileInput, { target: { files: [] } });
    });

    // Verify correct empty state UI appears
    await waitFor(() => {
      // Should show disabled import button with 0 records
      const importButton = screen.getByText('Import 0 Records');
      expect(importButton).toBeInTheDocument();
      expect(importButton).toBeDisabled();
      // Should not show data preview
      expect(screen.queryByText('Data Preview')).not.toBeInTheDocument();
    });
  });

  it('handles reset functionality', async () => {
    renderComponent();

    // Open dialog
    fireEvent.click(screen.getByText('Import Allocations'));

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText('Import Team Allocations')).toBeInTheDocument();
    });

    // Upload file
    const fileInput = screen.getByDisplayValue('');
    const file = new File(
      [
        'teamName,epicName,epicType,sprintNumber,percentage,quarter\nTeam A,Epic 1,Project Epic,1,50,Q1 2024',
      ],
      'test.csv',
      {
        type: 'text/csv',
      }
    );

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for data to be processed and preview to show
    await waitFor(() => {
      expect(screen.getByText('Data Preview (1 records)')).toBeInTheDocument();
      // Ensure reset button is present
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    // Click reset
    fireEvent.click(screen.getByText('Reset'));

    // Verify data preview is gone but dialog is still open
    await waitFor(() => {
      expect(
        screen.queryByText('Data Preview (1 records)')
      ).not.toBeInTheDocument();
      // Dialog should still be open
      expect(screen.getByText('Import Team Allocations')).toBeInTheDocument();
    });
  });

  it('handles cancel action', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      expect(screen.getByText('Import Team Allocations')).toBeInTheDocument();
    });

    // Click cancel
    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(
        screen.queryByText('Import Team Allocations')
      ).not.toBeInTheDocument();
    });
  });

  it('shows success message with valid data', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      const fileInput = screen.getByDisplayValue('');

      const file = new File(
        [
          'teamName,epicName,epicType,sprintNumber,percentage,quarter\nTeam A,Epic 1,Project Epic,1,50,Q1 2024',
        ],
        'test.csv',
        {
          type: 'text/csv',
        }
      );

      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Successfully validated 1 allocation records/)
      ).toBeInTheDocument();
    });
  });
});
