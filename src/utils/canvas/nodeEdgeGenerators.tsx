import React from 'react';
import { Edge, Node } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Users, FolderOpen, Target, Zap, PersonStanding, Flag, Star, DollarSign, Building, Cog, Lightbulb } from 'lucide-react';
import { Person, Role, Team, Division, Project, Epic, RunWorkCategory, Allocation, Skill, PersonSkill, Cycle, Solution, ProjectSolution } from '@/types';
import { calculateProjectCost, calculateTeamWeeklyCost } from '@/utils/financialCalculations';

export const generatePeopleTeamsView = ({ teamsToShow, peopleToShow, roles }: { teamsToShow: Team[], peopleToShow: Person[], roles: Role[] }): { nodes: Node[], edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

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
    return { nodes, edges };
}

export const generateProjectsMilestonesView = ({ projectsToShow }: { projectsToShow: Project[] }): { nodes: Node[], edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    projectsToShow.forEach((project, projectIndex) => {
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

          edges.push({
            id: `project-milestone-${project.id}-${milestone.id}`,
            source: `project-${project.id}`,
            target: `milestone-${milestone.id}`,
            type: 'smoothstep',
            style: { stroke: '#f59e0b' },
          });
        });
      });
    return { nodes, edges };
}

export const generatePeopleSkillsView = ({ peopleToShow, personSkills, skills }: { peopleToShow: Person[], personSkills: PersonSkill[], skills: Skill[] }): { nodes: Node[], edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const personNodeIds = new Set(peopleToShow.map(p => p.id));
    const relevantPersonSkills = personSkills.filter(ps => personNodeIds.has(ps.personId));
    const skillIds = new Set(relevantPersonSkills.map(ps => ps.skillId));
    const skillsToShow = skills.filter(s => skillIds.has(s.id));

    peopleToShow.forEach((person, index) => {
        nodes.push({
          id: `person-${person.id}`,
          type: 'default',
          position: { x: 50, y: 50 + index * 100 },
          data: { label: (<div className="text-center"><PersonStanding className="h-4 w-4 mx-auto mb-1" /><div className="font-medium text-xs">{person.name}</div></div>) },
          style: { background: '#e0f2fe', border: '2px solid #0ea5e9', borderRadius: '8px', width: 120, height: 60, },
        });
    });

    skillsToShow.forEach((skill, index) => {
        nodes.push({
          id: `skill-${skill.id}`,
          type: 'default',
          position: { x: 400, y: 50 + index * 90 },
          data: { label: (<div className="text-center"><Star className="h-4 w-4 mx-auto mb-1" /><div className="font-medium text-xs">{skill.name}</div><Badge variant="outline" className="text-xs mt-1">{skill.category}</Badge></div>) },
          style: { background: '#eef2ff', border: '2px solid #6366f1', borderRadius: '8px', width: 120, height: 70 }
        });
    });

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
    return { nodes, edges };
}

