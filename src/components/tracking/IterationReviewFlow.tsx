
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Team, Allocation, Project, Epic, RunWorkCategory, Cycle, ActualAllocation, IterationReview } from '@/types';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import ProgressStepper from './ProgressStepper';
import TeamReviewCard, { ActualEntry } from './TeamReviewCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface IterationReviewFlowProps {
  cycleId: string;
  iterationNumber: number;
  teams: Team[];
  allocations: Allocation[];
  projects: Project[];
  epics: Epic[];
  runWorkCategories: RunWorkCategory[];
  iterations: Cycle[];
}

const reviewSteps = [
  { id: 'teams', name: 'Team Review' },
  { id: 'completion', name: 'Epics & Milestones' },
  { id: 'notes', name: 'Review Notes' },
  { id: 'summary', name: 'Save & Complete' },
];

const IterationReviewFlow: React.FC<IterationReviewFlowProps> = ({
  cycleId,
  iterationNumber,
  teams,
  allocations,
  projects,
  epics,
  runWorkCategories,
  iterations,
}) => {
  const { 
    actualAllocations, setActualAllocations, 
    iterationReviews, setIterationReviews,
    setEpics, setProjects,
  } = useApp();
  const { toast } = useToast();

  const [currentStepId, setCurrentStepId] = useState('teams');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);

  const [actualEntries, setActualEntries] = useState<Record<string, ActualEntry[]>>({});
  const [completedEpics, setCompletedEpics] = useState<string[]>([]);
  const [completedMilestones, setCompletedMilestones] = useState<string[]>([]);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const plannedAllocations = useMemo(() => allocations.filter(a => 
    a.cycleId === cycleId && a.iterationNumber === iterationNumber
  ), [allocations, cycleId, iterationNumber]);

  useEffect(() => {
    const existingReview = iterationReviews.find(r => r.cycleId === cycleId && r.iterationNumber === iterationNumber);
    const existingActuals = actualAllocations.filter(a => a.cycleId === cycleId && a.iterationNumber === iterationNumber);

    if (existingReview) {
      setCompletedEpics(existingReview.completedEpics);
      setCompletedMilestones(existingReview.completedMilestones);
      setReviewNotes(existingReview.notes || '');
      if(existingReview.status === 'completed') {
        setCompletedSteps(new Set(['teams', 'completion', 'notes', 'summary']));
      }
    }

    const entries: Record<string, ActualEntry[]> = {};
    teams.forEach(team => {
      const teamPlanned = plannedAllocations.filter(a => a.teamId === team.id);
      const teamActuals = existingActuals.filter(a => a.teamId === team.id);
      
      entries[team.id] = [];
      const usedActuals = teamActuals.length > 0 ? teamActuals : teamPlanned;

      if (usedActuals.length > 0) {
        usedActuals.forEach(item => {
          entries[team.id].push({
            id: crypto.randomUUID(),
            plannedAllocationId: (item as ActualAllocation).plannedAllocationId || (item as Allocation).id,
            actualPercentage: (item as ActualAllocation).actualPercentage || (item as Allocation).percentage,
            actualEpicId: (item as ActualAllocation).actualEpicId || (item as Allocation).epicId,
            actualRunWorkCategoryId: (item as ActualAllocation).actualRunWorkCategoryId || (item as Allocation).runWorkCategoryId,
            varianceReason: (item as ActualAllocation).varianceReason,
          });
        });
      } else {
        entries[team.id].push({ id: crypto.randomUUID(), actualPercentage: 0 });
      }
    });
    setActualEntries(entries);
  }, [cycleId, iterationNumber, teams, iterationReviews, actualAllocations, plannedAllocations]);

  const handleActualEntriesChange = (teamId: string, newEntries: ActualEntry[]) => {
    setActualEntries(prev => ({ ...prev, [teamId]: newEntries }));
  };

  const getEpicName = (epicId: string) => {
    const epic = epics.find(e => e.id === epicId);
    if (!epic) return 'Unknown Epic';
    const project = projects.find(p => p.id === epic.projectId);
    return `${project?.name || 'Unknown'} - ${epic.name}`;
  };

  const getRunWorkCategoryName = (categoryId: string) => {
    return runWorkCategories.find(c => c.id === categoryId)?.name || 'Unknown Category';
  };

  const handleNext = () => {
    if (currentStepId === 'teams') {
      if (currentTeamIndex < teams.length - 1) {
        setCurrentTeamIndex(prev => prev + 1);
      } else {
        setCompletedSteps(prev => new Set(prev).add('teams'));
        setCurrentStepId('completion');
      }
    } else if (currentStepId === 'completion') {
      setCompletedSteps(prev => new Set(prev).add('completion'));
      setCurrentStepId('notes');
    } else if (currentStepId === 'notes') {
      setCompletedSteps(prev => new Set(prev).add('notes'));
      setCurrentStepId('summary');
    }
  };

  const handleBack = () => {
    if (currentStepId === 'teams') {
      if (currentTeamIndex > 0) {
        setCurrentTeamIndex(prev => prev - 1);
      }
    } else if (currentStepId === 'completion') {
      setCurrentStepId('teams');
    } else if (currentStepId === 'notes') {
      setCurrentStepId('completion');
    } else if (currentStepId === 'summary') {
      setCurrentStepId('notes');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // ... same handleSubmit logic from IterationReviewGrid
    setIsSubmitting(false);
  };
  
  const currentTeam = teams[currentTeamIndex];

  return (
    <div className="space-y-6">
      <ProgressStepper steps={reviewSteps} currentStepId={currentStepId} onStepClick={setCurrentStepId} completedSteps={completedSteps} />
      
      <div className="mt-8">
        {currentStepId === 'teams' && currentTeam && (
          <TeamReviewCard
            key={currentTeam.id}
            team={currentTeam}
            plannedAllocations={plannedAllocations.filter(a => a.teamId === currentTeam.id)}
            actualEntries={actualEntries[currentTeam.id] || []}
            onActualEntriesChange={(entries) => handleActualEntriesChange(currentTeam.id, entries)}
            epics={epics}
            projects={projects}
            runWorkCategories={runWorkCategories}
            getEpicName={getEpicName}
            getRunWorkCategoryName={getRunWorkCategoryName}
          />
        )}

        {currentStepId === 'completion' && (
          <Card className="animate-fade-in">
            <CardHeader><CardTitle>Epic & Milestone Completion</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Epics Completed This Iteration</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {epics.map(epic => (
                      <div key={epic.id} className="flex items-center space-x-2"><Checkbox id={`epic-${epic.id}`} checked={completedEpics.includes(epic.id)} onCheckedChange={(checked) => setCompletedEpics(p => checked ? [...p, epic.id] : p.filter(id => id !== epic.id))} /><label htmlFor={`epic-${epic.id}`} className="text-sm">{getEpicName(epic.id)}</label></div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3">Milestones Completed This Iteration</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {projects.flatMap(p => p.milestones).map(milestone => (
                      <div key={milestone.id} className="flex items-center space-x-2"><Checkbox id={`milestone-${milestone.id}`} checked={completedMilestones.includes(milestone.id)} onCheckedChange={(checked) => setCompletedMilestones(p => checked ? [...p, milestone.id] : p.filter(id => id !== milestone.id))} /><label htmlFor={`milestone-${milestone.id}`} className="text-sm">{projects.find(p=>p.id === milestone.projectId)?.name} - {milestone.name}</label></div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStepId === 'notes' && (
          <Card className="animate-fade-in"><CardHeader><CardTitle>Review Notes</CardTitle></CardHeader><CardContent><Textarea placeholder="Add any notes..." value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={8} /></CardContent></Card>
        )}

        {currentStepId === 'summary' && (
            <Card className="animate-fade-in">
                <CardHeader><CardTitle>Summary & Save</CardTitle></CardHeader>
                <CardContent>
                    <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Ready to Save</AlertTitle>
                        <AlertDescription>You've completed all steps. Review the summary and click save to complete the iteration review.</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        )}
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button onClick={handleBack} variant="outline" disabled={currentStepId === 'teams' && currentTeamIndex === 0}>
          <ChevronLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        {currentStepId !== 'summary' ? (
          <Button onClick={handleNext}>
            Next <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
            <Save className="h-4 w-4 mr-2" /> {isSubmitting ? 'Saving...' : 'Save Review'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default IterationReviewFlow;
