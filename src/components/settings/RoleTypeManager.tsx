/**
 * Role Type Manager
 *
 * Comprehensive interface for managing role types, including CRUD operations,
 * rate configuration, and visual customization.
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  DollarSign,
  Users,
  TrendingUp,
  Palette,
  Settings,
} from 'lucide-react';
import { useRoleTypes } from '@/hooks/useRoleTypes';
import {
  RoleType,
  RoleCategory,
  SeniorityLevel,
  RoleTypeRate,
} from '@/types/roleTypes';
import {
  ROLE_TYPE_CATEGORIES,
  DEFAULT_ROLE_TYPE_COLORS,
} from '@/utils/roleTypeUtils';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/currency';

interface RoleTypeFormData {
  name: string;
  category: RoleCategory;
  description: string;
  color: string;
  isActive: boolean;
  rates: {
    junior: RoleTypeRate;
    mid: RoleTypeRate;
    senior: RoleTypeRate;
    lead: RoleTypeRate;
    principal: RoleTypeRate;
  };
}

const emptyFormData: RoleTypeFormData = {
  name: '',
  category: 'engineering',
  description: '',
  color: '#3b82f6',
  isActive: true,
  rates: {
    junior: { annual: 150000, hourly: 96, daily: 769 },
    mid: { annual: 150000, hourly: 96, daily: 769 },
    senior: { annual: 150000, hourly: 96, daily: 769 },
    lead: { annual: 150000, hourly: 96, daily: 769 },
    principal: { annual: 150000, hourly: 96, daily: 769 },
  },
};

const RoleTypeManager: React.FC = () => {
  const {
    roleTypes,
    addRoleType,
    updateRoleType,
    deleteRoleType,
    getRoleTypeStats,
    getMostCommonRoleTypes,
    getNextAvailableColor,
    validateRoleTypeData,
  } = useRoleTypes();
  const { toast } = useToast();

  // State management
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoleType, setEditingRoleType] = useState<RoleType | null>(null);
  const [formData, setFormData] = useState<RoleTypeFormData>(emptyFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    RoleCategory | 'all'
  >('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Statistics
  const stats = useMemo(() => getRoleTypeStats(), [getRoleTypeStats]);
  const popularRoleTypes = useMemo(
    () => getMostCommonRoleTypes(5),
    [getMostCommonRoleTypes]
  );

  // Filtered role types
  const filteredRoleTypes = useMemo(() => {
    return roleTypes.filter(roleType => {
      const matchesSearch =
        roleType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roleType.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || roleType.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [roleTypes, searchTerm, selectedCategory]);

  // Form handlers
  const handleOpenDialog = (roleType?: RoleType) => {
    if (roleType) {
      setEditingRoleType(roleType);
      setFormData({
        name: roleType.name,
        category: roleType.category,
        description: roleType.description || '',
        color: roleType.color,
        isActive: roleType.isActive,
        rates: { ...roleType.defaultRates },
      });
    } else {
      setEditingRoleType(null);
      setFormData({
        ...emptyFormData,
        color: getNextAvailableColor(),
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRoleType(null);
    setFormData(emptyFormData);
  };

  const handleInputChange = (field: keyof RoleTypeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRateChange = (
    seniorityLevel: SeniorityLevel,
    rateType: keyof RoleTypeRate,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      rates: {
        ...prev.rates,
        [seniorityLevel]: {
          ...prev.rates[seniorityLevel],
          [rateType]: numValue,
        },
      },
    }));
  };

  const handleSubmit = () => {
    const roleTypeData = {
      name: formData.name.trim(),
      category: formData.category,
      description: formData.description.trim() || undefined,
      color: formData.color,
      isActive: formData.isActive,
      defaultRates: formData.rates,
    };

    // Validate
    const errors = validateRoleTypeData(roleTypeData);
    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: errors.join('. '),
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingRoleType) {
        updateRoleType(editingRoleType.id, roleTypeData);
        toast({
          title: 'Success',
          description: 'Role type updated successfully',
        });
      } else {
        addRoleType(roleTypeData);
        toast({
          title: 'Success',
          description: 'Role type created successfully',
        });
      }
      handleCloseDialog();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save role type',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (id: string) => {
    try {
      deleteRoleType(id);
      toast({
        title: 'Success',
        description: 'Role type deleted successfully',
      });
      setDeleteConfirmId(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete role type',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Role Types</p>
                <p className="text-2xl font-bold">{stats.totalRoleTypes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Mapping Coverage</p>
                <p className="text-2xl font-bold">
                  {stats.mappingCoverage.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Mapped Roles</p>
                <p className="text-2xl font-bold">{stats.mappedRoles}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Unmapped Roles</p>
                <p className="text-2xl font-bold">{stats.unmappedRoles}</p>
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
              <Palette className="h-5 w-5" />
              <span>Role Type Management</span>
            </CardTitle>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Role Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search role types..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={selectedCategory}
              onValueChange={value => setSelectedCategory(value as any)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(ROLE_TYPE_CATEGORIES).map(
                  ([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Role Types Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rate Range</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoleTypes.map(roleType => {
                  const popularData = popularRoleTypes.find(
                    p => p.roleType.id === roleType.id
                  );
                  const minRate = Math.min(
                    ...Object.values(roleType.defaultRates)
                      .map(rates => rates.annual || 0)
                      .filter(rate => rate > 0)
                  );
                  const maxRate = Math.max(
                    ...Object.values(roleType.defaultRates).map(
                      rates => rates.annual || 0
                    )
                  );

                  return (
                    <TableRow key={roleType.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: roleType.color }}
                          />
                          <div>
                            <div className="font-medium">{roleType.name}</div>
                            {roleType.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {roleType.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ROLE_TYPE_CATEGORIES[roleType.category].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {minRate > 0 && maxRate > 0 ? (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">
                              {formatCurrency(minRate)} -{' '}
                              {formatCurrency(maxRate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            No rates set
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            {popularData?.usage || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={roleType.isActive ? 'default' : 'secondary'}
                        >
                          {roleType.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(roleType)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(roleType.id)}
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

      {/* Role Type Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRoleType ? 'Edit Role Type' : 'Create New Role Type'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="rates">Rate Configuration</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Software Engineer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={value =>
                      handleInputChange('category', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_TYPE_CATEGORIES).map(
                        ([key, { label }]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e =>
                    handleInputChange('description', e.target.value)
                  }
                  placeholder="Brief description of the role type"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={e => handleInputChange('color', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Select
                      value={formData.color}
                      onValueChange={value => handleInputChange('color', value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_ROLE_TYPE_COLORS.map(color => (
                          <SelectItem key={color} value={color}>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              <span>{color}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rates" className="space-y-4">
              <p className="text-sm text-gray-600">
                Set default rates for each seniority level. Default annual
                salary is $150,000. Hourly/daily rates default to $200,000
                equivalent (~$96/hour, ~$769/day based on 260 working days, 8
                hours/day).
              </p>

              {(
                [
                  'junior',
                  'mid',
                  'senior',
                  'lead',
                  'principal',
                ] as SeniorityLevel[]
              ).map(level => (
                <div key={level} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3 capitalize">{level} Level</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Annual Salary</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="number"
                          value={formData.rates[level].annual || ''}
                          onChange={e =>
                            handleRateChange(level, 'annual', e.target.value)
                          }
                          placeholder="0"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Hourly Rate</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="number"
                          value={formData.rates[level].hourly || ''}
                          onChange={e =>
                            handleRateChange(level, 'hourly', e.target.value)
                          }
                          placeholder="0"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Daily Rate</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="number"
                          value={formData.rates[level].daily || ''}
                          onChange={e =>
                            handleRateChange(level, 'daily', e.target.value)
                          }
                          placeholder="0"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e =>
                      handleInputChange('isActive', e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isActive">Active role type</Label>
                </div>

                <p className="text-sm text-gray-600">
                  Inactive role types are hidden from selection lists but
                  existing mappings are preserved.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingRoleType ? 'Update' : 'Create'} Role Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this role type? This action cannot
              be undone, and all associated mappings will be removed.
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

export default RoleTypeManager;
