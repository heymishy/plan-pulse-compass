
import React from 'react';
import { Team, Project, IterationActualEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';

interface SummaryStepProps {
    teams: Team[];
    actualEntries: Record<string, IterationActualEntry[]>;
    completedEpics: string[];
    completedMilestones: string[];
    reviewNotes: string;
    getEpicName: (epicId: string) => string;
    getRunWorkCategoryName: (categoryId: string) => string;
    projects: Project[];
}

const SummaryStep: React.FC<SummaryStepProps> = ({
    teams,
    actualEntries,
    completedEpics,
    completedMilestones,
    reviewNotes,
    getEpicName,
    getRunWorkCategoryName,
    projects,
}) => {
    return (
        <Card className="animate-fade-in">
            <CardHeader><CardTitle>Summary & Save</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Ready to Save</AlertTitle>
                    <AlertDescription>You've completed all steps. Review the summary and click save to complete the iteration review.</AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Team Allocation Summary</h3>
                    {teams.map(team => {
                        const entries = actualEntries[team.id] || [];
                        const totalActual = entries.reduce((sum, entry) => sum + (entry.actualPercentage || 0), 0);
                        return (
                            <Card key={team.id} className="bg-gray-50/50">
                                <CardHeader className="p-4 flex flex-row items-center justify-between">
                                    <CardTitle className="text-base">{team.name}</CardTitle>
                                    <Badge variant={totalActual === 100 ? "default" : "secondary"}>Total: {totalActual}%</Badge>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 text-sm">
                                    <ul className="space-y-1">
                                        {entries.filter(e => e.actualPercentage > 0).map(entry => (
                                            <li key={entry.id} className="flex justify-between">
                                                <span>{entry.actualEpicId ? getEpicName(entry.actualEpicId) : entry.actualRunWorkCategoryId ? getRunWorkCategoryName(entry.actualRunWorkCategoryId) : 'Unassigned'}</span>
                                                <span>{entry.actualPercentage}%</span>
                                            </li>
                                        ))}
                                        {entries.filter(e => e.actualPercentage > 0).length === 0 && <li className="text-gray-500">No work allocated.</li>}
                                    </ul>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-medium">Completed Epics</h3>
                        {completedEpics.length > 0 ? (
                            <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                                {completedEpics.map(epicId => <li key={epicId}>{getEpicName(epicId)}</li>)}
                            </ul>
                        ) : <p className="text-sm text-gray-500 mt-2">No epics marked as completed.</p>}
                    </div>
                    <div>
                        <h3 className="text-lg font-medium">Completed Milestones</h3>
                        {completedMilestones.length > 0 ? (
                            <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                                {completedMilestones.map(milestoneId => {
                                    const milestone = projects.flatMap(p => p.milestones).find(m => m.id === milestoneId);
                                    const project = projects.find(p => p.id === milestone?.projectId);
                                    return <li key={milestoneId}>{project?.name || 'Unknown Project'} - {milestone?.name || 'Unknown Milestone'}</li>
                                })}
                            </ul>
                        ) : <p className="text-sm text-gray-500 mt-2">No milestones marked as completed.</p>}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium">Review Notes</h3>
                    {reviewNotes ? (
                        <p className="mt-2 text-sm p-3 bg-gray-50 rounded border whitespace-pre-wrap">{reviewNotes}</p>
                    ) : (
                        <p className="text-sm text-gray-500 mt-2">No notes provided.</p>
                    )}
                </div>

            </CardContent>
        </Card>
    );
};

export default SummaryStep;
