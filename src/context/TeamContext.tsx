import React, { createContext, useContext, ReactNode } from 'react';
import {
  useEncryptedLocalStorage,
  useLocalStorage,
} from '@/hooks/useLocalStorage';
import { useLargeDatasetStorage } from '@/hooks/useLargeDatasetStorage';
import {
  Person,
  Role,
  Team,
  TeamMember,
  Division,
  UnmappedPerson,
  DivisionLeadershipRole,
} from '@/types';

interface TeamContextType {
  people: Person[];
  setPeople: (people: Person[] | ((prev: Person[]) => Person[])) => void;
  addPerson: (personData: Omit<Person, 'id'>) => Promise<Person>;
  updatePerson: (
    personId: string,
    personData: Partial<Person>
  ) => Promise<void>;
  deletePerson: (personId: string) => Promise<void>;
  isPeopleLoading: boolean;
  peopleError: string | null;
  peopleStorageStats: {
    isChunked: boolean;
    chunkCount: number;
    totalSize: number;
    compressionRatio: number;
  };
  roles: Role[];
  setRoles: (roles: Role[] | ((prev: Role[]) => Role[])) => void;
  teams: Team[];
  setTeams: (teams: Team[] | ((prev: Team[]) => Team[])) => void;
  addTeam: (
    teamData: Omit<Team, 'id' | 'createdDate' | 'lastModified'>
  ) => Team;
  updateTeam: (teamId: string, teamData: Partial<Team>) => void;
  deleteTeam: (teamId: string) => void;
  teamMembers: TeamMember[];
  setTeamMembers: (
    teamMembers: TeamMember[] | ((prev: TeamMember[]) => TeamMember[])
  ) => void;
  addTeamMember: (teamMemberData: Omit<TeamMember, 'id'>) => TeamMember;
  updateTeamMember: (
    teamMemberId: string,
    teamMemberData: Partial<TeamMember>
  ) => void;
  removeTeamMember: (teamMemberId: string) => void;
  getTeamMembers: (teamId: string) => TeamMember[];
  divisions: Division[];
  setDivisions: (
    divisions: Division[] | ((prev: Division[]) => Division[])
  ) => void;
  unmappedPeople: UnmappedPerson[];
  setUnmappedPeople: (
    people: UnmappedPerson[] | ((prev: UnmappedPerson[]) => UnmappedPerson[])
  ) => void;
  addUnmappedPerson: (
    personData: Omit<UnmappedPerson, 'id' | 'importedDate'>
  ) => void;
  removeUnmappedPerson: (personId: string) => void;
  divisionLeadershipRoles: DivisionLeadershipRole[];
  setDivisionLeadershipRoles: (
    roles:
      | DivisionLeadershipRole[]
      | ((prev: DivisionLeadershipRole[]) => DivisionLeadershipRole[])
  ) => void;
  addDivisionLeadershipRole: (
    roleData: Omit<DivisionLeadershipRole, 'id'>
  ) => DivisionLeadershipRole;
  updateDivisionLeadershipRole: (
    roleId: string,
    roleData: Partial<DivisionLeadershipRole>
  ) => void;
  removeDivisionLeadershipRole: (roleId: string) => void;
  getDivisionLeadershipRoles: (personId: string) => DivisionLeadershipRole[];
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const useTeams = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeams must be used within a TeamProvider');
  }
  return context;
};

