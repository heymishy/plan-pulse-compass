import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils/test-utils';
import { AppProvider } from '@/context/AppContext';
import SquadImportSystem from '../SquadImportSystem';
import { Squad, SquadMember, Person, UnmappedPerson } from '@/types';

// Mock data
const mockSquads: Squad[] = [];
const mockPeople: Person[] = [];

const mockAppContextValue = {
  squads: mockSquads,
  people: mockPeople,
  addSquad: vi.fn().mockImplementation(squadData => ({
    id: 'new-squad-id',
    ...squadData,
    createdDate: '2024-01-01',
    lastModified: '2024-01-01',
  })),
  addSquadMember: vi.fn(),
  addUnmappedPerson: vi.fn(),
  addPerson: vi.fn(),
  // Add other required context methods as mocks
  unmappedPeople: [],
  squadMembers: [],
  divisions: [],
  projects: [],
  epics: [],
  milestones: [],
  allocations: [],
  workItems: [],
  teams: [],
  roles: [],
  skills: [],
  updatePerson: vi.fn(),
  deletePerson: vi.fn(),
  addTeam: vi.fn(),
  updateTeam: vi.fn(),
  deleteTeam: vi.fn(),
  addRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
  addSkill: vi.fn(),
  updateSkill: vi.fn(),
  deleteSkill: vi.fn(),
  addProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  addEpic: vi.fn(),
  updateEpic: vi.fn(),
  deleteEpic: vi.fn(),
  addMilestone: vi.fn(),
  updateMilestone: vi.fn(),
  deleteMilestone: vi.fn(),
  addAllocation: vi.fn(),
  updateAllocation: vi.fn(),
  deleteAllocation: vi.fn(),
  addWorkItem: vi.fn(),
  updateWorkItem: vi.fn(),
  deleteWorkItem: vi.fn(),
  addDivision: vi.fn(),
  updateDivision: vi.fn(),
  deleteDivision: vi.fn(),
  updateSquad: vi.fn(),
  deleteSquad: vi.fn(),
  updateSquadMember: vi.fn(),
  removeSquadMember: vi.fn(),
  getSquadMembers: vi.fn(),
  getPersonSquads: vi.fn(),
  getSquadSkillGaps: vi.fn(),
  generateSquadRecommendations: vi.fn(),
  removeUnmappedPerson: vi.fn(),
  isLoading: false,
  exportData: vi.fn(),
  importData: vi.fn(),
  clearAllData: vi.fn(),
  refreshData: vi.fn(),
  hasSampleData: vi.fn(),
  loadSampleData: vi.fn(),
};

