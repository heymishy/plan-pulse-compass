import { useState, useCallback } from 'react';

const MAPPINGS_STORAGE_KEY = 'csv_import_mappings';

export const useImportMappings = () => {
  const [savedMappings, setSavedMappings] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const item = window.localStorage.getItem(MAPPINGS_STORAGE_KEY);
      return item ? JSON.parse(item) : {};
    } catch (error) {
      console.error('Error reading from localStorage', error);
      return {};
    }
  });

  const saveMapping = useCallback((importType: string, mapping: Record<string, string>) => {
    const newMappings = { ...savedMappings, [importType]: mapping };
    setSavedMappings(newMappings);
    try {
      window.localStorage.setItem(MAPPINGS_STORAGE_KEY, JSON.stringify(newMappings));
    } catch (error) {
      console.error('Error saving to localStorage', error);
    }
  }, [savedMappings]);

  const getMapping = useCallback((importType: string) => {
    return savedMappings[importType] || {};
  }, [savedMappings]);

  return { saveMapping, getMapping };
};