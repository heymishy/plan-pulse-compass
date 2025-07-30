import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Skill, PersonSkill } from '@/types';

interface SkillsContextType {
  skills: Skill[];
  setSkills: (skills: Skill[] | ((prev: Skill[]) => Skill[])) => void;
  personSkills: PersonSkill[];
  setPersonSkills: (
    personSkills: PersonSkill[] | ((prev: PersonSkill[]) => PersonSkill[])
  ) => void;
  addSkill: (skillData: Omit<Skill, 'id' | 'createdDate'>) => Skill;
  updateSkill: (skillId: string, skillData: Partial<Skill>) => void;
  deleteSkill: (skillId: string) => void;
  addPersonSkill: (personSkillData: Omit<PersonSkill, 'id'>) => PersonSkill;
  updatePersonSkill: (
    personSkillId: string,
    personSkillData: Partial<PersonSkill>
  ) => void;
  deletePersonSkill: (personSkillId: string) => void;
  getPersonSkills: (personId: string) => PersonSkill[];
}

const SkillsContext = createContext<SkillsContextType | undefined>(undefined);

export const useSkills = () => {
  const context = useContext(SkillsContext);
  if (context === undefined) {
    throw new Error('useSkills must be used within a SkillsProvider');
  }
  return context;
};

export const SkillsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [skills, setSkills] = useLocalStorage<Skill[]>('planning-skills', []);
  const [personSkills, setPersonSkills] = useLocalStorage<PersonSkill[]>(
    'planning-person-skills',
    []
  );

  const addSkill = (skillData: Omit<Skill, 'id' | 'createdDate'>): Skill => {
    const newSkill: Skill = {
      id: crypto.randomUUID(),
      ...skillData,
      createdDate: new Date().toISOString(),
    };

    setSkills(prev => [...prev, newSkill]);
    return newSkill;
  };

  const updateSkill = (skillId: string, skillData: Partial<Skill>): void => {
    setSkills(prev =>
      prev.map(skill =>
        skill.id === skillId ? { ...skill, ...skillData } : skill
      )
    );
  };

  const deleteSkill = (skillId: string): void => {
    // Remove the skill
    setSkills(prev => prev.filter(skill => skill.id !== skillId));

    // Remove all person skills that reference this skill
    setPersonSkills(prev => prev.filter(ps => ps.skillId !== skillId));
  };

  const addPersonSkill = (
    personSkillData: Omit<PersonSkill, 'id'>
  ): PersonSkill => {
    const newPersonSkill: PersonSkill = {
      id: crypto.randomUUID(),
      ...personSkillData,
    };

    setPersonSkills(prev => [...prev, newPersonSkill]);
    return newPersonSkill;
  };

  const updatePersonSkill = (
    personSkillId: string,
    personSkillData: Partial<PersonSkill>
  ): void => {
    setPersonSkills(prev =>
      prev.map(ps =>
        ps.id === personSkillId ? { ...ps, ...personSkillData } : ps
      )
    );
  };

  const deletePersonSkill = (personSkillId: string): void => {
    setPersonSkills(prev => prev.filter(ps => ps.id !== personSkillId));
  };

  const getPersonSkills = (personId: string): PersonSkill[] => {
    return personSkills.filter(ps => ps.personId === personId);
  };

  const value: SkillsContextType = {
    skills,
    setSkills,
    personSkills,
    setPersonSkills,
    addSkill,
    updateSkill,
    deleteSkill,
    addPersonSkill,
    updatePersonSkill,
    deletePersonSkill,
    getPersonSkills,
  };

  return (
    <SkillsContext.Provider value={value}>{children}</SkillsContext.Provider>
  );
};
