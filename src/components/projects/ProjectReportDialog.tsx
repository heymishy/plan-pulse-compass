
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppContext';
import { Project, ProjectReportData, ProjectHealthStatus } from '@/types';
import { generateProjectReportData } from '@/utils/reportUtils';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { DollarSign, BarChart, TrendingUp, Target, Users, FileText, Download } from 'lucide-react';
import ReportSection from '../reports/ReportSection';

interface ProjectReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

const ProjectReportDialog: React.FC<ProjectReportDialogProps> = ({ isOpen, onClose, project }) => {
  const appData = useApp();
  const [reportData, setReportData] = useState<ProjectReportData | null>(null);
  const [commentary, setCommentary] = useState('');
  const [status, setStatus] = useState<ProjectHealthStatus>('on-track');

  useEffect(() => {
    if (project) {
      const data = generateProjectReportData(project, appData);
      setReportData(data);
      if (data) {
        setCommentary(data.summary.commentary);
        setStatus(data.summary.overallStatus);
      }
    }
  }, [project, appData]);

  if (!isOpen || !project || !reportData) {
    return null;
  }

  const { financials, progress, teams } = reportData;

  const statusOptions: { value: ProjectHealthStatus, label: string }[] = [
    { value: 'on-track', label: 'On Track' },
    { value: 'at-risk', label: 'At Risk' },
    { value: 'off-track', label: 'Off Track' },
  ];

  const handleExport = () => {
    // Placeholder for export functionality
    alert('Export functionality coming soon!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="mr-2" />
            Project Status Report: {project.name}
          </DialogTitle>
          <div className="text-sm text-gray-500">
            Report for period: {format(new Date(reportData.reportPeriod.startDate), 'PPP')} - {format(new Date(reportData.reportPeriod.endDate), 'PPP')}
          </div>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto pr-2">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Executive Summary</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-4 space-y-4">
              <ReportSection title="Overall Status & Commentary" icon={<BarChart />}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status">Overall Project Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as ProjectHealthStatus)}>
                      <SelectTrigger id="status" className="w-[180px]">
                        <SelectValue placeholder="Set status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="commentary">Manager's Commentary</Label>
                    <Textarea
                      id="commentary"
                      placeholder="Add your summary, key achievements, and risks..."
                      value={commentary}
                      onChange={(e) => setCommentary(e.target.value)}
                      rows={8}
                    />
                  </div>
                </div>
              </ReportSection>
            </TabsContent>

            <TabsContent value="financials" className="mt-4 space-y-4">
              <ReportSection title="Financial Overview" icon={<DollarSign />}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div><p className="text-sm text-gray-500">Budget</p><p className="text-2xl font-bold">{formatCurrency(financials.budget)}</p></div>
                    <div><p className="text-sm text-gray-500">Total Cost</p><p className="text-2xl font-bold">{formatCurrency(financials.totalCost)}</p></div>
                    <div><p className="text-sm text-gray-500">Variance</p><p className="text-2xl font-bold">{formatCurrency(financials.variance)}</p></div>
                    <div><p className="text-sm text-gray-500">Burn Rate/Mo</p><p className="text-2xl font-bold">{formatCurrency(financials.burnRate)}</p></div>
                </div>
              </ReportSection>
              <ReportSection title="Team Cost Breakdown" icon={<Users />}>
                 {financials.teamBreakdown.map((team: any) => (
                    <div key={team.teamName} className="flex justify-between items-center py-1">
                        <span>{team.teamName}</span>
                        <span className="font-medium">{formatCurrency(team.totalCost)}</span>
                    </div>
                 ))}
              </ReportSection>
            </TabsContent>

            <TabsContent value="progress" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReportSection title="Epics" icon={<TrendingUp />}>
                    <h4 className="font-semibold mb-2">Completed ({progress.completedEpics.length})</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 mb-4">{progress.completedEpics.map(e => <li key={e.id}>{e.name}</li>)}</ul>
                    <h4 className="font-semibold mb-2">In Progress ({progress.inProgressEpics.length})</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600">{progress.inProgressEpics.map(e => <li key={e.id}>{e.name}</li>)}</ul>
                </ReportSection>
                <ReportSection title="Milestones" icon={<Target />}>
                    <h4 className="font-semibold mb-2">Completed ({progress.completedMilestones.length})</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 mb-4">{progress.completedMilestones.map(m => <li key={m.id}>{m.name}</li>)}</ul>
                    <h4 className="font-semibold mb-2">In Progress ({progress.inProgressMilestones.length})</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600">{progress.inProgressMilestones.map(m => <li key={m.id}>{m.name}</li>)}</ul>
                </ReportSection>
              </div>
            </TabsContent>

            <TabsContent value="teams" className="mt-4 space-y-4">
               <ReportSection title="Team Allocations" icon={<Users />}>
                 {teams.teamAllocations.map(team => (
                    <div key={team.teamId} className="flex justify-between items-center py-1">
                        <span>{team.teamName}</span>
                        <Badge variant="secondary">{team.totalAllocation}%</Badge>
                    </div>
                 ))}
              </ReportSection>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectReportDialog;

