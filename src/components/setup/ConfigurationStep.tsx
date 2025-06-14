
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';

interface ConfigurationStepProps {
  formData: {
    financialYearStart: string;
    financialYearEnd: string;
    iterationLength: 'fortnightly' | 'monthly' | '6-weekly';
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    financialYearStart: string;
    financialYearEnd: string;
    iterationLength: 'fortnightly' | 'monthly' | '6-weekly';
  }>>;
  onNext: () => void;
}

const ConfigurationStep: React.FC<ConfigurationStepProps> = ({
  formData,
  setFormData,
  onNext
}) => {
  // Auto-calculate financial year end when start date changes
  useEffect(() => {
    if (formData.financialYearStart) {
      const startDate = new Date(formData.financialYearStart);
      // Add 364 days (52 weeks - 1 day) to get the end date
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 364);
      
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      setFormData(prev => ({ 
        ...prev, 
        financialYearEnd: formattedEndDate 
      }));
    }
  }, [formData.financialYearStart, setFormData]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, financialYearStart: e.target.value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          Basic Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="fyStart">Financial Year Start Date</Label>
          <Input
            id="fyStart"
            type="date"
            value={formData.financialYearStart}
            onChange={handleStartDateChange}
          />
          {formData.financialYearEnd && (
            <p className="text-sm text-gray-500 mt-1">
              Financial year will end on: {new Date(formData.financialYearEnd).toLocaleDateString()}
            </p>
          )}
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
                  checked={formData.iterationLength === option}
                  onChange={(e) => setFormData(prev => ({ 
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

        <div className="flex justify-end">
          <Button onClick={onNext} disabled={!formData.financialYearStart}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigurationStep;
