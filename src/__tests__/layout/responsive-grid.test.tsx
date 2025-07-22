/**
 * Responsive Grid System Tests
 * Tests for responsive grid layout components
 */

import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ResponsiveGrid,
  DashboardGrid,
  CardGrid,
  FormGrid,
  ListGrid,
  MasonryGrid,
  GridItem,
} from '@/components/layout/responsive-grid';

describe('ResponsiveGrid', () => {
  test('renders with default single column', () => {
    render(
      <ResponsiveGrid data-testid="grid">
        <div>Item 1</div>
        <div>Item 2</div>
      </ResponsiveGrid>
    );

    const grid = screen.getByTestId('grid');
    expect(grid).toHaveClass('grid', 'grid-cols-1', 'gap-md');
  });

  test('applies responsive column configuration', () => {
    render(
      <ResponsiveGrid
        cols={{
          default: 1,
          sm: 2,
          md: 3,
          lg: 4,
          xl: 6,
          '2xl': 12,
        }}
        data-testid="grid"
      >
        <div>Item</div>
      </ResponsiveGrid>
    );

    const grid = screen.getByTestId('grid');
    expect(grid).toHaveClass(
      'grid',
      'grid-cols-1',
      'sm:grid-cols-2',
      'md:grid-cols-3',
      'lg:grid-cols-4',
      'xl:grid-cols-6',
      '2xl:grid-cols-12'
    );
  });

  test('applies gap sizes correctly', () => {
    const { rerender } = render(
      <ResponsiveGrid gap="sm" data-testid="grid">
        <div>Item</div>
      </ResponsiveGrid>
    );

    expect(screen.getByTestId('grid')).toHaveClass('gap-sm');

    rerender(
      <ResponsiveGrid gap="lg" data-testid="grid">
        <div>Item</div>
      </ResponsiveGrid>
    );

    expect(screen.getByTestId('grid')).toHaveClass('gap-lg');
  });

  test('supports auto-fit layout', () => {
    render(
      <ResponsiveGrid
        autoFit={{
          minWidth: '200px',
          maxWidth: '300px',
        }}
        data-testid="grid"
      >
        <div>Item</div>
      </ResponsiveGrid>
    );

    const grid = screen.getByTestId('grid');
    expect(grid).toHaveClass(
      'grid-cols-[repeat(auto-fit,minmax(200px,300px))]'
    );
  });

  test('applies dense grid when specified', () => {
    render(
      <ResponsiveGrid dense data-testid="grid">
        <div>Item</div>
      </ResponsiveGrid>
    );

    expect(screen.getByTestId('grid')).toHaveClass('grid-flow-dense');
  });

  test('merges custom className', () => {
    render(
      <ResponsiveGrid className="custom-class" data-testid="grid">
        <div>Item</div>
      </ResponsiveGrid>
    );

    const grid = screen.getByTestId('grid');
    expect(grid).toHaveClass('grid', 'custom-class');
  });
});

describe('DashboardGrid', () => {
  test('applies dashboard-specific responsive layout', () => {
    render(
      <DashboardGrid data-testid="dashboard-grid">
        <div>Card 1</div>
        <div>Card 2</div>
        <div>Card 3</div>
      </DashboardGrid>
    );

    const grid = screen.getByTestId('dashboard-grid');
    expect(grid).toHaveClass(
      'grid',
      'grid-cols-1',
      'md:grid-cols-2',
      'lg:grid-cols-3',
      'xl:grid-cols-4',
      'gap-lg'
    );
  });
});

describe('CardGrid', () => {
  test('uses auto-fit with minimum width', () => {
    render(
      <CardGrid data-testid="card-grid">
        <div>Card 1</div>
        <div>Card 2</div>
      </CardGrid>
    );

    const grid = screen.getByTestId('card-grid');
    expect(grid).toHaveClass('grid-cols-[repeat(auto-fit,minmax(280px,1fr))]');
    expect(grid).toHaveClass('gap-md', 'items-start');
  });
});

describe('FormGrid', () => {
  test('applies single field layout by default', () => {
    render(
      <FormGrid data-testid="form-grid">
        <div>Field 1</div>
        <div>Field 2</div>
      </FormGrid>
    );

    const grid = screen.getByTestId('form-grid');
    expect(grid).toHaveClass('grid-cols-1');
  });

  test('applies double field layout', () => {
    render(
      <FormGrid fields="double" data-testid="form-grid">
        <div>Field 1</div>
        <div>Field 2</div>
      </FormGrid>
    );

    const grid = screen.getByTestId('form-grid');
    expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
  });

  test('applies triple field layout', () => {
    render(
      <FormGrid fields="triple" data-testid="form-grid">
        <div>Field 1</div>
        <div>Field 2</div>
        <div>Field 3</div>
      </FormGrid>
    );

    const grid = screen.getByTestId('form-grid');
    expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
  });
});

