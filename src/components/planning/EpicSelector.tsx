
import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Project, Epic } from '@/types';

interface EpicSelectorProps {
  selectedProjectId: string;
  selectedEpicId: string;
  projects: Project[];
  epics: Epic[];
  onProjectChange: (projectId: string) => void;
  onEpicChange: (epicId: string) => void;
}

const EpicSelector: React.FC<EpicSelectorProps> = ({
  selectedProjectId,
  selectedEpicId,
  projects,
  epics,
  onProjectChange,
  onEpicChange,
}) => {
  const selectableProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');
  const availableEpics = selectedProjectId 
    ? epics.filter(epic => epic.projectId === selectedProjectId)
    : [];

  return (
    <>
      <div className="space-y-2">
        <Label>Project</Label>
        <Select value={selectedProjectId} onValueChange={onProjectChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {selectableProjects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Epic</Label>
        <Select 
          value={selectedEpicId} 
          onValueChange={onEpicChange}
          disabled={!selectedProjectId}
        >
          <SelectTrigger>
            <SelectValue placeholder={selectedProjectId ? "Select epic" : "Select project first"} />
          </SelectTrigger>
          <SelectContent>
            {availableEpics.map(epic => (
              <SelectItem key={epic.id} value={epic.id}>
                {epic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default EpicSelector;
