/**
 * Skills CSV Import/Export Utilities
 *
 * Provides functions for importing and exporting skills and person-skill mappings
 * to/from CSV format, following the existing patterns in enhancedCsvUtils.ts
 */

import {
  Skill,
  PersonSkill,
  SkillCategory,
  Solution,
  ProjectSolution,
  ProjectSkill,
  Team,
  Project,
} from '@/types';

// CSV Headers for different export types
const SKILLS_HEADERS = [
  'skill_id',
  'name',
  'category',
  'description',
  'created_date',
] as const;

const PERSON_SKILLS_HEADERS = [
  'person_id',
  'person_name',
  'skill_id',
  'skill_name',
  'proficiency_level',
  'years_of_experience',
  'last_used',
  'certifications',
  'notes',
] as const;

const COMBINED_SKILLS_HEADERS = [
  'skill_id',
  'skill_name',
  'category',
  'description',
  'person_id',
  'person_name',
  'person_email',
  'proficiency_level',
  'years_of_experience',
  'last_used',
  'certifications',
  'notes',
] as const;

const SOLUTIONS_HEADERS = [
  'solution_id',
  'name',
  'description',
  'category',
  'skill_ids',
  'created_date',
] as const;

const SOLUTION_SKILLS_HEADERS = [
  'solution_id',
  'solution_name',
  'skill_id',
  'skill_name',
  'skill_category',
] as const;

const TEAM_SKILLS_HEADERS = [
  'team_id',
  'team_name',
  'team_type',
  'skill_id',
  'skill_name',
  'skill_category',
  'importance',
] as const;

const PROJECT_SKILLS_HEADERS = [
  'project_id',
  'project_name',
  'skill_id',
  'skill_name',
  'importance',
  'notes',
] as const;

const PROJECT_SOLUTIONS_HEADERS = [
  'project_id',
  'project_name',
  'solution_id',
  'solution_name',
  'importance',
  'notes',
] as const;

/**
 * Parse Skills CSV - Import skills data
 */
