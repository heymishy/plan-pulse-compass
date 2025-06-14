
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Upload, Settings, Calendar } from 'lucide-react';

const Setup = () => {
  const { setConfig, setIsSetupComplete } = useApp();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    financialYearStart: '',
    financialYearEnd: '',
    iterationLength: 'fortnightly' as 'fortnightly' | 'monthly' | '6-weekly',
  });

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // Parse CSV logic would go here
      toast({
        title: "CSV Upload",
        description: `${type} CSV uploaded successfully`,
      });
    };
    reader.readAsText(file);
  };

  const completeSetup = () => {
    // Create basic configuration
    const config = {
      financialYear: {
        id: '1',
        name: `FY ${new Date(formData.financialYearStart).getFullYear()}`,
        startDate: formData.financialYearStart,
        endDate: formData.financialYearEnd,
      },
      iterationLength: formData.iterationLength,
      quarters: [],
      runWorkCategories: [
        { id: '1', name: 'Production Support', description: 'Ongoing production support work', color: '#ef4444' },
        { id: '2', name: 'Certificate Management', description: 'SSL/TLS certificate management', color: '#f97316' },
        { id: '3', name: 'Compliance', description: 'Regulatory compliance work', color: '#eab308' },
        { id: '4', name: 'Technical Debt', description: 'Technical debt reduction', color: '#22c55e' },
      ],
    };

    setConfig(config);
    setIsSetupComplete(true);
    
    toast({
      title: "Setup Complete",
      description: "Your planning app is now ready to use!",
    });
  };

  const steps = [
    { id: 0, title: 'Configuration', icon: Settings },
    { id: 1, title: 'Import Data', icon: Upload },
    { id: 2, title: 'Complete', icon: CheckCircle },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Wizard</h1>
        <p className="text-gray-600">
          Configure your team planning environment
        </p>
      </div>

      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === index;
          const isCompleted = currentStep > index;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                isCompleted ? 'bg-green-500 border-green-500 text-white' :
                isActive ? 'border-blue-500 text-blue-500' : 'border-gray-300 text-gray-300'
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`ml-2 ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className="w-16 h-px bg-gray-300 mx-4" />
              )}
            </div>
          );
        })}
      </div>

      {currentStep === 0 && (
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
              <Button onClick={() => setCurrentStep(1)}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Import Data (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="people" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="people">People & Teams</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="roles">Roles & Rates</TabsTrigger>
              </TabsList>
              
              <TabsContent value="people" className="space-y-4">
                <div>
                  <Label htmlFor="peopleCSV">People CSV</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Format: name, email, role, team name, team id
                  </p>
                  <Input
                    id="peopleCSV"
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleCSVUpload(e, 'People')}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="projects" className="space-y-4">
                <div>
                  <Label htmlFor="projectsCSV">Projects CSV</Label>
                  <Input
                    id="projectsCSV"
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleCSVUpload(e, 'Projects')}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="roles" className="space-y-4">
                <div>
                  <Label htmlFor="rolesCSV">Roles CSV</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Format: role name, default rate
                  </p>
                  <Input
                    id="rolesCSV"
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleCSVUpload(e, 'Roles')}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setCurrentStep(0)}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep(2)}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Setup Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Your team planning app is now configured and ready to use. You can start by:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 mb-6">
              <li>Adding team members and projects</li>
              <li>Setting up quarterly planning cycles</li>
              <li>Creating team allocations</li>
              <li>Tracking milestones and progress</li>
            </ul>
            <Button onClick={completeSetup} className="w-full">
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Setup;
