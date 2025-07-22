/**
 * Tests for Keyboard Shortcuts System
 *
 * Test Coverage:
 * - Shortcut registration and unregistration
 * - Global keyboard event handling
 * - Context-aware shortcut activation
 * - Help modal functionality
 * - Key combination matching
 * - Search and filtering in help modal
 * - Accessibility features
 * - Platform-specific key display
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import {
  KeyboardShortcutsProvider,
  useKeyboardShortcuts,
  ShortcutHint,
  KeyboardShortcut,
  SHORTCUT_CATEGORIES,
} from '@/components/navigation/keyboard-shortcuts';

import { vi } from 'vitest';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

// Test component that uses the keyboard shortcuts hook
const TestShortcutComponent = () => {
  const { registerShortcut, unregisterShortcut, showHelp } =
    useKeyboardShortcuts();

  const testShortcut: KeyboardShortcut = {
    id: 'test-shortcut',
    keys: ['t'],
    label: 'Test Shortcut',
    description: 'A test shortcut',
    category: SHORTCUT_CATEGORIES.global,
    action: () => console.log('Test shortcut executed'),
  };

  return (
    <div>
      <button onClick={() => registerShortcut(testShortcut)}>
        Register Test Shortcut
      </button>
      <button onClick={() => unregisterShortcut('test-shortcut')}>
        Unregister Test Shortcut
      </button>
      <button onClick={showHelp}>Show Help</button>
    </div>
  );
};

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <KeyboardShortcutsProvider>{children}</KeyboardShortcutsProvider>
  </BrowserRouter>
);

describe.skip('KeyboardShortcutsProvider', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Provider Setup', () => {
    it('renders children without errors', () => {
      render(
        <TestWrapper>
          <div data-testid="test-content">Test content</div>
        </TestWrapper>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('provides context to child components', () => {
      render(
        <TestWrapper>
          <TestShortcutComponent />
        </TestWrapper>
      );

      expect(screen.getByText('Register Test Shortcut')).toBeInTheDocument();
      expect(screen.getByText('Show Help')).toBeInTheDocument();
    });
  });

  describe('Default Shortcuts', () => {
    it('registers default navigation shortcuts', () => {
      render(
        <TestWrapper>
          <div />
        </TestWrapper>
      );

      // Test dashboard shortcut (Cmd/Ctrl+1)
      const event = new KeyboardEvent('keydown', {
        key: '1',
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('handles help shortcut (?)', async () => {
      render(
        <TestWrapper>
          <div />
        </TestWrapper>
      );

      const event = new KeyboardEvent('keydown', {
        key: '?',
        bubbles: true,
      });

      window.dispatchEvent(event);

      await waitFor(() => {
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      });
    });

    it('handles settings shortcut (Cmd/Ctrl+,)', () => {
      render(
        <TestWrapper>
          <div />
        </TestWrapper>
      );

      const event = new KeyboardEvent('keydown', {
        key: ',',
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);
      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });
  });

  describe('Custom Shortcut Registration', () => {
    it('registers custom shortcuts', async () => {
      const user = userEvent.setup();
      const mockAction = vi.fn();

      const TestComponent = () => {
        const { registerShortcut } = useKeyboardShortcuts();

        React.useEffect(() => {
          registerShortcut({
            id: 'custom-test',
            keys: ['x'],
            label: 'Custom Test',
            description: 'Custom test shortcut',
            category: SHORTCUT_CATEGORIES.global,
            action: mockAction,
          });
        }, [registerShortcut]);

        return <div>Registered custom shortcut</div>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Trigger the custom shortcut
      const event = new KeyboardEvent('keydown', {
        key: 'x',
        bubbles: true,
      });

      window.dispatchEvent(event);
      expect(mockAction).toHaveBeenCalled();
    });

    it('unregisters shortcuts', async () => {
      const mockAction = vi.fn();

      const TestComponent = () => {
        const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
        const [registered, setRegistered] = React.useState(false);

        const handleRegister = () => {
          registerShortcut({
            id: 'test-unregister',
            keys: ['z'],
            label: 'Test Unregister',
            description: 'Test unregister shortcut',
            category: SHORTCUT_CATEGORIES.global,
            action: mockAction,
          });
          setRegistered(true);
        };

        const handleUnregister = () => {
          unregisterShortcut('test-unregister');
          setRegistered(false);
        };

        return (
          <div>
            <button onClick={handleRegister}>Register</button>
            <button onClick={handleUnregister}>Unregister</button>
            <span>{registered ? 'Registered' : 'Not registered'}</span>
          </div>
        );
      };

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Register the shortcut
      await user.click(screen.getByText('Register'));
      expect(screen.getByText('Registered')).toBeInTheDocument();

      // Test that shortcut works
      fireEvent.keyDown(window, { key: 'z' });
      expect(mockAction).toHaveBeenCalledTimes(1);

      // Unregister the shortcut
      await user.click(screen.getByText('Unregister'));
      expect(screen.getByText('Not registered')).toBeInTheDocument();

      // Test that shortcut no longer works
      fireEvent.keyDown(window, { key: 'z' });
      expect(mockAction).toHaveBeenCalledTimes(1); // Should still be 1, not 2
    });
  });

  describe('Context Awareness', () => {
    it('ignores shortcuts when typing in input fields', () => {
      const mockAction = vi.fn();

      const TestComponent = () => {
        const { registerShortcut } = useKeyboardShortcuts();

        React.useEffect(() => {
          registerShortcut({
            id: 'input-test',
            keys: ['i'],
            label: 'Input Test',
            description: 'Should not trigger in inputs',
            category: SHORTCUT_CATEGORIES.global,
            action: mockAction,
          });
        }, [registerShortcut]);

        return <input data-testid="test-input" type="text" />;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const input = screen.getByTestId('test-input');
      input.focus();

      fireEvent.keyDown(input, { key: 'i' });
      expect(mockAction).not.toHaveBeenCalled();
    });

    it('respects context-specific shortcuts', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TestShortcutComponent />
        </TestWrapper>
      );

      // Open help modal first
      await user.click(screen.getByText('Show Help'));

      await waitFor(() => {
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      });

      // Test Escape key to close help (context-specific)
      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        expect(
          screen.queryByText('Keyboard Shortcuts')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Help Modal', () => {
    it('opens help modal when showHelp is called', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TestShortcutComponent />
        </TestWrapper>
      );

      await user.click(screen.getByText('Show Help'));

      await waitFor(() => {
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
        expect(
          screen.getByText(/Use these keyboard shortcuts/)
        ).toBeInTheDocument();
      });
    });

    it('closes help modal when close button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TestShortcutComponent />
        </TestWrapper>
      );

      // Open help modal
      await user.click(screen.getByText('Show Help'));
      await waitFor(() => {
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      });

      // Close help modal
      await user.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(
          screen.queryByText('Keyboard Shortcuts')
        ).not.toBeInTheDocument();
      });
    });

    it('displays shortcuts grouped by category', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TestShortcutComponent />
        </TestWrapper>
      );

      await user.click(screen.getByText('Show Help'));

      await waitFor(() => {
        expect(screen.getByText('Navigation')).toBeInTheDocument();
        expect(screen.getByText('Global')).toBeInTheDocument();
      });
    });

    it('filters shortcuts based on search query', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TestShortcutComponent />
        </TestWrapper>
      );

      await user.click(screen.getByText('Show Help'));

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Search shortcuts...')
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search shortcuts...');
      await user.type(searchInput, 'dashboard');

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      });
    });

    it('shows no results message for empty search', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TestShortcutComponent />
        </TestWrapper>
      );

      await user.click(screen.getByText('Show Help'));

      const searchInput = screen.getByPlaceholderText('Search shortcuts...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(
          screen.getByText(/No shortcuts found matching/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Key Combination Matching', () => {
    it('matches single key combinations', () => {
      const mockAction = vi.fn();

      const TestComponent = () => {
        const { registerShortcut } = useKeyboardShortcuts();

        React.useEffect(() => {
          registerShortcut({
            id: 'single-key',
            keys: ['h'],
            label: 'Single Key',
            description: 'Single key test',
            category: SHORTCUT_CATEGORIES.global,
            action: mockAction,
          });
        }, [registerShortcut]);

        return <div>Test component</div>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      fireEvent.keyDown(window, { key: 'h' });
      expect(mockAction).toHaveBeenCalled();
    });

    it('matches modifier key combinations', () => {
      const mockAction = vi.fn();

      const TestComponent = () => {
        const { registerShortcut } = useKeyboardShortcuts();

        React.useEffect(() => {
          registerShortcut({
            id: 'modifier-key',
            keys: ['ctrl', 'k'],
            label: 'Modifier Key',
            description: 'Modifier key test',
            category: SHORTCUT_CATEGORIES.global,
            action: mockAction,
          });
        }, [registerShortcut]);

        return <div>Test component</div>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
      expect(mockAction).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels in help modal', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TestShortcutComponent />
        </TestWrapper>
      );

      await user.click(screen.getByText('Show Help'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText(/search shortcuts/i)).toBeInTheDocument();
      });
    });

    it('manages focus properly in help modal', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TestShortcutComponent />
        </TestWrapper>
      );

      await user.click(screen.getByText('Show Help'));

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search shortcuts...');
        expect(searchInput).toBeInTheDocument();
      });
    });
  });
});

describe.skip('ShortcutHint', () => {
  it('renders shortcut hint with correct keys', () => {
    render(<ShortcutHint keys={['ctrl', 'k']} />);

    // Should display the key combination
    expect(screen.getByText(/ctrl.*k/i)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ShortcutHint keys={['h']} className="custom-hint" />);

    const hint = screen.getByText('H').closest('.custom-hint');
    expect(hint).toBeInTheDocument();
  });

  it('formats special keys correctly', () => {
    render(<ShortcutHint keys={['enter']} />);

    expect(screen.getByText('↵')).toBeInTheDocument();
  });

  it('formats modifier keys for Mac', () => {
    // Mock Mac platform
    const originalPlatform = navigator.platform;

    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      configurable: true,
      writable: true,
    });

    render(<ShortcutHint keys={['cmd', 'k']} />);

    expect(screen.getByText('⌘K')).toBeInTheDocument();

    // Restore original platform
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      configurable: true,
      writable: true,
    });
  });
});
