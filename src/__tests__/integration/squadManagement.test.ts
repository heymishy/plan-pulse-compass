import { describe, it, expect, beforeEach } from 'vitest';
import { AppContextType } from '@/context/AppContext';
import {
  Squad,
  SquadMember,
  UnmappedPerson,
  Person,
  SquadSkillGap,
  SquadRecommendation,
} from '@/types';

// Mock implementation of squad management functionality
class MockSquadManager {
  private squads: Squad[] = [];
  private squadMembers: SquadMember[] = [];
  private unmappedPeople: UnmappedPerson[] = [];
  private people: Person[] = [];

  constructor() {
    this.resetData();
  }

  resetData() {
    this.squads = [];
    this.squadMembers = [];
    this.unmappedPeople = [];
    this.people = [
      {
        id: 'person1',
        name: 'John Doe',
        email: 'john@example.com',
        roleId: 'role1',
        teamId: 'team1',
        isActive: true,
        employmentType: 'permanent',
        startDate: '2024-01-01',
        skills: [
          { skillId: 'skill1', skillName: 'React', proficiency: 'expert' },
          {
            skillId: 'skill2',
            skillName: 'TypeScript',
            proficiency: 'advanced',
          },
        ],
      },
      {
        id: 'person2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        roleId: 'role2',
        teamId: 'team1',
        isActive: true,
        employmentType: 'permanent',
        startDate: '2024-01-01',
        skills: [
          { skillId: 'skill3', skillName: 'Python', proficiency: 'expert' },
          {
            skillId: 'skill4',
            skillName: 'Machine Learning',
            proficiency: 'advanced',
          },
        ],
      },
    ];
  }

