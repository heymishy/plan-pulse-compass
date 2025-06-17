
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProjectsHeaderProps {
  onCreateProject: () => void;
  onOpenRanking: () => void;
}

const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({ onCreateProject, onOpenRanking }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <p className="text-gray-600">Manage your organization's projects and initiatives</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" asChild>
          <Link to="/epics">
            <Layers className="h-4 w-4 mr-2" />
            Manage Epics
          </Link>
        </Button>
        <Button variant="outline" onClick={onOpenRanking}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Rank Projects
        </Button>
        <Button onClick={onCreateProject}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>
    </div>
  );
};

export default ProjectsHeader;
