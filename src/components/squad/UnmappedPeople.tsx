import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Download,
  Upload,
  MoreHorizontal,
  Star,
  Clock,
  Target,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { UnmappedPerson, Skill } from '@/types';

interface UnmappedPeopleProps {
  onPersonSelect?: (person: UnmappedPerson) => void;
  onBulkAction?: (action: string, people: UnmappedPerson[]) => void;
  showBulkActions?: boolean;
  maxHeight?: string;
}

const UnmappedPeople: React.FC<UnmappedPeopleProps> = ({
  onPersonSelect,
  onBulkAction,
  showBulkActions = true,
  maxHeight = 'max-h-96',
}) => {
  const {
    unmappedPeople,
    skills,
    roles,
    teams,
    addUnmappedPerson,
    removeUnmappedPerson,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set());
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'name' | 'availability' | 'skills' | 'importDate'
  >('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Sample data generator for demonstration
  const generateSampleData = () => {
    const samplePeople: Omit<UnmappedPerson, 'id' | 'importedDate'>[] = [
      {
        name: 'Alice Johnson',
        email: 'alice.johnson@company.com',
        skills: [
          { skillId: '1', skillName: 'React', proficiency: 'advanced' },
          { skillId: '2', skillName: 'TypeScript', proficiency: 'expert' },
          { skillId: '3', skillName: 'Node.js', proficiency: 'intermediate' },
        ],
        availability: 80,
        joinDate: '2024-01-15',
      },
      {
        name: 'Bob Smith',
        email: 'bob.smith@company.com',
        skills: [
          { skillId: '4', skillName: 'Python', proficiency: 'expert' },
          {
            skillId: '5',
            skillName: 'Machine Learning',
            proficiency: 'advanced',
          },
          { skillId: '6', skillName: 'SQL', proficiency: 'intermediate' },
        ],
        availability: 100,
        joinDate: '2024-02-01',
      },
      {
        name: 'Carol Davis',
        email: 'carol.davis@company.com',
        skills: [
          {
            skillId: '7',
            skillName: 'Product Management',
            proficiency: 'expert',
          },
          { skillId: '8', skillName: 'Agile', proficiency: 'advanced' },
          {
            skillId: '9',
            skillName: 'User Research',
            proficiency: 'intermediate',
          },
        ],
        availability: 60,
        joinDate: '2024-01-20',
      },
    ];

    samplePeople.forEach(person => addUnmappedPerson(person));
  };

  // Filtered and sorted people
  const filteredPeople = useMemo(() => {
    const filtered = unmappedPeople.filter(person => {
      const matchesSearch =
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSkill =
        skillFilter === 'all' ||
        person.skills.some(skill =>
          skill.skillName.toLowerCase().includes(skillFilter.toLowerCase())
        );

      const matchesAvailability =
        availabilityFilter === 'all' ||
        (availabilityFilter === 'high' && person.availability >= 80) ||
        (availabilityFilter === 'medium' &&
          person.availability >= 50 &&
          person.availability < 80) ||
        (availabilityFilter === 'low' && person.availability < 50);

      return matchesSearch && matchesSkill && matchesAvailability;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'availability':
          comparison = a.availability - b.availability;
          break;
        case 'skills':
          comparison = a.skills.length - b.skills.length;
          break;
        case 'importDate':
          comparison =
            new Date(a.importedDate).getTime() -
            new Date(b.importedDate).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [
    unmappedPeople,
    searchTerm,
    skillFilter,
    availabilityFilter,
    sortBy,
    sortOrder,
  ]);

  const handleSelectPerson = (personId: string, selected: boolean) => {
    const newSelection = new Set(selectedPeople);
    if (selected) {
      newSelection.add(personId);
    } else {
      newSelection.delete(personId);
    }
    setSelectedPeople(newSelection);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedPeople(new Set(filteredPeople.map(p => p.id)));
    } else {
      setSelectedPeople(new Set());
    }
  };

  const getAvailabilityColor = (availability: number) => {
    if (availability >= 80) return 'bg-green-500';
    if (availability >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency) {
      case 'expert':
        return 'bg-purple-500';
      case 'advanced':
        return 'bg-blue-500';
      case 'intermediate':
        return 'bg-green-500';
      case 'beginner':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const selectedPeopleData = filteredPeople.filter(p =>
    selectedPeople.has(p.id)
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Unmapped People ({unmappedPeople.length})
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateSampleData}
              disabled={unmappedPeople.length > 0}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Sample Data
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col space-y-3">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search people..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All skills</SelectItem>
                <SelectItem value="react">React</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="product">Product Management</SelectItem>
                <SelectItem value="design">Design</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={availabilityFilter}
              onValueChange={setAvailabilityFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">High (80%+)</SelectItem>
                <SelectItem value="medium">Medium (50-79%)</SelectItem>
                <SelectItem value="low">Low (&lt;50%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedPeople.size === filteredPeople.length &&
                    filteredPeople.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm text-gray-600">
                  Select all ({selectedPeople.size} selected)
                </label>
              </div>

              {showBulkActions && selectedPeople.size > 0 && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onBulkAction?.('assign-to-squad', selectedPeopleData)
                    }
                  >
                    Assign to Squad
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onBulkAction?.('create-squad', selectedPeopleData)
                    }
                  >
                    Create Squad
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <Select
                value={sortBy}
                onValueChange={(value: any) => setSortBy(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="availability">Availability</SelectItem>
                  <SelectItem value="skills">Skills</SelectItem>
                  <SelectItem value="importDate">Import Date</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <div className={`overflow-y-auto ${maxHeight} space-y-3`}>
          {filteredPeople.length === 0 && unmappedPeople.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">No Unmapped People</h3>
              <p className="text-sm mb-4">
                Import people or add sample data to get started
              </p>
              <Button onClick={generateSampleData}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Sample Data
              </Button>
            </div>
          ) : filteredPeople.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">No matches found</h3>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredPeople.map(person => (
              <Card
                key={person.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedPeople.has(person.id)
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : ''
                }`}
                onClick={() => onPersonSelect?.(person)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <Checkbox
                      checked={selectedPeople.has(person.id)}
                      onCheckedChange={checked =>
                        handleSelectPerson(person.id, checked as boolean)
                      }
                      onClick={e => e.stopPropagation()}
                    />

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{person.name}</h4>
                          {person.email && (
                            <p className="text-sm text-gray-600">
                              {person.email}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="secondary"
                            className={`text-white ${getAvailabilityColor(person.availability)}`}
                          >
                            {person.availability}% available
                          </Badge>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {person.skills.slice(0, 4).map(skill => (
                          <Badge
                            key={skill.skillId}
                            variant="outline"
                            className={`text-xs text-white ${getProficiencyColor(skill.proficiency)}`}
                          >
                            {skill.skillName} ({skill.proficiency})
                          </Badge>
                        ))}
                        {person.skills.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{person.skills.length - 4} more
                          </Badge>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <Star className="h-3 w-3 mr-1" />
                            {person.skills.length} skills
                          </div>
                          {person.joinDate && (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Joined{' '}
                              {new Date(person.joinDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Imported{' '}
                          {new Date(person.importedDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnmappedPeople;
