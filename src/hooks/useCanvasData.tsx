import { useMemo } from 'react';
import { Edge, Node } from '@xyflow/react';
import { useApp } from '@/context/AppContext';
import { CanvasViewType } from '@/types';
import { filterCanvasData } from '@/utils/canvas/canvasFilters';
import {
  generatePeopleTeamsView,
  generateProjectsMilestonesView,
  generatePeopleSkillsView,
  generateTeamSkillsSummaryView,
  generateFinancialOverviewView,
  generateTeamsProjectsView,
  generateProjectsEpicsView,
  generateTeamAllocationsView,
} from '@/utils/canvas/nodeEdgeGenerators';


interface UseCanvasDataProps {
  viewType: CanvasViewType;
  selectedDivision: string;
  selectedTeam: string;
  selectedProject: string;
}

export const useCanvasData = ({
  viewType,
  selectedDivision,
  selectedTeam,
  selectedProject,
}: UseCanvasDataProps) => {
  const { people, roles, teams, projects, epics, allocations, divisions, runWorkCategories, skills, personSkills, cycles } = useApp();

  const { nodes, edges, stats } = useMemo(() => {
    const {
      divisionsToShow,
      teamsToShow,
      projectsToShow,
      epicsToShow,
      allocationsToShow,
      peopleToShow,
      teamIdsToShow,
    } = filterCanvasData({
      selectedDivision,
      selectedTeam,
      selectedProject,
      divisions,
      teams,
      projects,
      epics,
      people,
      allocations,
    });

    let currentNodes: Node[] = [];
    let currentEdges: Edge[] = [];

    switch (viewType) {
      case 'people-teams': {
        const res = generatePeopleTeamsView({ teamsToShow, peopleToShow, roles });
        currentNodes = res.nodes;
        currentEdges = res.edges;
        break;
      }
      case 'projects-milestones': {
        const res = generateProjectsMilestonesView({ projectsToShow });
        currentNodes = res.nodes;
        currentEdges = res.edges;
        break;
      }
      case 'people-skills': {
        const res = generatePeopleSkillsView({ peopleToShow, personSkills, skills });
        currentNodes = res.nodes;
        currentEdges = res.edges;
        break;
      }
      case 'team-skills-summary': {
        const res = generateTeamSkillsSummaryView({ teamsToShow, people, personSkills, skills });
        currentNodes = res.nodes;
        currentEdges = res.edges;
        break;
      }
      case 'financial-overview': {
        const res = generateFinancialOverviewView({
          divisionsToShow,
          teamsToShow,
          projectsToShow,
          epics,
          allocations,
          cycles,
          people,
          roles,
          teamIdsToShow,
          teams,
        });
        currentNodes = res.nodes;
        currentEdges = res.edges;
        break;
      }
      case 'teams-projects': {
        const res = generateTeamsProjectsView({ divisionsToShow, teamsToShow, projectsToShow });
        currentNodes = res.nodes;
        currentEdges = res.edges;
        break;
      }
      case 'projects-epics': {
        const res = generateProjectsEpicsView({ projectsToShow, epicsToShow, teamsToShow });
        currentNodes = res.nodes;
        currentEdges = res.edges;
        break;
      }
      case 'team-allocations': {
        const res = generateTeamAllocationsView({
          divisionsToShow,
          teamsToShow,
          projectsToShow,
          epicsToShow,
          allocationsToShow,
          runWorkCategories,
        });
        currentNodes = res.nodes;
        currentEdges = res.edges;
        break;
      }
      case 'all': {
        const tp = generateTeamsProjectsView({ divisionsToShow, teamsToShow, projectsToShow });
        const pe = generateProjectsEpicsView({ projectsToShow, epicsToShow, teamsToShow, isAllView: true });

        currentNodes = [...tp.nodes, ...pe.nodes];
        currentEdges = [...tp.edges, ...pe.edges];
        break;
      }
    }

    const finalStats = {
      divisions: divisionsToShow.length,
      teams: teamsToShow.length,
      projects: projectsToShow.length,
      epics: epicsToShow.length,
      allocations: allocationsToShow.length,
      people: peopleToShow.length,
    };

    return { nodes: currentNodes, edges: currentEdges, stats: finalStats };
  }, [people, roles, teams, projects, epics, allocations, divisions, runWorkCategories, skills, personSkills, cycles, viewType, selectedDivision, selectedTeam, selectedProject]);

  return { nodes, edges, stats };
};
