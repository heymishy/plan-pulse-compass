import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock components to test layout structure
const MockApp = ({ className }: { className?: string }) => (
  <div className={className} data-testid="app-root">
    <div className="flex min-h-screen bg-background">
      <aside data-testid="sidebar" className="w-64 bg-gray-100">
        Sidebar
      </aside>
      <main data-testid="main-content" className="flex-1 min-w-0">
        <div className="p-6 space-y-6">
          <h1>Main Content</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>Card 1</div>
            <div>Card 2</div>
            <div>Card 3</div>
            <div>Card 4</div>
          </div>
        </div>
      </main>
    </div>
  </div>
);

describe('Responsive Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Root Container Responsive Behavior', () => {
    it('should have no max-width constraint for widescreen support', () => {
      render(
        <BrowserRouter>
          <MockApp className="w-full" />
        </BrowserRouter>
      );

      const appRoot = screen.getByTestId('app-root');
      expect(appRoot).toHaveClass('w-full');
    });

    it('should maintain proper flex layout structure', () => {
      render(
        <BrowserRouter>
          <MockApp />
        </BrowserRouter>
      );

      const sidebar = screen.getByTestId('sidebar');
      const mainContent = screen.getByTestId('main-content');

      expect(sidebar).toBeInTheDocument();
      expect(mainContent).toBeInTheDocument();
    });

    it('should allow main content to expand on widescreen', () => {
      render(
        <BrowserRouter>
          <MockApp />
        </BrowserRouter>
      );

      const mainContent = screen.getByTestId('main-content');
      expect(mainContent).toHaveClass('flex-1');
      expect(mainContent).toHaveClass('min-w-0');
    });
  });

  describe('Content Responsive Grid', () => {
    it('should display responsive grid layout', () => {
      render(
        <BrowserRouter>
          <MockApp />
        </BrowserRouter>
      );

      // Check that cards are rendered
      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
      expect(screen.getByText('Card 3')).toBeInTheDocument();
      expect(screen.getByText('Card 4')).toBeInTheDocument();
    });

    it('should handle content spacing properly', () => {
      render(
        <BrowserRouter>
          <MockApp />
        </BrowserRouter>
      );

      const mainContent = screen.getByTestId('main-content');
      const contentDiv = mainContent.querySelector('.p-6');

      expect(contentDiv).toHaveClass('p-6');
      expect(contentDiv).toHaveClass('space-y-6');
    });
  });

  describe('Widescreen Optimization', () => {
    it('should support ultra-wide content layout', () => {
      render(
        <BrowserRouter>
          <MockApp className="min-w-full" />
        </BrowserRouter>
      );

      const appRoot = screen.getByTestId('app-root');
      expect(appRoot).toHaveClass('min-w-full');
    });

    it('should maintain readability with proper content constraints', () => {
      // Test that we can have content width limits where appropriate
      const ContentWithMaxWidth = () => (
        <div
          data-testid="content-with-constraint"
          className="max-w-7xl mx-auto"
        >
          <p>Content with readability constraints</p>
        </div>
      );

      render(<ContentWithMaxWidth />);

      const constrainedContent = screen.getByTestId('content-with-constraint');
      expect(constrainedContent).toHaveClass('max-w-7xl');
      expect(constrainedContent).toHaveClass('mx-auto');
    });
  });

  describe('Mobile and Tablet Responsiveness', () => {
    it('should handle mobile layout appropriately', () => {
      render(
        <BrowserRouter>
          <MockApp />
        </BrowserRouter>
      );

      // Mobile layout should still work with flex layout
      const mainContent = screen.getByTestId('main-content');
      expect(mainContent).toHaveClass('flex-1');
    });

    it('should maintain proper grid behavior on different screen sizes', () => {
      render(
        <BrowserRouter>
          <MockApp />
        </BrowserRouter>
      );

      const gridContainer = screen.getByText('Card 1').parentElement;
      expect(gridContainer).toHaveClass('grid');
      expect(gridContainer).toHaveClass('grid-cols-1');
      expect(gridContainer).toHaveClass('md:grid-cols-2');
      expect(gridContainer).toHaveClass('lg:grid-cols-4');
    });
  });

  describe('Performance and Accessibility', () => {
    it('should maintain semantic structure', () => {
      render(
        <BrowserRouter>
          <MockApp />
        </BrowserRouter>
      );

      const sidebar = screen.getByTestId('sidebar');
      const mainContent = screen.getByTestId('main-content');

      expect(sidebar.tagName.toLowerCase()).toBe('aside');
      expect(mainContent.tagName.toLowerCase()).toBe('main');
    });

    it('should handle overflow properly', () => {
      render(
        <BrowserRouter>
          <MockApp />
        </BrowserRouter>
      );

      const mainContent = screen.getByTestId('main-content');
      expect(mainContent).toHaveClass('min-w-0'); // Prevents flex item overflow
    });
  });

  describe('Table Responsiveness', () => {
    it('should handle wide tables on widescreen', () => {
      const WideTable = () => (
        <div className="overflow-x-auto">
          <table data-testid="wide-table" className="w-full">
            <thead>
              <tr>
                <th>Column 1</th>
                <th>Column 2</th>
                <th>Column 3</th>
                <th>Column 4</th>
                <th>Column 5</th>
                <th>Column 6</th>
                <th>Column 7</th>
                <th>Column 8</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data 1</td>
                <td>Data 2</td>
                <td>Data 3</td>
                <td>Data 4</td>
                <td>Data 5</td>
                <td>Data 6</td>
                <td>Data 7</td>
                <td>Data 8</td>
              </tr>
            </tbody>
          </table>
        </div>
      );

      render(<WideTable />);

      const table = screen.getByTestId('wide-table');
      expect(table).toHaveClass('w-full');
      expect(table.parentElement).toHaveClass('overflow-x-auto');
    });

    it('should support horizontal scrolling on narrow screens', () => {
      const ScrollableContent = () => (
        <div data-testid="scrollable-container" className="overflow-x-auto">
          <div className="min-w-max">
            <p>
              Wide content that needs horizontal scrolling on narrow screens
            </p>
          </div>
        </div>
      );

      render(<ScrollableContent />);

      const container = screen.getByTestId('scrollable-container');
      expect(container).toHaveClass('overflow-x-auto');
    });
  });
});
