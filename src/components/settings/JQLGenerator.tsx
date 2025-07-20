import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Copy,
  Download,
  Lightbulb,
  Code,
  Calendar,
  Filter,
  ArrowRight,
  Play,
  Sparkles,
  FileText,
  Settings,
  HelpCircle,
} from 'lucide-react';
import {
  JQL_TEMPLATES,
  generateJQL,
  type JQLConfig,
} from '@/utils/jiraImportUtils';

interface JQLGeneratorProps {
  onGenerateJQL: (jql: string, config: JQLConfig) => void;
  onNext: () => void;
}

export const JQLGenerator: React.FC<JQLGeneratorProps> = ({
  onGenerateJQL,
  onNext,
}) => {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customConfig, setCustomConfig] = useState<JQLConfig>({
    projects: [],
    issueTypes: ['Epic'],
    statuses: [],
    assignees: [],
    sprints: [],
    dateRange: undefined,
    customJQL: '',
  });
  const [generatedJQL, setGeneratedJQL] = useState('');
  const [templateVariables, setTemplateVariables] = useState<
    Record<string, string>
  >({});

  // Template processing for variable substitution
  const processTemplate = (
    templateJQL: string,
    variables: Record<string, string>
  ): string => {
    let processedJQL = templateJQL;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      processedJQL = processedJQL.replace(new RegExp(placeholder, 'g'), value);
    });
    return processedJQL;
  };

  // Generate JQL from template
  const generateFromTemplate = (templateKey: string) => {
    const template = JQL_TEMPLATES[templateKey as keyof typeof JQL_TEMPLATES];
    if (!template) return;

    let jql = template.jql;

    // Process template variables
    if (Object.keys(templateVariables).length > 0) {
      jql = processTemplate(jql, templateVariables);
    }

    setGeneratedJQL(jql);
    onGenerateJQL(jql, { ...customConfig, customJQL: jql });
  };

  // Generate JQL from custom config
  const generateFromConfig = () => {
    const jql = generateJQL(customConfig);
    setGeneratedJQL(jql);
    onGenerateJQL(jql, customConfig);
  };

  // Copy JQL to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedJQL);
    } catch (err) {
      console.error('Failed to copy JQL to clipboard:', err);
    }
  };

  // Download JQL as file
  const downloadJQL = () => {
    const blob = new Blob([generatedJQL], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jira-export-query.jql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Add/remove items from arrays
  const addToArray = (field: keyof JQLConfig, value: string) => {
    if (!value.trim()) return;
    const currentArray = customConfig[field] as string[];
    if (!currentArray.includes(value)) {
      setCustomConfig(prev => ({
        ...prev,
        [field]: [...currentArray, value],
      }));
    }
  };

  const removeFromArray = (field: keyof JQLConfig, value: string) => {
    const currentArray = customConfig[field] as string[];
    setCustomConfig(prev => ({
      ...prev,
      [field]: currentArray.filter(item => item !== value),
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Jira Query Generator</h2>
        <p className="text-gray-600">
          Generate JQL (Jira Query Language) to export the right data from your
          Jira instance. Use templates for common scenarios or build custom
          queries.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Query Builder
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Custom JQL
          </TabsTrigger>
        </TabsList>

        {/* Pre-built Templates */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Pre-built Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {Object.entries(JQL_TEMPLATES).map(([key, template]) => (
                  <div
                    key={key}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(key)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {template.description}
                        </p>
                        <div className="mt-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {template.jql}
                          </code>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          generateFromTemplate(key);
                        }}
                        className="ml-4"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Use
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Template Variables */}
              {(selectedTemplate === 'project-epics' ||
                selectedTemplate === 'sprint-epics' ||
                selectedTemplate === 'custom-range') && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Template Variables
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedTemplate === 'project-epics' && (
                      <div>
                        <Label className="text-xs">
                          Projects (comma-separated)
                        </Label>
                        <Input
                          placeholder="e.g., PROJ1, PROJ2, PROJ3"
                          value={templateVariables.projects || ''}
                          onChange={e =>
                            setTemplateVariables(prev => ({
                              ...prev,
                              projects: e.target.value,
                            }))
                          }
                          className="text-xs"
                        />
                      </div>
                    )}
                    {selectedTemplate === 'sprint-epics' && (
                      <div>
                        <Label className="text-xs">
                          Sprints (comma-separated)
                        </Label>
                        <Input
                          placeholder="e.g., Sprint 1, Sprint 2"
                          value={templateVariables.sprints || ''}
                          onChange={e =>
                            setTemplateVariables(prev => ({
                              ...prev,
                              sprints: e.target.value,
                            }))
                          }
                          className="text-xs"
                        />
                      </div>
                    )}
                    {selectedTemplate === 'custom-range' && (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Date Field</Label>
                          <Select
                            value={templateVariables.dateField || 'created'}
                            onValueChange={value =>
                              setTemplateVariables(prev => ({
                                ...prev,
                                dateField: value,
                              }))
                            }
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="created">Created</SelectItem>
                              <SelectItem value="updated">Updated</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Start Date</Label>
                          <Input
                            type="date"
                            value={templateVariables.startDate || ''}
                            onChange={e =>
                              setTemplateVariables(prev => ({
                                ...prev,
                                startDate: e.target.value,
                              }))
                            }
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">End Date</Label>
                          <Input
                            type="date"
                            value={templateVariables.endDate || ''}
                            onChange={e =>
                              setTemplateVariables(prev => ({
                                ...prev,
                                endDate: e.target.value,
                              }))
                            }
                            className="text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Query Builder */}
        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Query Builder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Issue Types */}
              <div>
                <Label className="text-sm font-medium">Issue Types</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add issue type (e.g., Epic, Story)"
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          addToArray('issueTypes', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const input = document.querySelector(
                          'input[placeholder*="issue type"]'
                        ) as HTMLInputElement;
                        if (input?.value) {
                          addToArray('issueTypes', input.value);
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {customConfig.issueTypes.map(type => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}
                        <button
                          onClick={() => removeFromArray('issueTypes', type)}
                          className="ml-1 text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Projects */}
              <div>
                <Label className="text-sm font-medium">Projects</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add project key (e.g., PROJ, DEV)"
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          addToArray('projects', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const input = document.querySelector(
                          'input[placeholder*="project key"]'
                        ) as HTMLInputElement;
                        if (input?.value) {
                          addToArray('projects', input.value);
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {customConfig.projects.map(project => (
                      <Badge
                        key={project}
                        variant="secondary"
                        className="text-xs"
                      >
                        {project}
                        <button
                          onClick={() => removeFromArray('projects', project)}
                          className="ml-1 text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div>
                <Label className="text-sm font-medium">
                  Date Range (Optional)
                </Label>
                <div className="mt-2 grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Date Field</Label>
                    <Select
                      value={customConfig.dateRange?.field || ''}
                      onValueChange={field =>
                        setCustomConfig(prev => ({
                          ...prev,
                          dateRange: prev.dateRange
                            ? {
                                ...prev.dateRange,
                                field: field as
                                  | 'created'
                                  | 'updated'
                                  | 'resolved',
                              }
                            : {
                                field: field as
                                  | 'created'
                                  | 'updated'
                                  | 'resolved',
                              },
                        }))
                      }
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created">Created</SelectItem>
                        <SelectItem value="updated">Updated</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="date"
                      value={customConfig.dateRange?.start || ''}
                      onChange={e =>
                        setCustomConfig(prev => ({
                          ...prev,
                          dateRange: prev.dateRange
                            ? { ...prev.dateRange, start: e.target.value }
                            : { field: 'created', start: e.target.value },
                        }))
                      }
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">End Date</Label>
                    <Input
                      type="date"
                      value={customConfig.dateRange?.end || ''}
                      onChange={e =>
                        setCustomConfig(prev => ({
                          ...prev,
                          dateRange: prev.dateRange
                            ? { ...prev.dateRange, end: e.target.value }
                            : { field: 'created', end: e.target.value },
                        }))
                      }
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={generateFromConfig} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Generate JQL
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom JQL */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Custom JQL
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Enter Custom JQL</Label>
                <Textarea
                  placeholder="Enter your custom JQL query here..."
                  value={customConfig.customJQL}
                  onChange={e => {
                    setCustomConfig(prev => ({
                      ...prev,
                      customJQL: e.target.value,
                    }));
                    setGeneratedJQL(e.target.value);
                    onGenerateJQL(e.target.value, {
                      ...customConfig,
                      customJQL: e.target.value,
                    });
                  }}
                  className="mt-2 min-h-[120px] font-mono text-sm"
                />
              </div>

              <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>JQL Reference:</strong> Use issue type = Epic, project
                  in (PROJ1, PROJ2), status in (&quot;In Progress&quot;,
                  &quot;Done&quot;), assignee = currentUser(), created &gt;=
                  -12w, ORDER BY created DESC
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generated JQL Output */}
      {generatedJQL && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-green-800">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated JQL
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                <Button size="sm" variant="outline" onClick={downloadJQL}>
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded border font-mono text-sm">
              {generatedJQL}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">
                  Next Steps:
                </span>
              </div>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Copy this JQL query to your Jira instance</li>
                <li>Go to Issues → Search for Issues in Jira</li>
                <li>Paste the JQL in the advanced search</li>
                <li>Export the results as CSV with all fields</li>
                <li>Return here to upload and map the CSV data</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      {generatedJQL && (
        <div className="flex justify-end">
          <Button onClick={onNext} size="lg">
            Continue to Upload CSV
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
