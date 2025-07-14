import { Squad, SquadMember, Team, TeamMember } from '@/types';

/**
 * Utility functions to migrate Squad data to enhanced Team data structure
 * This handles the consolidation of Squad entity into Team entity
 */

/**
 * Converts a Squad to an enhanced Team
 */
export const migrateSquadToTeam = (squad: Squad): Team => {
  return {
    id: squad.id,
    name: squad.name,
    description: squad.description,
    type: squad.type,
    status: squad.status,
    divisionId: squad.divisionId,
    divisionName: undefined, // Will be populated by division lookup
    productOwnerId: undefined, // Will be populated by finding product owner in team members
    capacity: squad.capacity, // Convert from people capacity to hours (squad.capacity * 40 hours per week)
    targetSkills: squad.targetSkills,
    projectIds: squad.projectIds || [],
    duration: squad.duration,
    createdDate: squad.createdDate,
    lastModified: squad.lastModified,
  };
};

/**
 * Converts a SquadMember to a TeamMember
 */
export const migrateSquadMemberToTeamMember = (
  squadMember: SquadMember
): TeamMember => {
  return {
    id: squadMember.id,
    teamId: squadMember.squadId, // squadId becomes teamId
    personId: squadMember.personId,
    role: squadMember.role === 'lead' ? 'lead' : squadMember.role,
    allocation: squadMember.allocation,
    startDate: squadMember.startDate,
    endDate: squadMember.endDate,
    isActive: squadMember.isActive,
    notes: squadMember.notes,
  };
};

/**
 * Migrates all Squad data to Team data
 */
export const migrateAllSquadData = (
  squads: Squad[],
  squadMembers: SquadMember[]
): { teams: Team[]; teamMembers: TeamMember[] } => {
  const teams = squads.map(migrateSquadToTeam);
  const teamMembers = squadMembers.map(migrateSquadMemberToTeamMember);

  return { teams, teamMembers };
};

/**
 * Validates that the migration is safe to perform
 */
export const validateMigration = (
  existingTeams: Team[],
  squads: Squad[]
): { canMigrate: boolean; conflicts: string[] } => {
  const conflicts: string[] = [];

  // Check for ID conflicts
  const existingTeamIds = new Set(existingTeams.map(team => team.id));
  const squadIds = squads.map(squad => squad.id);

  squadIds.forEach(squadId => {
    if (existingTeamIds.has(squadId)) {
      conflicts.push(`Squad ID ${squadId} conflicts with existing Team ID`);
    }
  });

  // Check for name conflicts
  const existingTeamNames = new Set(
    existingTeams.map(team => team.name.toLowerCase())
  );
  squads.forEach(squad => {
    if (existingTeamNames.has(squad.name.toLowerCase())) {
      conflicts.push(
        `Squad name "${squad.name}" conflicts with existing Team name`
      );
    }
  });

  return {
    canMigrate: conflicts.length === 0,
    conflicts,
  };
};

/**
 * Generates a migration report showing what will be migrated
 */
export const generateMigrationReport = (
  squads: Squad[],
  squadMembers: SquadMember[]
): {
  summary: string;
  details: {
    squadsToMigrate: number;
    squadMembersToMigrate: number;
    squadsByType: Record<string, number>;
    squadsByStatus: Record<string, number>;
  };
} => {
  const squadsByType = squads.reduce(
    (acc, squad) => {
      acc[squad.type] = (acc[squad.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const squadsByStatus = squads.reduce(
    (acc, squad) => {
      acc[squad.status] = (acc[squad.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    summary: `Migration will convert ${squads.length} Squads to enhanced Teams and ${squadMembers.length} Squad Members to Team Members`,
    details: {
      squadsToMigrate: squads.length,
      squadMembersToMigrate: squadMembers.length,
      squadsByType,
      squadsByStatus,
    },
  };
};

/**
 * Performs the complete migration process
 * This should be used in the AppContext to migrate existing data
 */
export const performMigration = (
  squads: Squad[],
  squadMembers: SquadMember[],
  existingTeams: Team[],
  existingTeamMembers: TeamMember[]
): {
  success: boolean;
  migratedTeams: Team[];
  migratedTeamMembers: TeamMember[];
  errors: string[];
} => {
  try {
    // Validate migration
    const validation = validateMigration(existingTeams, squads);
    if (!validation.canMigrate) {
      return {
        success: false,
        migratedTeams: [],
        migratedTeamMembers: [],
        errors: validation.conflicts,
      };
    }

    // Perform migration
    const { teams: migratedTeams, teamMembers: migratedTeamMembers } =
      migrateAllSquadData(squads, squadMembers);

    return {
      success: true,
      migratedTeams,
      migratedTeamMembers,
      errors: [],
    };
  } catch (error) {
    return {
      success: false,
      migratedTeams: [],
      migratedTeamMembers: [],
      errors: [
        error instanceof Error ? error.message : 'Unknown migration error',
      ],
    };
  }
};
