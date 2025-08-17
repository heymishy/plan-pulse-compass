/**
 * Scenario Modification Engine
 * Handles applying modifications to scenario data including template execution
 * with if-then conditional logic and financial recalculation
 */

import type {
  ScenarioData,
  ScenarioModification,
  ScenarioTemplate,
  TemplateModification,
  ConditionalRule,
} from '@/types/scenarioTypes';
import type {
  EnhancedScenarioData,
  TeamCostCalculation,
  ProjectBurnAnalysis,
} from '@/types/scenarioFinancialTypes';
import {
  calculateTeamCosts,
  calculateProjectBurnAnalysis,
  calculateFinancialsInBatches,
  DEFAULT_ROLE_COSTS,
} from './scenarioFinancialCalculations';
import { DEFAULT_PERFORMANCE_CONFIG } from '@/types/scenarioFinancialTypes';

export interface ModificationContext {
  scenarioData: EnhancedScenarioData;
  parameters: Record<string, string | number | boolean>;
  userId?: string;
  timestamp: string;
}

export interface ModificationResult {
  success: boolean;
  modifiedData: EnhancedScenarioData;
  modifications: ScenarioModification[];
  errors: string[];
  warnings: string[];
  financialImpact?: {
    teamCostChanges: number;
    budgetVarianceChanges: number;
    affectedProjects: string[];
  };
}

/**
 * Execute a scenario template with all modifications and conditional logic
 */
