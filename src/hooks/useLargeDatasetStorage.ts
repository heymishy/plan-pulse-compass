import { useState, useEffect, useCallback } from 'react';
import { deriveKey, encryptData, decryptData } from '@/utils/crypto';

// Configuration for large dataset handling
const LARGE_DATASET_THRESHOLD = 1000; // Objects count threshold
const CHUNK_SIZE = 500; // Objects per chunk
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit per key

// Check if localStorage is available
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

// Custom JSON.stringify with circular reference detection and depth limiting
const safeStringify = (obj: any, maxDepth = 10): string => {
  const seen = new WeakSet();

  const replacer = (key: string, value: any, depth = 0): any => {
    // Limit recursion depth to prevent stack overflow
    if (depth >= maxDepth) {
      return '[Truncated: Max depth reached]';
    }

    // Handle null and primitive values
    if (value === null || typeof value !== 'object') {
      return value;
    }

    // Detect circular references
    if (seen.has(value)) {
      return '[Circular Reference]';
    }

    seen.add(value);

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((item, index) =>
        replacer(`${key}[${index}]`, item, depth + 1)
      );
    }

    // Handle objects
    const result: any = {};
    for (const [objKey, objValue] of Object.entries(value)) {
      result[objKey] = replacer(objKey, objValue, depth + 1);
    }

    return result;
  };

  try {
    return JSON.stringify(obj, (key, value) => replacer(key, value));
  } catch (error) {
    console.error('Failed to stringify object:', error);
    return JSON.stringify({
      error: 'Serialization failed',
      timestamp: Date.now(),
    });
  }
};

// Split large arrays into chunks for storage
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Calculate storage size estimate
const estimateStorageSize = (data: any): number => {
  try {
    return new Blob([safeStringify(data)]).size;
  } catch {
    return 0;
  }
};

interface ChunkedStorageMetadata {
  totalChunks: number;
  totalItems: number;
  lastUpdated: string;
  version: string;
}

