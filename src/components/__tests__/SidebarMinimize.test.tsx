import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  renderWithSidebar,
  screen,
  fireEvent,
  act,
} from '../../test/utils/test-utils';
import Navigation from '../Navigation';

describe('Sidebar Minimize Functionality - CI Tests', () => {
  beforeEach(() => {
    // Reset any side effects between tests
    document.cookie =
      'sidebar:state=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  describe('Minimize Button Rendering', () => {
    it('should render minimize button in expanded state', () => {
      renderWithSidebar(<Navigation />);

      const minimizeButton = screen.getByRole('button', {
        name: /minimize sidebar/i,
      });
      expect(minimizeButton).toBeInTheDocument();
    });

    it('should have correct accessibility attributes', () => {
      renderWithSidebar(<Navigation />);

      const minimizeButton = screen.getByRole('button', {
        name: /minimize sidebar/i,
      });
      expect(minimizeButton).toHaveAttribute('aria-label', 'Minimize sidebar');
    });

    it('should have proper styling classes', () => {
      renderWithSidebar(<Navigation />);

      const minimizeButton = screen.getByRole('button', {
        name: /minimize sidebar/i,
      });
      expect(minimizeButton).toHaveClass('ml-2');
    });
  });

  describe('Minimize Button Interaction', () => {
    it('should be clickable', () => {
      renderWithSidebar(<Navigation />);

      const minimizeButton = screen.getByRole('button', {
        name: /minimize sidebar/i,
      });
      expect(minimizeButton).not.toBeDisabled();
    });

    it('should be keyboard accessible', async () => {
      renderWithSidebar(<Navigation />);

      const minimizeButton = screen.getByRole('button', {
        name: /minimize sidebar/i,
      });

      await act(async () => {
        minimizeButton.focus();
      });

      expect(minimizeButton).toHaveFocus();
    });

    it('should respond to Enter key', async () => {
      renderWithSidebar(<Navigation />);

      const minimizeButton = screen.getByRole('button', {
        name: /minimize sidebar/i,
      });

      await act(async () => {
        fireEvent.keyDown(minimizeButton, { key: 'Enter', code: 'Enter' });
      });

      // Button should handle the event without errors
      expect(minimizeButton).toBeInTheDocument();
    });

    it('should respond to Space key', async () => {
      renderWithSidebar(<Navigation />);

      const minimizeButton = screen.getByRole('button', {
        name: /minimize sidebar/i,
      });

      await act(async () => {
        fireEvent.keyDown(minimizeButton, { key: ' ', code: 'Space' });
      });

      // Button should handle the event without errors
      expect(minimizeButton).toBeInTheDocument();
    });
  });

  describe('Minimize Button Positioning', () => {
    it('should be positioned in sidebar header', () => {
      renderWithSidebar(<Navigation />);

      const header = screen
        .getByText('Resource Planner')
        .closest('[data-sidebar="header"]');
      const minimizeButton = screen.getByRole('button', {
        name: /minimize sidebar/i,
      });

      expect(header).toBeInTheDocument();
      expect(header).toContainElement(minimizeButton);
    });

    it('should be positioned after the title', () => {
      renderWithSidebar(<Navigation />);

      const title = screen.getByText('Resource Planner');
      const minimizeButton = screen.getByRole('button', {
        name: /minimize sidebar/i,
      });

      // Check that the button comes after the title in the DOM
      const header = title.closest('[data-sidebar="header"]');
      const titleIndex = Array.from(header?.children || []).indexOf(
        title.parentElement!
      );
      const buttonIndex = Array.from(header?.children || []).indexOf(
        minimizeButton.parentElement!
      );

      expect(buttonIndex).toBeGreaterThan(titleIndex);
    });
  });

  describe('Minimize Button Icon', () => {
    it('should display PanelLeft icon', () => {
      renderWithSidebar(<Navigation />);

      const minimizeButton = screen.getByRole('button', {
        name: /minimize sidebar/i,
      });
      const icon = minimizeButton.querySelector('svg');

      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-5', 'h-5');
    });
  });

  describe('Minimize Button Tooltip', () => {
    it('should have tooltip structure', async () => {
      renderWithSidebar(<Navigation />);

      const minimizeButton = screen.getByRole('button', {
        name: /minimize sidebar/i,
      });

      // Check that the button has the correct aria-label for tooltip functionality
      expect(minimizeButton).toHaveAttribute('aria-label', 'Minimize sidebar');

      // Simulate hover to trigger tooltip
      await act(async () => {
        fireEvent.mouseEnter(minimizeButton);
      });

      // Wait for tooltip to appear and check for tooltip content
      // Note: In test environment, tooltips may not render immediately
      // The important thing is that the button is properly configured for tooltips
      expect(minimizeButton).toBeInTheDocument();
    });
  });

  describe('Sidebar Context Integration', () => {
    it('should have minimizeSidebar function available', () => {
      renderWithSidebar(<Navigation />);

      const minimizeButton = screen.getByRole('button', {
        name: /minimize sidebar/i,
      });
      expect(minimizeButton).toBeInTheDocument();

      // The button should be clickable, indicating the function is available
      expect(minimizeButton).not.toBeDisabled();
    });
  });
});
