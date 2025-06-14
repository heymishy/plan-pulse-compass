
import { Person, Role, Team, Project } from '@/types';

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
    
    const [roleName, defaultRate] = row;
    
    return {
      id: `role-${roleName.toLowerCase().replace(/\s+/g, '-')}`,
      name: roleName.replace(/"/g, ''),
      defaultRate: parseFloat(defaultRate.replace(/"/g, '')),
    };
  }).filter(Boolean) as Role[];
};
