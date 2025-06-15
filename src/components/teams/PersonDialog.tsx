
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useApp } from '@/context/AppContext';
import { Person } from '@/types';

interface PersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person?: Person;
  onSave: (person: Omit<Person, 'id'> & { id?: string }) => void;
}

const PersonDialog: React.FC<PersonDialogProps> = ({
  open,
  onOpenChange,
  person,
  onSave
}) => {
  const { roles, teams } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roleId: '',
    teamId: '',
    isActive: true,
    employmentType: 'permanent' as 'permanent' | 'contractor',
    annualSalary: undefined as number | undefined,
    contractDetails: {
      hourlyRate: undefined as number | undefined,
      dailyRate: undefined as number | undefined,
    },
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });
  const [contractRateType, setContractRateType] = useState<'hourly' | 'daily'>('hourly');

  // Initialize form data when dialog opens or person changes
  useEffect(() => {
    if (person) {
      setFormData({
        name: person.name || '',
        email: person.email || '',
        roleId: person.roleId || '',
        teamId: person.teamId || '',
        isActive: person.isActive ?? true,
        employmentType: person.employmentType || 'permanent',
        annualSalary: person.annualSalary || undefined,
        contractDetails: {
          hourlyRate: person.contractDetails?.hourlyRate || undefined,
          dailyRate: person.contractDetails?.dailyRate || undefined,
        },
        startDate: person.startDate || new Date().toISOString().split('T')[0],
        endDate: person.endDate || '',
      });
      
      // Set contract rate type based on existing data
      if (person.contractDetails?.hourlyRate) {
        setContractRateType('hourly');
      } else if (person.contractDetails?.dailyRate) {
        setContractRateType('daily');
      }
    } else {
      // Reset form for new person
      setFormData({
        name: '',
        email: '',
        roleId: '',
        teamId: '',
        isActive: true,
        employmentType: 'permanent',
        annualSalary: undefined,
        contractDetails: {
          hourlyRate: undefined,
          dailyRate: undefined,
        },
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      });
      setContractRateType('hourly');
    }
  }, [person, open]);

  const selectedRole = roles.find(r => r.id === formData.roleId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const personData: Omit<Person, 'id'> & { id?: string } = {
      ...formData,
      contractDetails: formData.employmentType === 'contractor' ? formData.contractDetails : undefined,
      annualSalary: formData.employmentType === 'permanent' ? formData.annualSalary : undefined,
      endDate: formData.endDate || undefined,
      id: person?.id,
    };

    onSave(personData);
    onOpenChange(false);
  };

  const getPlaceholderText = () => {
    if (!selectedRole) return "Select a role first";
    
    if (formData.employmentType === 'permanent') {
      return selectedRole.defaultAnnualSalary ? 
        `Default: $${selectedRole.defaultAnnualSalary.toLocaleString()}/year` : 
        "Enter annual salary";
    } else {
      if (contractRateType === 'hourly') {
        return selectedRole.defaultHourlyRate ? 
          `Default: $${selectedRole.defaultHourlyRate}/hour` : 
          `Default: $${selectedRole.defaultRate}/hour`;
      } else {
        return selectedRole.defaultDailyRate ? 
          `Default: $${selectedRole.defaultDailyRate}/day` : 
          "Enter daily rate";
      }
    }
  };

  const handleContractRateTypeChange = (newType: 'hourly' | 'daily') => {
    setContractRateType(newType);
    // Clear the other rate field when switching types
    setFormData(prev => ({
      ...prev,
      contractDetails: {
        hourlyRate: newType === 'hourly' ? prev.contractDetails.hourlyRate : undefined,
        dailyRate: newType === 'daily' ? prev.contractDetails.dailyRate : undefined,
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{person ? 'Edit Person' : 'Add Person'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Role</Label>
              <Select value={formData.roleId} onValueChange={(value) => setFormData(prev => ({ ...prev, roleId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Team</Label>
              <Select value={formData.teamId} onValueChange={(value) => setFormData(prev => ({ ...prev, teamId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">End Date (optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Employment Type</Label>
            <RadioGroup
              value={formData.employmentType}
              onValueChange={(value: 'permanent' | 'contractor') => 
                setFormData(prev => ({ ...prev, employmentType: value }))
              }
              className="flex space-x-6 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="permanent" id="permanent" />
                <Label htmlFor="permanent">Permanent Employee</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="contractor" id="contractor" />
                <Label htmlFor="contractor">Contractor</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.employmentType === 'permanent' ? (
            <div>
              <Label htmlFor="annualSalary">Annual Salary (optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <Input
                  id="annualSalary"
                  type="number"
                  placeholder={getPlaceholderText()}
                  value={formData.annualSalary || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    annualSalary: Number(e.target.value) || undefined 
                  }))}
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to use role default salary
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Rate Type</Label>
                <RadioGroup
                  value={contractRateType}
                  onValueChange={handleContractRateTypeChange}
                  className="flex space-x-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hourly" id="hourly" />
                    <Label htmlFor="hourly">Hourly Rate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="daily" id="daily" />
                    <Label htmlFor="daily">Daily Rate</Label>
                  </div>
                </RadioGroup>
              </div>

              {contractRateType === 'hourly' ? (
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate (optional)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      placeholder={getPlaceholderText()}
                      value={formData.contractDetails.hourlyRate || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        contractDetails: {
                          ...prev.contractDetails,
                          hourlyRate: Number(e.target.value) || undefined
                        }
                      }))}
                      className="pl-7"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="dailyRate">Daily Rate (optional)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <Input
                      id="dailyRate"
                      type="number"
                      step="0.01"
                      placeholder={getPlaceholderText()}
                      value={formData.contractDetails.dailyRate || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        contractDetails: {
                          ...prev.contractDetails,
                          dailyRate: Number(e.target.value) || undefined
                        }
                      }))}
                      className="pl-7"
                    />
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                Leave empty to use role default rate
              </p>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {person ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PersonDialog;
