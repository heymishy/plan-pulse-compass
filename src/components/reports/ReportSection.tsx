
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReportSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const ReportSection: React.FC<ReportSectionProps> = ({ title, icon, children, className }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          {icon && <span className="mr-2">{icon}</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default ReportSection;
