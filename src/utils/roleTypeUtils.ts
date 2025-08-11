/**
 * Role Type Utilities
 *
 * Core utility functions for the role type mapping system,
 * including rate resolution, mapping suggestions, and analytics.
 */

import { Person, Role, AppConfig } from '@/types';
import {
  RoleType,
  RoleTypeMapping,
  RoleTypeSuggestion,
  RoleTypeDistribution,
  SeniorityLevel,
  RoleTypeRate,
  RoleCategory,
} from '@/types/roleTypes';

/**
 * Default role type categories with predefined colors
 */
export const ROLE_TYPE_CATEGORIES: Record<
  RoleCategory,
  { label: string; color: string }
> = {
  engineering: { label: 'Engineering', color: '#3b82f6' },
  'quality-assurance': { label: 'Quality Assurance', color: '#10b981' },
  'product-management': { label: 'Product Management', color: '#8b5cf6' },
  design: { label: 'Design', color: '#f59e0b' },
  'data-science': { label: 'Data Science', color: '#ef4444' },
  devops: { label: 'DevOps', color: '#6b7280' },
  security: { label: 'Security', color: '#dc2626' },
  management: { label: 'Management', color: '#7c3aed' },
  other: { label: 'Other', color: '#9ca3af' },
};

/**
 * Default color palette for role types
 */
export const DEFAULT_ROLE_TYPE_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#ec4899',
  '#6366f1',
];

/**
 * Get role type rate for a specific seniority level
 */
export const getRoleTypeRate = (
  roleType: RoleType,
  seniorityLevel: SeniorityLevel,
  rateType: 'annual' | 'hourly' | 'daily'
): number => {
  const rates = roleType.defaultRates[seniorityLevel];
  const rate = rates?.[rateType];

  if (rate && rate > 0) {
    return rate;
  }

  // Fallback to 'mid' level if specific seniority not available
  if (seniorityLevel !== 'mid') {
    const midRates = roleType.defaultRates.mid;
    const midRate = midRates?.[rateType];
    if (midRate && midRate > 0) {
      return midRate;
    }
  }

  return 0;
};

/**
 * Calculate person cost with role type fallback support
 */
