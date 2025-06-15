import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Role } from '@/types';

interface FinancialStepProps {
  onBack: () => void;
  onNext: () => void;
}

const FinancialStep: React.FC<FinancialStepProps> = ({ onBack, onNext }) => {
  const { roles, setRoles } = useApp();
  const [localRoles, setLocalRoles] = useState<Role[]>(roles.length > 0 ? roles : [
    { id: 'role-1', name: 'Software Engineer', rateType: 'hourly', defaultRate: 85, defaultHourlyRate: 85, description: 'Full-stack developer' },
    { id: 'role-2', name: 'Senior Engineer', rateType: 'hourly', defaultRate: 120, defaultHourlyRate: 120, description: 'Senior developer with leadership responsibilities' },
    { id: 'role-3', name: 'Product Manager', rateType: 'hourly', defaultRate: 110, defaultHourlyRate: 110, description: 'Product strategy and planning' },
    { id: 'role-4', name: 'Designer', rateType: 'hourly', defaultRate: 90, defaultHourlyRate: 90, description: 'UX/UI design' },
  ]);

  const addRole = () => {
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: '',
      rateType: 'hourly',
      defaultRate: 0,
      description: '',
    };
    setLocalRoles([...localRoles, newRole]);
  };

  const updateRole = (id: string, field: keyof Role, value: string | number) => {
    setLocalRoles(localRoles.map(role => 
      role.id === id ? { ...role, [field]: value } : role
    ));
  };

  const removeRole = (id: string) => {
    setLocalRoles(localRoles.filter(role => role.id !== id));
  };

  const handleNext = () => {
    // Save roles to context
    setRoles(localRoles);
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="mr-2 h-5 w-5" />
          Financial Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium">Role Hourly Rates</Label>
          <p className="text-sm text-gray-600 mb-4">
            Set default hourly rates for different roles. These can be overridden for individual team members.
          </p>
          
          <div className="space-y-3">
            {localRoles.map((role) => (
              <div key={role.id} className="grid grid-cols-12 gap-3 items-center p-3 border rounded-lg">
                <div className="col-span-4">
                  <Input
                    placeholder="Role name"
                    value={role.name}
                    onChange={(e) => updateRole(role.id, 'name', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={role.defaultHourlyRate || role.defaultRate || ''}
                      onChange={(e) => updateRole(role.id, 'defaultHourlyRate', Number(e.target.value))}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="col-span-5">
                  <Input
                    placeholder="Description (optional)"
                    value={role.description || ''}
                    onChange={(e) => updateRole(role.id, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeRole(role.id)}
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
            onClick={addRole}
            className="mt-3 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleNext}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialStep;
