import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScenarioProvider, useScenarios } from '../ScenarioContext';
import { AppProvider } from '../AppContext';
import { TeamProvider } from '../TeamContext';
import { ProjectProvider } from '../ProjectContext';
import { PlanningProvider } from '../PlanningContext';
import { SettingsProvider } from '../SettingsContext';
import { GoalProvider } from '../GoalContext';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock localStorage with actual storage behavior
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
});

// Mock window.dispatchEvent to prevent storage event loops
window.dispatchEvent = vi.fn(() => true);
window.addEventListener = vi.fn();
window.removeEventListener = vi.fn();

const AllProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <SettingsProvider>
    <TeamProvider>
      <ProjectProvider>
        <PlanningProvider>
          <GoalProvider>
            <ScenarioProvider>
              <AppProvider>{children}</AppProvider>
            </ScenarioProvider>
          </GoalProvider>
        </PlanningProvider>
      </ProjectProvider>
    </TeamProvider>
  </SettingsProvider>
);

describe('ScenarioContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('should provide initial scenario state', () => {
    const { result } = renderHook(() => useScenarios(), {
      wrapper: AllProviders,
    });

    expect(result.current.scenarios).toEqual([]);
    expect(result.current.activeScenarioId).toBeNull();
    expect(result.current.isInScenarioMode).toBe(false);
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('should create a new scenario', async () => {
    const { result } = renderHook(() => useScenarios(), {
      wrapper: AllProviders,
    });

    let scenarioId: string;

    await act(async () => {
      scenarioId = await result.current.createScenario({
        name: 'Test Scenario',
        description: 'A test scenario',
      });
    });

    expect(scenarioId).toBeDefined();
    expect(result.current.scenarios).toHaveLength(1);
    expect(result.current.scenarios[0].name).toBe('Test Scenario');
    expect(result.current.scenarios[0].description).toBe('A test scenario');
  }, 10000);

  it('should switch to a scenario', async () => {
    const { result } = renderHook(() => useScenarios(), {
      wrapper: AllProviders,
    });

    let scenarioId: string;

    // Create a scenario first
    await act(async () => {
      scenarioId = await result.current.createScenario({
        name: 'Test Scenario',
      });
    });

    // Switch to the scenario
    await act(async () => {
      await result.current.switchToScenario(scenarioId);
    });

    expect(result.current.activeScenarioId).toBe(scenarioId);
    expect(result.current.isInScenarioMode).toBe(true);
  }, 10000);

  it('should switch back to live mode', async () => {
    const { result } = renderHook(() => useScenarios(), {
      wrapper: AllProviders,
    });

    let scenarioId: string;

    // Create a scenario
    await act(async () => {
      scenarioId = await result.current.createScenario({
        name: 'Test Scenario',
      });
    });

    expect(result.current.scenarios).toHaveLength(1);

    // Switch to the scenario
    await act(async () => {
      await result.current.switchToScenario(scenarioId);
    });

    expect(result.current.isInScenarioMode).toBe(true);
    expect(result.current.activeScenarioId).toBe(scenarioId);

    // Switch back to live mode
    await act(async () => {
      result.current.switchToLive();
    });

    expect(result.current.activeScenarioId).toBeNull();
    expect(result.current.isInScenarioMode).toBe(false);
  }, 10000);

  it('should delete a scenario', async () => {
    const { result } = renderHook(() => useScenarios(), {
      wrapper: AllProviders,
    });

    let scenarioId: string;

    // Create a scenario
    await act(async () => {
      scenarioId = await result.current.createScenario({
        name: 'Test Scenario',
      });
    });

    expect(result.current.scenarios).toHaveLength(1);

    // Delete the scenario
    await act(async () => {
      await result.current.deleteScenario(scenarioId);
    });

    expect(result.current.scenarios).toHaveLength(0);
    expect(result.current.activeScenarioId).toBeNull();
  }, 10000);

  it('should return current data when not in scenario mode', () => {
    const { result } = renderHook(() => useScenarios(), {
      wrapper: AllProviders,
    });

    const currentData = result.current.getCurrentData();

    expect(currentData).toBeDefined();
    expect(currentData.people).toBeDefined();
    expect(currentData.teams).toBeDefined();
    expect(currentData.projects).toBeDefined();
  });

  it('should have built-in templates available', () => {
    const { result } = renderHook(() => useScenarios(), {
      wrapper: AllProviders,
    });

    expect(result.current.templates.length).toBeGreaterThan(0);
    expect(result.current.templates.some(t => t.name.includes('Budget'))).toBe(
      true
    );
    expect(result.current.templates.some(t => t.name.includes('Team'))).toBe(
      true
    );
  });

  it('should create scenario from template', async () => {
    const { result } = renderHook(() => useScenarios(), {
      wrapper: AllProviders,
    });

    const budgetTemplate = result.current.templates.find(t =>
      t.name.includes('Budget')
    );

    expect(budgetTemplate).toBeDefined();

    let scenarioId: string;

    await act(async () => {
      scenarioId = await result.current.createScenarioFromTemplate(
        budgetTemplate!.id,
        { budgetReduction: 10 }
      );
    });

    expect(scenarioId).toBeDefined();
    expect(result.current.scenarios).toHaveLength(1);
    expect(result.current.scenarios[0].templateId).toBe(budgetTemplate!.id);
    expect(result.current.scenarios[0].templateName).toBe(budgetTemplate!.name);
  }, 10000);

  it('should handle scenario expiration', async () => {
    const { result } = renderHook(() => useScenarios(), {
      wrapper: AllProviders,
    });

    // Create a scenario with future expiration date first
    await act(async () => {
      await result.current.createScenario({
        name: 'Test Scenario',
        expiresAt: '2025-01-16T00:00:00.000Z', // Future date
      });
    });

    expect(result.current.scenarios).toHaveLength(1);

    // Now create an expired scenario (this tests the actual expiration logic)
    await act(async () => {
      await result.current.createScenario({
        name: 'Expired Scenario',
        expiresAt: '2020-01-14T00:00:00.000Z', // Already expired (way in the past)
      });
    });

    // At this point we should have 2 scenarios (one expired, one not expired)
    // Auto-cleanup only runs on mount, not after each scenario creation
    expect(result.current.scenarios).toHaveLength(2);

    // Run cleanup manually - should remove only the expired scenario
    await act(async () => {
      await result.current.cleanupExpiredScenarios();
    });

    expect(result.current.scenarios).toHaveLength(1);
    expect(result.current.scenarios[0].name).toBe('Test Scenario');
  }, 10000);

  it('should generate scenario comparison', async () => {
    const { result } = renderHook(() => useScenarios(), {
      wrapper: AllProviders,
    });

    let scenarioId: string;

    // Create a scenario
    await act(async () => {
      scenarioId = await result.current.createScenario({
        name: 'Test Scenario',
      });
    });

    // Get comparison
    let comparison: any;
    await act(async () => {
      comparison = await result.current.getScenarioComparison(scenarioId);
    });

    expect(comparison).toBeDefined();
    expect(comparison.scenarioId).toBe(scenarioId);
    expect(comparison.scenarioName).toBe('Test Scenario');
    expect(comparison.summary).toBeDefined();
    expect(comparison.changes).toBeDefined();
  }, 10000);
});
