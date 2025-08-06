import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IntelligencePanel, { 
  IntelligencePanelProps, 
  Insight, 
  Recommendation, 
  Action 
} from '../intelligence-panel';

// Mock data
const mockInsights: Insight[] = [
  {
    id: '1',
    type: 'gap',
    severity: 'high',
    title: 'Critical Skill Gap',
    description: 'Missing React expertise in frontend team',
    confidence: 95,
    dataSource: ['team-analysis'],
    metrics: {
      current: 2,
      target: 5,
      unit: 'experts'
    },
    trend: {
      direction: 'down',
      change: -15,
      period: 'last quarter'
    }
  },
  {
    id: '2',
    type: 'opportunity',
    severity: 'medium',
    title: 'Training Opportunity',
    description: 'Team members showing interest in advanced TypeScript',
    confidence: 78,
    dataSource: ['skill-assessment']
  },
  {
    id: '3',
    type: 'success',
    severity: 'low',
    title: 'Good Coverage',
    description: 'Excellent Node.js coverage across teams',
    confidence: 92
  }
];

const mockActions: Action[] = [
  {
    id: 'action-1',
    type: 'primary',
    label: 'Start Training',
    description: 'Begin React training program',
    handler: vi.fn()
  },
  {
    id: 'action-2',
    type: 'secondary',
    label: 'Hire Expert',
    description: 'Recruit senior React developer'
  },
  {
    id: 'action-3',
    type: 'external',
    label: 'View Courses',
    url: 'https://example.com/courses'
  }
];

const mockRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Implement React Training Program',
    description: 'Set up comprehensive React training for the frontend team',
    priority: 'high',
    effort: 'medium',
    impact: 'high',
    actions: mockActions,
    estimatedTime: '2-3 weeks'
  },
  {
    id: '2',
    title: 'Skill Assessment Review',
    description: 'Conduct quarterly skill assessment',
    priority: 'medium',
    effort: 'low',
    impact: 'medium',
    actions: [mockActions[1]],
    estimatedTime: '1 week'
  }
];

const defaultProps: IntelligencePanelProps = {
  title: 'Test Intelligence Panel',
  insights: mockInsights,
  recommendations: mockRecommendations,
  onActionClick: vi.fn()
};

// Mock window.open for external link tests
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true
});

