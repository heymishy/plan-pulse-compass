import React from 'react';
import AdvancedDataImport from './AdvancedDataImport';
import EnhancedImportExport from './EnhancedImportExport';
import EnhancedProjectsImportExport from './EnhancedProjectsImportExport';
import TrackingImportExport from './TrackingImportExport';
import BulkRemovalSettings from './BulkRemovalSettings';
import { EnhancedImportComponent } from '../EnhancedImportComponent';

const ImportExportSettings = () => {
  return (
    <div className="space-y-6">
      <EnhancedImportComponent />
      <AdvancedDataImport />
      <EnhancedImportExport />
      <EnhancedProjectsImportExport />
      <TrackingImportExport />
      <BulkRemovalSettings />
    </div>
  );
};

export default ImportExportSettings;
