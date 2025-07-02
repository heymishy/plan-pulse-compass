import { Team, Person, Role } from '@/types';

/**
 * Get the display name for a team's product owner with proper handling of acting vs natural PO
 */
export const getProductOwnerName = (
  team: Team,
  people: Person[],
  roles: Role[]
): string => {
  // If no PO assigned to team, return early
  if (!team.productOwnerId) {
    return 'No Product Owner';
  }

  // Find the assigned PO person
  const assignedPO = people.find(p => p.id === team.productOwnerId);
  if (!assignedPO) {
    return 'Unknown Product Owner';
  }

  // Find Product Owner role
  const productOwnerRole = roles.find(
    role =>
      role.name.toLowerCase().includes('product owner') ||
      role.name.toLowerCase().includes('po')
  );

  if (!productOwnerRole) {
    // If no PO role exists, just return the assigned person's name
    return assignedPO.name;
  }

  // Get all active team members
  const teamMembers = people.filter(
    person => person.teamId === team.id && person.isActive
  );

  // Find the natural PO (person with PO role in the team)
  const naturalPO = teamMembers.find(
    person => person.roleId === productOwnerRole.id
  );

  // Check if assigned PO is in the team
  const isAssignedPOInTeam = teamMembers.some(
    person => person.id === assignedPO.id
  );

  // Build the display name
  if (naturalPO && naturalPO.id === assignedPO.id) {
    // Assigned PO is the natural PO
    return `${assignedPO.name} (Team PO)`;
  } else if (
    naturalPO &&
    naturalPO.id !== assignedPO.id &&
    isAssignedPOInTeam
  ) {
    // There's a natural PO, but assigned PO is different (acting)
    return `${assignedPO.name} (Acting)`;
  } else if (!isAssignedPOInTeam) {
    // Assigned PO is not in the team (external)
    return `${assignedPO.name} (External)`;
  } else {
    // No natural PO, assigned PO is in team
    return assignedPO.name;
  }
};

/**
 * Get team members for a specific team
 */
export const getTeamMembers = (teamId: string, people: Person[]): Person[] => {
  return people.filter(person => person.teamId === teamId && person.isActive);
};

/**
 * Get the natural Product Owner for a team (person with PO role)
 */
export const getNaturalProductOwner = (
  teamId: string,
  people: Person[],
  roles: Role[]
): Person | null => {
  const productOwnerRole = roles.find(
    role =>
      role.name.toLowerCase().includes('product owner') ||
      role.name.toLowerCase().includes('po')
  );

  if (!productOwnerRole) {
    return null;
  }

  return (
    people.find(
      person =>
        person.teamId === teamId &&
        person.isActive &&
        person.roleId === productOwnerRole.id
    ) || null
  );
};

/**
 * Check if a person is the natural Product Owner for their team
 */
export const isNaturalProductOwner = (
  personId: string,
  people: Person[],
  roles: Role[]
): boolean => {
  const person = people.find(p => p.id === personId);
  if (!person || !person.teamId) {
    return false;
  }

  const naturalPO = getNaturalProductOwner(person.teamId, people, roles);
  return naturalPO?.id === personId;
};

/**
 * Get available Product Owner candidates for a team
 */
export const getProductOwnerCandidates = (
  teamId: string,
  people: Person[],
  roles: Role[]
): Person[] => {
  const teamMembers = getTeamMembers(teamId, people);
  const productOwnerRole = roles.find(
    role =>
      role.name.toLowerCase().includes('product owner') ||
      role.name.toLowerCase().includes('po')
  );

  // If there's a natural PO in the team, prioritize them
  if (productOwnerRole) {
    const naturalPO = teamMembers.find(
      person => person.roleId === productOwnerRole.id
    );
    if (naturalPO) {
      return [naturalPO, ...teamMembers.filter(p => p.id !== naturalPO.id)];
    }
  }

  return teamMembers;
};

/**
 * Get division name with fallback
 */
export const getDivisionName = (
  divisionId: string | undefined,
  divisions: any[]
): string => {
  if (!divisionId) return 'No Division';
  const division = divisions.find(d => d.id === divisionId);
  return division?.name || 'Unknown Division';
};
