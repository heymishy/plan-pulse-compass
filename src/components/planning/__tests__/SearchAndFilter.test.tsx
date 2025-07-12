import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import SearchAndFilter, { SearchFilters } from '../SearchAndFilter';
import { Team, Project, Epic, Division, Allocation } from '@/types';

// Mock data
const mockTeams: Team[] = [
  { id: 'team1', name: 'Frontend Team', divisionId: 'div1', capacity: 40 },
  { id: 'team2', name: 'Backend Team', divisionId: 'div1', capacity: 40 },
  { id: 'team3', name: 'Mobile Team', divisionId: 'div2', capacity: 40 },
];

const mockProjects: Project[] = [
  {
    id: 'proj1',
    name: 'Web Application',
    description: 'Main web app project',
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    status: 'active',
    budget: 100000,
    milestones: [],
  },
  {
    id: 'proj2',
    name: 'Mobile App',
    description: 'Mobile application for iOS and Android',
    startDate: '2024-03-01',
    endDate: '2024-09-30',
    status: 'active',
    budget: 150000,
    milestones: [],
  },
];

const mockEpics: Epic[] = [
  {
    id: 'epic1',
    name: 'User Authentication',
    projectId: 'proj1',
    description: 'Login and registration system',
    status: 'active',
    points: 21,
  },
  {
    id: 'epic2',
    name: 'Payment Integration',
    projectId: 'proj1',
    description: 'Payment processing',
    status: 'active',
    points: 13,
  },
  {
    id: 'epic3',
    name: 'Mobile Navigation',
    projectId: 'proj2',
    description: 'Navigation for mobile app',
    status: 'active',
    points: 8,
  },
];

const mockDivisions: Division[] = [
  { id: 'div1', name: 'Engineering', description: 'Software development' },
  { id: 'div2', name: 'Product', description: 'Product management' },
];

const mockAllocations: Allocation[] = [
  {
    id: 'alloc1',
    teamId: 'team1',
    cycleId: 'q1-2024',
    iterationNumber: 1,
    percentage: 80,
    epicId: 'epic1',
    runWorkCategoryId: '',
    notes: '',
  },
];

const defaultFilters: SearchFilters = {
  searchQuery: '',
  selectedDivisionIds: [],
  selectedTeamIds: [],
  selectedProjectIds: [],
  selectedEpicIds: [],
  allocationStatus: 'all',
  dateRange: 'all',
};

const defaultProps = {
  teams: mockTeams,
  projects: mockProjects,
  epics: mockEpics,
  divisions: mockDivisions,
  allocations: mockAllocations,
  filters: defaultFilters,
  onFiltersChange: vi.fn(),
  presets: [],
  onPresetSave: vi.fn(),
  onPresetLoad: vi.fn(),
  onPresetDelete: vi.fn(),
};

