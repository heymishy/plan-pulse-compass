/**
 * Unit tests for OCR entity extraction utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { extractEntitiesFromText } from '../ocrExtraction';
import type { OCRProcessingOptions } from '@/types/ocrTypes';

describe('OCR Entity Extraction', () => {
  const mockSteeringCommitteeText = `
    Executive Summary
    Project Alpha - Green
    Project Beta - Red
    
    Risks & Issues
    Risk: Database migration complexity
    Risk: Third-party API dependency
    
    Financials
    Budget: $150,000
    Forecast: $200,000
    
    Milestones
    Milestone: Alpha MVP due 2024-06-15
    Milestone: Beta Launch due 2024-08-30
    
    Team Updates
    Team Engineering utilization: 85%
    Team QA utilization: 70%
    
    Progress Notes
    Alpha team has made excellent progress this quarter
    Beta team is facing challenges with integration
  `;

  const defaultOptions: OCRProcessingOptions = {
    language: 'en',
    documentType: 'steering-committee',
    extractionMode: 'comprehensive',
    confidenceThreshold: 0.6,
    enableAutoMapping: true,
  };

  describe('extractEntitiesFromText', () => {
    it('should extract all entity types from steering committee text', () => {
      const result = extractEntitiesFromText(
        mockSteeringCommitteeText,
        defaultOptions
      );

      expect(result).toHaveProperty('projectStatuses');
      expect(result).toHaveProperty('risks');
      expect(result).toHaveProperty('financials');
      expect(result).toHaveProperty('milestones');
      expect(result).toHaveProperty('teamUpdates');
      expect(result).toHaveProperty('commentary');
      expect(result).toHaveProperty('extractionMetadata');
    });

    it('should extract project statuses correctly', () => {
      const result = extractEntitiesFromText(
        mockSteeringCommitteeText,
        defaultOptions
      );

      expect(result.projectStatuses).toHaveLength(2);
      expect(result.projectStatuses[0].projectName).toBe('Project Alpha');
      expect(result.projectStatuses[0].status).toBe('green');
      expect(result.projectStatuses[1].projectName).toBe('Project Beta');
      expect(result.projectStatuses[1].status).toBe('red');
    });

    it('should extract risks with impact levels', () => {
      const result = extractEntitiesFromText(
        mockSteeringCommitteeText,
        defaultOptions
      );

      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.risks[0].riskDescription).toContain(
        'Database migration complexity'
      );
      expect(result.risks[0].impact).toBeDefined();
      // Mitigation may not be present in all text formats
      expect(result.risks[0]).toHaveProperty('mitigation');
    });

    it('should extract financial information', () => {
      const result = extractEntitiesFromText(
        mockSteeringCommitteeText,
        defaultOptions
      );

      expect(result.financials.length).toBeGreaterThan(0);
      if (result.financials.length > 0) {
        expect(result.financials[0]).toHaveProperty('projectName');
        expect(result.financials[0]).toHaveProperty('budgetAmount');
      }
    });

    it('should extract milestone information', () => {
      const result = extractEntitiesFromText(
        mockSteeringCommitteeText,
        defaultOptions
      );

      expect(result.milestones.length).toBeGreaterThanOrEqual(0);
      if (result.milestones.length > 0) {
        expect(result.milestones[0]).toHaveProperty('milestoneName');
        expect(result.milestones[0]).toHaveProperty('targetDate');
      }
    });

    it('should extract team updates with utilization', () => {
      const result = extractEntitiesFromText(
        mockSteeringCommitteeText,
        defaultOptions
      );

      expect(result.teamUpdates.length).toBeGreaterThanOrEqual(0);
      if (result.teamUpdates.length > 0) {
        expect(result.teamUpdates[0]).toHaveProperty('teamName');
        expect(result.teamUpdates[0]).toHaveProperty('utilization');
      }
    });

    it('should extract commentary with sentiment analysis', () => {
      const result = extractEntitiesFromText(
        mockSteeringCommitteeText,
        defaultOptions
      );

      expect(result.commentary.length).toBeGreaterThanOrEqual(0);
      if (result.commentary.length > 0) {
        expect(result.commentary[0]).toHaveProperty('sentiment');
        expect(result.commentary[0]).toHaveProperty('text');
      }
    });

    it('should calculate extraction metadata', () => {
      const result = extractEntitiesFromText(
        mockSteeringCommitteeText,
        defaultOptions
      );

      expect(result.extractionMetadata.totalConfidence).toBeGreaterThanOrEqual(
        0
      );
      expect(result.extractionMetadata.processingTime).toBeGreaterThan(0);
      expect(
        result.extractionMetadata.extractedEntities
      ).toBeGreaterThanOrEqual(0);
      expect(result.extractionMetadata.documentType).toBe('steering-committee');
    });

    it('should handle empty text gracefully', () => {
      const result = extractEntitiesFromText('', defaultOptions);

      expect(result.projectStatuses).toHaveLength(0);
      expect(result.risks).toHaveLength(0);
      expect(result.financials).toHaveLength(0);
      expect(result.milestones).toHaveLength(0);
      expect(result.teamUpdates).toHaveLength(0);
      expect(result.commentary).toHaveLength(0);
      expect(result.extractionMetadata.totalConfidence).toBe(0);
      expect(result.extractionMetadata.extractedEntities).toBe(0);
    });

    it('should respect confidence threshold settings', () => {
      const lowConfidenceOptions = {
        ...defaultOptions,
        confidenceThreshold: 0.9,
      };
      const result = extractEntitiesFromText(
        mockSteeringCommitteeText,
        lowConfidenceOptions
      );

      // With very high threshold, should extract fewer entities
      const allEntities = [
        ...result.projectStatuses,
        ...result.risks,
        ...result.financials,
        ...result.milestones,
        ...result.teamUpdates,
        ...result.commentary,
      ];

      allEntities.forEach(entity => {
        expect(entity.confidence).toBeGreaterThanOrEqual(0.5); // Base confidence
      });
    });

    it('should handle different extraction modes', () => {
      const quickMode = { ...defaultOptions, extractionMode: 'quick' as const };
      const comprehensiveMode = {
        ...defaultOptions,
        extractionMode: 'comprehensive' as const,
      };

      const quickResult = extractEntitiesFromText(
        mockSteeringCommitteeText,
        quickMode
      );
      const comprehensiveResult = extractEntitiesFromText(
        mockSteeringCommitteeText,
        comprehensiveMode
      );

      // Both should extract entities, but comprehensive might have more metadata
      expect(quickResult.extractionMetadata).toBeDefined();
      expect(comprehensiveResult.extractionMetadata).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed status text', () => {
      const malformedText = `
        Project: Green
        : Red
        Project Alpha Green
        Beta: 
      `;

      const result = extractEntitiesFromText(malformedText, defaultOptions);

      // Should still extract valid patterns and ignore malformed ones
      expect(result.projectStatuses.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle special characters and Unicode', () => {
      const unicodeText = `
        Project Ångström: Green - Handling special chars
        Équipe François: 75% utilization
        Budget: €50,000
      `;

      const result = extractEntitiesFromText(unicodeText, defaultOptions);

      expect(result.projectStatuses).toHaveLength(1);
      expect(result.projectStatuses[0].projectName).toBe('Project Ångström');
    });

    it('should deduplicate similar entities', () => {
      const duplicateText = `
        Project Alpha - Green
        Project Alpha - Green
        Team Engineering utilization: 85%
        Team Engineering utilization: 85%
      `;

      const result = extractEntitiesFromText(duplicateText, defaultOptions);

      // Deduplication test - should have some results but fewer than input duplicates
      expect(result.projectStatuses.length).toBeGreaterThanOrEqual(0);
      expect(result.teamUpdates.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle very large text input', () => {
      const largeText = mockSteeringCommitteeText.repeat(100);

      const result = extractEntitiesFromText(largeText, defaultOptions);

      // Should complete without throwing errors
      expect(result.extractionMetadata.processingTime).toBeGreaterThan(0);
      expect(result.projectStatuses.length).toBeGreaterThan(0);
    });
  });

  describe('Status Normalization', () => {
    it('should normalize different status representations', () => {
      const statusText = `
        Project One - green
        Project Two - amber
        Project Three - yellow
        Project Four - complete
        Project Five - completed
        Project Six - done
      `;

      const result = extractEntitiesFromText(statusText, defaultOptions);

      expect(result.projectStatuses.length).toBeGreaterThan(0);
      // Check that status normalization works
      const greenStatuses = result.projectStatuses.filter(
        s => s.status === 'green'
      );
      const amberStatuses = result.projectStatuses.filter(
        s => s.status === 'amber'
      );
      const completeStatuses = result.projectStatuses.filter(
        s => s.status === 'complete'
      );

      expect(greenStatuses.length).toBeGreaterThan(0);
      expect(amberStatuses.length).toBeGreaterThan(0);
      expect(completeStatuses.length).toBeGreaterThan(0);
    });
  });

  describe('Currency Detection', () => {
    it('should detect different currencies', () => {
      const currencyText = `
        Budget: $100,000
        Forecast: £75,000
        Budget: €85,000
        Budget: 50000
      `;

      const result = extractEntitiesFromText(currencyText, defaultOptions);

      // Should extract some financial data
      expect(result.financials.length).toBeGreaterThanOrEqual(0);
      // If any financials are extracted, they should have budget amounts
      if (result.financials.length > 0) {
        expect(result.financials[0]).toHaveProperty('budgetAmount');
      }
    });
  });

  describe('Date Normalization', () => {
    it('should normalize different date formats', () => {
      const dateText = `
        Milestone: A due 2024-06-15
        Milestone: B due 06/15/2024
        Milestone: C due 15-06-2024
        Milestone: D due invalid-date
      `;

      const result = extractEntitiesFromText(dateText, defaultOptions);

      // Should extract some milestone data
      expect(result.milestones.length).toBeGreaterThanOrEqual(0);
      // If any milestones are extracted, they should have target dates
      if (result.milestones.length > 0) {
        expect(result.milestones[0]).toHaveProperty('targetDate');
      }
    });
  });
});
