
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, FileText, Database } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { 
  downloadActualAllocationSampleCSV, 
  downloadIterationReviewSampleCSV, 
  downloadBulkTrackingSampleCSV,
  exportTrackingDataCSV
} from '@/utils/trackingImportUtils';

const TrackingImportExport = () => {
  const { 
    actualAllocations, 
    iterationReviews, 
    teams, 
    cycles, 
    epics, 
    runWorkCategories 
  } = useApp();
  const { toast } = useToast();

  const handleExportTrackingData = () => {
    if (actualAllocations.length === 0 && iterationReviews.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There is no tracking data to export.",
        variant: "destructive",
      });
      return;
    }

    exportTrackingDataCSV(
      actualAllocations,
      iterationReviews,
      teams,
      cycles,
      epics,
      runWorkCategories
    );

    toast({
      title: "Export Successful",
      description: "Your tracking data has been exported to CSV.",
    });
  };

  const handleDownloadSample = (type: 'allocations' | 'reviews' | 'bulk') => {
    switch (type) {
      case 'allocations':
        downloadActualAllocationSampleCSV();
        break;
      case 'reviews':
        downloadIterationReviewSampleCSV();
        break;
      case 'bulk':
        downloadBulkTrackingSampleCSV();
        break;
    }

    toast({
      title: "Sample Downloaded",
      description: "Sample CSV file has been downloaded.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Export Tracking Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-4">
            <Button 
              onClick={handleExportTrackingData}
              className="flex items-center justify-center"
              disabled={actualAllocations.length === 0 && iterationReviews.length === 0}
            >
              <Database className="h-4 w-4 mr-2" />
              Export All Tracking Data
            </Button>
            <p className="text-sm text-gray-600">
              Export all actual allocations and iteration reviews as a comprehensive CSV file.
              {actualAllocations.length === 0 && iterationReviews.length === 0 && (
                <span className="text-red-600 block mt-1">
                  No tracking data available to export.
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Download Sample Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Button 
                variant="outline" 
                onClick={() => handleDownloadSample('allocations')}
                className="w-full flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Actual Allocations
              </Button>
              <p className="text-xs text-gray-500">
                Template for importing actual allocation percentages and variance data.
              </p>
            </div>
            
            <div className="space-y-2">
              <Button 
                variant="outline" 
                onClick={() => handleDownloadSample('reviews')}
                className="w-full flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Iteration Reviews
              </Button>
              <p className="text-xs text-gray-500">
                Template for importing iteration review data with completed items.
              </p>
            </div>
            
            <div className="space-y-2">
              <Button 
                variant="outline" 
                onClick={() => handleDownloadSample('bulk')}
                className="w-full flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Bulk Tracking Data
              </Button>
              <p className="text-xs text-gray-500">
                Combined template for importing both allocations and reviews in one file.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Import Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Before importing tracking data:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Ensure all referenced teams, quarters, and epics exist in your system</li>
                  <li>Use the Advanced Data Import feature for complex mapping scenarios</li>
                  <li>For bulk imports, specify "allocation" or "review" in the Data Type column</li>
                  <li>Actual percentages should be numeric values (e.g., 75 for 75%)</li>
                  <li>Epic names must match exactly with existing epics in your projects</li>
                  <li>Multiple completed epics/milestones should be comma-separated</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {(actualAllocations.length > 0 || iterationReviews.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Current Tracking Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{actualAllocations.length}</div>
                <div className="text-sm text-blue-800">Actual Allocations</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{iterationReviews.length}</div>
                <div className="text-sm text-green-800">Iteration Reviews</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrackingImportExport;
