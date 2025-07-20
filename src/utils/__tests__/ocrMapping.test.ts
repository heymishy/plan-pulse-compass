/**
 * Unit tests for OCR entity mapping utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  mapExtractedEntitiesToExisting,
  generateContextUpdates,
} from '../ocrMapping';
import type {
  OCRExtractionResult,
  EntityMappingResult,
  ExtractedProjectStatus,
  ExtractedRisk,
  ExtractedMilestone,
  ExtractedTeamUpdate,
} from '@/types/ocrTypes';
import type {
  Project,
  Epic,
  Team,
  Milestone,
  Person,
  ActualAllocation,
} from '@/types';

describe('OCR Entity Mapping', () => {
  let mockProjects: Project[];
  let mockEpics: Epic[];
  let mockTeams: Team[];
  let mockMilestones: Milestone[];
  let mockPeople: Person[];
  let mockExtractionResult: OCRExtractionResult;

  beforeEach(() => {
    // Mock existing data
    mockProjects = [
      {
        id: 'proj-1',
        name: 'Alpha Project',
        status: 'in-progress',
        lastUpdated: '2024-01-01T00:00:00Z',
      } as Project,
      {
        id: 'proj-2',
        name: 'Beta Initiative',
        status: 'planning',
        lastUpdated: '2024-01-01T00:00:00Z',
      } as Project,
    ];

    mockEpics = [
      {
        id: 'epic-1',
        name: 'Alpha MVP Epic',
        status: 'in-progress',
        projectId: 'proj-1',
      } as Epic,
      {
        id: 'epic-2',
        name: 'Beta Core Features',
        status: 'todo',
        projectId: 'proj-2',
      } as Epic,
    ];

    mockTeams = [
      {
        id: 'team-1',
        name: 'Engineering Team',
      } as Team,
      {
        id: 'team-2',
        name: 'QA Team',
      } as Team,
    ];

    mockMilestones = [
      {
        id: 'milestone-1',
        name: 'Alpha Release',
        projectId: 'proj-1',
        status: 'in-progress',
        actualDate: null,
      } as Milestone,
      {
        id: 'milestone-2',
        name: 'Beta Launch',
        projectId: 'proj-2',
        status: 'not-started',
        actualDate: null,
      } as Milestone,
    ];

    mockPeople = [
      {
        id: 'person-1',
        name: 'John Doe',
        teamId: 'team-1',
      } as Person,
    ];

    // Mock extraction result
    mockExtractionResult = {
      rawText: 'Test steering committee text',
      projectStatuses: [
        {
          text: 'Alpha Project: Green',
          confidence: 0.9,
          projectName: 'Alpha Project',
          status: 'green',
          ragReason: 'On track',
        } as ExtractedProjectStatus,
        {
          text: 'Gamma Project: Red',
          confidence: 0.8,
          projectName: 'Gamma Project',
          status: 'red',
        } as ExtractedProjectStatus,
      ],
      risks: [
        {
          text: 'Risk: Database migration',
          confidence: 0.85,
          riskDescription: 'Database migration complexity',
          impact: 'high',
          probability: 'medium',
          mitigation: 'Hire specialist',
        } as ExtractedRisk,
      ],
      financials: [],
      milestones: [
        {
          text: 'Alpha Release due 2024-06-15',
          confidence: 0.8,
          milestoneName: 'Alpha Release',
          projectName: 'Alpha Project',
          targetDate: '2024-06-15',
          status: 'completed',
        } as ExtractedMilestone,
      ],
      teamUpdates: [
        {
          text: 'Engineering Team: 85%',
          confidence: 0.9,
          teamName: 'Engineering Team',
          utilization: 85,
          commentary: 'Working on performance',
        } as ExtractedTeamUpdate,
      ],
      commentary: [],
      extractionMetadata: {
        totalConfidence: 0.86,
        processingTime: 150,
        extractedEntities: 4,
        documentType: 'steering-committee',
      },
    };
  });

  describe('mapExtractedEntitiesToExisting', () => {
    it('should map extracted entities to existing data', () => {
      const result = mapExtractedEntitiesToExisting(mockExtractionResult, {
        projects: mockProjects,
        epics: mockEpics,
        teams: mockTeams,
        milestones: mockMilestones,
        people: mockPeople,
      });

      expect(result).toHaveProperty('mappings');
      expect(result).toHaveProperty('unmappedEntities');
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('recommendations');
    });

    it('should successfully map similar project names', () => {
      const result = mapExtractedEntitiesToExisting(mockExtractionResult, {
        projects: mockProjects,
        epics: mockEpics,
        teams: mockTeams,
        milestones: mockMilestones,
        people: mockPeople,
      });

      // Should map "Alpha Project" to existing "Alpha Project"
      const alphaMappings = result.mappings.filter(
        m =>
          (m.extractedEntity as ExtractedProjectStatus).projectName ===
          'Alpha Project'
      );

      expect(alphaMappings).toHaveLength(1);
      expect(alphaMappings[0].existingEntityId).toBe('proj-1');
      expect(alphaMappings[0].existingEntityType).toBe('project');
      expect(alphaMappings[0].matchConfidence).toBeGreaterThan(0.8);
    });

    it('should identify unmapped entities', () => {
      const result = mapExtractedEntitiesToExisting(mockExtractionResult, {
        projects: mockProjects,
        epics: mockEpics,
        teams: mockTeams,
        milestones: mockMilestones,
        people: mockPeople,
      });

      // "Gamma Project" should be unmapped
      const unmappedProjects = result.unmappedEntities.filter(
        e => 'projectName' in e && e.projectName === 'Gamma Project'
      );

      expect(unmappedProjects).toHaveLength(1);
    });

    it('should map team updates correctly', () => {
      const result = mapExtractedEntitiesToExisting(mockExtractionResult, {
        projects: mockProjects,
        epics: mockEpics,
        teams: mockTeams,
        milestones: mockMilestones,
        people: mockPeople,
      });

      const teamMappings = result.mappings.filter(
        m => m.existingEntityType === 'team'
      );

      expect(teamMappings).toHaveLength(1);
      expect(teamMappings[0].existingEntityId).toBe('team-1');
      expect(teamMappings[0].matchConfidence).toBeGreaterThan(0.5);
    });

    it('should map milestones with project context', () => {
      const result = mapExtractedEntitiesToExisting(mockExtractionResult, {
        projects: mockProjects,
        epics: mockEpics,
        teams: mockTeams,
        milestones: mockMilestones,
        people: mockPeople,
      });

      const milestoneMappings = result.mappings.filter(
        m => m.existingEntityType === 'milestone'
      );

      expect(milestoneMappings).toHaveLength(1);
      expect(milestoneMappings[0].existingEntityId).toBe('milestone-1');
    });

    it('should detect conflicts for status changes', () => {
      // Create a scenario where extracted status conflicts with existing
      const conflictingExtractionResult = {
        ...mockExtractionResult,
        projectStatuses: [
          {
            text: 'Alpha Project: Red',
            confidence: 0.9,
            projectName: 'Alpha Project',
            status: 'red',
          } as ExtractedProjectStatus,
        ],
      };

      const result = mapExtractedEntitiesToExisting(
        conflictingExtractionResult,
        {
          projects: mockProjects,
          epics: mockEpics,
          teams: mockTeams,
          milestones: mockMilestones,
          people: mockPeople,
        }
      );

      // Should detect conflict between existing 'in-progress' and extracted 'red'
      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    it('should generate appropriate recommendations', () => {
      const result = mapExtractedEntitiesToExisting(mockExtractionResult, {
        projects: mockProjects,
        epics: mockEpics,
        teams: mockTeams,
        milestones: mockMilestones,
        people: mockPeople,
      });

      expect(result.recommendations.autoApplyCount).toBeGreaterThanOrEqual(0);
      expect(result.recommendations.requiresReviewCount).toBeGreaterThanOrEqual(
        0
      );
      expect(result.recommendations.suggestedActions).toBeInstanceOf(Array);
      expect(result.recommendations.suggestedActions.length).toBeGreaterThan(0);
    });

    it('should handle empty existing data gracefully', () => {
      const result = mapExtractedEntitiesToExisting(mockExtractionResult, {
        projects: [],
        epics: [],
        teams: [],
        milestones: [],
        people: [],
      });

      expect(result.mappings).toHaveLength(0);
      expect(result.unmappedEntities.length).toBe(4); // All entities should be unmapped
      expect(result.conflicts).toHaveLength(0);
    });

    it('should handle empty extraction result gracefully', () => {
      const emptyExtractionResult: OCRExtractionResult = {
        rawText: '',
        projectStatuses: [],
        risks: [],
        financials: [],
        milestones: [],
        teamUpdates: [],
        commentary: [],
        extractionMetadata: {
          totalConfidence: 0,
          processingTime: 0,
          extractedEntities: 0,
          documentType: 'steering-committee',
        },
      };

      const result = mapExtractedEntitiesToExisting(emptyExtractionResult, {
        projects: mockProjects,
        epics: mockEpics,
        teams: mockTeams,
        milestones: mockMilestones,
        people: mockPeople,
      });

      expect(result.mappings).toHaveLength(0);
      expect(result.unmappedEntities).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('generateContextUpdates', () => {
    let mockMappingResult: EntityMappingResult;
    let mockActualAllocations: ActualAllocation[];

    beforeEach(() => {
      mockActualAllocations = [];

      mockMappingResult = {
        mappings: [
          {
            extractedEntity: mockExtractionResult.projectStatuses[0],
            existingEntityId: 'proj-1',
            existingEntityType: 'project',
            matchConfidence: 0.9,
            mappingReason: 'High confidence match',
            conflictLevel: 'none',
          },
          {
            extractedEntity: mockExtractionResult.teamUpdates[0],
            existingEntityId: 'team-1',
            existingEntityType: 'team',
            matchConfidence: 0.85,
            mappingReason: 'Team name match',
            conflictLevel: 'low',
          },
        ],
        unmappedEntities: [],
        conflicts: [],
        recommendations: {
          autoApplyCount: 2,
          requiresReviewCount: 0,
          suggestedActions: ['Apply high confidence mappings'],
        },
      };
    });

    it('should generate context updates for projects', () => {
      const updates = generateContextUpdates(
        mockMappingResult,
        mockExtractionResult,
        {
          projects: mockProjects,
          epics: mockEpics,
          teams: mockTeams,
          milestones: mockMilestones,
          actualAllocations: mockActualAllocations,
        }
      );

      expect(updates.projects).toHaveLength(2);

      // First project should have updated status
      const updatedProject = updates.projects.find(p => p.id === 'proj-1');
      expect(updatedProject?.status).toBe('in-progress'); // green -> in-progress
      expect(updatedProject?.lastUpdated).not.toBe('2024-01-01T00:00:00Z');
    });

    it('should generate context updates for epics', () => {
      // Create mapping for epic
      const epicMappingResult = {
        ...mockMappingResult,
        mappings: [
          {
            extractedEntity: {
              ...mockExtractionResult.projectStatuses[0],
              projectName: 'Alpha MVP Epic', // Match epic name instead
            },
            existingEntityId: 'epic-1',
            existingEntityType: 'epic' as const,
            matchConfidence: 0.9,
            mappingReason: 'Epic name match',
            conflictLevel: 'none' as const,
          },
        ],
      };

      const updates = generateContextUpdates(
        epicMappingResult,
        mockExtractionResult,
        {
          projects: mockProjects,
          epics: mockEpics,
          teams: mockTeams,
          milestones: mockMilestones,
          actualAllocations: mockActualAllocations,
        }
      );

      expect(updates.epics).toHaveLength(2);

      // First epic should have updated status
      const updatedEpic = updates.epics.find(e => e.id === 'epic-1');
      expect(updatedEpic?.status).toBe('in-progress'); // green -> in-progress
    });

    it('should create new risk entries', () => {
      const updates = generateContextUpdates(
        mockMappingResult,
        mockExtractionResult,
        {
          projects: mockProjects,
          epics: mockEpics,
          teams: mockTeams,
          milestones: mockMilestones,
          actualAllocations: mockActualAllocations,
        }
      );

      expect(updates.newRisks).toHaveLength(1);
      expect(updates.newRisks[0].description).toBe(
        'Database migration complexity'
      );
      expect(updates.newRisks[0].impact).toBe('high');
      expect(updates.newRisks[0].source).toBe('steering-committee-ocr');
    });

    it('should handle milestone updates', () => {
      const milestoneMappingResult = {
        ...mockMappingResult,
        mappings: [
          ...mockMappingResult.mappings,
          {
            extractedEntity: mockExtractionResult.milestones[0],
            existingEntityId: 'milestone-1',
            existingEntityType: 'milestone' as const,
            matchConfidence: 0.8,
            mappingReason: 'Milestone name match',
            conflictLevel: 'low' as const,
          },
        ],
      };

      const updates = generateContextUpdates(
        milestoneMappingResult,
        mockExtractionResult,
        {
          projects: mockProjects,
          epics: mockEpics,
          teams: mockTeams,
          milestones: mockMilestones,
          actualAllocations: mockActualAllocations,
        }
      );

      expect(updates.milestones).toHaveLength(2);

      const updatedMilestone = updates.milestones.find(
        m => m.id === 'milestone-1'
      );
      expect(updatedMilestone?.status).toBe('completed');
      expect(updatedMilestone?.actualDate).toBe('2024-06-15');
    });

    it('should preserve original data for unmapped entities', () => {
      const updates = generateContextUpdates(
        mockMappingResult,
        mockExtractionResult,
        {
          projects: mockProjects,
          epics: mockEpics,
          teams: mockTeams,
          milestones: mockMilestones,
          actualAllocations: mockActualAllocations,
        }
      );

      // Second project should remain unchanged
      const unchangedProject = updates.projects.find(p => p.id === 'proj-2');
      expect(unchangedProject?.status).toBe('planning');
      expect(unchangedProject?.lastUpdated).toBe('2024-01-01T00:00:00Z');
    });

    it('should only apply high-confidence mappings automatically', () => {
      // Create mapping with low confidence
      const lowConfidenceMappingResult = {
        ...mockMappingResult,
        mappings: [
          {
            extractedEntity: mockExtractionResult.projectStatuses[0],
            existingEntityId: 'proj-1',
            existingEntityType: 'project' as const,
            matchConfidence: 0.5, // Low confidence
            mappingReason: 'Low confidence match',
            conflictLevel: 'none' as const,
          },
        ],
      };

      const updates = generateContextUpdates(
        lowConfidenceMappingResult,
        mockExtractionResult,
        {
          projects: mockProjects,
          epics: mockEpics,
          teams: mockTeams,
          milestones: mockMilestones,
          actualAllocations: mockActualAllocations,
        }
      );

      // Low confidence mapping should not be applied automatically
      const unchangedProject = updates.projects.find(p => p.id === 'proj-1');
      expect(unchangedProject?.status).toBe('in-progress'); // Should remain unchanged
      expect(unchangedProject?.lastUpdated).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('Text Similarity and Matching', () => {
    it('should handle fuzzy string matching for similar names', () => {
      const similarProjects = [
        { id: 'proj-1', name: 'Project Alpha' } as Project,
        { id: 'proj-2', name: 'Project Beta' } as Project,
      ];

      const extractionWithTypos = {
        ...mockExtractionResult,
        projectStatuses: [
          {
            text: 'Projet Alpha: Green', // Typo in "Project"
            confidence: 0.9,
            projectName: 'Projet Alpha',
            status: 'green',
          } as ExtractedProjectStatus,
        ],
      };

      const result = mapExtractedEntitiesToExisting(extractionWithTypos, {
        projects: similarProjects,
        epics: [],
        teams: [],
        milestones: [],
        people: [],
      });

      // Should still map despite typo due to fuzzy matching
      expect(result.mappings.length).toBeGreaterThan(0);
    });

    it('should prioritize exact matches over fuzzy matches', () => {
      const projects = [
        { id: 'proj-1', name: 'Alpha' } as Project,
        { id: 'proj-2', name: 'Alpha Project' } as Project,
      ];

      const extractionResult = {
        ...mockExtractionResult,
        projectStatuses: [
          {
            text: 'Alpha Project: Green',
            confidence: 0.9,
            projectName: 'Alpha Project',
            status: 'green',
          } as ExtractedProjectStatus,
        ],
      };

      const result = mapExtractedEntitiesToExisting(extractionResult, {
        projects,
        epics: [],
        teams: [],
        milestones: [],
        people: [],
      });

      // Should map to exact match (proj-2) not partial match (proj-1)
      expect(result.mappings[0].existingEntityId).toBe('proj-2');
      expect(result.mappings[0].matchConfidence).toBe(1.0);
    });
  });

  describe('Conflict Detection', () => {
    it('should detect high-level conflicts for major status changes', () => {
      const conflictingProjects = [
        { id: 'proj-1', name: 'Alpha Project', status: 'completed' } as Project,
      ];

      const conflictingExtraction = {
        ...mockExtractionResult,
        projectStatuses: [
          {
            text: 'Alpha Project: Red',
            confidence: 0.9,
            projectName: 'Alpha Project',
            status: 'red',
          } as ExtractedProjectStatus,
        ],
      };

      const result = mapExtractedEntitiesToExisting(conflictingExtraction, {
        projects: conflictingProjects,
        epics: [],
        teams: [],
        milestones: [],
        people: [],
      });

      // Should detect conflict between 'completed' and 'red' status
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.conflicts[0].conflictLevel).toBe('high');
    });

    it('should detect date conflicts for milestones', () => {
      const milestonesWithDates = [
        {
          id: 'milestone-1',
          name: 'Alpha Release',
          actualDate: '2024-05-15',
        } as Milestone,
      ];

      const conflictingMilestones = {
        ...mockExtractionResult,
        milestones: [
          {
            text: 'Alpha Release due 2024-06-15',
            confidence: 0.8,
            milestoneName: 'Alpha Release',
            projectName: 'Alpha Project',
            targetDate: '2024-06-15',
            actualDate: '2024-07-15', // Different date
            status: 'completed',
          } as ExtractedMilestone,
        ],
      };

      const result = mapExtractedEntitiesToExisting(conflictingMilestones, {
        projects: mockProjects,
        epics: [],
        teams: [],
        milestones: milestonesWithDates,
        people: [],
      });

      // Should detect date conflict
      const milestoneConflicts = result.conflicts.filter(
        c => c.existingEntityType === 'milestone'
      );
      expect(milestoneConflicts.length).toBeGreaterThan(0);
    });
  });
});
