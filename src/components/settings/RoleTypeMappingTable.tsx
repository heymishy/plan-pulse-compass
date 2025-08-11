/**
 * Role Type Mapping Table
 *
 * Interface for managing job title to role type mappings,
 * including AI suggestions and bulk operations.
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Search,
  Wand2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Download,
  Upload,
} from 'lucide-react';
import { useRoleTypes } from '@/hooks/useRoleTypes';
import { useApp } from '@/context/AppContext';
import { RoleTypeMapping, RoleTypeSuggestion } from '@/types/roleTypes';
import { ROLE_TYPE_CATEGORIES } from '@/utils/roleTypeUtils';
import { useToast } from '@/hooks/use-toast';

interface MappingFormData {
  jobTitle: string;
  roleTypeId: string;
  confidence: number;
  mappingSource: RoleTypeMapping['mappingSource'];
  notes: string;
}

const emptyFormData: MappingFormData = {
  jobTitle: '',
  roleTypeId: '',
  confidence: 1,
  mappingSource: 'manual',
  notes: '',
};

const RoleTypeMappingTable: React.FC = () => {
  const { roles } = useApp();
  const {
    roleTypes,
    roleTypeMappings,
    addMapping,
    updateMapping,
    deleteMapping,
    suggestMappings,
    getUnmappedJobTitles,
    autoMapUnmappedRoles,
  } = useRoleTypes();
  const { toast } = useToast();

  // State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<RoleTypeMapping | null>(
    null
  );
  const [formData, setFormData] = useState<MappingFormData>(emptyFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>('');
  const [suggestions, setSuggestions] = useState<RoleTypeSuggestion[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isAutoMappingDialogOpen, setIsAutoMappingDialogOpen] = useState(false);

  // Get unmapped job titles
  const unmappedJobTitles = useMemo(
    () => getUnmappedJobTitles(),
    [getUnmappedJobTitles]
  );

  // Filtered mappings
  const filteredMappings = useMemo(() => {
    return roleTypeMappings.filter(
      mapping =>
        mapping.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roleTypes
          .find(rt => rt.id === mapping.roleTypeId)
          ?.name.toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  }, [roleTypeMappings, roleTypes, searchTerm]);

  // Get confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get confidence badge variant
  const getConfidenceBadge = (confidence: number): React.ReactNode => {
    const percentage = Math.round(confidence * 100);
    if (confidence >= 0.8) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          {percentage}%
        </Badge>
      );
    }
    if (confidence >= 0.6) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          {percentage}%
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-800">
        {percentage}%
      </Badge>
    );
  };

  // Handle dialog operations
  const handleOpenDialog = (mapping?: RoleTypeMapping, jobTitle?: string) => {
    if (mapping) {
      setEditingMapping(mapping);
      setFormData({
        jobTitle: mapping.jobTitle,
        roleTypeId: mapping.roleTypeId,
        confidence: mapping.confidence,
        mappingSource: mapping.mappingSource,
        notes: mapping.notes || '',
      });
      setSuggestions([]);
    } else {
      setEditingMapping(null);
      const title = jobTitle || selectedJobTitle;
      setFormData({
        ...emptyFormData,
        jobTitle: title,
      });

      // Get AI suggestions for the job title
      if (title) {
        const titleSuggestions = suggestMappings(title);
        setSuggestions(titleSuggestions);

        // Auto-select best suggestion if confidence is high
        if (
          titleSuggestions.length > 0 &&
          titleSuggestions[0].confidence >= 0.8
        ) {
          setFormData(prev => ({
            ...prev,
            roleTypeId: titleSuggestions[0].roleTypeId,
            confidence: titleSuggestions[0].confidence,
            mappingSource: 'ai-suggested',
            notes: titleSuggestions[0].reasoning,
          }));
        }
      } else {
        setSuggestions([]);
      }
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMapping(null);
    setFormData(emptyFormData);
    setSuggestions([]);
  };

  const handleInputChange = (field: keyof MappingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Get new suggestions if job title changes
    if (field === 'jobTitle' && value) {
      const newSuggestions = suggestMappings(value);
      setSuggestions(newSuggestions);
    }
  };

  const handleSubmit = () => {
    if (!formData.jobTitle.trim() || !formData.roleTypeId) {
      toast({
        title: 'Validation Error',
        description: 'Job title and role type are required',
        variant: 'destructive',
      });
      return;
    }

    const mappingData = {
      jobTitle: formData.jobTitle.trim(),
      roleTypeId: formData.roleTypeId,
      confidence: formData.confidence,
      mappingSource: formData.mappingSource,
      notes: formData.notes.trim() || undefined,
    };

    try {
      if (editingMapping) {
        updateMapping(editingMapping.id, mappingData);
        toast({
          title: 'Success',
          description: 'Mapping updated successfully',
        });
      } else {
        addMapping(mappingData);
        toast({
          title: 'Success',
          description: 'Mapping created successfully',
        });
      }
      handleCloseDialog();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save mapping',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (id: string) => {
    try {
      deleteMapping(id);
      toast({
        title: 'Success',
        description: 'Mapping deleted successfully',
      });
      setDeleteConfirmId(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete mapping',
        variant: 'destructive',
      });
    }
  };

  const handleAutoMapping = async () => {
    const result = autoMapUnmappedRoles(0.7);
    toast({
      title: 'Auto-mapping Complete',
      description: `Mapped ${result.mapped} job titles, skipped ${result.skipped} low-confidence matches`,
    });
    setIsAutoMappingDialogOpen(false);
  };

  const handleApplySuggestion = (suggestion: RoleTypeSuggestion) => {
    setFormData(prev => ({
      ...prev,
      roleTypeId: suggestion.roleTypeId,
      confidence: suggestion.confidence,
      mappingSource: 'ai-suggested',
      notes: suggestion.reasoning,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Mappings</p>
                <p className="text-2xl font-bold">{roleTypeMappings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Unmapped Titles</p>
                <p className="text-2xl font-bold">{unmappedJobTitles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">High Confidence</p>
                <p className="text-2xl font-bold">
                  {roleTypeMappings.filter(m => m.confidence >= 0.8).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Job Title Mappings</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsAutoMappingDialogOpen(true)}
                disabled={unmappedJobTitles.length === 0}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Auto-Map ({unmappedJobTitles.length})
              </Button>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Mapping
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search job titles or role types..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {unmappedJobTitles.length > 0 && (
              <Select
                value={selectedJobTitle}
                onValueChange={setSelectedJobTitle}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select unmapped title" />
                </SelectTrigger>
                <SelectContent>
                  {unmappedJobTitles.slice(0, 20).map(item => (
                    <SelectItem key={item.jobTitle} value={item.jobTitle}>
                      {item.jobTitle} ({item.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Mappings Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Role Type</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.map(mapping => {
                  const roleType = roleTypes.find(
                    rt => rt.id === mapping.roleTypeId
                  );
                  const usageCount = roles.filter(
                    r => r.name === mapping.jobTitle
                  ).length;

                  return (
                    <TableRow key={mapping.id}>
                      <TableCell>
                        <div className="font-medium">{mapping.jobTitle}</div>
                        {mapping.notes && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {mapping.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: roleType?.color || '#gray',
                            }}
                          />
                          <span>{roleType?.name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getConfidenceBadge(mapping.confidence)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            mapping.mappingSource === 'ai-suggested'
                              ? 'border-purple-200 text-purple-700'
                              : ''
                          }
                        >
                          {mapping.mappingSource === 'manual' && (
                            <Users className="h-3 w-3 mr-1" />
                          )}
                          {mapping.mappingSource === 'ai-suggested' && (
                            <Wand2 className="h-3 w-3 mr-1" />
                          )}
                          {mapping.mappingSource.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{usageCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(mapping)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(mapping.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mapping Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMapping ? 'Edit Mapping' : 'Create New Mapping'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Title</label>
              <Input
                value={formData.jobTitle}
                onChange={e => handleInputChange('jobTitle', e.target.value)}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role Type</label>
              <Select
                value={formData.roleTypeId}
                onValueChange={value => handleInputChange('roleTypeId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role type" />
                </SelectTrigger>
                <SelectContent>
                  {roleTypes
                    .filter(rt => rt.isActive)
                    .map(roleType => (
                      <SelectItem key={roleType.id} value={roleType.id}>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: roleType.color }}
                          />
                          <span>{roleType.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {ROLE_TYPE_CATEGORIES[roleType.category].label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <Wand2 className="h-4 w-4 mr-2" />
                  AI Suggestions
                </label>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.roleTypeId}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleApplySuggestion(suggestion)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {suggestion.roleTypeName}
                          </span>
                          {getConfidenceBadge(suggestion.confidence)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {suggestion.reasoning}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Apply
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Confidence</label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.confidence}
                  onChange={e =>
                    handleInputChange('confidence', parseFloat(e.target.value))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Source</label>
                <Select
                  value={formData.mappingSource}
                  onValueChange={value =>
                    handleInputChange('mappingSource', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="ai-suggested">AI Suggested</SelectItem>
                    <SelectItem value="import-default">
                      Import Default
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={formData.notes}
                onChange={e => handleInputChange('notes', e.target.value)}
                placeholder="Additional context about this mapping"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingMapping ? 'Update' : 'Create'} Mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-mapping Dialog */}
      <AlertDialog
        open={isAutoMappingDialogOpen}
        onOpenChange={setIsAutoMappingDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Auto-Map Job Titles</AlertDialogTitle>
            <AlertDialogDescription>
              This will automatically map {unmappedJobTitles.length} unmapped
              job titles to role types using AI suggestions. Only mappings with
              confidence ≥70% will be created.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAutoMapping}>
              Auto-Map Titles
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mapping</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this mapping? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoleTypeMappingTable;
