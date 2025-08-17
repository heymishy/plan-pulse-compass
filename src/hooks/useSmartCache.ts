import { useState, useEffect, useCallback, useRef } from 'react';
import { encryptData, decryptData, deriveKey } from '@/utils/crypto';

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  BACKGROUND_SYNC_INTERVAL: 30 * 1000, // 30 seconds
  STALE_WHILE_REVALIDATE: 2 * 60 * 1000, // 2 minutes
  MAX_CONCURRENT_REQUESTS: 5,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: number;
  hits: number;
  lastAccessed: number;
  size: number;
  dependencies?: string[];
}

export interface CacheOptions {
  ttl?: number;
  staleWhileRevalidate?: boolean;
  dependencies?: string[];
  backgroundRefresh?: boolean;
  encrypted?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

export interface SmartCacheConfig {
  encryptionKey?: string;
  maxSize?: number;
  defaultTTL?: number;
  backgroundSync?: boolean;
  persistToDisk?: boolean;
  namespace?: string;
}

class SmartCacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private requestQueue = new Map<string, Promise<any>>();
  private backgroundTasks = new Set<NodeJS.Timeout>();
  private requestTracker = new Map<string, number>();
  private encryption: {
    enabled: boolean;
    key: string;
  } = { enabled: false, key: '' };

  constructor(private config: SmartCacheConfig) {
    this.initializeEncryption();
    this.startBackgroundSync();
    this.loadPersistedCache();

    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.persistCache();
        this.cleanup();
      });
    }
  }

  private async initializeEncryption() {
    if (this.config.encryptionKey) {
      this.encryption.enabled = true;
      this.encryption.key = this.config.encryptionKey;
    }
  }

  private startBackgroundSync() {
    if (!this.config.backgroundSync) return;

    const interval = setInterval(() => {
      this.cleanupExpired();
      this.evictLRU();
      this.revalidateStale();
    }, CACHE_CONFIG.BACKGROUND_SYNC_INTERVAL);

    this.backgroundTasks.add(interval);
  }

  private async loadPersistedCache() {
    if (!this.config.persistToDisk || typeof window === 'undefined') return;

    try {
      const key = `smart_cache_${this.config.namespace || 'default'}`;
      const stored = localStorage.getItem(key);
      if (!stored) return;

      let cacheData;
      if (this.encryption.enabled) {
        const derivedKey = await deriveKey(
          this.encryption.key,
          new TextEncoder().encode(key)
        );
        const parsedData = JSON.parse(stored);
        const decrypted = await decryptData(parsedData, derivedKey);
        cacheData = JSON.parse(decrypted);
      } else {
        cacheData = JSON.parse(stored);
      }

      // Restore cache entries
      Object.entries(cacheData).forEach(([cacheKey, entry]) => {
        this.cache.set(cacheKey, entry as CacheEntry<any>);
      });

      console.log(`📦 Loaded ${this.cache.size} cached entries from storage`);
    } catch (error) {
      console.warn('Failed to load persisted cache:', error);
    }
  }

  private async persistCache() {
    if (!this.config.persistToDisk || typeof window === 'undefined') return;

    try {
      const key = `smart_cache_${this.config.namespace || 'default'}`;
      const cacheData = Object.fromEntries(this.cache);

      let dataToStore;
      if (this.encryption.enabled) {
        const derivedKey = await deriveKey(
          this.encryption.key,
          new TextEncoder().encode(key)
        );
        const encrypted = await encryptData(
          JSON.stringify(cacheData),
          derivedKey
        );
        dataToStore = JSON.stringify(encrypted);
      } else {
        dataToStore = JSON.stringify(cacheData);
      }

      localStorage.setItem(key, dataToStore);
      console.log(`💾 Persisted ${this.cache.size} cache entries`);
    } catch (error) {
      console.warn('Failed to persist cache:', error);
    }
  }

  private cleanupExpired() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  private evictLRU() {
    const maxSize = this.config.maxSize || CACHE_CONFIG.MAX_CACHE_SIZE;
    const currentSize = this.getCacheSize();

    if (currentSize <= maxSize) return;

    // Sort by last accessed time and hits (LRU + LFU hybrid)
    const entries = Array.from(this.cache.entries()).sort(([, a], [, b]) => {
      const aScore = a.lastAccessed * 0.7 + a.hits * 0.3;
      const bScore = b.lastAccessed * 0.7 + b.hits * 0.3;
      return aScore - bScore;
    });

    let evicted = 0;
    let sizeFreed = 0;

    for (const [key, entry] of entries) {
      if (currentSize - sizeFreed <= maxSize * 0.8) break; // Leave 20% headroom

      this.cache.delete(key);
      evicted++;
      sizeFreed += entry.size;
    }

    if (evicted > 0) {
      console.log(
        `🔥 Evicted ${evicted} LRU entries (${Math.round(sizeFreed / 1024)}KB freed)`
      );
    }
  }

  private async revalidateStale() {
    const now = Date.now();
    const staleEntries = Array.from(this.cache.entries()).filter(
      ([, entry]) =>
        now - entry.timestamp > CACHE_CONFIG.STALE_WHILE_REVALIDATE &&
        now - entry.timestamp < entry.ttl
    );

    // Limit concurrent revalidation requests
    const concurrent = Math.min(
      staleEntries.length,
      CACHE_CONFIG.MAX_CONCURRENT_REQUESTS
    );

    for (let i = 0; i < concurrent; i++) {
      const [key] = staleEntries[i];
      // Schedule background revalidation
      setTimeout(() => this.invalidate(key), Math.random() * 5000);
    }
  }

  private getCacheSize(): number {
    return Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0
    );
  }

  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 1024; // Fallback estimate
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();

    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.hits++;
    entry.lastAccessed = now;

    return entry.data;
  }

  async set<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const now = Date.now();
    const size = this.calculateSize(data);
    const ttl =
      options.ttl || this.config.defaultTTL || CACHE_CONFIG.DEFAULT_TTL;

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl,
      version: 1,
      hits: 0,
      lastAccessed: now,
      size,
      dependencies: options.dependencies,
    };

    // Check if we need to make room
    if (
      this.getCacheSize() + size >
      (this.config.maxSize || CACHE_CONFIG.MAX_CACHE_SIZE)
    ) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
  }

  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      // Check if stale but still valid
      const entry = this.cache.get(key);
      if (entry && options.staleWhileRevalidate) {
        const age = Date.now() - entry.timestamp;
        if (age > CACHE_CONFIG.STALE_WHILE_REVALIDATE && age < entry.ttl) {
          // Return stale data and revalidate in background
          this.backgroundRevalidate(key, fetcher, options);
        }
      }
      return cached;
    }

    // Check if request is already in flight
    const existingRequest = this.requestQueue.get(key);
    if (existingRequest) {
      return existingRequest;
    }

    // Create new request with retry logic
    const request = this.withRetry(() => fetcher(), key);
    this.requestQueue.set(key, request);

    try {
      const data = await request;
      await this.set(key, data, options);
      return data;
    } finally {
      this.requestQueue.delete(key);
    }
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    key: string,
    attempt = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= CACHE_CONFIG.RETRY_ATTEMPTS) {
        throw error;
      }

      const delay = CACHE_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
      console.warn(
        `Retry ${attempt}/${CACHE_CONFIG.RETRY_ATTEMPTS} for ${key} after ${delay}ms`
      );

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.withRetry(fn, key, attempt + 1);
    }
  }

  private async backgroundRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ) {
    try {
      const data = await fetcher();
      await this.set(key, data, options);
      console.log(`🔄 Background revalidated: ${key}`);
    } catch (error) {
      console.warn(`Failed to background revalidate ${key}:`, error);
    }
  }

  invalidate(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.requestQueue.delete(key);

    // Invalidate dependent entries
    const entry = this.cache.get(key);
    if (entry?.dependencies) {
      entry.dependencies.forEach(dep => this.invalidate(dep));
    }

    return deleted;
  }

  invalidatePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.invalidate(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.cache.clear();
    this.requestQueue.clear();
  }

  getStats(): {
    size: number;
    entries: number;
    hitRate: number;
    memoryUsage: string;
  } {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const totalRequests =
      entries.reduce((sum, entry) => sum + entry.hits, 0) +
      this.requestQueue.size;

    return {
      size: this.getCacheSize(),
      entries: this.cache.size,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      memoryUsage: `${Math.round((this.getCacheSize() / 1024 / 1024) * 100) / 100}MB`,
    };
  }

  cleanup(): void {
    this.backgroundTasks.forEach(task => clearInterval(task));
    this.backgroundTasks.clear();
    this.persistCache();
  }
}

