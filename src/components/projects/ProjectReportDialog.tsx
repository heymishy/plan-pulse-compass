import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Project, Epic } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';
import ReportSection from '@/components/reports/ReportSection';
import MilestoneTimeline from '@/components/reports/MilestoneTimeline';
import { calculateProjectCost } from '@/utils/financialCalculations';

interface ProjectReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

const ProjectReportDialog: React.FC<ProjectReportDialogProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const { epics, allocations, cycles, people, roles, teams } = useApp();
  const { toast } = useToast();

  // Memoize the financial calculations to prevent recalculations on every render
  const projectFinancials = useMemo(() => {
    if (!project)
      return {
        totalCost: 0,
        breakdown: [],
        teamBreakdown: [],
        monthlyBurnRate: 0,
      };
    return calculateProjectCost(
      project,
      epics,
      allocations,
      cycles,
      people,
      roles,
      teams
    );
  }, [project, epics, allocations, cycles, people, roles, teams]);

  // Memoize project epics to prevent recalculations
  const projectEpics = useMemo(() => {
    if (!project) return [];
    return epics.filter(epic => epic.projectId === project.id);
  }, [epics, project]);

  if (!project) return null;

  const handleExportReport = () => {
    // Generate and download project report
    const reportData = {
      project: project.name,
      status: project.status,
      budget: project.budget,
      estimatedCost: projectFinancials.totalCost,
      epics: projectEpics.length,
      milestones: project.milestones.length,
      completedMilestones: project.milestones.filter(
        m => m.status === 'completed'
      ).length,
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${project.name.replace(/\s+/g, '_')}_report.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: 'Report Exported',
      description: `Project report for ${project.name} has been downloaded.`,
    });
  };

  const completedMilestones = project.milestones.filter(
    m => m.status === 'completed'
  ).length;
  const completedEpics = projectEpics.filter(
    e => e.status === 'completed'
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Report: {project.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Overview */}
          <ReportSection title="Project Overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold">Status</h4>
                <p className="capitalize">{project.status.replace('-', ' ')}</p>
              </div>
              <div>
                <h4 className="font-semibold">Start Date</h4>
                <p>{new Date(project.startDate).toLocaleDateString()}</p>
              </div>
              {project.endDate && (
                <div>
                  <h4 className="font-semibold">End Date</h4>
                  <p>{new Date(project.endDate).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <h4 className="font-semibold">Budget</h4>
                <p>
                  {project.budget
                    ? `$${project.budget.toLocaleString()}`
                    : 'Not set'}
                </p>
              </div>
            </div>
            {project.description && (
              <div className="mt-4">
                <h4 className="font-semibold">Description</h4>
                <p className="text-gray-700">{project.description}</p>
              </div>
            )}
          </ReportSection>

          {/* Financial Summary */}
          <ReportSection title="Financial Summary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold">Estimated Cost</h4>
                <p className="text-2xl font-bold">
                  $
                  {projectFinancials.totalCost.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              {project.budget && (
                <div>
                  <h4 className="font-semibold">Budget Variance</h4>
                  <p
                    className={`text-2xl font-bold ${project.budget - projectFinancials.totalCost >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    $
                    {Math.abs(
                      project.budget - projectFinancials.totalCost
                    ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {project.budget - projectFinancials.totalCost >= 0
                      ? 'Under budget'
                      : 'Over budget'}
                  </p>
                </div>
              )}
              <div>
                <h4 className="font-semibold">Monthly Burn Rate</h4>
                <p className="text-xl font-semibold">
                  $
                  {projectFinancials.monthlyBurnRate.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </ReportSection>

          {/* Progress Summary */}
          <ReportSection title="Progress Summary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Milestones</h4>
                <div className="text-3xl font-bold text-blue-600">
                  {completedMilestones}/{project.milestones.length}
                </div>
                <p className="text-sm text-gray-600">
                  {project.milestones.length > 0
                    ? `${Math.round((completedMilestones / project.milestones.length) * 100)}% Complete`
                    : 'No milestones defined'}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Epics</h4>
                <div className="text-3xl font-bold text-green-600">
                  {completedEpics}/{projectEpics.length}
                </div>
                <p className="text-sm text-gray-600">
                  {projectEpics.length > 0
                    ? `${Math.round((completedEpics / projectEpics.length) * 100)}% Complete`
                    : 'No epics defined'}
                </p>
              </div>
            </div>
          </ReportSection>

          {/* Milestones Timeline */}
          {project.milestones.length > 0 && (
            <ReportSection title="Milestones Timeline">
              <MilestoneTimeline milestones={project.milestones} />
            </ReportSection>
          )}

          {/* Epics Summary */}
          {projectEpics.length > 0 && (
            <ReportSection title="Epics Summary">
              <div className="space-y-3">
                {projectEpics.map(epic => (
                  <div
                    key={epic.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h5 className="font-medium">{epic.name}</h5>
                      {epic.description && (
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {epic.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium">
                        {epic.estimatedEffort} pts
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          epic.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : epic.status === 'in-progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {epic.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ReportSection>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectReportDialog;
