
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
import { GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProjectRankingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SortableProjectRowProps {
  project: Project;
  index: number;
  onRankingChange: (projectId: string, newRanking: string) => void;
}

const SortableProjectRow: React.FC<SortableProjectRowProps> = ({ 
  project, 
  index, 
  onRankingChange 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
    <TableRow 
      ref={setNodeRef} 
      style={style} 
      className={isDragging ? 'opacity-50' : ''}
    >
      <TableCell>
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="1"
          max="1000"
          value={project.ranking || index + 1}
          onChange={(e) => onRankingChange(project.id, e.target.value)}
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
  );
};

const ProjectRankingDialog: React.FC<ProjectRankingDialogProps> = ({ isOpen, onClose }) => {
  const { projects, setProjects } = useApp();
  const { toast } = useToast();
  const [rankedProjects, setRankedProjects] = useState<Project[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setRankedProjects((projects) => {
        const oldIndex = projects.findIndex((project) => project.id === active.id);
        const newIndex = projects.findIndex((project) => project.id === over?.id);

        const newProjects = arrayMove(projects, oldIndex, newIndex);
        
        // Update rankings based on new positions
        return newProjects.map((project, index) => ({
          ...project,
          ranking: index + 1
        }));
      });
    }
  };

  const handleRankingChange = (projectId: string, newRanking: string) => {
    const ranking = newRanking ? parseInt(newRanking) : undefined;
    setRankedProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, ranking } : p
    ));
  };

  const handleSave = () => {
    setProjects(rankedProjects);
    toast({
      title: "Success",
      description: "Project rankings updated successfully",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Rankings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Drag projects to reorder them by priority, or manually set rankings from 1-1000. Higher numbers = lower priority.
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Drag</TableHead>
                  <TableHead className="w-24">Ranking</TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Budget</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext 
                  items={rankedProjects.map(p => p.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  {rankedProjects.map((project, index) => (
                    <SortableProjectRow
                      key={project.id}
                      project={project}
                      index={index}
                      onRankingChange={handleRankingChange}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
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
