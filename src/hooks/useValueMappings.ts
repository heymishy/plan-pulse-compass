import { useState, useCallback, useMemo } from 'react';

export interface ValueMapping {
  csvValue: string;
  systemValue: string | number;
  fieldId: string;
  importType: string;
}

const VALUE_MAPPINGS_STORAGE_KEY = 'csv_value_mappings';

export const useValueMappings = () => {
  const [savedValueMappings, setSavedValueMappings] = useState<ValueMapping[]>(
    () => {
      try {
        const item = window.localStorage.getItem(VALUE_MAPPINGS_STORAGE_KEY);
        return item ? JSON.parse(item) : [];
      } catch (error) {
        console.error('Error reading value mappings from localStorage', error);
        return [];
      }
    }
  );

  const saveValueMapping = useCallback(
    (
      importType: string,
      fieldId: string,
      csvValue: string,
      systemValue: string | number
    ) => {
      const newMapping: ValueMapping = {
        csvValue,
        systemValue,
        fieldId,
        importType,
      };

      // Remove existing mapping for this combination
      const filteredMappings = savedValueMappings.filter(
        m =>
          !(
            m.importType === importType &&
            m.fieldId === fieldId &&
            m.csvValue === csvValue
          )
      );

      const newMappings = [...filteredMappings, newMapping];
      setSavedValueMappings(newMappings);

      try {
        window.localStorage.setItem(
          VALUE_MAPPINGS_STORAGE_KEY,
          JSON.stringify(newMappings)
        );
      } catch (error) {
        console.error('Error saving value mappings to localStorage', error);
      }
    },
    [savedValueMappings]
  );

  const saveValueMappings = useCallback(
    (
      importType: string,
      fieldId: string,
      mappings: Record<string, string | number>
    ) => {
      const newMappings: ValueMapping[] = Object.entries(mappings).map(
        ([csvValue, systemValue]) => ({
          csvValue,
          systemValue,
          fieldId,
          importType,
        })
      );

      // Remove existing mappings for this field
      const filteredMappings = savedValueMappings.filter(
        m => !(m.importType === importType && m.fieldId === fieldId)
      );

      const updatedMappings = [...filteredMappings, ...newMappings];
      setSavedValueMappings(updatedMappings);

      try {
        window.localStorage.setItem(
          VALUE_MAPPINGS_STORAGE_KEY,
          JSON.stringify(updatedMappings)
        );
      } catch (error) {
        console.error('Error saving value mappings to localStorage', error);
      }
    },
    [savedValueMappings]
  );

  const getValueMapping = useCallback(
    (
      importType: string,
      fieldId: string,
      csvValue: string
    ): string | number | undefined => {
      const mapping = savedValueMappings.find(
        m =>
          m.importType === importType &&
          m.fieldId === fieldId &&
          m.csvValue === csvValue
      );
      return mapping?.systemValue;
    },
    [savedValueMappings]
  );

  const getValueMappingsForField = useCallback(
    (importType: string, fieldId: string): Record<string, string | number> => {
      const mappings = savedValueMappings.filter(
        m => m.importType === importType && m.fieldId === fieldId
      );

      return mappings.reduce(
        (acc, mapping) => {
          acc[mapping.csvValue] = mapping.systemValue;
          return acc;
        },
        {} as Record<string, string | number>
      );
    },
    [savedValueMappings]
  );

  const suggestMapping = useCallback(
    (
      csvValue: string,
      systemOptions: (string | number)[]
    ): string | number | undefined => {
      // First, try exact match
      const exactMatch = systemOptions.find(
        option => String(option).toLowerCase() === csvValue.toLowerCase()
      );
      if (exactMatch) return exactMatch;

      // Try pattern matching for common cases
      const patterns = [
        // S1, S2, S3 -> 1, 2, 3
        {
          regex: /^S(\d+)$/i,
          transform: (match: RegExpMatchArray) => parseInt(match[1]),
        },
        // Sprint 1, Sprint 2 -> 1, 2
        {
          regex: /^Sprint\s*(\d+)$/i,
          transform: (match: RegExpMatchArray) => parseInt(match[1]),
        },
        // Q1, Q2, Q3, Q4 -> 1, 2, 3, 4
        {
          regex: /^Q(\d+)$/i,
          transform: (match: RegExpMatchArray) => parseInt(match[1]),
        },
        // Iteration 1, Iteration 2 -> 1, 2
        {
          regex: /^Iteration\s*(\d+)$/i,
          transform: (match: RegExpMatchArray) => parseInt(match[1]),
        },
        // Week 1, Week 2 -> 1, 2
        {
          regex: /^Week\s*(\d+)$/i,
          transform: (match: RegExpMatchArray) => parseInt(match[1]),
        },
      ];

      for (const pattern of patterns) {
        const match = csvValue.match(pattern.regex);
        if (match) {
          const suggestedValue = pattern.transform(match);
          if (systemOptions.includes(suggestedValue)) {
            return suggestedValue;
          }
        }
      }

      // Try partial matching for text fields
      const partialMatches = systemOptions.filter(
        option =>
          String(option).toLowerCase().includes(csvValue.toLowerCase()) ||
          csvValue.toLowerCase().includes(String(option).toLowerCase())
      );

      if (partialMatches.length === 1) {
        return partialMatches[0];
      }

      return undefined;
    },
    []
  );

  const clearValueMappings = useCallback(
    (importType?: string, fieldId?: string) => {
      let filteredMappings = savedValueMappings;

      if (importType && fieldId) {
        filteredMappings = savedValueMappings.filter(
          m => !(m.importType === importType && m.fieldId === fieldId)
        );
      } else if (importType) {
        filteredMappings = savedValueMappings.filter(
          m => m.importType !== importType
        );
      } else {
        filteredMappings = [];
      }

      setSavedValueMappings(filteredMappings);

      try {
        window.localStorage.setItem(
          VALUE_MAPPINGS_STORAGE_KEY,
          JSON.stringify(filteredMappings)
        );
      } catch (error) {
        console.error('Error clearing value mappings from localStorage', error);
      }
    },
    [savedValueMappings]
  );

  return {
    saveValueMapping,
    saveValueMappings,
    getValueMapping,
    getValueMappingsForField,
    suggestMapping,
    clearValueMappings,
    savedValueMappings,
  };
};
