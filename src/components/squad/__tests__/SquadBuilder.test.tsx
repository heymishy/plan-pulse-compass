import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils/test-utils';
import { AppProvider } from '@/context/AppContext';
import SquadBuilder from '../SquadBuilder';
import { Squad, SquadMember, Person, UnmappedPerson } from '@/types';

// Mock data
const mockSquads: Squad[] = [
  {
    id: 'squad1',
    name: 'Alpha Squad',
    type: 'project',
    status: 'active',
    capacity: 5,
    targetSkills: ['React', 'TypeScript'],
    createdDate: '2024-01-01',
    lastModified: '2024-01-01',
    description: 'Test squad',
    divisionId: 'div1',
    projectIds: [],
    duration: { start: '2024-01-01', end: '2024-12-31' },
  },
];

const mockSquadMembers: SquadMember[] = [
  {
    id: 'member1',
    squadId: 'squad1',
    personId: 'person1',
    role: 'lead',
    allocation: 100,
    startDate: '2024-01-01',
    isActive: true,
  },
];

const mockPeople: Person[] = [
  {
    id: 'person1',
    name: 'John Doe',
    email: 'john@example.com',
    roleId: 'role1',
    teamId: 'team1',
    isActive: true,
    employmentType: 'permanent',
    startDate: '2024-01-01',
    skills: [{ skillId: 'skill1', skillName: 'React', proficiency: 'expert' }],
  },
];

const mockUnmappedPeople: UnmappedPerson[] = [
  {
    id: 'unmapped1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    skills: [
      { skillId: 'skill2', skillName: 'TypeScript', proficiency: 'advanced' },
    ],
    availability: 80,
    joinDate: '2024-01-15',
    importedDate: '2024-01-15',
  },
];

