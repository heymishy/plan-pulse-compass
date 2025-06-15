
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { Division } from '@/types';

interface DivisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  division?: Division;
  onSave: (division: Omit<Division, 'id'> & { id?: string }) => void;
}

const DivisionDialog: React.FC<DivisionDialogProps> = ({
  open,
  onOpenChange,
  division,
  onSave
}) => {
  const { people } = useApp();
  const [formData, setFormData] = useState({
    name: division?.name || '',
    description: division?.description || '',
    managerId: division?.managerId || '',
    budget: division?.budget || undefined,
  });

  const managers = people.filter(person => person.isActive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: division?.id,
      managerId: formData.managerId === 'none' ? '' : formData.managerId,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{division ? 'Edit Division' : 'Add Division'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label>Manager</Label>
            <Select value={formData.managerId} onValueChange={(value) => setFormData(prev => ({ ...prev, managerId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No manager assigned</SelectItem>
                {managers.map(person => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="budget">Annual Budget (optional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <Input
                id="budget"
                type="number"
                placeholder="0"
                value={formData.budget || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: Number(e.target.value) || undefined }))}
                className="pl-7"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {division ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DivisionDialog;