export const calculatePersonCostWithRoleType = (
  person: Person,
  role: Role,
  roleType: RoleType | undefined,
  config: AppConfig
): {
  costPerHour: number;
  rateSource: 'personal' | 'role-default' | 'role-type' | 'legacy-fallback';
  effectiveRate: number;
  rateType: 'annual' | 'hourly' | 'daily';
} => {
  const safeConfig =
    config ||
    ({
      workingHoursPerDay: 8,
      workingDaysPerYear: 260,
      workingDaysPerWeek: 5,
      workingDaysPerMonth: 22,
    } as AppConfig);

  let costPerHour = 0;
  let rateSource:
    | 'personal'
    | 'role-default'
    | 'role-type'
    | 'legacy-fallback' = 'legacy-fallback';
  let effectiveRate = 0;
  let rateType: 'annual' | 'hourly' | 'daily' = 'hourly';

  if (person.employmentType === 'permanent') {
    // Priority 1: Individual salary
    if (person.annualSalary && person.annualSalary > 0) {
      costPerHour =
        person.annualSalary /
        (safeConfig.workingDaysPerYear * safeConfig.workingHoursPerDay);
      rateSource = 'personal';
      effectiveRate = person.annualSalary;
      rateType = 'annual';
    }
    // Priority 2: Role default annual salary
    else if (role.defaultAnnualSalary && role.defaultAnnualSalary > 0) {
      costPerHour =
        role.defaultAnnualSalary /
        (safeConfig.workingDaysPerYear * safeConfig.workingHoursPerDay);
      rateSource = 'role-default';
      effectiveRate = role.defaultAnnualSalary;
      rateType = 'annual';
    }
    // Priority 3: RoleType + Seniority rates (NEW)
    else if (roleType && person.seniorityLevel) {
      const roleTypeRate = getRoleTypeRate(
        roleType,
        person.seniorityLevel,
        'annual'
      );
      if (roleTypeRate > 0) {
        costPerHour =
          roleTypeRate /
          (safeConfig.workingDaysPerYear * safeConfig.workingHoursPerDay);
        rateSource = 'role-type';
        effectiveRate = roleTypeRate;
        rateType = 'annual';
      }
    }
    // Priority 4: RoleType fallback (mid-level)
    else if (roleType) {
      const roleTypeRate = getRoleTypeRate(roleType, 'mid', 'annual');
      if (roleTypeRate > 0) {
        costPerHour =
          roleTypeRate /
          (safeConfig.workingDaysPerYear * safeConfig.workingHoursPerDay);
        rateSource = 'role-type';
        effectiveRate = roleTypeRate;
        rateType = 'annual';
      }
    }
    // Priority 5: Legacy fallback
    else if (role.defaultRate && role.defaultRate > 0) {
      costPerHour = role.defaultRate;
      rateSource = 'legacy-fallback';
      effectiveRate = role.defaultRate;
      rateType = 'hourly';
    }
  } else if (person.employmentType === 'contractor') {
    // Priority 1: Individual contract rates
    if (
      person.contractDetails?.hourlyRate &&
      person.contractDetails.hourlyRate > 0
    ) {
      costPerHour = person.contractDetails.hourlyRate;
      rateSource = 'personal';
      effectiveRate = person.contractDetails.hourlyRate;
      rateType = 'hourly';
    } else if (
      person.contractDetails?.dailyRate &&
      person.contractDetails.dailyRate > 0
    ) {
      costPerHour =
        person.contractDetails.dailyRate / safeConfig.workingHoursPerDay;
      rateSource = 'personal';
      effectiveRate = person.contractDetails.dailyRate;
      rateType = 'daily';
    }
    // Priority 2: Role default contractor rates
    else if (role.defaultHourlyRate && role.defaultHourlyRate > 0) {
      costPerHour = role.defaultHourlyRate;
      rateSource = 'role-default';
      effectiveRate = role.defaultHourlyRate;
      rateType = 'hourly';
    } else if (role.defaultDailyRate && role.defaultDailyRate > 0) {
      costPerHour = role.defaultDailyRate / safeConfig.workingHoursPerDay;
      rateSource = 'role-default';
      effectiveRate = role.defaultDailyRate;
      rateType = 'daily';
    }
    // Priority 3: RoleType + Seniority rates (NEW)
    else if (roleType && person.seniorityLevel) {
      const hourlyRate = getRoleTypeRate(
        roleType,
        person.seniorityLevel,
        'hourly'
      );
      const dailyRate = getRoleTypeRate(
        roleType,
        person.seniorityLevel,
        'daily'
      );

      if (hourlyRate > 0) {
        costPerHour = hourlyRate;
        rateSource = 'role-type';
        effectiveRate = hourlyRate;
        rateType = 'hourly';
      } else if (dailyRate > 0) {
        costPerHour = dailyRate / safeConfig.workingHoursPerDay;
        rateSource = 'role-type';
        effectiveRate = dailyRate;
        rateType = 'daily';
      }
    }
    // Priority 4: RoleType fallback (mid-level)
    else if (roleType) {
      const hourlyRate = getRoleTypeRate(roleType, 'mid', 'hourly');
      const dailyRate = getRoleTypeRate(roleType, 'mid', 'daily');

      if (hourlyRate > 0) {
        costPerHour = hourlyRate;
        rateSource = 'role-type';
        effectiveRate = hourlyRate;
        rateType = 'hourly';
      } else if (dailyRate > 0) {
        costPerHour = dailyRate / safeConfig.workingHoursPerDay;
        rateSource = 'role-type';
        effectiveRate = dailyRate;
        rateType = 'daily';
      }
    }
    // Priority 5: Legacy fallback
    else if (role.defaultRate && role.defaultRate > 0) {
      costPerHour = role.defaultRate;
      rateSource = 'legacy-fallback';
      effectiveRate = role.defaultRate;
      rateType = 'hourly';
    }
  }

  return {
    costPerHour,
    rateSource,
    effectiveRate,
    rateType,
  };
};

