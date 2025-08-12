import { renderHook, act } from '@testing-library/react';
import { useLargeDatasetStorage } from '../useLargeDatasetStorage';
import { Person } from '@/types';
import { vi } from 'vitest';

// Mock crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid',
    subtle: {
      importKey: vi.fn().mockResolvedValue({}),
      deriveKey: vi.fn().mockResolvedValue({}),
      encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    },
    getRandomValues: vi.fn().mockReturnValue(new Uint8Array(12)),
  },
});

// Mock TextEncoder/TextDecoder
global.TextEncoder = vi.fn().mockImplementation(() => ({
  encode: vi.fn().mockReturnValue(new Uint8Array()),
}));

global.TextDecoder = vi.fn().mockImplementation(() => ({
  decode: vi.fn().mockReturnValue('{}'),
}));

// Mock btoa/atob
global.btoa = vi
  .fn()
  .mockImplementation(str => Buffer.from(str, 'binary').toString('base64'));
global.atob = vi
  .fn()
  .mockImplementation(str => Buffer.from(str, 'base64').toString('binary'));

// Mock localStorage
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

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.dispatchEvent
window.dispatchEvent = vi.fn();

describe('useLargeDatasetStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should handle small datasets normally', async () => {
    const { result } = renderHook(() =>
      useLargeDatasetStorage<Person>('test-key', [])
    );

    expect(result.current[0]).toEqual([]);
    expect(result.current[2]).toBe(false); // isLoading should be false after initial load
    expect(result.current[3]).toBe(null); // error should be null
  });

  it('should handle large datasets with chunking', async () => {
    const largePeopleArray: Person[] = Array.from({ length: 1500 }, (_, i) => ({
      id: `person-${i}`,
      name: `Person ${i}`,
      email: `person${i}@example.com`,
      roleId: 'role-1',
      teamId: 'team-1',
      isActive: true,
      employmentType: 'permanent' as const,
      startDate: '2024-01-01',
    }));

    const { result } = renderHook(() =>
      useLargeDatasetStorage<Person>('test-large-key', [])
    );

    await act(async () => {
      await result.current[1](largePeopleArray);
    });

    // Verify that chunked storage was used
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-large-key_metadata',
      expect.stringContaining('totalChunks')
    );

    // Verify storage stats indicate chunking
    expect(result.current[4].isChunked).toBe(true);
    expect(result.current[4].chunkCount).toBeGreaterThan(1);
  });

  it('should prevent stack overflow with deep nested objects', async () => {
    const deepObject: Person = {
      id: 'person-1',
      name: 'Test Person',
      email: 'test@example.com',
      roleId: 'role-1',
      teamId: 'team-1',
      isActive: true,
      employmentType: 'permanent',
      startDate: '2024-01-01',
      skillProficiencies: Array.from({ length: 100 }, (_, i) => ({
        skillId: `skill-${i}`,
        skillName: `Skill ${i}`,
        level: 'intermediate' as const,
        yearsOfExperience: 5,
      })),
    };

    const { result } = renderHook(() =>
      useLargeDatasetStorage<Person>('test-deep-key', [])
    );

    // This should not throw a "Maximum call stack size exceeded" error
    await act(async () => {
      await result.current[1]([deepObject]);
    });

    expect(result.current[3]).toBe(null); // No error should occur
  });

  it('should handle circular references gracefully', async () => {
    const person: any = {
      id: 'person-1',
      name: 'Test Person',
      email: 'test@example.com',
      roleId: 'role-1',
      teamId: 'team-1',
      isActive: true,
      employmentType: 'permanent',
      startDate: '2024-01-01',
    };

    // Create circular reference
    person.self = person;

    const { result } = renderHook(() =>
      useLargeDatasetStorage<Person>('test-circular-key', [])
    );

    // This should not throw due to circular reference
    await act(async () => {
      await result.current[1]([person]);
    });

    expect(result.current[3]).toBe(null); // No error should occur
  });

  it('should migrate from legacy single storage to chunked storage', async () => {
    // Simulate legacy data in localStorage
    const legacyData = [
      {
        id: 'person-1',
        name: 'Legacy Person',
        email: 'legacy@example.com',
        roleId: 'role-1',
        teamId: 'team-1',
        isActive: true,
        employmentType: 'permanent',
        startDate: '2024-01-01',
      },
    ];

    localStorageMock.setItem(
      'test-migration-key',
      JSON.stringify({
        iv: 'test-iv',
        encrypted: 'test-encrypted-data',
      })
    );

    const { result } = renderHook(() =>
      useLargeDatasetStorage<Person>('test-migration-key', [])
    );

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Should load without errors
    expect(result.current[3]).toBe(null);
  });
});
