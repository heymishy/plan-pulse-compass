import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AppConfig } from '@/types';

interface SettingsContextType {
  config: AppConfig | null;
  setConfig: (
    config: AppConfig | null | ((prev: AppConfig | null) => AppConfig | null)
  ) => void;
  isSetupComplete: boolean;
  setIsSetupComplete: (complete: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Generate default financial year ending September 30th of current year
  const currentYear = new Date().getFullYear();
  const defaultFinancialYear = {
    id: `fy-${currentYear}`,
    name: `FY ${currentYear}`,
    startDate: `${currentYear - 1}-10-01`, // October 1st of previous year
    endDate: `${currentYear}-09-30`, // September 30th of current year
  };

  const [config, setConfig] = useLocalStorage<AppConfig | null>(
    'planning-config',
    {
      financialYear: defaultFinancialYear,
      iterationLength: 'fortnightly',
      quarters: [],
      workingDaysPerWeek: 5,
      workingHoursPerDay: 8,
      workingDaysPerYear: 260,
      workingDaysPerMonth: 22,
      currencySymbol: '$',
    }
  );
  const [isSetupComplete, setIsSetupComplete] = useLocalStorage<boolean>(
    'planning-setup-complete',
    true // Default to true so pages are accessible without setup wizard
  );

  const value: SettingsContextType = {
    config,
    setConfig,
    isSetupComplete,
    setIsSetupComplete,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