describe('IntelligencePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowOpen.mockClear();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<IntelligencePanel {...defaultProps} />);
      
      expect(screen.getByText('Test Intelligence Panel')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Total count badge
    });

    it('renders with custom header icon', () => {
      const TestIcon = () => <div data-testid="custom-icon">Custom</div>;
      
      render(
        <IntelligencePanel 
          {...defaultProps} 
          headerIcon={<TestIcon />}
        />
      );
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('renders empty state when no insights or recommendations', () => {
      render(
        <IntelligencePanel 
          {...defaultProps} 
          insights={[]}
          recommendations={[]}
          emptyStateMessage="Custom empty message"
        />
      );
      
      expect(screen.getByText('Custom empty message')).toBeInTheDocument();
    });

    it('applies severity styling correctly', () => {
      const { rerender } = render(
        <IntelligencePanel {...defaultProps} severity="critical" />
      );
      
      // Check that critical severity styling is applied
      const card = screen.getByText('Test Intelligence Panel').closest('.border-2');
      expect(card).toHaveClass('bg-red-50');

      // Test different severity levels
      rerender(<IntelligencePanel {...defaultProps} severity="low" />);
      expect(card).toHaveClass('bg-blue-50');
    });
  });

  describe('Collapsible Behavior', () => {
    it('is expanded by default', () => {
      render(<IntelligencePanel {...defaultProps} />);
      
      expect(screen.getByText('Critical Skill Gap')).toBeInTheDocument();
    });

    it('can be collapsed and expanded', async () => {
      const user = userEvent.setup();
      
      render(<IntelligencePanel {...defaultProps} collapsible={true} />);
      
      // Should be expanded initially
      expect(screen.getByText('Critical Skill Gap')).toBeInTheDocument();
      
      // Click to collapse
      await user.click(screen.getByText('Test Intelligence Panel'));
      
      // Content should be hidden
      expect(screen.queryByText('Critical Skill Gap')).not.toBeInTheDocument();
      
      // Click to expand again
      await user.click(screen.getByText('Test Intelligence Panel'));
      
      // Content should be visible again
      await waitFor(() => {
        expect(screen.getByText('Critical Skill Gap')).toBeInTheDocument();
      });
    });

    it('cannot be collapsed when collapsible is false', async () => {
      const user = userEvent.setup();
      
      render(<IntelligencePanel {...defaultProps} collapsible={false} />);
      
      const header = screen.getByText('Test Intelligence Panel');
      
      // Should not have cursor pointer class
      expect(header.closest('.cursor-pointer')).not.toBeInTheDocument();
      
      // Click should not collapse
      await user.click(header);
      expect(screen.getByText('Critical Skill Gap')).toBeInTheDocument();
    });

    it('starts collapsed when defaultExpanded is false', () => {
      render(
        <IntelligencePanel 
          {...defaultProps} 
          defaultExpanded={false}
        />
      );
      
      expect(screen.queryByText('Critical Skill Gap')).not.toBeInTheDocument();
    });
  });

  describe('Insights Display', () => {
    it('displays insights grouped by severity', () => {
      render(<IntelligencePanel {...defaultProps} />);
      
      // High severity insight should appear first
      expect(screen.getByText('Critical Skill Gap')).toBeInTheDocument();
      expect(screen.getByText('Training Opportunity')).toBeInTheDocument();
      expect(screen.getByText('Good Coverage')).toBeInTheDocument();
    });

    it('displays insight metrics correctly', () => {
      render(<IntelligencePanel {...defaultProps} />);
      
      expect(screen.getByText('Current:')).toBeInTheDocument();
      expect(screen.getByText('2 experts')).toBeInTheDocument();
      expect(screen.getByText('Target:')).toBeInTheDocument();
      expect(screen.getByText('5 experts')).toBeInTheDocument();
    });

    it('displays trend information', () => {
      render(<IntelligencePanel {...defaultProps} />);
      
      expect(screen.getByText('-15% over last quarter')).toBeInTheDocument();
    });

    it('shows confidence when enabled', () => {
      render(<IntelligencePanel {...defaultProps} showConfidence={true} />);
      
      expect(screen.getByText('95%')).toBeInTheDocument();
      expect(screen.getByText('78%')).toBeInTheDocument();
    });

    it('hides confidence when disabled', () => {
      render(<IntelligencePanel {...defaultProps} showConfidence={false} />);
      
      expect(screen.queryByText('95%')).not.toBeInTheDocument();
    });

    it('calls onInsightView when insight is clicked', async () => {
      const user = userEvent.setup();
      const mockOnInsightView = vi.fn();
      
      render(
        <IntelligencePanel 
          {...defaultProps} 
          onInsightView={mockOnInsightView}
        />
      );
      
      await user.click(screen.getByText('Critical Skill Gap'));
      
      expect(mockOnInsightView).toHaveBeenCalledWith(mockInsights[0]);
    });
  });

  describe('Recommendations Display', () => {
    it('displays recommendations sorted by priority', () => {
      render(<IntelligencePanel {...defaultProps} recommendations={mockRecommendations} />);
      
      // Switch to recommendations tab if both tabs exist
      if (screen.queryByText('Actions (2)')) {
        fireEvent.click(screen.getByText('Actions (2)'));
      }
      
      expect(screen.getByText('Implement React Training Program')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('2-3 weeks')).toBeInTheDocument();
    });

    it('displays effort and impact indicators', () => {
      render(<IntelligencePanel {...defaultProps} />);
      
      // Switch to recommendations tab if both tabs exist
      if (screen.queryByText('Actions (2)')) {
        fireEvent.click(screen.getByText('Actions (2)'));
      }
      
      expect(screen.getByText('Effort:')).toBeInTheDocument();
      expect(screen.getByText('Impact:')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('calls onRecommendationView when recommendation is clicked', async () => {
      const user = userEvent.setup();
      const mockOnRecommendationView = vi.fn();
      
      render(
        <IntelligencePanel 
          {...defaultProps} 
          onRecommendationView={mockOnRecommendationView}
        />
      );
      
      // Switch to recommendations tab if both tabs exist
      if (screen.queryByText('Actions (2)')) {
        await user.click(screen.getByText('Actions (2)'));
      }
      
      await user.click(screen.getByText('Implement React Training Program'));
      
      expect(mockOnRecommendationView).toHaveBeenCalledWith(mockRecommendations[0]);
    });
  });

  describe('Actions Handling', () => {
    it('handles primary action clicks', async () => {
      const user = userEvent.setup();
      const mockOnActionClick = vi.fn();
      
      render(
        <IntelligencePanel 
          {...defaultProps} 
          onActionClick={mockOnActionClick}
        />
      );
      
      // Switch to recommendations tab
      if (screen.queryByText('Actions (2)')) {
        await user.click(screen.getByText('Actions (2)'));
      }
      
      await user.click(screen.getByText('Start Training'));
      
      expect(mockOnActionClick).toHaveBeenCalledWith(mockActions[0]);
    });

    it('handles secondary action clicks', async () => {
      const user = userEvent.setup();
      const mockOnActionClick = vi.fn();
      
      render(
        <IntelligencePanel 
          {...defaultProps} 
          onActionClick={mockOnActionClick}
        />
      );
      
      // Switch to recommendations tab
      if (screen.queryByText('Actions (2)')) {
        await user.click(screen.getByText('Actions (2)'));
      }
      
      await user.click(screen.getByText('Hire Expert'));
      
      expect(mockOnActionClick).toHaveBeenCalledWith(mockActions[1]);
    });

    it('handles external action clicks', async () => {
      const user = userEvent.setup();
      
      render(<IntelligencePanel {...defaultProps} />);
      
      // Switch to recommendations tab
      if (screen.queryByText('Actions (2)')) {
        await user.click(screen.getByText('Actions (2)'));
      }
      
      await user.click(screen.getByText('View Courses'));
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://example.com/courses',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('prevents event bubbling when action is clicked', async () => {
      const user = userEvent.setup();
      const mockOnRecommendationView = vi.fn();
      const mockOnActionClick = vi.fn();
      
      render(
        <IntelligencePanel 
          {...defaultProps} 
          onRecommendationView={mockOnRecommendationView}
          onActionClick={mockOnActionClick}
        />
      );
      
      // Switch to recommendations tab
      if (screen.queryByText('Actions (2)')) {
        await user.click(screen.getByText('Actions (2)'));
      }
      
      // Click on action button should not trigger recommendation click
      await user.click(screen.getByText('Start Training'));
      
      expect(mockOnActionClick).toHaveBeenCalled();
      expect(mockOnRecommendationView).not.toHaveBeenCalled();
    });
  });

  describe('Tab Navigation', () => {
    it('shows tab navigation when both insights and recommendations exist', () => {
      render(<IntelligencePanel {...defaultProps} />);
      
      expect(screen.getByText('Insights (3)')).toBeInTheDocument();
      expect(screen.getByText('Actions (2)')).toBeInTheDocument();
    });

    it('does not show tabs when only insights exist', () => {
      render(
        <IntelligencePanel 
          {...defaultProps} 
          recommendations={[]}
        />
      );
      
      expect(screen.queryByText('Insights (3)')).not.toBeInTheDocument();
      expect(screen.queryByText('Actions (0)')).not.toBeInTheDocument();
    });

    it('does not show tabs when only recommendations exist', () => {
      render(
        <IntelligencePanel 
          {...defaultProps} 
          insights={[]}
        />
      );
      
      expect(screen.queryByText('Insights (0)')).not.toBeInTheDocument();
      expect(screen.queryByText('Actions (2)')).not.toBeInTheDocument();
    });

    it('switches between tabs correctly', async () => {
      const user = userEvent.setup();
      
      render(<IntelligencePanel {...defaultProps} />);
      
      // Should start on insights tab
      expect(screen.getByText('Critical Skill Gap')).toBeInTheDocument();
      
      // Switch to recommendations
      await user.click(screen.getByText('Actions (2)'));
      
      expect(screen.getByText('Implement React Training Program')).toBeInTheDocument();
      expect(screen.queryByText('Critical Skill Gap')).not.toBeInTheDocument();
      
      // Switch back to insights
      await user.click(screen.getByText('Insights (3)'));
      
      expect(screen.getByText('Critical Skill Gap')).toBeInTheDocument();
      expect(screen.queryByText('Implement React Training Program')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<IntelligencePanel {...defaultProps} />);
      
      // Card should be focusable and have proper roles
      const card = screen.getByText('Test Intelligence Panel').closest('[role]');
      expect(card).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<IntelligencePanel {...defaultProps} />);
      
      // Tab navigation should work
      const insightsTab = screen.getByText('Insights (3)');
      insightsTab.focus();
      expect(document.activeElement).toBe(insightsTab);
      
      // Space or Enter should activate buttons
      fireEvent.keyDown(insightsTab, { key: 'Enter' });
      // Should remain on insights tab since it's already active
    });
  });

  describe('Styling and Layout', () => {
    it('applies custom className', () => {
      render(
        <IntelligencePanel 
          {...defaultProps} 
          className="custom-class"
        />
      );
      
      const card = screen.getByText('Test Intelligence Panel').closest('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('respects maxHeight setting', () => {
      render(
        <IntelligencePanel 
          {...defaultProps} 
          maxHeight="300px"
        />
      );
      
      const scrollableArea = document.querySelector('[style*="max-height: 300px"]');
      expect(scrollableArea).toBeInTheDocument();
    });
  });
});