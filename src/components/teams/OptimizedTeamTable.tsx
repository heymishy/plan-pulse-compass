import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Team } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit2, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import VirtualizedTable from '@/components/ui/VirtualizedTable';
import {
  getTeamMembers,
  getDivisionName,
  calculateEmploymentTypePercentages,
} from '@/utils/teamUtils';

interface OptimizedTeamTableProps {
  teams: Team[];
  onEditTeam: (teamId: string) => void;
  searchTerm?: string;
  selectedDivision?: string;
}

// Memoized team row component
const TeamRow = React.memo<{
  team: Team;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  memberCount: number;
  divisionName: string;
  utilizationPercentage: number;
  style: React.CSSProperties;
}>(
  ({
    team,
    isSelected,
    onSelect,
    onEdit,
    onDelete,
    memberCount,
    divisionName,
    utilizationPercentage,
    style,
  }) => {
    return (
      <div
        style={style}
        className="flex items-center px-4 py-3 border-b hover:bg-gray-50"
      >
        <div className="flex-none w-8">
          <Checkbox
            checked={isSelected}
            onCheckedChange={checked => onSelect(team.id, checked as boolean)}
          />
        </div>

        <div className="flex-1 min-w-0 px-2">
          <div className="font-medium truncate">{team.name}</div>
          <div className="text-sm text-gray-600 truncate">
            {team.description}
          </div>
        </div>

        <div className="flex-none w-24 px-2">
          <Badge variant="outline">{divisionName}</Badge>
        </div>

        <div className="flex-none w-20 px-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">{memberCount}</span>
          </div>
        </div>

        <div className="flex-none w-24 px-2 text-center">
          <span className="text-sm font-medium">{team.capacity}h</span>
        </div>

        <div className="flex-none w-24 px-2">
          <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
            {team.status}
          </Badge>
        </div>

        <div className="flex-none w-20 px-2 text-center">
          <div className="text-sm font-medium">{utilizationPercentage}%</div>
          <div
            className={`h-2 bg-gray-200 rounded-full mt-1 ${utilizationPercentage > 90 ? 'overflow-hidden' : ''}`}
          >
            <div
              className={`h-full rounded-full transition-all ${
                utilizationPercentage > 90
                  ? 'bg-red-500'
                  : utilizationPercentage > 75
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex-none w-24 flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(team.id)}
            className="h-8 w-8 p-0"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(team.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
);

TeamRow.displayName = 'TeamRow';

const OptimizedTeamTable: React.FC<OptimizedTeamTableProps> = ({
  teams,
  onEditTeam,
  searchTerm = '',
  selectedDivision = 'all',
}) => {
  const { people, divisions, setTeams, setPeople, allocations } = useApp();
  const { toast } = useToast();
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());

  // Debounce search term
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Memoized division lookup
  const divisionMap = useMemo(
    () => new Map(divisions.map(d => [d.id, d.name])),
    [divisions]
  );

  // Memoized team data calculations
  const teamData = useMemo(() => {
    return teams.map(team => {
      const members = getTeamMembers(team.id, people);
      const memberCount = members.filter(p => p.isActive).length;
      const divisionName = getDivisionName(team.divisionId, divisions);

      // Calculate utilization based on allocations
      const teamAllocations = allocations.filter(a =>
        members.some(m => m.id === a.personId)
      );
      const totalAllocated = teamAllocations.reduce(
        (sum, a) => sum + (a.percentage || 0),
        0
      );
      const utilizationPercentage = Math.round(
        (totalAllocated / (team.capacity || 1)) * 100
      );

      return {
        ...team,
        memberCount,
        divisionName,
        utilizationPercentage: Math.min(utilizationPercentage, 100),
      };
    });
  }, [teams, people, divisions, allocations]);

  // Memoized filtered teams
  const filteredTeams = useMemo(() => {
    return teamData.filter(team => {
      // Search filter
      if (
        debouncedSearch &&
        !team.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      ) {
        return false;
      }

      // Division filter
      if (selectedDivision !== 'all' && team.divisionId !== selectedDivision) {
        return false;
      }

      return true;
    });
  }, [teamData, debouncedSearch, selectedDivision]);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedTeams(new Set(filteredTeams.map(t => t.id)));
      } else {
        setSelectedTeams(new Set());
      }
    },
    [filteredTeams]
  );

  const handleSelectTeam = useCallback(
    (teamId: string, checked: boolean) => {
      const newSelected = new Set(selectedTeams);
      if (checked) {
        newSelected.add(teamId);
      } else {
        newSelected.delete(teamId);
      }
      setSelectedTeams(newSelected);
    },
    [selectedTeams]
  );

  const handleDeleteTeam = useCallback(
    (teamId: string) => {
      // Remove people from deleted team
      setPeople(prev =>
        prev.map(person =>
          person.teamId === teamId ? { ...person, teamId: undefined } : person
        )
      );

      // Remove team
      setTeams(prev => prev.filter(team => team.id !== teamId));

      setSelectedTeams(prev => {
        const newSet = new Set(prev);
        newSet.delete(teamId);
        return newSet;
      });

      toast({
        title: 'Success',
        description: 'Team deleted successfully',
      });
    },
    [setTeams, setPeople, toast]
  );

  const handleBulkDelete = useCallback(() => {
    const teamsToDelete = Array.from(selectedTeams);

    // Remove people from deleted teams
    setPeople(prev =>
      prev.map(person =>
        teamsToDelete.includes(person.teamId || '')
          ? { ...person, teamId: undefined }
          : person
      )
    );

    // Remove teams
    setTeams(prev => prev.filter(team => !teamsToDelete.includes(team.id)));

    setSelectedTeams(new Set());

    toast({
      title: 'Success',
      description: `Deleted ${teamsToDelete.length} team${teamsToDelete.length !== 1 ? 's' : ''}`,
    });
  }, [selectedTeams, setTeams, setPeople, toast]);

  // Render function for virtualized rows
  const renderRow = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const team = filteredTeams[index];

      return (
        <TeamRow
          key={team.id}
          team={team}
          isSelected={selectedTeams.has(team.id)}
          onSelect={handleSelectTeam}
          onEdit={onEditTeam}
          onDelete={handleDeleteTeam}
          memberCount={team.memberCount}
          divisionName={team.divisionName}
          utilizationPercentage={team.utilizationPercentage}
          style={style}
        />
      );
    },
    [
      filteredTeams,
      selectedTeams,
      handleSelectTeam,
      onEditTeam,
      handleDeleteTeam,
    ]
  );

  const selectedCount = selectedTeams.size;
  const totalCount = filteredTeams.length;

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
              : `${totalCount} teams`}
          </span>
        </div>

        {selectedCount > 0 && (
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            Delete Selected ({selectedCount})
          </Button>
        )}
      </div>

      {/* Table header */}
      <div className="flex items-center px-4 py-2 bg-gray-50 border rounded-t-lg font-medium text-sm">
        <div className="flex-none w-8"></div>
        <div className="flex-1 px-2">Team</div>
        <div className="flex-none w-24 px-2">Division</div>
        <div className="flex-none w-20 px-2 text-center">Members</div>
        <div className="flex-none w-24 px-2 text-center">Capacity</div>
        <div className="flex-none w-24 px-2">Status</div>
        <div className="flex-none w-20 px-2 text-center">Utilization</div>
        <div className="flex-none w-24">Actions</div>
      </div>

      {/* Virtualized table body */}
      {totalCount > 0 ? (
        <VirtualizedTable
          items={filteredTeams}
          height={600} // Fixed height for virtualization
          itemHeight={70} // Height of each row (slightly taller for team data)
          renderItem={renderRow}
          className="border-t-0 rounded-t-none"
        />
      ) : (
        <div className="text-center py-12 text-gray-500">
          No teams found matching your criteria
        </div>
      )}
    </div>
  );
};

export default OptimizedTeamTable;
