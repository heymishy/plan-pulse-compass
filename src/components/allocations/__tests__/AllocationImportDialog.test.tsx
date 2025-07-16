import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AllocationImportDialog from '../AllocationImportDialog';
import { TestProviders } from '@/test/utils/test-utils';
import * as allocationImportUtils from '@/utils/allocationImportUtils';

// Mock the utils module
vi.mock('@/utils/allocationImportUtils', () => ({
  parseAllocationCSV: vi.fn(),
  validateAllocationImport: vi.fn(),
  convertImportToAllocations: vi.fn(),
  downloadAllocationSampleCSV: vi.fn(),
}));

const mockOnImportComplete = vi.fn();

const mockAllocationData = [
  {
    teamName: 'Team A',
    epicName: 'Epic 1',
    runWorkCategory: 'Development',
    cycle: 'Q1 2024',
    allocation: 50,
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
  beforeEach(() => {
    vi.clearAllMocks();
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

  const renderComponent = () => {
    return render(
      <TestProviders>
        <AllocationImportDialog onImportComplete={mockOnImportComplete} />
      </TestProviders>
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
      expect(screen.getByText('Import Allocation Data')).toBeInTheDocument();
    });
  });

  it('displays file upload input', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      expect(screen.getByText('Choose CSV file')).toBeInTheDocument();
    });
  });

  it('displays sample download link', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      expect(screen.getByText('Download Sample CSV')).toBeInTheDocument();
    });
  });

  it('handles file upload and parsing', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      const fileInput = screen.getByLabelText('Choose CSV file');

      const file = new File(
        ['team,epic,category,cycle,allocation'],
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
      const fileInput = screen.getByLabelText('Choose CSV file');

      const file = new File(
        ['team,epic,category,cycle,allocation'],
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
      const fileInput = screen.getByLabelText('Choose CSV file');

      const file = new File(
        ['team,epic,category,cycle,allocation'],
        'test.csv',
        {
          type: 'text/csv',
        }
      );

      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText('Team A')).toBeInTheDocument();
      expect(screen.getByText('Epic 1')).toBeInTheDocument();
      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.getByText('Q1 2024')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  it('enables import button when valid data is present', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      const fileInput = screen.getByLabelText('Choose CSV file');

      const file = new File(
        ['team,epic,category,cycle,allocation'],
        'test.csv',
        {
          type: 'text/csv',
        }
      );

      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      const importButton = screen.getByText('Import Data');
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
      const fileInput = screen.getByLabelText('Choose CSV file');

      const file = new File(
        ['team,epic,category,cycle,allocation'],
        'test.csv',
        {
          type: 'text/csv',
        }
      );

      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      const importButton = screen.getByText('Import Data');
      expect(importButton).toBeDisabled();
    });
  });

  it('handles successful import', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      const fileInput = screen.getByLabelText('Choose CSV file');

      const file = new File(
        ['team,epic,category,cycle,allocation'],
        'test.csv',
        {
          type: 'text/csv',
        }
      );

      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      const importButton = screen.getByText('Import Data');
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
      const downloadButton = screen.getByText('Download Sample CSV');
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
      const fileInput = screen.getByLabelText('Choose CSV file');

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

  it('displays processing state during import', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      const fileInput = screen.getByLabelText('Choose CSV file');

      const file = new File(
        ['team,epic,category,cycle,allocation'],
        'test.csv',
        {
          type: 'text/csv',
        }
      );

      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      const importButton = screen.getByText('Import Data');
      fireEvent.click(importButton);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  it('closes dialog after successful import', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      const fileInput = screen.getByLabelText('Choose CSV file');

      const file = new File(
        ['team,epic,category,cycle,allocation'],
        'test.csv',
        {
          type: 'text/csv',
        }
      );

      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      const importButton = screen.getByText('Import Data');
      fireEvent.click(importButton);
    });

    await waitFor(() => {
      expect(
        screen.queryByText('Import Allocation Data')
      ).not.toBeInTheDocument();
    });
  });

  it('handles empty file selection', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      const fileInput = screen.getByLabelText('Choose CSV file');
      fireEvent.change(fileInput, { target: { files: [] } });
    });

    // Should not call parsing functions
    expect(allocationImportUtils.parseAllocationCSV).not.toHaveBeenCalled();
  });

  it('resets state when dialog is reopened', async () => {
    renderComponent();

    // Open dialog first time
    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      const fileInput = screen.getByLabelText('Choose CSV file');

      const file = new File(
        ['team,epic,category,cycle,allocation'],
        'test.csv',
        {
          type: 'text/csv',
        }
      );

      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // Close dialog
    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(
        screen.queryByText('Import Allocation Data')
      ).not.toBeInTheDocument();
    });

    // Reopen dialog
    fireEvent.click(screen.getByText('Import Allocations'));

    await waitFor(() => {
      expect(screen.getByText('Import Allocation Data')).toBeInTheDocument();
      // Should not show previous data
      expect(screen.queryByText('Team A')).not.toBeInTheDocument();
    });
  });
});
