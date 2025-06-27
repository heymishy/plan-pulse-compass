import { useState, useEffect, useCallback } from 'react';
import { deriveKey, encryptData, decryptData } from '@/utils/crypto';

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

export function useEncryptedLocalStorage<T>(
  key: string,
  initialValue: T,
  encryptionKey: string = 'default-key'
) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available, using initial value');
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadValue = async () => {
      setIsLoading(true);
      try {
        const derivedKey = await deriveKey(
          encryptionKey,
          new TextEncoder().encode(key)
        );
        const item = window.localStorage.getItem(key);
        if (item) {
          const parsedItem = JSON.parse(item);

          if (
            parsedItem &&
            typeof parsedItem.iv === 'string' &&
            typeof parsedItem.encrypted === 'string'
          ) {
            // Data is already encrypted, decrypt it
            const decrypted = await decryptData(parsedItem, derivedKey);
            if (isMounted) {
              setStoredValue(JSON.parse(decrypted));
            }
            console.log(
              `Successfully loaded and decrypted data for key "${key}"`
            );
          } else {
            // Data is unencrypted (old format), migrate it
            console.log(
              `Old data format detected for key "${key}". Migrating to encrypted format.`
            );
            if (isMounted) {
              setStoredValue(parsedItem);
            }
            const encrypted = await encryptData(
              JSON.stringify(parsedItem),
              derivedKey
            );
            window.localStorage.setItem(key, JSON.stringify(encrypted));
            console.log(
              `Successfully migrated and encrypted data for key "${key}"`
            );
          }
        } else if (isMounted) {
          setStoredValue(initialValue);
        }
      } catch (error) {
        console.error(
          `Error reading, decrypting, or migrating data from localStorage key "${key}". Data may be corrupted. Using initial value for this session, but not deleting stored data.`,
          error
        );
        if (isMounted) {
          setStoredValue(initialValue);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadValue();

    return () => {
      isMounted = false;
    };
  }, [key, encryptionKey]);

  const setValue = useCallback(
    async (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (isLocalStorageAvailable()) {
          const derivedKey = await deriveKey(
            encryptionKey,
            new TextEncoder().encode(key)
          );
          const encrypted = await encryptData(
            JSON.stringify(valueToStore),
            derivedKey
          );
          window.localStorage.setItem(key, JSON.stringify(encrypted));
          console.log(`Successfully encrypted and saved data for key "${key}"`);
        } else {
          console.warn('localStorage is not available, data will not persist');
        }
      } catch (error) {
        console.error(
          `Error saving encrypted data to localStorage key "${key}":`,
          error
        );
      }
    },
    [storedValue, key, encryptionKey]
  );

  return [storedValue, setValue, isLoading] as const;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available, using initial value');
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        console.log(`Successfully loaded data for key "${key}"`);
        return parsed;
      }
      console.log(`No stored data found for key "${key}", using initial value`);
      return initialValue;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (isLocalStorageAvailable()) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        console.log(`Successfully saved data for key "${key}"`);
      } else {
        console.warn('localStorage is not available, data will not persist');
      }
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  };

  // Sync with localStorage on mount and when key changes
  useEffect(() => {
    if (!isLocalStorageAvailable()) return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        setStoredValue(parsed);
        console.log(`Synced data for key "${key}" on mount`);
      }
    } catch (error) {
      console.error(`Error syncing from localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue] as const;
}
