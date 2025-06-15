
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PersonSkill } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import SkillSelector from './SkillSelector';

interface PersonSkillsFormProps {
  personId: string;
  personSkills: PersonSkill[];
  onPersonSkillsChange: (personSkills: PersonSkill[]) => void;
}

const proficiencyLevels = [
  { value: 'beginner', label: 'Beginner', color: 'bg-red-100 text-red-800' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'advanced', label: 'Advanced', color: 'bg-blue-100 text-blue-800' },
  { value: 'expert', label: 'Expert', color: 'bg-green-100 text-green-800' },
] as const;

const PersonSkillsForm: React.FC<PersonSkillsFormProps> = ({
  personId,
  personSkills,
  onPersonSkillsChange
}) => {
  const { skills } = useApp();
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSkillIds(personSkills.map(ps => ps.skillId));
  }, [personSkills]);

  const handleSkillsChange = (skillIds: string[]) => {
    // Add new skills
    const newSkillIds = skillIds.filter(id => !selectedSkillIds.includes(id));
    const newPersonSkills = newSkillIds.map(skillId => ({
      id: crypto.randomUUID(),
      personId,
      skillId,
      proficiencyLevel: 'intermediate' as const,
    }));

    // Remove deleted skills
    const removedSkillIds = selectedSkillIds.filter(id => !skillIds.includes(id));
    const updatedPersonSkills = personSkills.filter(ps => !removedSkillIds.includes(ps.skillId));

    onPersonSkillsChange([...updatedPersonSkills, ...newPersonSkills]);
    setSelectedSkillIds(skillIds);
  };

  const updatePersonSkill = (skillId: string, updates: Partial<PersonSkill>) => {
    const updatedPersonSkills = personSkills.map(ps =>
      ps.skillId === skillId ? { ...ps, ...updates } : ps
    );
    onPersonSkillsChange(updatedPersonSkills);
  };

  const getSkillName = (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    return skill?.name || 'Unknown Skill';
  };

  const getProficiencyConfig = (level: string) => {
    return proficiencyLevels.find(p => p.value === level) || proficiencyLevels[1];
  };

  return (
    <div className="space-y-4">
      <SkillSelector
        selectedSkillIds={selectedSkillIds}
        onSkillsChange={handleSkillsChange}
        label="Skills"
      />

      {personSkills.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Skill Details</Label>
          {personSkills.map(personSkill => {
            const proficiencyConfig = getProficiencyConfig(personSkill.proficiencyLevel);
            const isEditing = editingSkillId === personSkill.skillId;

            return (
              <Card key={personSkill.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {getSkillName(personSkill.skillId)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={proficiencyConfig.color}>
                        {proficiencyConfig.label}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSkillId(isEditing ? null : personSkill.skillId)}
                      >
                        {isEditing ? 'Done' : 'Edit'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isEditing && (
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Proficiency Level</Label>
                        <Select
                          value={personSkill.proficiencyLevel}
                          onValueChange={(value) => updatePersonSkill(personSkill.skillId, { 
                            proficiencyLevel: value as PersonSkill['proficiencyLevel'] 
                          })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {proficiencyLevels.map(level => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Years of Experience</Label>
                        <Input
                          type="number"
                          className="h-8"
                          value={personSkill.yearsOfExperience || ''}
                          onChange={(e) => updatePersonSkill(personSkill.skillId, { 
                            yearsOfExperience: e.target.value ? parseInt(e.target.value) : undefined 
                          })}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Last Used</Label>
                      <Input
                        type="date"
                        className="h-8"
                        value={personSkill.lastUsed || ''}
                        onChange={(e) => updatePersonSkill(personSkill.skillId, { 
                          lastUsed: e.target.value || undefined 
                        })}
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Notes</Label>
                      <Textarea
                        className="min-h-[60px]"
                        value={personSkill.notes || ''}
                        onChange={(e) => updatePersonSkill(personSkill.skillId, { 
                          notes: e.target.value || undefined 
                        })}
                        placeholder="Additional notes about this skill..."
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PersonSkillsForm;
