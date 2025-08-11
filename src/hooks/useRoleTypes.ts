/**
 * useRoleTypes Hook
 *
 * Advanced hook that combines role type context with app context
 * to provide enhanced role type functionality and integration.
 */

import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useRoleTypes as useRoleTypeContext } from '@/context/RoleTypeContext';
import { calculateRoleTypeDistribution } from '@/utils/roleTypeUtils';
import {
  RoleType,
  RoleTypeMapping,
  RoleTypeDistribution,
  SeniorityLevel,
} from '@/types/roleTypes';
import { Person, Role } from '@/types';

export interface UseRoleTypesReturn {
  // Basic role type operations
  roleTypes: RoleType[];
  roleTypeMappings: RoleTypeMapping[];
  addRoleType: (
    roleType: Omit<RoleType, 'id' | 'createdDate' | 'lastModified'>
  ) => RoleType;
  updateRoleType: (id: string, updates: Partial<RoleType>) => void;
  deleteRoleType: (id: string) => void;

  // Enhanced operations with app context
  getRoleTypeForPerson: (person: Person) => RoleType | undefined;
  getTeamRoleTypeDistribution: (teamId: string) => RoleTypeDistribution[];
  getUnmappedJobTitles: () => { jobTitle: string; count: number }[];

  // Mapping operations
  addMapping: (
    mapping: Omit<RoleTypeMapping, 'id' | 'createdDate' | 'lastModified'>
  ) => RoleTypeMapping;
  updateMapping: (id: string, updates: Partial<RoleTypeMapping>) => void;
  deleteMapping: (id: string) => void;
  suggestMappings: (
    jobTitle: string
  ) => ReturnType<
    typeof import('@/utils/roleTypeUtils').suggestRoleTypeMapping
  >;
  createMappingForRole: (
    role: Role,
    roleTypeId: string,
    confidence?: number
  ) => RoleTypeMapping;
  autoMapUnmappedRoles: (minimumConfidence?: number) => {
    mapped: number;
    skipped: number;
  };

  // Statistics and analytics
  getRoleTypeStats: () => {
    totalRoleTypes: number;
    activeRoleTypes: number;
    mappedRoles: number;
    unmappedRoles: number;
    mappingCoverage: number;
  };

  // Utility functions
  findRoleTypeByName: (name: string) => RoleType | undefined;
  getMostCommonRoleTypes: (
    limit?: number
  ) => { roleType: RoleType; usage: number }[];
  getNextAvailableColor: () => string;
  validateRoleTypeData: (roleType: Partial<RoleType>) => string[];
}

