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
  const [config, setConfig] = useLocalStorage<AppConfig | null>(
    'planning-config',
    {
      financialYear: {
        id: 'default-fy',
        name: 'Default Financial Year',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      },
      iterationLength: 'fortnightly',
      quarters: [],
      workingDaysPerWeek: 5,
      workingHoursPerDay: 8,
      currencySymbol: '$',
    }
  );
  const [isSetupComplete, setIsSetupComplete] = useLocalStorage<boolean>(
    'planning-setup-complete',
    false
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