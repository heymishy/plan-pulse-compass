/**
 * Accessibility Components - Main Export
 * Centralized export for all accessibility utilities and components
 */

export { FocusTrap, useFocusTrap, type FocusTrapProps } from './focus-trap';

export {
  KeyboardShortcuts,
  useKeyboardShortcuts,
  useArrowNavigation,
  SkipLink,
  type KeyboardShortcut,
  type KeyboardShortcutsProps,
  type SkipLinkProps,
} from './keyboard-shortcuts';

export {
  ScreenReaderOnly,
  LiveRegion,
  useScreenReaderAnnouncement,
  AccessibleFormField,
  AccessibleHeading,
  AccessibleProgress,
  type ScreenReaderOnlyProps,
  type LiveRegionProps,
  type AccessibleFormFieldProps,
  type AccessibleHeadingProps,
  type AccessibleProgressProps,
} from './screen-reader';