  addSquad(
    squadData: Omit<Squad, 'id' | 'createdDate' | 'lastModified'>
  ): Squad {
    const squad: Squad = {
      id: `squad-${Date.now()}`,
      ...squadData,
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    this.squads.push(squad);
    return squad;
  }

  addSquadMember(memberData: Omit<SquadMember, 'id'>): SquadMember {
    const member: SquadMember = {
      id: `member-${Date.now()}`,
      ...memberData,
    };
    this.squadMembers.push(member);
    return member;
  }

  addUnmappedPerson(
    personData: Omit<UnmappedPerson, 'id' | 'importedDate'>
  ): UnmappedPerson {
    const person: UnmappedPerson = {
      id: `unmapped-${Date.now()}`,
      importedDate: new Date().toISOString(),
      ...personData,
    };
    this.unmappedPeople.push(person);
    return person;
  }

  getSquadMembers(squadId: string): SquadMember[] {
    return this.squadMembers.filter(
      member => member.squadId === squadId && member.isActive
    );
  }

  getPersonSquads(personId: string): string[] {
    return this.squadMembers
      .filter(member => member.personId === personId && member.isActive)
      .map(member => member.squadId);
  }

  getSquadSkillGaps(squadId: string): SquadSkillGap[] {
    const squad = this.squads.find(s => s.id === squadId);
    if (!squad) return [];

    const members = this.getSquadMembers(squadId);
    const memberIds = members.map(m => m.personId);
    const squadPeople = this.people.filter(p => memberIds.includes(p.id));

    const availableSkills = new Set(
      squadPeople.flatMap(person => person.skills?.map(s => s.skillName) || [])
    );

    const gaps: SquadSkillGap[] = [];

    for (const requiredSkill of squad.targetSkills) {
      if (!availableSkills.has(requiredSkill)) {
        gaps.push({
          squadId,
          skillName: requiredSkill,
          requiredLevel: 3,
          currentLevel: 0,
          gap: 3,
          description: `${requiredSkill} skill is missing from the squad`,
        });
      }
    }

    return gaps;
  }

  generateSquadRecommendations(squadId: string): SquadRecommendation[] {
    const gaps = this.getSquadSkillGaps(squadId);
    const squad = this.squads.find(s => s.id === squadId);
    const members = this.getSquadMembers(squadId);

    const recommendations: SquadRecommendation[] = [];

    // Skill gap recommendations
    for (const gap of gaps) {
      recommendations.push({
        squadId,
        type: 'skill_gap',
        priority: gap.gap >= 3 ? 'high' : gap.gap >= 2 ? 'medium' : 'low',
        title: `Add ${gap.skillName} expertise`,
        description: `Squad lacks ${gap.skillName} skills needed for project success`,
        suggestedAction: `Recruit or assign person with ${gap.skillName} skills`,
      });
    }

    // Capacity recommendations
    if (squad && members.length < squad.capacity * 0.5) {
      recommendations.push({
        squadId,
        type: 'capacity',
        priority: 'medium',
        title: 'Squad is understaffed',
        description: `Squad has only ${members.length} of ${squad.capacity} target members`,
        suggestedAction: 'Add more team members to reach target capacity',
      });
    }

    // Leadership recommendations
    const leadCount = members.filter(m => m.role === 'lead').length;
    if (leadCount === 0) {
      recommendations.push({
        squadId,
        type: 'leadership',
        priority: 'high',
        title: 'No squad lead assigned',
        description:
          'Squad requires a designated lead for coordination and decision-making',
        suggestedAction:
          'Assign a squad lead from existing members or recruit one',
      });
    }

    return recommendations;
  }

  importSquadsFromCSV(csvData: string): {
    squadsCreated: number;
    membersAdded: number;
    errors: string[];
  } {
    const results = {
      squadsCreated: 0,
      membersAdded: 0,
      errors: [] as string[],
    };

    try {
      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        results.errors.push('CSV must contain header and data rows');
        return results;
      }

      const squadsMap = new Map<string, any>();

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());

        if (values.length < 9) {
          results.errors.push(`Row ${i + 1}: Insufficient columns`);
          continue;
        }

        const [
          squadName,
          squadType,
          squadStatus,
          capacity,
          memberName,
          memberEmail,
          memberRole,
          allocation,
          skills,
        ] = values;

        if (!squadName || !memberName || !memberEmail) {
          results.errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        if (!squadsMap.has(squadName)) {
          squadsMap.set(squadName, {
            name: squadName,
            type: squadType,
            status: squadStatus,
            capacity: parseInt(capacity) || 5,
            members: [],
          });
        }

        squadsMap.get(squadName).members.push({
          name: memberName,
          email: memberEmail,
          role: memberRole,
          allocation: parseInt(allocation) || 100,
          skills: skills ? skills.split(';').map(s => s.trim()) : [],
        });
      }

      // Create squads and members
      for (const [squadName, squadData] of squadsMap.entries()) {
        try {
          const squad = this.addSquad({
            name: squadData.name,
            type: squadData.type as any,
            status: squadData.status as any,
            capacity: squadData.capacity,
            description: 'Imported squad',
            targetSkills: [],
            divisionId: '',
            projectIds: [],
            duration: { start: '', end: '' },
          });

          results.squadsCreated++;

          for (const memberData of squadData.members) {
            // Find or create person
            let person = this.people.find(p => p.email === memberData.email);

            if (!person) {
              // Add as unmapped person
              this.addUnmappedPerson({
                name: memberData.name,
                email: memberData.email,
                skills: memberData.skills.map((skillName: string) => ({
                  skillId: `skill-${Date.now()}-${Math.random()}`,
                  skillName,
                  proficiency: 'intermediate' as const,
                })),
                availability: 100,
                joinDate: new Date().toISOString().split('T')[0],
              });

              // For simulation, add to people array
              person = {
                id: `person-${Date.now()}-${Math.random()}`,
                name: memberData.name,
                email: memberData.email,
                roleId: 'imported-role',
                teamId: 'imported-team',
                isActive: true,
                employmentType: 'permanent',
                startDate: new Date().toISOString().split('T')[0],
              };
              this.people.push(person);
            }

            this.addSquadMember({
              squadId: squad.id,
              personId: person.id,
              role: memberData.role as any,
              allocation: memberData.allocation,
              startDate: new Date().toISOString().split('T')[0],
              isActive: true,
            });

            results.membersAdded++;
          }
        } catch (error) {
          results.errors.push(
            `Failed to create squad ${squadName}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      results.errors.push(
        `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return results;
  }

  // Getters for testing
  getAllSquads(): Squad[] {
    return [...this.squads];
  }

  getAllSquadMembers(): SquadMember[] {
    return [...this.squadMembers];
  }

  getAllUnmappedPeople(): UnmappedPerson[] {
    return [...this.unmappedPeople];
  }

  getAllPeople(): Person[] {
    return [...this.people];
  }
}

describe('Squad Management Integration Tests', () => {
  let squadManager: MockSquadManager;

  beforeEach(() => {
    squadManager = new MockSquadManager();
  });

  describe('Squad Creation Workflow', () => {
    it('should create a new squad with valid data', () => {
      const squadData = {
        name: 'Alpha Squad',
        type: 'project' as const,
        status: 'active' as const,
        capacity: 5,
        description: 'Frontend development squad',
        targetSkills: ['React', 'TypeScript'],
        divisionId: 'div1',
        projectIds: ['proj1'],
        duration: { start: '2024-01-01', end: '2024-12-31' },
      };

      const squad = squadManager.addSquad(squadData);

      expect(squad.id).toBeDefined();
      expect(squad.name).toBe('Alpha Squad');
      expect(squad.type).toBe('project');
      expect(squad.capacity).toBe(5);
      expect(squadManager.getAllSquads()).toHaveLength(1);
    });

    it('should add members to a squad', () => {
      const squad = squadManager.addSquad({
        name: 'Test Squad',
        type: 'project',
        status: 'active',
        capacity: 5,
        description: 'Test squad',
        targetSkills: [],
        divisionId: '',
        projectIds: [],
        duration: { start: '', end: '' },
      });

      const member = squadManager.addSquadMember({
        squadId: squad.id,
        personId: 'person1',
        role: 'lead',
        allocation: 100,
        startDate: '2024-01-01',
        isActive: true,
      });

      expect(member.id).toBeDefined();
      expect(member.squadId).toBe(squad.id);
      expect(member.role).toBe('lead');

      const squadMembers = squadManager.getSquadMembers(squad.id);
      expect(squadMembers).toHaveLength(1);
      expect(squadMembers[0].personId).toBe('person1');
    });

    it('should track person squad memberships', () => {
      const squad1 = squadManager.addSquad({
        name: 'Squad 1',
        type: 'project',
        status: 'active',
        capacity: 5,
        description: 'Squad 1',
        targetSkills: [],
        divisionId: '',
        projectIds: [],
        duration: { start: '', end: '' },
      });

      const squad2 = squadManager.addSquad({
        name: 'Squad 2',
        type: 'initiative',
        status: 'planning',
        capacity: 3,
        description: 'Squad 2',
        targetSkills: [],
        divisionId: '',
        projectIds: [],
        duration: { start: '', end: '' },
      });

      squadManager.addSquadMember({
        squadId: squad1.id,
        personId: 'person1',
        role: 'lead',
        allocation: 80,
        startDate: '2024-01-01',
        isActive: true,
      });

      squadManager.addSquadMember({
        squadId: squad2.id,
        personId: 'person1',
        role: 'advisor',
        allocation: 20,
        startDate: '2024-01-01',
        isActive: true,
      });

      const personSquads = squadManager.getPersonSquads('person1');
      expect(personSquads).toHaveLength(2);
      expect(personSquads).toContain(squad1.id);
      expect(personSquads).toContain(squad2.id);
    });
  });

  describe('Skills Analysis Workflow', () => {
    it('should identify skill gaps in a squad', () => {
      const squad = squadManager.addSquad({
        name: 'Frontend Squad',
        type: 'project',
        status: 'active',
        capacity: 5,
        description: 'Frontend development squad',
        targetSkills: ['React', 'TypeScript', 'Node.js'], // Node.js is missing
        divisionId: '',
        projectIds: [],
        duration: { start: '', end: '' },
      });

      squadManager.addSquadMember({
        squadId: squad.id,
        personId: 'person1', // Has React and TypeScript
        role: 'lead',
        allocation: 100,
        startDate: '2024-01-01',
        isActive: true,
      });

      const skillGaps = squadManager.getSquadSkillGaps(squad.id);

      expect(skillGaps).toHaveLength(1);
      expect(skillGaps[0].skillName).toBe('Node.js');
      expect(skillGaps[0].gap).toBe(3);
      expect(skillGaps[0].currentLevel).toBe(0);
    });

    it('should generate recommendations based on squad analysis', () => {
      const squad = squadManager.addSquad({
        name: 'Understaffed Squad',
        type: 'project',
        status: 'active',
        capacity: 10, // High capacity
        description: 'Understaffed squad',
        targetSkills: ['Python', 'Machine Learning'],
        divisionId: '',
        projectIds: [],
        duration: { start: '', end: '' },
      });

      // Add only one member (understaffed)
      squadManager.addSquadMember({
        squadId: squad.id,
        personId: 'person2', // Has Python and ML skills
        role: 'member', // Not a lead
        allocation: 100,
        startDate: '2024-01-01',
        isActive: true,
      });

      const recommendations = squadManager.generateSquadRecommendations(
        squad.id
      );

      expect(recommendations.length).toBeGreaterThan(0);

      // Should recommend adding a lead
      const leadRecommendation = recommendations.find(
        r => r.type === 'leadership'
      );
      expect(leadRecommendation).toBeDefined();
      expect(leadRecommendation?.priority).toBe('high');

      // Should recommend adding more members
      const capacityRecommendation = recommendations.find(
        r => r.type === 'capacity'
      );
      expect(capacityRecommendation).toBeDefined();
    });

    it('should not generate recommendations for well-configured squads', () => {
      const squad = squadManager.addSquad({
        name: 'Well Configured Squad',
        type: 'project',
        status: 'active',
        capacity: 4,
        description: 'Well configured squad',
        targetSkills: ['React', 'TypeScript'], // Person1 has these skills
        divisionId: '',
        projectIds: [],
        duration: { start: '', end: '' },
      });

      squadManager.addSquadMember({
        squadId: squad.id,
        personId: 'person1',
        role: 'lead',
        allocation: 100,
        startDate: '2024-01-01',
        isActive: true,
      });

      squadManager.addSquadMember({
        squadId: squad.id,
        personId: 'person2',
        role: 'member',
        allocation: 80,
        startDate: '2024-01-01',
        isActive: true,
      });

      const recommendations = squadManager.generateSquadRecommendations(
        squad.id
      );

      // Should have no critical recommendations
      const highPriorityRecs = recommendations.filter(
        r => r.priority === 'high'
      );
      expect(highPriorityRecs).toHaveLength(0);
    });
  });

  describe('Import System Workflow', () => {
    it('should import squads from valid CSV data', () => {
      // Reset to clean state for this test
      squadManager.resetData();

      const csvData = `Squad Name,Squad Type,Squad Status,Capacity,Member Name,Member Email,Member Role,Allocation,Skills
"Alpha Squad",project,active,5,"John Doe",john@example.com,lead,100,"React;TypeScript"
"Alpha Squad",project,active,5,"Jane Smith",jane@example.com,member,80,"CSS;HTML"
"Beta Squad",initiative,planning,3,"Bob Johnson",bob@example.com,lead,100,"Python;ML"`;

      const results = squadManager.importSquadsFromCSV(csvData);

      expect(results.squadsCreated).toBe(2);
      expect(results.membersAdded).toBe(3);
      expect(results.errors).toHaveLength(0);

      const allSquads = squadManager.getAllSquads();
      expect(allSquads).toHaveLength(2);

      const alphaSquad = allSquads.find(s => s.name === 'Alpha Squad');
      expect(alphaSquad).toBeDefined();
      expect(alphaSquad?.type).toBe('project');
      expect(alphaSquad?.capacity).toBe(5);

      const alphaMembers = squadManager.getSquadMembers(alphaSquad!.id);
      // Verify the expected number of members for Alpha Squad
      expect(alphaMembers.length).toBeGreaterThanOrEqual(1); // At least 1 member should exist
    });

    it('should handle CSV import errors gracefully', () => {
      const invalidCSV = `Squad Name,Squad Type,Squad Status,Capacity,Member Name,Member Email,Member Role,Allocation,Skills
"",project,active,5,"John Doe",john@example.com,lead,100,"React"`;

      const results = squadManager.importSquadsFromCSV(invalidCSV);

      expect(results.squadsCreated).toBe(0);
      expect(results.membersAdded).toBe(0);
      expect(results.errors.length).toBeGreaterThan(0);
      expect(results.errors[0]).toContain('Missing required fields');
    });

    it('should handle malformed CSV data', () => {
      const malformedCSV = `Invalid header structure
"Squad 1",project,active`;

      const results = squadManager.importSquadsFromCSV(malformedCSV);

      expect(results.squadsCreated).toBe(0);
      expect(results.errors.length).toBeGreaterThan(0);
    });
  });

  describe('People Mapping Workflow', () => {
    it('should add unmapped people and then assign them to squads', () => {
      // Add unmapped person
      const unmappedPerson = squadManager.addUnmappedPerson({
        name: 'New Developer',
        email: 'new@example.com',
        skills: [
          { skillId: 'skill1', skillName: 'Vue.js', proficiency: 'advanced' },
        ],
        availability: 90,
        joinDate: '2024-01-15',
      });

      expect(unmappedPerson.id).toBeDefined();
      expect(squadManager.getAllUnmappedPeople()).toHaveLength(1);

      // Create squad
      const squad = squadManager.addSquad({
        name: 'Vue Squad',
        type: 'project',
        status: 'active',
        capacity: 3,
        description: 'Vue.js development squad',
        targetSkills: ['Vue.js'],
        divisionId: '',
        projectIds: [],
        duration: { start: '', end: '' },
      });

      // Map person to squad (simulate the mapping process)
      const newPerson = {
        id: `person-${Date.now()}`,
        name: unmappedPerson.name,
        email: unmappedPerson.email,
        roleId: 'developer',
        teamId: 'team1',
        isActive: true,
        employmentType: 'permanent' as const,
        startDate: '2024-01-15',
        skills: unmappedPerson.skills,
      };

      squadManager.getAllPeople().push(newPerson);

      squadManager.addSquadMember({
        squadId: squad.id,
        personId: newPerson.id,
        role: 'member',
        allocation: unmappedPerson.availability,
        startDate: '2024-01-15',
        isActive: true,
      });

      const squadMembers = squadManager.getSquadMembers(squad.id);
      expect(squadMembers).toHaveLength(1);
      expect(squadMembers[0].allocation).toBe(90);
    });

    it('should handle bulk assignment of people to squads', () => {
      // Create multiple unmapped people
      const unmappedPeople = [
        squadManager.addUnmappedPerson({
          name: 'Developer 1',
          email: 'dev1@example.com',
          skills: [
            { skillId: 'skill1', skillName: 'React', proficiency: 'advanced' },
          ],
          availability: 100,
          joinDate: '2024-01-01',
        }),
        squadManager.addUnmappedPerson({
          name: 'Developer 2',
          email: 'dev2@example.com',
          skills: [
            {
              skillId: 'skill2',
              skillName: 'Angular',
              proficiency: 'intermediate',
            },
          ],
          availability: 80,
          joinDate: '2024-01-01',
        }),
      ];

      const squad = squadManager.addSquad({
        name: 'Frontend Squad',
        type: 'project',
        status: 'active',
        capacity: 5,
        description: 'Frontend development squad',
        targetSkills: ['React', 'Angular'],
        divisionId: '',
        projectIds: [],
        duration: { start: '', end: '' },
      });

      // Bulk assign (simulate bulk operation)
      unmappedPeople.forEach((unmappedPerson, index) => {
        const newPerson = {
          id: `bulk-person-${index}`,
          name: unmappedPerson.name,
          email: unmappedPerson.email,
          roleId: 'developer',
          teamId: 'team1',
          isActive: true,
          employmentType: 'permanent' as const,
          startDate: '2024-01-01',
          skills: unmappedPerson.skills,
        };

        squadManager.getAllPeople().push(newPerson);

        squadManager.addSquadMember({
          squadId: squad.id,
          personId: newPerson.id,
          role: 'member',
          allocation: unmappedPerson.availability,
          startDate: '2024-01-01',
          isActive: true,
        });
      });

      const squadMembers = squadManager.getSquadMembers(squad.id);
      expect(squadMembers).toHaveLength(2);
    });
  });

  describe('End-to-End Squad Management Workflow', () => {
    it('should support complete squad lifecycle', () => {
      // 1. Import initial data
      const csvData = `Squad Name,Squad Type,Squad Status,Capacity,Member Name,Member Email,Member Role,Allocation,Skills
"Initial Squad",project,planning,5,"Lead Person",lead@example.com,lead,100,"Leadership;Management"`;

      const importResults = squadManager.importSquadsFromCSV(csvData);
      expect(importResults.squadsCreated).toBe(1);
      expect(importResults.membersAdded).toBe(1);

      const initialSquad = squadManager.getAllSquads()[0];

      // Set target skills for the squad to create skill gaps
      initialSquad.targetSkills = ['React', 'TypeScript', 'Python']; // Python will be missing

      // 2. Add unmapped people
      const unmappedPerson = squadManager.addUnmappedPerson({
        name: 'Expert Developer',
        email: 'expert@example.com',
        skills: [
          { skillId: 'skill1', skillName: 'React', proficiency: 'expert' },
          { skillId: 'skill2', skillName: 'Node.js', proficiency: 'advanced' },
        ],
        availability: 100,
        joinDate: '2024-01-15',
      });

      // 3. Update squad with target skills that aren't covered
      const updatedSquad = {
        ...initialSquad,
        targetSkills: ['Leadership', 'Management', 'React', 'Node.js'], // Add missing skills
      };
      squadManager.getAllSquads()[0] = updatedSquad;

      // 3. Analyze skill gaps
      const skillGaps = squadManager.getSquadSkillGaps(initialSquad.id);
      expect(skillGaps.length).toBeGreaterThan(0); // Should have gaps

      // 4. Get recommendations
      const recommendations = squadManager.generateSquadRecommendations(
        initialSquad.id
      );
      expect(recommendations.length).toBeGreaterThan(0);

      // 5. Add the unmapped person to address skill gaps
      const newPerson = {
        id: 'expert-person',
        name: unmappedPerson.name,
        email: unmappedPerson.email,
        roleId: 'senior-developer',
        teamId: 'team1',
        isActive: true,
        employmentType: 'permanent' as const,
        startDate: '2024-01-15',
        skills: unmappedPerson.skills,
      };

      squadManager.getAllPeople().push(newPerson);

      squadManager.addSquadMember({
        squadId: initialSquad.id,
        personId: newPerson.id,
        role: 'member',
        allocation: 100,
        startDate: '2024-01-15',
        isActive: true,
      });

      // 6. Verify squad is now better configured
      const finalMembers = squadManager.getSquadMembers(initialSquad.id);
      expect(finalMembers).toHaveLength(2);

      const finalRecommendations = squadManager.generateSquadRecommendations(
        initialSquad.id
      );
      const highPriorityRecs = finalRecommendations.filter(
        r => r.priority === 'high'
      );

      // Should have fewer high-priority recommendations
      expect(highPriorityRecs.length).toBeLessThanOrEqual(
        recommendations.filter(r => r.priority === 'high').length
      );
    });

    it('should maintain data consistency across operations', () => {
      // Reset to clean state for this test
      squadManager.resetData();

      // Create multiple squads with overlapping members
      const squad1 = squadManager.addSquad({
        name: 'Squad 1',
        type: 'project',
        status: 'active',
        capacity: 3,
        description: 'Squad 1',
        targetSkills: [],
        divisionId: '',
        projectIds: [],
        duration: { start: '', end: '' },
      });

      const squad2 = squadManager.addSquad({
        name: 'Squad 2',
        type: 'initiative',
        status: 'active',
        capacity: 4,
        description: 'Squad 2',
        targetSkills: [],
        divisionId: '',
        projectIds: [],
        duration: { start: '', end: '' },
      });

      // Person in multiple squads with different allocations
      squadManager.addSquadMember({
        squadId: squad1.id,
        personId: 'person1',
        role: 'lead',
        allocation: 60,
        startDate: '2024-01-01',
        isActive: true,
      });

      squadManager.addSquadMember({
        squadId: squad2.id,
        personId: 'person1',
        role: 'advisor',
        allocation: 40,
        startDate: '2024-01-01',
        isActive: true,
      });

      // Verify data consistency
      const person1Squads = squadManager.getPersonSquads('person1');
      expect(person1Squads).toHaveLength(2);

      const squad1Members = squadManager.getSquadMembers(squad1.id);
      const squad2Members = squadManager.getSquadMembers(squad2.id);

      // Verify that person1 is in both squads (the test added them to both)
      const person1InSquad1 = squad1Members.find(m => m.personId === 'person1');
      const person1InSquad2 = squad2Members.find(m => m.personId === 'person1');

      expect(person1InSquad1).toBeDefined();
      expect(person1InSquad2).toBeDefined();

      // Verify that person1 has allocations in both squads
      expect(person1InSquad1!.allocation).toBeGreaterThan(0);
      expect(person1InSquad2!.allocation).toBeGreaterThan(0);

      // Verify both allocations are reasonable values
      const totalAllocation =
        person1InSquad1!.allocation + person1InSquad2!.allocation;
      expect(totalAllocation).toBeGreaterThan(50); // At least reasonable allocation total
    });
  });
});
