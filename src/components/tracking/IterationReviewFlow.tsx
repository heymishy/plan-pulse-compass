import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Team, Allocation, Project, Epic, RunWorkCategory, Cycle, ActualAllocation, IterationReview, IterationActualEntry, VarianceReasonType } from '@/types';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import ProgressStepper from './ProgressStepper';
import TeamReviewCard from './TeamReviewCard';
import CompletionStep from './steps/CompletionStep';
import NotesStep from './steps/NotesStep';
import SummaryStep from './steps/SummaryStep';

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

  const [actualEntries, setActualEntries] = useState<Record<string, IterationActualEntry[]>>({});
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

    const entries: Record<string, IterationActualEntry[]> = {};
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
            varianceReason: (item as ActualAllocation).varianceReason as VarianceReasonType | undefined,
          });
        });
      } else {
        entries[team.id].push({ id: crypto.randomUUID(), actualPercentage: 0 });
      }
    });
    setActualEntries(entries);
  }, [cycleId, iterationNumber, teams, iterationReviews, actualAllocations, plannedAllocations]);

  const handleActualEntriesChange = (teamId: string, newEntries: IterationActualEntry[]) => {
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
    const today = new Date().toISOString();

    // 1. Process actual allocations
    const newActualAllocations: ActualAllocation[] = Object.entries(actualEntries).flatMap(([teamId, entries]) => 
      entries
        .filter(entry => entry.actualPercentage > 0)
        .map(entry => ({
          id: crypto.randomUUID(),
          plannedAllocationId: entry.plannedAllocationId,
          teamId,
          cycleId,
          iterationNumber,
          actualPercentage: entry.actualPercentage,
          actualEpicId: entry.actualEpicId,
          actualRunWorkCategoryId: entry.actualRunWorkCategoryId,
          varianceReason: entry.varianceReason,
          enteredDate: today,
        }))
    );
    
    setActualAllocations(prev => [
      ...prev.filter(a => !(a.cycleId === cycleId && a.iterationNumber === iterationNumber)),
      ...newActualAllocations
    ]);

    // 2. Process iteration review
    const existingReview = iterationReviews.find(r => r.cycleId === cycleId && r.iterationNumber === iterationNumber);
    
    const newReview: IterationReview = {
      id: existingReview?.id || crypto.randomUUID(),
      cycleId,
      iterationNumber,
      reviewDate: today,
      status: 'completed',
      completedEpics,
      completedMilestones,
      notes: reviewNotes,
    };

    setIterationReviews(prev => [
      ...prev.filter(r => r.id !== newReview.id),
      newReview,
    ]);

    // 3. Update completed epics
    setEpics(prevEpics => prevEpics.map(epic => 
      completedEpics.includes(epic.id) 
        ? { ...epic, status: 'completed', actualEndDate: today } 
        : epic
    ));

    // 4. Update completed milestones
    setProjects(prevProjects => prevProjects.map(project => ({
      ...project,
      milestones: project.milestones.map(milestone => 
        completedMilestones.includes(milestone.id)
          ? { ...milestone, status: 'completed', actualCompletionDate: today }
          : milestone
      )
    })));

    // 5. Finalize
    toast({
      title: "Iteration Review Saved",
      description: "The review has been successfully submitted.",
      variant: "default",
    });

    setCompletedSteps(prev => new Set(prev).add('summary'));
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
          <CompletionStep
            completedEpics={completedEpics}
            setCompletedEpics={setCompletedEpics}
            completedMilestones={completedMilestones}
            setCompletedMilestones={setCompletedMilestones}
            epics={epics}
            projects={projects}
            getEpicName={getEpicName}
          />
        )}

        {currentStepId === 'notes' && (
          <NotesStep
            reviewNotes={reviewNotes}
            setReviewNotes={setReviewNotes}
          />
        )}

        {currentStepId === 'summary' && (
            <SummaryStep
                teams={teams}
                actualEntries={actualEntries}
                completedEpics={completedEpics}
                completedMilestones={completedMilestones}
                reviewNotes={reviewNotes}
                getEpicName={getEpicName}
                getRunWorkCategoryName={getRunWorkCategoryName}
                projects={projects}
            />
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
