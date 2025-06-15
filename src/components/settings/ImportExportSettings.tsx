
import React from 'react';
import AdvancedDataImport from './AdvancedDataImport';
import EnhancedImportExport from './EnhancedImportExport';
import EnhancedProjectsImportExport from './EnhancedProjectsImportExport';

const ImportExportSettings = () => {
  return (
    <div className="space-y-6">
      <AdvancedDataImport />
      <EnhancedImportExport />
      <EnhancedProjectsImportExport />
    </div>
  );
};

export default ImportExportSettings;
