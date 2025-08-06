// Accessibility provider and context
export { AccessibilityProvider, useAccessibility } from './AccessibilityProvider';

// Focus management components
export { FocusTrap, useFocusTrap } from './FocusTrap';

// Skip links for navigation
export { SkipLinks, useSkipLink } from './SkipLinks';

// Screen reader utilities
export { VisuallyHidden, useScreenReaderOnly } from './VisuallyHidden';
export { LiveRegion, Status, Alert, useTemporaryAnnouncement } from './LiveRegion';

// Keyboard navigation
export { KeyboardNavigable, useSimpleKeyboardNav } from './KeyboardNavigable';
export type { KeyboardNavigableRef } from './KeyboardNavigable';

// Accessibility hooks
export {
  useAccessibilityPreferences,
  useFocusManagement,
  useKeyboardNavigation,
  useAnnouncements,
  useSkipLinks,
  useHighContrast,
  useAriaDescribedBy
} from '@/hooks/useAccessibility';