describe('ListGrid', () => {
  test('applies list-specific layout', () => {
    render(
      <ListGrid data-testid="list-grid">
        <div>Item 1</div>
        <div>Item 2</div>
      </ListGrid>
    );

    const grid = screen.getByTestId('list-grid');
    expect(grid).toHaveClass('grid-cols-1', 'lg:grid-cols-2', 'gap-sm');
  });
});

describe('MasonryGrid', () => {
  test('applies masonry-specific layout with dense packing', () => {
    render(
      <MasonryGrid data-testid="masonry-grid">
        <div>Item 1</div>
        <div>Item 2</div>
      </MasonryGrid>
    );

    const grid = screen.getByTestId('masonry-grid');
    expect(grid).toHaveClass(
      'grid',
      'grid-cols-1',
      'sm:grid-cols-2',
      'lg:grid-cols-3',
      'xl:grid-cols-4',
      'gap-md',
      'grid-flow-dense',
      '[&>*]:break-inside-avoid'
    );
  });
});

describe('GridItem', () => {
  test('renders without spans by default', () => {
    render(
      <GridItem data-testid="grid-item">
        <div>Content</div>
      </GridItem>
    );

    const item = screen.getByTestId('grid-item');
    expect(item).toBeInTheDocument();
    expect(item.className).toBe('');
  });

  test('applies column spans correctly', () => {
    render(
      <GridItem
        colSpan={{
          default: 2,
          sm: 3,
          md: 4,
          lg: 6,
          xl: 8,
          '2xl': 12,
        }}
        data-testid="grid-item"
      >
        <div>Content</div>
      </GridItem>
    );

    const item = screen.getByTestId('grid-item');
    expect(item).toHaveClass(
      'col-span-2',
      'sm:col-span-3',
      'md:col-span-4',
      'lg:col-span-6',
      'xl:col-span-8',
      '2xl:col-span-12'
    );
  });

  test('applies row spans correctly', () => {
    render(
      <GridItem
        rowSpan={{
          default: 1,
          md: 2,
          lg: 3,
        }}
        data-testid="grid-item"
      >
        <div>Content</div>
      </GridItem>
    );

    const item = screen.getByTestId('grid-item');
    expect(item).toHaveClass('row-span-1', 'md:row-span-2', 'lg:row-span-3');
  });

  test('combines column and row spans', () => {
    render(
      <GridItem
        colSpan={{ default: 2 }}
        rowSpan={{ default: 2 }}
        data-testid="grid-item"
      >
        <div>Content</div>
      </GridItem>
    );

    const item = screen.getByTestId('grid-item');
    expect(item).toHaveClass('col-span-2', 'row-span-2');
  });

  test('merges custom className', () => {
    render(
      <GridItem
        colSpan={{ default: 2 }}
        className="custom-class"
        data-testid="grid-item"
      >
        <div>Content</div>
      </GridItem>
    );

    const item = screen.getByTestId('grid-item');
    expect(item).toHaveClass('col-span-2', 'custom-class');
  });
});

describe('Grid System Integration', () => {
  test('works with nested grids', () => {
    render(
      <ResponsiveGrid cols={{ default: 2 }} data-testid="outer-grid">
        <div>Item 1</div>
        <ResponsiveGrid cols={{ default: 3 }} data-testid="inner-grid">
          <div>Nested 1</div>
          <div>Nested 2</div>
          <div>Nested 3</div>
        </ResponsiveGrid>
      </ResponsiveGrid>
    );

    const outerGrid = screen.getByTestId('outer-grid');
    const innerGrid = screen.getByTestId('inner-grid');

    expect(outerGrid).toHaveClass('grid-cols-2');
    expect(innerGrid).toHaveClass('grid-cols-3');
  });

  test('handles empty grids gracefully', () => {
    render(<ResponsiveGrid data-testid="empty-grid" />);

    const grid = screen.getByTestId('empty-grid');
    expect(grid).toHaveClass('grid');
  });

  test('supports different gap sizes in nested grids', () => {
    render(
      <ResponsiveGrid gap="lg" data-testid="outer-grid">
        <ResponsiveGrid gap="sm" data-testid="inner-grid">
          <div>Nested item</div>
        </ResponsiveGrid>
      </ResponsiveGrid>
    );

    expect(screen.getByTestId('outer-grid')).toHaveClass('gap-lg');
    expect(screen.getByTestId('inner-grid')).toHaveClass('gap-sm');
  });
});
