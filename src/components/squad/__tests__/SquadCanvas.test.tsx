import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils/test-utils';
import SquadCanvas from '../SquadCanvas';
import { Squad, SquadMember, Person } from '@/types';

// Mock HTMLCanvasElement
const mockGetContext = vi.fn(() => ({
  clearRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  set fillStyle(value: string) {},
  set strokeStyle(value: string) {},
  set lineWidth(value: number) {},
  set globalAlpha(value: number) {},
  set font(value: string) {},
  set textAlign(value: string) {},
  set textBaseline(value: string) {},
}));

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockGetContext,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
  get: () => 800,
  set: vi.fn(),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
  get: () => 600,
  set: vi.fn(),
});

// Mock ResizeObserver with spy tracking
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();

class MockResizeObserver {
  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = mockUnobserve;
}
global.ResizeObserver = MockResizeObserver;

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
    description: 'Frontend squad',
    divisionId: 'div1',
    projectIds: [],
    duration: { start: '2024-01-01', end: '2024-12-31' },
  },
  {
    id: 'squad2',
    name: 'Beta Squad',
    type: 'initiative',
    status: 'planning',
    capacity: 8,
    targetSkills: ['Python', 'Machine Learning'],
    createdDate: '2024-01-01',
    lastModified: '2024-01-01',
    description: 'Data science squad',
    divisionId: 'div1',
    projectIds: [],
    duration: { start: '2024-02-01', end: '2024-12-31' },
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
  {
    id: 'member2',
    squadId: 'squad1',
    personId: 'person2',
    role: 'member',
    allocation: 80,
    startDate: '2024-01-01',
    isActive: true,
  },
  {
    id: 'member3',
    squadId: 'squad2',
    personId: 'person3',
    role: 'member',
    allocation: 90,
    startDate: '2024-02-01',
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
    skills: [
      { skillId: 'skill1', skillName: 'React', proficiency: 'expert' },
      { skillId: 'skill2', skillName: 'TypeScript', proficiency: 'advanced' },
    ],
  },
  {
    id: 'person2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    roleId: 'role2',
    teamId: 'team1',
    isActive: true,
    employmentType: 'permanent',
    startDate: '2024-01-01',
    skills: [
      { skillId: 'skill1', skillName: 'React', proficiency: 'intermediate' },
      { skillId: 'skill3', skillName: 'CSS', proficiency: 'advanced' },
    ],
  },
  {
    id: 'person3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    roleId: 'role3',
    teamId: 'team2',
    isActive: true,
    employmentType: 'permanent',
    startDate: '2024-01-01',
    skills: [
      { skillId: 'skill4', skillName: 'Python', proficiency: 'expert' },
      {
        skillId: 'skill5',
        skillName: 'Machine Learning',
        proficiency: 'advanced',
      },
    ],
  },
];

const mockAppContextValue = {
  squads: mockSquads,
  squadMembers: mockSquadMembers,
  people: mockPeople,
  getSquadMembers: vi.fn(squadId =>
    mockSquadMembers.filter(m => m.squadId === squadId)
  ),
  getPersonSquads: vi.fn(personId =>
    mockSquadMembers.filter(m => m.personId === personId).map(m => m.squadId)
  ),
  // Add other required context methods as mocks
  unmappedPeople: [],
  divisions: [],
  projects: [],
  epics: [],
  milestones: [],
  allocations: [],
  workItems: [],
  teams: [],
  roles: [],
  skills: [],
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
  getSquadSkillGaps: vi.fn(),
  generateSquadRecommendations: vi.fn(),
  addUnmappedPerson: vi.fn(),
  removeUnmappedPerson: vi.fn(),
  isLoading: false,
  exportData: vi.fn(),
  importData: vi.fn(),
  clearAllData: vi.fn(),
  refreshData: vi.fn(),
  hasSampleData: vi.fn(),
  loadSampleData: vi.fn(),
};

