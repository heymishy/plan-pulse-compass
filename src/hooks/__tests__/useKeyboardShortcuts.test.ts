import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { vi } from 'vitest';
import {
  useKeyboardShortcuts,
  KeyboardShortcut,
} from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let mockActions: { [key: string]: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockActions = {
      action1: vi.fn(),
      action2: vi.fn(),
      action3: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createShortcuts = (): KeyboardShortcut[] => [
    {
      key: 'n',
      action: mockActions.action1,
      description: 'New item',
      category: 'Actions',
    },
    {
      key: 'c',
      ctrlKey: true,
      action: mockActions.action2,
      description: 'Copy',
      category: 'Actions',
    },
    {
      key: 'Escape',
      action: mockActions.action3,
      description: 'Close',
      category: 'Navigation',
    },
  ];

  it('should trigger action when matching shortcut is pressed', () => {
    const shortcuts = createShortcuts();
    renderHook(() => useKeyboardShortcuts(shortcuts, true));

    fireEvent.keyDown(document, { key: 'n' });
    expect(mockActions.action1).toHaveBeenCalledTimes(1);
  });

  it('should trigger action for keyboard shortcut with modifier keys', () => {
    const shortcuts = createShortcuts();
    renderHook(() => useKeyboardShortcuts(shortcuts, true));

    fireEvent.keyDown(document, { key: 'c', ctrlKey: true });
    expect(mockActions.action2).toHaveBeenCalledTimes(1);
  });

  it('should not trigger action when modifier key is missing', () => {
    const shortcuts = createShortcuts();
    renderHook(() => useKeyboardShortcuts(shortcuts, true));

    fireEvent.keyDown(document, { key: 'c' }); // Missing ctrlKey
    expect(mockActions.action2).not.toHaveBeenCalled();
  });

  it('should trigger escape key shortcut', () => {
    const shortcuts = createShortcuts();
    renderHook(() => useKeyboardShortcuts(shortcuts, true));

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockActions.action3).toHaveBeenCalledTimes(1);
  });

  it('should not trigger shortcuts when disabled', () => {
    const shortcuts = createShortcuts();
    renderHook(() => useKeyboardShortcuts(shortcuts, false));

    fireEvent.keyDown(document, { key: 'n' });
    expect(mockActions.action1).not.toHaveBeenCalled();
  });

  it('should not trigger shortcuts when typing in input elements', () => {
    const shortcuts = createShortcuts();
    renderHook(() => useKeyboardShortcuts(shortcuts, true));

    // Create an input element and focus it
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(input, { key: 'n' });
    expect(mockActions.action1).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should not trigger shortcuts when typing in textarea elements', () => {
    const shortcuts = createShortcuts();
    renderHook(() => useKeyboardShortcuts(shortcuts, true));

    // Create a textarea element and focus it
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    fireEvent.keyDown(textarea, { key: 'n' });
    expect(mockActions.action1).not.toHaveBeenCalled();

    document.body.removeChild(textarea);
  });

  it('should prevent default behavior when shortcut is triggered', () => {
    const shortcuts = createShortcuts();
    renderHook(() => useKeyboardShortcuts(shortcuts, true));

    const event = new KeyboardEvent('keydown', { key: 'n' });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    document.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(mockActions.action1).toHaveBeenCalledTimes(1);
  });

  it('should handle case-insensitive key matching', () => {
    const shortcuts = createShortcuts();
    renderHook(() => useKeyboardShortcuts(shortcuts, true));

    fireEvent.keyDown(document, { key: 'N' }); // Uppercase
    expect(mockActions.action1).toHaveBeenCalledTimes(1);
  });

  it('should clean up event listeners on unmount', () => {
    const shortcuts = createShortcuts();
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts, true));

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