export function useLargeDatasetStorage<T>(
  key: string,
  initialValue: T[],
  encryptionKey: string = 'default-key'
) {
  const [storedValue, setStoredValue] = useState<T[]>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageStats, setStorageStats] = useState({
    isChunked: false,
    chunkCount: 0,
    totalSize: 0,
    compressionRatio: 1,
  });

  const metadataKey = `${key}_metadata`;

  // Load data from localStorage with chunking support
  const loadValue = useCallback(async () => {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available, using initial value');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const derivedKey = await deriveKey(
        encryptionKey,
        new TextEncoder().encode(key)
      );

      // Check if data is stored in chunks
      const metadataStr = window.localStorage.getItem(metadataKey);

      if (metadataStr) {
        // Load chunked data
        const metadata: ChunkedStorageMetadata = JSON.parse(metadataStr);
        const chunks: T[] = [];

        for (let i = 0; i < metadata.totalChunks; i++) {
          const chunkKey = `${key}_chunk_${i}`;
          const chunkData = window.localStorage.getItem(chunkKey);

          if (chunkData) {
            const parsedChunk = JSON.parse(chunkData);
            const decrypted = await decryptData(parsedChunk, derivedKey);
            const chunkItems: T[] = JSON.parse(decrypted);
            chunks.push(...chunkItems);
          }
        }

        setStoredValue(chunks);
        setStorageStats({
          isChunked: true,
          chunkCount: metadata.totalChunks,
          totalSize: estimateStorageSize(chunks),
          compressionRatio: 1,
        });
      } else {
        // Try to load as single item (legacy format)
        const item = window.localStorage.getItem(key);

        if (item) {
          const parsedItem = JSON.parse(item);

          if (
            parsedItem &&
            typeof parsedItem.iv === 'string' &&
            typeof parsedItem.encrypted === 'string'
          ) {
            // Encrypted data
            const decrypted = await decryptData(parsedItem, derivedKey);
            const data = JSON.parse(decrypted);
            setStoredValue(Array.isArray(data) ? data : initialValue);
          } else {
            // Unencrypted legacy data
            setStoredValue(
              Array.isArray(parsedItem) ? parsedItem : initialValue
            );
          }

          setStorageStats({
            isChunked: false,
            chunkCount: 1,
            totalSize: estimateStorageSize(item),
            compressionRatio: 1,
          });
        } else {
          setStoredValue(initialValue);
        }
      }
    } catch (error) {
      console.error(
        `Error loading data from localStorage key "${key}":`,
        error
      );
      setError(`Failed to load data: ${error}`);
      setStoredValue(initialValue);
    } finally {
      setIsLoading(false);
    }
  }, [key, encryptionKey, initialValue, metadataKey]);

  // Save data to localStorage with chunking for large datasets
  const setValue = useCallback(
    async (value: T[] | ((val: T[]) => T[])) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        setError(null);

        if (!isLocalStorageAvailable()) {
          console.warn('localStorage is not available, data will not persist');
          return;
        }

        const derivedKey = await deriveKey(
          encryptionKey,
          new TextEncoder().encode(key)
        );

        // Estimate storage size
        const estimatedSize = estimateStorageSize(valueToStore);

        // Determine if chunking is needed
        const needsChunking =
          valueToStore.length > LARGE_DATASET_THRESHOLD ||
          estimatedSize > MAX_STORAGE_SIZE;

        if (needsChunking) {
          console.log(
            `Large dataset detected (${valueToStore.length} items, ~${Math.round(estimatedSize / 1024)}KB), using chunked storage`
          );

          // Clear any existing single-key storage
          window.localStorage.removeItem(key);

          // Split into chunks
          const chunks = chunkArray(valueToStore, CHUNK_SIZE);

          // Store each chunk
          for (let i = 0; i < chunks.length; i++) {
            const chunkKey = `${key}_chunk_${i}`;
            const chunkData = safeStringify(chunks[i]);
            const encrypted = await encryptData(chunkData, derivedKey);
            window.localStorage.setItem(chunkKey, JSON.stringify(encrypted));
          }

          // Store metadata
          const metadata: ChunkedStorageMetadata = {
            totalChunks: chunks.length,
            totalItems: valueToStore.length,
            lastUpdated: new Date().toISOString(),
            version: '1.0',
          };
          window.localStorage.setItem(metadataKey, JSON.stringify(metadata));

          // Clean up any orphaned chunks
          let chunkIndex = chunks.length;
          while (window.localStorage.getItem(`${key}_chunk_${chunkIndex}`)) {
            window.localStorage.removeItem(`${key}_chunk_${chunkIndex}`);
            chunkIndex++;
          }

          setStorageStats({
            isChunked: true,
            chunkCount: chunks.length,
            totalSize: estimatedSize,
            compressionRatio: 1,
          });

          console.log(
            `✅ Successfully saved ${valueToStore.length} items in ${chunks.length} chunks`
          );
        } else {
          // Store as single item for smaller datasets
          // Clear any existing chunked storage
          window.localStorage.removeItem(metadataKey);
          let chunkIndex = 0;
          while (window.localStorage.getItem(`${key}_chunk_${chunkIndex}`)) {
            window.localStorage.removeItem(`${key}_chunk_${chunkIndex}`);
            chunkIndex++;
          }

          const dataToStore = safeStringify(valueToStore);
          const encrypted = await encryptData(dataToStore, derivedKey);
          window.localStorage.setItem(key, JSON.stringify(encrypted));

          setStorageStats({
            isChunked: false,
            chunkCount: 1,
            totalSize: estimatedSize,
            compressionRatio: 1,
          });

          console.log(
            `✅ Successfully saved ${valueToStore.length} items as single entry`
          );
        }

        // Dispatch storage event for cross-component synchronization
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(
            new CustomEvent('largeDatasetstorage', {
              detail: {
                key,
                itemCount: valueToStore.length,
                isChunked: needsChunking,
              },
            })
          );
        }
      } catch (error) {
        console.error(
          `Error saving large dataset to localStorage key "${key}":`,
          error
        );
        setError(`Failed to save data: ${error}`);
      }
    },
    [storedValue, key, encryptionKey, metadataKey]
  );

  // Load data on mount and when key changes
  useEffect(() => {
    loadValue();
  }, [key, encryptionKey]); // Only depend on key and encryptionKey, not the loadValue function

  // Listen for storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if ('detail' in e && e.detail.key === key) {
        // Reload data when our key is updated
        loadValue();
      } else if ('key' in e && (e.key === key || e.key === metadataKey)) {
        // Standard storage event
        loadValue();
      }
    };

    window.addEventListener('storage', handleStorageChange as EventListener);
    window.addEventListener(
      'largeDatasetstorage',
      handleStorageChange as EventListener
    );

    return () => {
      window.removeEventListener(
        'storage',
        handleStorageChange as EventListener
      );
      window.removeEventListener(
        'largeDatasetstorage',
        handleStorageChange as EventListener
      );
    };
  }, [key, metadataKey]); // Removed loadValue from dependencies to prevent infinite loop

  return [storedValue, setValue, isLoading, error, storageStats] as const;
}
