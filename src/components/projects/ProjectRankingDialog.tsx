
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

interface ProjectRankingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProjectRankingDialog: React.FC<ProjectRankingDialogProps> = ({ isOpen, onClose }) => {
  const { projects, setProjects } = useApp();
  const { toast } = useToast();
  const [rankedProjects, setRankedProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Sort projects by ranking, then by name for unranked
      const sorted = [...projects].sort((a, b) => {
        if (a.ranking && b.ranking) return a.ranking - b.ranking;
        if (a.ranking && !b.ranking) return -1;
        if (!a.ranking && b.ranking) return 1;
        return a.name.localeCompare(b.name);
      });
      setRankedProjects(sorted);
    }
  }, [isOpen, projects]);

  const handleRankingChange = (projectId: string, newRanking: string) => {
    const ranking = newRanking ? parseInt(newRanking) : undefined;
    setRankedProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, ranking } : p
    ));
  };

  const moveProject = (projectId: string, direction: 'up' | 'down') => {
    const currentIndex = rankedProjects.findIndex(p => p.id === projectId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= rankedProjects.length) return;

    const newProjects = [...rankedProjects];
    [newProjects[currentIndex], newProjects[newIndex]] = [newProjects[newIndex], newProjects[currentIndex]];
    
    // Update rankings based on new positions
    newProjects.forEach((project, index) => {
      project.ranking = index + 1;
    });

    setRankedProjects(newProjects);
  };

  const handleSave = () => {
    setProjects(rankedProjects);
    toast({
      title: "Success",
      description: "Project rankings updated successfully",
    });
    onClose();
  };

  const getStatusBadgeVariant = (status: Project['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'active': return 'secondary';
      case 'planning': return 'outline';
      default: return 'destructive';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Rankings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Rank projects from 1-1000 based on priority. Higher numbers = lower priority.
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Move</TableHead>
                <TableHead className="w-24">Ranking</TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankedProjects.map((project, index) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveProject(project.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveProject(project.id, 'down')}
                        disabled={index === rankedProjects.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      value={project.ranking || ''}
                      onChange={(e) => handleRankingChange(project.id, e.target.value)}
                      placeholder="Rank"
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{project.name}</div>
                      {project.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {project.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(project.status)}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{project.startDate}</TableCell>
                  <TableCell>
                    {project.budget ? `$${project.budget.toLocaleString()}` : 'Not set'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Rankings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectRankingDialog;
