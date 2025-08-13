import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Person } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import VirtualizedTable from '@/components/ui/VirtualizedTable';
import {
  calculatePersonCost,
  getDefaultConfig,
} from '@/utils/financialCalculations';

interface OptimizedPeopleTableProps {
  people: Person[];
  onEditPerson: (personId: string) => void;
  searchTerm?: string;
  filters?: {
    roleId: string;
    teamId: string;
    divisionId: string;
    status: string;
  };
}

// Memoized row component to prevent unnecessary re-renders
const PersonRow = React.memo<{
  person: Person;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  teamName?: string;
  roleName?: string;
  cost: number;
  style: React.CSSProperties;
}>(
  ({
    person,
    isSelected,
    onSelect,
    onEdit,
    onDelete,
    teamName,
    roleName,
    cost,
    style,
  }) => {
    return (
      <div
        style={style}
        className="flex items-center px-4 py-2 border-b hover:bg-gray-50"
      >
        <div className="flex-none w-8">
          <Checkbox
            checked={isSelected}
            onCheckedChange={checked => onSelect(person.id, checked as boolean)}
          />
        </div>

        <div className="flex-1 min-w-0 px-2">
          <div className="font-medium truncate">{person.name}</div>
        </div>

        <div className="flex-1 min-w-0 px-2">
          <span className="text-sm text-gray-600 truncate">
            {roleName || 'No Role'}
          </span>
        </div>

        <div className="flex-1 min-w-0 px-2">
          <span className="text-sm text-gray-600 truncate">
            {teamName || 'No Team'}
          </span>
        </div>

        <div className="flex-none w-20 px-2">
          <Badge variant={person.isActive ? 'default' : 'secondary'}>
            {person.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="flex-none w-24 px-2 text-right">
          <span className="text-sm font-medium">${cost.toLocaleString()}</span>
        </div>

        <div className="flex-none w-24 flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(person.id)}
            className="h-8 w-8 p-0"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(person.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
);

PersonRow.displayName = 'PersonRow';

const OptimizedPeopleTable: React.FC<OptimizedPeopleTableProps> = ({
  people,
  onEditPerson,
  searchTerm = '',
  filters = {
    roleId: 'all',
    teamId: 'all',
    divisionId: 'all',
    status: 'all',
  },
}) => {
  const { setPeople, teams, roles, divisions, config } = useApp();
  const { toast } = useToast();
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set());

  // Debounce search to prevent excessive filtering
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Memoized team/role/division lookups to prevent recalculation
  const lookupMaps = useMemo(
    () => ({
      teams: new Map(teams.map(t => [t.id, t])),
      roles: new Map(roles.map(r => [r.id, r])),
      divisions: new Map(divisions.map(d => [d.id, d])),
    }),
    [teams, roles, divisions]
  );

  // Memoized filtered people with optimized filtering
  const filteredPeople = useMemo(() => {
    if (!people.length) return [];

    return people.filter(person => {
      // Search filter
      if (
        debouncedSearch &&
        !person.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      ) {
        return false;
      }

      // Role filter
      if (filters.roleId !== 'all' && person.roleId !== filters.roleId) {
        return false;
      }

      // Team filter
      if (filters.teamId !== 'all' && person.teamId !== filters.teamId) {
        return false;
      }

      // Division filter
      if (filters.divisionId !== 'all') {
        const team = lookupMaps.teams.get(person.teamId || '');
        if (!team || team.divisionId !== filters.divisionId) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all') {
        const isActive = filters.status === 'active';
        if (person.isActive !== isActive) {
          return false;
        }
      }

      return true;
    });
  }, [people, debouncedSearch, filters, lookupMaps]);

  // Memoized person costs to prevent recalculation
  const personCosts = useMemo(() => {
    const costs = new Map<string, number>();
    const safeConfig = config || getDefaultConfig();

    for (const person of filteredPeople) {
      try {
        const cost = calculatePersonCost(person, safeConfig);
        costs.set(person.id, cost);
      } catch (error) {
        console.warn(
          `Failed to calculate cost for person ${person.id}:`,
          error
        );
        costs.set(person.id, 0);
      }
    }

    return costs;
  }, [filteredPeople, config]);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedPeople(new Set(filteredPeople.map(p => p.id)));
      } else {
        setSelectedPeople(new Set());
      }
    },
    [filteredPeople]
  );

  const handleSelectPerson = useCallback(
    (personId: string, checked: boolean) => {
      const newSelected = new Set(selectedPeople);
      if (checked) {
        newSelected.add(personId);
      } else {
        newSelected.delete(personId);
      }
      setSelectedPeople(newSelected);
    },
    [selectedPeople]
  );

  const handleDeletePerson = useCallback(
    (personId: string) => {
      setPeople(prev => prev.filter(p => p.id !== personId));
      setSelectedPeople(prev => {
        const newSet = new Set(prev);
        newSet.delete(personId);
        return newSet;
      });

      toast({
        title: 'Success',
        description: 'Person deleted successfully',
      });
    },
    [setPeople, toast]
  );

  // Render function for virtualized rows
  const renderRow = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const person = filteredPeople[index];
      const team = lookupMaps.teams.get(person.teamId || '');
      const role = lookupMaps.roles.get(person.roleId);
      const cost = personCosts.get(person.id) || 0;

      return (
        <PersonRow
          key={person.id}
          person={person}
          isSelected={selectedPeople.has(person.id)}
          onSelect={handleSelectPerson}
          onEdit={onEditPerson}
          onDelete={handleDeletePerson}
          teamName={team?.name}
          roleName={role?.name}
          cost={cost}
          style={style}
        />
      );
    },
    [
      filteredPeople,
      lookupMaps,
      personCosts,
      selectedPeople,
      handleSelectPerson,
      onEditPerson,
      handleDeletePerson,
    ]
  );

  const selectedCount = selectedPeople.size;
  const totalCount = filteredPeople.length;

  return (
    <div className="space-y-4">
      {/* Header with bulk actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={selectedCount > 0 && selectedCount === totalCount}
            indeterminate={selectedCount > 0 && selectedCount < totalCount}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-gray-600">
            {selectedCount > 0
              ? `${selectedCount} selected`
              : `${totalCount} people`}
          </span>
        </div>

        {selectedCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              // Handle bulk delete
              const toDelete = Array.from(selectedPeople);
              setPeople(prev => prev.filter(p => !toDelete.includes(p.id)));
              setSelectedPeople(new Set());
              toast({
                title: 'Success',
                description: `Deleted ${toDelete.length} people`,
              });
            }}
          >
            Delete Selected ({selectedCount})
          </Button>
        )}
      </div>

      {/* Table header */}
      <div className="flex items-center px-4 py-2 bg-gray-50 border rounded-t-lg font-medium text-sm">
        <div className="flex-none w-8"></div>
        <div className="flex-1 px-2">Name</div>
        <div className="flex-1 px-2">Role</div>
        <div className="flex-1 px-2">Team</div>
        <div className="flex-none w-20 px-2">Status</div>
        <div className="flex-none w-24 px-2 text-right">Annual Cost</div>
        <div className="flex-none w-24">Actions</div>
      </div>

      {/* Virtualized table body */}
      {totalCount > 0 ? (
        <VirtualizedTable
          items={filteredPeople}
          height={600} // Fixed height for virtualization
          itemHeight={60} // Height of each row
          renderItem={renderRow}
          className="border-t-0 rounded-t-none"
        />
      ) : (
        <div className="text-center py-12 text-gray-500">
          No people found matching your criteria
        </div>
      )}
    </div>
  );
};

export default OptimizedPeopleTable;
