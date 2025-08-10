import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Target,
  Calendar,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { Team, Cycle, Project, Allocation } from '@/types';
import { useApp } from '@/context/AppContext';
import {
  getProjectRequiredSkills,
  calculateTeamProjectCompatibility,
} from '@/utils/skillBasedPlanning';

interface QuickAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  cycleId: string;
  team?: Team;
  quarter?: Cycle;
  projects: Project[];
  existingAllocations: Allocation[];
  onCreateAllocation: (projectId: string, percentage: number) => void;
  onCreateRunAllocation: (percentage: number) => void;
}

const QuickAllocationDialog: React.FC<QuickAllocationDialogProps> = ({
  open,
  onOpenChange,
  teamId,
  cycleId,
  team,
  quarter,
  projects,
  existingAllocations,
  onCreateAllocation,
  onCreateRunAllocation,
}) => {
  const {
    solutions,
    skills,
    projectSolutions,
    people,
    personSkills,
    allocations,
  } = useApp();
  const [allocationType, setAllocationType] = useState<'project' | 'run'>(
    'project'
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [percentage, setPercentage] = useState<number>(25);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  // Calculate current capacity usage
  const currentAllocation = existingAllocations.reduce(
    (sum, a) => sum + a.percentage,
    0
  );
  const availableCapacity = Math.max(0, 100 - currentAllocation);
  const wouldOverallocate = currentAllocation + percentage > 100;

  // Calculate average run % for this team across recent quarters
  const calculateAverageRunPercent = () => {
    if (!team) return 0;

    // Get allocations for this team from recent quarters (last 4 quarters)
    const teamAllocations = allocations.filter(a => a.teamId === team.id);
    const runAllocations = teamAllocations.filter(
      a => a.runWorkCategoryId && !a.epicId
    );

    if (runAllocations.length === 0) return 0;

    // Group by quarter and sum percentages
    const quarterTotals = runAllocations.reduce(
      (acc, allocation) => {
        const key = allocation.cycleId;
        acc[key] = (acc[key] || 0) + allocation.percentage;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate average across quarters
    const quarterValues = Object.values(quarterTotals);
    return quarterValues.length > 0
      ? Math.round(
          quarterValues.reduce((sum, val) => sum + val, 0) /
            quarterValues.length
        )
      : 0;
  };

  const averageRunPercent = calculateAverageRunPercent();

  // Get project recommendations based on team skills
  const projectRecommendations = useMemo(() => {
    if (!team) return [];

    return projects
      .map(project => {
        // Get required skills for this project
        const requiredSkills = getProjectRequiredSkills(
          project,
          [], // No direct project skills in our system
          solutions,
          skills,
          projectSolutions
        );

        // Calculate compatibility
        const compatibility = calculateTeamProjectCompatibility(
          team,
          project,
          [],
          solutions,
          skills,
          projectSolutions,
          people,
          personSkills
        );

        return {
          project,
          requiredSkills,
          compatibility,
          isRecommended: compatibility.compatibilityScore > 0.3, // 30% threshold
        };
      })
      .sort(
        (a, b) =>
          b.compatibility.compatibilityScore -
          a.compatibility.compatibilityScore
      );
  }, [
    team,
    projects,
    solutions,
    skills,
    projectSolutions,
    people,
    personSkills,
  ]);

  const selectedProjectData = projectRecommendations.find(
    pr => pr.project.id === selectedProjectId
  );

  const handleSubmit = async () => {
    if (allocationType === 'project' && !selectedProjectId) return;
    if (percentage === 0) return;

    setIsSubmitting(true);
    try {
      if (allocationType === 'run') {
        await onCreateRunAllocation(percentage);
      } else {
        await onCreateAllocation(selectedProjectId, percentage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCompatibilityBadge = (score: number) => {
    if (score > 0.7)
      return <Badge className="bg-green-500">Excellent Match</Badge>;
    if (score > 0.5) return <Badge className="bg-blue-500">Good Match</Badge>;
    if (score > 0.3) return <Badge variant="outline">Fair Match</Badge>;
    return <Badge variant="destructive">Poor Match</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Quick Add Project Allocation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Context Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="font-semibold">Team</Label>
                <div>{team?.name}</div>
                <div className="text-xs text-gray-500">
                  Capacity: {team?.capacity}h/week
                </div>
              </div>
              <div>
                <Label className="font-semibold">Quarter</Label>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {quarter?.name}
                </div>
                <div className="text-xs text-gray-500">
                  {quarter && (
                    <>
                      {new Date(quarter.startDate).toLocaleDateString()} -{' '}
                      {new Date(quarter.endDate).toLocaleDateString()}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Capacity Status */}
          <div className="space-y-2">
            <Label>Current Capacity Usage</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    currentAllocation > 100 ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(currentAllocation, 100)}%` }}
                />
              </div>
              <Badge
                variant={currentAllocation > 100 ? 'destructive' : 'secondary'}
              >
                {currentAllocation}%
              </Badge>
            </div>
            {availableCapacity > 0 && (
              <div className="text-sm text-green-600">
                Available: {availableCapacity}%
              </div>
            )}
            {currentAllocation > 100 && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertTriangle className="w-3 h-3" />
                Team is currently over-allocated
              </div>
            )}
          </div>

          {/* Allocation Type Selection */}
          <div className="space-y-2">
            <Label>Allocation Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={allocationType === 'project' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAllocationType('project')}
                className="flex-1"
              >
                Project Work
              </Button>
              <Button
                type="button"
                variant={allocationType === 'run' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAllocationType('run')}
                className="flex-1"
              >
                Run Work
                {averageRunPercent > 0 && (
                  <span className="ml-1 text-xs opacity-75">
                    (avg: {averageRunPercent}%)
                  </span>
                )}
              </Button>
            </div>
            {allocationType === 'run' && averageRunPercent > 0 && (
              <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                💡 This team typically allocates {averageRunPercent}% to run
                work based on recent quarters
              </div>
            )}
          </div>

          {/* Project Selection */}
          {allocationType === 'project' && (
            <div className="space-y-2">
              <Label>Select Project</Label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between"
                  >
                    {selectedProjectId
                      ? projectRecommendations.find(
                          pr => pr.project.id === selectedProjectId
                        )?.project.name
                      : 'Choose a project to allocate to...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search projects..." />
                    <CommandEmpty>No projects found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {projectRecommendations.map(
                          ({ project, compatibility, isRecommended }) => (
                            <CommandItem
                              key={project.id}
                              value={`${project.name} ${project.priority}`}
                              onSelect={() => {
                                setSelectedProjectId(project.id);
                                setComboboxOpen(false);
                              }}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <Check
                                    className={`h-4 w-4 ${
                                      selectedProjectId === project.id
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    }`}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {project.name}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                      Priority: {project.priority}
                                      {isRecommended && '⭐'}
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-2 text-xs">
                                  {Math.round(
                                    compatibility.compatibilityScore * 100
                                  )}
                                  % match
                                </div>
                              </div>
                            </CommandItem>
                          )
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Project Details & Compatibility */}
          {allocationType === 'project' && selectedProjectData && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {selectedProjectData.project.name}
                </h3>
                {getCompatibilityBadge(
                  selectedProjectData.compatibility.compatibilityScore
                )}
              </div>

              <p className="text-sm text-gray-600">
                {selectedProjectData.project.description}
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs font-semibold">
                    Required Skills
                  </Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedProjectData.requiredSkills.map(skill => (
                      <Badge
                        key={skill.skillId}
                        variant="outline"
                        className="text-xs"
                      >
                        {skill.skillName}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Compatibility</Label>
                  <div className="mt-1">
                    <div className="text-xs">
                      Skills matched:{' '}
                      {selectedProjectData.compatibility.skillsMatched} /{' '}
                      {selectedProjectData.compatibility.skillsRequired}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedProjectData.compatibility.recommendation}
                    </div>
                  </div>
                </div>
              </div>

              {selectedProjectData.compatibility.reasoning.length > 0 && (
                <div>
                  <Label className="text-xs font-semibold">
                    Recommendations
                  </Label>
                  <ul className="text-xs text-gray-600 mt-1 space-y-1">
                    {selectedProjectData.compatibility.reasoning
                      .slice(0, 2)
                      .map((reason, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-blue-500 mt-0.5">•</span>
                          {reason}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Run Work Information */}
          {allocationType === 'run' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Run Work Allocation</h3>
              <p className="text-sm text-gray-600 mb-2">
                This allocation covers ongoing operational work, maintenance,
                and support activities.
              </p>
              {averageRunPercent > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Suggested:</span>{' '}
                  {averageRunPercent}%
                  <span className="text-gray-500 ml-1">
                    (based on team history)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Percentage Input */}
          <div className="space-y-2">
            <Label htmlFor="percentage">Allocation Percentage</Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                {[0, 25, 50, 75, 100].map(value => (
                  <Button
                    key={value}
                    type="button"
                    variant={percentage === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPercentage(value)}
                    className="min-w-[50px]"
                  >
                    {value}%
                  </Button>
                ))}
                {allocationType === 'run' &&
                  averageRunPercent > 0 &&
                  averageRunPercent !== percentage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPercentage(averageRunPercent)}
                      className="min-w-[50px] border-blue-300"
                      title={`Set to team average (${averageRunPercent}%)`}
                    >
                      {averageRunPercent}%
                    </Button>
                  )}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Current allocation:{' '}
              <span className="font-medium">{percentage}%</span>
              {percentage > 0 && (
                <span className="ml-2">
                  ({Math.round((percentage / 100) * (team?.capacity || 40))}
                  h/week)
                </span>
              )}
            </div>
            {wouldOverallocate && (
              <div className="flex items-center gap-1 text-sm text-amber-600">
                <AlertTriangle className="w-3 h-3" />
                This allocation would exceed 100% capacity
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                (allocationType === 'project' && !selectedProjectId) ||
                isSubmitting ||
                percentage === 0
              }
              className={
                wouldOverallocate ? 'bg-amber-500 hover:bg-amber-600' : ''
              }
            >
              {isSubmitting
                ? 'Adding...'
                : wouldOverallocate
                  ? 'Add (Over-allocate)'
                  : `Add ${allocationType === 'run' ? 'Run' : 'Project'} Allocation`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAllocationDialog;