/**
 * Calculate role type distribution for a team
 */
export const calculateRoleTypeDistribution = (
  teamId: string,
  people: Person[],
  roles: Role[],
  roleTypes: RoleType[],
  config: AppConfig
): RoleTypeDistribution[] => {
  const teamMembers = people.filter(p => p.teamId === teamId && p.isActive);
  const roleTypeMap = new Map<string, { count: number; totalCost: number }>();

  teamMembers.forEach(person => {
    const role = roles.find(r => r.id === person.roleId);
    if (!role) return;

    const roleType = roleTypes.find(rt => rt.id === role.roleTypeId);
    const roleTypeId = roleType?.id || 'unmapped';

    const existing = roleTypeMap.get(roleTypeId) || { count: 0, totalCost: 0 };

    // Calculate person cost using role type if available
    const costCalc = calculatePersonCostWithRoleType(
      person,
      role,
      roleType,
      config
    );
    const annualCost =
      costCalc.costPerHour *
      config.workingHoursPerDay *
      config.workingDaysPerYear;

    roleTypeMap.set(roleTypeId, {
      count: existing.count + 1,
      totalCost: existing.totalCost + annualCost,
    });
  });

  const totalMembers = teamMembers.length;

  return Array.from(roleTypeMap.entries())
    .map(([roleTypeId, data]) => {
      const roleType = roleTypes.find(rt => rt.id === roleTypeId);

      return {
        roleTypeId,
        roleTypeName: roleType?.name || 'Unmapped',
        category: roleType?.category || 'other',
        count: data.count,
        percentage: totalMembers > 0 ? (data.count / totalMembers) * 100 : 0,
        totalCost: data.totalCost,
        averageCost: data.count > 0 ? data.totalCost / data.count : 0,
        color: roleType?.color || ROLE_TYPE_CATEGORIES.other.color,
      };
    })
    .sort((a, b) => b.count - a.count); // Sort by count descending
};

/**
 * Suggest role type mappings for a job title using fuzzy matching
 */
export const suggestRoleTypeMapping = (
  jobTitle: string,
  existingRoleTypes: RoleType[],
  existingMappings: RoleTypeMapping[] = []
): RoleTypeSuggestion[] => {
  const normalizedTitle = jobTitle.toLowerCase().trim();
  const suggestions: RoleTypeSuggestion[] = [];

  // Find similar existing mappings first
  const similarMappings = existingMappings.filter(
    mapping =>
      mapping.jobTitle.toLowerCase().includes(normalizedTitle) ||
      normalizedTitle.includes(mapping.jobTitle.toLowerCase())
  );

  existingRoleTypes.forEach(roleType => {
    let confidence = 0;
    const reasoning: string[] = [];
    const similarTitles: string[] = [];

    // Exact name match
    if (roleType.name.toLowerCase() === normalizedTitle) {
      confidence = 0.95;
      reasoning.push('Exact role type name match');
    }
    // Partial name match
    else if (
      roleType.name.toLowerCase().includes(normalizedTitle) ||
      normalizedTitle.includes(roleType.name.toLowerCase())
    ) {
      confidence = 0.8;
      reasoning.push('Partial role type name match');
    }
    // Keyword matching for common patterns
    else {
      const titleWords = normalizedTitle.split(/\s+/);
      const roleTypeWords = roleType.name.toLowerCase().split(/\s+/);

      const matchingWords = titleWords.filter(word =>
        roleTypeWords.some(
          rtWord => rtWord.includes(word) || word.includes(rtWord)
        )
      );

      if (matchingWords.length > 0) {
        confidence = Math.min(
          0.7,
          (matchingWords.length / titleWords.length) * 0.7
        );
        reasoning.push(`Matching keywords: ${matchingWords.join(', ')}`);
      }
    }

    // Boost confidence if similar mappings exist
    const similarMappingForThisType = similarMappings.find(
      m => m.roleTypeId === roleType.id
    );
    if (similarMappingForThisType) {
      confidence = Math.min(0.9, confidence + 0.2);
      reasoning.push('Similar job titles already mapped to this role type');
      similarTitles.push(similarMappingForThisType.jobTitle);
    }

    // Category-based matching for specific patterns
    if (confidence > 0) {
      const categoryBoost = getCategoryBoost(
        normalizedTitle,
        roleType.category
      );
      confidence = Math.min(0.95, confidence + categoryBoost);

      if (categoryBoost > 0) {
        reasoning.push(
          `Category match (${ROLE_TYPE_CATEGORIES[roleType.category].label})`
        );
      }
    }

    if (confidence > 0.3) {
      // Only suggest if confidence is reasonable
      suggestions.push({
        roleTypeId: roleType.id,
        roleTypeName: roleType.name,
        confidence,
        reasoning: reasoning.join('; '),
        similarJobTitles: similarTitles,
      });
    }
  });

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3); // Return top 3 suggestions
};

