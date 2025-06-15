
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

  if (selectedDivision !== 'all') {
      divisionsToShow = divisionsToShow.filter(d => d.id === selectedDivision);
      teamsToShow = teamsToShow.filter(t => t.divisionId === selectedDivision);
  }

  if (selectedTeam !== 'all') {
      teamsToShow = teamsToShow.filter(t => t.id === selectedTeam);
      const team = teams.find(t => t.id === selectedTeam);
      if (team?.divisionId) {
          divisionsToShow = divisionsToShow.filter(d => d.id === team.divisionId);
      } else if (selectedDivision === 'all') {
          divisionsToShow = [];
      }
  }
  
  let epicsToShow: Epic[];
  if (selectedProject !== 'all') {
      projectsToShow = projectsToShow.filter(p => p.id === selectedProject);
      epicsToShow = epics.filter(e => e.projectId === selectedProject);
      const teamsForProject = new Set(epicsToShow.map(e => e.assignedTeamId).filter(Boolean));
      teamsToShow = teamsToShow.filter(t => teamsForProject.has(t.id));
      
      const divisionsForTeams = new Set(teamsToShow.map(t => t.divisionId).filter(Boolean));
      divisionsToShow = divisionsToShow.filter(d => divisionsForTeams.has(d.id));
  } else {
      const teamsToRender = new Set(teamsToShow.map(t => t.id));
      epicsToShow = epics.filter(e => e.assignedTeamId && teamsToRender.has(e.assignedTeamId));
      const projectsForTeams = new Set(epicsToShow.map(e => e.projectId));
      projectsToShow = projects.filter(p => projectsForTeams.has(p.id));
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
