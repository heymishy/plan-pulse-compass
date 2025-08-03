import { Person, Project, Team, Allocation } from '../types';

// Placeholder for more complex financial calculations

/**
 * Calculates the total cost of a team based on its members' salaries.
 * @param team - The team to calculate the cost for.
 * @param people - A list of all people in the organization.
 * @returns The total annual cost of the team.
 */
export const calculateTeamCost = (team: Team, people: Person[]): number => {
  // This is a simplified calculation. A more realistic calculation would
  // consider allocation percentages, contract types, and other factors.
  const teamMembers = people.filter(p => p.teamId === team.id);
  const totalCost = teamMembers.reduce((acc, member) => {
    return acc + (member.annualSalary || 0);
  }, 0);
  return totalCost;
};

/**
 * Calculates the financial impact of moving a person to a different team.
 * @param person - The person being moved.
 * @param newTeam - The team the person is moving to.
 * @param people - A list of all people in the organization.
 * @returns An object detailing the financial impact.
 */
export const analyzeTeamMoveImpact = (
  person: Person,
  newTeam: Team,
  people: Person[]
) => {
  const originalTeamId = person.teamId;
  const originalTeam = people.filter(p => p.teamId === originalTeamId);
  const newTeamMembers = people.filter(p => p.teamId === newTeam.id);

  const originalTeamCost = originalTeam.reduce(
    (acc, member) => acc + (member.annualSalary || 0),
    0
  );
  const newTeamCost = newTeamMembers.reduce(
    (acc, member) => acc + (member.annualSalary || 0),
    0
  );

  const personCost = person.annualSalary || 0;

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
