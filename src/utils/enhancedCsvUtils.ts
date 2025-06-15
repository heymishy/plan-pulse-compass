import { Person, Role, Team, Division, PersonSkill, Skill } from '@/types';

export interface EnhancedPersonCSVRow {
  name: string;
  email: string;
  role: string;
  team_name: string;
  team_id: string;
  employment_type?: string;
  annual_salary?: string;
  hourly_rate?: string;
  daily_rate?: string;
  start_date?: string;
  end_date?: string;
  is_active?: string;
  skills?: string;
  skill_proficiencies?: string;
  years_experience?: string;
  certifications?: string;
  division_name?: string;
  division_id?: string;
  team_manager_email?: string;
  team_capacity?: string;
}

export interface TeamWithDivisionCSVRow {
  team_id: string;
  team_name: string;
  division_id?: string;
  division_name?: string;
  manager_email?: string;
  capacity?: string;
  division_budget?: string;
  division_description?: string;
}

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
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    return values;
  });
};

export const parseEnhancedPeopleCSV = (text: string): {
  people: Person[];
  teams: Team[];
  divisions: Division[];
  roles: Role[];
} => {
  const rows = parseCSV(text);
  const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const dataRows = rows.slice(1);
  
  const people: Person[] = [];
  const teamsMap = new Map<string, Team>();
  const divisionsMap = new Map<string, Division>();
  const rolesMap = new Map<string, Role>();
  
  dataRows.forEach((row, index) => {
    if (row.length < 5) return;
    
    const rowData: Record<string, string> = {};
    headers.forEach((header, i) => {
      rowData[header] = row[i] || '';
    });
    
    const personId = `person-${index + 1}`;
    const teamId = rowData.team_id || `team-${rowData.team_name?.toLowerCase().replace(/\s+/g, '-')}`;
    const divisionId = rowData.division_id || (rowData.division_name ? `division-${rowData.division_name.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const roleId = `role-${rowData.role?.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Create role if not exists with enhanced rate support
    if (rowData.role && !rolesMap.has(roleId)) {
      const hourlyRate = parseFloat(rowData.role_default_hourly_rate || rowData.hourly_rate || '0');
      const dailyRate = parseFloat(rowData.role_default_daily_rate || rowData.daily_rate || '0');
      const annualSalary = parseFloat(rowData.role_default_annual_salary || rowData.annual_salary || '0');
      const legacyRate = parseFloat(rowData.role_default_rate || (hourlyRate > 0 ? hourlyRate.toString() : '100'));

      rolesMap.set(roleId, {
        id: roleId,
        name: rowData.role,
        rateType: hourlyRate > 0 ? 'hourly' : dailyRate > 0 ? 'daily' : 'hourly',
        defaultRate: legacyRate,
        defaultHourlyRate: hourlyRate > 0 ? hourlyRate : undefined,
        defaultDailyRate: dailyRate > 0 ? dailyRate : undefined,
        defaultAnnualSalary: annualSalary > 0 ? annualSalary : undefined,
      });
    }
    
    // Create division if specified
    if (rowData.division_name && divisionId && !divisionsMap.has(divisionId)) {
      divisionsMap.set(divisionId, {
        id: divisionId,
        name: rowData.division_name,
        description: rowData.division_description || undefined,
        budget: rowData.division_budget ? parseFloat(rowData.division_budget) : undefined,
      });
    }
    
    // Create team if not exists
    if (!teamsMap.has(teamId)) {
      teamsMap.set(teamId, {
        id: teamId,
        name: rowData.team_name || 'Unknown Team',
        divisionId: divisionId,
        capacity: rowData.team_capacity ? parseFloat(rowData.team_capacity) : 40,
      });
    }
    
    // Parse employment details with enhanced rate handling
    const employmentType = (rowData.employment_type?.toLowerCase() === 'contractor' ? 'contractor' : 'permanent') as 'permanent' | 'contractor';
    const isActive = rowData.is_active?.toLowerCase() !== 'false' && rowData.is_active?.toLowerCase() !== '0';
    
    // Create person
    const person: Person = {
      id: personId,
      name: rowData.name,
      email: rowData.email,
      roleId: roleId,
      teamId: teamId,
      isActive: isActive,
      employmentType: employmentType,
      startDate: rowData.start_date || new Date().toISOString().split('T')[0],
      endDate: rowData.end_date || undefined,
    };
    
    // Add financial details based on employment type with priority to personal rates
    if (employmentType === 'permanent') {
      const personalSalary = parseFloat(rowData.annual_salary || '0');
      if (personalSalary > 0) {
        person.annualSalary = personalSalary;
      }
    } else if (employmentType === 'contractor') {
      const personalHourly = parseFloat(rowData.hourly_rate || '0');
      const personalDaily = parseFloat(rowData.daily_rate || '0');
      
      if (personalHourly > 0 || personalDaily > 0) {
        person.contractDetails = {
          hourlyRate: personalHourly > 0 ? personalHourly : undefined,
          dailyRate: personalDaily > 0 ? personalDaily : undefined,
        };
      }
    }
    
    people.push(person);
  });
  
  return {
    people,
    teams: Array.from(teamsMap.values()),
    divisions: Array.from(divisionsMap.values()),
    roles: Array.from(rolesMap.values()),
  };
};

export const parseTeamsWithDivisionsCSV = (text: string): {
  teams: Team[];
  divisions: Division[];
} => {
  const rows = parseCSV(text);
  const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const dataRows = rows.slice(1);
  
  const teamsMap = new Map<string, Team>();
  const divisionsMap = new Map<string, Division>();
  
  dataRows.forEach(row => {
    if (row.length < 2) return;
    
    const rowData: Record<string, string> = {};
    headers.forEach((header, i) => {
      rowData[header] = row[i] || '';
    });
    
    const teamId = rowData.team_id;
    const divisionId = rowData.division_id || (rowData.division_name ? `division-${rowData.division_name.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    
    // Create division if specified
    if (rowData.division_name && divisionId && !divisionsMap.has(divisionId)) {
      divisionsMap.set(divisionId, {
        id: divisionId,
        name: rowData.division_name,
        description: rowData.division_description || undefined,
        budget: rowData.division_budget ? parseFloat(rowData.division_budget) : undefined,
      });
    }
    
    // Create team
    teamsMap.set(teamId, {
      id: teamId,
      name: rowData.team_name,
      divisionId: divisionId,
      capacity: rowData.capacity ? parseFloat(rowData.capacity) : 40,
    });
  });
  
  return {
    teams: Array.from(teamsMap.values()),
    divisions: Array.from(divisionsMap.values()),
  };
};

export const exportEnhancedPeopleCSV = (
  people: Person[],
  teams: Team[],
  divisions: Division[],
  roles: Role[]
): string => {
  console.log('Exporting enhanced people. Data received:', {
    peopleCount: people.length,
    teamsCount: teams.length,
    divisionsCount: divisions.length,
    rolesCount: roles.length,
  });

  const headers = [
    'name', 'email', 'role', 'team_name', 'team_id', 'employment_type',
    'annual_salary', 'hourly_rate', 'daily_rate', 'start_date', 'end_date',
    'is_active', 'division_name', 'division_id', 'team_capacity',
    'role_default_annual_salary', 'role_default_hourly_rate', 'role_default_daily_rate'
  ];
  
  const rows = people.map(person => {
    const team = teams.find(t => t.id === person.teamId);
    const division = team?.divisionId ? divisions.find(d => d.id === team.divisionId) : undefined;
    const role = roles.find(r => r.id === person.roleId);
    
    return [
      person.name,
      person.email,
      role?.name || person.roleId,
      team?.name || 'Unknown',
      person.teamId,
      person.employmentType,
      person.annualSalary?.toString() || '',
      person.contractDetails?.hourlyRate?.toString() || '',
      person.contractDetails?.dailyRate?.toString() || '',
      person.startDate,
      person.endDate || '',
      person.isActive.toString(),
      division?.name || '',
      division?.id || '',
      team?.capacity?.toString() || '',
      role?.defaultAnnualSalary?.toString() || '',
      role?.defaultHourlyRate?.toString() || '',
      role?.defaultDailyRate?.toString() || ''
    ];
  });
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    .join('\n');
    
  return csvContent;
};

export const exportTeamsWithDivisionsCSV = (
  teams: Team[],
  divisions: Division[]
): string => {
  const headers = [
    'team_id', 'team_name', 'division_id', 'division_name',
    'capacity', 'division_budget', 'division_description'
  ];
  
  const rows = teams.map(team => {
    const division = team.divisionId ? divisions.find(d => d.id === team.divisionId) : undefined;
    
    return [
      team.id,
      team.name,
      division?.id || '',
      division?.name || '',
      team.capacity?.toString() || '40',
      division?.budget?.toString() || '',
      division?.description || ''
    ];
  });
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    .join('\n');
    
  return csvContent;
};

export const exportRolesCSV = (roles: Role[]): string => {
  const headers = [
    'role_id', 'role_name', 'description', 'default_annual_salary',
    'default_hourly_rate', 'default_daily_rate', 'legacy_default_rate'
  ];
  
  const rows = roles.map(role => [
    role.id,
    role.name,
    role.description || '',
    role.defaultAnnualSalary?.toString() || '',
    role.defaultHourlyRate?.toString() || '',
    role.defaultDailyRate?.toString() || '',
    role.defaultRate?.toString() || ''
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    .join('\n');
    
  return csvContent;
};

export const parseRolesCSV = (text: string): Role[] => {
  const rows = parseCSV(text);
  const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const dataRows = rows.slice(1);
  
  return dataRows.map((row, index) => {
    const rowData: Record<string, string> = {};
    headers.forEach((header, i) => {
      rowData[header] = row[i] || '';
    });
    
    return {
      id: rowData.role_id || `role-${index + 1}`,
      name: rowData.role_name || rowData.name || '',
      description: rowData.description || '',
      rateType: 'hourly' as const,
      defaultRate: parseFloat(rowData.legacy_default_rate || rowData.default_rate || '0'),
      defaultAnnualSalary: parseFloat(rowData.default_annual_salary || '0') || undefined,
      defaultHourlyRate: parseFloat(rowData.default_hourly_rate || '0') || undefined,
      defaultDailyRate: parseFloat(rowData.default_daily_rate || '0') || undefined,
    };
  }).filter(role => role.name.trim() !== '');
};

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
