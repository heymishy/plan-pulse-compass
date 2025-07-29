import React, { ReactNode } from 'react';
import { AppProvider } from './AppContext';

// Temporary safe wrapper that falls back to regular AppProvider to avoid circular dependency
export const SafeScenarioAwareAppProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  // Use regular AppProvider for now to avoid circular dependency between
  // ScenarioProvider and AppProvider. ScenarioProvider tries to use useApp()
  // but AppProvider isn't available yet when ScenarioProvider initializes.
  // This needs to be refactored to remove the circular dependency.
  return <AppProvider>{children}</AppProvider>;
};
