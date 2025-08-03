import { Person, Team, Role, AppConfig, TeamMoveImpact } from '../types';
import { calculatePersonCost } from './financialCalculations';

/**
 * Calculates the total cost of a team based on its members' salaries.
 * @param team - The team to calculate the cost for.
 * @param people - A list of all people in the organization.
 * @param roles - A list of all roles in the organization.
 * @param config - The application configuration.
 * @returns The total annual cost of the team.
 */
export const calculateTeamCost = (
  team: Team,
  people: Person[],
  roles: Role[],
  config: AppConfig
): number => {
  const teamMembers = people.filter(p => p.teamId === team.id);
  const totalCost = teamMembers.reduce((acc, member) => {
    const role = roles.find(r => r.id === member.roleId);
    if (!role) return acc;
    const personCost = calculatePersonCost(member, role, config);
    return acc + personCost.costPerYear;
  }, 0);
  return totalCost;
};

/**
 * Calculates the financial impact of moving a person to a different team.
 * @param person - The person being moved.
 * @param newTeam - The team the person is moving to.
 * @param people - A list of all people in the organization.
 * @param roles - A list of all roles in the organization.
 * @param teams - A list of all teams in the organization.
 * @param config - The application configuration.
 * @returns An object detailing the financial impact.
 */
export const analyzeTeamMoveImpact = (
  person: Person,
  newTeam: Team,
  people: Person[],
  roles: Role[],
  teams: Team[],
  config: AppConfig
): TeamMoveImpact => {
  const originalTeamId = person.teamId;
  const originalTeam = teams.find(t => t.id === originalTeamId);

  if (!originalTeam) {
    throw new Error('Original team not found');
  }

  const originalTeamCost = calculateTeamCost(
    originalTeam,
    people,
    roles,
    config
  );
  const newTeamCost = calculateTeamCost(newTeam, people, roles, config);

  const personRole = roles.find(r => r.id === person.roleId);
  if (!personRole) {
    throw new Error('Person role not found');
  }
  const personCost = calculatePersonCost(
    person,
    personRole,
    config
  ).costPerYear;

  return {
    personName: person.name,
    originalTeamId,
    newTeamId: newTeam.id,
    impactOnOriginalTeam: -personCost,
    impactOnNewTeam: +personCost,
    newCostOfOriginalTeam: originalTeamCost - personCost,
    newCostOfNewTeam: newTeamCost + personCost,
  };
};
