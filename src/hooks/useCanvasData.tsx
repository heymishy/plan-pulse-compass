import { useMemo } from 'react';
import { Edge, Node } from '@xyflow/react';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/badge';
import { Users, FolderOpen, Target, Zap, PersonStanding, Flag, Star } from 'lucide-react';
import { CanvasViewType, PersonSkill } from '@/types';

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
  const { people, roles, teams, projects, epics, allocations, divisions, runWorkCategories, skills, personSkills } = useApp();

  const { nodes, edges, stats } = useMemo(() => {
    let divisionsToShow = [...divisions];
    let teamsToShow = [...teams];
    let projectsToShow = [...projects];

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
    
    let epicsToShow;
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
    
    const allocationsToShow = allocations.filter(a => new Set(teamsToShow.map(t => t.id)).has(a.teamId));

    const finalTeamIds = new Set(teamsToShow.map(t => t.id));
    const peopleToShow = people.filter(p => p.teamId && finalTeamIds.has(p.teamId));

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (viewType === 'people-teams') {
      // Add team nodes and people nodes for this specific view
      teamsToShow.forEach((team, teamIndex) => {
        nodes.push({
          id: `team-${team.id}`,
          type: 'default',
          position: { x: teamIndex * 450, y: 50 },
          data: { 
            label: (
              <div className="text-center">
                <Users className="h-4 w-4 mx-auto mb-1" />
                <div className="font-medium">{team.name}</div>
                <div className="text-xs text-gray-500">{team.capacity}h/week</div>
              </div>
            )
          },
          style: { 
            background: '#dcfce7', 
            border: '2px solid #16a34a',
            borderRadius: '8px',
            width: 120,
            height: 80
          },
        });
        
        const peopleInTeam = peopleToShow.filter(p => p.teamId === team.id);
        const numCols = Math.min(peopleInTeam.length, 4);
        const gridWidth = numCols * 80 + (numCols - 1) * 10;
        const startX = (teamIndex * 450) + (120 / 2) - (gridWidth / 2);

        peopleInTeam.forEach((person, personIndex) => {
          const role = roles.find(r => r.id === person.roleId);
          const col = personIndex % numCols;
          const row = Math.floor(personIndex / numCols);

          nodes.push({
            id: `person-${person.id}`,
            type: 'default',
            position: { 
              x: startX + col * 90, 
              y: 180 + row * 90,
            },
            data: { 
              label: (
                <div className="text-center">
                  <PersonStanding className="h-4 w-4 mx-auto mb-1" />
                  <div className="font-medium text-xs">{person.name}</div>
                  <div className="text-xs text-gray-500">{role?.name || 'No Role'}</div>
                </div>
              )
            },
            style: { 
              background: '#e0f2fe',
              border: '2px solid #0ea5e9',
              borderRadius: '50%',
              width: 80,
              height: 80,
            },
          });

          if (person.teamId) {
            edges.push({
              id: `team-person-${person.teamId}-${person.id}`,
              source: `team-${person.teamId}`,
              target: `person-${person.id}`,
              type: 'smoothstep',
              style: { stroke: '#16a34a' },
            });
          }
        });
      });
    } else if (viewType === 'projects-milestones') {
      projectsToShow.forEach((project, projectIndex) => {
        // Project node
        nodes.push({
          id: `project-${project.id}`,
          type: 'default',
          position: { x: 0, y: projectIndex * 220 },
          data: {
            label: (
              <div className="text-center">
                <FolderOpen className="h-4 w-4 mx-auto mb-1" />
                <div className="font-medium text-sm">{project.name}</div>
              </div>
            )
          },
          style: {
            background: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            width: 140,
            height: 70
          },
        });

        // Milestone nodes
        project.milestones.forEach((milestone, milestoneIndex) => {
          nodes.push({
            id: `milestone-${milestone.id}`,
            type: 'default',
            position: { x: 200 + milestoneIndex * 160, y: projectIndex * 220 },
            data: {
              label: (
                <div className="text-center">
                  <Flag className="h-4 w-4 mx-auto mb-1" />
                  <div className="font-medium text-xs">{milestone.name}</div>
                  <div className="text-xs text-gray-500">{milestone.dueDate}</div>
                  <Badge variant={milestone.status === 'completed' ? 'default' : 'secondary'} className="text-xs">{milestone.status}</Badge>
                </div>
              )
            },
            style: {
              background: '#e5e7eb',
              border: '2px solid #6b7280',
              borderRadius: '8px',
              width: 140,
              height: 85,
            },
          });

          // Edge from project to milestone
          edges.push({
            id: `project-milestone-${project.id}-${milestone.id}`,
            source: `project-${project.id}`,
            target: `milestone-${milestone.id}`,
            type: 'smoothstep',
            style: { stroke: '#f59e0b' },
          });
        });
      });
    } else if (viewType === 'people-skills') {
      const personNodeIds = new Set(peopleToShow.map(p => p.id));
      const relevantPersonSkills = personSkills.filter(ps => personNodeIds.has(ps.personId));
      const skillIds = new Set(relevantPersonSkills.map(ps => ps.skillId));
      const skillsToShow = skills.filter(s => skillIds.has(s.id));

      // People nodes
      peopleToShow.forEach((person, index) => {
        nodes.push({
          id: `person-${person.id}`,
          type: 'default',
          position: { x: 50, y: 50 + index * 100 },
          data: {
            label: (
              <div className="text-center">
                <PersonStanding className="h-4 w-4 mx-auto mb-1" />
                <div className="font-medium text-xs">{person.name}</div>
              </div>
            )
          },
          style: {
            background: '#e0f2fe',
            border: '2px solid #0ea5e9',
            borderRadius: '8px',
            width: 120,
            height: 60,
          },
        });
      });

      // Skill nodes
      skillsToShow.forEach((skill, index) => {
        nodes.push({
          id: `skill-${skill.id}`,
          type: 'default',
          position: { x: 400, y: 50 + index * 90 },
          data: {
            label: (
              <div className="text-center">
                <Star className="h-4 w-4 mx-auto mb-1" />
                <div className="font-medium text-xs">{skill.name}</div>
                <Badge variant="outline" className="text-xs mt-1">{skill.category}</Badge>
              </div>
            )
          },
          style: {
            background: '#eef2ff',
            border: '2px solid #6366f1',
            borderRadius: '8px',
            width: 120,
            height: 70
          }
        });
      });

      // Edges
      relevantPersonSkills.forEach(ps => {
        edges.push({
          id: `person-skill-${ps.personId}-${ps.skillId}`,
          source: `person-${ps.personId}`,
          target: `skill-${ps.skillId}`,
          type: 'smoothstep',
          label: ps.proficiencyLevel,
          style: { stroke: '#6366f1', strokeDasharray: '3,3' },
        });
      });
    } else if (viewType === 'team-skills-summary') {
        const teamSkillSummaries = new Map<string, Map<string, { count: number, proficiencies: PersonSkill['proficiencyLevel'][] }>>();
        
        teamsToShow.forEach(team => {
            const peopleInTeam = people.filter(p => p.teamId === team.id);
            const teamSkills = new Map<string, { count: number, proficiencies: PersonSkill['proficiencyLevel'][] }>();
            
            peopleInTeam.forEach(person => {
                const personSkillsForPerson = personSkills.filter(ps => ps.personId === person.id);
                personSkillsForPerson.forEach(ps => {
                    if (!teamSkills.has(ps.skillId)) {
                        teamSkills.set(ps.skillId, { count: 0, proficiencies: [] });
                    }
                    const skillSummary = teamSkills.get(ps.skillId)!;
                    skillSummary.count++;
                    skillSummary.proficiencies.push(ps.proficiencyLevel);
                });
            });
            teamSkillSummaries.set(team.id, teamSkills);
        });
        
        const allSkillIds = new Set<string>();
        teamSkillSummaries.forEach(skillMap => {
            skillMap.forEach((_, skillId) => allSkillIds.add(skillId));
        });
        const skillsToShow = skills.filter(s => allSkillIds.has(s.id));

        // Team nodes
        teamsToShow.forEach((team, index) => {
            nodes.push({
                id: `team-${team.id}`,
                type: 'default',
                position: { x: 50, y: 50 + index * 100 },
                data: { label: (<div className="font-medium">{team.name}</div>) },
                style: {
                    background: '#dcfce7', 
                    border: '2px solid #16a34a',
                    borderRadius: '8px',
                    width: 150,
                    height: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                },
            });
        });

        // Skill nodes
        skillsToShow.forEach((skill, index) => {
            nodes.push({
                id: `skill-${skill.id}`,
                type: 'default',
                position: { x: 400, y: 50 + index * 80 },
                data: { label: (<div className="font-medium">{skill.name}</div>) },
                style: {
                    background: '#eef2ff',
                    border: '2px solid #6366f1',
                    borderRadius: '8px',
                    width: 120,
                    height: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                },
            });
        });

        // Edges
        teamSkillSummaries.forEach((skillMap, teamId) => {
            skillMap.forEach((summary, skillId) => {
                edges.push({
                    id: `team-skill-${teamId}-${skillId}`,
                    source: `team-${teamId}`,
                    target: `skill-${skillId}`,
                    type: 'smoothstep',
                    label: `${summary.count} ${summary.count > 1 ? 'people' : 'person'}`,
                    style: { stroke: '#16a34a', strokeDasharray: '5,5' },
                });
            });
        });
    } else if (viewType === 'all' || viewType === 'teams-projects') {
      // Add division nodes
      divisionsToShow.forEach((division, index) => {
        nodes.push({
          id: `division-${division.id}`,
          type: 'default',
          position: { x: index * 300, y: 0 },
          data: { 
            label: (
              <div className="text-center">
                <div className="font-semibold text-blue-600">{division.name}</div>
                <div className="text-xs text-gray-500">Division</div>
              </div>
            )
          },
          style: { 
            background: '#dbeafe', 
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            width: 150,
            height: 60
          },
        });
      });

      // Add team nodes
      teamsToShow.forEach((team, index) => {
        const divisionIndex = divisionsToShow.findIndex(d => d.id === team.divisionId);
        
        nodes.push({
          id: `team-${team.id}`,
          type: 'default',
          position: { 
            x: divisionIndex >= 0 ? divisionIndex * 300 + (index % 3) * 100 : index * 200, 
            y: 120 
          },
          data: { 
            label: (
              <div className="text-center">
                <Users className="h-4 w-4 mx-auto mb-1" />
                <div className="font-medium">{team.name}</div>
                <div className="text-xs text-gray-500">{team.capacity}h/week</div>
              </div>
            )
          },
          style: { 
            background: '#dcfce7', 
            border: '2px solid #16a34a',
            borderRadius: '8px',
            width: 120,
            height: 80
          },
        });

        // Connect team to division
        if (team.divisionId) {
          edges.push({
            id: `division-team-${team.divisionId}-${team.id}`,
            source: `division-${team.divisionId}`,
            target: `team-${team.id}`,
            type: 'smoothstep',
            style: { stroke: '#3b82f6' },
          });
        }
      });

      // Add project nodes
      projectsToShow.forEach((project, index) => {
        nodes.push({
          id: `project-${project.id}`,
          type: 'default',
          position: { x: index * 180, y: 300 },
          data: { 
            label: (
              <div className="text-center">
                <FolderOpen className="h-4 w-4 mx-auto mb-1" />
                <div className="font-medium text-sm">{project.name}</div>
                <Badge 
                  variant={project.status === 'active' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {project.status}
                </Badge>
              </div>
            )
          },
          style: { 
            background: '#fef3c7', 
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            width: 140,
            height: 90
          },
        });
      });
    }

    if (viewType === 'all' || viewType === 'projects-epics') {
      // Add epic nodes
      epicsToShow.forEach((epic, index) => {
        const projectIndex = projectsToShow.findIndex(p => p.id === epic.projectId);
        
        nodes.push({
          id: `epic-${epic.id}`,
          type: 'default',
          position: { 
            x: projectIndex >= 0 ? projectIndex * 180 + (index % 2) * 80 : index * 150, 
            y: 450 
          },
          data: { 
            label: (
              <div className="text-center">
                <Target className="h-4 w-4 mx-auto mb-1" />
                <div className="font-medium text-xs">{epic.name}</div>
                <div className="text-xs text-gray-500">{epic.estimatedEffort} pts</div>
                <Badge 
                  variant={epic.status === 'completed' ? 'default' : 'outline'}
                  className="text-xs"
                >
                  {epic.status}
                </Badge>
              </div>
            )
          },
          style: { 
            background: '#fce7f3', 
            border: '2px solid #ec4899',
            borderRadius: '8px',
            width: 110,
            height: 85
          },
        });

        // Connect epic to project
        if (epic.projectId) {
          edges.push({
            id: `project-epic-${epic.projectId}-${epic.id}`,
            source: `project-${epic.projectId}`,
            target: `epic-${epic.id}`,
            type: 'smoothstep',
            style: { stroke: '#f59e0b' },
          });
        }

        // Connect epic to assigned team
        if (epic.assignedTeamId) {
          edges.push({
            id: `team-epic-${epic.assignedTeamId}-${epic.id}`,
            source: `team-${epic.assignedTeamId}`,
            target: `epic-${epic.id}`,
            type: 'smoothstep',
            style: { stroke: '#16a34a', strokeDasharray: '5,5' },
          });
        }
      });
    }

    if (viewType === 'team-allocations') {
      // Add run work category nodes
      runWorkCategories.forEach((category, index) => {
        nodes.push({
          id: `category-${category.id}`,
          type: 'default',
          position: { x: index * 200, y: 300 },
          data: { 
            label: (
              <div className="text-center">
                <Zap className="h-4 w-4 mx-auto mb-1" />
                <div className="font-medium text-sm">{category.name}</div>
                <div className="text-xs text-gray-500">Run Work</div>
              </div>
            )
          },
          style: { 
            background: category.color || '#f3f4f6', 
            border: '2px solid #6b7280',
            borderRadius: '8px',
            width: 120,
            height: 70
          },
        });
      });

      // Show allocation connections
      allocationsToShow.forEach(allocation => {
        if (allocation.epicId) {
          const epicExists = nodes.some(n => n.id === `epic-${allocation.epicId}`);
          const teamExists = nodes.some(n => n.id === `team-${allocation.teamId}`);
          
          if (epicExists && teamExists) {
            edges.push({
              id: `allocation-epic-${allocation.id}`,
              source: `team-${allocation.teamId}`,
              target: `epic-${allocation.epicId}`,
              type: 'smoothstep',
              label: `${allocation.percentage}%`,
              style: { stroke: '#8b5cf6' },
            });
          }
        } else if (allocation.runWorkCategoryId) {
          const categoryExists = nodes.some(n => n.id === `category-${allocation.runWorkCategoryId}`);
          const teamExists = nodes.some(n => n.id === `team-${allocation.teamId}`);
          
          if (categoryExists && teamExists) {
            edges.push({
              id: `allocation-category-${allocation.id}`,
              source: `team-${allocation.teamId}`,
              target: `category-${allocation.runWorkCategoryId}`,
              type: 'smoothstep',
              label: `${allocation.percentage}%`,
              style: { stroke: '#6b7280' },
            });
          }
        }
      });
    }

    const finalStats = {
      teams: teamsToShow.length,
      projects: projectsToShow.length,
      epics: epicsToShow.length,
      allocations: allocationsToShow.length,
      people: peopleToShow.length,
    };

    return { nodes, edges, stats: finalStats };
  }, [people, roles, teams, projects, epics, allocations, divisions, runWorkCategories, skills, personSkills, viewType, selectedDivision, selectedTeam, selectedProject]);

  return { nodes, edges, stats };
};
