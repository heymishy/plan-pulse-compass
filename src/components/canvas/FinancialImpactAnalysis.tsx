import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Person, Team } from '@/types';
import { analyzeTeamMoveImpact } from '@/utils/financialImpactUtils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FinancialImpactAnalysis: React.FC = () => {
  const { people, teams, roles, config } = useApp();
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const handleAnalyzeClick = () => {
    if (selectedPersonId && selectedTeamId) {
      const person = people.find(p => p.id === selectedPersonId);
      const team = teams.find(t => t.id === selectedTeamId);
      if (person && team) {
        const result = analyzeTeamMoveImpact(
          person,
          team,
          people,
          roles,
          teams,
          config
        );
        setAnalysisResult(result);
      }
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Financial Impact Analysis</h2>

      <div className="flex gap-4">
        <div className="w-1/2">
          <label htmlFor="person-select">Person</label>
          <Select onValueChange={setSelectedPersonId}>
            <SelectTrigger id="person-select">
              <SelectValue placeholder="Select a person" />
            </SelectTrigger>
            <SelectContent>
              {people.map((person: Person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-1/2">
          <label htmlFor="team-select">New Team</label>
          <Select onValueChange={setSelectedTeamId}>
            <SelectTrigger id="team-select">
              <SelectValue placeholder="Select a new team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team: Team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleAnalyzeClick}
        disabled={!selectedPersonId || !selectedTeamId}
      >
        Analyze
      </Button>

      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Result</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Moving <strong>{analysisResult.personName}</strong> to the{' '}
              <strong>
                {teams.find(t => t.id === analysisResult.newTeamId)?.name}
              </strong>{' '}
              team:
            </p>
            <ul className="list-disc pl-5 mt-2">
              <li>
                Impact on original team's annual cost:{' '}
                <span className="font-semibold">
                  {analysisResult.impactOnOriginalTeam.toLocaleString()}
                </span>
              </li>
              <li>
                Impact on new team's annual cost:{' '}
                <span className="font-semibold">
                  {analysisResult.impactOnNewTeam.toLocaleString()}
                </span>
              </li>
              <li>
                New annual cost of original team:{' '}
                <span className="font-semibold">
                  {analysisResult.newCostOfOriginalTeam.toLocaleString()}
                </span>
              </li>
              <li>
                New annual cost of new team:{' '}
                <span className="font-semibold">
                  {analysisResult.newCostOfNewTeam.toLocaleString()}
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialImpactAnalysis;