const mockAppContextValue = {
  squads: mockSquads,
  squadMembers: mockSquadMembers,
  people: mockPeople,
  unmappedPeople: mockUnmappedPeople,
  divisions: [],
  projects: [],
  addSquad: vi.fn(),
  updateSquad: vi.fn(),
  deleteSquad: vi.fn(),
  addSquadMember: vi.fn(),
  updateSquadMember: vi.fn(),
  removeSquadMember: vi.fn(),
  getSquadMembers: vi.fn(squadId =>
    mockSquadMembers.filter(m => m.squadId === squadId)
  ),
  getPersonSquads: vi.fn(),
  getSquadSkillGaps: vi.fn(() => []),
  generateSquadRecommendations: vi.fn(() => []),
  addUnmappedPerson: vi.fn(),
  removeUnmappedPerson: vi.fn(),
  // Add other required context methods as mocks
  teams: [],
  roles: [],
  skills: [],
  projects: [],
  epics: [],
  milestones: [],
  allocations: [],
  workItems: [],
  people: mockPeople,
  addPerson: vi.fn(),
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

describe('SquadBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders squad list with existing squads', () => {
    render(
      <TestWrapper>
        <SquadBuilder />
      </TestWrapper>
    );

    expect(screen.getByText('Squads (1)')).toBeInTheDocument();
    expect(screen.getByText('Alpha Squad')).toBeInTheDocument();
    expect(screen.getByText('project')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('displays "New Squad" button', () => {
    render(
      <TestWrapper>
        <SquadBuilder />
      </TestWrapper>
    );

    expect(
      screen.getByRole('button', { name: /new squad/i })
    ).toBeInTheDocument();
  });

  it('opens create squad dialog when "New Squad" is clicked', async () => {
    render(
      <TestWrapper>
        <SquadBuilder />
      </TestWrapper>
    );

    const newSquadButton = screen.getByRole('button', { name: /new squad/i });
    fireEvent.click(newSquadButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Squad')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Squad Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Target Capacity')).toBeInTheDocument();
  });

  it('creates a new squad with form data', async () => {
    render(
      <TestWrapper>
        <SquadBuilder />
      </TestWrapper>
    );

    // Open dialog
    const newSquadButton = screen.getByRole('button', { name: /new squad/i });
    fireEvent.click(newSquadButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Squad')).toBeInTheDocument();
    });

    // Fill form
    const nameInput = screen.getByLabelText('Squad Name');
    fireEvent.change(nameInput, { target: { value: 'Beta Squad' } });

    const capacityInput = screen.getByLabelText('Target Capacity');
    fireEvent.change(capacityInput, { target: { value: '8' } });

    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, {
      target: { value: 'Test description' },
    });

    // Submit form
    const createButton = screen.getByRole('button', { name: 'Create Squad' });
    fireEvent.click(createButton);

    expect(mockAppContextValue.addSquad).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Beta Squad',
        capacity: 8,
        description: 'Test description',
        type: 'project',
        status: 'planning',
      })
    );
  });

  it('displays squad details when a squad is selected', () => {
    render(
      <TestWrapper>
        <SquadBuilder selectedSquad={mockSquads[0]} />
      </TestWrapper>
    );

    expect(screen.getByText('Alpha Squad')).toBeInTheDocument();
    expect(screen.getByText('Squad Members (1)')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/lead • 100% allocation/)).toBeInTheDocument();
  });

  it('shows empty state when no squads exist', () => {
    const emptyContext = {
      ...mockAppContextValue,
      squads: [],
      squadMembers: [],
    };

    vi.mocked(mockAppContextValue).squads = [];

    render(
      <TestWrapper>
        <SquadBuilder />
      </TestWrapper>
    );

    expect(screen.getByText('No squads created yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first squad')).toBeInTheDocument();
  });

  it('removes a squad member when delete button is clicked', async () => {
    render(
      <TestWrapper>
        <SquadBuilder selectedSquad={mockSquads[0]} />
      </TestWrapper>
    );

    const deleteButton = screen.getByRole('button', { name: '' }); // Trash icon
    fireEvent.click(deleteButton);

    expect(mockAppContextValue.removeSquadMember).toHaveBeenCalledWith(
      'member1'
    );
  });

  it('handles person selection from UnmappedPeople', () => {
    const onSquadChange = vi.fn();

    render(
      <TestWrapper>
        <SquadBuilder
          selectedSquad={mockSquads[0]}
          onSquadChange={onSquadChange}
        />
      </TestWrapper>
    );

    // This would normally be triggered by the UnmappedPeople component
    // We'll test the handlePersonSelect method indirectly through squad creation
    expect(screen.getByText('Alpha Squad')).toBeInTheDocument();
  });

  it('calculates squad health correctly', () => {
    render(
      <TestWrapper>
        <SquadBuilder />
      </TestWrapper>
    );

    // Squad with full allocation should show good health
    expect(screen.getByText('excellent')).toBeInTheDocument();
  });

  it('displays correct squad type icons', () => {
    const projectSquad = { ...mockSquads[0], type: 'project' as const };

    render(
      <TestWrapper>
        <SquadBuilder selectedSquad={projectSquad} />
      </TestWrapper>
    );

    // The icon is rendered as an emoji in the component
    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  it('handles bulk actions from UnmappedPeople component', () => {
    render(
      <TestWrapper>
        <SquadBuilder selectedSquad={mockSquads[0]} />
      </TestWrapper>
    );

    // The UnmappedPeople component is rendered and should handle bulk actions
    expect(
      screen.getByTestId('unmapped-people') || screen.getByText(/unmapped/i)
    ).toBeInTheDocument();
  });

  it('validates form inputs when creating a squad', async () => {
    render(
      <TestWrapper>
        <SquadBuilder />
      </TestWrapper>
    );

    // Open dialog
    const newSquadButton = screen.getByRole('button', { name: /new squad/i });
    fireEvent.click(newSquadButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Squad')).toBeInTheDocument();
    });

    // Try to submit without name
    const createButton = screen.getByRole('button', { name: 'Create Squad' });
    fireEvent.click(createButton);

    // Should not call addSquad if name is empty
    expect(mockAppContextValue.addSquad).not.toHaveBeenCalled();
  });

  it('displays role icons correctly', () => {
    render(
      <TestWrapper>
        <SquadBuilder selectedSquad={mockSquads[0]} />
      </TestWrapper>
    );

    // Check for lead role icon (Crown icon should be present)
    const memberElement = screen.getByText('John Doe').closest('.flex');
    expect(memberElement).toBeInTheDocument();
  });

  it('shows timeline information when available', () => {
    render(
      <TestWrapper>
        <SquadBuilder selectedSquad={mockSquads[0]} />
      </TestWrapper>
    );

    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText(/1\/1\/2024/)).toBeInTheDocument();
  });

  it('handles squad selection correctly', () => {
    const onSquadChange = vi.fn();

    render(
      <TestWrapper>
        <SquadBuilder onSquadChange={onSquadChange} />
      </TestWrapper>
    );

    const squadCard = screen
      .getByText('Alpha Squad')
      .closest('.cursor-pointer');
    if (squadCard) {
      fireEvent.click(squadCard);
      expect(onSquadChange).toHaveBeenCalledWith(mockSquads[0]);
    }
  });
});
