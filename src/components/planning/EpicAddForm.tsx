
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Project, Epic } from '@/types';
import { Plus } from 'lucide-react';

interface EpicAddFormProps {
  projectForEpic: string;
  epicToAdd: string;
  projects: Project[];
  epics: Epic[];
  teamSelectedEpics: string[];
  onProjectForEpicChange: (projectId: string) => void;
  onEpicToAddChange: (epicId: string) => void;
  onAddEpic: () => void;
}

const EpicAddForm: React.FC<EpicAddFormProps> = ({
  projectForEpic,
  epicToAdd,
  projects,
  epics,
  teamSelectedEpics,
  onProjectForEpicChange,
  onEpicToAddChange,
  onAddEpic,
}) => {
  const selectableProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');
  const availableEpicsToAdd = projectForEpic 
    ? epics.filter(epic => epic.projectId === projectForEpic && !teamSelectedEpics.includes(epic.id))
    : [];

  return (
    <div className="mb-6 p-4 border rounded-lg bg-gray-50">
      <h4 className="font-medium mb-3">Add Epic to Allocation Grid</h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <Label className="text-sm">Project</Label>
          <Select value={projectForEpic} onValueChange={onProjectForEpicChange}>
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
        <div>
          <Label className="text-sm">Epic</Label>
          <Select 
            value={epicToAdd} 
            onValueChange={onEpicToAddChange}
            disabled={!projectForEpic}
          >
            <SelectTrigger>
              <SelectValue placeholder={projectForEpic ? "Select epic" : "Select project first"} />
            </SelectTrigger>
            <SelectContent>
              {availableEpicsToAdd.map(epic => (
                <SelectItem key={epic.id} value={epic.id}>
                  {epic.name} ({epic.estimatedEffort} pts)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Button 
            onClick={onAddEpic}
            disabled={!epicToAdd}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Epic
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EpicAddForm;
