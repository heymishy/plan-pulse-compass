import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Epic } from '@/types';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { GripVertical, Target, Trophy } from 'lucide-react';
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
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface EpicRankingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SortableEpicRowProps {
  epic: Epic & { projectName?: string; teamName?: string };
  index: number;
  onRankingChange: (epicId: string, newRanking: string) => void;
}

const SortableEpicRow: React.FC<SortableEpicRowProps> = ({
  epic,
  index,
  onRankingChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: epic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusBadgeVariant = (status: Epic['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in-progress':
        return 'secondary';
      default:
        return 'outline';
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
          value={epic.mvpPriority || epic.releasePriority || index + 1}
          onChange={e => onRankingChange(epic.id, e.target.value)}
          placeholder="Rank"
          className="w-20"
        />
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{epic.name}</div>
          {epic.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {epic.description}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">
            {epic.projectName || 'Unknown Project'}
          </div>
          {epic.teamName && (
            <div className="text-sm text-gray-500">{epic.teamName}</div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(epic.status)}>
          {epic.status ? epic.status.replace('-', ' ') : 'Unknown'}
        </Badge>
      </TableCell>
      <TableCell>{epic.estimatedEffort || 'Not set'}</TableCell>
      <TableCell>{epic.targetEndDate || 'Not set'}</TableCell>
    </TableRow>
  );
};

const EpicRankingDialog: React.FC<EpicRankingDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { epics, setEpics, projects, teams } = useApp();
  const { toast } = useToast();
  const [mvpEpics, setMvpEpics] = useState<
    (Epic & { projectName?: string; teamName?: string })[]
  >([]);
  const [releaseEpics, setReleaseEpics] = useState<
    (Epic & { projectName?: string; teamName?: string })[]
  >([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isOpen) {
      // Enrich epics with project and team data
      const enrichedEpics = epics.map(epic => {
        const project = projects.find(p => p.id === epic.projectId);
        const team = epic.assignedTeamId
          ? teams.find(t => t.id === epic.assignedTeamId)
          : null;
        return {
          ...epic,
          projectName: project?.name,
          teamName: team?.name,
        };
      });

      // Sort for MVP priority
      const mvpSorted = [...enrichedEpics].sort((a, b) => {
        if (a.mvpPriority && b.mvpPriority)
          return a.mvpPriority - b.mvpPriority;
        if (a.mvpPriority && !b.mvpPriority) return -1;
        if (!a.mvpPriority && b.mvpPriority) return 1;
        return a.name.localeCompare(b.name);
      });

      // Sort for Release priority
      const releaseSorted = [...enrichedEpics].sort((a, b) => {
        if (a.releasePriority && b.releasePriority)
          return a.releasePriority - b.releasePriority;
        if (a.releasePriority && !b.releasePriority) return -1;
        if (!a.releasePriority && b.releasePriority) return 1;
        return a.name.localeCompare(b.name);
      });

      setMvpEpics(mvpSorted);
      setReleaseEpics(releaseSorted);
    }
  }, [isOpen, epics, projects, teams]);

  const handleMvpDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setMvpEpics(epics => {
        const oldIndex = epics.findIndex(epic => epic.id === active.id);
        const newIndex = epics.findIndex(epic => epic.id === over?.id);

        const newEpics = arrayMove(epics, oldIndex, newIndex);

        // Update MVP priorities based on new positions
        return newEpics.map((epic, index) => ({
          ...epic,
          mvpPriority: index + 1,
        }));
      });
    }
  };

  const handleReleaseDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setReleaseEpics(epics => {
        const oldIndex = epics.findIndex(epic => epic.id === active.id);
        const newIndex = epics.findIndex(epic => epic.id === over?.id);

        const newEpics = arrayMove(epics, oldIndex, newIndex);

        // Update release priorities based on new positions
        return newEpics.map((epic, index) => ({
          ...epic,
          releasePriority: index + 1,
        }));
      });
    }
  };

  const handleMvpRankingChange = (epicId: string, newRanking: string) => {
    const ranking = newRanking ? parseInt(newRanking) : undefined;
    setMvpEpics(prev =>
      prev.map(e => (e.id === epicId ? { ...e, mvpPriority: ranking } : e))
    );
  };

  const handleReleaseRankingChange = (epicId: string, newRanking: string) => {
    const ranking = newRanking ? parseInt(newRanking) : undefined;
    setReleaseEpics(prev =>
      prev.map(e => (e.id === epicId ? { ...e, releasePriority: ranking } : e))
    );
  };

  const handleSave = () => {
    // Merge the changes back into the main epics array
    const updatedEpics = epics.map(epic => {
      const mvpEpic = mvpEpics.find(e => e.id === epic.id);
      const releaseEpic = releaseEpics.find(e => e.id === epic.id);

      return {
        ...epic,
        mvpPriority: mvpEpic?.mvpPriority || epic.mvpPriority,
        releasePriority: releaseEpic?.releasePriority || epic.releasePriority,
      };
    });

    setEpics(updatedEpics);
    toast({
      title: 'Success',
      description: 'Epic rankings updated successfully',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Epic Rankings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Drag epics to reorder them by priority, or manually set rankings
            from 1-1000. Higher numbers = lower priority.
          </p>

          <Tabs defaultValue="mvp" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="mvp">
                <Target className="h-4 w-4 mr-2" />
                MVP Priority
              </TabsTrigger>
              <TabsTrigger value="release">
                <Trophy className="h-4 w-4 mr-2" />
                Release Priority
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mvp" className="space-y-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleMvpDragEnd}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Drag</TableHead>
                      <TableHead className="w-24">MVP Rank</TableHead>
                      <TableHead>Epic Name</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Effort</TableHead>
                      <TableHead>Target Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext
                      items={mvpEpics.map(e => e.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {mvpEpics.map((epic, index) => (
                        <SortableEpicRow
                          key={epic.id}
                          epic={epic}
                          index={index}
                          onRankingChange={handleMvpRankingChange}
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
              </DndContext>
            </TabsContent>

            <TabsContent value="release" className="space-y-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleReleaseDragEnd}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Drag</TableHead>
                      <TableHead className="w-24">Release Rank</TableHead>
                      <TableHead>Epic Name</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Effort</TableHead>
                      <TableHead>Target Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext
                      items={releaseEpics.map(e => e.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {releaseEpics.map((epic, index) => (
                        <SortableEpicRow
                          key={epic.id}
                          epic={epic}
                          index={index}
                          onRankingChange={handleReleaseRankingChange}
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
              </DndContext>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Rankings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EpicRankingDialog;
