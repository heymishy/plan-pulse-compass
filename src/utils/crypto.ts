
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_HASH = 'SHA-256';
const AES_ALGORITHM = 'AES-GCM';
const AES_KEY_LENGTH = 256;

/**
 * Derives a cryptographic key from a password string using PBKDF2.
 * @param password The password to derive the key from.
 * @param salt A unique salt for the key derivation.
 * @returns A promise that resolves to a CryptoKey.
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    { name: AES_ALGORITHM, length: AES_KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data using AES-GCM.
 * @param data The string data to encrypt.
 * @param key The CryptoKey to use for encryption.
 * @returns A promise that resolves to an object containing the IV and encrypted data as base64 strings.
 */
export async function encryptData(data: string, key: CryptoKey): Promise<{ iv: string; encrypted: string }> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM is recommended
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: AES_ALGORITHM,
      iv: iv,
    },
    key,
    enc.encode(data)
  );

  // Convert ArrayBuffer to Base64 string for storage
  const ivString = btoa(String.fromCharCode.apply(null, Array.from(iv)));
  const encryptedString = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(encryptedBuffer))));

  return {
    iv: ivString,
    encrypted: encryptedString,
  };
}

/**
 * Decrypts data using AES-GCM.
 * @param encryptedData An object containing the base64-encoded IV and encrypted data.
 * @param key The CryptoKey to use for decryption.
 * @returns A promise that resolves to the decrypted string data.
 */
export async function decryptData(encryptedData: { iv: string; encrypted: string }, key: CryptoKey): Promise<string> {
  // Convert Base64 strings back to Uint8Array
  const iv = new Uint8Array(Array.from(atob(encryptedData.iv), c => c.charCodeAt(0)));
  const data = new Uint8Array(Array.from(atob(encryptedData.encrypted), c => c.charCodeAt(0)));
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: AES_ALGORITHM,
      iv: iv,
    },
    key,
    data
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}
