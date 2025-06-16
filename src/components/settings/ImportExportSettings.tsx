
import React from 'react';
import AdvancedDataImport from './AdvancedDataImport';
import EnhancedImportExport from './EnhancedImportExport';
import EnhancedProjectsImportExport from './EnhancedProjectsImportExport';
import TrackingImportExport from './TrackingImportExport';

const ImportExportSettings = () => {
  return (
    <div className="space-y-6">
      <AdvancedDataImport />
      <EnhancedImportExport />
      <EnhancedProjectsImportExport />
      <TrackingImportExport />
    </div>
  );
};

export default ImportExportSettings;
