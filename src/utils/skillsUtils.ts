import { Skill } from '@/types';

/**
 * Skills utilities for consistent skill handling across the application
 */

/**
 * Get skill names from skill IDs
 * @param skillIds Array of skill IDs
 * @param skills Array of available skills
 * @returns Array of skill names
 */
export const getSkillNames = (
  skillIds: string[],
  skills: Skill[]
): string[] => {
  if (!skillIds || !skills) return [];

  return skillIds
    .map(skillId => skills.find(skill => skill.id === skillId)?.name)
    .filter((name): name is string => Boolean(name));
};

/**
 * Get skills from skill IDs
 * @param skillIds Array of skill IDs
 * @param skills Array of available skills
 * @returns Array of Skill objects
 */
export const getSkillsFromIds = (
  skillIds: string[],
  skills: Skill[]
): Skill[] => {
  if (!skillIds || !skills) return [];

  return skillIds
    .map(skillId => skills.find(skill => skill.id === skillId))
    .filter((skill): skill is Skill => Boolean(skill));
};

/**
 * Validate that all skill IDs exist in the skills array
 * @param skillIds Array of skill IDs to validate
 * @param skills Array of available skills
 * @returns Object with validation results
 */
export const validateSkillIds = (
  skillIds: string[],
  skills: Skill[]
): {
  isValid: boolean;
  validIds: string[];
  invalidIds: string[];
  missingSkills: string[];
} => {
  if (!skillIds || !skills) {
    return {
      isValid: true,
      validIds: [],
      invalidIds: [],
      missingSkills: [],
    };
  }

  const validIds: string[] = [];
  const invalidIds: string[] = [];
  const missingSkills: string[] = [];

  skillIds.forEach(skillId => {
    const skill = skills.find(s => s.id === skillId);
    if (skill) {
      validIds.push(skillId);
    } else {
      invalidIds.push(skillId);
      missingSkills.push(skillId);
    }
  });

  return {
    isValid: invalidIds.length === 0,
    validIds,
    invalidIds,
    missingSkills,
  };
};

/**
 * Get skills grouped by category
 * @param skillIds Array of skill IDs
 * @param skills Array of available skills
 * @returns Skills grouped by category
 */
export const getSkillsByCategory = (
  skillIds: string[],
  skills: Skill[]
): Record<string, Skill[]> => {
  const skillObjects = getSkillsFromIds(skillIds, skills);

  return skillObjects.reduce(
    (acc, skill) => {
      const category = skill.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    },
    {} as Record<string, Skill[]>
  );
};

/**
 * Filter available skills that are not already selected
 * @param allSkills Array of all available skills
 * @param selectedSkillIds Array of currently selected skill IDs
 * @returns Array of unselected skills
 */
export const getAvailableSkills = (
  allSkills: Skill[],
  selectedSkillIds: string[]
): Skill[] => {
  if (!allSkills) return [];
  if (!selectedSkillIds || selectedSkillIds.length === 0) return allSkills;

  return allSkills.filter(skill => !selectedSkillIds.includes(skill.id));
};
