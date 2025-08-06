import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UnifiedSelector, { SelectableItem, UnifiedSelectorProps, Recommendation } from '../unified-selector';

// Mock data
interface TestItem extends SelectableItem {
  category: string;
  description: string;
}

const mockItems: TestItem[] = [
  {
    id: '1',
    name: 'React',
    category: 'framework',
    description: 'A JavaScript library for building user interfaces'
  },
  {
    id: '2',
    name: 'TypeScript',
    category: 'programming-language',
    description: 'A typed superset of JavaScript'
  },
  {
    id: '3',
    name: 'Node.js',
    category: 'platform',
    description: 'JavaScript runtime built on Chrome\'s V8 JavaScript engine'
  },
  {
    id: '4',
    name: 'Vue.js',
    category: 'framework',
    description: 'The Progressive JavaScript Framework'
  }
];

const mockRecommendations: Recommendation<TestItem>[] = [
  {
    item: mockItems[0], // React
    score: 95,
    reasoning: 'Highly compatible with project requirements',
    confidence: 90,
    badges: ['recommended']
  },
  {
    item: mockItems[1], // TypeScript
    score: 85,
    reasoning: 'Good type safety for large projects',
    confidence: 85
  }
];

const defaultProps: UnifiedSelectorProps<TestItem> = {
  items: mockItems,
  selectedItems: [],
  onSelectionChange: vi.fn(),
  multiSelect: true,
  searchable: true,
  categoryGrouping: false
};

