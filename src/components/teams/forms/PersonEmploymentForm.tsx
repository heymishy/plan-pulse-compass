
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Role } from '@/types';

interface PersonEmploymentFormProps {
  employmentType: 'permanent' | 'contractor';
  annualSalary?: number;
  hourlyRate?: number;
  dailyRate?: number;
  contractRateType: 'hourly' | 'daily';
  selectedRole?: Role;
  onEmploymentTypeChange: (type: 'permanent' | 'contractor') => void;
  onAnnualSalaryChange: (salary: number | undefined) => void;
  onHourlyRateChange: (rate: number | undefined) => void;
  onDailyRateChange: (rate: number | undefined) => void;
  onContractRateTypeChange: (type: 'hourly' | 'daily') => void;
}

const PersonEmploymentForm: React.FC<PersonEmploymentFormProps> = ({
  employmentType,
  annualSalary,
  hourlyRate,
  dailyRate,
  contractRateType,
  selectedRole,
  onEmploymentTypeChange,
  onAnnualSalaryChange,
  onHourlyRateChange,
  onDailyRateChange,
  onContractRateTypeChange
}) => {
  const getPlaceholderText = () => {
    if (!selectedRole) return "Select a role first";
    
    if (employmentType === 'permanent') {
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
    onContractRateTypeChange(newType);
    // Clear the other rate field when switching types
    if (newType === 'hourly') {
      onDailyRateChange(undefined);
    } else {
      onHourlyRateChange(undefined);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Employment Type</Label>
        <RadioGroup
          value={employmentType}
          onValueChange={onEmploymentTypeChange}
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

      {employmentType === 'permanent' ? (
        <div>
          <Label htmlFor="annualSalary">Annual Salary (optional)</Label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <Input
              id="annualSalary"
              type="number"
              placeholder={getPlaceholderText()}
              value={annualSalary || ''}
              onChange={(e) => onAnnualSalaryChange(Number(e.target.value) || undefined)}
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
                  value={hourlyRate || ''}
                  onChange={(e) => onHourlyRateChange(Number(e.target.value) || undefined)}
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
                  value={dailyRate || ''}
                  onChange={(e) => onDailyRateChange(Number(e.target.value) || undefined)}
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
    </div>
  );
};

export default PersonEmploymentForm;
