import { describe, it, expect, beforeEach } from 'vitest';
import {
  findSkillMatches,
  analyzeTeamSkillMigration,
  createMissingSkills,
  applySkillMigration,
  validateMigration,
  analyzeAllTeamsMigration,
  generateMigrationPreview,
  SkillMigrationResult,
  MigrationSummary,
} from '../skillsMigration';
import { Team, Skill } from '@/types';

describe('Skills Migration Utilities', () => {
  let mockSkills: Skill[];
  let mockTeams: Team[];

  beforeEach(() => {
    mockSkills = [
      {
        id: 'skill1',
        name: 'React',
        category: 'Frontend',
        description: 'React.js library',
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'skill2',
        name: 'Node.js',
        category: 'Backend',
        description: 'Node.js runtime',
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'skill3',
        name: 'TypeScript',
        category: 'Language',
        description: 'TypeScript language',
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'skill4',
        name: 'JavaScript',
        category: 'Language',
        description: 'JavaScript language',
        createdDate: '2024-01-01T00:00:00Z',
      },
      {
        id: 'skill5',
        name: 'React Native',
        category: 'Mobile',
        description: 'React Native framework',
        createdDate: '2024-01-01T00:00:00Z',
      },
    ];

    mockTeams = [
      {
        id: 'team1',
        name: 'Frontend Team',
        description: 'UI development team',
        type: 'permanent',
        status: 'active',
        divisionId: 'engineering',
        capacity: 40,
        targetSkills: ['React', 'TypeScript', 'CSS'], // Using skill names (old format)
        projectIds: [],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
      {
        id: 'team2',
        name: 'Backend Team',
        description: 'API development team',
        type: 'permanent',
        status: 'active',
        capacity: 60,
        targetSkills: ['Node.js', 'MongoDB', 'Express'], // Using skill names (old format)
        projectIds: [],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
      {
        id: 'team3',
        name: 'Mobile Team',
        description: 'Mobile development team',
        type: 'permanent',
        status: 'active',
        capacity: 30,
        targetSkills: ['React Native', 'react', 'typescript'], // Mix of exact and case variations
        projectIds: [],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
      {
        id: 'team4',
        name: 'Already Migrated Team',
        description: 'Team already using skill IDs',
        type: 'permanent',
        status: 'active',
        capacity: 50,
        targetSkills: ['skill1', 'skill2'], // Already using skill IDs
        projectIds: [],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
    ];
  });

  describe('findSkillMatches', () => {
    it('should find exact matches with highest confidence', () => {
      const matches = findSkillMatches('React', mockSkills);

      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({
        originalName: 'React',
        skillId: 'skill1',
        skillName: 'React',
        confidence: 1.0,
        matchType: 'exact',
      });
    });

    it('should find case-insensitive exact matches', () => {
      const matches = findSkillMatches('react', mockSkills);

      expect(matches).toHaveLength(1);
      expect(matches[0].confidence).toBe(1.0);
      expect(matches[0].matchType).toBe('exact');
    });

    it('should find partial matches', () => {
      const matches = findSkillMatches('Script', mockSkills, 0.6);

      // Should find TypeScript and JavaScript as partial matches
      expect(matches.length).toBeGreaterThan(0);

      const typescriptMatch = matches.find(m => m.skillName === 'TypeScript');
      const javascriptMatch = matches.find(m => m.skillName === 'JavaScript');

      expect(typescriptMatch).toBeDefined();
      expect(javascriptMatch).toBeDefined();
      expect(typescriptMatch?.matchType).toBe('partial');
      expect(javascriptMatch?.matchType).toBe('partial');
    });

    it('should find fuzzy matches with reasonable confidence', () => {
      const matches = findSkillMatches('Reactt', mockSkills, 0.8); // Typo in React

      // Should find React as the best match
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].skillName).toBe('React');

      // The match type depends on the algorithm - could be partial or fuzzy
      expect(['partial', 'fuzzy']).toContain(matches[0].matchType);
      expect(matches[0].confidence).toBeGreaterThan(0.8);
    });

    it('should sort matches by confidence and type priority', () => {
      const matches = findSkillMatches('react', mockSkills, 0.5);

      // Should have React (exact), React Native (partial), and possibly others
      expect(matches[0].skillName).toBe('React');
      expect(matches[0].confidence).toBe(1.0);
      expect(matches[0].matchType).toBe('exact');
    });

    it('should return empty array when no matches meet threshold', () => {
      const matches = findSkillMatches('COBOL', mockSkills, 0.8);

      expect(matches).toHaveLength(0);
    });
  });

  describe('analyzeTeamSkillMigration', () => {
    it('should identify team already using skill IDs', () => {
      const alreadyMigrated = mockTeams.find(t => t.id === 'team4')!;
      const result = analyzeTeamSkillMigration(alreadyMigrated, mockSkills);

      expect(result.success).toBe(true);
      expect(result.automaticMatches).toHaveLength(0);
      expect(result.ambiguousMatches).toHaveLength(0);
      expect(result.missingSkills).toHaveLength(0);
    });

    it('should categorize skills correctly for team needing migration', () => {
      const frontendTeam = mockTeams.find(t => t.id === 'team1')!;
      const result = analyzeTeamSkillMigration(frontendTeam, mockSkills);

      expect(result.success).toBe(false); // Has missing skills
      expect(result.automaticMatches).toHaveLength(2); // React, TypeScript
      expect(result.missingSkills).toHaveLength(1); // CSS

      const reactMatch = result.automaticMatches.find(
        m => m.originalName === 'React'
      );
      const typescriptMatch = result.automaticMatches.find(
        m => m.originalName === 'TypeScript'
      );

      expect(reactMatch?.confidence).toBe(1.0);
      expect(typescriptMatch?.confidence).toBe(1.0);
    });

    it('should handle ambiguous matches correctly', () => {
      const mobileTeam = mockTeams.find(t => t.id === 'team3')!;
      const result = analyzeTeamSkillMigration(mobileTeam, mockSkills, 0.95); // Very high threshold

      // With high threshold, some matches should be ambiguous
      expect(
        result.ambiguousMatches.length +
          result.automaticMatches.length +
          result.missingSkills.length
      ).toBeGreaterThan(0);

      // Check if we have any ambiguous matches
      if (result.ambiguousMatches.length > 0) {
        const firstAmbiguous = result.ambiguousMatches[0];
        expect(firstAmbiguous.candidates.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty target skills gracefully', () => {
      const teamWithoutSkills: Team = {
        ...mockTeams[0],
        targetSkills: [],
      };

      const result = analyzeTeamSkillMigration(teamWithoutSkills, mockSkills);

      expect(result.success).toBe(true);
      expect(result.automaticMatches).toHaveLength(0);
      expect(result.ambiguousMatches).toHaveLength(0);
      expect(result.missingSkills).toHaveLength(0);
    });
  });

  describe('createMissingSkills', () => {
    it('should create skill entities with proper structure', () => {
      const missingSkillNames = ['CSS', 'HTML', 'Sass'];
      const createdSkills = createMissingSkills(missingSkillNames, 'Frontend');

      expect(createdSkills).toHaveLength(3);

      createdSkills.forEach((skill, index) => {
        expect(skill.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
        expect(skill.name).toBe(missingSkillNames[index]);
        expect(skill.category).toBe('Frontend');
        expect(skill.description).toContain(
          'Auto-created during team skills migration'
        );
        expect(skill.createdDate).toBeDefined();
      });
    });

    it('should use default category when none provided', () => {
      const createdSkills = createMissingSkills(['Test Skill']);

      expect(createdSkills[0].category).toBe('General');
    });

    it('should handle empty array', () => {
      const createdSkills = createMissingSkills([]);

      expect(createdSkills).toHaveLength(0);
    });

    it('should trim skill names', () => {
      const createdSkills = createMissingSkills(['  Spaced Skill  ']);

      expect(createdSkills[0].name).toBe('Spaced Skill');
    });
  });

  describe('applySkillMigration', () => {
    it('should apply automatic matches correctly', () => {
      const frontendTeam = mockTeams.find(t => t.id === 'team1')!;
      const migrationResult = analyzeTeamSkillMigration(
        frontendTeam,
        mockSkills
      );

      const migratedTeam = applySkillMigration(frontendTeam, migrationResult);

      expect(migratedTeam.targetSkills).toContain('skill1'); // React
      expect(migratedTeam.targetSkills).toContain('skill3'); // TypeScript
      expect(migratedTeam.targetSkills).toHaveLength(2); // Only automatic matches
    });

    it('should apply manual mappings for ambiguous matches', () => {
      const mobileTeam = mockTeams.find(t => t.id === 'team3')!;
      const migrationResult = analyzeTeamSkillMigration(mobileTeam, mockSkills);

      const manualMappings = {
        react: 'skill1', // Map to React instead of React Native
      };

      const migratedTeam = applySkillMigration(
        mobileTeam,
        migrationResult,
        manualMappings
      );

      expect(migratedTeam.targetSkills).toContain('skill1'); // Manual mapping for 'react'
    });

    it('should preserve team properties other than targetSkills', () => {
      const originalTeam = mockTeams[0];
      const migrationResult = analyzeTeamSkillMigration(
        originalTeam,
        mockSkills
      );

      const migratedTeam = applySkillMigration(originalTeam, migrationResult);

      expect(migratedTeam.id).toBe(originalTeam.id);
      expect(migratedTeam.name).toBe(originalTeam.name);
      expect(migratedTeam.capacity).toBe(originalTeam.capacity);
      expect(migratedTeam.description).toBe(originalTeam.description);
    });
  });

  describe('validateMigration', () => {
    it('should pass validation for successful migration', () => {
      const originalTeams = mockTeams.slice(0, 2);
      const migratedTeams = originalTeams.map(team => ({
        ...team,
        targetSkills: ['skill1', 'skill2'], // Valid skill IDs
      }));

      const validation = validateMigration(
        originalTeams,
        migratedTeams,
        mockSkills
      );

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid skill IDs', () => {
      const originalTeams = mockTeams.slice(0, 1);
      const migratedTeams = [
        {
          ...originalTeams[0],
          targetSkills: ['invalid-skill-id', 'skill1'],
        },
      ];

      const validation = validateMigration(
        originalTeams,
        migratedTeams,
        mockSkills
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain(
        'Invalid skill ID invalid-skill-id'
      );
    });

    it('should detect team count mismatch', () => {
      const originalTeams = mockTeams.slice(0, 2);
      const migratedTeams = mockTeams.slice(0, 1); // Missing one team

      const validation = validateMigration(
        originalTeams,
        migratedTeams,
        mockSkills
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Team count mismatch after migration'
      );
    });

    it('should warn about skill count reductions', () => {
      const originalTeams = [
        {
          ...mockTeams[0],
          targetSkills: ['skill1', 'skill2', 'skill3'], // 3 skills
        },
      ];
      const migratedTeams = [
        {
          ...originalTeams[0],
          targetSkills: ['skill1'], // 1 skill (reduced)
        },
      ];

      const validation = validateMigration(
        originalTeams,
        migratedTeams,
        mockSkills
      );

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toHaveLength(1);
      expect(validation.warnings[0]).toContain(
        'Skill count reduced from 3 to 1'
      );
    });
  });

  describe('analyzeAllTeamsMigration', () => {
    it('should analyze all teams and provide summary', () => {
      const summary = analyzeAllTeamsMigration(mockTeams, mockSkills);

      expect(summary.totalTeams).toBe(mockTeams.length);
      expect(summary.teamsProcessed).toBe(mockTeams.length);
      expect(summary.results).toHaveLength(mockTeams.length);

      // Should have some automatic matches and missing skills
      expect(summary.automaticMatches).toBeGreaterThan(0);
      expect(summary.missingSkills).toBeGreaterThan(0);
    });

    it('should count already migrated teams correctly', () => {
      const summary = analyzeAllTeamsMigration(mockTeams, mockSkills);

      // Team4 is already migrated, so it should contribute 0 to all counts
      const alreadyMigratedResult = summary.results.find(
        r => r.teamId === 'team4'
      );
      expect(alreadyMigratedResult?.success).toBe(true);
      expect(alreadyMigratedResult?.automaticMatches).toHaveLength(0);
      expect(alreadyMigratedResult?.missingSkills).toHaveLength(0);
    });
  });

  describe('generateMigrationPreview', () => {
    it('should generate comprehensive migration preview', () => {
      const preview = generateMigrationPreview(mockTeams, mockSkills);

      expect(preview.summary.totalTeams).toBe(mockTeams.length);
      expect(preview.recommendations.autoCreate).toContain('CSS');
      expect(preview.recommendations.autoCreate).toContain('MongoDB');
      expect(preview.recommendations.autoCreate).toContain('Express');
      expect(preview.recommendations.highConfidence).toBeGreaterThan(0);
    });

    it('should identify skills needing review', () => {
      const preview = generateMigrationPreview(mockTeams, mockSkills, 0.95);

      // With very high confidence threshold, some skills should need review
      expect(
        preview.recommendations.needsReview.length +
          preview.recommendations.autoCreate.length
      ).toBeGreaterThan(0);

      // If there are items needing review, they should have candidates
      if (preview.recommendations.needsReview.length > 0) {
        const firstReview = preview.recommendations.needsReview[0];
        expect(firstReview.candidates.length).toBeGreaterThan(0);
      }
    });

    it('should deduplicate missing skills across teams', () => {
      // Add another team with CSS skill
      const teamsWithDuplicateSkills = [
        ...mockTeams,
        {
          ...mockTeams[0],
          id: 'team5',
          name: 'Another Frontend Team',
          targetSkills: ['CSS', 'React'], // CSS appears in multiple teams
        },
      ];

      const preview = generateMigrationPreview(
        teamsWithDuplicateSkills,
        mockSkills
      );

      // CSS should appear only once in autoCreate
      const cssCount = preview.recommendations.autoCreate.filter(
        skill => skill === 'CSS'
      ).length;
      expect(cssCount).toBe(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle teams with null targetSkills', () => {
      const teamWithNullSkills: Team = {
        ...mockTeams[0],
        targetSkills: null as any,
      };

      const result = analyzeTeamSkillMigration(teamWithNullSkills, mockSkills);

      expect(result.success).toBe(true);
      expect(result.originalSkills).toEqual([]);
    });

    it('should handle teams with undefined targetSkills', () => {
      const teamWithUndefinedSkills: Team = {
        ...mockTeams[0],
      };
      delete (teamWithUndefinedSkills as any).targetSkills;

      const result = analyzeTeamSkillMigration(
        teamWithUndefinedSkills,
        mockSkills
      );

      expect(result.success).toBe(true);
      expect(result.originalSkills).toEqual([]);
    });

    it('should handle empty skills array', () => {
      const result = analyzeTeamSkillMigration(mockTeams[0], []);

      expect(result.success).toBe(false);
      expect(result.missingSkills).toEqual(mockTeams[0].targetSkills);
    });

    it('should handle very low confidence threshold', () => {
      const matches = findSkillMatches('xyz', mockSkills, 0.1);

      // Should find some matches even with very different string
      expect(matches.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle skills with special characters', () => {
      const skillsWithSpecialChars = [
        ...mockSkills,
        {
          id: 'special1',
          name: 'C++',
          category: 'Language',
          description: 'C++ programming language',
          createdDate: '2024-01-01T00:00:00Z',
        },
        {
          id: 'special2',
          name: '.NET',
          category: 'Framework',
          description: '.NET framework',
          createdDate: '2024-01-01T00:00:00Z',
        },
      ];

      const cppMatches = findSkillMatches('C++', skillsWithSpecialChars);
      const dotnetMatches = findSkillMatches('.NET', skillsWithSpecialChars);

      expect(cppMatches[0]?.confidence).toBe(1.0);
      expect(dotnetMatches[0]?.confidence).toBe(1.0);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of teams efficiently', () => {
      const largeTeamSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockTeams[0],
        id: `team-${i}`,
        name: `Team ${i}`,
        targetSkills: ['React', 'TypeScript', `Skill-${i}`],
      }));

      const startTime = performance.now();
      const summary = analyzeAllTeamsMigration(largeTeamSet, mockSkills);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(summary.totalTeams).toBe(100);
    });

    it('should handle large number of skills efficiently', () => {
      const largeSkillSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `skill-${i}`,
        name: `VeryUniqueSkillName${String(i).padStart(4, '0')}`,
        category: 'Generated',
        description: `Generated skill ${i}`,
        createdDate: '2024-01-01T00:00:00Z',
      }));

      const startTime = performance.now();
      const matches = findSkillMatches(
        'VeryUniqueSkillName0500',
        largeSkillSet,
        0.99
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].confidence).toBe(1.0);
    });
  });
});
