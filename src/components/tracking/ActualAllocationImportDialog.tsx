
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
import { parseActualAllocationCSV, downloadActualAllocationSampleCSV } from '@/utils/trackingImportUtils';

interface ActualAllocationImportDialogProps {
  children: React.ReactNode;
}

const ActualAllocationImportDialog = ({ children }: ActualAllocationImportDialogProps) => {
  const { teams, cycles, epics, runWorkCategories, actualAllocations, setActualAllocations } = useApp();
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
        const { allocations, errors: parseErrors } = parseActualAllocationCSV(
          text, teams, cycles, epics, runWorkCategories
        );
        
        setPreviewData(allocations.slice(0, 5)); // Show first 5 rows
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
      const { allocations, errors: parseErrors } = parseActualAllocationCSV(
        csvContent, teams, cycles, epics, runWorkCategories
      );
      
      if (parseErrors.length > 0) {
        setErrors(parseErrors);
        setIsProcessing(false);
        return;
      }

      // Add new allocations to existing ones
      setActualAllocations(prev => [...prev, ...allocations]);
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${allocations.length} actual allocations.`,
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
            Import Actual Allocations
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="csv-file">Upload CSV File</Label>
              <p className="text-sm text-gray-500">
                Import actual allocation data for tracking progress against planned allocations.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadActualAllocationSampleCSV}
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
                      <TableHead>Team</TableHead>
                      <TableHead>Quarter</TableHead>
                      <TableHead>Iteration</TableHead>
                      <TableHead>Work Item</TableHead>
                      <TableHead>Actual %</TableHead>
                      <TableHead>Variance Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((allocation, index) => {
                      const team = teams.find(t => t.id === allocation.teamId);
                      const cycle = cycles.find(c => c.id === allocation.cycleId);
                      const epic = epics.find(e => e.id === allocation.actualEpicId);
                      const runWork = runWorkCategories.find(r => r.id === allocation.actualRunWorkCategoryId);
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>{team?.name}</TableCell>
                          <TableCell>{cycle?.name}</TableCell>
                          <TableCell>{allocation.iterationNumber}</TableCell>
                          <TableCell>{epic?.name || runWork?.name}</TableCell>
                          <TableCell>{allocation.actualPercentage}%</TableCell>
                          <TableCell>{allocation.varianceReason || 'none'}</TableCell>
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
                  Import {previewData.length} Allocations
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActualAllocationImportDialog;
