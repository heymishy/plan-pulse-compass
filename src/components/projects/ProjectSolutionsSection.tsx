
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ProjectSolution } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus, Star } from 'lucide-react';

interface ProjectSolutionsSectionProps {
  projectSolutions: ProjectSolution[];
  onSolutionsChange: (solutions: ProjectSolution[]) => void;
}

const ProjectSolutionsSection: React.FC<ProjectSolutionsSectionProps> = ({
  projectSolutions,
  onSolutionsChange,
}) => {
  const { solutions } = useApp();
  const [showAddSolution, setShowAddSolution] = useState(false);
  const [selectedSolutionId, setSelectedSolutionId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState('');

  // Available solutions (not already added)
  const availableSolutions = solutions.filter(solution => 
    !projectSolutions.some(ps => ps.solutionId === solution.id)
  );

  const handleAddSolution = () => {
    if (!selectedSolutionId) return;

    // If this is set as primary, unset any existing primary
    let updatedSolutions = projectSolutions;
    if (isPrimary) {
      updatedSolutions = projectSolutions.map(ps => ({ ...ps, isPrimary: false }));
    }

    const newSolution: ProjectSolution = {
      id: `ps-${Date.now()}`,
      projectId: '', // Will be set by parent
      solutionId: selectedSolutionId,
      isPrimary,
      notes: notes.trim() || undefined,
    };

    onSolutionsChange([...updatedSolutions, newSolution]);
    setSelectedSolutionId('');
    setIsPrimary(false);
    setNotes('');
    setShowAddSolution(false);
  };

  const handleRemoveSolution = (solutionId: string) => {
    onSolutionsChange(projectSolutions.filter(ps => ps.id !== solutionId));
  };

  const handleTogglePrimary = (solutionId: string) => {
    onSolutionsChange(
      projectSolutions.map(ps => ({
        ...ps,
        isPrimary: ps.id === solutionId ? !ps.isPrimary : false
      }))
    );
  };

  const getSolutionName = (solutionId: string) => {
    return solutions.find(s => s.id === solutionId)?.name || 'Unknown Solution';
  };

  const getSolutionCategory = (solutionId: string) => {
    const solution = solutions.find(s => s.id === solutionId);
    return solution?.category || 'other';
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'platform':
        return 'default';
      case 'framework-stack':
        return 'secondary';
      case 'methodology':
        return 'outline';
      case 'architecture-pattern':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <Label>Project Solutions</Label>
      
      {/* Current solutions */}
      {projectSolutions.length > 0 && (
        <div className="space-y-2">
          {projectSolutions.map((ps) => {
            const solution = solutions.find(s => s.id === ps.solutionId);
            return (
              <div key={ps.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{getSolutionName(ps.solutionId)}</Badge>
                    <Badge variant={getCategoryBadgeVariant(getSolutionCategory(ps.solutionId))}>
                      {getSolutionCategory(ps.solutionId).replace('-', ' ')}
                    </Badge>
                    {ps.isPrimary && (
                      <Badge variant="default" className="bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        Primary
                      </Badge>
                    )}
                  </div>
                  {ps.notes && (
                    <span className="text-xs text-gray-500">- {ps.notes}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePrimary(ps.id)}
                    title={ps.isPrimary ? "Remove primary" : "Set as primary"}
                  >
                    <Star className={`h-4 w-4 ${ps.isPrimary ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSolution(ps.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add solution button */}
      {!showAddSolution && availableSolutions.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddSolution(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Solution
        </Button>
      )}

      {/* Add solution form */}
      {showAddSolution && (
        <div className="p-3 border rounded-lg space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label>Solution</Label>
              <Select value={selectedSolutionId} onValueChange={setSelectedSolutionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a solution" />
                </SelectTrigger>
                <SelectContent>
                  {availableSolutions.map(solution => (
                    <SelectItem key={solution.id} value={solution.id}>
                      {solution.name} ({solution.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrimary"
                checked={isPrimary}
                onCheckedChange={(checked) => setIsPrimary(checked as boolean)}
              />
              <Label htmlFor="isPrimary" className="text-sm">
                Set as primary solution
              </Label>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <input
                id="notes"
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific notes about this solution choice..."
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAddSolution}
              disabled={!selectedSolutionId}
            >
              Add Solution
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddSolution(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {availableSolutions.length === 0 && !showAddSolution && projectSolutions.length === 0 && (
        <p className="text-sm text-gray-500">
          No solutions available. Create solutions in Settings to assign them to projects.
        </p>
      )}

      {projectSolutions.length > 0 && (
        <p className="text-xs text-gray-500">
          {projectSolutions.filter(ps => ps.isPrimary).length > 0 
            ? "One solution is marked as primary. " 
            : "No primary solution selected. "}
          Skills from all solutions will be automatically added to this project.
        </p>
      )}
    </div>
  );
};

export default ProjectSolutionsSection;
