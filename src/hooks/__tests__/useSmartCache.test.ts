import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useSmartCache } from '../useSmartCache';

// Mock crypto utilities
vi.mock('@/utils/crypto', () => ({
  encryptData: vi.fn(data =>
    Promise.resolve({ encrypted: `encrypted_${data}`, iv: 'test_iv' })
  ),
  decryptData: vi.fn(data =>
    Promise.resolve(data.encrypted.replace('encrypted_', ''))
  ),
  deriveKey: vi.fn(() => Promise.resolve('derived_key')),
}));

// Mock localStorage
const mockLocalStorage = (() => {
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
    length: 0,
    key: vi.fn(),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

describe('useSmartCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  afterAll(() => {
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
  });

  describe('Basic Cache Operations', () => {
    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => useSmartCache());

      expect(result.current.stats).toEqual({
        size: 0,
        entries: 0,
        hitRate: 0,
        memoryUsage: '0MB',
      });
    });

    it('should store and retrieve data', async () => {
      const { result } = renderHook(() => useSmartCache());
      const testData = { id: 1, name: 'Test Item' };

      await act(async () => {
        await result.current.set('test-key', testData);
      });

      await act(async () => {
        const retrieved = await result.current.get<typeof testData>('test-key');
        expect(retrieved).toEqual(testData);
      });
    });

    it('should return null for non-existent keys', async () => {
      const { result } = renderHook(() => useSmartCache());

      await act(async () => {
        const retrieved = await result.current.get('non-existent');
        expect(retrieved).toBeNull();
      });
    });

    it('should handle getOrFetch with cache miss', async () => {
      const { result } = renderHook(() => useSmartCache());
      const testData = { id: 1, name: 'Fetched Item' };
      const fetcher = vi.fn().mockResolvedValue(testData);

      let fetchedData: typeof testData;
      await act(async () => {
        fetchedData = await result.current.getOrFetch('test-key', fetcher);
      });

      expect(fetchedData!).toEqual(testData);
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await act(async () => {
        fetchedData = await result.current.getOrFetch('test-key', fetcher);
      });

      expect(fetchedData!).toEqual(testData);
      expect(fetcher).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should handle getOrFetch with cache hit', async () => {
      const { result } = renderHook(() => useSmartCache());
      const testData = { id: 1, name: 'Cached Item' };

      // First set data in cache
      await act(async () => {
        await result.current.set('test-key', testData);
      });

      const fetcher = vi
        .fn()
        .mockResolvedValue({ id: 2, name: 'Should not be called' });

      let fetchedData: typeof testData;
      await act(async () => {
        fetchedData = await result.current.getOrFetch('test-key', fetcher);
      });

      expect(fetchedData!).toEqual(testData);
      expect(fetcher).not.toHaveBeenCalled();
    });
  });

  describe('Cache Expiration', () => {
    it('should expire data after TTL', async () => {
      const { result } = renderHook(() => useSmartCache());
      const testData = { id: 1, name: 'Expiring Item' };
      const shortTTL = 1000; // 1 second

      await act(async () => {
        await result.current.set('test-key', testData, { ttl: shortTTL });
      });

      // Data should be available immediately
      await act(async () => {
        const retrieved = await result.current.get('test-key');
        expect(retrieved).toEqual(testData);
      });

      // Fast forward time beyond TTL
      act(() => {
        vi.advanceTimersByTime(shortTTL + 100);
      });

      // Data should be expired
      await act(async () => {
        const retrieved = await result.current.get('test-key');
        expect(retrieved).toBeNull();
      });
    });

    it('should handle stale-while-revalidate', async () => {
      const { result } = renderHook(() => useSmartCache());
      const initialData = { id: 1, name: 'Initial Item' };
      const freshData = { id: 1, name: 'Fresh Item' };
      const longTTL = 10000; // 10 seconds

      // First set data with long TTL
      await act(async () => {
        await result.current.set('test-key', initialData, { ttl: longTTL });
      });

      // Fast forward to make data stale but not expired
      act(() => {
        vi.advanceTimersByTime(3000); // 3 seconds (beyond stale threshold)
      });

      const fetcher = vi.fn().mockResolvedValue(freshData);

      let retrievedData;
      await act(async () => {
        retrievedData = await result.current.getOrFetch('test-key', fetcher, {
          staleWhileRevalidate: true,
        });
      });

      // Should return stale data immediately
      expect(retrievedData).toEqual(initialData);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate single cache entry', async () => {
      const { result } = renderHook(() => useSmartCache());
      const testData = { id: 1, name: 'Test Item' };

      await act(async () => {
        await result.current.set('test-key', testData);
      });

      // Verify data exists
      await act(async () => {
        const retrieved = await result.current.get('test-key');
        expect(retrieved).toEqual(testData);
      });

      // Invalidate
      let invalidated: boolean;
      await act(async () => {
        invalidated = result.current.invalidate('test-key');
      });

      expect(invalidated!).toBe(true);

      // Verify data is gone
      await act(async () => {
        const retrieved = await result.current.get('test-key');
        expect(retrieved).toBeNull();
      });
    });

    it('should invalidate by pattern', async () => {
      const { result } = renderHook(() => useSmartCache());

      await act(async () => {
        await result.current.set('user-1', { id: 1 });
        await result.current.set('user-2', { id: 2 });
        await result.current.set('post-1', { id: 1 });
      });

      // Invalidate all user entries
      let invalidatedCount: number;
      await act(async () => {
        invalidatedCount = result.current.invalidatePattern(/^user-/);
      });

      expect(invalidatedCount!).toBe(2);

      // Verify user entries are gone but post entry remains
      await act(async () => {
        expect(await result.current.get('user-1')).toBeNull();
        expect(await result.current.get('user-2')).toBeNull();
        expect(await result.current.get('post-1')).toEqual({ id: 1 });
      });
    });

    it('should clear all cache entries', async () => {
      const { result } = renderHook(() => useSmartCache());

      await act(async () => {
        await result.current.set('key1', { data: 1 });
        await result.current.set('key2', { data: 2 });
        await result.current.set('key3', { data: 3 });
      });

      act(() => {
        result.current.clear();
      });

      // All entries should be gone
      await act(async () => {
        expect(await result.current.get('key1')).toBeNull();
        expect(await result.current.get('key2')).toBeNull();
        expect(await result.current.get('key3')).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetcher errors with retry', async () => {
      const { result } = renderHook(() => useSmartCache());
      const error = new Error('Fetch failed');
      let callCount = 0;

      const fetcher = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(error);
        }
        return Promise.resolve({ id: 1, name: 'Success' });
      });

      let fetchedData: any;
      await act(async () => {
        try {
          fetchedData = await result.current.getOrFetch('test-key', fetcher);
        } catch (err) {
          // Should eventually succeed after retries
        }
      });

      // Should have retried multiple times
      expect(fetcher).toHaveBeenCalledTimes(3);
      expect(fetchedData).toEqual({ id: 1, name: 'Success' });
    });

    it('should handle persistent fetcher failures', async () => {
      const { result } = renderHook(() => useSmartCache());
      const error = new Error('Persistent failure');
      const fetcher = vi.fn().mockRejectedValue(error);

      await act(async () => {
        await expect(
          result.current.getOrFetch('test-key', fetcher)
        ).rejects.toThrow('Persistent failure');
      });

      // Should have retried the maximum number of times
      expect(fetcher).toHaveBeenCalledTimes(3);
    });
  });

  describe('Cache Statistics', () => {
    it('should update statistics as cache is used', async () => {
      const { result } = renderHook(() =>
        useSmartCache({
          defaultTTL: 5000,
          maxSize: 1024 * 1024, // 1MB
        })
      );

      await act(async () => {
        await result.current.set('key1', { data: 'test1' });
        await result.current.set('key2', { data: 'test2' });
      });

      // Access items to increase hit count
      await act(async () => {
        await result.current.get('key1');
        await result.current.get('key1'); // Hit key1 twice
        await result.current.get('key2');
      });

      // Fast forward to trigger stats update
      act(() => {
        vi.advanceTimersByTime(5100); // Trigger stats update interval
      });

      await waitFor(() => {
        expect(result.current.stats.entries).toBeGreaterThan(0);
      });
    });

    it('should provide memory usage information', async () => {
      const { result } = renderHook(() => useSmartCache());
      const largeData = { data: 'x'.repeat(1000) }; // 1KB of data

      await act(async () => {
        await result.current.set('large-key', largeData);
      });

      // Wait for stats update
      act(() => {
        vi.advanceTimersByTime(5100);
      });

      await waitFor(() => {
        expect(result.current.stats.memoryUsage).not.toBe('0MB');
      });
    });
  });

  describe('Background Processing', () => {
    it('should run cleanup processes in background', async () => {
      const { result } = renderHook(() =>
        useSmartCache({
          backgroundSync: true,
          defaultTTL: 1000,
        })
      );

      const expiredData = { id: 1, name: 'Will Expire' };
      const validData = { id: 2, name: 'Still Valid' };

      await act(async () => {
        await result.current.set('expired-key', expiredData, { ttl: 500 });
        await result.current.set('valid-key', validData, { ttl: 10000 });
      });

      // Fast forward past cleanup interval and expired TTL
      act(() => {
        vi.advanceTimersByTime(31000); // Past background sync interval
      });

      // Expired data should be cleaned up
      await act(async () => {
        expect(await result.current.get('expired-key')).toBeNull();
        expect(await result.current.get('valid-key')).toEqual(validData);
      });
    });
  });

  describe('Configuration Options', () => {
    it('should accept custom configuration', () => {
      const customConfig = {
        defaultTTL: 10000,
        maxSize: 2 * 1024 * 1024, // 2MB
        backgroundSync: false,
        persistToDisk: false,
        namespace: 'test-cache',
      };

      const { result } = renderHook(() => useSmartCache(customConfig));

      // Should initialize without error
      expect(result.current.stats).toEqual({
        size: 0,
        entries: 0,
        hitRate: 0,
        memoryUsage: '0MB',
      });
    });

    it('should handle encryption configuration', () => {
      const { result } = renderHook(() =>
        useSmartCache({
          encryptionKey: 'test-encryption-key',
        })
      );

      // Should initialize with encryption enabled
      expect(result.current.stats).toEqual({
        size: 0,
        entries: 0,
        hitRate: 0,
        memoryUsage: '0MB',
      });
    });
  });
});
