import React from 'react';
import { Node, Edge } from '@xyflow/react';
import {
  Division,
  Team,
  Person,
  TeamMember,
  DivisionLeadershipRole,
} from '@/types';

interface DivisionData {
  division: Division;
  teams: Team[];
  totalPeople: number;
  averageTeamSize: number;
  teamSizeRange: { min: number; max: number };
  leadershipRoles: DivisionLeadershipRole[];
  leaders: Person[];
}

interface DivisionCanvasViewProps {
  selectedDivision?: string;
  divisions: Division[];
  teams: Team[];
  people: Person[];
  teamMembers: TeamMember[];
  divisionLeadershipRoles: DivisionLeadershipRole[];
}

const generateDivisionNodes = (
  divisionsData: DivisionData[],
  people: Person[],
  teamMembers: TeamMember[]
): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Calculate relative sizes for visualization
  const maxPeople = Math.max(...divisionsData.map(d => d.totalPeople));
  const baseSize = 200;
  const maxSize = 400;

  let yOffset = 0;
  const horizontalSpacing = 500;

  divisionsData.forEach((divisionData, divisionIndex) => {
    const { division, teams, totalPeople, leadershipRoles, leaders } =
      divisionData;

    // Calculate division node size based on total people
    const sizeRatio = totalPeople / maxPeople;
    const nodeWidth = baseSize + sizeRatio * (maxSize - baseSize);
    const nodeHeight = Math.max(150, teams.length * 40 + 100);

    // Division node
    const divisionNode: Node = {
      id: `division-${division.id}`,
      type: 'default',
      position: { x: divisionIndex * horizontalSpacing, y: yOffset },
      data: {
        label: (
          <div className="p-4 bg-white border-2 border-blue-500 rounded-lg shadow-lg">
            <div className="font-bold text-lg text-blue-800 mb-2">
              {division.name}
            </div>
            <div className="text-sm text-gray-600">
              <div>
                <strong>{teams.length}</strong> teams
              </div>
              <div>
                <strong>{totalPeople}</strong> people
              </div>
              <div>
                Avg team size:{' '}
                <strong>{divisionData.averageTeamSize.toFixed(1)}</strong>
              </div>
              <div>
                Team size range:{' '}
                <strong>
                  {divisionData.teamSizeRange.min}-
                  {divisionData.teamSizeRange.max}
                </strong>
              </div>
              {leadershipRoles.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-xs font-semibold text-purple-600">
                    Leadership ({leadershipRoles.length})
                  </div>
                </div>
              )}
            </div>
          </div>
        ),
      },
      style: {
        width: nodeWidth,
        height: nodeHeight,
      },
    };

    nodes.push(divisionNode);

    // Leadership nodes
    let leadershipYOffset = 0;
    leaders.forEach((leader, leaderIndex) => {
      const leaderRoles = leadershipRoles.filter(
        lr => lr.personId === leader.id
      );
      const roleTypes = leaderRoles.map(lr =>
        lr.roleType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
      );

      const leaderNode: Node = {
        id: `leader-${division.id}-${leader.id}`,
        type: 'default',
        position: {
          x: divisionIndex * horizontalSpacing - 250,
          y: yOffset + leadershipYOffset,
        },
        data: {
          label: (
            <div className="p-3 bg-purple-50 border-2 border-purple-400 rounded-lg shadow-md">
              <div className="font-semibold text-purple-800">{leader.name}</div>
              <div className="text-xs text-purple-600">
                {roleTypes.join(', ')}
              </div>
              {leaderRoles.some(lr => lr.supportsTeams?.length) && (
                <div className="text-xs text-gray-500 mt-1">
                  Supports{' '}
                  {leaderRoles.reduce(
                    (acc, lr) => acc + (lr.supportsTeams?.length || 0),
                    0
                  )}{' '}
                  teams
                </div>
              )}
            </div>
          ),
        },
        style: {
          width: 200,
          height: 80,
        },
      };

      nodes.push(leaderNode);

      // Edge from leader to division
      edges.push({
        id: `edge-leader-${leader.id}-division-${division.id}`,
        source: `leader-${division.id}-${leader.id}`,
        target: `division-${division.id}`,
        type: 'smoothstep',
        style: { stroke: '#9333ea', strokeWidth: 2, strokeDasharray: '5,5' },
        label: 'Leads',
      });

      leadershipYOffset += 100;
    });

    // Team nodes
    let teamYOffset = 0;
    teams.forEach((team, teamIndex) => {
      const teamPeople = teamMembers.filter(
        tm => tm.teamId === team.id && tm.isActive
      );
      const teamSize = teamPeople.length;

      // Calculate team node size based on team size
      const teamSizeRatio =
        teamSize /
        Math.max(
          ...teams.map(
            t =>
              teamMembers.filter(tm => tm.teamId === t.id && tm.isActive).length
          )
        );
      const teamNodeWidth = 120 + teamSizeRatio * 80;
      const teamNodeHeight = 60 + teamSizeRatio * 20;

      const teamNode: Node = {
        id: `team-${team.id}`,
        type: 'default',
        position: {
          x: divisionIndex * horizontalSpacing + nodeWidth + 50,
          y: yOffset + teamYOffset,
        },
        data: {
          label: (
            <div className="p-2 bg-green-50 border-2 border-green-400 rounded-lg shadow-sm">
              <div className="font-semibold text-green-800 text-sm">
                {team.name}
              </div>
              <div className="text-xs text-green-600">{teamSize} people</div>
              <div className="text-xs text-gray-500">
                {team.type.replace('-', ' ')}
              </div>
            </div>
          ),
        },
        style: {
          width: teamNodeWidth,
          height: teamNodeHeight,
        },
      };

      nodes.push(teamNode);

      // Edge from division to team
      edges.push({
        id: `edge-division-${division.id}-team-${team.id}`,
        source: `division-${division.id}`,
        target: `team-${team.id}`,
        type: 'smoothstep',
        style: { stroke: '#059669', strokeWidth: 2 },
      });

      // Edges from leaders to teams they support
      leadershipRoles.forEach(role => {
        if (role.supportsTeams?.includes(team.id)) {
          edges.push({
            id: `edge-leader-${role.personId}-supports-team-${team.id}`,
            source: `leader-${division.id}-${role.personId}`,
            target: `team-${team.id}`,
            type: 'smoothstep',
            style: {
              stroke: '#7c3aed',
              strokeWidth: 1,
              strokeDasharray: '3,3',
            },
            label: 'Supports',
          });
        }
      });

      teamYOffset += 90;
    });

    yOffset += Math.max(nodeHeight, teamYOffset) + 100;
  });

  return { nodes, edges };
};

