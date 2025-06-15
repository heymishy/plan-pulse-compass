
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, Circle } from 'lucide-react';
import { Cycle, Team, IterationReview } from '@/types';

interface Division {
    id: string;
    name: string;
}

interface TrackingSidebarProps {
    quarterCycles: Cycle[];
    selectedCycleId: string;
    setSelectedCycleId: (id: string) => void;
    iterations: Cycle[];
    selectedIterationNumber: number;
    setSelectedIterationNumber: (num: number) => void;
    iterationReviews: IterationReview[];
    divisions: Division[];
    selectedDivisionId: string;
    handleDivisionChange: (id: string) => void;
    availableTeams: Team[];
    selectedTeamId: string;
    setSelectedTeamId: (id:string) => void;
}

const TrackingSidebar: React.FC<TrackingSidebarProps> = ({
    quarterCycles,
    selectedCycleId,
    setSelectedCycleId,
    iterations,
    selectedIterationNumber,
    setSelectedIterationNumber,
    iterationReviews,
    divisions,
    selectedDivisionId,
    handleDivisionChange,
    availableTeams,
    selectedTeamId,
    setSelectedTeamId
}) => {
    return (
        <div className="w-80 p-4 border-r bg-gray-50/50 h-full flex flex-col space-y-6 overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 px-2">Tracking Controls</h2>
            
            <div className="space-y-4 px-2">
                <div>
                    <label className="text-sm font-medium mb-1 block">Quarter</label>
                    <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select quarter" />
                        </SelectTrigger>
                        <SelectContent>
                            {quarterCycles.map(cycle => (
                                <SelectItem key={cycle.id} value={cycle.id}>
                                    {cycle.name} ({cycle.status})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">Iteration</label>
                    <Select 
                        value={selectedIterationNumber.toString()} 
                        onValueChange={(value) => setSelectedIterationNumber(parseInt(value))}
                        disabled={!selectedCycleId || iterations.length === 0}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {iterations.map((_, index) => (
                                <SelectItem key={index + 1} value={(index + 1).toString()}>
                                    Iteration {index + 1}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {divisions.length > 0 && (
                    <div>
                        <label className="text-sm font-medium mb-1 block">Division</label>
                        <Select value={selectedDivisionId} onValueChange={handleDivisionChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select division" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Divisions</SelectItem>
                                {divisions.map(division => (
                                <SelectItem key={division.id} value={division.id}>
                                    {division.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div>
                    <label className="text-sm font-medium mb-1 block">Team</label>
                    <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Teams</SelectItem>
                            {availableTeams.map(team => (
                                <SelectItem key={team.id} value={team.id}>
                                {team.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {iterations.length > 0 && (
                <Card className="flex-1">
                    <CardHeader className="p-4">
                        <CardTitle className="text-base">Iteration Status</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                        <ul className="space-y-1">
                            {iterations.map((iteration, index) => {
                                const iterationNumber = index + 1;
                                const review = iterationReviews.find(r => r.cycleId === selectedCycleId && r.iterationNumber === iterationNumber);
                                const status = review?.status || 'not-started';

                                let Icon = Circle;
                                let color = 'text-gray-400';
                                if (status === 'completed') {
                                    Icon = CheckCircle2;
                                    color = 'text-green-500';
                                } else if (status === 'in-progress') {
                                    Icon = AlertTriangle;
                                    color = 'text-yellow-500';
                                }
                                
                                return (
                                    <li 
                                        key={iteration.id} 
                                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${selectedIterationNumber === iterationNumber ? 'bg-primary/10' : 'hover:bg-gray-100'}`}
                                        onClick={() => setSelectedIterationNumber(iterationNumber)}
                                    >
                                        <span className={`font-medium text-sm ${selectedIterationNumber === iterationNumber ? 'text-primary' : 'text-gray-700'}`}>
                                            Iteration {iterationNumber}
                                        </span>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs capitalize text-gray-500">{status.replace('-', ' ')}</span>
                                            <Icon className={`h-4 w-4 ${color}`} />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default TrackingSidebar;
