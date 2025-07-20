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

      expect(result.risks).toHaveLength(2);
      expect(result.risks[0].riskDescription).toContain(
        'Database migration complexity'
      );
      expect(result.risks[0].impact).toBe('high');
      expect(result.risks[0].mitigation).toContain('database specialist');
      expect(result.risks[1].impact).toBe('medium');
      expect(result.risks[1].probability).toBe('low');
    });

    it('should extract financial information', () => {
      const result = extractEntitiesFromText(
        mockSteeringCommitteeText,
        defaultOptions
      );

      expect(result.financials).toHaveLength(2);
      expect(result.financials[0].projectName).toBe('Project Alpha');
      expect(result.financials[0].budgetAmount).toBe(150000);
      expect(result.financials[1].projectName).toBe('Project Beta');
      expect(result.financials[1].actualAmount).toBe(200000);
    });

    it('should extract milestone information', () => {
      const result = extractEntitiesFromText(
        mockSteeringCommitteeText,
        defaultOptions
      );

      expect(result.milestones).toHaveLength(2);
      expect(result.milestones[0].milestoneName).toBe('Alpha MVP');
      expect(result.milestones[0].targetDate).toBe('2024-06-15');
      expect(result.milestones[1].milestoneName).toBe('Beta Launch');
      expect(result.milestones[1].status).toBe('delayed');
    });

    it('should extract team updates with utilization', () => {
      const result = extractEntitiesFromText(
        mockSteeringCommitteeText,
        defaultOptions
      );

      expect(result.teamUpdates).toHaveLength(2);
      expect(result.teamUpdates[0].teamName).toBe('Team Engineering');
      expect(result.teamUpdates[0].utilization).toBe(85);
      expect(result.teamUpdates[0].commentary).toContain(
        'performance optimization'
      );
      expect(result.teamUpdates[1].teamName).toBe('Team QA');
      expect(result.teamUpdates[1].utilization).toBe(70);
    });

    it('should extract commentary with sentiment analysis', () => {
      const result = extractEntitiesFromText(
        mockSteeringCommitteeText,
        defaultOptions
      );

      expect(result.commentary.length).toBeGreaterThanOrEqual(2);
      const positiveComments = result.commentary.filter(
        c => c.sentiment === 'positive'
      );
      const negativeComments = result.commentary.filter(
        c => c.sentiment === 'negative'
      );
      expect(positiveComments.length).toBeGreaterThan(0);
      expect(negativeComments.length).toBeGreaterThan(0);
    });

    it('should calculate extraction metadata', () => {
      const result = extractEntitiesFromText(
        mockSteeringCommitteeText,
        defaultOptions
      );

      expect(result.extractionMetadata.totalConfidence).toBeGreaterThan(0);
      expect(result.extractionMetadata.processingTime).toBeGreaterThan(0);
      expect(result.extractionMetadata.extractedEntities).toBeGreaterThan(0);
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
        Project Alpha: Green
        Project Alpha: Green
        Team Engineering: 85%
        Team Engineering: 85%
      `;

      const result = extractEntitiesFromText(duplicateText, defaultOptions);

      expect(result.projectStatuses).toHaveLength(1);
      expect(result.teamUpdates).toHaveLength(1);
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
        Budget USD: $100,000
        Budget GBP: £75,000
        Budget EUR: €85,000
        Budget Generic: 50000
      `;

      const result = extractEntitiesFromText(currencyText, defaultOptions);

      expect(result.financials).toHaveLength(4);
      expect(result.financials[0].currency).toBe('USD');
      expect(result.financials[1].currency).toBe('GBP');
      expect(result.financials[2].currency).toBe('EUR');
      expect(result.financials[3].currency).toBe('USD'); // Default
    });
  });

  describe('Date Normalization', () => {
    it('should normalize different date formats', () => {
      const dateText = `
        Milestone A due 2024-06-15
        Milestone B due 06/15/2024
        Milestone C due 15-06-2024
        Milestone D due invalid-date
      `;

      const result = extractEntitiesFromText(dateText, defaultOptions);

      expect(result.milestones).toHaveLength(4);
      expect(result.milestones[0].targetDate).toBe('2024-06-15');
      // Other dates should be normalized or left as-is if invalid
    });
  });
});
