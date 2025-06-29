
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Trash2 } from 'lucide-react';
import { RunWorkCategory } from '@/types';

const TeamsSettings = () => {
  const { runWorkCategories, setRunWorkCategories } = useApp();
  const { toast } = useToast();
  
  const [localRunWorkCategories, setLocalRunWorkCategories] = useState<RunWorkCategory[]>(
    runWorkCategories.length > 0 ? runWorkCategories : [
      { id: 'run-1', name: 'Production Support', description: 'Ongoing production support work', color: '#ef4444' },
      { id: 'run-2', name: 'Certificate Management', description: 'SSL/TLS certificate management', color: '#f97316' },
      { id: 'run-3', name: 'Compliance', description: 'Regulatory compliance work', color: '#eab308' },
      { id: 'run-4', name: 'Technical Debt', description: 'Technical debt reduction', color: '#22c55e' },
    ]
  );

  const addRunWorkCategory = () => {
    const newCategory: RunWorkCategory = {
      id: `run-${Date.now()}`,
      name: '',
      description: '',
      color: '#6b7280',
    };
    setLocalRunWorkCategories([...localRunWorkCategories, newCategory]);
  };

  const updateRunWorkCategory = (id: string, field: keyof RunWorkCategory, value: string) => {
    setLocalRunWorkCategories(categories => 
      categories.map(category => 
        category.id === id ? { ...category, [field]: value } : category
      )
    );
  };

  const removeRunWorkCategory = (id: string) => {
    setLocalRunWorkCategories(categories => 
      categories.filter(category => category.id !== id)
    );
  };

  const handleSave = () => {
    setRunWorkCategories(localRunWorkCategories);
    toast({
      title: "Settings Saved",
      description: "Your team settings have been updated successfully.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Teams & Organization Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium">Run Work Categories</Label>
          <p className="text-sm text-gray-600 mb-4">
            Define categories for ongoing operational work that teams perform outside of project epics.
          </p>
          
          <div className="space-y-3">
            {localRunWorkCategories.map((category) => (
              <div key={category.id} className="grid grid-cols-12 gap-3 items-center p-3 border rounded-lg">
                <div className="col-span-3">
                  <Input
                    placeholder="Category name"
                    value={category.name}
                    onChange={(e) => updateRunWorkCategory(category.id, 'name', e.target.value)}
                  />
                </div>
                <div className="col-span-5">
                  <Input
                    placeholder="Description"
                    value={category.description}
                    onChange={(e) => updateRunWorkCategory(category.id, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-3">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="color"
                      value={category.color}
                      onChange={(e) => updateRunWorkCategory(category.id, 'color', e.target.value)}
                      className="w-12 h-8 p-1 border rounded"
                    />
                    <Input
                      placeholder="#000000"
                      value={category.color}
                      onChange={(e) => updateRunWorkCategory(category.id, 'color', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="col-span-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeRunWorkCategory(category.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            onClick={addRunWorkCategory}
            className="mt-3 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Run Work Category
          </Button>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave}>
            Save Team Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamsSettings;
