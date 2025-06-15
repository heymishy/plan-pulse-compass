
import { Division, Team, Project, Epic, Person, Allocation } from '@/types';

interface FilterProps {
  selectedDivision: string;
  selectedTeam: string;
  selectedProject: string;
  divisions: Division[];
  teams: Team[];
  projects: Project[];
  epics: Epic[];
  people: Person[];
  allocations: Allocation[];
}

export const filterCanvasData = ({
  selectedDivision,
  selectedTeam,
  selectedProject,
  divisions,
  teams,
  projects,
  epics,
  people,
  allocations,
}: FilterProps) => {
  let divisionsToShow: Division[] = [...divisions];
  let teamsToShow: Team[] = [...teams];
  let projectsToShow: Project[] = [...projects];
  let epicsToShow: Epic[] = [...epics];

  // Filter by division
  if (selectedDivision !== 'all') {
    divisionsToShow = divisionsToShow.filter(d => d.id === selectedDivision);
    teamsToShow = teamsToShow.filter(t => t.divisionId === selectedDivision);
  }

  // Filter by team
  if (selectedTeam !== 'all') {
    teamsToShow = teamsToShow.filter(t => t.id === selectedTeam);
    const team = teams.find(t => t.id === selectedTeam);
    if (team?.divisionId) {
      divisionsToShow = divisions.filter(d => d.id === team.divisionId);
    } else if (selectedDivision === 'all') {
      divisionsToShow = [];
    }
  }

  // If a division or team is selected, filter projects and epics based on team involvement
  if (selectedDivision !== 'all' || selectedTeam !== 'all') {
    const teamIds = new Set(teamsToShow.map(t => t.id));
    
    const relevantAllocations = allocations.filter(a => teamIds.has(a.teamId));
    const epicIdsFromAllocs = new Set(relevantAllocations.map(a => a.epicId).filter(Boolean));
    
    const epicsAssignedToTeams = epics.filter(e => e.assignedTeamId && teamIds.has(e.assignedTeamId));
    const epicIdsFromAssignment = new Set(epicsAssignedToTeams.map(e => e.id));
    
    const allRelevantEpicIds = new Set([...epicIdsFromAllocs, ...epicIdsFromAssignment]);
    epicsToShow = epics.filter(e => allRelevantEpicIds.has(e.id));
    
    const projectIds = new Set(epicsToShow.map(e => e.projectId).filter(Boolean));
    projectsToShow = projects.filter(p => projectIds.has(p.id));
  }
  
  // Filter by project
  if (selectedProject !== 'all') {
    projectsToShow = projectsToShow.filter(p => p.id === selectedProject);
    const projectIds = new Set(projectsToShow.map(p => p.id));
    // Further filter epics to only those in the selected project
    epicsToShow = epicsToShow.filter(e => e.projectId && projectIds.has(e.projectId));
  }

  const teamIdsToShow = new Set(teamsToShow.map(t => t.id));
  const allocationsToShow = allocations.filter(a => teamIdsToShow.has(a.teamId));
  const peopleToShow = people.filter(p => p.teamId && teamIdsToShow.has(p.teamId));

  return {
    divisionsToShow,
    teamsToShow,
    projectsToShow,
    epicsToShow,
    allocationsToShow,
    peopleToShow,
    teamIdsToShow,
  };
};