/**
 * Get category-specific confidence boost based on job title keywords
 */
const getCategoryBoost = (jobTitle: string, category: RoleCategory): number => {
  const categoryKeywords: Record<RoleCategory, string[]> = {
    engineering: [
      'engineer',
      'developer',
      'programmer',
      'software',
      'backend',
      'frontend',
      'fullstack',
      'full-stack',
    ],
    'quality-assurance': [
      'qa',
      'quality',
      'test',
      'tester',
      'automation',
      'sdet',
    ],
    'product-management': ['product', 'pm', 'manager', 'owner', 'po'],
    design: ['design', 'designer', 'ux', 'ui', 'visual', 'graphic'],
    'data-science': [
      'data',
      'scientist',
      'analyst',
      'analytics',
      'ml',
      'ai',
      'machine learning',
    ],
    devops: [
      'devops',
      'ops',
      'infrastructure',
      'deployment',
      'cloud',
      'sre',
      'platform',
    ],
    security: ['security', 'cyber', 'infosec', 'compliance', 'audit'],
    management: ['manager', 'lead', 'director', 'vp', 'cto', 'ceo', 'head'],
    other: [],
  };

  const keywords = categoryKeywords[category] || [];
  const matchingKeywords = keywords.filter(keyword =>
    jobTitle.includes(keyword)
  );

  return matchingKeywords.length > 0 ? 0.1 : 0;
};

/**
 * Create a default role type mapping for unmapped job titles
 */
export const createDefaultRoleTypeMapping = (
  jobTitle: string,
  defaultRoleTypeId?: string
): RoleTypeMapping => {
  return {
    id: crypto.randomUUID(),
    jobTitle,
    roleTypeId: defaultRoleTypeId || 'other',
    confidence: 0.5,
    mappingSource: 'system-default',
    notes: 'Auto-created mapping for unmapped job title',
    createdDate: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };
};

/**
 * Validate role type configuration
 */
export const validateRoleType = (roleType: Partial<RoleType>): string[] => {
  const errors: string[] = [];

  if (!roleType.name?.trim()) {
    errors.push('Role type name is required');
  }

  if (!roleType.category) {
    errors.push('Role type category is required');
  }

  if (!roleType.color || !/^#[0-9A-F]{6}$/i.test(roleType.color)) {
    errors.push('Valid hex color is required');
  }

  // Validate that at least one rate is provided
  const hasAnyRate =
    roleType.defaultRates &&
    Object.values(roleType.defaultRates).some(
      rates => rates && (rates.annual || rates.hourly || rates.daily)
    );

  if (!hasAnyRate) {
    errors.push('At least one default rate must be provided');
  }

  return errors;
};