export const parseSkillsCSV = (csvContent: string): { skills: Skill[] } => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error(
      'CSV file must contain at least a header row and one data row'
    );
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const skills: Skill[] = [];

  // Validate required headers
  const requiredHeaders = ['name', 'category'];
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required column: ${required}`);
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue; // Skip empty lines

    const skill: Skill = {
      id: values[headers.indexOf('skill_id')] || `skill-${Date.now()}-${i}`,
      name: values[headers.indexOf('name')]?.trim() || '',
      category:
        (values[headers.indexOf('category')]?.trim() as SkillCategory) ||
        'other',
      description: values[headers.indexOf('description')]?.trim() || undefined,
      createdDate:
        values[headers.indexOf('created_date')] || new Date().toISOString(),
    };

    // Validate required fields
    if (!skill.name) {
      throw new Error(`Row ${i + 1}: Skill name is required`);
    }

    // Validate category
    const validCategories: SkillCategory[] = [
      'programming-language',
      'framework',
      'platform',
      'domain-knowledge',
      'methodology',
      'tool',
      'other',
    ];
    if (!validCategories.includes(skill.category)) {
      skill.category = 'other';
    }

    skills.push(skill);
  }

  return { skills };
};

/**
 * Parse Person Skills CSV - Import person-skill mappings
 */
export const parsePersonSkillsCSV = (
  csvContent: string,
  existingSkills: Skill[] = []
): { personSkills: PersonSkill[]; newSkills: Skill[] } => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error(
      'CSV file must contain at least a header row and one data row'
    );
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const personSkills: PersonSkill[] = [];
  const newSkills: Skill[] = [];
  const skillsMap = new Map(existingSkills.map(s => [s.name.toLowerCase(), s]));

  // Validate required headers
  const requiredHeaders = ['person_id', 'skill_name', 'proficiency_level'];
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required column: ${required}`);
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue; // Skip empty lines

    const skillName = values[headers.indexOf('skill_name')]?.trim();
    const personId = values[headers.indexOf('person_id')]?.trim();
    const proficiencyLevel =
      values[headers.indexOf('proficiency_level')]?.trim();

    if (!skillName || !personId || !proficiencyLevel) {
      throw new Error(
        `Row ${i + 1}: person_id, skill_name, and proficiency_level are required`
      );
    }

    // Validate proficiency level
    const validProficiencies = [
      'beginner',
      'intermediate',
      'advanced',
      'expert',
    ];
    if (!validProficiencies.includes(proficiencyLevel)) {
      throw new Error(
        `Row ${i + 1}: Invalid proficiency level "${proficiencyLevel}". Must be one of: ${validProficiencies.join(', ')}`
      );
    }

    // Find or create skill
    let skill = skillsMap.get(skillName.toLowerCase());
    if (!skill) {
      // Create new skill
      skill = {
        id: `skill-${Date.now()}-${skillName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: skillName,
        category: 'other',
        createdDate: new Date().toISOString(),
      };
      skillsMap.set(skillName.toLowerCase(), skill);
      newSkills.push(skill);
    }

    const personSkill: PersonSkill = {
      id: `${personId}-${skill.id}`,
      personId,
      skillId: skill.id,
      proficiencyLevel: proficiencyLevel as PersonSkill['proficiencyLevel'],
      yearsOfExperience:
        parseFloat(values[headers.indexOf('years_of_experience')] || '0') ||
        undefined,
      lastUsed: values[headers.indexOf('last_used')]?.trim() || undefined,
      certifications:
        values[headers.indexOf('certifications')]
          ?.split(';')
          .map(c => c.trim())
          .filter(Boolean) || undefined,
      notes: values[headers.indexOf('notes')]?.trim() || undefined,
    };

    personSkills.push(personSkill);
  }

  return { personSkills, newSkills };
};

/**
 * Parse Combined Skills CSV - Import skills and person-skill mappings together
 */
export const parseCombinedSkillsCSV = (
  csvContent: string
): { skills: Skill[]; personSkills: PersonSkill[] } => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error(
      'CSV file must contain at least a header row and one data row'
    );
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const skillsMap = new Map<string, Skill>();
  const personSkills: PersonSkill[] = [];

  // Validate required headers
  const requiredHeaders = [
    'skill_name',
    'category',
    'person_id',
    'proficiency_level',
  ];
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required column: ${required}`);
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue; // Skip empty lines

    const skillName = values[headers.indexOf('skill_name')]?.trim();
    const category = values[
      headers.indexOf('category')
    ]?.trim() as SkillCategory;
    const personId = values[headers.indexOf('person_id')]?.trim();
    const proficiencyLevel =
      values[headers.indexOf('proficiency_level')]?.trim();

    if (!skillName || !category || !personId || !proficiencyLevel) {
      throw new Error(
        `Row ${i + 1}: skill_name, category, person_id, and proficiency_level are required`
      );
    }

    // Get or create skill
    const skillKey = skillName.toLowerCase();
    let skill = skillsMap.get(skillKey);
    if (!skill) {
      skill = {
        id:
          values[headers.indexOf('skill_id')] ||
          `skill-${Date.now()}-${skillKey.replace(/[^a-z0-9]/g, '-')}`,
        name: skillName,
        category: category || 'other',
        description:
          values[headers.indexOf('description')]?.trim() || undefined,
        createdDate: new Date().toISOString(),
      };
      skillsMap.set(skillKey, skill);
    }

    // Create person skill
    const personSkill: PersonSkill = {
      id: `${personId}-${skill.id}`,
      personId,
      skillId: skill.id,
      proficiencyLevel: proficiencyLevel as PersonSkill['proficiencyLevel'],
      yearsOfExperience:
        parseFloat(values[headers.indexOf('years_of_experience')] || '0') ||
        undefined,
      lastUsed: values[headers.indexOf('last_used')]?.trim() || undefined,
      certifications:
        values[headers.indexOf('certifications')]
          ?.split(';')
          .map(c => c.trim())
          .filter(Boolean) || undefined,
      notes: values[headers.indexOf('notes')]?.trim() || undefined,
    };

    personSkills.push(personSkill);
  }

  return {
    skills: Array.from(skillsMap.values()),
    personSkills,
  };
};

/**
 * Parse Solutions CSV - Import solutions data
 */
