import React, { ReactNode } from 'react';
import { AppProvider, ScenarioAwareAppProvider } from './AppContext';

// Safe wrapper that uses ScenarioAwareAppProvider now that circular dependency is resolved
export const SafeScenarioAwareAppProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  // Now that ScenarioProvider no longer calls useApp(), we can safely use
  // ScenarioAwareAppProvider without circular dependency issues
  return <ScenarioAwareAppProvider>{children}</ScenarioAwareAppProvider>;
};
