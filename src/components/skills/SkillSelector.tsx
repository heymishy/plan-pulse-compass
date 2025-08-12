import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Skill, SkillCategory } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus } from 'lucide-react';

interface SkillSelectorProps {
  selectedSkillIds: string[];
  onSkillsChange: (skillIds: string[]) => void;
  label?: string;
}

const skillCategories: { value: SkillCategory; label: string }[] = [
  { value: 'programming-language', label: 'Programming Language' },
  { value: 'framework', label: 'Framework' },
  { value: 'platform', label: 'Platform' },
  { value: 'domain-knowledge', label: 'Domain Knowledge' },
  { value: 'methodology', label: 'Methodology' },
  { value: 'tool', label: 'Tool' },
  { value: 'other', label: 'Other' },
];

const SkillSelector: React.FC<SkillSelectorProps> = ({
  selectedSkillIds,
  onSkillsChange,
  label = 'Skills',
}) => {
  const { skills, setSkills } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] =
    useState<SkillCategory>('other');
  const [showAddForm, setShowAddForm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedSkills = skills.filter(skill =>
    selectedSkillIds.includes(skill.id)
  );

  const filteredSkills = skills.filter(
    skill =>
      !selectedSkillIds.includes(skill.id) &&
      skill.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exactMatch = skills.find(
    skill => skill.name.toLowerCase() === searchTerm.toLowerCase()
  );

  const handleSkillSelect = (skillId: string) => {
    onSkillsChange([...selectedSkillIds, skillId]);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const handleSkillRemove = (skillId: string) => {
    onSkillsChange(selectedSkillIds.filter(id => id !== skillId));
  };

  const handleCreateSkill = () => {
    if (!newSkillName.trim()) return;

    const newSkill: Skill = {
      id: crypto.randomUUID(),
      name: newSkillName.trim(),
      category: newSkillCategory,
      createdDate: new Date().toISOString(),
    };

    setSkills(prev => [...prev, newSkill]);
    onSkillsChange([...selectedSkillIds, newSkill.id]);

    setNewSkillName('');
    setShowAddForm(false);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  useEffect(() => {
    if (searchTerm && !exactMatch && filteredSkills.length === 0) {
      setNewSkillName(searchTerm);
      setShowAddForm(true);
    } else {
      setShowAddForm(false);
    }
  }, [searchTerm, exactMatch, filteredSkills.length]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {/* Selected Skills */}
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedSkills.map(skill => (
            <Badge key={skill.id} variant="secondary" className="text-sm">
              {skill.name}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={() => handleSkillRemove(skill.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder="Search or add skills..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && (searchTerm || filteredSkills.length > 0) && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
            {/* Skills count indicator */}
            {filteredSkills.length > 0 && (
              <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                {filteredSkills.length} skill
                {filteredSkills.length !== 1 ? 's' : ''} found
                {searchTerm && ` for "${searchTerm}"`}
              </div>
            )}

            {/* Existing Skills */}
            {filteredSkills.slice(0, 50).map(skill => (
              <button
                key={skill.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between"
                onClick={() => handleSkillSelect(skill.id)}
              >
                <span>{skill.name}</span>
                <Badge variant="outline" className="text-xs">
                  {
                    skillCategories.find(cat => cat.value === skill.category)
                      ?.label
                  }
                </Badge>
              </button>
            ))}

            {/* Show more indicator if truncated */}
            {filteredSkills.length > 50 && (
              <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-t">
                Showing first 50 skills. Continue typing to narrow results.
              </div>
            )}

            {/* Add New Skill Option */}
            {showAddForm && (
              <div className="border-t p-3 bg-gray-50">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Add "{newSkillName}"
                    </span>
                  </div>
                  <Select
                    value={newSkillCategory}
                    onValueChange={(value: SkillCategory) =>
                      setNewSkillCategory(value)
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {skillCategories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateSkill}
                    className="w-full"
                  >
                    Add Skill
                  </Button>
                </div>
              </div>
            )}

            {filteredSkills.length === 0 && !showAddForm && searchTerm && (
              <div className="px-3 py-2 text-gray-500 text-sm">
                No skills found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillSelector;
