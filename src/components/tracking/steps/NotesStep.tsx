
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface NotesStepProps {
  reviewNotes: string;
  setReviewNotes: React.Dispatch<React.SetStateAction<string>>;
}

const NotesStep: React.FC<NotesStepProps> = ({ reviewNotes, setReviewNotes }) => {
  return (
    <Card className="animate-fade-in">
      <CardHeader><CardTitle>Review Notes</CardTitle></CardHeader>
      <CardContent>
        <Textarea 
          placeholder="Add any notes..." 
          value={reviewNotes} 
          onChange={(e) => setReviewNotes(e.target.value)} 
          rows={8} 
        />
      </CardContent>
    </Card>
  );
};

export default NotesStep;
