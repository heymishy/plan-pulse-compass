import { Team, Person, Role } from '@/types';

/**
 * Get the display name for a team's product owner with proper handling of acting vs natural PO
 */
export const getProductOwnerName = (
  team: Team,
  people: Person[],
  roles: Role[]
): string => {
  // Find Product Owner role first
  const productOwnerRole = roles.find(
    role =>
      role.name.toLowerCase().includes('product owner') ||
      role.name.toLowerCase().includes('po')
  );

  // Get all active team members
  const teamMembers = people.filter(
    person => person.teamId === team.id && person.isActive
  );

  // Find the natural PO (person with PO role in the team)
  const naturalPO = productOwnerRole
    ? teamMembers.find(person => person.roleId === productOwnerRole.id)
    : null;

  // If no explicit PO assigned to team, check for natural PO
  if (!team.productOwnerId) {
    if (naturalPO) {
      return naturalPO.name;
    }
    return 'No Product Owner';
  }

  // Find the assigned PO person
  const assignedPO = people.find(p => p.id === team.productOwnerId);
  if (!assignedPO) {
    // Fallback to natural PO if assigned PO not found
    if (naturalPO) {
      return naturalPO.name;
    }
    return 'Unknown Product Owner';
  }

  if (!productOwnerRole) {
    // If no PO role exists, just return the assigned person's name
    return assignedPO.name;
  }

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
  divisions: Division[]
): string => {
  if (!divisionId) return 'No Division';
  const division = divisions.find(d => d.id === divisionId);
  return division?.name || 'Unknown Division';
};

/**
 * Format cycle name to shortened display format
 * "FY25 Q4 - Iteration 1" -> "FY25 Q4 1"
 * "2025 Q1 - Iteration 3" -> "2025 Q1 3"
 * Quarter totals show as "Q2 2025:" (with colon for totals)
 */
export const formatCycleName = (
  cycleName: string,
  isQuarterTotal = false,
  useSimpleIteration = false
): string => {
  // Match patterns like "FY25 Q4 - Iteration 1" or "2025 Q1 - Iteration 3"
  const match = cycleName.match(/^(.+?)\s*-\s*Iteration\s+(\d+)$/i);
  if (match) {
    const [, fyQuarter, iterationNum] = match;

    // If we want simple iteration format (I1, I2, I3, etc.)
    if (useSimpleIteration) {
      return `I${iterationNum}`;
    }

    return `${fyQuarter.trim()} ${iterationNum}`;
  }

  // For quarter totals, show as "Q2 total:" instead of "Q2 2025:"
  if (isQuarterTotal) {
    // Extract quarter info like "Q2" from "FY25 Q2" or "2025 Q2"
    const quarterMatch = cycleName.match(/(Q\d+)/i);
    if (quarterMatch) {
      return `${quarterMatch[1]} total:`;
    }
    return `${cycleName}:`;
  }

  // If no match, return original (fallback)
  return cycleName;
};

/**
 * Calculate employment type percentages for a team
 * Returns percentages of permanent vs contractor employees
 */
export const calculateEmploymentTypePercentages = (
  teamId: string,
  people: Person[]
): { permanentPercentage: number; contractorPercentage: number } => {
  const teamMembers = getTeamMembers(teamId, people);

  if (teamMembers.length === 0) {
    return { permanentPercentage: 0, contractorPercentage: 0 };
  }

  const permanentCount = teamMembers.filter(
    p => p.employmentType === 'permanent'
  ).length;
  const contractorCount = teamMembers.filter(
    p => p.employmentType === 'contractor'
  ).length;
  const totalCount = teamMembers.length;

  return {
    permanentPercentage: Math.round((permanentCount / totalCount) * 100),
    contractorPercentage: Math.round((contractorCount / totalCount) * 100),
  };
};

/**
 * Calculate role composition percentages for SE and QE roles
 * Returns percentages and role breakdown with other roles
 */
