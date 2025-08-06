import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  useAccessibilityPreferences,
  useFocusManagement,
  useKeyboardNavigation,
  useAnnouncements,
  useSkipLinks,
  useHighContrast,
  useAriaDescribedBy
} from '../useAccessibility';

// Mock matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Mock DOM methods
const mockFocus = vi.fn();
const mockScrollIntoView = vi.fn();

describe('useAccessibilityPreferences', () => {
  beforeEach(() => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('should initialize with default preferences', () => {
    const { result } = renderHook(() => useAccessibilityPreferences());

    expect(result.current).toEqual({
      reducedMotion: false,
      highContrast: false,
      screenReader: false,
      keyboardNavigation: false
    });
  });

  it('should detect reduced motion preference', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useAccessibilityPreferences());

    expect(result.current.reducedMotion).toBe(true);
  });

  it('should update preferences when media query changes', () => {
    let changeHandler: (e: MediaQueryListEvent) => void;
    
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn().mockImplementation((_, handler) => {
        changeHandler = handler;
      }),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useAccessibilityPreferences());

    expect(result.current.reducedMotion).toBe(false);

    // Simulate media query change
    act(() => {
      changeHandler({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current.reducedMotion).toBe(true);
  });
});

describe('useFocusManagement', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = document.createElement('button');
    mockElement.focus = mockFocus;
    
    // Mock document.activeElement
    Object.defineProperty(document, 'activeElement', {
      writable: true,
      value: mockElement,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should save and restore focus', () => {
    const { result } = renderHook(() => useFocusManagement());

    act(() => {
      result.current.saveFocus();
    });

    act(() => {
      result.current.restoreFocus();
    });

    expect(mockFocus).toHaveBeenCalled();
  });

  it('should set up focus trap', () => {
    const container = document.createElement('div');
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    
    container.appendChild(button1);
    container.appendChild(button2);

    const mockAddEventListener = vi.spyOn(container, 'addEventListener');
    
    const { result } = renderHook(() => useFocusManagement());

    let cleanup: (() => void) | undefined;
    act(() => {
      cleanup = result.current.trapFocus(container);
    });

    expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    
    if (cleanup) {
      cleanup();
    }
  });
});

describe('useKeyboardNavigation', () => {
  const mockItems = ['item1', 'item2', 'item3'];
  const mockOnSelect = vi.fn();
  const mockOnEscape = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => 
      useKeyboardNavigation(mockItems, mockOnSelect, mockOnEscape)
    );

    expect(result.current.focusedIndex).toBe(-1);
  });

  it('should handle arrow down navigation', () => {
    const { result } = renderHook(() => 
      useKeyboardNavigation(mockItems, mockOnSelect, mockOnEscape)
    );

    act(() => {
      result.current.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });

    expect(result.current.focusedIndex).toBe(0);

    act(() => {
      result.current.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });

    expect(result.current.focusedIndex).toBe(1);
  });

  it('should handle arrow up navigation', () => {
    const { result } = renderHook(() => 
      useKeyboardNavigation(mockItems, mockOnSelect, mockOnEscape)
    );

    act(() => {
      result.current.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    });

    expect(result.current.focusedIndex).toBe(2); // Should wrap to last item
  });

  it('should handle Home and End keys', () => {
    const { result } = renderHook(() => 
      useKeyboardNavigation(mockItems, mockOnSelect, mockOnEscape)
    );

    act(() => {
      result.current.handleKeyDown(new KeyboardEvent('keydown', { key: 'Home' }));
    });

    expect(result.current.focusedIndex).toBe(0);

    act(() => {
      result.current.handleKeyDown(new KeyboardEvent('keydown', { key: 'End' }));
    });

    expect(result.current.focusedIndex).toBe(2);
  });

  it('should handle Enter key selection', () => {
    const { result } = renderHook(() => 
      useKeyboardNavigation(mockItems, mockOnSelect, mockOnEscape)
    );

    act(() => {
      result.current.setFocusedIndex(1);
    });

    act(() => {
      result.current.handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(mockOnSelect).toHaveBeenCalledWith('item2', 1);
  });

  it('should handle Escape key', () => {
    const { result } = renderHook(() => 
      useKeyboardNavigation(mockItems, mockOnSelect, mockOnEscape)
    );

    act(() => {
      result.current.handleKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(mockOnEscape).toHaveBeenCalled();
    expect(result.current.focusedIndex).toBe(-1);
  });

  it('should reset focus', () => {
    const { result } = renderHook(() => 
      useKeyboardNavigation(mockItems, mockOnSelect, mockOnEscape)
    );

    act(() => {
      result.current.setFocusedIndex(2);
    });

    expect(result.current.focusedIndex).toBe(2);

    act(() => {
      result.current.resetFocus();
    });

    expect(result.current.focusedIndex).toBe(-1);
  });
});

describe('useAnnouncements', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllTimers();
  });

  it('should create announcement element and announce message', () => {
    vi.useFakeTimers();
    
    const { result } = renderHook(() => useAnnouncements());

    act(() => {
      result.current.announce('Test message');
    });

    const announcementElement = document.querySelector('[aria-live="polite"]');
    expect(announcementElement).toBeInTheDocument();
    expect(announcementElement?.textContent).toBe('Test message');

    // Should clear after timeout
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(announcementElement?.textContent).toBe('');
    
    vi.useRealTimers();
  });

  it('should use assertive priority when specified', () => {
    const { result } = renderHook(() => useAnnouncements());

    act(() => {
      result.current.announce('Urgent message', 'assertive');
    });

    const announcementElement = document.querySelector('[aria-live="assertive"]');
    expect(announcementElement).toBeInTheDocument();
  });
});

