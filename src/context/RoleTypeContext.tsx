/**
 * Role Type Context
 *
 * Provides centralized state management for role types, mappings, and configuration.
 * Integrates with the main app context while maintaining separation of concerns.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  RoleType,
  RoleTypeMapping,
  RoleTypeConfiguration,
  RoleCategory,
} from '@/types/roleTypes';
import {
  DEFAULT_ROLE_TYPE_COLORS,
  ROLE_TYPE_CATEGORIES,
  createDefaultRoleTypeMapping,
  suggestRoleTypeMapping,
  validateRoleType,
} from '@/utils/roleTypeUtils';

interface RoleTypeContextType {
  // State
  roleTypes: RoleType[];
  roleTypeMappings: RoleTypeMapping[];
  configuration: RoleTypeConfiguration;

  // Role Type Management
  addRoleType: (
    roleType: Omit<RoleType, 'id' | 'createdDate' | 'lastModified'>
  ) => RoleType;
  updateRoleType: (id: string, updates: Partial<RoleType>) => void;
  deleteRoleType: (id: string) => void;
  getRoleType: (id: string) => RoleType | undefined;
  getRoleTypesByCategory: (category: RoleCategory) => RoleType[];

  // Mapping Management
  addMapping: (
    mapping: Omit<RoleTypeMapping, 'id' | 'createdDate' | 'lastModified'>
  ) => RoleTypeMapping;
  updateMapping: (id: string, updates: Partial<RoleTypeMapping>) => void;
  deleteMapping: (id: string) => void;
  getMappingForJobTitle: (jobTitle: string) => RoleTypeMapping | undefined;
  suggestMappings: (
    jobTitle: string
  ) => ReturnType<typeof suggestRoleTypeMapping>;

  // Configuration
  updateConfiguration: (updates: Partial<RoleTypeConfiguration>) => void;

  // Utilities
  getNextAvailableColor: () => string;
  validateRoleTypeData: (roleType: Partial<RoleType>) => string[];

  // Setters for external updates
  setRoleTypes: (
    roleTypes: RoleType[] | ((prev: RoleType[]) => RoleType[])
  ) => void;
  setRoleTypeMappings: (
    mappings:
      | RoleTypeMapping[]
      | ((prev: RoleTypeMapping[]) => RoleTypeMapping[])
  ) => void;
}

const RoleTypeContext = createContext<RoleTypeContextType | undefined>(
  undefined
);

// Default configuration
const defaultConfiguration: RoleTypeConfiguration = {
  autoMappingEnabled: true,
  displayTopRoleTypes: 4,
  minimumConfidenceThreshold: 0.6,
  colorPalette: DEFAULT_ROLE_TYPE_COLORS,
  lastUpdated: new Date().toISOString(),
};

// Default role types for initial setup
const createDefaultRoleTypes = (): RoleType[] => [
  {
    id: 'software-engineer',
    name: 'Software Engineer',
    category: 'engineering',
    description: 'Develops and maintains software applications',
    defaultRates: {
      junior: { annual: 120000, hourly: 77, daily: 615 },
      mid: { annual: 150000, hourly: 96, daily: 769 },
      senior: { annual: 180000, hourly: 115, daily: 923 },
      lead: { annual: 220000, hourly: 141, daily: 1123 },
      principal: { annual: 280000, hourly: 179, daily: 1431 },
    },
    color: ROLE_TYPE_CATEGORIES.engineering.color,
    isActive: true,
    createdDate: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  },
  {
    id: 'quality-engineer',
    name: 'Quality Engineer',
    category: 'quality-assurance',
    description: 'Ensures software quality through testing and automation',
    defaultRates: {
      junior: { annual: 110000, hourly: 70, daily: 562 },
      mid: { annual: 150000, hourly: 96, daily: 769 },
      senior: { annual: 170000, hourly: 109, daily: 869 },
      lead: { annual: 200000, hourly: 128, daily: 1023 },
      principal: { annual: 250000, hourly: 160, daily: 1277 },
    },
    color: ROLE_TYPE_CATEGORIES['quality-assurance'].color,
    isActive: true,
    createdDate: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  },
  {
    id: 'product-manager',
    name: 'Product Manager',
    category: 'product-management',
    description: 'Defines product strategy and requirements',
    defaultRates: {
      junior: { annual: 130000, hourly: 83, daily: 665 },
      mid: { annual: 150000, hourly: 96, daily: 769 },
      senior: { annual: 180000, hourly: 115, daily: 923 },
      lead: { annual: 220000, hourly: 141, daily: 1123 },
      principal: { annual: 280000, hourly: 179, daily: 1431 },
    },
    color: ROLE_TYPE_CATEGORIES['product-management'].color,
    isActive: true,
    createdDate: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  },
];

export const RoleTypeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [roleTypes, setRoleTypes] = useLocalStorage<RoleType[]>(
    'roleTypes',
    createDefaultRoleTypes()
  );
  const [roleTypeMappings, setRoleTypeMappings] = useLocalStorage<
    RoleTypeMapping[]
  >('roleTypeMappings', []);
  const [configuration, setConfiguration] =
    useLocalStorage<RoleTypeConfiguration>(
      'roleTypeConfiguration',
      defaultConfiguration
    );

  // Role Type Management
  const addRoleType = React.useCallback(
    (
      roleTypeData: Omit<RoleType, 'id' | 'createdDate' | 'lastModified'>
    ): RoleType => {
      const newRoleType: RoleType = {
        ...roleTypeData,
        id: crypto.randomUUID(),
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };

      setRoleTypes(prev => [...prev, newRoleType]);
      return newRoleType;
    },
    [setRoleTypes]
  );

  const updateRoleType = React.useCallback(
    (id: string, updates: Partial<RoleType>): void => {
      setRoleTypes(prev =>
        prev.map(rt =>
          rt.id === id
            ? { ...rt, ...updates, lastModified: new Date().toISOString() }
            : rt
        )
      );
    },
    [setRoleTypes]
  );

  const deleteRoleType = React.useCallback(
    (id: string): void => {
      setRoleTypes(prev => prev.filter(rt => rt.id !== id));
      // Remove associated mappings
      setRoleTypeMappings(prev => prev.filter(m => m.roleTypeId !== id));
    },
    [setRoleTypes, setRoleTypeMappings]
  );

  const getRoleType = React.useCallback(
    (id: string): RoleType | undefined => {
      return roleTypes.find(rt => rt.id === id);
    },
    [roleTypes]
  );

  const getRoleTypesByCategory = React.useCallback(
    (category: RoleCategory): RoleType[] => {
      return roleTypes.filter(rt => rt.category === category && rt.isActive);
    },
    [roleTypes]
  );

  // Mapping Management
  const addMapping = React.useCallback(
    (
      mappingData: Omit<RoleTypeMapping, 'id' | 'createdDate' | 'lastModified'>
    ): RoleTypeMapping => {
      const newMapping: RoleTypeMapping = {
        ...mappingData,
        id: crypto.randomUUID(),
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };

      setRoleTypeMappings(prev => [...prev, newMapping]);
      return newMapping;
    },
    [setRoleTypeMappings]
  );

  const updateMapping = React.useCallback(
    (id: string, updates: Partial<RoleTypeMapping>): void => {
      setRoleTypeMappings(prev =>
        prev.map(m =>
          m.id === id
            ? { ...m, ...updates, lastModified: new Date().toISOString() }
            : m
        )
      );
    },
    [setRoleTypeMappings]
  );

  const deleteMapping = React.useCallback(
    (id: string): void => {
      setRoleTypeMappings(prev => prev.filter(m => m.id !== id));
    },
    [setRoleTypeMappings]
  );

  const getMappingForJobTitle = React.useCallback(
    (jobTitle: string): RoleTypeMapping | undefined => {
      return roleTypeMappings.find(
        m => m.jobTitle.toLowerCase() === jobTitle.toLowerCase()
      );
    },
    [roleTypeMappings]
  );

  const suggestMappings = React.useCallback(
    (jobTitle: string) => {
      return suggestRoleTypeMapping(jobTitle, roleTypes, roleTypeMappings);
    },
    [roleTypes, roleTypeMappings]
  );

  // Configuration
  const updateConfiguration = React.useCallback(
    (updates: Partial<RoleTypeConfiguration>): void => {
      setConfiguration(prev => ({
        ...prev,
        ...updates,
        lastUpdated: new Date().toISOString(),
      }));
    },
    [setConfiguration]
  );

  // Utilities
  const getNextAvailableColor = React.useCallback((): string => {
    const usedColors = new Set(roleTypes.map(rt => rt.color));
    const availableColor = configuration.colorPalette.find(
      color => !usedColors.has(color)
    );
    return availableColor || configuration.colorPalette[0];
  }, [roleTypes, configuration.colorPalette]);

  const validateRoleTypeData = React.useCallback(
    (roleType: Partial<RoleType>): string[] => {
      return validateRoleType(roleType);
    },
    []
  );

  const value: RoleTypeContextType = {
    // State
    roleTypes,
    roleTypeMappings,
    configuration,

    // Role Type Management
    addRoleType,
    updateRoleType,
    deleteRoleType,
    getRoleType,
    getRoleTypesByCategory,

    // Mapping Management
    addMapping,
    updateMapping,
    deleteMapping,
    getMappingForJobTitle,
    suggestMappings,

    // Configuration
    updateConfiguration,

    // Utilities
    getNextAvailableColor,
    validateRoleTypeData,

    // Setters
    setRoleTypes,
    setRoleTypeMappings,
  };

  return (
    <RoleTypeContext.Provider value={value}>
      {children}
    </RoleTypeContext.Provider>
  );
};

export const useRoleTypes = (): RoleTypeContextType => {
  const context = useContext(RoleTypeContext);
  if (!context) {
    throw new Error('useRoleTypes must be used within a RoleTypeProvider');
  }
  return context;
};
