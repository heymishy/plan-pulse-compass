import React, { useState, useEffect, useMemo } from 'react';
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
import { Project, ProjectReportData, ProjectHealthStatus, ProjectRisk } from '@/types';
import { generateProjectReportData } from '@/utils/reportUtils';
import { formatCurrency } from '@/utils/currency';
import { format, formatISO } from 'date-fns';
import { DollarSign, BarChart, TrendingUp, Target, Users, FileText, Download, Save, ShieldAlert, AlertTriangle, History } from 'lucide-react';
import ReportSection from '../reports/ReportSection';
import MilestoneTimeline from '../reports/MilestoneTimeline';
import { toast } from 'sonner';

interface ProjectReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

const ProjectReportDialog: React.FC<ProjectReportDialogProps> = ({ isOpen, onClose, project }) => {
  const { updateProject, ...appData } = useApp();
  const [reportData, setReportData] = useState<ProjectReportData | null>(null);
  const [commentary, setCommentary] = useState('');
  const [status, setStatus] = useState<ProjectHealthStatus>('on-track');
  const [selectedReportId, setSelectedReportId] = useState<string>('latest');

  const historicalReports = useMemo(() => {
    return project?.reports?.sort((a, b) => new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime()) || [];
  }, [project?.reports]);

  useEffect(() => {
    if (project && isOpen) {
      setSelectedReportId('latest');
    }
  }, [project, isOpen]);

  useEffect(() => {
    if (project) {
      if (selectedReportId === 'latest') {
        const data = generateProjectReportData(project, appData);
        setReportData(data);
        if (data) {
          const latestSavedReport = historicalReports[0];
          setCommentary(latestSavedReport?.summary.commentary || data.summary.commentary || '');
          setStatus(latestSavedReport?.summary.overallStatus || data.summary.overallStatus || 'on-track');
        }
      } else {
        const historicalReport = historicalReports.find(r => r.generatedDate === selectedReportId);
        if (historicalReport) {
          setReportData(historicalReport);
          setCommentary(historicalReport.summary.commentary);
          setStatus(historicalReport.summary.overallStatus);
        }
      }
    }
  }, [project, appData, selectedReportId, isOpen, historicalReports]);
  
  const handleSaveReport = () => {
    if (!project || !reportData || !updateProject) return;

    const reportToSave: ProjectReportData = {
      ...reportData,
      generatedDate: formatISO(new Date()),
      summary: {
        ...reportData.summary,
        overallStatus: status,
        commentary: commentary,
      },
    };

    const updatedProject = {
      ...project,
      reports: [...(project.reports || []), reportToSave],
    };

    updateProject(project.id, updatedProject);
    toast.success('Report saved successfully!');
    onClose();
  };

  const isViewingHistorical = selectedReportId !== 'latest';

  if (!isOpen || !project || !reportData) {
    return null;
  }

  const { financials, progress, teams, risks } = reportData;
  const allMilestones = [...progress.completedMilestones, ...progress.inProgressMilestones, ...progress.upcomingMilestones];

  const statusOptions: { value: ProjectHealthStatus, label: string }[] = [
    { value: 'on-track', label: 'On Track' },
    { value: 'at-risk', label: 'At Risk' },
    { value: 'off-track', label: 'Off Track' },
  ];

  const handleExport = () => {
    // Placeholder for export functionality
    toast.info('Export functionality coming soon!');
  };

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    if (level === 'high') return 'destructive';
    if (level === 'medium') return 'secondary';
    return 'default';
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="mr-2" />
            Project Status Report: {project.name}
          </DialogTitle>
          <div className="text-sm text-gray-500">
            Report for period: {format(new Date(reportData.reportPeriod.startDate), 'PPP')} - {format(new Date(reportData.reportPeriod.endDate), 'PPP')}
          </div>
        </DialogHeader>

        <div className="px-6 py-4 border-b">
          <div className="flex items-center space-x-2 mb-2">
            <History className="h-5 w-5 text-gray-600"/>
            <Label htmlFor="report-history">Report History</Label>
          </div>
          <Select value={selectedReportId} onValueChange={setSelectedReportId}>
            <SelectTrigger id="report-history" className="w-[280px]">
              <SelectValue placeholder="Select a report to view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">
                <span className="font-bold">Latest Report (Live Data)</span>
              </SelectItem>
              {historicalReports.map((report) => (
                <SelectItem key={report.generatedDate} value={report.generatedDate}>
                  {format(new Date(report.generatedDate), 'PPP p')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isViewingHistorical && <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded-md mt-2">You are viewing a historical report. Editing is disabled.</p>}
        </div>
        
        <div className="flex-grow overflow-y-auto pr-2">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="summary">Executive Summary</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="risks">Risks</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-4 space-y-4">
              <ReportSection title="Overall Status & Commentary" icon={<BarChart />}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status">Overall Project Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as ProjectHealthStatus)} disabled={isViewingHistorical}>
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
                      placeholder={isViewingHistorical ? "No commentary was saved for this report." : "Add your summary, key achievements, and risks..."}
                      value={commentary}
                      onChange={(e) => setCommentary(e.target.value)}
                      rows={8}
                      readOnly={isViewingHistorical}
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
                <ReportSection title="Milestone Timeline" icon={<Target />}>
                  <MilestoneTimeline milestones={allMilestones} />
                </ReportSection>
              </div>
            </TabsContent>

            <TabsContent value="teams" className="mt-4 space-y-4">
               <ReportSection title="Team Allocations" icon={<Users />}>
                 {teams.teamAllocations.map(team => (
                    <div key={team.teamId} className="flex justify-between items-center py-1">
                        <span>{team.teamName}</span>
                        <Badge variant="secondary">{team.totalAllocation.toFixed(0)}%</Badge>
                    </div>
                 ))}
              </ReportSection>
            </TabsContent>

            <TabsContent value="risks" className="mt-4 space-y-4">
              <ReportSection title="Project Risks" icon={<ShieldAlert />}>
                {(!risks || risks.length === 0) ? (
                  <p className="text-gray-500">No risks have been logged for this project.</p>
                ) : (
                  <div className="space-y-4">
                    {risks.map((risk: ProjectRisk) => (
                      <div key={risk.id} className="p-3 border rounded-lg">
                        <p className="font-semibold">{risk.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                           <Badge variant={getRiskColor(risk.impact)}>Impact: {risk.impact}</Badge>
                           <Badge variant={getRiskColor(risk.probability)}>Probability: {risk.probability}</Badge>
                           <Badge variant={risk.status === 'open' ? 'destructive' : 'default'}>Status: {risk.status}</Badge>
                        </div>
                        {risk.mitigation && <p className="text-sm text-gray-600 mt-2"><b>Mitigation:</b> {risk.mitigation}</p>}
                      </div>
                    ))}
                  </div>
                )}
                 <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-800">
                  <div className="flex">
                    <div className="py-1"><AlertTriangle className="h-5 w-5 text-blue-400 mr-3" /></div>
                    <div>
                      <p className="font-bold">Coming Soon</p>
                      <p className="text-sm">Functionality to add and manage risks directly from the project dashboard is on its way!</p>
                    </div>
                  </div>
                </div>
              </ReportSection>
            </TabsContent>

          </Tabs>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveReport} disabled={isViewingHistorical}>
            <Save className="h-4 w-4 mr-2" />
            Save Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectReportDialog;
