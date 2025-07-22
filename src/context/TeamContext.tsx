import React, { createContext, useContext, ReactNode } from 'react';
import {
  useEncryptedLocalStorage,
  useLocalStorage,
} from '@/hooks/useLocalStorage';
import {
  Person,
  Role,
  Team,
  TeamMember,
  Division,
  UnmappedPerson,
} from '@/types';

interface TeamContextType {
  people: Person[];
  setPeople: (people: Person[] | ((prev: Person[]) => Person[])) => void;
  addPerson: (personData: Omit<Person, 'id'>) => void;
  updatePerson: (personId: string, personData: Partial<Person>) => void;
  roles: Role[];
  setRoles: (roles: Role[] | ((prev: Role[]) => Role[])) => void;
  teams: Team[];
  setTeams: (teams: Team[] | ((prev: Team[]) => Team[])) => void;
  addTeam: (
    teamData: Omit<Team, 'id' | 'createdDate' | 'lastModified'>
  ) => void;
  updateTeam: (teamId: string, teamData: Partial<Team>) => void;
  deleteTeam: (teamId: string) => void;
  teamMembers: TeamMember[];
  setTeamMembers: (
    teamMembers: TeamMember[] | ((prev: TeamMember[]) => TeamMember[])
  ) => void;
  addTeamMember: (teamMemberData: Omit<TeamMember, 'id'>) => void;
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
  const [people, setPeople] = useEncryptedLocalStorage<Person[]>(
    'planning-people',
    []
  );
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

  const addPerson = (personData: Omit<Person, 'id'>) => {
    const newPerson: Person = {
      ...personData,
      id: crypto.randomUUID(),
    };
    setPeople(prevPeople => [...prevPeople, newPerson]);
  };

  const updatePerson = (personId: string, personData: Partial<Person>) => {
    setPeople(prevPeople =>
      prevPeople.map(person =>
        person.id === personId ? { ...person, ...personData } : person
      )
    );
  };

  const addTeam = (
    teamData: Omit<Team, 'id' | 'createdDate' | 'lastModified'>
  ) => {
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

  const addTeamMember = (teamMemberData: Omit<TeamMember, 'id'>) => {
    const newTeamMember: TeamMember = {
      ...teamMemberData,
      id: crypto.randomUUID(),
    };
    setTeamMembers(prev => [...prev, newTeamMember]);
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

  const value: TeamContextType = {
    people,
    setPeople,
    addPerson,
    updatePerson,
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
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};
