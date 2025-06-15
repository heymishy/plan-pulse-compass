
import { Person, Role, Team, Project, Skill, PersonSkill, SkillCategory } from '@/types';

export const downloadSampleCSV = (filename: string) => {
  const link = document.createElement('a');
  link.href = `/samples/${filename}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSV = (text: string): string[][] => {
  const lines = text.trim().split('\n');
  return lines.map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });
};

export const parsePeopleCSV = (text: string): { people: Person[], teams: Team[] } => {
  const rows = parseCSV(text);
  const headers = rows[0];
  const dataRows = rows.slice(1);
  
  const people: Person[] = [];
  const teamsMap = new Map<string, Team>();
  
  dataRows.forEach((row, index) => {
    if (row.length < 5) return;
    
    const [name, email, role, teamName, teamId] = row;
    
    // Create person
    people.push({
      id: `person-${index + 1}`,
      name: name.replace(/"/g, ''),
      email: email.replace(/"/g, ''),
      roleId: `role-${role.toLowerCase().replace(/\s+/g, '-')}`,
      teamId: teamId.replace(/"/g, ''),
      isActive: true,
      employmentType: 'permanent', // Default value
      startDate: new Date().toISOString().split('T')[0], // Default to today
    });
    
    // Create team if not exists
    if (!teamsMap.has(teamId)) {
      teamsMap.set(teamId, {
        id: teamId.replace(/"/g, ''),
        name: teamName.replace(/"/g, ''),
        capacity: 40, // Default 40 hours per week
      });
    }
  });
  
  return { people, teams: Array.from(teamsMap.values()) };
};

export const parseProjectsCSV = (text: string): Project[] => {
  const rows = parseCSV(text);
  const dataRows = rows.slice(1);
  
  return dataRows.map((row, index) => {
    if (row.length < 4) return null;
    
    const [name, description, status, startDate, endDate, budget] = row;
    
    return {
      id: `project-${index + 1}`,
      name: name.replace(/"/g, ''),
      description: description?.replace(/"/g, '') || '',
      status: (status.replace(/"/g, '') as Project['status']) || 'planning',
      startDate: startDate.replace(/"/g, ''),
      endDate: endDate?.replace(/"/g, '') || undefined,
      budget: budget ? parseFloat(budget.replace(/"/g, '')) : undefined,
      milestones: [],
    };
  }).filter(Boolean) as Project[];
};

export const parseRolesCSV = (text: string): Role[] => {
  const rows = parseCSV(text);
  const dataRows = rows.slice(1);
  
  return dataRows.map((row, index) => {
    if (row.length < 2) return null;
    
    const [roleName, defaultRateStr] = row;
    const defaultRate = parseFloat(defaultRateStr.replace(/"/g, ''));
    
    return {
      id: `role-${roleName.toLowerCase().replace(/\s+/g, '-')}`,
      name: roleName.replace(/"/g, ''),
      rateType: 'hourly', // Assume hourly for CSV import
      defaultRate: defaultRate, // Legacy field
      defaultHourlyRate: defaultRate,
    };
  }).filter(Boolean) as Role[];
};

export const parseSkillsCSV = (text: string): Skill[] => {
  const rows = parseCSV(text);
  const dataRows = rows.slice(1);
  
  return dataRows.map((row, index) => {
    if (row.length < 2) return null;
    
    const [skillName, categoryStr, description] = row;
    const category = (categoryStr?.replace(/"/g, '') as SkillCategory) || 'other';
    
    return {
      id: `skill-${skillName.toLowerCase().replace(/\s+/g, '-')}-${index}`,
      name: skillName.replace(/"/g, ''),
      category: category,
      description: description?.replace(/"/g, '') || undefined,
      createdDate: new Date().toISOString(),
    };
  }).filter(Boolean) as Skill[];
};

export const parsePeopleWithSkillsCSV = (text: string): { 
  people: Person[], 
  teams: Team[], 
  skills: Skill[], 
  personSkills: PersonSkill[] 
} => {
  const rows = parseCSV(text);
  const headers = rows[0];
  const dataRows = rows.slice(1);
  
  const people: Person[] = [];
  const teamsMap = new Map<string, Team>();
  const skillsMap = new Map<string, Skill>();
  const personSkills: PersonSkill[] = [];
  
  dataRows.forEach((row, index) => {
    if (row.length < 5) return;
    
    const [name, email, role, teamName, teamId, skillsStr, proficiencyStr] = row;
    
    const personId = `person-${index + 1}`;
    
    // Create person
    people.push({
      id: personId,
      name: name.replace(/"/g, ''),
      email: email.replace(/"/g, ''),
      roleId: `role-${role.toLowerCase().replace(/\s+/g, '-')}`,
      teamId: teamId.replace(/"/g, ''),
      isActive: true,
      employmentType: 'permanent',
      startDate: new Date().toISOString().split('T')[0],
    });
    
    // Create team if not exists
    if (!teamsMap.has(teamId)) {
      teamsMap.set(teamId, {
        id: teamId.replace(/"/g, ''),
        name: teamName.replace(/"/g, ''),
        capacity: 40,
      });
    }
    
    // Parse skills if provided
    if (skillsStr) {
      const skillNames = skillsStr.replace(/"/g, '').split(';').map(s => s.trim()).filter(Boolean);
      const proficiencies = proficiencyStr?.replace(/"/g, '').split(';').map(s => s.trim()).filter(Boolean) || [];
      
      skillNames.forEach((skillName, skillIndex) => {
        const skillId = `skill-${skillName.toLowerCase().replace(/\s+/g, '-')}`;
        
        // Create skill if not exists
        if (!skillsMap.has(skillId)) {
          skillsMap.set(skillId, {
            id: skillId,
            name: skillName,
            category: 'other',
            createdDate: new Date().toISOString(),
          });
        }
        
        // Create person skill
        const proficiency = proficiencies[skillIndex] || 'intermediate';
        personSkills.push({
          id: crypto.randomUUID(),
          personId: personId,
          skillId: skillId,
          proficiencyLevel: (proficiency as PersonSkill['proficiencyLevel']) || 'intermediate',
        });
      });
    }
  });
  
  return { 
    people, 
    teams: Array.from(teamsMap.values()),
    skills: Array.from(skillsMap.values()),
    personSkills
  };
};

export const exportPeopleWithSkillsCSV = (
  people: Person[], 
  teams: Team[], 
  skills: Skill[], 
  personSkills: PersonSkill[]
): string => {
  const headers = ['Name', 'Email', 'Role', 'Team Name', 'Team ID', 'Skills', 'Proficiency Levels'];
  
  const rows = people.map(person => {
    const team = teams.find(t => t.id === person.teamId);
    const personSkillsList = personSkills.filter(ps => ps.personId === person.id);
    
    const skillNames = personSkillsList.map(ps => {
      const skill = skills.find(s => s.id === ps.skillId);
      return skill?.name || 'Unknown';
    }).join(';');
    
    const proficiencyLevels = personSkillsList.map(ps => ps.proficiencyLevel).join(';');
    
    return [
      person.name,
      person.email,
      person.roleId, // You might want to resolve this to role name
      team?.name || 'Unknown',
      person.teamId,
      skillNames,
      proficiencyLevels
    ];
  });
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
    
  return csvContent;
};

export const exportSkillsCSV = (skills: Skill[]): string => {
  const headers = ['Name', 'Category', 'Description', 'Created Date'];
  
  const rows = skills.map(skill => [
    skill.name,
    skill.category,
    skill.description || '',
    new Date(skill.createdDate).toLocaleDateString()
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
    
  return csvContent;
};
