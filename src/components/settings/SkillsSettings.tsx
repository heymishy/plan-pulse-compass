
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit2, Trash2, Plus, Search } from 'lucide-react';
import { Skill, SkillCategory } from '@/types';
import { useToast } from '@/hooks/use-toast';

const skillCategories: { value: SkillCategory; label: string; color: string }[] = [
  { value: 'programming-language', label: 'Programming Language', color: 'bg-blue-100 text-blue-800' },
  { value: 'framework', label: 'Framework', color: 'bg-green-100 text-green-800' },
  { value: 'platform', label: 'Platform', color: 'bg-purple-100 text-purple-800' },
  { value: 'domain-knowledge', label: 'Domain Knowledge', color: 'bg-orange-100 text-orange-800' },
  { value: 'methodology', label: 'Methodology', color: 'bg-pink-100 text-pink-800' },
  { value: 'tool', label: 'Tool', color: 'bg-gray-100 text-gray-800' },
  { value: 'other', label: 'Other', color: 'bg-yellow-100 text-yellow-800' },
];

const SkillsSettings: React.FC = () => {
  const { skills, setSkills, personSkills, setPersonSkills } = useApp();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [deleteSkillId, setDeleteSkillId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'other' as SkillCategory,
    description: '',
  });

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryConfig = (category: SkillCategory) => {
    return skillCategories.find(cat => cat.value === category) || skillCategories[6];
  };

  const getSkillUsageCount = (skillId: string) => {
    return personSkills.filter(ps => ps.skillId === skillId).length;
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      category: skill.category,
      description: skill.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingSkill(null);
    setFormData({
      name: '',
      category: 'other',
      description: '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Skill name is required",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate names (case insensitive)
    const existingSkill = skills.find(s => 
      s.name.toLowerCase() === formData.name.toLowerCase() && 
      s.id !== editingSkill?.id
    );

    if (existingSkill) {
      toast({
        title: "Error",
        description: "A skill with this name already exists",
        variant: "destructive",
      });
      return;
    }

    if (editingSkill) {
      // Update existing skill
      setSkills(prev => prev.map(skill =>
        skill.id === editingSkill.id
          ? {
              ...skill,
              name: formData.name.trim(),
              category: formData.category,
              description: formData.description.trim() || undefined,
            }
          : skill
      ));

      toast({
        title: "Success",
        description: "Skill updated successfully",
      });
    } else {
      // Create new skill
      const newSkill: Skill = {
        id: crypto.randomUUID(),
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim() || undefined,
        createdDate: new Date().toISOString(),
      };

      setSkills(prev => [...prev, newSkill]);

      toast({
        title: "Success",
        description: "Skill created successfully",
      });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (skillId: string) => {
    const usageCount = getSkillUsageCount(skillId);
    
    if (usageCount > 0) {
      toast({
        title: "Cannot Delete",
        description: `This skill is used by ${usageCount} person${usageCount !== 1 ? 's' : ''}. Remove it from all people first.`,
        variant: "destructive",
      });
      return;
    }

    // Remove skill
    setSkills(prev => prev.filter(skill => skill.id !== skillId));
    
    toast({
      title: "Success",
      description: "Skill deleted successfully",
    });
    
    setDeleteSkillId(null);
  };

  const categoryStats = skillCategories.map(category => ({
    ...category,
    count: skills.filter(skill => skill.category === category.value).length,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Skills Management</CardTitle>
          <p className="text-sm text-gray-600">
            Manage the global skills repository used across your organization
          </p>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{skills.length}</div>
              <div className="text-sm text-blue-600">Total Skills</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {new Set(personSkills.map(ps => ps.skillId)).size}
              </div>
              <div className="text-sm text-green-600">Skills in Use</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {skillCategories.length}
              </div>
              <div className="text-sm text-purple-600">Categories</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{personSkills.length}</div>
              <div className="text-sm text-orange-600">Total Assignments</div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={(value: SkillCategory | 'all') => setSelectedCategory(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {skillCategories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Skill
            </Button>
          </div>

          {/* Skills Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSkills.map(skill => {
                  const categoryConfig = getCategoryConfig(skill.category);
                  const usageCount = getSkillUsageCount(skill.id);

                  return (
                    <TableRow key={skill.id}>
                      <TableCell className="font-medium">{skill.name}</TableCell>
                      <TableCell>
                        <Badge className={categoryConfig.color}>
                          {categoryConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {skill.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {usageCount} {usageCount === 1 ? 'person' : 'people'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(skill.createdDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(skill)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteSkillId(skill.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredSkills.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No skills found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Skill Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSkill ? 'Edit Skill' : 'Add New Skill'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., React, Python, Design Thinking"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: SkillCategory) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {skillCategories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description or notes about this skill"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingSkill ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSkillId} onOpenChange={() => setDeleteSkillId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Skill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this skill? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSkillId && handleDelete(deleteSkillId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SkillsSettings;
