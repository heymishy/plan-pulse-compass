import React from 'react';
import { describe, it, expect } from 'vitest';
import { DivisionCanvasView } from '../DivisionCanvasView';
import {
  Division,
  Team,
  Person,
  TeamMember,
  DivisionLeadershipRole,
} from '@/types';

describe('DivisionCanvasView', () => {
  const mockDivisions: Division[] = [
    {
      id: 'div1',
      name: 'Engineering Division',
      description: 'Core engineering teams',
      budget: 1000000,
    },
    {
      id: 'div2',
      name: 'Product Division',
      description: 'Product management teams',
      budget: 500000,
    },
  ];

  const mockTeams: Team[] = [
    {
      id: 'team1',
      name: 'Frontend Team',
      type: 'permanent',
      status: 'active',
      divisionId: 'div1',
      capacity: 40,
      targetSkills: [],
      createdDate: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
    },
    {
      id: 'team2',
      name: 'Backend Team',
      type: 'permanent',
      status: 'active',
      divisionId: 'div1',
      capacity: 40,
      targetSkills: [],
      createdDate: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
    },
    {
      id: 'team3',
      name: 'Product Team',
      type: 'permanent',
      status: 'active',
      divisionId: 'div2',
      capacity: 30,
      targetSkills: [],
      createdDate: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
    },
  ];

  const mockPeople: Person[] = [
    {
      id: 'person1',
      name: 'John Smith',
      email: 'john@example.com',
      roleId: 'engineering-manager',
    },
    {
      id: 'person2',
      name: 'Jane Doe',
      email: 'jane@example.com',
      roleId: 'developer',
    },
    {
      id: 'person3',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      roleId: 'product-manager',
    },
  ];

  const mockTeamMembers: TeamMember[] = [
    {
      id: 'tm1',
      teamId: 'team1',
      personId: 'person1',
      role: 'lead',
      allocation: 100,
      startDate: '2024-01-01',
      isActive: true,
    },
    {
      id: 'tm2',
      teamId: 'team1',
      personId: 'person2',
      role: 'member',
      allocation: 100,
      startDate: '2024-01-01',
      isActive: true,
    },
    {
      id: 'tm3',
      teamId: 'team2',
      personId: 'person2',
      role: 'member',
      allocation: 50,
      startDate: '2024-01-01',
      isActive: true,
    },
    {
      id: 'tm4',
      teamId: 'team3',
      personId: 'person3',
      role: 'lead',
      allocation: 100,
      startDate: '2024-01-01',
      isActive: true,
    },
  ];

  const mockLeadershipRoles: DivisionLeadershipRole[] = [
    {
      id: 'leader1',
      personId: 'person1',
      divisionId: 'div1',
      roleType: 'engineering-manager',
      title: 'Engineering Manager',
      startDate: '2024-01-01',
      isActive: true,
      supportsTeams: ['team1', 'team2'],
    },
    {
      id: 'leader2',
      personId: 'person3',
      divisionId: 'div2',
      roleType: 'product-lead',
      title: 'Product Lead',
      startDate: '2024-01-01',
      isActive: true,
      supportsTeams: ['team3'],
    },
  ];

  it('should generate nodes and edges for division view', () => {
    const result = DivisionCanvasView({
      divisions: mockDivisions,
      teams: mockTeams,
      people: mockPeople,
      teamMembers: mockTeamMembers,
      divisionLeadershipRoles: mockLeadershipRoles,
    });

    expect(result).toHaveProperty('nodes');
    expect(result).toHaveProperty('edges');
    expect(Array.isArray(result.nodes)).toBe(true);
    expect(Array.isArray(result.edges)).toBe(true);
  });

  it('should create division nodes with correct information', () => {
    const result = DivisionCanvasView({
      divisions: mockDivisions,
      teams: mockTeams,
      people: mockPeople,
      teamMembers: mockTeamMembers,
      divisionLeadershipRoles: mockLeadershipRoles,
    });

    const divisionNodes = result.nodes.filter(node =>
      node.id.startsWith('division-')
    );
    expect(divisionNodes).toHaveLength(2);

    const engineeringDivisionNode = divisionNodes.find(
      node => node.id === 'division-div1'
    );
    expect(engineeringDivisionNode).toBeDefined();
  });

  it('should create team nodes for each team', () => {
    const result = DivisionCanvasView({
      divisions: mockDivisions,
      teams: mockTeams,
      people: mockPeople,
      teamMembers: mockTeamMembers,
      divisionLeadershipRoles: mockLeadershipRoles,
    });

    const teamNodes = result.nodes.filter(node => node.id.startsWith('team-'));
    expect(teamNodes).toHaveLength(3);
  });

  it('should create leadership nodes for division leaders', () => {
    const result = DivisionCanvasView({
      divisions: mockDivisions,
      teams: mockTeams,
      people: mockPeople,
      teamMembers: mockTeamMembers,
      divisionLeadershipRoles: mockLeadershipRoles,
    });

    const leaderNodes = result.nodes.filter(node =>
      node.id.startsWith('leader-')
    );
    expect(leaderNodes).toHaveLength(2);
  });

  it('should create edges connecting divisions to teams', () => {
    const result = DivisionCanvasView({
      divisions: mockDivisions,
      teams: mockTeams,
      people: mockPeople,
      teamMembers: mockTeamMembers,
      divisionLeadershipRoles: mockLeadershipRoles,
    });

    const divisionTeamEdges = result.edges.filter(
      edge =>
        edge.source.startsWith('division-') && edge.target.startsWith('team-')
    );
    expect(divisionTeamEdges).toHaveLength(3); // 3 teams total
  });

  it('should create edges connecting leaders to divisions', () => {
    const result = DivisionCanvasView({
      divisions: mockDivisions,
      teams: mockTeams,
      people: mockPeople,
      teamMembers: mockTeamMembers,
      divisionLeadershipRoles: mockLeadershipRoles,
    });

    const leaderDivisionEdges = result.edges.filter(
      edge =>
        edge.source.startsWith('leader-') && edge.target.startsWith('division-')
    );
    expect(leaderDivisionEdges).toHaveLength(2); // 2 leaders total
  });

  it('should filter divisions when selectedDivision is provided', () => {
    const result = DivisionCanvasView({
      selectedDivision: 'div1',
      divisions: mockDivisions,
      teams: mockTeams,
      people: mockPeople,
      teamMembers: mockTeamMembers,
      divisionLeadershipRoles: mockLeadershipRoles,
    });

    const divisionNodes = result.nodes.filter(node =>
      node.id.startsWith('division-')
    );
    expect(divisionNodes).toHaveLength(1);
    expect(divisionNodes[0].id).toBe('division-div1');

    // Should only show teams from selected division
    const teamNodes = result.nodes.filter(node => node.id.startsWith('team-'));
    expect(teamNodes).toHaveLength(2); // team1 and team2 are in div1
  });

  it('should handle empty data gracefully', () => {
    const result = DivisionCanvasView({
      divisions: [],
      teams: [],
      people: [],
      teamMembers: [],
      divisionLeadershipRoles: [],
    });

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });
});
