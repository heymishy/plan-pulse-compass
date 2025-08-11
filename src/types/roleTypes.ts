/**
 * Role Type System - Core Interfaces
 *
 * This module defines the data structures for the role type mapping system,
 * enabling standardized job title classification and flexible financial calculations.
 */

export type RoleCategory =
  | 'engineering'
  | 'quality-assurance'
  | 'product-management'
  | 'design'
  | 'data-science'
  | 'devops'
  | 'security'
  | 'management'
  | 'other';

export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'principal';

export interface RoleTypeRate {
  annual?: number;
  hourly?: number;
  daily?: number;
}

/**
 * RoleType - Standardized role classification
 *
 * Represents a standardized role type (e.g., "Software Engineer", "Quality Engineer")
 * that multiple job titles can map to for consistent financial calculations and analytics.
 */
export interface RoleType {
  id: string;
  name: string; // Standardized name (e.g., "Software Engineer", "Quality Engineer")
  category: RoleCategory;
  description?: string;
  defaultRates: {
    junior: RoleTypeRate;
    mid: RoleTypeRate;
    senior: RoleTypeRate;
    lead: RoleTypeRate;
    principal: RoleTypeRate;
  };
  skills?: string[]; // Associated skill requirements
  color: string; // For UI visualization (hex color)
  isActive: boolean;
  createdDate: string;
  lastModified: string;
}

/**
 * RoleTypeMapping - Job title to role type mapping
 *
 * Maps specific job titles to standardized role types, enabling flexible
 * data import and consistent role classification across the system.
 */
export interface RoleTypeMapping {
  id: string;
  jobTitle: string; // Original job title from data import or manual entry
  roleTypeId: string; // Reference to standardized RoleType
  confidence: number; // Mapping confidence score (0-1)
  mappingSource:
    | 'manual'
    | 'ai-suggested'
    | 'import-default'
    | 'system-default';
  notes?: string; // Additional context about the mapping
  createdBy?: string; // User who created the mapping
  createdDate: string;
  lastModified: string;
}

/**
 * RoleTypeSuggestion - AI-powered mapping suggestion
 *
 * Used by the mapping engine to suggest role type mappings for unmapped job titles.
 */
export interface RoleTypeSuggestion {
  roleTypeId: string;
  roleTypeName: string;
  confidence: number; // 0-1 confidence score
  reasoning: string; // Human-readable explanation
  similarJobTitles: string[]; // Examples of similar mapped titles
}

/**
 * RoleTypeDistribution - Team composition analytics
 *
 * Provides insights into role type distribution within teams or projects.
 */
export interface RoleTypeDistribution {
  roleTypeId: string;
  roleTypeName: string;
  category: RoleCategory;
  count: number;
  percentage: number;
  totalCost: number;
  averageCost: number;
  color: string;
}

/**
 * RoleTypeConfiguration - System-wide role type settings
 *
 * Configures default behaviors and display preferences for the role type system.
 */
export interface RoleTypeConfiguration {
  defaultRoleTypeId?: string; // Default role type for unmapped titles
  autoMappingEnabled: boolean; // Enable AI-powered mapping suggestions
  displayTopRoleTypes: number; // Number of top role types to show in UI (default: 4)
  minimumConfidenceThreshold: number; // Minimum confidence for auto-mapping (0-1)
  colorPalette: string[]; // Available colors for role type visualization
  lastUpdated: string;
}