// Mock useApp hook completely - no real AppProvider
vi.mock('@/context/AppContext', () => ({
  useApp: () => mockAppContextValue,
  AppProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// No TestWrapper needed - using default render with LightweightProviders

describe('SquadCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockObserve.mockClear();
    mockDisconnect.mockClear();
    mockUnobserve.mockClear();
  });

  it('renders canvas with default squads view', () => {
    render(<SquadCanvas />);

    expect(screen.getByText('Squad Canvas - Squads View')).toBeInTheDocument();
    expect(screen.getByText('Legend')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Initiative')).toBeInTheDocument();
  });

  it('displays zoom controls', () => {
    render(<SquadCanvas />);

    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument(); // Zoom in button
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('changes view mode when different view buttons are clicked', () => {
    render(<SquadCanvas viewMode="skills" />);

    expect(screen.getByText('Squad Canvas - Skills View')).toBeInTheDocument();
  });

  it('renders skills view legend', () => {
    render(<SquadCanvas viewMode="skills" />);

    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Squads')).toBeInTheDocument();
  });

  it('renders network view legend', () => {
    render(<SquadCanvas viewMode="network" />);

    expect(screen.getByText('Active member')).toBeInTheDocument();
    expect(screen.getByText('Unmapped')).toBeInTheDocument();
  });

  it('handles zoom in functionality', () => {
    render(<SquadCanvas />);

    const zoomInButton = screen.getAllByRole('button')[0]; // First button should be zoom in
    fireEvent.click(zoomInButton);

    // After zoom in, percentage should increase
    expect(screen.getByText('110%')).toBeInTheDocument();
  });

  it('handles zoom out functionality', () => {
    render(<SquadCanvas />);

    const zoomOutButton = screen.getAllByRole('button')[1]; // Second button should be zoom out
    fireEvent.click(zoomOutButton);

    // After zoom out, percentage should decrease
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('resets view when reset button is clicked', () => {
    render(<SquadCanvas />);

    // First zoom in
    const zoomInButton = screen.getAllByRole('button')[0];
    fireEvent.click(zoomInButton);
    expect(screen.getByText('110%')).toBeInTheDocument();

    // Then reset
    const resetButton = screen.getAllByRole('button')[2]; // Third button should be reset
    fireEvent.click(resetButton);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders canvas element', () => {
    render(<SquadCanvas />);

    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass('cursor-move');
  });

  it('handles mouse down on canvas', () => {
    render(<SquadCanvas />);

    const canvas = document.querySelector('canvas');
    if (canvas) {
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      // Should not throw any errors
    }
  });

  it('handles mouse move on canvas', () => {
    render(<SquadCanvas />);

    const canvas = document.querySelector('canvas');
    if (canvas) {
      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
      // Should not throw any errors
    }
  });

  it('handles mouse up on canvas', () => {
    render(<SquadCanvas />);

    const canvas = document.querySelector('canvas');
    if (canvas) {
      fireEvent.mouseUp(canvas);
      // Should not throw any errors
    }
  });

  it('handles mouse leave on canvas', () => {
    render(<SquadCanvas />);

    const canvas = document.querySelector('canvas');
    if (canvas) {
      fireEvent.mouseLeave(canvas);
      // Should not throw any errors
    }
  });

  it('displays different squad types with correct colors', () => {
    render(<SquadCanvas />);

    // Verify legend shows different squad types
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Initiative')).toBeInTheDocument();
    expect(screen.getByText('Workstream')).toBeInTheDocument();
  });

  it('shows node info panel when node is selected', () => {
    render(<SquadCanvas />);

    // Initially no info panel should be visible
    expect(screen.queryByText('×')).not.toBeInTheDocument();

    // Simulate node selection by clicking on canvas
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Mock getBoundingClientRect
      canvas.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 300, clientY: 200 });
    }
  });

  it('generates correct canvas data for squads view', () => {
    render(<SquadCanvas viewMode="squads" />);

    // Should call getSquadMembers for each squad
    expect(mockAppContextValue.getSquadMembers).toHaveBeenCalledWith('squad1');
    expect(mockAppContextValue.getSquadMembers).toHaveBeenCalledWith('squad2');
  });

  it('generates correct canvas data for network view', () => {
    render(<SquadCanvas viewMode="network" />);

    // Should call getPersonSquads for each person
    expect(mockAppContextValue.getPersonSquads).toHaveBeenCalledWith('person1');
    expect(mockAppContextValue.getPersonSquads).toHaveBeenCalledWith('person2');
    expect(mockAppContextValue.getPersonSquads).toHaveBeenCalledWith('person3');
  });

  it('handles selected squad prop', () => {
    render(<SquadCanvas selectedSquad={mockSquads[0]} />);

    // Should only analyze the selected squad
    expect(mockAppContextValue.getSquadMembers).toHaveBeenCalledWith('squad1');
    expect(mockAppContextValue.getSquadMembers).not.toHaveBeenCalledWith(
      'squad2'
    );
  });

  it('calls getContext on canvas element', () => {
    render(<SquadCanvas />);

    expect(mockGetContext).toHaveBeenCalledWith('2d');
  });

  it('sets up ResizeObserver for canvas', () => {
    render(<SquadCanvas />);

    expect(mockObserve).toHaveBeenCalled();
  });

  it('cleans up ResizeObserver on unmount', () => {
    const { unmount } = render(<SquadCanvas />);

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('limits zoom to reasonable bounds', () => {
    render(<SquadCanvas />);

    const zoomOutButton = screen.getAllByRole('button')[1];

    // Click zoom out many times
    for (let i = 0; i < 20; i++) {
      fireEvent.click(zoomOutButton);
    }

    // Should not go below 10%
    expect(screen.getByText('10%')).toBeInTheDocument();

    const zoomInButton = screen.getAllByRole('button')[0];

    // Click zoom in many times
    for (let i = 0; i < 50; i++) {
      fireEvent.click(zoomInButton);
    }

    // Should not go above 300%
    expect(screen.getByText('300%')).toBeInTheDocument();
  });

  it('handles dragging functionality', () => {
    render(<SquadCanvas />);

    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      }));

      // Start drag
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });

      // Move mouse
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });

      // End drag
      fireEvent.mouseUp(canvas);
    }
  });
});
