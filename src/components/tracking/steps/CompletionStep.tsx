
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Epic, Project } from '@/types';

interface CompletionStepProps {
  completedEpics: string[];
  setCompletedEpics: React.Dispatch<React.SetStateAction<string[]>>;
  completedMilestones: string[];
  setCompletedMilestones: React.Dispatch<React.SetStateAction<string[]>>;
  epics: Epic[];
  projects: Project[];
  getEpicName: (epicId: string) => string;
}

const CompletionStep: React.FC<CompletionStepProps> = ({
  completedEpics,
  setCompletedEpics,
  completedMilestones,
  setCompletedMilestones,
  epics,
  projects,
  getEpicName,
}) => {
  return (
    <Card className="animate-fade-in">
      <CardHeader><CardTitle>Epic & Milestone Completion</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Epics Completed This Iteration</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {epics.map(epic => (
                <div key={epic.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`epic-${epic.id}`} 
                    checked={completedEpics.includes(epic.id)} 
                    onCheckedChange={(checked) => setCompletedEpics(p => checked ? [...p, epic.id] : p.filter(id => id !== epic.id))} 
                  />
                  <label htmlFor={`epic-${epic.id}`} className="text-sm">{getEpicName(epic.id)}</label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-3">Milestones Completed This Iteration</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {projects.flatMap(p => p.milestones).map(milestone => (
                <div key={milestone.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`milestone-${milestone.id}`} 
                    checked={completedMilestones.includes(milestone.id)} 
                    onCheckedChange={(checked) => setCompletedMilestones(p => checked ? [...p, milestone.id] : p.filter(id => id !== milestone.id))} 
                  />
                  <label htmlFor={`milestone-${milestone.id}`} className="text-sm">{projects.find(p=>p.id === milestone.projectId)?.name} - {milestone.name}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompletionStep;
