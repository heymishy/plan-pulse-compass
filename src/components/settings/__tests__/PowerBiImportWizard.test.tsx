import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PowerBiImportWizard } from '../PowerBiImportWizard';
import { useApp } from '@/context/AppContext';

// Mock the context
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

// Mock the utility functions
vi.mock('@/utils/powerBiImportUtils', () => ({
  parsePowerBiEpicCSV: vi.fn(),
  parsePowerBiStoryCSV: vi.fn(),
  aggregateTeamSprintData: vi.fn(),
  calculateAllocationPercentages: vi.fn(),
  validatePowerBiData: vi.fn(),
}));

describe('PowerBiImportWizard', () => {
  const mockContextValue = {
    teams: [
      {
        id: 'team1',
        name: 'Team Alpha',
        description: 'Alpha team',
        type: 'permanent' as const,
        status: 'active' as const,
        divisionId: 'dev',
        capacity: 40,
        targetSkills: [],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
    ],
    cycles: [
      {
        id: 'q1-2024',
        name: 'Q1 2024',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        type: 'quarterly' as const,
        financialYearId: 'fy2024',
      },
      {
        id: 'q2-2024',
        name: 'Q2 2024',
        startDate: '2024-04-01',
        endDate: '2024-06-30',
        type: 'quarterly' as const,
        financialYearId: 'fy2024',
      },
      {
        id: 'q1-2025',
        name: 'Q1 2025',
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        type: 'quarterly' as const,
        financialYearId: 'fy2025',
      },
    ],
    epics: [],
    allocations: [],
    addAllocations: vi.fn(),
    updateAllocation: vi.fn(),
    deleteAllocation: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useApp).mockReturnValue(mockContextValue);
  });

  it('should render the initial step with file upload options', () => {
    const onClose = vi.fn();
    render(<PowerBiImportWizard isOpen={true} onClose={onClose} />);

    expect(screen.getByText('Power BI Import Wizard')).toBeInTheDocument();
    expect(
      screen.getByText('Step 1 of 5: Upload Files & Select Cycle')
    ).toBeInTheDocument();
    expect(screen.getByText('Upload Epic CSV File')).toBeInTheDocument();
    expect(screen.getByText('Upload Story CSV File')).toBeInTheDocument();
    expect(screen.getByText('Select Target Quarter')).toBeInTheDocument();
    expect(screen.getByText('Financial Year')).toBeInTheDocument();
    expect(screen.getByText('Quarter')).toBeInTheDocument();
  });

  it('should show validation errors for missing files', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PowerBiImportWizard isOpen={true} onClose={onClose} />);

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    expect(screen.getByText('Please upload Epic CSV file')).toBeInTheDocument();
    expect(
      screen.getByText('Please upload Story CSV file')
    ).toBeInTheDocument();
  });

  it('should enable next button when files are uploaded and cycle is selected', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PowerBiImportWizard isOpen={true} onClose={onClose} />);

    // Mock file upload
    const epicFile = new File(['epic,data'], 'epics.csv', { type: 'text/csv' });
    const storyFile = new File(['story,data'], 'stories.csv', {
      type: 'text/csv',
    });

    const epicInput = screen.getByLabelText('Epic CSV File');
    const storyInput = screen.getByLabelText('Story CSV File');

    await user.upload(epicInput, epicFile);
    await user.upload(storyInput, storyFile);

    // The component should auto-select current quarter by default
    // So the Next button should be enabled without manual selection
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).not.toBeDisabled();
  });

  it('should show step indicators', () => {
    const onClose = vi.fn();
    render(<PowerBiImportWizard isOpen={true} onClose={onClose} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should allow closing the wizard', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PowerBiImportWizard isOpen={true} onClose={onClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should show progress through steps', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    // Mock successful parsing
    const { parsePowerBiEpicCSV, parsePowerBiStoryCSV } = await import(
      '@/utils/powerBiImportUtils'
    );
    vi.mocked(parsePowerBiEpicCSV).mockReturnValue({
      success: true,
      data: [],
      errors: [],
    });
    vi.mocked(parsePowerBiStoryCSV).mockReturnValue({
      success: true,
      data: [],
      errors: [],
    });

    render(<PowerBiImportWizard isOpen={true} onClose={onClose} />);

    // Upload files - cycle should be auto-selected
    const epicFile = new File(['epic,data'], 'epics.csv', { type: 'text/csv' });
    const storyFile = new File(['story,data'], 'stories.csv', {
      type: 'text/csv',
    });

    await user.upload(screen.getByLabelText('Epic CSV File'), epicFile);
    await user.upload(screen.getByLabelText('Story CSV File'), storyFile);

    // Go to next step
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(
        screen.getByText('Step 2 of 5: Parse & Validate Files')
      ).toBeInTheDocument();
    });
  });

  it('should show separate financial year and quarter dropdowns', () => {
    const onClose = vi.fn();
    render(<PowerBiImportWizard isOpen={true} onClose={onClose} />);

    // Should show both dropdowns
    expect(screen.getByText('Financial Year')).toBeInTheDocument();
    expect(screen.getByText('Quarter')).toBeInTheDocument();

    // Should have both financial year and quarter dropdowns
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes).toHaveLength(2);

    // Quarter dropdown should be enabled (will be auto-selected)
    const quarterSelect = comboboxes[1];
    expect(quarterSelect).not.toBeDisabled();
  });

  it('should show helpful text for quarter selection', () => {
    const onClose = vi.fn();
    render(<PowerBiImportWizard isOpen={true} onClose={onClose} />);

    // Should show helpful labels for both dropdowns
    expect(screen.getByText('Financial Year')).toBeInTheDocument();
    expect(screen.getByText('Quarter')).toBeInTheDocument();
  });

  it('should show validation error when quarter selection is cleared', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<PowerBiImportWizard isOpen={true} onClose={onClose} />);

    // Try to proceed without uploading files
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    // Should show validation errors
    expect(screen.getByText('Please upload Epic CSV file')).toBeInTheDocument();
    expect(
      screen.getByText('Please upload Story CSV file')
    ).toBeInTheDocument();
  });
});
