import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import { useScenarioAwareOperations } from '../useScenarioAwareOperations';
import { useScenarios } from '@/context/ScenarioContext';
import { useTeams } from '@/context/TeamContext';
import { useProjects } from '@/context/ProjectContext';
import { usePlanning } from '@/context/PlanningContext';
import { useGoals } from '@/context/GoalContext';
import { useToast } from '@/hooks/use-toast';

// Mock the dependencies
vi.mock('@/context/ScenarioContext');
vi.mock('@/context/TeamContext');
vi.mock('@/context/ProjectContext');
vi.mock('@/context/PlanningContext');
vi.mock('@/context/GoalContext');
vi.mock('@/hooks/use-toast');

const mockUseScenarios = useScenarios as ReturnType<typeof vi.fn>;
const mockUseTeams = useTeams as ReturnType<typeof vi.fn>;
const mockUseProjects = useProjects as ReturnType<typeof vi.fn>;
const mockUsePlanning = usePlanning as ReturnType<typeof vi.fn>;
const mockUseGoals = useGoals as ReturnType<typeof vi.fn>;
const mockUseToast = useToast as ReturnType<typeof vi.fn>;

describe('useScenarioAwareOperations', () => {
  const mockToast = vi.fn();
  const mockUpdateScenario = vi.fn();
  const mockGetCurrentData = vi.fn();
  const mockAddPerson = vi.fn();
  const mockUpdatePerson = vi.fn();
  const mockAddTeam = vi.fn();
  const mockUpdateTeam = vi.fn();
  const mockDeleteTeam = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseToast.mockReturnValue({ toast: mockToast });
    mockUseTeams.mockReturnValue({
      addPerson: mockAddPerson,
      updatePerson: mockUpdatePerson,
      addTeam: mockAddTeam,
      updateTeam: mockUpdateTeam,
      deleteTeam: mockDeleteTeam,
    } as any);
    mockUseProjects.mockReturnValue({} as any);
    mockUsePlanning.mockReturnValue({} as any);
    mockUseGoals.mockReturnValue({} as any);
  });

  describe('when not in scenario mode', () => {
    beforeEach(() => {
      mockUseScenarios.mockReturnValue({
        isInScenarioMode: false,
        activeScenarioId: null,
        updateScenario: mockUpdateScenario,
        getCurrentData: mockGetCurrentData,
        scenarios: [],
      } as any);
    });

    it('should delegate person operations to live context', async () => {
      const { result } = renderHook(() => useScenarioAwareOperations());

      const personData = { name: 'John Doe', email: 'john@example.com' };
      const expectedPerson = { id: '123', ...personData };
      mockAddPerson.mockResolvedValue(expectedPerson);

      await act(async () => {
        const person = await result.current.person.add(personData);
        expect(person).toEqual(expectedPerson);
      });

      expect(mockAddPerson).toHaveBeenCalledWith(personData);
      expect(mockUpdateScenario).not.toHaveBeenCalled();
    });

    it('should delegate team operations to live context', async () => {
      const { result } = renderHook(() => useScenarioAwareOperations());

      const teamData = { name: 'Engineering Team', capacity: 40 };

      await act(async () => {
        await result.current.team.update('team-1', teamData);
      });

      expect(mockUpdateTeam).toHaveBeenCalledWith('team-1', teamData);
      expect(mockUpdateScenario).not.toHaveBeenCalled();
    });
  });

  describe('when in scenario mode', () => {
    const mockCurrentData = {
      people: [{ id: 'person-1', name: 'Jane Doe', email: 'jane@example.com' }],
      teams: [{ id: 'team-1', name: 'Dev Team', capacity: 40 }],
      teamMembers: [{ id: 'member-1', personId: 'person-1', teamId: 'team-1' }],
      projects: [],
      allocations: [],
      // ... other data
    };

    const mockScenario = {
      id: 'scenario-1',
      name: 'Test Scenario',
      modifications: [],
      metadata: { totalModifications: 0, lastAccessDate: '2024-01-01' },
    };

    beforeEach(() => {
      mockUseScenarios.mockReturnValue({
        isInScenarioMode: true,
        activeScenarioId: 'scenario-1',
        updateScenario: mockUpdateScenario,
        getCurrentData: mockGetCurrentData,
        scenarios: [mockScenario],
      } as any);

      mockGetCurrentData.mockReturnValue(mockCurrentData);
      mockUpdateScenario.mockResolvedValue(undefined);
    });

    it('should create scenario-aware person operations', async () => {
      const { result } = renderHook(() => useScenarioAwareOperations());

      const personData = {
        name: 'John Smith',
        email: 'john.smith@example.com',
      };

      await act(async () => {
        const person = await result.current.person.add(personData);
        expect(person).toMatchObject(personData);
        expect(person.id).toBeDefined();
      });

      expect(mockUpdateScenario).toHaveBeenCalledWith(
        'scenario-1',
        expect.objectContaining({
          data: expect.objectContaining({
            people: expect.arrayContaining([
              expect.objectContaining(personData),
            ]),
          }),
          modifications: expect.arrayContaining([
            expect.objectContaining({
              type: 'create',
              entityType: 'people',
              description: expect.stringContaining('Added person: John Smith'),
            }),
          ]),
        })
      );

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Scenario Updated',
        description: expect.stringContaining('Added person: John Smith'),
      });
    });

    it('should update existing person in scenario', async () => {
      const { result } = renderHook(() => useScenarioAwareOperations());

      const updateData = { name: 'Jane Smith' };

      await act(async () => {
        await result.current.person.update('person-1', updateData);
      });

      expect(mockUpdateScenario).toHaveBeenCalledWith(
        'scenario-1',
        expect.objectContaining({
          data: expect.objectContaining({
            people: expect.arrayContaining([
              expect.objectContaining({ id: 'person-1', name: 'Jane Smith' }),
            ]),
          }),
          modifications: expect.arrayContaining([
            expect.objectContaining({
              type: 'update',
              entityType: 'people',
              entityId: 'person-1',
              changes: expect.arrayContaining([
                expect.objectContaining({
                  field: 'name',
                  oldValue: 'Jane Doe',
                  newValue: 'Jane Smith',
                }),
              ]),
            }),
          ]),
        })
      );
    });

    it('should delete person from scenario', async () => {
      const { result } = renderHook(() => useScenarioAwareOperations());

      await act(async () => {
        await result.current.person.delete('person-1');
      });

      expect(mockUpdateScenario).toHaveBeenCalledWith(
        'scenario-1',
        expect.objectContaining({
          data: expect.objectContaining({
            people: [],
            teamMembers: [], // Should also remove from team members
          }),
          modifications: expect.arrayContaining([
            expect.objectContaining({
              type: 'delete',
              entityType: 'people',
              entityId: 'person-1',
            }),
          ]),
        })
      );
    });

    it('should handle team operations in scenario mode', async () => {
      const { result } = renderHook(() => useScenarioAwareOperations());

      const teamData = {
        name: 'New Team',
        capacity: 30,
        description: 'Test team',
      };

      await act(async () => {
        const team = await result.current.team.add(teamData);
        expect(team).toMatchObject(teamData);
        expect(team.id).toBeDefined();
        expect(team.createdDate).toBeDefined();
        expect(team.lastModified).toBeDefined();
      });

      expect(mockUpdateScenario).toHaveBeenCalledWith(
        'scenario-1',
        expect.objectContaining({
          data: expect.objectContaining({
            teams: expect.arrayContaining([expect.objectContaining(teamData)]),
          }),
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const { result } = renderHook(() => useScenarioAwareOperations());

      mockUpdateScenario.mockRejectedValue(new Error('Update failed'));

      await act(async () => {
        await result.current.person.add({ name: 'Test Person' });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to update scenario. Please try again.',
        variant: 'destructive',
      });
    });

    it('should not perform operations on non-existent entities', async () => {
      const { result } = renderHook(() => useScenarioAwareOperations());

      await act(async () => {
        await result.current.person.update('non-existent-id', {
          name: 'Updated',
        });
      });

      // Should not call updateScenario if entity doesn't exist
      expect(mockUpdateScenario).not.toHaveBeenCalled();
    });
  });

  describe('allocation operations', () => {
    it('should handle allocation operations in scenario mode', async () => {
      const mockCurrentData = {
        people: [],
        teams: [],
        projects: [],
        allocations: [
          {
            id: 'alloc-1',
            teamId: 'team-1',
            cycleId: 'cycle-1',
            iterationNumber: 1,
            percentage: 80,
          },
        ],
      };

      mockUseScenarios.mockReturnValue({
        isInScenarioMode: true,
        activeScenarioId: 'scenario-1',
        updateScenario: mockUpdateScenario,
        getCurrentData: vi.fn().mockReturnValue(mockCurrentData),
        scenarios: [
          {
            id: 'scenario-1',
            modifications: [],
            metadata: { totalModifications: 0, lastAccessDate: '2024-01-01' },
          },
        ],
      } as any);

      const { result } = renderHook(() => useScenarioAwareOperations());

      const allocationData = {
        teamId: 'team-1',
        cycleId: 'cycle-1',
        iterationNumber: 1,
        epicId: 'epic-1',
        percentage: 50,
        notes: '',
      };

      await act(async () => {
        const allocation = await result.current.allocation.add(allocationData);
        expect(allocation).toMatchObject(allocationData);
        expect(allocation.id).toBeDefined();
      });

      expect(mockUpdateScenario).toHaveBeenCalledWith(
        'scenario-1',
        expect.objectContaining({
          data: expect.objectContaining({
            allocations: expect.arrayContaining([
              expect.objectContaining(allocationData),
            ]),
          }),
        })
      );
    });
  });
});
