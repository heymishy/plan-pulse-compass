/**
 * Utility functions for generating and managing shortnames for projects and epics
 */

/**
 * Generate a shortname from a full name
 * @param name The full name to generate a shortname from
 * @param maxLength Maximum length of the shortname (default: 10)
 * @returns A shortened version of the name
 */
export function generateShortname(
  name: string,
  maxLength: number = 10
): string {
  if (!name || name.trim().length === 0) {
    return '';
  }

  const cleanName = name.trim();

  // If the name is already short enough, return it
  if (cleanName.length <= maxLength) {
    return cleanName;
  }

  // Try to create an acronym from multiple words
  const words = cleanName.split(/\s+/);
  if (words.length > 1) {
    const acronym = words.map(word => word.charAt(0).toUpperCase()).join('');

    if (acronym.length <= maxLength) {
      return acronym;
    }
  }

  // If single word or acronym is too long, truncate with smart logic
  if (words.length === 1 || words.length > maxLength) {
    // Remove vowels except the first character, then truncate
    const firstChar = cleanName.charAt(0);
    const remaining = cleanName.slice(1).replace(/[aeiouAEIOU]/g, '');
    const shortened = (firstChar + remaining).slice(0, maxLength);
    return shortened;
  }

  // For multi-word names, take first few letters of each word
  const lettersPerWord = Math.floor(maxLength / words.length);
  const shortname = words
    .map(word => word.slice(0, Math.max(1, lettersPerWord)))
    .join('')
    .slice(0, maxLength);

  return shortname;
}

/**
 * Get display name for a project or epic, preferring shortname if available
 * @param item Project or Epic object
 * @param useShortname Whether to use shortname if available
 * @returns Display name to use
 */
export function getDisplayName(
  item: { name: string; shortname?: string },
  useShortname: boolean = true
): string {
  if (useShortname && item.shortname && item.shortname.trim().length > 0) {
    return item.shortname;
  }
  return item.name;
}

/**
 * Validate a shortname
 * @param shortname The shortname to validate
 * @param maxLength Maximum allowed length
 * @returns Validation result
 */
export function validateShortname(
  shortname: string,
  maxLength: number = 10
): { isValid: boolean; error?: string } {
  if (!shortname || shortname.trim().length === 0) {
    return { isValid: true }; // Empty shortname is valid (will fall back to generated one)
  }

  const trimmed = shortname.trim();

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      error: `Shortname must be ${maxLength} characters or less`,
    };
  }

  // Check for invalid characters (only allow letters, numbers, spaces, and basic punctuation)
  const validPattern = /^[a-zA-Z0-9\s\-_.]+$/;
  if (!validPattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'Shortname contains invalid characters',
    };
  }

  return { isValid: true };
}

/**
 * Ensure a project or epic has a shortname, generating one if needed
 * @param item Project or Epic object
 * @returns Item with shortname populated
 */
export function ensureShortname<T extends { name: string; shortname?: string }>(
  item: T
): T & { shortname: string } {
  if (item.shortname && item.shortname.trim().length > 0) {
    return { ...item, shortname: item.shortname };
  }

  return {
    ...item,
    shortname: generateShortname(item.name),
  };
}