export async function executeScenarioTemplate(
  template: ScenarioTemplate,
  parameters: Record<string, string | number | boolean>,
  scenarioData: EnhancedScenarioData,
  userId?: string
): Promise<ModificationResult> {
  const context: ModificationContext = {
    scenarioData: { ...scenarioData },
    parameters: processTemplateParameters(template, parameters),
    userId,
    timestamp: new Date().toISOString(),
  };

  const result: ModificationResult = {
    success: true,
    modifiedData: context.scenarioData,
    modifications: [],
    errors: [],
    warnings: [],
  };

  try {
    // Execute main template modifications
    for (const modification of template.config.modifications) {
      const modResult = await executeModification(modification, context);

      if (!modResult.success) {
        result.success = false;
        result.errors.push(...modResult.errors);
      } else {
        result.modifications.push(...modResult.modifications);
        context.scenarioData = modResult.modifiedData;
      }
    }

    // Execute conditional logic if present
    if (template.config.conditionalLogic) {
      for (const rule of template.config.conditionalLogic) {
        const conditionMet = evaluateCondition(rule.condition, context);

        if (conditionMet) {
          for (const action of rule.actions) {
            const actionResult = await executeModification(action, context);

            if (!actionResult.success) {
              result.success = false;
              result.errors.push(...actionResult.errors);
            } else {
              result.modifications.push(...actionResult.modifications);
              context.scenarioData = actionResult.modifiedData;
            }
          }
        }
      }
    }

    // Recalculate financial analysis after all modifications
    if (result.success) {
      await recalculateFinancials(context.scenarioData);
      result.modifiedData = context.scenarioData;

      // Calculate financial impact summary
      result.financialImpact = await calculateFinancialImpact(
        scenarioData,
        context.scenarioData
      );
    }
  } catch (error) {
    result.success = false;
    result.errors.push(
      `Template execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
}

/**
 * Execute a single modification on scenario data
 */
export async function executeModification(
  modification: TemplateModification,
  context: ModificationContext
): Promise<ModificationResult> {
  const result: ModificationResult = {
    success: true,
    modifiedData: { ...context.scenarioData },
    modifications: [],
    errors: [],
    warnings: [],
  };

  try {
    switch (modification.operation) {
      case 'create':
        await executeCreateOperation(modification, context, result);
        break;
      case 'update':
        await executeUpdateOperation(modification, context, result);
        break;
      case 'delete':
        await executeDeleteOperation(modification, context, result);
        break;
      case 'bulk-update':
        await executeBulkUpdateOperation(modification, context, result);
        break;
      default:
        result.errors.push(`Unknown operation: ${modification.operation}`);
        result.success = false;
    }
  } catch (error) {
    result.success = false;
    result.errors.push(
      `Modification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
}

/**
 * Execute create operation
 */
async function executeCreateOperation(
  modification: TemplateModification,
  context: ModificationContext,
  result: ModificationResult
): Promise<void> {
  const entityArray = result.modifiedData[modification.entityType] as any[];

  if (!Array.isArray(entityArray)) {
    result.errors.push(
      `Cannot create entity: ${modification.entityType} is not an array`
    );
    return;
  }

  // Create new entity with applied changes
  const newEntity: any = {
    id: crypto.randomUUID(),
    createdDate: context.timestamp,
    lastModified: context.timestamp,
  };

  // Apply all changes to the new entity
  for (const change of modification.changes) {
    const value = resolveParameterValue(change.value, context.parameters);
    applyChangeToEntity(newEntity, change.field, change.operation, value);
  }

  entityArray.push(newEntity);

  // Record the modification
  result.modifications.push({
    id: crypto.randomUUID(),
    timestamp: context.timestamp,
    type: 'create',
    entityType: modification.entityType,
    entityId: newEntity.id,
    entityName: newEntity.name || newEntity.id,
    description: `Created new ${modification.entityType}`,
    changes: modification.changes.map(change => ({
      field: change.field,
      oldValue: null,
      newValue: resolveParameterValue(change.value, context.parameters),
    })),
  });
}

/**
 * Execute update operation
 */
async function executeUpdateOperation(
  modification: TemplateModification,
  context: ModificationContext,
  result: ModificationResult
): Promise<void> {
  const entityArray = result.modifiedData[modification.entityType] as any[];

  if (!Array.isArray(entityArray)) {
    result.errors.push(
      `Cannot update entity: ${modification.entityType} is not an array`
    );
    return;
  }

  // Find entity to update based on filter
  let targetEntity: any = null;

  if (modification.filter) {
    targetEntity = entityArray.find(entity =>
      evaluateFilter(entity, modification.filter!)
    );
  }

  if (!targetEntity) {
    result.warnings.push(
      `No entity found to update for ${modification.entityType}`
    );
    return;
  }

  // Apply changes to the entity
  const changeDetails: any[] = [];

  for (const change of modification.changes) {
    const oldValue = targetEntity[change.field];
    const newValue = resolveParameterValue(change.value, context.parameters);

    applyChangeToEntity(targetEntity, change.field, change.operation, newValue);

    changeDetails.push({
      field: change.field,
      oldValue,
      newValue: targetEntity[change.field],
    });
  }

  targetEntity.lastModified = context.timestamp;

  // Record the modification
  result.modifications.push({
    id: crypto.randomUUID(),
    timestamp: context.timestamp,
    type: 'update',
    entityType: modification.entityType,
    entityId: targetEntity.id,
    entityName: targetEntity.name || targetEntity.id,
    description: `Updated ${modification.entityType}`,
    changes: changeDetails,
  });
}

/**
 * Execute delete operation
 */
async function executeDeleteOperation(
  modification: TemplateModification,
  context: ModificationContext,
  result: ModificationResult
): Promise<void> {
  const entityArray = result.modifiedData[modification.entityType] as any[];

  if (!Array.isArray(entityArray)) {
    result.errors.push(
      `Cannot delete entity: ${modification.entityType} is not an array`
    );
    return;
  }

  // Find entities to delete based on filter
  const entitiesToDelete = modification.filter
    ? entityArray.filter(entity => evaluateFilter(entity, modification.filter!))
    : [];

  if (entitiesToDelete.length === 0) {
    result.warnings.push(
      `No entities found to delete for ${modification.entityType}`
    );
    return;
  }

  // Remove entities and record modifications
  entitiesToDelete.forEach(entity => {
    const index = entityArray.indexOf(entity);
    if (index > -1) {
      entityArray.splice(index, 1);

      result.modifications.push({
        id: crypto.randomUUID(),
        timestamp: context.timestamp,
        type: 'delete',
        entityType: modification.entityType,
        entityId: entity.id,
        entityName: entity.name || entity.id,
        description: `Deleted ${modification.entityType}`,
        changes: [],
      });
    }
  });
}

/**
 * Execute bulk update operation
 */
async function executeBulkUpdateOperation(
  modification: TemplateModification,
  context: ModificationContext,
  result: ModificationResult
): Promise<void> {
  const entityArray = result.modifiedData[modification.entityType] as any[];

  if (!Array.isArray(entityArray)) {
    result.errors.push(
      `Cannot bulk update: ${modification.entityType} is not an array`
    );
    return;
  }

  // Find entities to update based on filter
  const entitiesToUpdate = modification.filter
    ? entityArray.filter(entity => evaluateFilter(entity, modification.filter!))
    : entityArray;

  if (entitiesToUpdate.length === 0) {
    result.warnings.push(
      `No entities found for bulk update of ${modification.entityType}`
    );
    return;
  }

  // Apply changes to all matching entities
  entitiesToUpdate.forEach(entity => {
    const changeDetails: any[] = [];

    for (const change of modification.changes) {
      const oldValue = entity[change.field];
      const newValue = resolveParameterValue(change.value, context.parameters);

      applyChangeToEntity(entity, change.field, change.operation, newValue);

      changeDetails.push({
        field: change.field,
        oldValue,
        newValue: entity[change.field],
      });
    }

    entity.lastModified = context.timestamp;

    result.modifications.push({
      id: crypto.randomUUID(),
      timestamp: context.timestamp,
      type: 'update',
      entityType: modification.entityType,
      entityId: entity.id,
      entityName: entity.name || entity.id,
      description: `Bulk updated ${modification.entityType}`,
      changes: changeDetails,
    });
  });
}

/**
 * Apply a change operation to an entity field
 */
function applyChangeToEntity(
  entity: any,
  field: string,
  operation: string,
  value: any
): void {
  switch (operation) {
    case 'set':
      entity[field] = value;
      break;
    case 'add':
      entity[field] = (entity[field] || 0) + value;
      break;
    case 'subtract':
      entity[field] = (entity[field] || 0) - value;
      break;
    case 'multiply':
      entity[field] = (entity[field] || 0) * value;
      break;
    default:
      throw new Error(`Unknown change operation: ${operation}`);
  }
}

/**
 * Evaluate a filter condition against an entity
 */
function evaluateFilter(entity: any, filter: any): boolean {
  const entityValue = entity[filter.field];
  const filterValue = filter.value;

  switch (filter.operator) {
    case 'equals':
      return entityValue === filterValue;
    case 'not-equals':
      return entityValue !== filterValue;
    case 'greater-than':
      return Number(entityValue) > Number(filterValue);
    case 'less-than':
      return Number(entityValue) < Number(filterValue);
    case 'contains':
      return String(entityValue)
        .toLowerCase()
        .includes(String(filterValue).toLowerCase());
    case 'in-range': {
      const numValue = Number(entityValue);
      const minValue = Number(filterValue);
      const maxValue = Number(filter.secondValue);
      return numValue >= minValue && numValue <= maxValue;
    }
    default:
      return false;
  }
}

/**
 * Evaluate a conditional rule condition
 */
function evaluateCondition(
  condition: any,
  context: ModificationContext
): boolean {
  const entityArray = context.scenarioData[condition.entityType] as any[];

  if (!Array.isArray(entityArray)) {
    return false;
  }

  return entityArray.some(entity => evaluateFilter(entity, condition));
}

/**
 * Resolve parameter values with template substitution
 */
function resolveParameterValue(
  value: string | number | boolean,
  parameters: Record<string, string | number | boolean>
): any {
  if (typeof value === 'string' && value.includes('{{')) {
    // Template substitution
    let resolvedValue = value;

    Object.entries(parameters).forEach(([key, paramValue]) => {
      const placeholder = `{{${key}}}`;
      resolvedValue = resolvedValue.replace(placeholder, String(paramValue));
    });

    // Try to convert back to appropriate type
    if (resolvedValue !== value) {
      const numValue = Number(resolvedValue);
      if (!isNaN(numValue)) {
        return numValue;
      }
      if (resolvedValue === 'true') return true;
      if (resolvedValue === 'false') return false;
    }

    return resolvedValue;
  }

  return value;
}

/**
 * Process template parameters and calculate derived values
 */
function processTemplateParameters(
  template: ScenarioTemplate,
  parameters: Record<string, string | number | boolean>
): Record<string, string | number | boolean> {
  const processed = { ...parameters };

  // Calculate derived parameters based on template logic
  template.config.parameters.forEach(param => {
    if (param.id === 'budgetMultiplier' && processed.budgetReduction) {
      processed.budgetMultiplier =
        (100 - Number(processed.budgetReduction)) / 100;
    }
    if (param.id === 'capacityMultiplier' && processed.capacityIncrease) {
      processed.capacityMultiplier =
        (100 + Number(processed.capacityIncrease)) / 100;
    }
    if (
      param.id === 'remoteProductivityMultiplier' &&
      processed.productivityChange
    ) {
      processed.remoteProductivityMultiplier =
        (100 + Number(processed.productivityChange)) / 100;
    }
    if (
      param.id === 'learningCurveMultiplier' &&
      processed.learningCurveImpact
    ) {
      processed.learningCurveMultiplier =
        (100 - Number(processed.learningCurveImpact)) / 100;
    }
    if (param.id === 'riskBufferMultiplier' && processed.riskBuffer) {
      processed.riskBufferMultiplier =
        (100 + Number(processed.riskBuffer)) / 100;
    }
  });

  return processed;
}

/**
 * Recalculate financial analysis after modifications
 */
async function recalculateFinancials(
  scenarioData: EnhancedScenarioData
): Promise<void> {
  try {
    const financialAnalysis = await calculateFinancialsInBatches(
      scenarioData,
      DEFAULT_PERFORMANCE_CONFIG,
      scenarioData.financialAnalysis?.roleCostConfig || DEFAULT_ROLE_COSTS,
      scenarioData.financialAnalysis?.teamCostConfig || []
    );

    scenarioData.financialAnalysis = financialAnalysis;
  } catch (error) {
    console.error('Failed to recalculate financial analysis:', error);
    // Continue without financial analysis rather than failing the entire operation
  }
}

/**
 * Calculate financial impact between two scenario states
 */
async function calculateFinancialImpact(
  beforeData: EnhancedScenarioData,
  afterData: EnhancedScenarioData
): Promise<{
  teamCostChanges: number;
  budgetVarianceChanges: number;
  affectedProjects: string[];
}> {
  const beforeTeamCosts = beforeData.financialAnalysis?.teamCosts || [];
  const afterTeamCosts = afterData.financialAnalysis?.teamCosts || [];
  const beforeProjectBurn =
    beforeData.financialAnalysis?.projectBurnAnalysis || [];
  const afterProjectBurn =
    afterData.financialAnalysis?.projectBurnAnalysis || [];

  // Calculate team cost changes
  const teamCostChanges = afterTeamCosts.reduce((total, afterTeam) => {
    const beforeTeam = beforeTeamCosts.find(
      bt => bt.teamId === afterTeam.teamId
    );
    const beforeCost = beforeTeam?.totalCost || 0;
    return total + (afterTeam.totalCost - beforeCost);
  }, 0);

  // Calculate budget variance changes
  const budgetVarianceChanges = afterProjectBurn.reduce(
    (total, afterProject) => {
      const beforeProject = beforeProjectBurn.find(
        bp => bp.projectId === afterProject.projectId
      );
      const beforeVariance = beforeProject?.budgetUtilization.variance || 0;
      return total + (afterProject.budgetUtilization.variance - beforeVariance);
    },
    0
  );

  // Find affected projects
  const affectedProjects = afterProjectBurn
    .filter(afterProject => {
      const beforeProject = beforeProjectBurn.find(
        bp => bp.projectId === afterProject.projectId
      );
      return (
        beforeProject &&
        (afterProject.burnRate.perQuarter !==
          beforeProject.burnRate.perQuarter ||
          afterProject.budgetUtilization.variance !==
            beforeProject.budgetUtilization.variance)
      );
    })
    .map(p => p.projectId);

  return {
    teamCostChanges,
    budgetVarianceChanges,
    affectedProjects,
  };
}
