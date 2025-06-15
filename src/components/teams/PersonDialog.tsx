
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppContext';
import { Person } from '@/types';
import PersonBasicInfoForm from './forms/PersonBasicInfoForm';
import PersonRoleTeamForm from './forms/PersonRoleTeamForm';
import PersonDatesForm from './forms/PersonDatesForm';
import PersonEmploymentForm from './forms/PersonEmploymentForm';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{person ? 'Edit Person' : 'Add Person'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PersonBasicInfoForm
            name={formData.name}
            email={formData.email}
            onNameChange={(name) => setFormData(prev => ({ ...prev, name }))}
            onEmailChange={(email) => setFormData(prev => ({ ...prev, email }))}
          />

          <PersonRoleTeamForm
            roleId={formData.roleId}
            teamId={formData.teamId}
            roles={roles}
            teams={teams}
            onRoleChange={(roleId) => setFormData(prev => ({ ...prev, roleId }))}
            onTeamChange={(teamId) => setFormData(prev => ({ ...prev, teamId }))}
          />

          <PersonDatesForm
            startDate={formData.startDate}
            endDate={formData.endDate}
            onStartDateChange={(startDate) => setFormData(prev => ({ ...prev, startDate }))}
            onEndDateChange={(endDate) => setFormData(prev => ({ ...prev, endDate }))}
          />

          <PersonEmploymentForm
            employmentType={formData.employmentType}
            annualSalary={formData.annualSalary}
            hourlyRate={formData.contractDetails.hourlyRate}
            dailyRate={formData.contractDetails.dailyRate}
            contractRateType={contractRateType}
            selectedRole={selectedRole}
            onEmploymentTypeChange={(employmentType) => setFormData(prev => ({ ...prev, employmentType }))}
            onAnnualSalaryChange={(annualSalary) => setFormData(prev => ({ ...prev, annualSalary }))}
            onHourlyRateChange={(hourlyRate) => setFormData(prev => ({ 
              ...prev, 
              contractDetails: { ...prev.contractDetails, hourlyRate }
            }))}
            onDailyRateChange={(dailyRate) => setFormData(prev => ({ 
              ...prev, 
              contractDetails: { ...prev.contractDetails, dailyRate }
            }))}
            onContractRateTypeChange={setContractRateType}
          />
          
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
