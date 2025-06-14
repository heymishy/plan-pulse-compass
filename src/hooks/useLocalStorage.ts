
import { useState, useEffect } from 'react';

// Encryption utilities (simple XOR for demo - in production use proper encryption)
const encrypt = (text: string, key: string): string => {
  try {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
};

const decrypt = (encryptedText: string, key: string): string => {
  try {
    const text = atob(encryptedText);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
};

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

export function useEncryptedLocalStorage<T>(key: string, initialValue: T, encryptionKey: string = 'default-key') {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available, using initial value');
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const decrypted = decrypt(item, encryptionKey);
        const parsed = JSON.parse(decrypted);
        console.log(`Successfully loaded encrypted data for key "${key}"`);
        return parsed;
      }
      console.log(`No stored data found for key "${key}", using initial value`);
      return initialValue;
    } catch (error) {
      console.error(`Error reading encrypted data from localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (isLocalStorageAvailable()) {
        const encrypted = encrypt(JSON.stringify(valueToStore), encryptionKey);
        window.localStorage.setItem(key, encrypted);
        console.log(`Successfully saved encrypted data for key "${key}"`);
      } else {
        console.warn('localStorage is not available, data will not persist');
      }
    } catch (error) {
      console.error(`Error saving encrypted data to localStorage key "${key}":`, error);
    }
  };

  // Sync with localStorage on mount and when key changes
  useEffect(() => {
    if (!isLocalStorageAvailable()) return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const decrypted = decrypt(item, encryptionKey);
        const parsed = JSON.parse(decrypted);
        setStoredValue(parsed);
        console.log(`Synced encrypted data for key "${key}" on mount`);
      }
    } catch (error) {
      console.error(`Error syncing encrypted data from localStorage key "${key}":`, error);
    }
  }, [key, encryptionKey]);

  return [storedValue, setValue] as const;
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
      const valueToStore = value instanceof Function ? value(storedValue) : value;
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