export const useEnhancedRoleTypes = (): UseRoleTypesReturn => {
  const { people, roles, config } = useApp();
  const roleTypeContext = useRoleTypeContext();

  // Get role type for a specific person
  const getRoleTypeForPerson = useMemo(() => {
    return (person: Person): RoleType | undefined => {
      const role = roles.find(r => r.id === person.roleId);
      if (!role || !role.roleTypeId) return undefined;

      return roleTypeContext.getRoleType(role.roleTypeId);
    };
  }, [roles, roleTypeContext]);

  // Get role type distribution for a team
  const getTeamRoleTypeDistribution = useMemo(() => {
    return (teamId: string): RoleTypeDistribution[] => {
      return calculateRoleTypeDistribution(
        teamId,
        people,
        roles,
        roleTypeContext.roleTypes,
        config || ({} as any)
      );
    };
  }, [people, roles, roleTypeContext.roleTypes, config]);

  // Get unmapped job titles
  const getUnmappedJobTitles = useMemo(() => {
    return (): { jobTitle: string; count: number }[] => {
      const unmappedRoles = roles.filter(role => !role.roleTypeId);
      const titleCounts = unmappedRoles.reduce(
        (acc, role) => {
          acc[role.name] = (acc[role.name] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return Object.entries(titleCounts)
        .map(([jobTitle, count]) => ({ jobTitle, count }))
        .sort((a, b) => b.count - a.count);
    };
  }, [roles]);

  // Create mapping for a role
  const createMappingForRole = (
    role: Role,
    roleTypeId: string,
    confidence = 0.9
  ): RoleTypeMapping => {
    return roleTypeContext.addMapping({
      jobTitle: role.name,
      roleTypeId,
      confidence,
      mappingSource: 'manual',
      notes: `Created for role: ${role.name}`,
    });
  };

  // Auto-map unmapped roles using AI suggestions
  const autoMapUnmappedRoles = (
    minimumConfidence = 0.7
  ): { mapped: number; skipped: number } => {
    const unmappedRoles = roles.filter(role => !role.roleTypeId);
    let mapped = 0;
    let skipped = 0;

    unmappedRoles.forEach(role => {
      const suggestions = roleTypeContext.suggestMappings(role.name);
      const bestSuggestion = suggestions[0];

      if (bestSuggestion && bestSuggestion.confidence >= minimumConfidence) {
        roleTypeContext.addMapping({
          jobTitle: role.name,
          roleTypeId: bestSuggestion.roleTypeId,
          confidence: bestSuggestion.confidence,
          mappingSource: 'ai-suggested',
          notes: bestSuggestion.reasoning,
        });
        mapped++;
      } else {
        skipped++;
      }
    });

    return { mapped, skipped };
  };

  // Get role type statistics
  const getRoleTypeStats = useMemo(() => {
    return () => {
      const totalRoleTypes = roleTypeContext.roleTypes.length;
      const activeRoleTypes = roleTypeContext.roleTypes.filter(
        rt => rt.isActive
      ).length;
      const mappedRoles = roles.filter(role => role.roleTypeId).length;
      const unmappedRoles = roles.length - mappedRoles;
      const mappingCoverage =
        roles.length > 0 ? (mappedRoles / roles.length) * 100 : 0;

      return {
        totalRoleTypes,
        activeRoleTypes,
        mappedRoles,
        unmappedRoles,
        mappingCoverage,
      };
    };
  }, [roleTypeContext.roleTypes, roles]);

  // Find role type by name
  const findRoleTypeByName = (name: string): RoleType | undefined => {
    return roleTypeContext.roleTypes.find(
      rt =>
        rt.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(rt.name.toLowerCase())
    );
  };

  // Get most common role types based on usage
  const getMostCommonRoleTypes = (
    limit = 5
  ): { roleType: RoleType; usage: number }[] => {
    const roleTypeUsage = roles.reduce(
      (acc, role) => {
        if (role.roleTypeId) {
          acc[role.roleTypeId] = (acc[role.roleTypeId] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(roleTypeUsage)
      .map(([roleTypeId, usage]) => ({
        roleType: roleTypeContext.getRoleType(roleTypeId)!,
        usage,
      }))
      .filter(item => item.roleType)
      .sort((a, b) => b.usage - a.usage)
      .slice(0, limit);
  };

  return {
    // Basic role type operations
    roleTypes: roleTypeContext.roleTypes,
    roleTypeMappings: roleTypeContext.roleTypeMappings,
    addRoleType: roleTypeContext.addRoleType,
    updateRoleType: roleTypeContext.updateRoleType,
    deleteRoleType: roleTypeContext.deleteRoleType,

    // Enhanced operations
    getRoleTypeForPerson,
    getTeamRoleTypeDistribution,
    getUnmappedJobTitles,

    // Mapping operations
    addMapping: roleTypeContext.addMapping,
    updateMapping: roleTypeContext.updateMapping,
    deleteMapping: roleTypeContext.deleteMapping,
    suggestMappings: roleTypeContext.suggestMappings,
    createMappingForRole,
    autoMapUnmappedRoles,

    // Statistics and analytics
    getRoleTypeStats,

    // Utility functions
    findRoleTypeByName,
    getMostCommonRoleTypes,
    getNextAvailableColor: roleTypeContext.getNextAvailableColor,
    validateRoleTypeData: roleTypeContext.validateRoleTypeData,
  };
};
