import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { useTeams } from '@/context/TeamContext';
import { useToast } from '@/hooks/use-toast';
import { Role } from '@/types';

const FinancialSettings = () => {
  const { config, setConfig } = useSettings();
  const { roles, setRoles } = useTeams();
  const { toast } = useToast();

  const [localRoles, setLocalRoles] = useState<Role[]>(
    roles.length > 0
      ? roles
      : [
          {
            id: 'role-1',
            name: 'Software Engineer',
            rateType: 'hourly',
            defaultRate: 85,
            defaultHourlyRate: 85,
            defaultAnnualSalary: 120000,
            description: 'Full-stack developer',
          },
          {
            id: 'role-2',
            name: 'Senior Engineer',
            rateType: 'hourly',
            defaultRate: 120,
            defaultHourlyRate: 120,
            defaultAnnualSalary: 180000,
            description: 'Senior developer with leadership responsibilities',
          },
          {
            id: 'role-3',
            name: 'Product Manager',
            rateType: 'hourly',
            defaultRate: 110,
            defaultHourlyRate: 110,
            defaultAnnualSalary: 150000,
            description: 'Product strategy and planning',
          },
          {
            id: 'role-4',
            name: 'Designer',
            rateType: 'hourly',
            defaultRate: 90,
            defaultHourlyRate: 90,
            defaultAnnualSalary: 110000,
            description: 'UX/UI design',
          },
        ]
  );

  // Financial year settings
  const currentYear = new Date().getFullYear();
  const [fySettings, setFySettings] = useState({
    startDate: config?.financialYear?.startDate || `${currentYear}-04-01`,
    endDate: config?.financialYear?.endDate || `${currentYear + 1}-03-31`,
    iterationLength:
      config?.iterationLength ||
      ('fortnightly' as 'fortnightly' | 'monthly' | '6-weekly'),
    workingDaysPerWeek: config?.workingDaysPerWeek || 5,
    workingHoursPerDay: config?.workingHoursPerDay || 8,
    workingDaysPerYear: config?.workingDaysPerYear || 260,
    workingDaysPerMonth: config?.workingDaysPerMonth || 22,
    currencySymbol: config?.currencySymbol || '$',
  });

  const addRole = () => {
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: '',
      rateType: 'hourly',
      defaultRate: 0,
      defaultHourlyRate: 0,
      defaultDailyRate: 0,
      defaultAnnualSalary: 0,
      description: '',
    };
    setLocalRoles([...localRoles, newRole]);
  };

  const updateRole = (
    id: string,
    field: keyof Role,
    value: string | number
  ) => {
    setLocalRoles(
      localRoles.map(role =>
        role.id === id ? { ...role, [field]: value } : role
      )
    );
  };

  const removeRole = (id: string) => {
    setLocalRoles(localRoles.filter(role => role.id !== id));
  };

  const validateRole = (role: Role) => {
    const hasContractorRates =
      (role.defaultHourlyRate && role.defaultHourlyRate > 0) ||
      (role.defaultDailyRate && role.defaultDailyRate > 0);
    const hasPermanentRate =
      role.defaultAnnualSalary && role.defaultAnnualSalary > 0;
    const hasLegacyRate = role.defaultRate && role.defaultRate > 0;

    return {
      isComplete: hasContractorRates || hasPermanentRate || hasLegacyRate,
      hasContractorRates,
      hasPermanentRate,
      hasLegacyRate,
    };
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
        workingDaysPerWeek: fySettings.workingDaysPerWeek,
        workingHoursPerDay: fySettings.workingHoursPerDay,
        workingDaysPerYear: fySettings.workingDaysPerYear,
        workingDaysPerMonth: fySettings.workingDaysPerMonth,
        currencySymbol: fySettings.currencySymbol,
      };
      setConfig(updatedConfig);
    }

    toast({
      title: 'Financial Settings Saved',
      description:
        'Your financial settings and role rates have been updated successfully.',
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
                onChange={e =>
                  setFySettings(prev => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="fyEnd">Financial Year End Date</Label>
              <Input
                id="fyEnd"
                type="date"
                value={fySettings.endDate}
                onChange={e =>
                  setFySettings(prev => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <Label>Iteration Length</Label>
            <div className="flex space-x-4 mt-2">
              {(['fortnightly', 'monthly', '6-weekly'] as const).map(option => (
                <label key={option} className="flex items-center">
                  <input
                    type="radio"
                    name="iterationLength"
                    value={option}
                    checked={fySettings.iterationLength === option}
                    onChange={e =>
                      setFySettings(prev => ({
                        ...prev,
                        iterationLength: e.target.value as
                          | 'fortnightly'
                          | 'monthly'
                          | '6-weekly',
                      }))
                    }
                    className="mr-2"
                  />
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workingDaysPerWeek">Working Days Per Week</Label>
              <Input
                id="workingDaysPerWeek"
                type="number"
                value={fySettings.workingDaysPerWeek}
                onChange={e =>
                  setFySettings(prev => ({
                    ...prev,
                    workingDaysPerWeek: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="workingHoursPerDay">Working Hours Per Day</Label>
              <Input
                id="workingHoursPerDay"
                type="number"
                value={fySettings.workingHoursPerDay}
                onChange={e =>
                  setFySettings(prev => ({
                    ...prev,
                    workingHoursPerDay: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workingDaysPerYear">Working Days Per Year</Label>
              <Input
                id="workingDaysPerYear"
                type="number"
                value={fySettings.workingDaysPerYear}
                onChange={e =>
                  setFySettings(prev => ({
                    ...prev,
                    workingDaysPerYear: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="workingDaysPerMonth">
                Working Days Per Month
              </Label>
              <Input
                id="workingDaysPerMonth"
                type="number"
                value={fySettings.workingDaysPerMonth}
                onChange={e =>
                  setFySettings(prev => ({
                    ...prev,
                    workingDaysPerMonth: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="currencySymbol">Currency Symbol</Label>
            <Input
              id="currencySymbol"
              type="text"
              value={fySettings.currencySymbol}
              onChange={e =>
                setFySettings(prev => ({
                  ...prev,
                  currencySymbol: e.target.value,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Role Rate Management */}
      <Card>
        <CardHeader>
          <CardTitle>Role Rate Management</CardTitle>
          <p className="text-sm text-gray-600">
            Configure default rates for roles. These are used when individual
            team members don't have specific rates assigned.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Rate Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4">
                {localRoles.map(role => {
                  const validation = validateRole(role);
                  return (
                    <div key={role.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">
                            {role.name || 'Unnamed Role'}
                          </h3>
                          {validation.isComplete ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRole(role.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-gray-500">
                            Permanent Employee Salary
                          </Label>
                          <div className="font-medium">
                            {validation.hasPermanentRate ? (
                              `$${role.defaultAnnualSalary?.toLocaleString()}/year`
                            ) : (
                              <span className="text-gray-400">Not set</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">
                            Contractor Hourly Rate
                          </Label>
                          <div className="font-medium">
                            {role.defaultHourlyRate ? (
                              `$${role.defaultHourlyRate}/hour`
                            ) : (
                              <span className="text-gray-400">Not set</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">
                            Contractor Daily Rate
                          </Label>
                          <div className="font-medium">
                            {role.defaultDailyRate ? (
                              `$${role.defaultDailyRate}/day`
                            ) : (
                              <span className="text-gray-400">Not set</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {validation.hasLegacyRate && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            Legacy Rate: ${role.defaultRate}/hour
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button
                variant="outline"
                onClick={addRole}
                className="w-full flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Role
              </Button>
            </TabsContent>

            <TabsContent value="detailed" className="space-y-4">
              <div className="space-y-6">
                {localRoles.map(role => (
                  <div
                    key={role.id}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`role-name-${role.id}`}>
                          Role Name
                        </Label>
                        <Input
                          id={`role-name-${role.id}`}
                          placeholder="e.g. Senior Developer"
                          value={role.name}
                          onChange={e =>
                            updateRole(role.id, 'name', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor={`role-desc-${role.id}`}>
                          Description
                        </Label>
                        <Input
                          id={`role-desc-${role.id}`}
                          placeholder="Role description"
                          value={role.description || ''}
                          onChange={e =>
                            updateRole(role.id, 'description', e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">
                        Permanent Employee Default Rates
                      </h4>
                      <div>
                        <Label htmlFor={`annual-salary-${role.id}`}>
                          Annual Salary
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">
                            $
                          </span>
                          <Input
                            id={`annual-salary-${role.id}`}
                            type="number"
                            placeholder="120000"
                            value={role.defaultAnnualSalary || ''}
                            onChange={e =>
                              updateRole(
                                role.id,
                                'defaultAnnualSalary',
                                Number(e.target.value) || 0
                              )
                            }
                            className="pl-7"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">
                        Contractor Default Rates
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`hourly-rate-${role.id}`}>
                            Hourly Rate
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">
                              $
                            </span>
                            <Input
                              id={`hourly-rate-${role.id}`}
                              type="number"
                              step="0.01"
                              placeholder="85.00"
                              value={role.defaultHourlyRate || ''}
                              onChange={e =>
                                updateRole(
                                  role.id,
                                  'defaultHourlyRate',
                                  Number(e.target.value) || 0
                                )
                              }
                              className="pl-7"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor={`daily-rate-${role.id}`}>
                            Daily Rate
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">
                              $
                            </span>
                            <Input
                              id={`daily-rate-${role.id}`}
                              type="number"
                              step="0.01"
                              placeholder="680.00"
                              value={role.defaultDailyRate || ''}
                              onChange={e =>
                                updateRole(
                                  role.id,
                                  'defaultDailyRate',
                                  Number(e.target.value) || 0
                                )
                              }
                              className="pl-7"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {role.defaultRate && role.defaultRate > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">
                            Legacy Rate Active
                          </span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                          This role has a legacy rate of ${role.defaultRate}
                          /hour that will be used as fallback.
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRole(role.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Role
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={addRole}
                className="w-full flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Role
              </Button>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSave}>Save Financial Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialSettings;
