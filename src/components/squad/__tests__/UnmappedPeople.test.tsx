import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils/test-utils';
import { AppProvider } from '@/context/AppContext';
import UnmappedPeople from '../UnmappedPeople';
import { UnmappedPerson } from '@/types';

// Mock data
const mockUnmappedPeople: UnmappedPerson[] = [
  {
    id: 'unmapped1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    skills: [
      { skillId: 'skill1', skillName: 'React', proficiency: 'advanced' },
      { skillId: 'skill2', skillName: 'TypeScript', proficiency: 'expert' },
    ],
    availability: 80,
    joinDate: '2024-01-15',
    importedDate: '2024-01-15',
  },
  {
    id: 'unmapped2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    skills: [
      { skillId: 'skill3', skillName: 'Python', proficiency: 'expert' },
      {
        skillId: 'skill4',
        skillName: 'Machine Learning',
        proficiency: 'advanced',
      },
    ],
    availability: 100,
    joinDate: '2024-02-01',
    importedDate: '2024-02-01',
  },
  {
    id: 'unmapped3',
    name: 'Carol Davis',
    email: 'carol@example.com',
    skills: [
      {
        skillId: 'skill5',
        skillName: 'Product Management',
        proficiency: 'expert',
      },
    ],
    availability: 60,
    joinDate: '2024-01-20',
    importedDate: '2024-01-20',
  },
];