describe('useSkipLinks', () => {
  it('should register and unregister skip links', () => {
    const { result } = renderHook(() => useSkipLinks());

    expect(result.current.skipLinks).toEqual([]);

    act(() => {
      result.current.registerSkipLink('main-content', 'Main Content');
    });

    expect(result.current.skipLinks).toEqual([
      { id: 'main-content', label: 'Main Content' }
    ]);

    act(() => {
      result.current.registerSkipLink('navigation', 'Navigation');
    });

    expect(result.current.skipLinks).toHaveLength(2);

    act(() => {
      result.current.unregisterSkipLink('main-content');
    });

    expect(result.current.skipLinks).toEqual([
      { id: 'navigation', label: 'Navigation' }
    ]);
  });

  it('should not register duplicate skip links', () => {
    const { result } = renderHook(() => useSkipLinks());

    act(() => {
      result.current.registerSkipLink('main-content', 'Main Content');
      result.current.registerSkipLink('main-content', 'Main Content');
    });

    expect(result.current.skipLinks).toHaveLength(1);
  });

  it('should skip to content element', () => {
    const mockElement = document.createElement('div');
    mockElement.id = 'main-content';
    mockElement.focus = mockFocus;
    mockElement.scrollIntoView = mockScrollIntoView;
    document.body.appendChild(mockElement);

    const { result } = renderHook(() => useSkipLinks());

    act(() => {
      result.current.skipToContent('main-content');
    });

    expect(mockFocus).toHaveBeenCalled();
    expect(mockScrollIntoView).toHaveBeenCalledWith({ 
      behavior: 'smooth', 
      block: 'start' 
    });

    document.body.removeChild(mockElement);
  });
});

describe('useHighContrast', () => {
  beforeEach(() => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('should initialize with media query preference', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useHighContrast());

    expect(result.current.isHighContrast).toBe(true);
  });

  it('should toggle high contrast mode', () => {
    const { result } = renderHook(() => useHighContrast());

    expect(result.current.isHighContrast).toBe(false);

    act(() => {
      result.current.toggleHighContrast();
    });

    expect(result.current.isHighContrast).toBe(true);
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);

    act(() => {
      result.current.toggleHighContrast();
    });

    expect(result.current.isHighContrast).toBe(false);
    expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
  });
});

describe('useAriaDescribedBy', () => {
  it('should manage ARIA descriptions', () => {
    const { result } = renderHook(() => useAriaDescribedBy());

    expect(result.current.descriptions).toEqual({});

    act(() => {
      result.current.addDescription('field1', 'Description for field 1');
      result.current.addDescription('field2', 'Description for field 2');
    });

    expect(result.current.descriptions).toEqual({
      field1: 'Description for field 1',
      field2: 'Description for field 2'
    });

    expect(result.current.getDescribedBy(['field1', 'field2'])).toBe('field1 field2');
    expect(result.current.getDescribedBy(['field1', 'nonexistent'])).toBe('field1');

    act(() => {
      result.current.removeDescription('field1');
    });

    expect(result.current.descriptions).toEqual({
      field2: 'Description for field 2'
    });
  });
});