describe('UnifiedSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<UnifiedSelector {...defaultProps} />);
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search and select items...')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(
        <UnifiedSelector 
          {...defaultProps} 
          placeholder="Custom placeholder" 
        />
      );
      
      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('renders without search input when searchable is false', () => {
      render(<UnifiedSelector {...defaultProps} searchable={false} />);
      
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Item Selection', () => {
    it('calls onSelectionChange when item is selected', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <UnifiedSelector 
          {...defaultProps} 
          onSelectionChange={mockOnChange}
        />
      );

      // Focus input to open dropdown
      await user.click(screen.getByRole('textbox'));
      
      // Wait for dropdown to appear and click an item
      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('React'));

      expect(mockOnChange).toHaveBeenCalledWith([mockItems[0]]);
    });

    it('supports multi-select mode', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <UnifiedSelector 
          {...defaultProps} 
          onSelectionChange={mockOnChange}
          multiSelect={true}
        />
      );

      await user.click(screen.getByRole('textbox'));
      await waitFor(() => screen.getByText('React'));
      await user.click(screen.getByText('React'));

      expect(mockOnChange).toHaveBeenCalledWith([mockItems[0]]);

      // Select second item
      mockOnChange.mockClear();
      await user.click(screen.getByRole('textbox'));
      await waitFor(() => screen.getByText('TypeScript'));
      await user.click(screen.getByText('TypeScript'));

      expect(mockOnChange).toHaveBeenCalledWith([mockItems[1]]);
    });

    it('supports single-select mode', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <UnifiedSelector 
          {...defaultProps} 
          onSelectionChange={mockOnChange}
          multiSelect={false}
        />
      );

      await user.click(screen.getByRole('textbox'));
      await waitFor(() => screen.getByText('React'));
      await user.click(screen.getByText('React'));

      expect(mockOnChange).toHaveBeenCalledWith([mockItems[0]]);
    });
  });

  describe('Selected Items Display', () => {
    it('displays selected items', () => {
      render(
        <UnifiedSelector 
          {...defaultProps} 
          selectedItems={[mockItems[0], mockItems[1]]}
        />
      );

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    it('allows removing selected items', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <UnifiedSelector 
          {...defaultProps} 
          selectedItems={[mockItems[0]]}
          onSelectionChange={mockOnChange}
        />
      );

      const removeButton = screen.getByLabelText('Remove React');
      await user.click(removeButton);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Search Functionality', () => {
    it('filters items based on search term', async () => {
      const user = userEvent.setup();
      
      render(<UnifiedSelector {...defaultProps} />);

      const searchInput = screen.getByRole('textbox');
      await user.click(searchInput);
      await user.type(searchInput, 'React');

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
        expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
      });
    });

    it('filters items by category', async () => {
      const user = userEvent.setup();
      
      render(<UnifiedSelector {...defaultProps} />);

      const searchInput = screen.getByRole('textbox');
      await user.click(searchInput);
      await user.type(searchInput, 'framework');

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
        expect(screen.getByText('Vue.js')).toBeInTheDocument();
        expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
      });
    });

    it('shows "No items found" when search yields no results', async () => {
      const user = userEvent.setup();
      
      render(<UnifiedSelector {...defaultProps} />);

      const searchInput = screen.getByRole('textbox');
      await user.click(searchInput);
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No items found')).toBeInTheDocument();
      });
    });
  });

  describe('Category Grouping', () => {
    it('groups items by category when enabled', async () => {
      const user = userEvent.setup();
      
      render(
        <UnifiedSelector 
          {...defaultProps} 
          categoryGrouping={true}
        />
      );

      await user.click(screen.getByRole('textbox'));

      await waitFor(() => {
        expect(screen.getByText('framework')).toBeInTheDocument();
        expect(screen.getByText('programming-language')).toBeInTheDocument();
        expect(screen.getByText('platform')).toBeInTheDocument();
      });
    });
  });

  describe('Compatibility Scoring', () => {
    it('displays compatibility scores when enabled', async () => {
      const user = userEvent.setup();
      const mockScorer = vi.fn().mockImplementation((item: TestItem) => ({
        score: item.id === '1' ? 95 : 75,
        reasoning: 'Test reasoning'
      }));
      
      render(
        <UnifiedSelector 
          {...defaultProps} 
          compatibilityScoring={mockScorer}
          showCompatibilityScores={true}
        />
      );

      await user.click(screen.getByRole('textbox'));

      await waitFor(() => {
        expect(screen.getByText('95%')).toBeInTheDocument();
        expect(screen.getByText('75%')).toBeInTheDocument();
      });
    });

    it('sorts items by compatibility score', async () => {
      const user = userEvent.setup();
      const mockScorer = vi.fn().mockImplementation((item: TestItem) => ({
        score: item.id === '2' ? 95 : 50, // TypeScript gets highest score
        reasoning: 'Test reasoning'
      }));
      
      render(
        <UnifiedSelector 
          {...defaultProps} 
          compatibilityScoring={mockScorer}
        />
      );

      await user.click(screen.getByRole('textbox'));

      await waitFor(() => {
        const items = screen.getAllByRole('button');
        const firstItem = items.find(item => item.textContent?.includes('TypeScript'));
        expect(firstItem).toBeInTheDocument();
      });
    });
  });

  describe('Recommendations', () => {
    it('displays recommendations when enabled', async () => {
      const user = userEvent.setup();
      
      render(
        <UnifiedSelector 
          {...defaultProps} 
          recommendations={mockRecommendations}
          showRecommendations={true}
        />
      );

      await user.click(screen.getByRole('textbox'));

      await waitFor(() => {
        expect(screen.getByText('Recommended')).toBeInTheDocument();
        expect(screen.getByText('Highly compatible with project requirements')).toBeInTheDocument();
        expect(screen.getByText('95%')).toBeInTheDocument();
      });
    });

    it('allows selecting from recommendations', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <UnifiedSelector 
          {...defaultProps} 
          recommendations={mockRecommendations}
          showRecommendations={true}
          onSelectionChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole('textbox'));
      await waitFor(() => screen.getByText('Recommended'));
      
      const recommendedItem = screen.getByText('React').closest('button');
      await user.click(recommendedItem!);

      expect(mockOnChange).toHaveBeenCalledWith([mockItems[0]]);
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports arrow key navigation', async () => {
      const user = userEvent.setup();
      
      render(<UnifiedSelector {...defaultProps} />);

      const searchInput = screen.getByRole('textbox');
      await user.click(searchInput);
      
      // Wait for dropdown
      await waitFor(() => screen.getByText('React'));

      // Arrow down should focus first item
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      expect(defaultProps.onSelectionChange).toHaveBeenCalled();
    });

    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup();
      
      render(<UnifiedSelector {...defaultProps} />);

      const searchInput = screen.getByRole('textbox');
      await user.click(searchInput);
      await waitFor(() => screen.getByText('React'));

      fireEvent.keyDown(searchInput, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('React')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <UnifiedSelector 
          {...defaultProps} 
          ariaLabel="Test selector"
          ariaDescription="Test description"
        />
      );

      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByLabelText('Test selector')).toBeInTheDocument();
    });

    it('updates aria-expanded when dropdown opens', async () => {
      const user = userEvent.setup();
      
      render(<UnifiedSelector {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-expanded', 'false');

      await user.click(screen.getByRole('textbox'));
      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('provides screen reader feedback for selected items', () => {
      render(
        <UnifiedSelector 
          {...defaultProps} 
          selectedItems={[mockItems[0]]}
        />
      );

      expect(screen.getByLabelText('Remove React')).toBeInTheDocument();
    });
  });

  describe('Custom Renderers', () => {
    it('uses custom item renderer when provided', async () => {
      const user = userEvent.setup();
      const customRenderer = vi.fn((item: TestItem) => (
        <div data-testid="custom-item">{item.name} - Custom</div>
      ));
      
      render(
        <UnifiedSelector 
          {...defaultProps} 
          renderItem={customRenderer}
        />
      );

      await user.click(screen.getByRole('textbox'));
      await waitFor(() => {
        expect(screen.getByTestId('custom-item')).toBeInTheDocument();
        expect(screen.getByText('React - Custom')).toBeInTheDocument();
      });

      expect(customRenderer).toHaveBeenCalled();
    });

    it('uses custom selected item renderer when provided', () => {
      const customSelectedRenderer = vi.fn((item: TestItem, onRemove: () => void) => (
        <div data-testid="custom-selected">
          {item.name} - Selected
          <button onClick={onRemove}>Remove</button>
        </div>
      ));
      
      render(
        <UnifiedSelector 
          {...defaultProps} 
          selectedItems={[mockItems[0]]}
          renderSelectedItem={customSelectedRenderer}
        />
      );

      expect(screen.getByTestId('custom-selected')).toBeInTheDocument();
      expect(screen.getByText('React - Selected')).toBeInTheDocument();
      expect(customSelectedRenderer).toHaveBeenCalled();
    });
  });
});