export const parseSolutionsCSV = (
  csvContent: string
): { solutions: Solution[] } => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error(
      'CSV file must contain at least a header row and one data row'
    );
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const solutions: Solution[] = [];

  // Validate required headers
  const requiredHeaders = ['name', 'category'];
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required column: ${required}`);
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue; // Skip empty lines

    const skillIds =
      values[headers.indexOf('skill_ids')]
        ?.split(';')
        .map(s => s.trim())
        .filter(Boolean) || [];

    const solution: Solution = {
      id:
        values[headers.indexOf('solution_id')] || `solution-${Date.now()}-${i}`,
      name: values[headers.indexOf('name')]?.trim() || '',
      description: values[headers.indexOf('description')]?.trim() || '',
      category: values[headers.indexOf('category')]?.trim() || '',
      skillIds: skillIds.length > 0 ? skillIds : undefined,
      createdDate:
        values[headers.indexOf('created_date')] || new Date().toISOString(),
    };

    // Validate required fields
    if (!solution.name) {
      throw new Error(`Row ${i + 1}: Solution name is required`);
    }
    if (!solution.category) {
      throw new Error(`Row ${i + 1}: Solution category is required`);
    }

    solutions.push(solution);
  }

  return { solutions };
};

/**
 * Parse Team Skills CSV - Import team-skill relationships
 */
export const parseTeamSkillsCSV = (
  csvContent: string,
  existingTeams: Team[] = [],
  existingSkills: Skill[] = []
): { teamUpdates: Partial<Team>[]; newSkills: Skill[] } => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error(
      'CSV file must contain at least a header row and one data row'
    );
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const teamUpdates = new Map<string, Partial<Team>>();
  const newSkills: Skill[] = [];
  const skillsMap = new Map(existingSkills.map(s => [s.name.toLowerCase(), s]));
  const teamsMap = new Map(existingTeams.map(t => [t.id, t]));

  // Validate required headers
  const requiredHeaders = ['team_id', 'skill_name'];
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required column: ${required}`);
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue; // Skip empty lines

    const teamId = values[headers.indexOf('team_id')]?.trim();
    const skillName = values[headers.indexOf('skill_name')]?.trim();

    if (!teamId || !skillName) {
      throw new Error(`Row ${i + 1}: team_id and skill_name are required`);
    }

    // Find or create skill
    let skill = skillsMap.get(skillName.toLowerCase());
    if (!skill) {
      const skillCategory =
        values[headers.indexOf('skill_category')]?.trim() || 'other';
      skill = {
        id: `skill-${Date.now()}-${skillName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: skillName,
        category: skillCategory as SkillCategory,
        createdDate: new Date().toISOString(),
      };
      skillsMap.set(skillName.toLowerCase(), skill);
      newSkills.push(skill);
    }

    // Update team skills
    if (!teamUpdates.has(teamId)) {
      const existingTeam = teamsMap.get(teamId);
      teamUpdates.set(teamId, {
        id: teamId,
        targetSkills: [...(existingTeam?.targetSkills || [])],
      });
    }

    const teamUpdate = teamUpdates.get(teamId)!;
    if (!teamUpdate.targetSkills!.includes(skill.id)) {
      teamUpdate.targetSkills!.push(skill.id);
    }
  }

  return { teamUpdates: Array.from(teamUpdates.values()), newSkills };
};

/**
 * Parse Project Skills CSV - Import project-skill relationships
 */
export const parseProjectSkillsCSV = (
  csvContent: string,
  existingSkills: Skill[] = []
): { projectSkills: ProjectSkill[]; newSkills: Skill[] } => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error(
      'CSV file must contain at least a header row and one data row'
    );
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const projectSkills: ProjectSkill[] = [];
  const newSkills: Skill[] = [];
  const skillsMap = new Map(existingSkills.map(s => [s.name.toLowerCase(), s]));

  // Validate required headers
  const requiredHeaders = ['project_id', 'skill_name', 'importance'];
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required column: ${required}`);
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue; // Skip empty lines

    const projectId = values[headers.indexOf('project_id')]?.trim();
    const skillName = values[headers.indexOf('skill_name')]?.trim();
    const importance = values[headers.indexOf('importance')]?.trim();

    if (!projectId || !skillName || !importance) {
      throw new Error(
        `Row ${i + 1}: project_id, skill_name, and importance are required`
      );
    }

    // Validate importance
    const validImportance = ['low', 'medium', 'high'];
    if (!validImportance.includes(importance)) {
      throw new Error(
        `Row ${i + 1}: Invalid importance "${importance}". Must be one of: ${validImportance.join(', ')}`
      );
    }

    // Find or create skill
    let skill = skillsMap.get(skillName.toLowerCase());
    if (!skill) {
      skill = {
        id: `skill-${Date.now()}-${skillName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: skillName,
        category: 'other',
        createdDate: new Date().toISOString(),
      };
      skillsMap.set(skillName.toLowerCase(), skill);
      newSkills.push(skill);
    }

    const projectSkill: ProjectSkill = {
      id: `${projectId}-${skill.id}`,
      projectId,
      skillId: skill.id,
      importance: importance as ProjectSkill['importance'],
      notes: values[headers.indexOf('notes')]?.trim() || undefined,
    };

    projectSkills.push(projectSkill);
  }

  return { projectSkills, newSkills };
};

/**
 * Parse Project Solutions CSV - Import project-solution relationships
 */
export const parseProjectSolutionsCSV = (
  csvContent: string,
  existingSolutions: Solution[] = []
): { projectSolutions: ProjectSolution[]; newSolutions: Solution[] } => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error(
      'CSV file must contain at least a header row and one data row'
    );
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const projectSolutions: ProjectSolution[] = [];
  const newSolutions: Solution[] = [];
  const solutionsMap = new Map(
    existingSolutions.map(s => [s.name.toLowerCase(), s])
  );

  // Validate required headers
  const requiredHeaders = ['project_id', 'solution_name', 'importance'];
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required column: ${required}`);
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue; // Skip empty lines

    const projectId = values[headers.indexOf('project_id')]?.trim();
    const solutionName = values[headers.indexOf('solution_name')]?.trim();
    const importance = values[headers.indexOf('importance')]?.trim();

    if (!projectId || !solutionName || !importance) {
      throw new Error(
        `Row ${i + 1}: project_id, solution_name, and importance are required`
      );
    }

    // Validate importance
    const validImportance = ['low', 'medium', 'high'];
    if (!validImportance.includes(importance)) {
      throw new Error(
        `Row ${i + 1}: Invalid importance "${importance}". Must be one of: ${validImportance.join(', ')}`
      );
    }

    // Find or create solution
    let solution = solutionsMap.get(solutionName.toLowerCase());
    if (!solution) {
      solution = {
        id: `solution-${Date.now()}-${solutionName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: solutionName,
        description: '',
        category: 'other',
        createdDate: new Date().toISOString(),
      };
      solutionsMap.set(solutionName.toLowerCase(), solution);
      newSolutions.push(solution);
    }

    const projectSolution: ProjectSolution = {
      id: `${projectId}-${solution.id}`,
      projectId,
      solutionId: solution.id,
      importance: importance as ProjectSolution['importance'],
      notes: values[headers.indexOf('notes')]?.trim() || undefined,
    };

    projectSolutions.push(projectSolution);
  }

  return { projectSolutions, newSolutions };
};

/**
 * Export Skills to CSV
 */
export const exportSkillsCSV = (skills: Skill[]): string => {
  const rows = [SKILLS_HEADERS.join(',')];

  skills.forEach(skill => {
    const row = [
      skill.id,
      `"${skill.name}"`,
      skill.category,
      `"${skill.description || ''}"`,
      skill.createdDate,
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
};

/**
 * Export Person Skills to CSV
 */
export const exportPersonSkillsCSV = (
  personSkills: PersonSkill[],
  people: { id: string; name: string }[],
  skills: Skill[]
): string => {
  const peopleMap = new Map(people.map(p => [p.id, p]));
  const skillsMap = new Map(skills.map(s => [s.id, s]));

  const rows = [PERSON_SKILLS_HEADERS.join(',')];

  personSkills.forEach(personSkill => {
    const person = peopleMap.get(personSkill.personId);
    const skill = skillsMap.get(personSkill.skillId);

    if (person && skill) {
      const row = [
        personSkill.personId,
        `"${person.name}"`,
        personSkill.skillId,
        `"${skill.name}"`,
        personSkill.proficiencyLevel,
        personSkill.yearsOfExperience?.toString() || '',
        personSkill.lastUsed || '',
        `"${personSkill.certifications?.join(';') || ''}"`,
        `"${personSkill.notes || ''}"`,
      ];
      rows.push(row.join(','));
    }
  });

  return rows.join('\n');
};

/**
 * Export Combined Skills and Person Skills to CSV
 */
export const exportCombinedSkillsCSV = (
  personSkills: PersonSkill[],
  people: { id: string; name: string; email: string }[],
  skills: Skill[]
): string => {
  const peopleMap = new Map(people.map(p => [p.id, p]));
  const skillsMap = new Map(skills.map(s => [s.id, s]));

  const rows = [COMBINED_SKILLS_HEADERS.join(',')];

  personSkills.forEach(personSkill => {
    const person = peopleMap.get(personSkill.personId);
    const skill = skillsMap.get(personSkill.skillId);

    if (person && skill) {
      const row = [
        skill.id,
        `"${skill.name}"`,
        skill.category,
        `"${skill.description || ''}"`,
        person.id,
        `"${person.name}"`,
        person.email,
        personSkill.proficiencyLevel,
        personSkill.yearsOfExperience?.toString() || '',
        personSkill.lastUsed || '',
        `"${personSkill.certifications?.join(';') || ''}"`,
        `"${personSkill.notes || ''}"`,
      ];
      rows.push(row.join(','));
    }
  });

  return rows.join('\n');
};

/**
 * Download CSV file utility
 */
export const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Parse CSV line handling quoted values
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
};

/**
 * Generate sample CSV data for templates
 */
export const generateSampleSkillsCSV = (): string => {
  return [
    SKILLS_HEADERS.join(','),
    'skill-1,JavaScript,programming-language,"Dynamic programming language for web development",2024-01-01T00:00:00Z',
    'skill-2,React,framework,"JavaScript library for building user interfaces",2024-01-01T00:00:00Z',
    'skill-3,Node.js,platform,"JavaScript runtime for server-side development",2024-01-01T00:00:00Z',
    'skill-4,Agile,methodology,"Iterative project management methodology",2024-01-01T00:00:00Z',
    'skill-5,Docker,tool,"Containerization platform",2024-01-01T00:00:00Z',
  ].join('\n');
};

export const generateSamplePersonSkillsCSV = (): string => {
  return [
    PERSON_SKILLS_HEADERS.join(','),
    'person-1,John Smith,skill-1,JavaScript,advanced,5,2024-01-01,"AWS Certified Developer",Primary development language',
    'person-1,John Smith,skill-2,React,expert,4,2024-01-01,"React Certification",Lead frontend development',
    'person-2,Jane Doe,skill-3,Node.js,intermediate,3,2023-12-01,,Backend API development',
    'person-2,Jane Doe,skill-4,Agile,advanced,6,2024-01-01,"Scrum Master Certified",Team lead and mentoring',
  ].join('\n');
};

export const generateSampleCombinedSkillsCSV = (): string => {
  return [
    COMBINED_SKILLS_HEADERS.join(','),
    'skill-1,JavaScript,programming-language,"Dynamic programming language",person-1,John Smith,john.smith@company.com,advanced,5,2024-01-01,"AWS Certified Developer",Primary language',
    'skill-2,React,framework,"JavaScript library for UI",person-1,John Smith,john.smith@company.com,expert,4,2024-01-01,"React Certification",Lead development',
    'skill-3,Node.js,platform,"JavaScript runtime",person-2,Jane Doe,jane.doe@company.com,intermediate,3,2023-12-01,,Backend development',
    'skill-4,Agile,methodology,"Iterative methodology",person-2,Jane Doe,jane.doe@company.com,advanced,6,2024-01-01,"Scrum Master",Team leadership',
  ].join('\n');
};

/**
 * Export Solutions to CSV
 */
export const exportSolutionsCSV = (solutions: Solution[]): string => {
  const rows = [SOLUTIONS_HEADERS.join(',')];

  solutions.forEach(solution => {
    const row = [
      solution.id,
      `"${solution.name}"`,
      `"${solution.description}"`,
      solution.category,
      `"${(solution.skillIds || solution.skills || []).join(';')}"`,
      solution.createdDate,
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
};

/**
 * Export Solution-Skills relationships to CSV
 */
export const exportSolutionSkillsCSV = (
  solutions: Solution[],
  skills: Skill[]
): string => {
  const skillsMap = new Map(skills.map(s => [s.id, s]));
  const rows = [SOLUTION_SKILLS_HEADERS.join(',')];

  solutions.forEach(solution => {
    const solutionSkillIds = solution.skillIds || solution.skills || [];
    solutionSkillIds.forEach(skillId => {
      const skill = skillsMap.get(skillId);
      if (skill) {
        const row = [
          solution.id,
          `"${solution.name}"`,
          skill.id,
          `"${skill.name}"`,
          skill.category,
        ];
        rows.push(row.join(','));
      }
    });
  });

  return rows.join('\n');
};

/**
 * Export Team-Skills relationships to CSV
 */
export const exportTeamSkillsCSV = (teams: Team[], skills: Skill[]): string => {
  const skillsMap = new Map(skills.map(s => [s.id, s]));
  const rows = [TEAM_SKILLS_HEADERS.join(',')];

  teams.forEach(team => {
    const teamSkillIds = team.targetSkills || [];
    teamSkillIds.forEach(skillId => {
      const skill = skillsMap.get(skillId);
      if (skill) {
        const row = [
          team.id,
          `"${team.name}"`,
          team.type,
          skill.id,
          `"${skill.name}"`,
          skill.category,
          'medium', // Default importance for team skills
        ];
        rows.push(row.join(','));
      }
    });
  });

  return rows.join('\n');
};

/**
 * Export Project-Skills relationships to CSV
 */
export const exportProjectSkillsCSV = (
  projectSkills: ProjectSkill[],
  projects: Project[],
  skills: Skill[]
): string => {
  const projectsMap = new Map(projects.map(p => [p.id, p]));
  const skillsMap = new Map(skills.map(s => [s.id, s]));
  const rows = [PROJECT_SKILLS_HEADERS.join(',')];

  projectSkills.forEach(projectSkill => {
    const project = projectsMap.get(projectSkill.projectId);
    const skill = skillsMap.get(projectSkill.skillId);

    if (project && skill) {
      const row = [
        project.id,
        `"${project.name}"`,
        skill.id,
        `"${skill.name}"`,
        projectSkill.importance,
        `"${projectSkill.notes || ''}"`,
      ];
      rows.push(row.join(','));
    }
  });

  return rows.join('\n');
};

/**
 * Export Project-Solutions relationships to CSV
 */
export const exportProjectSolutionsCSV = (
  projectSolutions: ProjectSolution[],
  projects: Project[],
  solutions: Solution[]
): string => {
  const projectsMap = new Map(projects.map(p => [p.id, p]));
  const solutionsMap = new Map(solutions.map(s => [s.id, s]));
  const rows = [PROJECT_SOLUTIONS_HEADERS.join(',')];

  projectSolutions.forEach(projectSolution => {
    const project = projectsMap.get(projectSolution.projectId);
    const solution = solutionsMap.get(projectSolution.solutionId);

    if (project && solution) {
      const row = [
        project.id,
        `"${project.name}"`,
        solution.id,
        `"${solution.name}"`,
        projectSolution.importance,
        `"${projectSolution.notes || ''}"`,
      ];
      rows.push(row.join(','));
    }
  });

  return rows.join('\n');
};

/**
 * Generate sample CSVs for relationships
 */
export const generateSampleSolutionsCSV = (): string => {
  return [
    SOLUTIONS_HEADERS.join(','),
    'sol-1,E-commerce Platform,"Full-stack e-commerce solution",web-application,"skill-1;skill-2;skill-3",2024-01-01T00:00:00Z',
    'sol-2,Mobile App,"Cross-platform mobile application",mobile-application,"skill-2;skill-5",2024-01-01T00:00:00Z',
    'sol-3,API Gateway,"Microservices API gateway",infrastructure,"skill-3;skill-6",2024-01-01T00:00:00Z',
  ].join('\n');
};

export const generateSampleTeamSkillsCSV = (): string => {
  return [
    TEAM_SKILLS_HEADERS.join(','),
    'team-1,Frontend Team,permanent,skill-1,JavaScript,programming-language,high',
    'team-1,Frontend Team,permanent,skill-2,React,framework,high',
    'team-2,Backend Team,permanent,skill-3,Node.js,platform,high',
    'team-2,Backend Team,permanent,skill-4,PostgreSQL,tool,medium',
  ].join('\n');
};

export const generateSampleProjectSkillsCSV = (): string => {
  return [
    PROJECT_SKILLS_HEADERS.join(','),
    'proj-1,E-commerce Website,skill-1,JavaScript,high,Core frontend technology',
    'proj-1,E-commerce Website,skill-2,React,high,Main UI framework',
    'proj-2,Mobile App,skill-2,React,medium,React Native for mobile',
    'proj-2,Mobile App,skill-5,Swift,high,iOS development',
  ].join('\n');
};

export const generateSampleProjectSolutionsCSV = (): string => {
  return [
    PROJECT_SOLUTIONS_HEADERS.join(','),
    'proj-1,E-commerce Website,sol-1,E-commerce Platform,high,Core platform solution',
    'proj-1,E-commerce Website,sol-2,Payment Gateway,high,Payment processing solution',
    'proj-2,Mobile App,sol-2,Mobile App,high,Cross-platform mobile solution',
    'proj-3,API Gateway,sol-3,API Gateway,medium,Microservices gateway solution',
  ].join('\n');
};
