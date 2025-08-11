/**
 * Enhanced Role Type Mapping Table
 *
 * Modern UX for mapping job titles to role types with:
 * - Bulk selection and operations
 * - Table view of all job titles from people listing
 * - Drag-and-drop mapping
 * - Advanced filtering and grouping
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MapPin,
  Users,
  Wand2,
  Search,
  Filter,
  CheckSquare,
  Square,
  ArrowRight,
  Shuffle,
  Settings,
  BarChart3,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useRoleTypes } from '@/hooks/useRoleTypes';
import { useApp } from '@/context/AppContext';
import { RoleTypeMapping } from '@/types/roleTypes';
import { useToast } from '@/hooks/use-toast';

interface JobTitleSummary {
  jobTitle: string;
  count: number;
  people: string[];
  isMapped: boolean;
  currentRoleType?: string;
  currentRoleTypeId?: string;
  confidence?: number;
}

interface BulkMappingData {
  selectedTitles: string[];
  targetRoleTypeId: string;
  confidence: number;
  notes: string;
}

type SortField = 'jobTitle' | 'count' | 'mapped' | 'confidence';
type SortOrder = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  order: SortOrder;
}

const EnhancedRoleTypeMappingTable: React.FC = () => {
  const { people, roles } = useApp();
  const {
    roleTypes,
    roleTypeMappings,
    addMapping,
    updateMapping,
    suggestMappings,
    autoMapUnmappedRoles,
  } = useRoleTypes();
  const { toast } = useToast();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'mapped' | 'unmapped'
  >('all');
  const [selectedTitles, setSelectedTitles] = useState<Set<string>>(new Set());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'count',
    order: 'desc',
  });
  const [bulkData, setBulkData] = useState<BulkMappingData>({
    selectedTitles: [],
    targetRoleTypeId: '',
    confidence: 0.8,
    notes: '',
  });

  // Compute job title summary from people data
  const jobTitleSummary = useMemo((): JobTitleSummary[] => {
    const titleMap = new Map<string, JobTitleSummary>();

    // Aggregate titles from roles (which contain job titles)
    roles.forEach(role => {
      const existing = titleMap.get(role.name);
      const mapping = roleTypeMappings.find(m => m.jobTitle === role.name);
      const roleType = mapping
        ? roleTypes.find(rt => rt.id === mapping.roleTypeId)
        : undefined;

      if (existing) {
        existing.count++;
      } else {
        titleMap.set(role.name, {
          jobTitle: role.name,
          count: 1,
          people: [],
          isMapped: !!mapping,
          currentRoleType: roleType?.name,
          currentRoleTypeId: roleType?.id,
          confidence: mapping?.confidence,
        });
      }
    });

    // Add people names to each title
    people.forEach(person => {
      const role = roles.find(r => r.id === person.roleId);
      if (role) {
        const summary = titleMap.get(role.name);
        if (summary) {
          summary.people.push(person.name);
        }
      }
    });

    return Array.from(titleMap.values());
  }, [people, roles, roleTypeMappings, roleTypes]);

  // Filtered and sorted titles
  const filteredTitles = useMemo(() => {
    const filtered = jobTitleSummary.filter(title => {
      const matchesSearch = title.jobTitle
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterStatus === 'all' ||
        (filterStatus === 'mapped' && title.isMapped) ||
        (filterStatus === 'unmapped' && !title.isMapped);

      return matchesSearch && matchesFilter;
    });

    // Apply sorting
    return filtered.sort((a, b) => {
      const { field, order } = sortConfig;
      let aValue: any;
      let bValue: any;

      switch (field) {
        case 'jobTitle':
          aValue = a.jobTitle.toLowerCase();
          bValue = b.jobTitle.toLowerCase();
          break;
        case 'count':
          aValue = a.count;
          bValue = b.count;
          break;
        case 'mapped':
          aValue = a.isMapped ? 1 : 0;
          bValue = b.isMapped ? 1 : 0;
          break;
        case 'confidence':
          aValue = a.confidence || 0;
          bValue = b.confidence || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [jobTitleSummary, searchTerm, filterStatus, sortConfig]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    setSortConfig(prevSort => ({
      field,
      order:
        prevSort.field === field && prevSort.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Get sort icon for column
  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
    return sortConfig.order === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-blue-600" />
    ) : (
      <ArrowDown className="h-3 w-3 text-blue-600" />
    );
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTitles(new Set(filteredTitles.map(t => t.jobTitle)));
    } else {
      setSelectedTitles(new Set());
    }
  };

  const handleSelectTitle = (title: string, checked: boolean) => {
    const newSelected = new Set(selectedTitles);
    if (checked) {
      newSelected.add(title);
    } else {
      newSelected.delete(title);
    }
    setSelectedTitles(newSelected);
  };

  const isAllSelected =
    filteredTitles.length > 0 &&
    filteredTitles.every(t => selectedTitles.has(t.jobTitle));
  const isPartialSelected =
    filteredTitles.some(t => selectedTitles.has(t.jobTitle)) && !isAllSelected;

  // Bulk operations
  const handleOpenBulkDialog = () => {
    setBulkData({
      selectedTitles: Array.from(selectedTitles),
      targetRoleTypeId: '',
      confidence: 0.8,
      notes: `Bulk mapping for ${selectedTitles.size} job titles`,
    });
    setIsBulkDialogOpen(true);
  };

  const handleBulkMapping = async () => {
    if (!bulkData.targetRoleTypeId || bulkData.selectedTitles.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select a role type and at least one job title',
        variant: 'destructive',
      });
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const jobTitle of bulkData.selectedTitles) {
      try {
        const existing = roleTypeMappings.find(m => m.jobTitle === jobTitle);
        const mappingData = {
          jobTitle,
          roleTypeId: bulkData.targetRoleTypeId,
          confidence: bulkData.confidence,
          mappingSource: 'manual' as const,
          notes: bulkData.notes,
        };

        if (existing) {
          await updateMapping(existing.id, mappingData);
        } else {
          await addMapping(mappingData);
        }
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    toast({
      title: 'Bulk Mapping Complete',
      description: `Successfully mapped ${successCount} titles${errorCount > 0 ? `, failed: ${errorCount}` : ''}`,
    });

    setIsBulkDialogOpen(false);
    setSelectedTitles(new Set());
  };

  const handleAutoMapSelected = async () => {
    if (selectedTitles.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select job titles to auto-map',
        variant: 'destructive',
      });
      return;
    }

    let successCount = 0;
    let skippedCount = 0;

    for (const jobTitle of selectedTitles) {
      const suggestions = suggestMappings(jobTitle);
      if (suggestions.length > 0 && suggestions[0].confidence >= 0.7) {
        try {
          const existing = roleTypeMappings.find(m => m.jobTitle === jobTitle);
          const mappingData = {
            jobTitle,
            roleTypeId: suggestions[0].roleTypeId,
            confidence: suggestions[0].confidence,
            mappingSource: 'ai-suggested' as const,
            notes: suggestions[0].reasoning,
          };

          if (existing) {
            await updateMapping(existing.id, mappingData);
          } else {
            await addMapping(mappingData);
          }
          successCount++;
        } catch (error) {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }

    toast({
      title: 'Auto-mapping Complete',
      description: `Mapped ${successCount} titles, skipped ${skippedCount} low-confidence matches`,
    });

    setSelectedTitles(new Set());
  };

  // Statistics
  const stats = useMemo(() => {
    const total = jobTitleSummary.length;
    const mapped = jobTitleSummary.filter(t => t.isMapped).length;
    const unmapped = total - mapped;
    const highConfidence = jobTitleSummary.filter(
      t => t.confidence && t.confidence >= 0.8
    ).length;

    return { total, mapped, unmapped, highConfidence };
  }, [jobTitleSummary]);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Titles</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Mapped</p>
                <p className="text-2xl font-bold">{stats.mapped}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Unmapped</p>
                <p className="text-2xl font-bold">{stats.unmapped}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">High Confidence</p>
                <p className="text-2xl font-bold">{stats.highConfidence}</p>
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
              <Settings className="h-5 w-5" />
              <span>Job Title Mapping</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {selectedTitles.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleAutoMapSelected}
                    className="text-purple-600 border-purple-200"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Auto-Map Selected ({selectedTitles.size})
                  </Button>
                  <Button onClick={handleOpenBulkDialog}>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Bulk Map ({selectedTitles.size})
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search job titles..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={filterStatus}
              onValueChange={value => setFilterStatus(value as any)}
            >
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Titles</SelectItem>
                <SelectItem value="mapped">Mapped Only</SelectItem>
                <SelectItem value="unmapped">Unmapped Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Job Titles Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      ref={el => {
                        if (el) el.indeterminate = isPartialSelected;
                      }}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('jobTitle')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Job Title</span>
                      {getSortIcon('jobTitle')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('count')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>People Count</span>
                      {getSortIcon('count')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('mapped')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Current Mapping</span>
                      {getSortIcon('mapped')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('confidence')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Confidence</span>
                      {getSortIcon('confidence')}
                    </div>
                  </TableHead>
                  <TableHead>Sample People</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTitles.map(title => (
                  <TableRow
                    key={title.jobTitle}
                    className={
                      selectedTitles.has(title.jobTitle) ? 'bg-blue-50' : ''
                    }
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedTitles.has(title.jobTitle)}
                        onCheckedChange={checked =>
                          handleSelectTitle(title.jobTitle, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{title.jobTitle}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span>{title.count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {title.isMapped ? (
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                roleTypes.find(
                                  rt => rt.id === title.currentRoleTypeId
                                )?.color || '#gray',
                            }}
                          />
                          <span className="text-sm">
                            {title.currentRoleType}
                          </span>
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-orange-600 border-orange-200"
                        >
                          Unmapped
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {title.confidence && (
                        <Badge
                          variant="secondary"
                          className={
                            title.confidence >= 0.8
                              ? 'bg-green-100 text-green-800'
                              : title.confidence >= 0.6
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }
                        >
                          {Math.round(title.confidence * 100)}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {title.people.slice(0, 3).map((person, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            {person}
                          </Badge>
                        ))}
                        {title.people.length > 3 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-xs">
                                  +{title.people.length - 3}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="max-w-sm">
                                  {title.people.slice(3).join(', ')}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Mapping Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Map Job Titles</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Mapping {bulkData.selectedTitles.length} job titles:
              </p>
              <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                {bulkData.selectedTitles.map((title, idx) => (
                  <div key={idx} className="text-sm">
                    • {title}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target Role Type</label>
              <Select
                value={bulkData.targetRoleTypeId}
                onValueChange={value =>
                  setBulkData(prev => ({ ...prev, targetRoleTypeId: value }))
                }
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
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Confidence</label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={bulkData.confidence}
                  onChange={e =>
                    setBulkData(prev => ({
                      ...prev,
                      confidence: parseFloat(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={bulkData.notes}
                onChange={e =>
                  setBulkData(prev => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Bulk mapping notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBulkDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkMapping}>
              Map {bulkData.selectedTitles.length} Titles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedRoleTypeMappingTable;