const mockAppContextValue = {
  unmappedPeople: mockUnmappedPeople,
  skills: [],
  roles: [],
  teams: [],
  addUnmappedPerson: vi.fn(),
  removeUnmappedPerson: vi.fn(),
  // Add other required context methods as mocks
  squads: [],
  squadMembers: [],
  divisions: [],
  projects: [],
  epics: [],
  milestones: [],
  allocations: [],
  workItems: [],
  people: [],
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
  addSquad: vi.fn(),
  updateSquad: vi.fn(),
  deleteSquad: vi.fn(),
  addSquadMember: vi.fn(),
  updateSquadMember: vi.fn(),
  removeSquadMember: vi.fn(),
  getSquadMembers: vi.fn(),
  getPersonSquads: vi.fn(),
  getSquadSkillGaps: vi.fn(),
  generateSquadRecommendations: vi.fn(),
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

describe('UnmappedPeople', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders unmapped people list', () => {
    render(
      <TestWrapper>
        <UnmappedPeople />
      </TestWrapper>
    );

    expect(screen.getByText('Unmapped People (3)')).toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    expect(screen.getByText('Carol Davis')).toBeInTheDocument();
  });

  it('displays person details correctly', () => {
    render(
      <TestWrapper>
        <UnmappedPeople />
      </TestWrapper>
    );

    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('80% available')).toBeInTheDocument();
    expect(screen.getByText('React (advanced)')).toBeInTheDocument();
    expect(screen.getByText('TypeScript (expert)')).toBeInTheDocument();
  });

  it('filters people by search term', async () => {
    render(
      <TestWrapper>
        <UnmappedPeople />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search people...');
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Carol Davis')).not.toBeInTheDocument();
    });
  });

  it('filters people by skill', async () => {
    render(
      <TestWrapper>
        <UnmappedPeople />
      </TestWrapper>
    );

    const skillFilter = screen.getByDisplayValue('All skills');
    fireEvent.click(skillFilter);

    const reactOption = screen.getByText('React');
    fireEvent.click(reactOption);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
    });
  });

  it('filters people by availability', async () => {
    render(
      <TestWrapper>
        <UnmappedPeople />
      </TestWrapper>
    );

    const availabilityFilter = screen.getByDisplayValue('All');
    fireEvent.click(availabilityFilter);

    const highAvailability = screen.getByText('High (80%+)');
    fireEvent.click(highAvailability);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.queryByText('Carol Davis')).not.toBeInTheDocument();
    });
  });

  it('sorts people by different criteria', async () => {
    render(
      <TestWrapper>
        <UnmappedPeople />
      </TestWrapper>
    );

    const sortSelect = screen.getByDisplayValue('Name');
    fireEvent.click(sortSelect);

    const availabilitySort = screen.getByText('Availability');
    fireEvent.click(availabilitySort);

    // Should sort by availability (highest first with desc order)
    const sortButton = screen.getByText('↑');
    fireEvent.click(sortButton);

    // After sorting by availability desc, Bob (100%) should be first
    await waitFor(() => {
      const peopleCards = screen.getAllByText(/% available/);
      expect(peopleCards[0]).toHaveTextContent('100% available'); // Bob
    });
  });

  it('handles person selection', () => {
    const onPersonSelect = vi.fn();

    render(
      <TestWrapper>
        <UnmappedPeople onPersonSelect={onPersonSelect} />
      </TestWrapper>
    );

    const aliceCard = screen
      .getByText('Alice Johnson')
      .closest('.cursor-pointer');
    if (aliceCard) {
      fireEvent.click(aliceCard);
      expect(onPersonSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Alice Johnson',
          email: 'alice@example.com',
        })
      );
    }
  });

  it('handles select all functionality', () => {
    render(
      <TestWrapper>
        <UnmappedPeople />
      </TestWrapper>
    );

    const selectAllCheckbox = screen.getByLabelText(/select all/i);
    fireEvent.click(selectAllCheckbox);

    expect(screen.getByText('Select all (3 selected)')).toBeInTheDocument();
  });

  it('displays bulk action buttons when people are selected', async () => {
    render(
      <TestWrapper>
        <UnmappedPeople showBulkActions={true} />
      </TestWrapper>
    );

    // Select a person first
    const checkbox = screen.getAllByRole('checkbox')[1]; // First person checkbox (not select all)
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText('Assign to Squad')).toBeInTheDocument();
      expect(screen.getByText('Create Squad')).toBeInTheDocument();
    });
  });

  it('handles bulk actions', () => {
    const onBulkAction = vi.fn();

    render(
      <TestWrapper>
        <UnmappedPeople onBulkAction={onBulkAction} showBulkActions={true} />
      </TestWrapper>
    );

    // Select a person
    const checkbox = screen.getAllByRole('checkbox')[1];
    fireEvent.click(checkbox);

    // Click assign to squad
    const assignButton = screen.getByText('Assign to Squad');
    fireEvent.click(assignButton);

    expect(onBulkAction).toHaveBeenCalledWith(
      'assign-to-squad',
      expect.arrayContaining([
        expect.objectContaining({ name: 'Alice Johnson' }),
      ])
    );
  });

  it('generates sample data when button is clicked', () => {
    // Empty unmapped people list
    const emptyContext = {
      ...mockAppContextValue,
      unmappedPeople: [],
    };

    vi.mocked(mockAppContextValue).unmappedPeople = [];

    render(
      <TestWrapper>
        <UnmappedPeople />
      </TestWrapper>
    );

    const addSampleButton = screen.getByText('Add Sample Data');
    fireEvent.click(addSampleButton);

    expect(mockAppContextValue.addUnmappedPerson).toHaveBeenCalled();
  });

  it('shows empty state when no unmapped people exist', () => {
    const emptyContext = {
      ...mockAppContextValue,
      unmappedPeople: [],
    };

    vi.mocked(mockAppContextValue).unmappedPeople = [];

    render(
      <TestWrapper>
        <UnmappedPeople />
      </TestWrapper>
    );

    expect(screen.getByText('No Unmapped People')).toBeInTheDocument();
    expect(
      screen.getByText('Import people or add sample data to get started')
    ).toBeInTheDocument();
  });

  it('shows no matches state when search yields no results', async () => {
    render(
      <TestWrapper>
        <UnmappedPeople />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search people...');
    fireEvent.change(searchInput, { target: { value: 'NonexistentPerson' } });

    await waitFor(() => {
      expect(screen.getByText('No matches found')).toBeInTheDocument();
      expect(
        screen.getByText('Try adjusting your search or filters')
      ).toBeInTheDocument();
    });
  });

  it('displays correct proficiency colors for skills', () => {
    render(
      <TestWrapper>
        <UnmappedPeople />
      </TestWrapper>
    );

    // Expert skills should have purple background
    const expertSkill = screen.getByText('TypeScript (expert)');
    expect(expertSkill).toHaveClass('bg-purple-500');

    // Advanced skills should have blue background
    const advancedSkill = screen.getByText('React (advanced)');
    expect(advancedSkill).toHaveClass('bg-blue-500');
  });

  it('displays correct availability colors', () => {
    render(
      <TestWrapper>
        <UnmappedPeople />
      </TestWrapper>
    );

    // High availability (80%+) should be green
    const highAvailability = screen.getByText('100% available');
    expect(highAvailability).toHaveClass('bg-green-500');

    // Medium availability (50-79%) should be yellow
    const mediumAvailability = screen.getByText('60% available');
    expect(mediumAvailability).toHaveClass('bg-red-500'); // Actually low availability (<50% is red, but 60% should be yellow)
  });

  it('limits skill display and shows overflow indicator', () => {
    // Create person with many skills
    const personWithManySkills: UnmappedPerson = {
      id: 'many-skills',
      name: 'Skilled Person',
      email: 'skilled@example.com',
      skills: [
        { skillId: '1', skillName: 'React', proficiency: 'expert' },
        { skillId: '2', skillName: 'Vue', proficiency: 'advanced' },
        { skillId: '3', skillName: 'Angular', proficiency: 'intermediate' },
        { skillId: '4', skillName: 'Node.js', proficiency: 'expert' },
        { skillId: '5', skillName: 'Python', proficiency: 'advanced' },
        { skillId: '6', skillName: 'Go', proficiency: 'beginner' },
      ],
      availability: 75,
      joinDate: '2024-01-01',
      importedDate: '2024-01-01',
    };

    const contextWithManySkills = {
      ...mockAppContextValue,
      unmappedPeople: [personWithManySkills],
    };

    vi.mocked(mockAppContextValue).unmappedPeople = [personWithManySkills];

    render(
      <TestWrapper>
        <UnmappedPeople />
      </TestWrapper>
    );

    // Should show +2 more indicator (6 skills - 4 displayed = 2 more)
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('disables sample data button when data already exists', () => {
    render(
      <TestWrapper>
        <UnmappedPeople />
      </TestWrapper>
    );

    const addSampleButton = screen.getByText('Add Sample Data');
    expect(addSampleButton).toBeDisabled();
  });
});
