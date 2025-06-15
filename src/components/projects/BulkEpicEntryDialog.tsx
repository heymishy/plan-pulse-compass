
import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save } from 'lucide-react';

interface BulkEpicEntry {
  id: string;
  name: string;
  description: string;
  estimatedEffort: string;
  assignedTeamId: string;
  targetEndDate: string;
}

interface BulkEpicEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

const BulkEpicEntryDialog: React.FC<BulkEpicEntryDialogProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const { epics, setEpics, teams } = useApp();
  const { toast } = useToast();
  const [bulkEpics, setBulkEpics] = useState<BulkEpicEntry[]>([
    {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      estimatedEffort: '',
      assignedTeamId: '',
      targetEndDate: '',
    },
  ]);

  const addNewRow = () => {
    setBulkEpics(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        estimatedEffort: '',
        assignedTeamId: '',
        targetEndDate: '',
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (bulkEpics.length > 1) {
      setBulkEpics(prev => prev.filter(epic => epic.id !== id));
    }
  };

  const updateEpic = (id: string, field: keyof BulkEpicEntry, value: string) => {
    setBulkEpics(prev =>
      prev.map(epic =>
        epic.id === id ? { ...epic, [field]: value } : epic
      )
    );
  };

  const handleSave = () => {
    const validEpics = bulkEpics.filter(epic => 
      epic.name.trim() && 
      epic.estimatedEffort && 
      parseFloat(epic.estimatedEffort) > 0
    );

    if (validEpics.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one epic with a name and estimated effort",
        variant: "destructive",
      });
      return;
    }

    const newEpics: Epic[] = validEpics.map(epic => ({
      id: crypto.randomUUID(),
      projectId,
      name: epic.name.trim(),
      description: epic.description.trim() || undefined,
      estimatedEffort: parseFloat(epic.estimatedEffort),
      status: 'not-started' as const,
      assignedTeamId: epic.assignedTeamId === 'none' ? undefined : epic.assignedTeamId || undefined,
      targetEndDate: epic.targetEndDate || undefined,
    }));

    setEpics(prev => [...prev, ...newEpics]);

    toast({
      title: "Success",
      description: `Successfully created ${newEpics.length} epic${newEpics.length !== 1 ? 's' : ''}`,
    });

    // Reset form
    setBulkEpics([
      {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        estimatedEffort: '',
        assignedTeamId: '',
        targetEndDate: '',
      },
    ]);

    onClose();
  };

  const handleClose = () => {
    // Reset form when closing
    setBulkEpics([
      {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        estimatedEffort: '',
        assignedTeamId: '',
        targetEndDate: '',
      },
    ]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Bulk Add Epics to {projectName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Add multiple epics quickly. Fill in the required fields (name and estimated effort) for each epic.
            </p>
            <Button onClick={addNewRow} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-64">Epic Name *</TableHead>
                  <TableHead className="w-80">Description</TableHead>
                  <TableHead className="w-32">Story Points *</TableHead>
                  <TableHead className="w-48">Assigned Team</TableHead>
                  <TableHead className="w-40">Target End Date</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulkEpics.map((epic, index) => (
                  <TableRow key={epic.id}>
                    <TableCell>
                      <Input
                        value={epic.name}
                        onChange={(e) => updateEpic(epic.id, 'name', e.target.value)}
                        placeholder="Epic name"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={epic.description}
                        onChange={(e) => updateEpic(epic.id, 'description', e.target.value)}
                        placeholder="Epic description"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={epic.estimatedEffort}
                        onChange={(e) => updateEpic(epic.id, 'estimatedEffort', e.target.value)}
                        placeholder="Points"
                        min="0"
                        step="0.5"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={epic.assignedTeamId}
                        onValueChange={(value) => updateEpic(epic.id, 'assignedTeamId', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No team assigned</SelectItem>
                          {teams.map(team => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={epic.targetEndDate}
                        onChange={(e) => updateEpic(epic.id, 'targetEndDate', e.target.value)}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(epic.id)}
                        disabled={bulkEpics.length === 1}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Fields marked with * are required</p>
            <p>• Empty rows (without name and estimated effort) will be ignored</p>
            <p>• All epics will be created with "Not Started" status</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Create Epics
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEpicEntryDialog;
