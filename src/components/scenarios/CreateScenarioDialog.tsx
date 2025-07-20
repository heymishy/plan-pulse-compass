import React, { useState, useEffect } from 'react';
import { useScenarios } from '@/context/ScenarioContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingDown,
  UserPlus,
  Clock,
  Zap,
  Target,
  Shield,
} from 'lucide-react';
import type {
  ScenarioTemplate,
  TemplateParameter,
} from '@/types/scenarioTypes';

interface CreateScenarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const templateIcons = {
  TrendingDown,
  UserPlus,
  Clock,
  Zap,
  Target,
  Shield,
};

export const CreateScenarioDialog: React.FC<CreateScenarioDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { templates, createScenario, createScenarioFromTemplate } =
    useScenarios();

  const [activeTab, setActiveTab] = useState<'blank' | 'template'>('blank');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] =
    useState<ScenarioTemplate | null>(null);
  const [templateParameters, setTemplateParameters] = useState<
    Record<string, any>
  >({});
  const [isCreating, setIsCreating] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setName('');
      setDescription('');
      setSelectedTemplate(null);
      setTemplateParameters({});
      setActiveTab('blank');
    }
  }, [open]);

  // Initialize template parameters when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      const initialParams: Record<string, any> = {};
      selectedTemplate.config.parameters.forEach(param => {
        initialParams[param.id] = param.defaultValue;
      });
      setTemplateParameters(initialParams);

      // Auto-generate scenario name if not set
      if (!name) {
        setName(`${selectedTemplate.name} Scenario`);
      }
    }
  }, [selectedTemplate, name]);

  const handleCreateBlankScenario = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      await createScenario({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create scenario:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate || !name.trim()) return;

    setIsCreating(true);
    try {
      await createScenarioFromTemplate(selectedTemplate.id, templateParameters);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create scenario from template:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleParameterChange = (parameterId: string, value: any) => {
    setTemplateParameters(prev => ({
      ...prev,
      [parameterId]: value,
    }));
  };

  const renderParameterInput = (parameter: TemplateParameter) => {
    const value = templateParameters[parameter.id];

    switch (parameter.type) {
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={e =>
              handleParameterChange(parameter.id, Number(e.target.value))
            }
            min={parameter.min}
            max={parameter.max}
            placeholder={`Enter ${parameter.name.toLowerCase()}`}
          />
        );

      case 'percentage':
        return (
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={value || ''}
              onChange={e =>
                handleParameterChange(parameter.id, Number(e.target.value))
              }
              min={parameter.min || 0}
              max={parameter.max || 100}
              placeholder="0"
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        );

      case 'text':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={e => handleParameterChange(parameter.id, e.target.value)}
            placeholder={`Enter ${parameter.name.toLowerCase()}`}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={e => handleParameterChange(parameter.id, e.target.value)}
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={newValue =>
              handleParameterChange(parameter.id, newValue)
            }
          >
            <SelectTrigger>
              <SelectValue
                placeholder={`Select ${parameter.name.toLowerCase()}`}
              />
            </SelectTrigger>
            <SelectContent>
              {parameter.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  const categorizedTemplates = templates.reduce(
    (acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    },
    {} as Record<string, ScenarioTemplate[]>
  );

  const categoryLabels = {
    budget: 'Budget & Finance',
    'team-changes': 'Team Changes',
    'project-timeline': 'Project Timeline',
    'resource-allocation': 'Resource Allocation',
    'strategic-planning': 'Strategic Planning',
    'risk-mitigation': 'Risk Mitigation',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Scenario</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={value => setActiveTab(value as 'blank' | 'template')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="blank">Blank Scenario</TabsTrigger>
            <TabsTrigger value="template">From Template</TabsTrigger>
          </TabsList>

          <TabsContent value="blank" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="scenario-name">Scenario Name *</Label>
                <Input
                  id="scenario-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Budget Reduction Scenario"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="scenario-description">Description</Label>
                <Textarea
                  id="scenario-description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe what this scenario will analyze..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Blank Scenario</h4>
                <p className="text-sm text-muted-foreground">
                  Creates a copy of your current planning data that you can
                  modify freely without affecting the live plan.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="template" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Template Selection */}
              <div className="space-y-4">
                <h3 className="font-medium">Choose a Template</h3>

                {Object.entries(categorizedTemplates).map(
                  ([category, categoryTemplates]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        {categoryLabels[
                          category as keyof typeof categoryLabels
                        ] || category}
                      </h4>
                      <div className="space-y-2">
                        {categoryTemplates.map(template => {
                          const IconComponent = template.icon
                            ? templateIcons[
                                template.icon as keyof typeof templateIcons
                              ]
                            : Target;

                          return (
                            <Card
                              key={template.id}
                              className={`cursor-pointer transition-colors hover:bg-accent ${
                                selectedTemplate?.id === template.id
                                  ? 'border-primary bg-accent'
                                  : ''
                              }`}
                              onClick={() => setSelectedTemplate(template)}
                            >
                              <CardHeader className="pb-2">
                                <div className="flex items-center space-x-3">
                                  <IconComponent className="h-5 w-5 text-primary" />
                                  <div className="flex-1">
                                    <CardTitle className="text-sm">
                                      {template.name}
                                    </CardTitle>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {categoryLabels[
                                          template.category as keyof typeof categoryLabels
                                        ] || template.category}
                                      </Badge>
                                      {template.usageCount > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                          Used {template.usageCount} times
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <CardDescription className="text-xs">
                                  {template.description}
                                </CardDescription>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Template Configuration */}
              <div className="space-y-4">
                {selectedTemplate ? (
                  <>
                    <div>
                      <Label htmlFor="template-scenario-name">
                        Scenario Name *
                      </Label>
                      <Input
                        id="template-scenario-name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g., Budget Reduction Scenario"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Template Parameters</h4>
                      <div className="space-y-4">
                        {selectedTemplate.config.parameters.map(parameter => (
                          <div key={parameter.id}>
                            <Label
                              htmlFor={parameter.id}
                              className="flex items-center space-x-2"
                            >
                              <span>{parameter.name}</span>
                              {parameter.required && (
                                <span className="text-destructive">*</span>
                              )}
                            </Label>
                            {parameter.description && (
                              <p className="text-xs text-muted-foreground mt-1 mb-2">
                                {parameter.description}
                              </p>
                            )}
                            {renderParameterInput(parameter)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">
                        {selectedTemplate.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedTemplate.description}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Select a template to configure</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={
              activeTab === 'blank'
                ? handleCreateBlankScenario
                : handleCreateFromTemplate
            }
            disabled={
              !name.trim() ||
              isCreating ||
              (activeTab === 'template' && !selectedTemplate)
            }
          >
            {isCreating ? 'Creating...' : 'Create Scenario'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
