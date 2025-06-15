
import React from 'react';
import EnhancedImportExport from './EnhancedImportExport';
import EnhancedProjectsImportExport from './EnhancedProjectsImportExport';

const ImportExportSettings = () => {
  return (
    <div className="space-y-6">
      {/* Enhanced People Import/Export */}
      <EnhancedImportExport />
      
      {/* Enhanced Projects Import/Export */}
      <EnhancedProjectsImportExport />
    </div>
  );
};

export default ImportExportSettings;
