
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Role } from '@/types';

const FinancialSettings = () => {
  const { config, setConfig, roles, setRoles } = useApp();
  const { toast } = useToast();
  
  const [localRoles, setLocalRoles] = useState<Role[]>(roles.length > 0 ? roles : [
    { id: 'role-1', name: 'Software Engineer', rateType: 'hourly', defaultRate: 85, defaultHourlyRate: 85, description: 'Full-stack developer' },
    { id: 'role-2', name: 'Senior Engineer', rateType: 'hourly', defaultRate: 120, defaultHourlyRate: 120, description: 'Senior developer with leadership responsibilities' },
    { id: 'role-3', name: 'Product Manager', rateType: 'hourly', defaultRate: 110, defaultHourlyRate: 110, description: 'Product strategy and planning' },
    { id: 'role-4', name: 'Designer', rateType: 'hourly', defaultRate: 90, defaultHourlyRate: 90, description: 'UX/UI design' },
  ]);

  // Financial year settings
  const currentYear = new Date().getFullYear();
  const [fySettings, setFySettings] = useState({
    startDate: config?.financialYear?.startDate || `${currentYear}-04-01`,
    endDate: config?.financialYear?.endDate || `${currentYear + 1}-03-31`,
    iterationLength: config?.iterationLength || 'fortnightly' as 'fortnightly' | 'monthly' | '6-weekly',
  });

  const addRole = () => {
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: '',
      rateType: 'hourly',
      defaultRate: 0,
      defaultHourlyRate: 0,
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

  const handleSave = () => {
    // Update roles
    setRoles(localRoles);
    
    // Update financial year config
    if (config) {
      const updatedConfig = {
        ...config,
        financialYear: {
          ...config.financialYear,
          startDate: fySettings.startDate,
          endDate: fySettings.endDate,
        },
        iterationLength: fySettings.iterationLength,
      };
      setConfig(updatedConfig);
    }

    toast({
      title: "Settings Saved",
      description: "Your financial settings have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Financial Year Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Financial Year Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fyStart">Financial Year Start Date</Label>
              <Input
                id="fyStart"
                type="date"
                value={fySettings.startDate}
                onChange={(e) => setFySettings(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="fyEnd">Financial Year End Date</Label>
              <Input
                id="fyEnd"
                type="date"
                value={fySettings.endDate}
                onChange={(e) => setFySettings(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
          
          <div>
            <Label>Iteration Length</Label>
            <div className="flex space-x-4 mt-2">
              {(['fortnightly', 'monthly', '6-weekly'] as const).map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="radio"
                    name="iterationLength"
                    value={option}
                    checked={fySettings.iterationLength === option}
                    onChange={(e) => setFySettings(prev => ({ 
                      ...prev, 
                      iterationLength: e.target.value as 'fortnightly' | 'monthly' | '6-weekly'
                    }))}
                    className="mr-2"
                  />
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Management */}
      <Card>
        <CardHeader>
          <CardTitle>Role & Rate Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="flex justify-end">
            <Button onClick={handleSave}>
              Save Financial Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialSettings;
