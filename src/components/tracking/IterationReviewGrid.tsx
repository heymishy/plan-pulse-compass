import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Team, Allocation, Project, Epic, RunWorkCategory, Cycle, ActualAllocation, IterationReview, VarianceReasonType } from '@/types';
import { Save, CheckCircle2, AlertTriangle, Users } from 'lucide-react';

interface IterationReviewGridProps {
  cycleId: string;
  iterationNumber: number;
  teams: Team[];
  allocations: Allocation[];
  projects: Project[];
  epics: Epic[];
  runWorkCategories: RunWorkCategory[];
  iterations: Cycle[];
}

interface ActualEntry {
  teamId: string;
  plannedAllocationId?: string;
  actualPercentage: number;
  actualEpicId?: string;
  actualRunWorkCategoryId?: string;
  varianceReason?: VarianceReasonType;
}

const IterationReviewGrid: React.FC<IterationReviewGridProps> = ({
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
    actualAllocations, 
    setActualAllocations, 
    iterationReviews, 
    setIterationReviews 
  } = useApp();
  const { toast } = useToast();

  const [actualEntries, setActualEntries] = useState<Record<string, ActualEntry[]>>({});
  const [completedEpics, setCompletedEpics] = useState<string[]>([]);
  const [completedMilestones, setCompletedMilestones] = useState<string[]>([]);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get planned allocations for this iteration
  const plannedAllocations = allocations.filter(a => 
    a.cycleId === cycleId && a.iterationNumber === iterationNumber
  );

  // Get existing review data
  const existingReview = iterationReviews.find(r => 
    r.cycleId === cycleId && r.iterationNumber === iterationNumber
  );

  // Get existing actual allocations
  const existingActuals = actualAllocations.filter(a => 
    a.cycleId === cycleId && a.iterationNumber === iterationNumber
  );

  // Initialize form data
  useEffect(() => {
    if (existingReview) {
      setCompletedEpics(existingReview.completedEpics);
      setCompletedMilestones(existingReview.completedMilestones);
      setReviewNotes(existingReview.notes || '');
    }

    // Initialize actual entries from existing data or planned allocations
    const entries: Record<string, ActualEntry[]> = {};
    
    teams.forEach(team => {
      const teamPlannedAllocations = plannedAllocations.filter(a => a.teamId === team.id);
      const teamActuals = existingActuals.filter(a => a.teamId === team.id);
      
      entries[team.id] = [];
      
      if (teamActuals.length > 0) {
        // Use existing actuals
        teamActuals.forEach(actual => {
          entries[team.id].push({
            teamId: team.id,
            plannedAllocationId: actual.plannedAllocationId,
            actualPercentage: actual.actualPercentage,
            actualEpicId: actual.actualEpicId,
            actualRunWorkCategoryId: actual.actualRunWorkCategoryId,
            varianceReason: actual.varianceReason as VarianceReasonType,
          });
        });
      } else if (teamPlannedAllocations.length > 0) {
        // Initialize from planned allocations
        teamPlannedAllocations.forEach(planned => {
          entries[team.id].push({
            teamId: team.id,
            plannedAllocationId: planned.id,
            actualPercentage: planned.percentage,
            actualEpicId: planned.epicId,
            actualRunWorkCategoryId: planned.runWorkCategoryId,
          });
        });
      } else {
        // Add empty entry for teams without planned allocations
        entries[team.id].push({
          teamId: team.id,
          actualPercentage: 0,
        });
      }
    });
    
    setActualEntries(entries);
  }, [teams, plannedAllocations, existingActuals, existingReview]);

  const handleActualChange = (teamId: string, entryIndex: number, field: keyof ActualEntry, value: any) => {
    setActualEntries(prev => ({
      ...prev,
      [teamId]: prev[teamId].map((entry, index) => 
        index === entryIndex ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const addActualEntry = (teamId: string) => {
    setActualEntries(prev => ({
      ...prev,
      [teamId]: [
        ...prev[teamId],
        {
          teamId,
          actualPercentage: 0,
        }
      ]
    }));
  };

  const removeActualEntry = (teamId: string, entryIndex: number) => {
    setActualEntries(prev => ({
      ...prev,
      [teamId]: prev[teamId].filter((_, index) => index !== entryIndex)
    }));
  };

  const getEpicName = (epicId: string) => {
    const epic = epics.find(e => e.id === epicId);
    if (!epic) return 'Unknown Epic';
    const project = projects.find(p => p.id === epic.projectId);
    return `${project?.name || 'Unknown'} - ${epic.name}`;
  };

  const getRunWorkCategoryName = (categoryId: string) => {
    const category = runWorkCategories.find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const getPlannedAllocation = (plannedId?: string) => {
    return plannedAllocations.find(a => a.id === plannedId);
  };

  const calculateTeamTotalActual = (teamId: string) => {
    return actualEntries[teamId]?.reduce((sum, entry) => sum + entry.actualPercentage, 0) || 0;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate data
      for (const teamId of Object.keys(actualEntries)) {
        const totalActual = calculateTeamTotalActual(teamId);
        if (totalActual > 100) {
          toast({
            title: "Validation Error",
            description: `Team ${teams.find(t => t.id === teamId)?.name} has allocations totaling ${totalActual}% which exceeds 100%`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Create actual allocations
      const newActualAllocations: ActualAllocation[] = [];
      Object.values(actualEntries).flat().forEach(entry => {
        if (entry.actualPercentage > 0) {
          newActualAllocations.push({
            id: crypto.randomUUID(),
            plannedAllocationId: entry.plannedAllocationId,
            teamId: entry.teamId,
            cycleId,
            iterationNumber,
            actualPercentage: entry.actualPercentage,
            actualEpicId: entry.actualEpicId === 'none' ? undefined : entry.actualEpicId,
            actualRunWorkCategoryId: entry.actualRunWorkCategoryId === 'none' ? undefined : entry.actualRunWorkCategoryId,
            varianceReason: entry.varianceReason === 'none' ? undefined : entry.varianceReason,
            enteredDate: new Date().toISOString(),
          });
        }
      });

      // Remove existing actuals for this iteration and add new ones
      setActualAllocations(prev => [
        ...prev.filter(a => !(a.cycleId === cycleId && a.iterationNumber === iterationNumber)),
        ...newActualAllocations
      ]);

      // Create or update iteration review
      const reviewData: IterationReview = {
        id: existingReview?.id || crypto.randomUUID(),
        cycleId,
        iterationNumber,
        reviewDate: new Date().toISOString(),
        status: 'completed',
        completedEpics,
        completedMilestones,
        notes: reviewNotes,
      };

      setIterationReviews(prev => 
        existingReview 
          ? prev.map(r => r.id === existingReview.id ? reviewData : r)
          : [...prev, reviewData]
      );

      toast({
        title: "Success",
        description: `Iteration ${iterationNumber} review saved successfully`,
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save iteration review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const varianceReasons: { value: VarianceReasonType; label: string }[] = [
    { value: 'none', label: 'No reason' },
    { value: 'production-support', label: 'Production Support' },
    { value: 'scope-change', label: 'Scope Change' },
    { value: 'resource-unavailable', label: 'Resource Unavailable' },
    { value: 'technical-blocker', label: 'Technical Blocker' },
    { value: 'priority-shift', label: 'Priority Shift' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      {/* Team Allocations Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Actual vs Planned Allocations - Iteration {iterationNumber}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {teams.map(team => {
              const teamPlannedAllocations = plannedAllocations.filter(a => a.teamId === team.id);
              const teamActualEntries = actualEntries[team.id] || [];
              const totalActual = calculateTeamTotalActual(team.id);
              const totalPlanned = teamPlannedAllocations.reduce((sum, a) => sum + a.percentage, 0);
              
              return (
                <div key={team.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-gray-500" />
                      <div>
                        <h3 className="font-medium">{team.name}</h3>
                        <p className="text-sm text-gray-500">{team.capacity}h/week capacity</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        Planned: {totalPlanned}%
                      </Badge>
                      <Badge 
                        variant={totalActual === 100 ? "default" : totalActual > 100 ? "destructive" : "secondary"}
                      >
                        Actual: {totalActual}%
                      </Badge>
                    </div>
                  </div>

                  {/* Planned Allocations Display */}
                  {teamPlannedAllocations.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Planned Allocations:</h4>
                      <div className="space-y-1">
                        {teamPlannedAllocations.map(planned => (
                          <div key={planned.id} className="text-sm text-gray-600 flex justify-between">
                            <span>
                              {planned.epicId 
                                ? getEpicName(planned.epicId)
                                : getRunWorkCategoryName(planned.runWorkCategoryId!)}
                            </span>
                            <span>{planned.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actual Allocations Entry */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Actual Allocations:</h4>
                    {teamActualEntries.map((entry, entryIndex) => (
                      <div key={entryIndex} className="grid grid-cols-12 gap-2 items-center p-2 border rounded">
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="%"
                            value={entry.actualPercentage || ''}
                            onChange={(e) => handleActualChange(team.id, entryIndex, 'actualPercentage', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="col-span-3">
                          <Select 
                            value={entry.actualEpicId || 'none'} 
                            onValueChange={(value) => {
                              handleActualChange(team.id, entryIndex, 'actualEpicId', value === 'none' ? undefined : value);
                              if (value !== 'none') {
                                handleActualChange(team.id, entryIndex, 'actualRunWorkCategoryId', undefined);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select epic" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Epic</SelectItem>
                              {epics.map(epic => (
                                <SelectItem key={epic.id} value={epic.id}>
                                  {getEpicName(epic.id)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Select 
                            value={entry.actualRunWorkCategoryId || 'none'} 
                            onValueChange={(value) => {
                              handleActualChange(team.id, entryIndex, 'actualRunWorkCategoryId', value === 'none' ? undefined : value);
                              if (value !== 'none') {
                                handleActualChange(team.id, entryIndex, 'actualEpicId', undefined);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Category</SelectItem>
                              {runWorkCategories.map(category => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Select 
                            value={entry.varianceReason || 'none'} 
                            onValueChange={(value) => handleActualChange(team.id, entryIndex, 'varianceReason', value === 'none' ? undefined : value as VarianceReasonType)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Reason" />
                            </SelectTrigger>
                            <SelectContent>
                              {varianceReasons.map(reason => (
                                <SelectItem key={reason.value} value={reason.value}>
                                  {reason.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeActualEntry(team.id, entryIndex)}
                            disabled={teamActualEntries.length === 1}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addActualEntry(team.id)}
                    >
                      + Add Allocation
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Epic Completion */}
      <Card>
        <CardHeader>
          <CardTitle>Epic & Milestone Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Epics */}
            <div>
              <h3 className="font-medium mb-3">Epics Completed This Iteration</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {epics.map(epic => (
                  <div key={epic.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={completedEpics.includes(epic.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setCompletedEpics(prev => [...prev, epic.id]);
                        } else {
                          setCompletedEpics(prev => prev.filter(id => id !== epic.id));
                        }
                      }}
                    />
                    <label className="text-sm">
                      {getEpicName(epic.id)}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones */}
            <div>
              <h3 className="font-medium mb-3">Milestones Completed This Iteration</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {projects.flatMap(p => p.milestones).map(milestone => (
                  <div key={milestone.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={completedMilestones.includes(milestone.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setCompletedMilestones(prev => [...prev, milestone.id]);
                        } else {
                          setCompletedMilestones(prev => prev.filter(id => id !== milestone.id));
                        }
                      }}
                    />
                    <label className="text-sm">
                      {projects.find(p => p.milestones.some(m => m.id === milestone.id))?.name} - {milestone.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Review Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any notes about this iteration..."
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : 'Save Iteration Review'}
        </Button>
      </div>
    </div>
  );
};

export default IterationReviewGrid;
