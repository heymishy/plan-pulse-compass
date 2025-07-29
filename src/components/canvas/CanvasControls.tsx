import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building, Users, FolderOpen } from 'lucide-react';
import { Division, Team, Project, CanvasViewType } from '@/types';

interface CanvasControlsProps {
  viewType: CanvasViewType;
  setViewType: (value: CanvasViewType) => void;
  selectedDivision: string;
  setSelectedDivision: (value: string) => void;
  divisions: Division[];
  selectedTeam: string;
  setSelectedTeam: (value: string) => void;
  teams: Team[];
  selectedProject: string;
  setSelectedProject: (value: string) => void;
  projects: Project[];
}

export const CanvasControls = ({
  viewType,
  setViewType,
  selectedDivision,
  setSelectedDivision,
  divisions,
  selectedTeam,
  setSelectedTeam,
  teams,
  selectedProject,
  setSelectedProject,
  projects,
}: CanvasControlsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium">View:</label>
        <Select
          value={viewType}
          onValueChange={(value: CanvasViewType) => setViewType(value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Relationships</SelectItem>
            <SelectItem value="financial-overview">
              Financial Overview
            </SelectItem>
            <SelectItem value="teams-projects">Teams & Projects</SelectItem>
            <SelectItem value="projects-epics">Projects & Epics</SelectItem>
            <SelectItem value="team-allocations">Team Allocations</SelectItem>
            <SelectItem value="people-teams">People & Teams</SelectItem>
            <SelectItem value="projects-milestones">
              Projects & Milestones
            </SelectItem>
            <SelectItem value="people-skills">People & Skills</SelectItem>
            <SelectItem value="team-skills-summary">
              Team Skills Summary
            </SelectItem>
            <SelectItem value="projects-solutions">
              Projects & Solutions
            </SelectItem>
            <SelectItem value="solutions-skills">Solutions & Skills</SelectItem>
            <SelectItem value="scenario-analysis">Scenario Analysis</SelectItem>
            <SelectItem value="capacity-planning">Capacity Planning</SelectItem>
            <SelectItem value="skill-gap-analysis">
              Skill Gap Analysis
            </SelectItem>
            <SelectItem value="division-sizing">
              Division Sizing Overview
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium flex items-center">
          <Building className="h-4 w-4 mr-1" />
          Division:
        </label>
        <Select value={selectedDivision} onValueChange={setSelectedDivision}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by division" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Divisions</SelectItem>
            {divisions.map(d => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium flex items-center">
          <Users className="h-4 w-4 mr-1" />
          Team:
        </label>
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map(t => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium flex items-center">
          <FolderOpen className="h-4 w-4 mr-1" />
          Project:
        </label>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
