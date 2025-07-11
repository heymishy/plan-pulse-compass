import { Project, Epic, Milestone } from '@/types';
import { parseDateString } from './dateUtils';

export interface ProjectCSVRow {
  project_name: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  budget?: string;
  milestone_names?: string;
  milestone_due_dates?: string;
  milestone_descriptions?: string;
  milestone_statuses?: string;
}

export interface EpicCSVRow {
  epic_name: string;
  project_name?: string;
  project_id?: string;
  description?: string;
  estimated_effort?: string;
  status?: string;
  start_date?: string;
  target_end_date?: string;
  actual_end_date?: string;
}

export interface CombinedProjectEpicCSVRow {
  project_name: string;
  project_description?: string;
  project_status?: string;
  project_start_date?: string;
  project_end_date?: string;
  project_budget?: string;
  epic_name?: string;
  epic_description?: string;
  epic_effort?: string;
  epic_team?: string;
  epic_target_date?: string;
  milestone_name?: string;
  milestone_due_date?: string;
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

export const parseProjectsCSV = (
  text: string
): {
  projects: Project[];
  milestones: Milestone[];
} => {
  const rows = parseCSV(text);
  const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const dataRows = rows.slice(1);

  const projects: Project[] = [];
  const milestones: Milestone[] = [];

  dataRows.forEach((row, index) => {
    if (row.length < 1) return;

    const rowData: Record<string, string> = {};
    headers.forEach((header, i) => {
      rowData[header] = row[i] || '';
    });

    const projectId = `project-${index + 1}`;
    const status = (
      rowData.status?.toLowerCase() === 'active'
        ? 'active'
        : rowData.status?.toLowerCase() === 'completed'
          ? 'completed'
          : rowData.status?.toLowerCase() === 'cancelled'
            ? 'cancelled'
            : 'planning'
    ) as Project['status'];

    // Create project
    const project: Project = {
      id: projectId,
      name: rowData.project_name,
      description: rowData.description || undefined,
      status: status,
      startDate:
        parseDateString(rowData.start_date) ||
        new Date().toISOString().split('T')[0],
      endDate: parseDateString(rowData.end_date),
      budget: rowData.budget ? parseFloat(rowData.budget) : undefined,
      milestones: [],
    };

    projects.push(project);

    // Parse milestones if provided
    if (rowData.milestone_names) {
      const milestoneNames = rowData.milestone_names
        .split(';')
        .map(s => s.trim())
        .filter(Boolean);
      const milestoneDates =
        rowData.milestone_due_dates
          ?.split(';')
          .map(s => s.trim())
          .filter(Boolean) || [];
      const milestoneDescs =
        rowData.milestone_descriptions
          ?.split(';')
          .map(s => s.trim())
          .filter(Boolean) || [];
      const milestoneStats =
        rowData.milestone_statuses
          ?.split(';')
          .map(s => s.trim())
          .filter(Boolean) || [];

      milestoneNames.forEach((name, milestoneIndex) => {
        const milestoneStatus = (
          milestoneStats[milestoneIndex]?.toLowerCase() === 'completed'
            ? 'completed'
            : milestoneStats[milestoneIndex]?.toLowerCase() === 'in-progress'
              ? 'in-progress'
              : milestoneStats[milestoneIndex]?.toLowerCase() === 'at-risk'
                ? 'at-risk'
                : 'not-started'
        ) as Milestone['status'];

        const milestone: Milestone = {
          id: crypto.randomUUID(),
          projectId: projectId,
          name: name,
          description: milestoneDescs[milestoneIndex] || undefined,
          dueDate:
            parseDateString(milestoneDates[milestoneIndex]) ||
            project.endDate ||
            new Date().toISOString().split('T')[0],
          status: milestoneStatus,
        };

        milestones.push(milestone);
        project.milestones.push(milestone);
      });
    }
  });

  return { projects, milestones };
};

export const parseEpicsCSV = (
  text: string,
  existingProjects: Project[]
): {
  epics: Epic[];
  projects: Project[];
} => {
  const rows = parseCSV(text);
  const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const dataRows = rows.slice(1);

  const epics: Epic[] = [];
  const projectsMap = new Map(existingProjects.map(p => [p.id, p]));
  const projectsByName = new Map(
    existingProjects.map(p => [p.name.toLowerCase(), p])
  );

  dataRows.forEach((row, index) => {
    if (row.length < 1) return;

    const rowData: Record<string, string> = {};
    headers.forEach((header, i) => {
      rowData[header] = row[i] || '';
    });

    // Find or create project
    let projectId = rowData.project_id;
    if (!projectId && rowData.project_name) {
      const existingProject = projectsByName.get(
        rowData.project_name.toLowerCase()
      );
      if (existingProject) {
        projectId = existingProject.id;
      } else {
        // Create new project
        projectId = `project-auto-${index + 1}`;
        const newProject: Project = {
          id: projectId,
          name: rowData.project_name,
          description: `Auto-created from epic import`,
          status: 'planning',
          startDate: new Date().toISOString().split('T')[0],
          milestones: [],
        };
        projectsMap.set(projectId, newProject);
        projectsByName.set(newProject.name.toLowerCase(), newProject);
      }
    }

    if (!projectId) return;

    const status = (
      rowData.status?.toLowerCase() === 'completed'
        ? 'completed'
        : rowData.status?.toLowerCase() === 'in-progress'
          ? 'in-progress'
          : rowData.status?.toLowerCase() === 'active'
            ? 'in-progress'
            : rowData.status?.toLowerCase() === 'planning'
              ? 'not-started'
              : 'not-started'
    ) as Epic['status'];

    const epic: Epic = {
      id: `epic-${index + 1}`,
      projectId: projectId,
      name: rowData.epic_name,
      description: rowData.description || undefined,
      estimatedEffort: rowData.estimated_effort
        ? parseFloat(rowData.estimated_effort)
        : undefined,
      status: status,
      startDate: parseDateString(rowData.start_date),
      targetEndDate: parseDateString(rowData.target_end_date),
      actualEndDate: parseDateString(rowData.actual_end_date),
    };

    epics.push(epic);
  });

  return {
    epics,
    projects: Array.from(projectsMap.values()),
  };
};

export const parseCombinedProjectEpicCSV = (
  text: string
): {
  projects: Project[];
  epics: Epic[];
  milestones: Milestone[];
} => {
  const rows = parseCSV(text);
  const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const dataRows = rows.slice(1);

  const projectsMap = new Map<string, Project>();
  const epics: Epic[] = [];
  const milestones: Milestone[] = [];

  dataRows.forEach((row, index) => {
    if (row.length < 1) return;

    const rowData: Record<string, string> = {};
    headers.forEach((header, i) => {
      rowData[header] = row[i] || '';
    });

    const projectName = rowData.project_name;
    if (!projectName) return;

    const projectId = `project-${projectName.toLowerCase().replace(/\s+/g, '-')}`;

    // Create or update project
    if (!projectsMap.has(projectId)) {
      const projectStatus = (
        rowData.project_status?.toLowerCase() === 'active'
          ? 'active'
          : rowData.project_status?.toLowerCase() === 'completed'
            ? 'completed'
            : rowData.project_status?.toLowerCase() === 'cancelled'
              ? 'cancelled'
              : 'planning'
      ) as Project['status'];

      const project: Project = {
        id: projectId,
        name: projectName,
        description: rowData.project_description || undefined,
        status: projectStatus,
        startDate:
          parseDateString(rowData.project_start_date) ||
          new Date().toISOString().split('T')[0],
        endDate: parseDateString(rowData.project_end_date),
        budget: rowData.project_budget
          ? parseFloat(rowData.project_budget)
          : undefined,
        milestones: [],
      };

      projectsMap.set(projectId, project);
    }

    // Add epic if provided
    if (rowData.epic_name) {
      const epic: Epic = {
        id: `epic-${index + 1}`,
        projectId: projectId,
        name: rowData.epic_name,
        description: rowData.epic_description || undefined,
        estimatedEffort: rowData.epic_effort
          ? parseFloat(rowData.epic_effort)
          : undefined,
        status: 'not-started',
        targetEndDate: parseDateString(rowData.epic_target_date),
      };

      epics.push(epic);
    }

    // Add milestone if provided
    if (rowData.milestone_name && rowData.milestone_due_date) {
      const milestone: Milestone = {
        id: crypto.randomUUID(),
        projectId: projectId,
        name: rowData.milestone_name,
        dueDate:
          parseDateString(rowData.milestone_due_date) ||
          new Date().toISOString().split('T')[0],
        status: 'not-started',
      };

      milestones.push(milestone);
      const project = projectsMap.get(projectId);
      if (project) {
        project.milestones.push(milestone);
      }
    }
  });

  return {
    projects: Array.from(projectsMap.values()),
    epics,
    milestones,
  };
};

export const parseCombinedProjectEpicCSVWithMapping = (
  text: string,
  mapping: Record<string, string>,
  existingProjects: Project[],
  existingEpics: Epic[]
): {
  projects: Project[];
  epics: Epic[];
  milestones: Milestone[];
  errors: { row: number; message: string }[];
} => {
  const rows = parseCSV(text);
  const headers = rows[0].map(h => h.trim());
  const dataRows = rows.slice(1);

  const projectsMap = new Map<string, Project>(
    existingProjects.map(p => [p.name.toLowerCase(), p])
  );
  const epicsMap = new Map<string, Epic>(
    existingEpics.map(e => [e.name.toLowerCase(), e])
  );
  const updatedProjects = new Set<string>();
  const updatedEpics = new Set<string>();

  const newProjects: Project[] = [];
  const newEpics: Epic[] = [];
  const newMilestones: Milestone[] = [];
  const errors: { row: number; message: string }[] = [];

  dataRows.forEach((row, index) => {
    const sourceData: Record<string, string> = {};
    headers.forEach((header, i) => {
      sourceData[header] = (row[i] || '').trim();
    });

    const rowData: Record<string, string> = {};
    for (const targetField in mapping) {
      const sourceHeader = mapping[targetField];
      if (sourceHeader && sourceData[sourceHeader]) {
        rowData[targetField] = sourceData[sourceHeader];
      }
    }

    const projectName = rowData.project_name;
    if (!projectName) {
      errors.push({ row: index + 2, message: 'Project Name is required.' });
      return;
    }

    let project = projectsMap.get(projectName.toLowerCase());
    if (project) {
      // Update existing project
      project.description = rowData.project_description || project.description;
      project.status =
        (rowData.project_status?.toLowerCase() as Project['status']) ||
        project.status;
      project.startDate =
        parseDateString(rowData.project_start_date) || project.startDate;
      project.endDate =
        parseDateString(rowData.project_end_date) || project.endDate;
      project.budget = rowData.project_budget
        ? parseFloat(rowData.project_budget)
        : project.budget;
      updatedProjects.add(project.id);
    } else {
      // Create new project
      const projectId = `project-${projectName.toLowerCase().replace(/\s+/g, '-')}`;
      const projectStatus = (
        rowData.project_status?.toLowerCase() === 'active'
          ? 'active'
          : rowData.project_status?.toLowerCase() === 'completed'
            ? 'completed'
            : rowData.project_status?.toLowerCase() === 'cancelled'
              ? 'cancelled'
              : 'planning'
      ) as Project['status'];

      project = {
        id: projectId,
        name: projectName,
        description: rowData.project_description || undefined,
        status: projectStatus,
        startDate:
          parseDateString(rowData.project_start_date) ||
          new Date().toISOString().split('T')[0],
        endDate: parseDateString(rowData.project_end_date),
        budget: rowData.project_budget
          ? parseFloat(rowData.project_budget)
          : undefined,
        milestones: [],
      };
      projectsMap.set(projectName.toLowerCase(), project);
      newProjects.push(project);
    }

    if (rowData.epic_name) {
      let epic = epicsMap.get(rowData.epic_name.toLowerCase());
      if (epic) {
        // Update existing epic
        epic.description = rowData.epic_description || epic.description;
        epic.estimatedEffort = rowData.epic_effort
          ? parseFloat(rowData.epic_effort)
          : epic.estimatedEffort;
        epic.status =
          (rowData.epic_status?.toLowerCase() as Epic['status']) || epic.status;
        epic.targetEndDate =
          parseDateString(rowData.epic_target_date) || epic.targetEndDate;
        updatedEpics.add(epic.id);
      } else {
        // Create new epic
        epic = {
          id: `epic-${rowData.epic_name.toLowerCase().replace(/\s+/g, '-')}`,
          projectId: project.id,
          name: rowData.epic_name,
          description: rowData.epic_description || undefined,
          estimatedEffort: rowData.epic_effort
            ? parseFloat(rowData.epic_effort)
            : undefined,
          status: 'not-started',
          targetEndDate: parseDateString(rowData.epic_target_date),
        };
        epicsMap.set(rowData.epic_name.toLowerCase(), epic);
        newEpics.push(epic);
      }
    }

    if (rowData.milestone_name && rowData.milestone_due_date) {
      const milestone: Milestone = {
        id: crypto.randomUUID(),
        projectId: project.id,
        name: rowData.milestone_name,
        dueDate:
          parseDateString(rowData.milestone_due_date) ||
          new Date().toISOString().split('T')[0],
        status: 'not-started',
      };
      newMilestones.push(milestone);
      project.milestones.push(milestone);
    }
  });

  return {
    projects: [
      ...newProjects,
      ...(Array.from(updatedProjects)
        .map(id => existingProjects.find(p => p.id === id))
        .filter(Boolean) as Project[]),
    ],
    epics: [
      ...newEpics,
      ...(Array.from(updatedEpics)
        .map(id => existingEpics.find(e => e.id === id))
        .filter(Boolean) as Epic[]),
    ],
    milestones: newMilestones,
    errors,
  };
};

export const exportProjectsCSV = (projects: Project[]): string => {
  const headers = [
    'project_name',
    'description',
    'status',
    'start_date',
    'end_date',
    'budget',
    'milestone_names',
    'milestone_due_dates',
    'milestone_descriptions',
    'milestone_statuses',
  ];

  const rows = projects.map(project => {
    const milestoneNames = project.milestones.map(m => m.name).join(';');
    const milestoneDates = project.milestones.map(m => m.dueDate).join(';');
    const milestoneDescs = project.milestones
      .map(m => m.description || '')
      .join(';');
    const milestoneStats = project.milestones.map(m => m.status).join(';');

    return [
      project.name,
      project.description || '',
      project.status,
      project.startDate,
      project.endDate || '',
      project.budget?.toString() || '',
      milestoneNames,
      milestoneDates,
      milestoneDescs,
      milestoneStats,
    ];
  });

  return [headers, ...rows]
    .map(row =>
      row
        .map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');
};

export const exportEpicsCSV = (epics: Epic[], projects: Project[]): string => {
  const headers = [
    'epic_name',
    'project_name',
    'project_id',
    'description',
    'estimated_effort',
    'status',
    'start_date',
    'target_end_date',
    'actual_end_date',
  ];

  const projectsMap = new Map(projects.map(p => [p.id, p]));

  const rows = epics.map(epic => {
    const project = projectsMap.get(epic.projectId);

    return [
      epic.name,
      project?.name || 'Unknown Project',
      epic.projectId,
      epic.description || '',
      epic.estimatedEffort?.toString() || '',
      epic.status,
      epic.startDate || '',
      epic.targetEndDate || '',
      epic.actualEndDate || '',
    ];
  });

  return [headers, ...rows]
    .map(row =>
      row
        .map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');
};

export const exportCombinedProjectEpicCSV = (
  projects: Project[],
  epics: Epic[]
): string => {
  console.log('Exporting combined projects and epics. Data received:', {
    projectsCount: projects.length,
    epicsCount: epics.length,
  });
  if (projects.length > 0) {
    console.log('First project:', projects[0]);
  }

  const headers = [
    'project_name',
    'project_description',
    'project_status',
    'project_start_date',
    'project_end_date',
    'project_budget',
    'epic_name',
    'epic_description',
    'epic_effort',
    'epic_team',
    'epic_target_date',
    'milestone_name',
    'milestone_due_date',
  ];

  const rows: string[][] = [];

  projects.forEach(project => {
    const projectEpics = epics.filter(e => e.projectId === project.id);

    if (projectEpics.length === 0 && project.milestones.length === 0) {
      // Project only
      rows.push([
        project.name,
        project.description || '',
        project.status,
        project.startDate,
        project.endDate || '',
        project.budget?.toString() || '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ]);
    } else {
      // Project with epics and milestones
      const maxRows = Math.max(
        projectEpics.length,
        project.milestones.length,
        1
      );

      for (let i = 0; i < maxRows; i++) {
        const epic = projectEpics[i];
        const milestone = project.milestones[i];

        rows.push([
          i === 0 ? project.name : '',
          i === 0 ? project.description || '' : '',
          i === 0 ? project.status : '',
          i === 0 ? project.startDate : '',
          i === 0 ? project.endDate || '' : '',
          i === 0 ? project.budget?.toString() || '' : '',
          epic?.name || '',
          epic?.description || '',
          epic?.estimatedEffort?.toString() || '',
          epic?.targetEndDate || '',
          milestone?.name || '',
          milestone?.dueDate || '',
        ]);
      }
    }
  });

  return [headers, ...rows]
    .map(row =>
      row
        .map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');
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
