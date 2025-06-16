
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { parseIterationReviewCSV, downloadIterationReviewSampleCSV } from '@/utils/trackingImportUtils';

interface IterationReviewImportDialogProps {
  children: React.ReactNode;
}

const IterationReviewImportDialog = ({ children }: IterationReviewImportDialogProps) => {
  const { cycles, epics, projects, iterationReviews, setIterationReviews } = useApp();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrors([]);
      try {
        const text = await selectedFile.text();
        setCsvContent(text);
        
        // Parse and preview the data
        const { reviews, errors: parseErrors } = parseIterationReviewCSV(
          text, cycles, epics, projects
        );
        
        setPreviewData(reviews.slice(0, 5)); // Show first 5 rows
        setErrors(parseErrors);
      } catch (error) {
        setErrors([`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      }
    }
  };

  const handleImport = async () => {
    if (!csvContent) return;
    
    setIsProcessing(true);
    try {
      const { reviews, errors: parseErrors } = parseIterationReviewCSV(
        csvContent, cycles, epics, projects
      );
      
      if (parseErrors.length > 0) {
        setErrors(parseErrors);
        setIsProcessing(false);
        return;
      }

      // Add new reviews to existing ones (avoiding duplicates)
      setIterationReviews(prev => {
        const existingKeys = new Set(
          prev.map(r => `${r.cycleId}-${r.iterationNumber}`)
        );
        const newReviews = reviews.filter(r => 
          !existingKeys.has(`${r.cycleId}-${r.iterationNumber}`)
        );
        return [...prev, ...newReviews];
      });
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${reviews.length} iteration reviews.`,
      });
      
      // Reset and close
      setFile(null);
      setCsvContent('');
      setPreviewData([]);
      setErrors([]);
      setIsOpen(false);
    } catch (error) {
      setErrors([`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setCsvContent('');
    setPreviewData([]);
    setErrors([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Import Iteration Reviews
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="csv-file">Upload CSV File</Label>
              <p className="text-sm text-gray-500">
                Import iteration review data including completed epics and milestones.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadIterationReviewSampleCSV}
              className="flex items-center"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Sample
            </Button>
          </div>
          
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
          />

          {errors.length > 0 && (
            <Alert className="border-red-500">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">
                <div className="font-semibold mb-2">Import Errors:</div>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {previewData.length > 0 && errors.length === 0 && (
            <div>
              <h4 className="font-semibold mb-2">Preview (first 5 rows)</h4>
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quarter</TableHead>
                      <TableHead>Iteration</TableHead>
                      <TableHead>Review Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completed Epics</TableHead>
                      <TableHead>Completed Milestones</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((review, index) => {
                      const cycle = cycles.find(c => c.id === review.cycleId);
                      const completedEpicNames = review.completedEpics.map((epicId: string) => {
                        const epic = epics.find(e => e.id === epicId);
                        return epic?.name || epicId;
                      }).join(', ');
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>{cycle?.name}</TableCell>
                          <TableCell>{review.iterationNumber}</TableCell>
                          <TableCell>{review.reviewDate}</TableCell>
                          <TableCell>{review.status}</TableCell>
                          <TableCell>{completedEpicNames || 'None'}</TableCell>
                          <TableCell>{review.completedMilestones.length || 'None'}</TableCell>
                          <TableCell>{review.notes || ''}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button
              onClick={handleImport}
              disabled={!csvContent || errors.length > 0 || isProcessing}
              className="flex items-center"
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Import {previewData.length} Reviews
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IterationReviewImportDialog;