describe('SearchAndFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<SearchAndFilter {...defaultProps} />);
    expect(screen.getByText('Search & Filter')).toBeInTheDocument();
  });

  it('displays search input', () => {
    render(<SearchAndFilter {...defaultProps} />);
    expect(
      screen.getByPlaceholderText('Search teams, projects, epics...')
    ).toBeInTheDocument();
  });

  it('handles search input changes', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = vi.fn();

    render(
      <SearchAndFilter
        {...defaultProps}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const searchInput = screen.getByPlaceholderText(
      'Search teams, projects, epics...'
    );
    await user.type(searchInput, 'frontend');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      searchQuery: 'frontend',
    });
  });

  it('shows search results when searching', async () => {
    const user = userEvent.setup();
    const filtersWithSearch = { ...defaultFilters, searchQuery: 'frontend' };

    render(<SearchAndFilter {...defaultProps} filters={filtersWithSearch} />);

    expect(screen.getByText('Search Results')).toBeInTheDocument();
    expect(screen.getByText('Teams (1)')).toBeInTheDocument();
    expect(screen.getByText('Frontend Team')).toBeInTheDocument();
  });

  it('shows search results for projects', () => {
    const filtersWithSearch = { ...defaultFilters, searchQuery: 'web' };

    render(<SearchAndFilter {...defaultProps} filters={filtersWithSearch} />);

    expect(screen.getByText('Projects (1)')).toBeInTheDocument();
    expect(screen.getByText('Web Application')).toBeInTheDocument();
  });

  it('shows search results for epics', () => {
    const filtersWithSearch = {
      ...defaultFilters,
      searchQuery: 'authentication',
    };

    render(<SearchAndFilter {...defaultProps} filters={filtersWithSearch} />);

    expect(screen.getByText('Epics (1)')).toBeInTheDocument();
    expect(screen.getByText('User Authentication')).toBeInTheDocument();
  });

  it('shows no results message when search yields nothing', () => {
    const filtersWithSearch = { ...defaultFilters, searchQuery: 'nonexistent' };

    render(<SearchAndFilter {...defaultProps} filters={filtersWithSearch} />);

    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('can clear search', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = vi.fn();
    const filtersWithSearch = { ...defaultFilters, searchQuery: 'test' };

    render(
      <SearchAndFilter
        {...defaultProps}
        filters={filtersWithSearch}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...filtersWithSearch,
      searchQuery: '',
    });
  });

  it('displays allocation status filter', () => {
    render(<SearchAndFilter {...defaultProps} />);
    expect(screen.getByText('All Status')).toBeInTheDocument();
  });

  it('handles allocation status filter changes', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = vi.fn();

    render(
      <SearchAndFilter
        {...defaultProps}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    await user.click(screen.getByText('All Status'));
    await user.click(screen.getByText('Allocated'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      allocationStatus: 'allocated',
    });
  });

  it('displays date range filter', () => {
    render(<SearchAndFilter {...defaultProps} />);
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('shows advanced filters when expanded', async () => {
    const user = userEvent.setup();

    render(<SearchAndFilter {...defaultProps} />);

    const settingsButton = screen.getByRole('button', { name: '' });
    await user.click(settingsButton);

    expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
    expect(screen.getByText('Divisions')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
  });

  it('handles division filter selection', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = vi.fn();

    render(
      <SearchAndFilter
        {...defaultProps}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Open advanced filters
    const settingsButton = screen.getByRole('button', { name: '' });
    await user.click(settingsButton);

    // Select a division
    const engineeringCheckbox = screen.getByLabelText('Engineering');
    await user.click(engineeringCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      selectedDivisionIds: ['div1'],
    });
  });

  it('handles team filter selection', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = vi.fn();

    render(
      <SearchAndFilter
        {...defaultProps}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Open advanced filters
    const settingsButton = screen.getByRole('button', { name: '' });
    await user.click(settingsButton);

    // Select a team
    const frontendCheckbox = screen.getByLabelText('Frontend Team');
    await user.click(frontendCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      selectedTeamIds: ['team1'],
    });
  });

  it('shows active filters count', () => {
    const filtersWithActive = {
      ...defaultFilters,
      selectedDivisionIds: ['div1'],
      allocationStatus: 'allocated' as const,
    };

    render(<SearchAndFilter {...defaultProps} filters={filtersWithActive} />);

    expect(screen.getByText('2 filters')).toBeInTheDocument();
  });

  it('can clear all filters', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = vi.fn();
    const filtersWithActive = {
      ...defaultFilters,
      searchQuery: 'test',
      selectedDivisionIds: ['div1'],
    };

    render(
      <SearchAndFilter
        {...defaultProps}
        filters={filtersWithActive}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    await user.click(screen.getByText('Clear All'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith(defaultFilters);
  });

  it('handles preset saving', async () => {
    const user = userEvent.setup();
    const mockOnPresetSave = vi.fn();

    render(
      <SearchAndFilter {...defaultProps} onPresetSave={mockOnPresetSave} />
    );

    // Click save button
    await user.click(screen.getByText('Save'));

    // Enter preset name
    const nameInput = screen.getByPlaceholderText('My filter preset');
    await user.type(nameInput, 'My Custom Filter');

    // Save preset
    await user.click(screen.getByText('Save Preset'));

    expect(mockOnPresetSave).toHaveBeenCalledWith({
      name: 'My Custom Filter',
      filters: defaultFilters,
    });
  });

  it('displays filter presets', () => {
    const presets = [
      {
        id: 'preset1',
        name: 'Over-allocated Teams',
        filters: {
          ...defaultFilters,
          allocationStatus: 'overallocated' as const,
        },
        isDefault: true,
      },
    ];

    render(<SearchAndFilter {...defaultProps} presets={presets} />);

    expect(screen.getByText('Over-allocated Teams')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('handles preset loading', async () => {
    const user = userEvent.setup();
    const mockOnPresetLoad = vi.fn();
    const presets = [
      {
        id: 'preset1',
        name: 'Test Preset',
        filters: { ...defaultFilters, allocationStatus: 'allocated' as const },
      },
    ];

    render(
      <SearchAndFilter
        {...defaultProps}
        presets={presets}
        onPresetLoad={mockOnPresetLoad}
      />
    );

    await user.click(screen.getByText('Test Preset'));

    expect(mockOnPresetLoad).toHaveBeenCalledWith(presets[0]);
  });

  it('handles search result selection', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = vi.fn();
    const filtersWithSearch = { ...defaultFilters, searchQuery: 'frontend' };

    render(
      <SearchAndFilter
        {...defaultProps}
        filters={filtersWithSearch}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Click on a search result
    await user.click(screen.getByText('Frontend Team'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...filtersWithSearch,
      selectedTeamIds: ['team1'],
    });
  });
});
