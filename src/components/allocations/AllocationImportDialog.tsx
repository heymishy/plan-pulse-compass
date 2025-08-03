import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  parseAllocationCSV,
  validateAllocationImport,
  convertImportToAllocations,
  downloadAllocationSampleCSV,
  AllocationImportRow,
} from '@/utils/allocationImportUtils';

interface AllocationImportDialogProps {
  onImportComplete: () => void;
}

const AllocationImportDialog: React.FC<AllocationImportDialogProps> = ({
  onImportComplete,
}) => {
  const {
    teams,
    epics,
    runWorkCategories,
    cycles,
    allocations,
    setAllocations,
  } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [importData, setImportData] = useState<AllocationImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const text = e.target?.result as string;
        const parsed = await parseAllocationCSV(text);
        const { valid, errors } = await validateAllocationImport(
          parsed,
          teams,
          epics,
          runWorkCategories,
          cycles
        );

        setImportData(valid);
        setErrors(errors);
      } catch (error) {
        setErrors(['Failed to parse CSV file. Please check the format.']);
        setImportData([]);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (importData.length === 0) return;

    setIsProcessing(true);
    try {
      const newAllocations = convertImportToAllocations(
        importData,
        teams,
        epics,
        runWorkCategories,
        cycles
      );
      setAllocations(prev => [...prev, ...newAllocations]);

      setIsOpen(false);
      setImportData([]);
      setErrors([]);
      onImportComplete();
    } catch (error) {
      setErrors(['Failed to import allocations. Please try again.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setImportData([]);
    setErrors([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Upload className="h-4 w-4" />
          <span>Import Allocations</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Team Allocations</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions and Sample Download */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Upload CSV File</h3>
                <p className="text-sm text-gray-600">
                  Import team allocations for the quarter. Required columns:
                  Team Name, Epic Name, Epic Type, Sprint Number, Percentage,
                  Quarter
                </p>
              </div>
              <Button
                variant="outline"
                onClick={downloadAllocationSampleCSV}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Sample CSV</span>
              </Button>
            </div>

            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full"
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success message and preview */}
          {importData.length > 0 && errors.length === 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully validated {importData.length} allocation records.
                Review the data below and click Import to proceed.
              </AlertDescription>
            </Alert>
          )}

          {/* Data Preview */}
          {importData.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">
                Data Preview ({importData.length} records)
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>Epic/Work Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Sprint</TableHead>
                      <TableHead>%</TableHead>
                      <TableHead>Quarter</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importData.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.teamName}</TableCell>
                        <TableCell>{row.epicName}</TableCell>
                        <TableCell>{row.epicType}</TableCell>
                        <TableCell>{row.sprintNumber}</TableCell>
                        <TableCell>{row.percentage}%</TableCell>
                        <TableCell>{row.quarter}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {importData.length > 10 && (
                  <div className="p-3 text-sm text-gray-600 bg-gray-50">
                    ... and {importData.length - 10} more records
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={reset} disabled={isProcessing}>
              Reset
            </Button>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={
                  importData.length === 0 || errors.length > 0 || isProcessing
                }
              >
                {isProcessing
                  ? 'Importing...'
                  : `Import ${importData.length} Records`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AllocationImportDialog;