export const TeamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [people, setPeople, isPeopleLoading, peopleError, peopleStats] =
    useLargeDatasetStorage<Person>('planning-people', []);
  const [roles, setRoles] = useLocalStorage<Role[]>('planning-roles', []);
  const [teams, setTeams] = useLocalStorage<Team[]>('planning-teams', []);
  const [divisions, setDivisions] = useLocalStorage<Division[]>(
    'planning-divisions',
    []
  );
  const [unmappedPeople, setUnmappedPeople] = useLocalStorage<UnmappedPerson[]>(
    'planning-unmapped-people',
    []
  );
  const [teamMembers, setTeamMembers] = useLocalStorage<TeamMember[]>(
    'planning-team-members',
    []
  );
  const [divisionLeadershipRoles, setDivisionLeadershipRoles] = useLocalStorage<
    DivisionLeadershipRole[]
  >('planning-division-leadership-roles', []);

  const addPerson = async (personData: Omit<Person, 'id'>): Promise<Person> => {
    const newPerson: Person = {
      ...personData,
      id: crypto.randomUUID(),
    };
    await setPeople(prevPeople => [...prevPeople, newPerson]);
    return newPerson;
  };

  const updatePerson = async (
    personId: string,
    personData: Partial<Person>
  ): Promise<void> => {
    await setPeople(prevPeople =>
      prevPeople.map(person =>
        person.id === personId ? { ...person, ...personData } : person
      )
    );
  };

  const deletePerson = async (personId: string): Promise<void> => {
    await setPeople(prevPeople =>
      prevPeople.filter(person => person.id !== personId)
    );
  };

  const addTeam = (
    teamData: Omit<Team, 'id' | 'createdDate' | 'lastModified'>
  ): Team => {
    const now = new Date().toISOString();
    const newTeam: Team = {
      ...teamData,
      id: crypto.randomUUID(),
      createdDate: now,
      lastModified: now,
      type: teamData.type || 'permanent',
      status: teamData.status || 'active',
      targetSkills: teamData.targetSkills || [],
      projectIds: teamData.projectIds || [],
    };
    setTeams(prevTeams => [...prevTeams, newTeam]);
    return newTeam;
  };

  const updateTeam = (teamId: string, teamData: Partial<Team>) => {
    setTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId
          ? { ...team, ...teamData, lastModified: new Date().toISOString() }
          : team
      )
    );
  };

  const deleteTeam = (teamId: string) => {
    setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
  };

  const addUnmappedPerson = (
    personData: Omit<UnmappedPerson, 'id' | 'importedDate'>
  ) => {
    const newPerson: UnmappedPerson = {
      ...personData,
      id: crypto.randomUUID(),
      importedDate: new Date().toISOString(),
    };
    setUnmappedPeople(prev => [...prev, newPerson]);
  };

  const removeUnmappedPerson = (personId: string) => {
    setUnmappedPeople(prev => prev.filter(person => person.id !== personId));
  };

  const addTeamMember = (
    teamMemberData: Omit<TeamMember, 'id'>
  ): TeamMember => {
    const newTeamMember: TeamMember = {
      ...teamMemberData,
      id: crypto.randomUUID(),
    };
    setTeamMembers(prev => [...prev, newTeamMember]);
    return newTeamMember;
  };

  const updateTeamMember = (
    teamMemberId: string,
    teamMemberData: Partial<TeamMember>
  ) => {
    setTeamMembers(prev =>
      prev.map(member =>
        member.id === teamMemberId ? { ...member, ...teamMemberData } : member
      )
    );
  };

  const removeTeamMember = (teamMemberId: string) => {
    setTeamMembers(prev => prev.filter(member => member.id !== teamMemberId));
  };

  const getTeamMembers = (teamId: string) => {
    return teamMembers.filter(
      member => member.teamId === teamId && member.isActive
    );
  };

  const addDivisionLeadershipRole = (
    roleData: Omit<DivisionLeadershipRole, 'id'>
  ): DivisionLeadershipRole => {
    const newRole: DivisionLeadershipRole = {
      ...roleData,
      id: crypto.randomUUID(),
    };
    setDivisionLeadershipRoles(prev => [...prev, newRole]);
    return newRole;
  };

  const updateDivisionLeadershipRole = (
    roleId: string,
    roleData: Partial<DivisionLeadershipRole>
  ) => {
    setDivisionLeadershipRoles(prev =>
      prev.map(role => (role.id === roleId ? { ...role, ...roleData } : role))
    );
  };

  const removeDivisionLeadershipRole = (roleId: string) => {
    setDivisionLeadershipRoles(prev => prev.filter(role => role.id !== roleId));
  };

  const getDivisionLeadershipRoles = (personId: string) => {
    return divisionLeadershipRoles.filter(
      role => role.personId === personId && role.isActive
    );
  };

  const value: TeamContextType = {
    people,
    setPeople,
    addPerson,
    updatePerson,
    deletePerson,
    isPeopleLoading,
    peopleError,
    peopleStorageStats: peopleStats,
    roles,
    setRoles,
    teams,
    setTeams,
    addTeam,
    updateTeam,
    deleteTeam,
    teamMembers,
    setTeamMembers,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
    getTeamMembers,
    divisions,
    setDivisions,
    unmappedPeople,
    setUnmappedPeople,
    addUnmappedPerson,
    removeUnmappedPerson,
    divisionLeadershipRoles,
    setDivisionLeadershipRoles,
    addDivisionLeadershipRole,
    updateDivisionLeadershipRole,
    removeDivisionLeadershipRole,
    getDivisionLeadershipRoles,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};
