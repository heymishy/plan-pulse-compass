/**
 * Keyboard Shortcuts Constants and Utilities
 * Separated from components to comply with react-refresh rules
 */

import React from 'react';

// Shortcut definition interface
export interface KeyboardShortcut {
  id: string;
  keys: string[];
  label: string;
  description: string;
  category: string;
  action: () => void;
  context?: string | string[];
  enabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

// Shortcut categories
export const SHORTCUT_CATEGORIES = {
  navigation: 'Navigation',
  actions: 'Actions',
  views: 'Views',
  editing: 'Editing',
  global: 'Global',
} as const;

// Platform detection for key display
export const isMac =
  typeof navigator !== 'undefined'
    ? navigator.platform.toUpperCase().indexOf('MAC') >= 0
    : false;

export const modifierKey = isMac ? 'cmd' : 'ctrl';
export const modifierSymbol = isMac ? '⌘' : 'Ctrl';

// Format key combination for display
export const formatKeys = (keys: string[]): string => {
  return keys
    .map(key => {
      switch (key.toLowerCase()) {
        case 'cmd':
          return isMac ? '⌘' : 'Ctrl';
        case 'ctrl':
          return isMac ? '⌃' : 'Ctrl';
        case 'shift':
          return '⇧';
        case 'alt':
          return isMac ? '⌥' : 'Alt';
        case 'meta':
          return isMac ? '⌘' : 'Win';
        case 'enter':
          return '↵';
        case 'escape':
          return 'Esc';
        case 'backspace':
          return '⌫';
        case 'delete':
          return 'Del';
        case 'tab':
          return '⇥';
        case ' ':
          return 'Space';
        default:
          return key.length === 1 ? key.toUpperCase() : key;
      }
    })
    .join(isMac ? '' : '+');
};

// Key combination matching utility
export const matchesKeyCombo = (
  event: KeyboardEvent,
  keys: string[]
): boolean => {
  const eventKeys = [];

  if (event.ctrlKey) eventKeys.push('ctrl');
  if (event.metaKey) eventKeys.push('cmd');
  if (event.shiftKey) eventKeys.push('shift');
  if (event.altKey) eventKeys.push('alt');

  const key = event.key.toLowerCase();
  if (!['control', 'meta', 'shift', 'alt'].includes(key)) {
    eventKeys.push(key);
  }

  return (
    keys.length === eventKeys.length &&
    keys.every(k => eventKeys.includes(k.toLowerCase()))
  );
};
