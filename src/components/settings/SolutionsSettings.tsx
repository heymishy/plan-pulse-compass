import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Solution, SolutionCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Settings, BarChart3, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const SolutionsSettings = () => {
  const { solutions, setSolutions, skills, projects, projectSolutions } =
    useApp();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(
    null
  );
  const [skillSearchTerm, setSkillSearchTerm] = useState('');
  const [skillCategoryFilter, setSkillCategoryFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'platform' as SolutionCategory,
    skillIds: [] as string[],
  });

  const handleCreateSolution = () => {
    setSelectedSolution(null);
    setSkillSearchTerm('');
    setSkillCategoryFilter('all');
    setFormData({
      name: '',
      description: '',
      category: 'platform',
      skillIds: [],
    });
    setIsDialogOpen(true);
  };

  const handleEditSolution = (solution: Solution) => {
    setSelectedSolution(solution);
    setSkillSearchTerm('');
    setSkillCategoryFilter('all');
    setFormData({
      name: solution.name,
      description: solution.description || '',
      category: solution.category,
      skillIds: solution.skillIds,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteSolution = (solutionId: string) => {
    setSolutions(prev => prev.filter(s => s.id !== solutionId));
    toast({
      title: 'Solution Deleted',
      description: 'Solution has been removed successfully.',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Solution name is required',
        variant: 'destructive',
      });
      return;
    }

    const solutionData: Solution = {
      id: selectedSolution?.id || `solution-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      category: formData.category,
      skillIds: formData.skillIds,
      createdDate: selectedSolution?.createdDate || new Date().toISOString(),
    };

    if (selectedSolution) {
      setSolutions(prev =>
        prev.map(s => (s.id === selectedSolution.id ? solutionData : s))
      );
      toast({
        title: 'Success',
        description: 'Solution updated successfully',
      });
    } else {
      setSolutions(prev => [...prev, solutionData]);
      toast({
        title: 'Success',
        description: 'Solution created successfully',
      });
    }

    setIsDialogOpen(false);
  };

  const handleSkillToggle = (skillId: string) => {
    setFormData(prev => ({
      ...prev,
      skillIds: prev.skillIds.includes(skillId)
        ? prev.skillIds.filter(id => id !== skillId)
        : [...prev.skillIds, skillId],
    }));
  };

  const getSolutionUsage = (solutionId: string) => {
    return projectSolutions.filter(ps => ps.solutionId === solutionId).length;
  };

  const getCategoryBadgeVariant = (category: SolutionCategory) => {
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

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name
      .toLowerCase()
      .includes(skillSearchTerm.toLowerCase());
    const matchesCategory =
      skillCategoryFilter === 'all' || skill.category === skillCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const solutionsByCategory = solutions.reduce(
    (acc, solution) => {
      if (!acc[solution.category]) {
        acc[solution.category] = [];
      }
      acc[solution.category].push(solution);
      return acc;
    },
    {} as Record<SolutionCategory, Solution[]>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Solutions Management</h2>
          <p className="text-gray-600">
            Manage technology solutions and their associated skills
          </p>
        </div>
        <Button onClick={handleCreateSolution}>
          <Plus className="h-4 w-4 mr-2" />
          Add Solution
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="by-category">By Category</TabsTrigger>
          <TabsTrigger value="usage">Usage Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Solution</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solutions.map(solution => (
                    <TableRow key={solution.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{solution.name}</div>
                          {solution.description && (
                            <div className="text-sm text-gray-500">
                              {solution.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getCategoryBadgeVariant(solution.category)}
                        >
                          {solution.category.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {solution.skillIds.slice(0, 3).map(skillId => {
                            const skill = skills.find(s => s.id === skillId);
                            return skill ? (
                              <Badge
                                key={skill.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {skill.name}
                              </Badge>
                            ) : null;
                          })}
                          {solution.skillIds.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{solution.skillIds.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getSolutionUsage(solution.id)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSolution(solution)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSolution(solution.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-category" className="space-y-4">
          {Object.entries(solutionsByCategory).map(
            ([category, categorySolutions]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{category.replace('-', ' ').toUpperCase()}</span>
                    <Badge variant="outline">{categorySolutions.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categorySolutions.map(solution => (
                      <div key={solution.id} className="p-3 border rounded-lg">
                        <div className="font-medium">{solution.name}</div>
                        {solution.description && (
                          <div className="text-sm text-gray-500 mt-1">
                            {solution.description}
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-400">
                          {solution.skillIds.length} skills •{' '}
                          {getSolutionUsage(solution.id)} projects
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Solution Usage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {solutions.map(solution => {
                  const usage = getSolutionUsage(solution.id);
                  return (
                    <div
                      key={solution.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{solution.name}</div>
                        <div className="text-sm text-gray-500">
                          {solution.category}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{usage}</div>
                        <div className="text-sm text-gray-500">projects</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSolution ? 'Edit Solution' : 'Create New Solution'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Solution Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Microsoft D365, React Native"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: SolutionCategory) =>
                    setFormData(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="platform">Platform</SelectItem>
                    <SelectItem value="framework-stack">
                      Framework Stack
                    </SelectItem>
                    <SelectItem value="methodology">Methodology</SelectItem>
                    <SelectItem value="architecture-pattern">
                      Architecture Pattern
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe this solution..."
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <Label>Associated Skills</Label>

              {/* Skills Search and Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search skills..."
                    value={skillSearchTerm}
                    onChange={e => setSkillSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={skillCategoryFilter}
                  onValueChange={setSkillCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="programming-language">
                      Programming Language
                    </SelectItem>
                    <SelectItem value="framework">Framework</SelectItem>
                    <SelectItem value="platform">Platform</SelectItem>
                    <SelectItem value="domain-knowledge">
                      Domain Knowledge
                    </SelectItem>
                    <SelectItem value="methodology">Methodology</SelectItem>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Skills Summary */}
              {formData.skillIds.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 mb-2">
                    Selected Skills ({formData.skillIds.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.skillIds.slice(0, 10).map(skillId => {
                      const skill = skills.find(s => s.id === skillId);
                      return skill ? (
                        <span
                          key={skillId}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                        >
                          {skill.name}
                          <button
                            type="button"
                            onClick={() => handleSkillToggle(skillId)}
                            className="ml-1 hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                    {formData.skillIds.length > 10 && (
                      <span className="text-xs text-blue-600">
                        +{formData.skillIds.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Skills Selection Grid */}
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredSkills.map(skill => (
                    <div
                      key={skill.id}
                      className={`flex items-center space-x-2 p-2 rounded border transition-colors ${
                        formData.skillIds.includes(skill.id)
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <Checkbox
                        id={skill.id}
                        checked={formData.skillIds.includes(skill.id)}
                        onCheckedChange={() => handleSkillToggle(skill.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={skill.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {skill.name}
                        </Label>
                        <div className="text-xs text-gray-500 truncate">
                          {skill.category.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredSkills.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <p>No skills found matching your criteria</p>
                      {(skillSearchTerm || skillCategoryFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSkillSearchTerm('');
                            setSkillCategoryFilter('all');
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Select skills that are required or commonly used with this
                solution.
                {filteredSkills.length !== skills.length && (
                  <span className="ml-2">
                    Showing {filteredSkills.length} of {skills.length} skills
                  </span>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedSolution ? 'Update Solution' : 'Create Solution'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SolutionsSettings;