export const calculateRoleCompositionPercentages = (
  teamId: string,
  people: Person[],
  roles: Role[]
): {
  sePercentage: number;
  qePercentage: number;
  otherPercentage: number;
  roleBreakdown: Array<{
    roleName: string;
    count: number;
    percentage: number;
    color: string;
  }>;
} => {
  const teamMembers = getTeamMembers(teamId, people);

  if (teamMembers.length === 0) {
    return {
      sePercentage: 0,
      qePercentage: 0,
      otherPercentage: 0,
      roleBreakdown: [],
    };
  }

  // Count roles
  const roleCounts = new Map<string, { name: string; count: number }>();

  teamMembers.forEach(person => {
    const role = roles.find(r => r.id === person.roleId);
    const roleName = role?.name || 'Unknown Role';

    if (roleCounts.has(roleName)) {
      roleCounts.set(roleName, {
        name: roleName,
        count: roleCounts.get(roleName)!.count + 1,
      });
    } else {
      roleCounts.set(roleName, { name: roleName, count: 1 });
    }
  });

  const totalCount = teamMembers.length;

  // Calculate SE and QE percentages
  let seCount = 0;
  let qeCount = 0;

  roleCounts.forEach(({ name, count }) => {
    const normalizedName = name.toLowerCase();
    if (
      normalizedName.includes('software engineer') ||
      normalizedName === 'developer'
    ) {
      seCount += count;
    } else if (
      normalizedName.includes('quality engineer') ||
      normalizedName.includes('qa') ||
      normalizedName.includes('test engineer')
    ) {
      qeCount += count;
    }
  });

  const sePercentage = Math.round((seCount / totalCount) * 100);
  const qePercentage = Math.round((qeCount / totalCount) * 100);
  const otherPercentage = 100 - sePercentage - qePercentage;

  // Create role breakdown for visual display
  const roleBreakdown = Array.from(roleCounts.entries())
    .map(([roleName, { count }], index) => {
      const percentage = Math.round((count / totalCount) * 100);
      const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-orange-500',
        'bg-pink-500',
        'bg-gray-400',
      ];

      return {
        roleName,
        count,
        percentage,
        color: colors[index % colors.length],
      };
    })
    .sort((a, b) => b.count - a.count);

  return {
    sePercentage,
    qePercentage,
    otherPercentage,
    roleBreakdown,
  };
};

/**
 * Get clean product owner name without labels
 * Returns just the name without "(Team PO)", "(Acting)", etc.
 */
export const getCleanProductOwnerName = (
  team: Team,
  people: Person[],
  roles: Role[]
): string => {
  // Find Product Owner role first
  const productOwnerRole = roles.find(
    role =>
      role.name.toLowerCase().includes('product owner') ||
      role.name.toLowerCase().includes('po')
  );

  // Get all active team members
  const teamMembers = people.filter(
    person => person.teamId === team.id && person.isActive
  );

  // Find the natural PO (person with PO role in the team)
  const naturalPO = productOwnerRole
    ? teamMembers.find(person => person.roleId === productOwnerRole.id)
    : null;

  // If no explicit PO assigned to team, check for natural PO
  if (!team.productOwnerId) {
    if (naturalPO) {
      return naturalPO.name;
    }
    return 'No Product Owner';
  }

  // Find the assigned PO person
  const assignedPO = people.find(p => p.id === team.productOwnerId);
  if (!assignedPO) {
    // Fallback to natural PO if assigned PO not found
    if (naturalPO) {
      return naturalPO.name;
    }
    return 'Unknown Product Owner';
  }

  // Return clean name without any labels
  return assignedPO.name;
};

/**
 * Get role names with colors for legend display
 * Returns the actual role breakdown with names for display
 */
export const getRoleCompositionLegend = (
  teamId: string,
  people: Person[],
  roles: Role[]
): Array<{
  roleName: string;
  count: number;
  percentage: number;
  color: string;
}> => {
  const composition = calculateRoleCompositionPercentages(
    teamId,
    people,
    roles
  );
  return composition.roleBreakdown.slice(0, 4); // Show top 4 roles
};
