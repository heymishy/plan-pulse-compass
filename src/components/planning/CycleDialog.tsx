
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Cycle } from '@/types';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Trash2, Zap } from 'lucide-react';
import { format, addWeeks, addMonths } from 'date-fns';

interface CycleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parentCycle?: Cycle;
}

const CycleDialog: React.FC<CycleDialogProps> = ({ isOpen, onClose, parentCycle }) => {
  const { cycles, setCycles, config } = useApp();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<'quarters' | 'iterations'>('quarters');
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    type: 'quarterly' as Cycle['type'],
    status: 'planning' as Cycle['status'],
  });

  const quarters = cycles.filter(c => c.type === 'quarterly');
  const iterations = cycles.filter(c => c.type === 'iteration');

  const generateStandardQuarters = () => {
    if (!config?.financialYear) {
      toast({
        title: "Error",
        description: "Financial year not configured. Please complete setup first.",
        variant: "destructive",
      });
      return;
    }

    const fyStart = new Date(config.financialYear.startDate);
    const fyYear = fyStart.getFullYear();
    const newQuarters: Cycle[] = [];

    // Generate 4 quarters based on financial year start
    for (let i = 0; i < 4; i++) {
      const quarterStart = new Date(fyStart);
      quarterStart.setMonth(quarterStart.getMonth() + (i * 3));
      
      const quarterEnd = new Date(quarterStart);
      quarterEnd.setMonth(quarterEnd.getMonth() + 3);
      quarterEnd.setDate(quarterEnd.getDate() - 1); // Last day of the quarter

      newQuarters.push({
        id: crypto.randomUUID(),
        type: 'quarterly',
        name: `Q${i + 1} ${fyYear}`,
        startDate: quarterStart.toISOString().split('T')[0],
        endDate: quarterEnd.toISOString().split('T')[0],
        status: i === 0 ? 'active' : 'planning',
      });
    }

    setCycles(prev => [...prev, ...newQuarters]);
    toast({
      title: "Success",
      description: `Generated 4 quarters for FY ${fyYear}`,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateIterations = (quarterCycle: Cycle) => {
    if (!config?.iterationLength) return;

    const startDate = new Date(quarterCycle.startDate);
    const endDate = new Date(quarterCycle.endDate);
    const newIterations: Cycle[] = [];

    let currentStart = startDate;
    let iterationNumber = 1;

    while (currentStart < endDate) {
      let currentEnd: Date;
      
      switch (config.iterationLength) {
        case 'fortnightly':
          currentEnd = addWeeks(currentStart, 2);
          break;
        case 'monthly':
          currentEnd = addMonths(currentStart, 1);
          break;
        case '6-weekly':
          currentEnd = addWeeks(currentStart, 6);
          break;
        default:
          currentEnd = addWeeks(currentStart, 2);
      }

      if (currentEnd > endDate) {
        currentEnd = endDate;
      }

      newIterations.push({
        id: crypto.randomUUID(),
        type: 'iteration',
        name: `${quarterCycle.name} - Iteration ${iterationNumber}`,
        startDate: currentStart.toISOString().split('T')[0],
        endDate: currentEnd.toISOString().split('T')[0],
        parentCycleId: quarterCycle.id,
        status: 'planning',
      });

      currentStart = new Date(currentEnd);
      currentStart.setDate(currentStart.getDate() + 1);
      iterationNumber++;
    }

    setCycles(prev => [...prev, ...newIterations]);
    toast({
      title: "Success",
      description: `Generated ${newIterations.length} iterations for ${quarterCycle.name}`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const cycleData: Cycle = {
      id: crypto.randomUUID(),
      type: formData.type,
      name: formData.name.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      parentCycleId: parentCycle?.id,
      status: formData.status,
    };

    setCycles(prev => [...prev, cycleData]);
    toast({
      title: "Success",
      description: `${formData.type === 'quarterly' ? 'Quarter' : 'Iteration'} created successfully`,
    });

    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      type: 'quarterly',
      status: 'planning',
    });
  };

  const handleDeleteCycle = (cycleId: string) => {
    setCycles(prev => prev.filter(c => c.id !== cycleId));
    toast({
      title: "Success",
      description: "Cycle deleted successfully",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Cycles</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              className={`flex-1 text-sm py-2 px-4 rounded-md transition-colors ${
                selectedTab === 'quarters' 
                  ? 'bg-white shadow-sm font-medium' 
                  : 'hover:bg-gray-200'
              }`}
              onClick={() => setSelectedTab('quarters')}
            >
              Quarters
            </button>
            <button
              className={`flex-1 text-sm py-2 px-4 rounded-md transition-colors ${
                selectedTab === 'iterations' 
                  ? 'bg-white shadow-sm font-medium' 
                  : 'hover:bg-gray-200'
              }`}
              onClick={() => setSelectedTab('iterations')}
            >
              Iterations
            </button>
          </div>

          {selectedTab === 'quarters' && (
            <div className="space-y-4">
              {/* Generate Standard Quarters */}
              {config?.financialYear && quarters.length === 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center text-blue-700">
                      <Zap className="h-5 w-5 mr-2" />
                      Quick Setup
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-blue-600 mb-4">
                      Generate standard quarters based on your financial year ({format(new Date(config.financialYear.startDate), 'MMM yyyy')} - {format(new Date(config.financialYear.endDate), 'MMM yyyy')})
                    </p>
                    <Button onClick={generateStandardQuarters} className="w-full">
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Standard Quarters
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Create Custom Quarter</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Quarter Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g., Q1 2024"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Button type="submit" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Custom Quarter
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Existing Quarters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {quarters.map(quarter => (
                      <div key={quarter.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{quarter.name}</div>
                          <div className="text-sm text-gray-600">
                            {format(new Date(quarter.startDate), 'MMM dd, yyyy')} - 
                            {format(new Date(quarter.endDate), 'MMM dd, yyyy')}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={quarter.status === 'active' ? 'default' : 'secondary'}>
                            {quarter.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateIterations(quarter)}
                          >
                            Generate Iterations
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCycle(quarter.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {quarters.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        No quarters created yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedTab === 'iterations' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Existing Iterations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {iterations.map(iteration => {
                    const parentQuarter = quarters.find(q => q.id === iteration.parentCycleId);
                    return (
                      <div key={iteration.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{iteration.name}</div>
                          <div className="text-sm text-gray-600">
                            {format(new Date(iteration.startDate), 'MMM dd, yyyy')} - 
                            {format(new Date(iteration.endDate), 'MMM dd, yyyy')}
                          </div>
                          {parentQuarter && (
                            <div className="text-xs text-gray-500">
                              Part of {parentQuarter.name}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={iteration.status === 'active' ? 'default' : 'secondary'}>
                            {iteration.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCycle(iteration.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {iterations.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      No iterations created yet. Create quarters first, then generate iterations.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CycleDialog;
