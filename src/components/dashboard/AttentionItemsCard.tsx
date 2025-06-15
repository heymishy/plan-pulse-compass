
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { DashboardData } from '@/utils/dashboardUtils';

interface AttentionItemsCardProps {
  attentionItems: DashboardData['attentionItems'];
}

const AttentionItemsCard: React.FC<AttentionItemsCardProps> = ({ attentionItems }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Items Needing Attention</CardTitle>
        <CardDescription>Areas to investigate to stay on track.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link to="/milestones?status=at-risk" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <ShieldAlert className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="font-semibold">At-Risk Milestones</p>
              <p className="text-sm text-gray-500">Milestones that may be delayed.</p>
            </div>
          </div>
          <p className="text-xl font-bold">{attentionItems.atRiskMilestones}</p>
        </Link>
        <Link to="/projects" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
           <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold">Open Risks</p>
              <p className="text-sm text-gray-500">Project risks that are not yet mitigated.</p>
            </div>
          </div>
          <p className="text-xl font-bold">{attentionItems.openRisks}</p>
        </Link>
      </CardContent>
    </Card>
  );
};

export default AttentionItemsCard;