export const generateTeamSkillsSummaryView = ({ teamsToShow, people, personSkills, skills }: { teamsToShow: Team[], people: Person[], personSkills: PersonSkill[], skills: Skill[] }): { nodes: Node[], edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
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
    teamSkillSummaries.forEach(skillMap => { skillMap.forEach((_, skillId) => allSkillIds.add(skillId)); });
    const skillsToShow = skills.filter(s => allSkillIds.has(s.id));

    teamsToShow.forEach((team, index) => {
        nodes.push({
            id: `team-${team.id}`,
            type: 'default',
            position: { x: 50, y: 50 + index * 100 },
            data: { label: (<div className="font-medium">{team.name}</div>) },
            style: { background: '#dcfce7', border: '2px solid #16a34a', borderRadius: '8px', width: 150, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' },
        });
    });

    skillsToShow.forEach((skill, index) => {
        nodes.push({
            id: `skill-${skill.id}`,
            type: 'default',
            position: { x: 400, y: 50 + index * 80 },
            data: { label: (<div className="font-medium">{skill.name}</div>) },
            style: { background: '#eef2ff', border: '2px solid #6366f1', borderRadius: '8px', width: 120, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' },
        });
    });

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
    return { nodes, edges };
}

export const generateFinancialOverviewView = (props: {
  divisionsToShow: Division[], teamsToShow: Team[], projectsToShow: Project[], epics: Epic[],
  allocations: Allocation[], cycles: Cycle[], people: Person[], roles: Role[], teamIdsToShow: Set<string>,
  teams: Team[]
}): { nodes: Node[], edges: Edge[] } => {
    const { divisionsToShow, teamsToShow, projectsToShow, epics, allocations, cycles, people, roles, teamIdsToShow, teams } = props;
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const projectCosts = projectsToShow.reduce((acc, project) => {
        acc[project.id] = calculateProjectCost(project, epics, allocations, cycles, people, roles, teams);
        return acc;
    }, {} as Record<string, ReturnType<typeof calculateProjectCost>>);

    const teamCosts = teamsToShow.reduce((acc, team) => {
        const teamMembers = people.filter(p => p.teamId === team.id);
        acc[team.id] = calculateTeamWeeklyCost(teamMembers, roles);
        return acc;
    }, {} as Record<string, number>);
    
    const divisionCosts = divisionsToShow.reduce((acc, division) => {
        const divisionTeams = teamsToShow.filter(t => t.divisionId === division.id);
        const totalCost = divisionTeams.reduce((sum, team) => sum + (teamCosts[team.id] || 0), 0);
        acc[division.id] = totalCost;
        return acc;
    }, {} as Record<string, number>);

    divisionsToShow.forEach((division, index) => {
        nodes.push({
          id: `division-${division.id}`,
          type: 'default',
          position: { x: index * 350, y: 0 },
          data: { label: (<div className="text-center"><Building className="h-4 w-4 mx-auto mb-1" /><div className="font-semibold text-blue-600">{division.name}</div><div className="text-xs text-gray-500 flex items-center justify-center mt-1"><DollarSign className="h-3 w-3 mr-1" /> ~${(divisionCosts[division.id] || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}/week</div></div>) },
          style: { background: '#dbeafe', border: '2px solid #3b82f6', borderRadius: '8px', width: 180, height: 80 },
        });
    });

    teamsToShow.forEach((team, index) => {
        const divisionIndex = divisionsToShow.findIndex(d => d.id === team.divisionId);
        nodes.push({
          id: `team-${team.id}`,
          type: 'default',
          position: { x: divisionIndex >= 0 ? divisionIndex * 350 + (index % 2) * 160 : index * 200, y: 150 },
          data: { label: (<div className="text-center"><Users className="h-4 w-4 mx-auto mb-1" /><div className="font-medium">{team.name}</div><div className="text-xs text-gray-500 flex items-center justify-center mt-1"><DollarSign className="h-3 w-3 mr-1" /> ${(teamCosts[team.id] || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}/week</div></div>) },
          style: { background: '#dcfce7', border: '2px solid #16a34a', borderRadius: '8px', width: 150, height: 80 },
        });

        if (team.divisionId) {
          edges.push({ id: `division-team-${team.divisionId}-${team.id}`, source: `division-${team.divisionId}`, target: `team-${team.id}`, type: 'smoothstep', style: { stroke: '#3b82f6' } });
        }
    });

    projectsToShow.forEach((project, index) => {
        nodes.push({
          id: `project-${project.id}`,
          type: 'default',
          position: { x: index * 220, y: 350 },
          data: { label: (<div className="text-center p-2"><FolderOpen className="h-4 w-4 mx-auto mb-1" /><div className="font-medium text-sm">{project.name}</div><Badge variant="outline" className="text-xs mt-1 w-full justify-center">Budget: ${(project.budget || 0).toLocaleString()}</Badge><Badge variant="secondary" className="text-xs mt-1 w-full justify-center">Est. Cost: ${(projectCosts[project.id]?.totalCost || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</Badge></div>) },
          style: { background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '8px', width: 180, height: 110 },
        });
    });
    
    const projectEpicsByTeam = epics.reduce((acc, epic) => {
        if (epic.assignedTeamId && teamIdsToShow.has(epic.assignedTeamId)) {
            if (!acc[epic.assignedTeamId]) acc[epic.assignedTeamId] = new Set();
            acc[epic.assignedTeamId].add(epic.projectId);
        }
        return acc;
    }, {} as Record<string, Set<string>>);

    Object.entries(projectEpicsByTeam).forEach(([teamId, projectIds]) => {
        projectIds.forEach(projectId => {
            if (projectsToShow.some(p => p.id === projectId)) {
              edges.push({ id: `team-project-${teamId}-${projectId}`, source: `team-${teamId}`, target: `project-${projectId}`, type: 'smoothstep', style: { stroke: '#16a34a', strokeDasharray: '3,3' } });
            }
        });
    });

    const teamProjectAllocations = new Map<string, Map<string, number>>(); // Map<teamId, Map<projectId, totalPercentage>>
    
    allocations.forEach(alloc => {
        if(alloc.epicId) {
            const epic = epics.find(e => e.id === alloc.epicId);
            if(epic && epic.projectId && teamIdsToShow.has(alloc.teamId) && projectsToShow.some(p => p.id === epic.projectId)) {
                if(!teamProjectAllocations.has(alloc.teamId)) {
                    teamProjectAllocations.set(alloc.teamId, new Map());
                }
                const projectAllocs = teamProjectAllocations.get(alloc.teamId)!;
                const currentPercentage = projectAllocs.get(epic.projectId) || 0;
                projectAllocs.set(epic.projectId, currentPercentage + alloc.percentage);
            }
        }
    });

    teamProjectAllocations.forEach((projectAllocs, teamId) => {
        projectAllocs.forEach((percentage, projectId) => {
            edges.push({
                id: `team-project-financial-${teamId}-${projectId}`,
                source: `team-${teamId}`,
                target: `project-${projectId}`,
                type: 'smoothstep',
                label: `${percentage}%`,
                style: { stroke: '#16a34a', strokeDasharray: '3,3', strokeWidth: Math.max(1, percentage / 25) },
                animated: true
            });
        });
    });
    return { nodes, edges };
}

export const generateTeamsProjectsView = ({ divisionsToShow, teamsToShow, projectsToShow, epics, allocations }: { divisionsToShow: Division[], teamsToShow: Team[], projectsToShow: Project[], epics: Epic[], allocations: Allocation[] }): { nodes: Node[], edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    divisionsToShow.forEach((division, index) => {
        nodes.push({
          id: `division-${division.id}`,
          type: 'default',
          position: { x: index * 300, y: 0 },
          data: { label: (<div className="text-center"><div className="font-semibold text-blue-600">{division.name}</div><div className="text-xs text-gray-500">Division</div></div>) },
          style: { background: '#dbeafe', border: '2px solid #3b82f6', borderRadius: '8px', width: 150, height: 60 },
        });
    });

    teamsToShow.forEach((team, index) => {
        const divisionIndex = divisionsToShow.findIndex(d => d.id === team.divisionId);
        nodes.push({
          id: `team-${team.id}`,
          type: 'default',
          position: { x: divisionIndex >= 0 ? divisionIndex * 300 + (index % 3) * 100 : index * 200, y: 120 },
          data: { label: (<div className="text-center"><Users className="h-4 w-4 mx-auto mb-1" /><div className="font-medium">{team.name}</div><div className="text-xs text-gray-500">{team.capacity}h/week</div></div>) },
          style: { background: '#dcfce7', border: '2px solid #16a34a', borderRadius: '8px', width: 120, height: 80 },
        });
        if (team.divisionId) {
          edges.push({ id: `division-team-${team.divisionId}-${team.id}`, source: `division-${team.divisionId}`, target: `team-${team.id}`, type: 'smoothstep', style: { stroke: '#3b82f6' } });
        }
    });

    projectsToShow.forEach((project, index) => {
        nodes.push({
          id: `project-${project.id}`,
          type: 'default',
          position: { x: index * 180, y: 300 },
          data: { label: (<div className="text-center"><FolderOpen className="h-4 w-4 mx-auto mb-1" /><div className="font-medium text-sm">{project.name}</div><Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-xs">{project.status}</Badge></div>) },
          style: { background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '8px', width: 140, height: 90 },
        });
    });
    return { nodes, edges };
}

export const generateProjectsEpicsView = ({ projectsToShow, epicsToShow, teamsToShow, allocations, isAllView = false }: { projectsToShow: Project[], epicsToShow: Epic[], teamsToShow: Team[], allocations: Allocation[], isAllView?: boolean }): { nodes: Node[], edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (!isAllView) {
        projectsToShow.forEach((project, index) => {
            nodes.push({
              id: `project-${project.id}`,
              type: 'default',
              position: { x: index * 180, y: 300 },
              data: { label: (<div className="text-center"><FolderOpen className="h-4 w-4 mx-auto mb-1" /><div className="font-medium text-sm">{project.name}</div><Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-xs">{project.status}</Badge></div>) },
              style: { background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '8px', width: 140, height: 90 },
            });
        });
    }

    epicsToShow.forEach((epic, index) => {
        const projectIndex = projectsToShow.findIndex(p => p.id === epic.projectId);
        nodes.push({
          id: `epic-${epic.id}`,
          type: 'default',
          position: { x: projectIndex >= 0 ? projectIndex * 180 + (index % 2) * 80 : index * 150, y: 450 },
          data: { label: (<div className="text-center"><Target className="h-4 w-4 mx-auto mb-1" /><div className="font-medium text-xs">{epic.name}</div><div className="text-xs text-gray-500">{epic.estimatedEffort} pts</div><Badge variant={epic.status === 'completed' ? 'default' : 'outline'} className="text-xs">{epic.status}</Badge></div>) },
          style: { background: '#fce7f3', border: '2px solid #ec4899', borderRadius: '8px', width: 110, height: 85 },
        });

        if (epic.projectId) {
          edges.push({ id: `project-epic-${epic.projectId}-${epic.id}`, source: `project-${epic.projectId}`, target: `epic-${epic.id}`, type: 'smoothstep', style: { stroke: '#f59e0b' } });
        }
        
        const epicAllocationsByTeam = allocations
            .filter(a => a.epicId === epic.id && teamsToShow.some(t => t.id === a.teamId))
            .reduce((acc, alloc) => {
                if (!acc.has(alloc.teamId)) {
                    acc.set(alloc.teamId, 0);
                }
                acc.set(alloc.teamId, acc.get(alloc.teamId)! + alloc.percentage);
                return acc;
            }, new Map<string, number>());
            
        epicAllocationsByTeam.forEach((percentage, teamId) => {
            if (percentage > 0) {
                 edges.push({
                    id: `team-epic-alloc-${teamId}-${epic.id}`,
                    source: `team-${teamId}`,
                    target: `epic-${epic.id}`,
                    type: 'smoothstep',
                    label: `${percentage}%`,
                    style: { stroke: '#16a34a', strokeDasharray: '5,5', strokeWidth: Math.max(1, percentage/25) },
                    animated: true
                });
            }
        });
    });
    return { nodes, edges };
}

export const generateTeamAllocationsView = (props: {
    divisionsToShow: Division[], teamsToShow: Team[], projectsToShow: Project[], epicsToShow: Epic[], allocationsToShow: Allocation[], runWorkCategories: RunWorkCategory[]
}): { nodes: Node[], edges: Edge[] } => {
    const { divisionsToShow, teamsToShow, projectsToShow, epicsToShow, allocationsToShow, runWorkCategories } = props;
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    divisionsToShow.forEach((division, index) => {
        nodes.push({
          id: `division-${division.id}`,
          type: 'default',
          position: { x: index * 300, y: 0 },
          data: { label: (<div className="text-center"><Building className="h-4 w-4 mx-auto mb-1" /><div className="font-semibold text-blue-600">{division.name}</div></div>) },
          style: { background: '#dbeafe', border: '2px solid #3b82f6', borderRadius: '8px', width: 150, height: 60 },
        });
    });

    teamsToShow.forEach((team, index) => {
        const divisionIndex = divisionsToShow.findIndex(d => d.id === team.divisionId);
        nodes.push({
          id: `team-${team.id}`,
          type: 'default',
          position: { x: divisionIndex >= 0 ? divisionIndex * 300 + (index % 3) * 100 : index * 200, y: 120 },
          data: { label: (<div className="text-center"><Users className="h-4 w-4 mx-auto mb-1" /><div className="font-medium">{team.name}</div></div>) },
          style: { background: '#dcfce7', border: '2px solid #16a34a', borderRadius: '8px', width: 120, height: 60 },
        });
        if (team.divisionId) {
          edges.push({ id: `division-team-${team.divisionId}-${team.id}`, source: `division-${team.divisionId}`, target: `team-${team.id}`, type: 'smoothstep', style: { stroke: '#3b82f6' } });
        }
    });

    projectsToShow.forEach((project, index) => {
        nodes.push({
          id: `project-${project.id}`,
          type: 'default',
          position: { x: index * 200, y: 300 },
          data: { label: (<div className="text-center"><FolderOpen className="h-4 w-4 mx-auto mb-1" /><div className="font-medium text-sm">{project.name}</div></div>) },
          style: { background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '8px', width: 160, height: 70 },
        });
    });

    epicsToShow.forEach((epic, index) => {
        const projectIndex = projectsToShow.findIndex(p => p.id === epic.projectId);
        nodes.push({
          id: `epic-${epic.id}`,
          type: 'default',
          position: { x: projectIndex >= 0 ? projectIndex * 200 + (index % 2) * 80 : index * 150, y: 450 },
          data: { label: (<div className="text-center"><Target className="h-4 w-4 mx-auto mb-1" /><div className="font-medium text-xs">{epic.name}</div></div>) },
          style: { background: '#fce7f3', border: '2px solid #ec4899', borderRadius: '8px', width: 110, height: 60 },
        });
        if (epic.projectId) {
          edges.push({ id: `project-epic-${epic.projectId}-${epic.id}`, source: `project-${epic.projectId}`, target: `epic-${epic.id}`, type: 'smoothstep', style: { stroke: '#f59e0b' } });
        }
    });
    
    const projectNodesWidth = projectsToShow.length * 200;
    runWorkCategories.forEach((category, index) => {
        nodes.push({
          id: `category-${category.id}`,
          type: 'default',
          position: { x: projectNodesWidth + index * 150, y: 300 },
          data: { label: (<div className="text-center"><Zap className="h-4 w-4 mx-auto mb-1" /><div className="font-medium text-sm">{category.name}</div><div className="text-xs text-gray-500">Run Work</div></div>) },
          style: { background: category.color || '#f3f4f6', border: '2px solid #6b7280', borderRadius: '8px', width: 120, height: 70 },
        });
    });

    const epicAllocations = new Map<string, number>(); // key: `teamId-epicId`
    const categoryAllocations = new Map<string, number>(); // key: `teamId-categoryId`

    allocationsToShow.forEach(allocation => {
        if (allocation.epicId) {
            const key = `${allocation.teamId}-${allocation.epicId}`;
            const current = epicAllocations.get(key) || 0;
            epicAllocations.set(key, current + allocation.percentage);
        } else if (allocation.runWorkCategoryId) {
            const key = `${allocation.teamId}-${allocation.runWorkCategoryId}`;
            const current = categoryAllocations.get(key) || 0;
            categoryAllocations.set(key, current + allocation.percentage);
        }
    });

    epicAllocations.forEach((percentage, key) => {
        const [teamId, epicId] = key.split('-');
        if (percentage > 0) {
            edges.push({ id: `allocation-epic-${teamId}-${epicId}`, source: `team-${teamId}`, target: `epic-${epicId}`, type: 'smoothstep', label: `${percentage}%`, style: { stroke: '#8b5cf6', strokeDasharray: '5,5' }, animated: true });
        }
    });

    categoryAllocations.forEach((percentage, key) => {
        const [teamId, categoryId] = key.split('-');
        if (percentage > 0) {
            edges.push({ id: `allocation-category-${teamId}-${categoryId}`, source: `team-${teamId}`, target: `category-${categoryId}`, type: 'smoothstep', label: `${percentage}%`, style: { stroke: '#6b7280', strokeDasharray: '5,5' }, animated: true });
        }
    });

    return { nodes, edges };
}

export const generateProjectsSolutionsView = ({ projectsToShow, solutions, projectSolutions }: { 
  projectsToShow: Project[], 
  solutions: Solution[], 
  projectSolutions: ProjectSolution[] 
}): { nodes: Node[], edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Add project nodes
  projectsToShow.forEach((project, index) => {
    nodes.push({
      id: `project-${project.id}`,
      type: 'default',
      position: { x: 50, y: 50 + index * 120 },
      data: {
        label: (
          <div className="text-center">
            <FolderOpen className="h-4 w-4 mx-auto mb-1" />
            <div className="font-medium text-sm">{project.name}</div>
            <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-xs">
              {project.status}
            </Badge>
          </div>
        )
      },
      style: {
        background: '#fef3c7',
        border: '2px solid #f59e0b',
        borderRadius: '8px',
        width: 160,
        height: 90
      },
    });
  });

  // Get unique solutions used by the projects
  const usedSolutionIds = new Set(
    projectSolutions
      .filter(ps => projectsToShow.some(p => p.id === ps.projectId))
      .map(ps => ps.solutionId)
  );
  
  const solutionsToShow = solutions.filter(s => usedSolutionIds.has(s.id));

  // Add solution nodes
  solutionsToShow.forEach((solution, index) => {
    const categoryColors = {
      'platform': '#dbeafe',
      'framework-stack': '#f3e8ff',
      'methodology': '#ecfdf5',
      'architecture-pattern': '#fef2f2',
      'other': '#f8fafc'
    };

    nodes.push({
      id: `solution-${solution.id}`,
      type: 'default',
      position: { x: 350, y: 50 + index * 100 },
      data: {
        label: (
          <div className="text-center">
            <Cog className="h-4 w-4 mx-auto mb-1" />
            <div className="font-medium text-sm">{solution.name}</div>
            <Badge variant="outline" className="text-xs">
              {solution.category.replace('-', ' ')}
            </Badge>
          </div>
        )
      },
      style: {
        background: categoryColors[solution.category] || categoryColors.other,
        border: '2px solid #6366f1',
        borderRadius: '8px',
        width: 140,
        height: 80
      },
    });
  });

  // Add edges between projects and solutions
  projectSolutions.forEach(ps => {
    if (projectsToShow.some(p => p.id === ps.projectId) && solutionsToShow.some(s => s.id === ps.solutionId)) {
      edges.push({
        id: `project-solution-${ps.projectId}-${ps.solutionId}`,
        source: `project-${ps.projectId}`,
        target: `solution-${ps.solutionId}`,
        type: 'smoothstep',
        label: ps.isPrimary ? 'Primary' : undefined,
        style: { 
          stroke: ps.isPrimary ? '#f59e0b' : '#6366f1',
          strokeWidth: ps.isPrimary ? 3 : 2,
          strokeDasharray: ps.isPrimary ? undefined : '5,5'
        },
      });
    }
  });

  return { nodes, edges };
};

export const generateSolutionsSkillsView = ({ solutions, skills }: { 
  solutions: Solution[], 
  skills: Skill[] 
}): { nodes: Node[], edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Add solution nodes
  solutions.forEach((solution, index) => {
    const categoryColors = {
      'platform': '#dbeafe',
      'framework-stack': '#f3e8ff',
      'methodology': '#ecfdf5',
      'architecture-pattern': '#fef2f2',
      'other': '#f8fafc'
    };

    nodes.push({
      id: `solution-${solution.id}`,
      type: 'default',
      position: { x: 50, y: 50 + index * 100 },
      data: {
        label: (
          <div className="text-center">
            <Cog className="h-4 w-4 mx-auto mb-1" />
            <div className="font-medium text-sm">{solution.name}</div>
            <Badge variant="outline" className="text-xs">
              {solution.category.replace('-', ' ')}
            </Badge>
          </div>
        )
      },
      style: {
        background: categoryColors[solution.category] || categoryColors.other,
        border: '2px solid #6366f1',
        borderRadius: '8px',
        width: 140,
        height: 80
      },
    });
  });

  // Get unique skills used by solutions
  const usedSkillIds = new Set<string>();
  solutions.forEach(solution => {
    solution.skillIds.forEach(skillId => usedSkillIds.add(skillId));
  });

  const skillsToShow = skills.filter(s => usedSkillIds.has(s.id));

  // Add skill nodes
  skillsToShow.forEach((skill, index) => {
    const categoryColors = {
      'technical': '#eef2ff',
      'design': '#fdf2f8',
      'management': '#f0fdf4',
      'business': '#fffbeb',
      'other': '#f8fafc'
    };

    nodes.push({
      id: `skill-${skill.id}`,
      type: 'default',
      position: { x: 350, y: 50 + index * 90 },
      data: {
        label: (
          <div className="text-center">
            <Star className="h-4 w-4 mx-auto mb-1" />
            <div className="font-medium text-xs">{skill.name}</div>
            <Badge variant="outline" className="text-xs">
              {skill.category}
            </Badge>
          </div>
        )
      },
      style: {
        background: categoryColors[skill.category] || categoryColors.other,
        border: '2px solid #ec4899',
        borderRadius: '8px',
        width: 120,
        height: 70
      },
    });
  });

  // Add edges between solutions and skills
  solutions.forEach(solution => {
    solution.skillIds.forEach(skillId => {
      if (skillsToShow.some(s => s.id === skillId)) {
        edges.push({
          id: `solution-skill-${solution.id}-${skillId}`,
          source: `solution-${solution.id}`,
          target: `skill-${skillId}`,
          type: 'smoothstep',
          style: { stroke: '#8b5cf6', strokeDasharray: '3,3' },
        });
      }
    });
  });

  return { nodes, edges };
};
