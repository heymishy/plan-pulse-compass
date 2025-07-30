import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SkillsSettings from '@/components/settings/SkillsSettings';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';

// Mock the contexts and hooks
vi.mock('@/context/AppContext');
vi.mock('@/hooks/use-toast');

const mockUseApp = vi.mocked(useApp);
const mockUseToast = vi.mocked(useToast);

describe('SkillsSettings', () => {
  const mockToast = vi.fn();
  const mockSetSkills = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseToast.mockReturnValue({ toast: mockToast });

    mockUseApp.mockReturnValue({
      skills: [
        {
          id: 'skill-1',
          name: 'React',
          category: 'framework',
          description: 'Frontend framework',
          createdDate: '2024-01-01T00:00:00Z',
        },
      ],
      setSkills: mockSetSkills,
      personSkills: [],
      setPersonSkills: vi.fn(),
      // Add other required properties with mock values
      people: [],
      setPeople: vi.fn(),
      addPerson: vi.fn(),
      updatePerson: vi.fn(),
      deletePerson: vi.fn(),
      roles: [],
      setRoles: vi.fn(),
      teams: [],
      setTeams: vi.fn(),
      addTeam: vi.fn(),
      updateTeam: vi.fn(),
      deleteTeam: vi.fn(),
      teamMembers: [],
      setTeamMembers: vi.fn(),
      addTeamMember: vi.fn(),
      updateTeamMember: vi.fn(),
      removeTeamMember: vi.fn(),
      getTeamMembers: vi.fn(),
      divisions: [],
      setDivisions: vi.fn(),
      unmappedPeople: [],
      setUnmappedPeople: vi.fn(),
      addUnmappedPerson: vi.fn(),
      removeUnmappedPerson: vi.fn(),
      projects: [],
      setProjects: vi.fn(),
      addProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      epics: [],
      setEpics: vi.fn(),
      addEpic: vi.fn(),
      updateEpic: vi.fn(),
      deleteEpic: vi.fn(),
      milestones: [],
      setMilestones: vi.fn(),
      addMilestone: vi.fn(),
      updateMilestone: vi.fn(),
      deleteMilestone: vi.fn(),
      releases: [],
      setReleases: vi.fn(),
      addRelease: vi.fn(),
      updateRelease: vi.fn(),
      deleteRelease: vi.fn(),
      solutions: [],
      setSolutions: vi.fn(),
      addSolution: vi.fn(),
      updateSolution: vi.fn(),
      deleteSolution: vi.fn(),
      projectSolutions: [],
      setProjectSolutions: vi.fn(),
      addProjectSolution: vi.fn(),
      removeProjectSolution: vi.fn(),
      projectSkills: [],
      setProjectSkills: vi.fn(),
      addProjectSkill: vi.fn(),
      removeProjectSkill: vi.fn(),
      allocations: [],
      setAllocations: vi.fn(),
      addAllocation: vi.fn(),
      updateAllocation: vi.fn(),
      deleteAllocation: vi.fn(),
      cycles: [],
      setCycles: vi.fn(),
      runWorkCategories: [],
      setRunWorkCategories: vi.fn(),
      actualAllocations: [],
      setActualAllocations: vi.fn(),
      addActualAllocation: vi.fn(),
      updateActualAllocation: vi.fn(),
      deleteActualAllocation: vi.fn(),
      iterationReviews: [],
      setIterationReviews: vi.fn(),
      iterationSnapshots: [],
      setIterationSnapshots: vi.fn(),
      config: null,
      setConfig: vi.fn(),
      isSetupComplete: true,
      setIsSetupComplete: vi.fn(),
      goals: [],
      setGoals: vi.fn(),
      addGoal: vi.fn(),
      updateGoal: vi.fn(),
      deleteGoal: vi.fn(),
      northStars: [],
      setNorthStars: vi.fn(),
      addNorthStar: vi.fn(),
      updateNorthStar: vi.fn(),
      deleteNorthStar: vi.fn(),
      goalEpics: [],
      setGoalEpics: vi.fn(),
      goalMilestones: [],
      setGoalMilestones: vi.fn(),
      goalTeams: [],
      setGoalTeams: vi.fn(),
      divisionLeadershipRoles: [],
      setDivisionLeadershipRoles: vi.fn(),
    } as any);
  });

  it('should handle missing setSkills function gracefully (testing defensive coding)', async () => {
    // This test verifies that we handle missing setSkills gracefully
    // Remove setSkills from the mock to simulate a broken context
    mockUseApp.mockReturnValue({
      ...mockUseApp(),
      setSkills: undefined, // This simulates the missing function
    } as any);

    const user = userEvent.setup();

    // This should not crash during render
    expect(() => {
      render(<SkillsSettings />);
    }).not.toThrow();

    // The component should render successfully
    expect(screen.getByText('Skills Management')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add skill/i })
    ).toBeInTheDocument();
  });

  it('should successfully add a skill when setSkills function is properly available', async () => {
    // This test will pass once we fix the context
    const user = userEvent.setup();

    render(<SkillsSettings />);

    // Try to add a new skill
    const addButton = screen.getByRole('button', { name: /add skill/i });
    await user.click(addButton);

    // Fill in the form
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'TypeScript');

    // Save the skill
    const saveButton = screen.getByRole('button', { name: /create/i });
    await user.click(saveButton);

    // Verify setSkills was called
    expect(mockSetSkills).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Skill created successfully',
    });
  });
});
