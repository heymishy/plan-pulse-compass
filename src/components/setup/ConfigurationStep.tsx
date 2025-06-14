
import React from 'react';
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          Basic Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fyStart">Financial Year Start</Label>
            <Input
              id="fyStart"
              type="date"
              value={formData.financialYearStart}
              onChange={(e) => setFormData(prev => ({ ...prev, financialYearStart: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="fyEnd">Financial Year End</Label>
            <Input
              id="fyEnd"
              type="date"
              value={formData.financialYearEnd}
              onChange={(e) => setFormData(prev => ({ ...prev, financialYearEnd: e.target.value }))}
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
          <Button onClick={onNext}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigurationStep;
