
import React from 'react';
import AdvancedDataImport from './AdvancedDataImport';
import EnhancedImportExport from './EnhancedImportExport';
import EnhancedProjectsImportExport from './EnhancedProjectsImportExport';
import TrackingImportExport from './TrackingImportExport';
import BulkRemovalSettings from './BulkRemovalSettings';

const ImportExportSettings = () => {
  return (
    <div className="space-y-6">
      <AdvancedDataImport />
      <EnhancedImportExport />
      <EnhancedProjectsImportExport />
      <TrackingImportExport />
      <BulkRemovalSettings />
    </div>
  );
};

export default ImportExportSettings;