// Mock useApp hook
vi.mock('@/context/AppContext', async () => {
  const actual = await vi.importActual('@/context/AppContext');
  return {
    ...actual,
    useApp: () => mockAppContextValue,
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('SquadImportSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders import system card', () => {
    render(
      <TestWrapper>
        <SquadImportSystem />
      </TestWrapper>
    );

    expect(screen.getByText('Bulk Import System')).toBeInTheDocument();
    expect(screen.getByText('CSV Import')).toBeInTheDocument();
    expect(screen.getByText('JSON Import')).toBeInTheDocument();
    expect(
      screen.getByText('Import multiple squads and members from CSV')
    ).toBeInTheDocument();
  });

  it('opens import dialog when import button is clicked', async () => {
    render(
      <TestWrapper>
        <SquadImportSystem />
      </TestWrapper>
    );

    const importButton = screen.getByText('Import Squads');
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(screen.getByText('Import Squads and Members')).toBeInTheDocument();
    });

    expect(screen.getByText('CSV Import')).toBeInTheDocument();
    expect(screen.getByText('JSON Import')).toBeInTheDocument();
    expect(screen.getByText('Manual Entry')).toBeInTheDocument();
  });

  it('displays CSV import tab by default', async () => {
    render(
      <TestWrapper>
        <SquadImportSystem />
      </TestWrapper>
    );

    const importButton = screen.getByText('Import Squads');
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(screen.getByText('CSV Data')).toBeInTheDocument();
      expect(screen.getByText('Download Template')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Paste your CSV data here...')
      ).toBeInTheDocument();
    });
  });

  it('switches to JSON import tab', async () => {
    render(
      <TestWrapper>
        <SquadImportSystem />
      </TestWrapper>
    );

    const importButton = screen.getByText('Import Squads');
    fireEvent.click(importButton);

    await waitFor(() => {
      const jsonTab = screen.getByText('JSON Import');
      fireEvent.click(jsonTab);
    });

    expect(screen.getByText('JSON Data')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Paste your JSON data here...')
    ).toBeInTheDocument();
  });

  it('shows manual entry message', async () => {
    render(
      <TestWrapper>
        <SquadImportSystem />
      </TestWrapper>
    );

    const importButton = screen.getByText('Import Squads');
    fireEvent.click(importButton);

    await waitFor(() => {
      const manualTab = screen.getByText('Manual Entry');
      fireEvent.click(manualTab);
    });

    expect(screen.getByText('Manual Entry')).toBeInTheDocument();
    expect(
      screen.getByText('Use the Squad Builder to create squads manually')
    ).toBeInTheDocument();
  });

  it('validates CSV data correctly', async () => {
    render(
      <TestWrapper>
        <SquadImportSystem />
      </TestWrapper>
    );

    const importButton = screen.getByText('Import Squads');
    fireEvent.click(importButton);

    await waitFor(() => {
      const csvInput = screen.getByPlaceholderText(
        'Paste your CSV data here...'
      );

      const validCSV = `Squad Name,Squad Type,Squad Status,Capacity,Member Name,Member Email,Member Role,Allocation,Skills
"Test Squad",project,active,5,"John Doe",john@example.com,lead,100,"React;TypeScript"`;

      fireEvent.change(csvInput, { target: { value: validCSV } });
    });

    const validateButton = screen.getByText('Validate Data');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText('Valid')).toBeInTheDocument();
      expect(screen.getByText('1 squads to create')).toBeInTheDocument();
      expect(screen.getByText('1 members to add')).toBeInTheDocument();
    });
  });

  it('shows validation errors for invalid CSV', async () => {
    render(
      <TestWrapper>
        <SquadImportSystem />
      </TestWrapper>
    );

    const importButton = screen.getByText('Import Squads');
    fireEvent.click(importButton);

    await waitFor(() => {
      const csvInput = screen.getByPlaceholderText(
        'Paste your CSV data here...'
      );

      const invalidCSV = `Invalid Header
"Test Squad",invalid_type,active,5,"John Doe",john@example.com,lead,100,"React"`;

      fireEvent.change(csvInput, { target: { value: invalidCSV } });
    });

    const validateButton = screen.getByText('Validate Data');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid')).toBeInTheDocument();
      expect(screen.getByText('Errors:')).toBeInTheDocument();
    });
  });

  it('validates JSON data correctly', async () => {
    render(
      <TestWrapper>
        <SquadImportSystem />
      </TestWrapper>
    );

    const importButton = screen.getByText('Import Squads');
    fireEvent.click(importButton);

    await waitFor(() => {
      const jsonTab = screen.getByText('JSON Import');
      fireEvent.click(jsonTab);
    });

    const jsonInput = screen.getByPlaceholderText(
      'Paste your JSON data here...'
    );

    const validJSON = JSON.stringify({
      squads: [
        {
          squadName: 'Test Squad',
          squadType: 'project',
          squadStatus: 'active',
          capacity: 5,
          members: [
            {
              name: 'John Doe',
              email: 'john@example.com',
              role: 'lead',
              allocation: 100,
              skills: ['React', 'TypeScript'],
            },
          ],
        },
      ],
    });

    fireEvent.change(jsonInput, { target: { value: validJSON } });

    const validateButton = screen.getByText('Validate Data');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText('Valid')).toBeInTheDocument();
    });
  });

  it('shows validation errors for invalid JSON', async () => {
    render(
      <TestWrapper>
        <SquadImportSystem />
      </TestWrapper>
    );

    const importButton = screen.getByText('Import Squads');
    fireEvent.click(importButton);

    await waitFor(() => {
      const jsonTab = screen.getByText('JSON Import');
      fireEvent.click(jsonTab);
    });

    const jsonInput = screen.getByPlaceholderText(
      'Paste your JSON data here...'
    );
    fireEvent.change(jsonInput, { target: { value: 'invalid json' } });

    const validateButton = screen.getByText('Validate Data');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid')).toBeInTheDocument();
      expect(screen.getByText(/JSON parsing error/)).toBeInTheDocument();
    });
  });

  it('imports valid data successfully', async () => {
    render(
      <TestWrapper>
        <SquadImportSystem />
      </TestWrapper>
    );

    const importButton = screen.getByText('Import Squads');
    fireEvent.click(importButton);

    await waitFor(() => {
      const csvInput = screen.getByPlaceholderText(
        'Paste your CSV data here...'
      );

      const validCSV = `Squad Name,Squad Type,Squad Status,Capacity,Member Name,Member Email,Member Role,Allocation,Skills
"Test Squad",project,active,5,"John Doe",john@example.com,lead,100,"React;TypeScript"`;

      fireEvent.change(csvInput, { target: { value: validCSV } });
    });

    const validateButton = screen.getByText('Validate Data');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText('Valid')).toBeInTheDocument();
    });

    const importDataButton = screen.getByText('Import 1 Squads');
    fireEvent.click(importDataButton);

    await waitFor(() => {
      expect(mockAppContextValue.addSquad).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Squad',
          type: 'project',
          status: 'active',
          capacity: 5,
        })
      );
    });
  });

  it('shows import progress during processing', async () => {
    render(
      <TestWrapper>
        <SquadImportSystem />
      </TestWrapper>
    );

    const importButton = screen.getByText('Import Squads');
    fireEvent.click(importButton);

    await waitFor(() => {
      const csvInput = screen.getByPlaceholderText(
        'Paste your CSV data here...'
      );

      const validCSV = `Squad Name,Squad Type,Squad Status,Capacity,Member Name,Member Email,Member Role,Allocation,Skills
"Test Squad",project,active,5,"John Doe",john@example.com,lead,100,"React;TypeScript"`;

      fireEvent.change(csvInput, { target: { value: validCSV } });
    });

    const validateButton = screen.getByText('Validate Data');
    fireEvent.click(validateButton);

    await waitFor(() => {
      const importDataButton = screen.getByText('Import 1 Squads');
      fireEvent.click(importDataButton);
    });

    // Progress should be shown during import
    expect(screen.getByText('Importing...')).toBeInTheDocument();
  });

  it('shows import results after completion', async () => {
    render(
      <TestWrapper>
        <SquadImportSystem />
      </TestWrapper>
    );

    const importButton = screen.getByText('Import Squads');
    fireEvent.click(importButton);

    await waitFor(() => {
      const csvInput = screen.getByPlaceholderText(
        'Paste your CSV data here...'
      );

      const validCSV = `Squad Name,Squad Type,Squad Status,Capacity,Member Name,Member Email,Member Role,Allocation,Skills
"Test Squad",project,active,5,"John Doe",john@example.com,lead,100,"React;TypeScript"`;

      fireEvent.change(csvInput, { target: { value: validCSV } });
    });

    const validateButton = screen.getByText('Validate Data');
    fireEvent.click(validateButton);

    await waitFor(() => {
      const importDataButton = screen.getByText('Import 1 Squads');
      fireEvent.click(importDataButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Import Results')).toBeInTheDocument();
      expect(screen.getByText('Squads created:')).toBeInTheDocument();
      expect(screen.getByText('Members added:')).toBeInTheDocument();
    });
  });

  it('resets import data when reset button is clicked', async () => {
    render(
      <TestWrapper>
        <SquadImportSystem />
      </TestWrapper>
    );

    const importButton = screen.getByText('Import Squads');
    fireEvent.click(importButton);

    await waitFor(() => {
      const csvInput = screen.getByPlaceholderText(
        'Paste your CSV data here...'
      );
      fireEvent.change(csvInput, { target: { value: 'some data' } });
    });

    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);

    const csvInput = screen.getByPlaceholderText('Paste your CSV data here...');
    expect(csvInput).toHaveValue('');
  });

  it('validates required fields in CSV', async () => {
    render(
      <TestWrapper>
        <SquadImportSystem />
      </TestWrapper>
    );

    const importButton = screen.getByText('Import Squads');
    fireEvent.click(importButton);

    await waitFor(() => {
      const csvInput = screen.getByPlaceholderText(
        'Paste your CSV data here...'
      );

      const csvWithMissingData = `Squad Name,Squad Type,Squad Status,Capacity,Member Name,Member Email,Member Role,Allocation,Skills
"",project,active,5,"John Doe",john@example.com,lead,100,"React"`;

      fireEvent.change(csvInput, { target: { value: csvWithMissingData } });
    });

    const validateButton = screen.getByText('Validate Data');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid')).toBeInTheDocument();
      expect(screen.getByText(/Squad name is required/)).toBeInTheDocument();
    });
  });

  it('validates capacity and allocation ranges', async () => {
    render(
      <TestWrapper>
        <SquadImportSystem />
      </TestWrapper>
    );

    const importButton = screen.getByText('Import Squads');
    fireEvent.click(importButton);

    await waitFor(() => {
      const csvInput = screen.getByPlaceholderText(
        'Paste your CSV data here...'
      );

      const csvWithInvalidNumbers = `Squad Name,Squad Type,Squad Status,Capacity,Member Name,Member Email,Member Role,Allocation,Skills
"Test Squad",project,active,0,"John Doe",john@example.com,lead,150,"React"`;

      fireEvent.change(csvInput, { target: { value: csvWithInvalidNumbers } });
    });

    const validateButton = screen.getByText('Validate Data');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid')).toBeInTheDocument();
      expect(
        screen.getByText(/Capacity must be a positive number/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Allocation must be between 0 and 100/)
      ).toBeInTheDocument();
    });
  });

  it('shows warnings for squad configuration issues', async () => {
    render(
      <TestWrapper>
        <SquadImportSystem />
      </TestWrapper>
    );

    const importButton = screen.getByText('Import Squads');
    fireEvent.click(importButton);

    await waitFor(() => {
      const csvInput = screen.getByPlaceholderText(
        'Paste your CSV data here...'
      );

      const csvWithWarnings = `Squad Name,Squad Type,Squad Status,Capacity,Member Name,Member Email,Member Role,Allocation,Skills
"Test Squad",project,active,2,"John Doe",john@example.com,member,100,"React"
"Test Squad",project,active,2,"Jane Doe",jane@example.com,member,100,"CSS"
"Test Squad",project,active,2,"Bob Doe",bob@example.com,member,100,"JS"`;

      fireEvent.change(csvInput, { target: { value: csvWithWarnings } });
    });

    const validateButton = screen.getByText('Validate Data');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText('Valid')).toBeInTheDocument();
      expect(screen.getByText('Warnings:')).toBeInTheDocument();
      expect(screen.getByText(/members exceed capacity/)).toBeInTheDocument();
      expect(screen.getByText(/No lead assigned/)).toBeInTheDocument();
    });
  });

  // Mock download functionality
  it('downloads CSV template when requested', async () => {
    // Mock document.createElement and URL.createObjectURL
    const createElementSpy = vi.spyOn(document, 'createElement');
    const mockElement = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    createElementSpy.mockReturnValue(mockElement as any);

    global.URL.createObjectURL = vi.fn(() => 'mock-url');

    render(
      <TestWrapper>
        <SquadImportSystem />
      </TestWrapper>
    );

    const importButton = screen.getByText('Import Squads');
    fireEvent.click(importButton);

    await waitFor(() => {
      const downloadButton = screen.getByText('Download Template');
      fireEvent.click(downloadButton);
    });

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockElement.click).toHaveBeenCalled();
    expect(mockElement.download).toBe('squad-import-template.csv');

    createElementSpy.mockRestore();
  });
});
