import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { getNextQuarterStartDate } from '@/utils/dateUtils';
import {
  Project,
  Milestone,
  ProjectSolution,
  ProjectSkill,
  ProjectFinancialYearBudget,
} from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectSkillsSection from './ProjectSkillsSection';
import ProjectSolutionsSection from './ProjectSolutionsSection';
import ProjectFinancialYearBudgetEditor from './ProjectFinancialYearBudgetEditor';
import ProjectPriorityEditor from './ProjectPriorityEditor';

interface ProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

const ProjectDialog: React.FC<ProjectDialogProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const {
    projects,
    setProjects,
    projectSolutions,
    setProjectSolutions,
    projectSkills,
    setProjectSkills,
    cycles,
  } = useApp();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as Project['status'],
    startDate: '',
    endDate: '',
    budget: '',
    priority: 2,
    priorityOrder: undefined as number | undefined,
  });
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [financialYearBudgets, setFinancialYearBudgets] = useState<
    ProjectFinancialYearBudget[]
  >([]);
  const [currentProjectSolutions, setCurrentProjectSolutions] = useState<
    ProjectSolution[]
  >([]);
  const [currentProjectSkills, setCurrentProjectSkills] = useState<
    ProjectSkill[]
  >([]);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate || '',
        budget: project.budget?.toString() || '',
        priority: project.priority || 2,
        priorityOrder: project.priorityOrder,
      });
      setMilestones(project.milestones);
      setFinancialYearBudgets(project.financialYearBudgets || []);

      // Load existing project solutions and skills
      setCurrentProjectSolutions(
        projectSolutions.filter(ps => ps.projectId === project.id)
      );
      setCurrentProjectSkills(
        projectSkills.filter(ps => ps.projectId === project.id)
      );
    } else {
      // Get quarterly cycles for default start date calculation
      const quarterCycles = cycles.filter(cycle => cycle.type === 'quarterly');
      const defaultStartDate = getNextQuarterStartDate(quarterCycles);

      setFormData({
        name: '',
        description: '',
        status: 'planning',
        startDate: defaultStartDate,
        endDate: '',
        budget: '',
        priority: 2,
        priorityOrder: 2, // Default priority order to match priority level
      });
      setMilestones([]);
      setFinancialYearBudgets([]);
      setCurrentProjectSolutions([]);
      setCurrentProjectSkills([]);
    }
  }, [project, isOpen, projectSolutions, projectSkills, cycles]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: crypto.randomUUID(),
      projectId: project?.id || '',
      name: '',
      dueDate: '',
      status: 'not-started',
      description: '',
    };
    setMilestones(prev => [...prev, newMilestone]);
  };

  const updateMilestone = (
    index: number,
    field: keyof Milestone,
    value: string
  ) => {
    setMilestones(prev =>
      prev.map((milestone, i) =>
        i === index ? { ...milestone, [field]: value } : milestone
      )
    );
  };

  const removeMilestone = (index: number) => {
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Project name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.startDate) {
      toast({
        title: 'Error',
        description: 'Start date is required',
        variant: 'destructive',
      });
      return;
    }

    const projectId = project?.id || crypto.randomUUID();

    const projectData: Project = {
      id: projectId,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      status: formData.status,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      priority: formData.priority,
      priorityOrder: formData.priorityOrder,
      financialYearBudgets:
        financialYearBudgets.length > 0 ? financialYearBudgets : undefined,
      milestones: milestones.map(m => ({ ...m, projectId })),
    };

    // Update projects
    if (project) {
      setProjects(prev =>
        prev.map(p => (p.id === project.id ? projectData : p))
      );
    } else {
      setProjects(prev => [...prev, projectData]);
    }

    // Update project solutions
    setProjectSolutions(prev => [
      ...prev.filter(ps => ps.projectId !== projectId),
      ...currentProjectSolutions.map(ps => ({ ...ps, projectId })),
    ]);

    // Update project skills
    setProjectSkills(prev => [
      ...prev.filter(ps => ps.projectId !== projectId),
      ...currentProjectSkills.map(ps => ({ ...ps, projectId })),
    ]);

    toast({
      title: 'Success',
      description: project
        ? 'Project updated successfully'
        : 'Project created successfully',
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {project ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
              <TabsTrigger value="priority">Priority</TabsTrigger>
              <TabsTrigger value="solutions">Solutions</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder="Enter project name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={value => handleInputChange('status', value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e =>
                    handleInputChange('description', e.target.value)
                  }
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={e =>
                      handleInputChange('startDate', e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={e => handleInputChange('endDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      id="budget"
                      type="number"
                      value={formData.budget}
                      onChange={e =>
                        handleInputChange('budget', e.target.value)
                      }
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="budget" className="space-y-4">
              <ProjectFinancialYearBudgetEditor
                budgets={financialYearBudgets}
                legacyBudget={
                  formData.budget ? parseFloat(formData.budget) : undefined
                }
                onBudgetsChange={setFinancialYearBudgets}
              />
            </TabsContent>

            <TabsContent value="priority" className="space-y-4">
              <ProjectPriorityEditor
                priority={formData.priority}
                priorityOrder={formData.priorityOrder}
                onPriorityChange={priority =>
                  setFormData(prev => ({
                    ...prev,
                    priority,
                    // Auto-set priority order to match priority level if not explicitly set by user
                    priorityOrder:
                      prev.priorityOrder === prev.priority
                        ? priority
                        : prev.priorityOrder,
                  }))
                }
                onPriorityOrderChange={priorityOrder =>
                  setFormData(prev => ({ ...prev, priorityOrder }))
                }
              />
            </TabsContent>

            <TabsContent value="solutions" className="space-y-4">
              <ProjectSolutionsSection
                projectSolutions={currentProjectSolutions}
                onSolutionsChange={setCurrentProjectSolutions}
              />
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <ProjectSkillsSection
                projectSolutions={currentProjectSolutions}
                projectSkills={currentProjectSkills}
                onSkillsChange={setCurrentProjectSkills}
              />
            </TabsContent>

            <TabsContent value="milestones" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Milestones</Label>
                <Button type="button" onClick={addMilestone} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Milestone
                </Button>
              </div>

              {milestones.map((milestone, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Milestone {index + 1}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMilestone(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Name</Label>
                      <Input
                        value={milestone.name}
                        onChange={e =>
                          updateMilestone(index, 'name', e.target.value)
                        }
                        placeholder="Milestone name"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={milestone.dueDate}
                        onChange={e =>
                          updateMilestone(index, 'dueDate', e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Textarea
                      value={milestone.description || ''}
                      onChange={e =>
                        updateMilestone(index, 'description', e.target.value)
                      }
                      placeholder="Milestone description"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Status</Label>
                    <Select
                      value={milestone.status}
                      onValueChange={value =>
                        updateMilestone(index, 'status', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not-started">Not Started</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="at-risk">At Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {project ? 'Update Project' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDialog;