export const DivisionCanvasView = ({
  selectedDivision,
  divisions,
  teams,
  people,
  teamMembers,
  divisionLeadershipRoles = [],
}: DivisionCanvasViewProps): { nodes: Node[]; edges: Edge[] } => {
  // Filter divisions based on selection
  const filteredDivisions =
    selectedDivision && selectedDivision !== 'all'
      ? divisions.filter(d => d.id === selectedDivision)
      : divisions;

  // Prepare division data
  const divisionsData: DivisionData[] = filteredDivisions.map(division => {
    const divisionTeams = teams.filter(t => t.divisionId === division.id);
    const divisionTeamIds = divisionTeams.map(t => t.id);
    const divisionTeamMembers = teamMembers.filter(
      tm => divisionTeamIds.includes(tm.teamId) && tm.isActive
    );

    const totalPeople = divisionTeamMembers.length;
    const teamSizes = divisionTeams.map(
      team =>
        teamMembers.filter(tm => tm.teamId === team.id && tm.isActive).length
    );

    const averageTeamSize =
      teamSizes.length > 0
        ? teamSizes.reduce((a, b) => a + b, 0) / teamSizes.length
        : 0;
    const teamSizeRange =
      teamSizes.length > 0
        ? { min: Math.min(...teamSizes), max: Math.max(...teamSizes) }
        : { min: 0, max: 0 };

    const leadershipRoles = divisionLeadershipRoles.filter(
      lr => lr.divisionId === division.id && lr.isActive
    );

    const leaderIds = [...new Set(leadershipRoles.map(lr => lr.personId))];
    const leaders = people.filter(p => leaderIds.includes(p.id));

    return {
      division,
      teams: divisionTeams,
      totalPeople,
      averageTeamSize,
      teamSizeRange,
      leadershipRoles,
      leaders,
    };
  });

  return generateDivisionNodes(divisionsData, people, teamMembers);
};

export default DivisionCanvasView;
