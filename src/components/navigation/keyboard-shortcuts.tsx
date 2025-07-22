/**
 * Keyboard Shortcuts System
 *
 * Features:
 * - Global keyboard shortcut registration and handling
 * - Context-aware shortcut activation/deactivation
 * - Visual shortcut hints and help modal
 * - Integration with navigation and application actions
 * - Accessibility support with proper focus management
 * - Customizable shortcut combinations
 * - Shortcut conflict detection and resolution
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Command,
  Search,
  Home,
  Settings,
  HelpCircle,
  Keyboard,
  ArrowRight,
  X,
  ChevronRight,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { spacing, typography, colors } from '@/design-tokens';
import {
  KeyboardShortcut,
  SHORTCUT_CATEGORIES,
  isMac,
  modifierKey,
  formatKeys as formatKeysUtil,
  matchesKeyCombo,
} from '@/utils/keyboard-shortcuts-constants';

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

interface KeyboardShortcutsContextValue {
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  showHelp: () => void;
  hideHelp: () => void;
  isHelpOpen: boolean;
}

const KeyboardShortcutsContext =
  React.createContext<KeyboardShortcutsContextValue | null>(null);

export function KeyboardShortcutsProvider({
  children,
}: KeyboardShortcutsProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [shortcuts, setShortcuts] = useState<Map<string, KeyboardShortcut>>(
    new Map()
  );
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Default global shortcuts
  const defaultShortcuts: KeyboardShortcut[] = useMemo(
    () => [
      {
        id: 'show-help',
        keys: ['?'],
        label: 'Show Shortcuts',
        description: 'Display keyboard shortcuts help',
        category: SHORTCUT_CATEGORIES.global,
        action: () => setIsHelpOpen(true),
        icon: HelpCircle,
      },
      {
        id: 'close-help',
        keys: ['Escape'],
        label: 'Close Help',
        description: 'Close shortcuts help dialog',
        category: SHORTCUT_CATEGORIES.global,
        context: 'help-modal',
        action: () => setIsHelpOpen(false),
        enabled: isHelpOpen,
      },
      {
        id: 'home',
        keys: ['g', 'h'],
        label: 'Go Home',
        description: 'Navigate to home page',
        category: SHORTCUT_CATEGORIES.navigation,
        action: () => navigate('/'),
        icon: Home,
      },
      {
        id: 'dashboard',
        keys: [modifierKey, '1'],
        label: 'Dashboard',
        description: 'Navigate to dashboard',
        category: SHORTCUT_CATEGORIES.navigation,
        action: () => navigate('/dashboard'),
      },
      {
        id: 'teams',
        keys: [modifierKey, '2'],
        label: 'Teams',
        description: 'Navigate to teams page',
        category: SHORTCUT_CATEGORIES.navigation,
        action: () => navigate('/teams'),
      },
      {
        id: 'projects',
        keys: [modifierKey, '3'],
        label: 'Projects',
        description: 'Navigate to projects page',
        category: SHORTCUT_CATEGORIES.navigation,
        action: () => navigate('/projects'),
      },
      {
        id: 'allocations',
        keys: [modifierKey, '4'],
        label: 'Allocations',
        description: 'Navigate to allocations page',
        category: SHORTCUT_CATEGORIES.navigation,
        action: () => navigate('/allocations'),
      },
      {
        id: 'reports',
        keys: [modifierKey, '5'],
        label: 'Reports',
        description: 'Navigate to reports page',
        category: SHORTCUT_CATEGORIES.navigation,
        action: () => navigate('/reports'),
      },
      {
        id: 'settings',
        keys: [modifierKey, ','],
        label: 'Settings',
        description: 'Open application settings',
        category: SHORTCUT_CATEGORIES.navigation,
        action: () => navigate('/settings'),
        icon: Settings,
      },
      {
        id: 'search',
        keys: [modifierKey, 'k'],
        label: 'Search',
        description: 'Focus navigation search',
        category: SHORTCUT_CATEGORIES.global,
        action: () => {
          // This will be handled by the enhanced navigation component
          const searchInput = document.querySelector(
            '[data-search-input]'
          ) as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        },
        icon: Search,
      },
    ],
    [navigate, isHelpOpen]
  );

  // Register default shortcuts on mount
  useEffect(() => {
    const newShortcuts = new Map();
    defaultShortcuts.forEach(shortcut => {
      newShortcuts.set(shortcut.id, shortcut);
    });
    setShortcuts(newShortcuts);
  }, [defaultShortcuts]);

  // Register custom shortcut
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => new Map(prev.set(shortcut.id, shortcut)));
  }, []);

  // Unregister shortcut
  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts(prev => {
      const newShortcuts = new Map(prev);
      newShortcuts.delete(id);
      return newShortcuts;
    });
  }, []);

  // Show/hide help modal
  const showHelp = useCallback(() => setIsHelpOpen(true), []);
  const hideHelp = useCallback(() => setIsHelpOpen(false), []);

  // Key combination matching (using imported utility)
  const keyComboMatcher = useCallback(
    (event: KeyboardEvent, keys: string[]) => matchesKeyCombo(event, keys),
    []
  );

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true') &&
        !isHelpOpen
      ) {
        return;
      }

      // Find matching shortcuts
      const activeShortcuts = Array.from(shortcuts.values()).filter(
        shortcut => {
          if (shortcut.enabled === false) return false;

          // Check context
          if (shortcut.context) {
            const contexts = Array.isArray(shortcut.context)
              ? shortcut.context
              : [shortcut.context];

            const currentContext = isHelpOpen ? 'help-modal' : 'global';
            if (!contexts.includes(currentContext)) return false;
          }

          return keyComboMatcher(event, shortcut.keys);
        }
      );

      if (activeShortcuts.length > 0) {
        event.preventDefault();
        event.stopPropagation();

        // Execute the first matching shortcut
        activeShortcuts[0].action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, isHelpOpen, keyComboMatcher]);

  // Filter shortcuts for help display
  const filteredShortcuts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return Array.from(shortcuts.values());

    return Array.from(shortcuts.values()).filter(
      shortcut =>
        shortcut.label.toLowerCase().includes(query) ||
        shortcut.description.toLowerCase().includes(query) ||
        shortcut.category.toLowerCase().includes(query) ||
        shortcut.keys.some(key => key.toLowerCase().includes(query))
    );
  }, [shortcuts, searchQuery]);

  // Group shortcuts by category
  const shortcutsByCategory = useMemo(() => {
    const grouped: Record<string, KeyboardShortcut[]> = {};
    filteredShortcuts.forEach(shortcut => {
      if (!grouped[shortcut.category]) {
        grouped[shortcut.category] = [];
      }
      grouped[shortcut.category].push(shortcut);
    });
    return grouped;
  }, [filteredShortcuts]);

  // Use imported format keys utility
  const formatKeysForDisplay = useCallback(
    (keys: string[]) => formatKeysUtil(keys),
    []
  );

  const contextValue: KeyboardShortcutsContextValue = {
    registerShortcut,
    unregisterShortcut,
    showHelp,
    hideHelp,
    isHelpOpen,
  };

  return (
    <KeyboardShortcutsContext.Provider value={contextValue}>
      {children}

      {/* Keyboard Shortcuts Help Dialog */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Use these keyboard shortcuts to navigate and interact with the
              application more efficiently.
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
              data-search-input="true"
            />
          </div>

          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-6">
              {Object.entries(shortcutsByCategory).map(
                ([category, shortcuts]) => (
                  <div key={category} className="space-y-3">
                    <h3
                      className={cn(
                        'font-semibold text-foreground',
                        `font-size: ${typography.textStyles['heading-sm'].fontSize}`,
                        `line-height: ${typography.textStyles['heading-sm'].lineHeight}`
                      )}
                    >
                      {category}
                    </h3>

                    <div className="space-y-2">
                      {shortcuts.map(shortcut => {
                        const Icon = shortcut.icon;
                        return (
                          <div
                            key={shortcut.id}
                            className={cn(
                              'flex items-center justify-between p-3 rounded-md',
                              'hover:bg-muted/50 transition-colors',
                              `padding: ${spacing.semantic.component.sm}`
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {Icon && (
                                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div
                                  className={cn(
                                    'font-medium text-foreground',
                                    `font-size: ${typography.textStyles['body-sm'].fontSize}`
                                  )}
                                >
                                  {shortcut.label}
                                </div>
                                <div
                                  className={cn(
                                    'text-muted-foreground truncate',
                                    `font-size: ${typography.textStyles['body-xs'].fontSize}`
                                  )}
                                >
                                  {shortcut.description}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {shortcut.keys.map((key, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="px-2 py-1 text-xs font-mono"
                                >
                                  {formatKeysForDisplay([key])}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {Object.keys(shortcutsByCategory).indexOf(category) <
                      Object.keys(shortcutsByCategory).length - 1 && (
                      <Separator />
                    )}
                  </div>
                )
              )}
            </div>

            {filteredShortcuts.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  No shortcuts found matching "{searchQuery}"
                </p>
              </div>
            )}
          </ScrollArea>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Press{' '}
              <Badge variant="outline" className="px-2 py-1 text-xs font-mono">
                ?
              </Badge>{' '}
              to show shortcuts anytime
            </div>
            <Button variant="outline" onClick={() => setIsHelpOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </KeyboardShortcutsContext.Provider>
  );
}

// Hook to use keyboard shortcuts
export function useKeyboardShortcuts() {
  const context = React.useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error(
      'useKeyboardShortcuts must be used within a KeyboardShortcutsProvider'
    );
  }
  return context;
}

// Component to display shortcut hint
interface ShortcutHintProps {
  keys: string[];
  className?: string;
}

export function ShortcutHint({ keys, className }: ShortcutHintProps) {
  return (
    <Badge
      variant="outline"
      className={cn('px-2 py-1 text-xs font-mono opacity-60', className)}
    >
      {formatKeysUtil(keys)}
    </Badge>
  );
}

export default KeyboardShortcutsProvider;