// Global cache manager instance
let globalCacheManager: SmartCacheManager;

export function useSmartCache(config: SmartCacheConfig = {}) {
  const [stats, setStats] = useState(() => ({
    size: 0,
    entries: 0,
    hitRate: 0,
    memoryUsage: '0MB',
  }));
  const configRef = useRef(config);

  // Initialize cache manager
  useEffect(() => {
    if (!globalCacheManager) {
      globalCacheManager = new SmartCacheManager({
        defaultTTL: CACHE_CONFIG.DEFAULT_TTL,
        maxSize: CACHE_CONFIG.MAX_CACHE_SIZE,
        backgroundSync: true,
        persistToDisk: true,
        namespace: 'plan-pulse',
        ...config,
      });
    }
    configRef.current = config;
  }, [config]);

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      if (globalCacheManager) {
        setStats(globalCacheManager.getStats());
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const get = useCallback(<T>(key: string): Promise<T | null> => {
    return globalCacheManager.get<T>(key);
  }, []);

  const set = useCallback(
    <T>(key: string, data: T, options?: CacheOptions): Promise<void> => {
      return globalCacheManager.set(key, data, options);
    },
    []
  );

  const getOrFetch = useCallback(
    <T>(
      key: string,
      fetcher: () => Promise<T>,
      options?: CacheOptions
    ): Promise<T> => {
      return globalCacheManager.getOrFetch(key, fetcher, options);
    },
    []
  );

  const invalidate = useCallback((key: string): boolean => {
    return globalCacheManager.invalidate(key);
  }, []);

  const invalidatePattern = useCallback((pattern: RegExp): number => {
    return globalCacheManager.invalidatePattern(pattern);
  }, []);

  const clear = useCallback((): void => {
    globalCacheManager.clear();
  }, []);

  return {
    get,
    set,
    getOrFetch,
    invalidate,
    invalidatePattern,
    clear,
    stats,
  };
}
