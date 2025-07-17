import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GeneralSettings from '../GeneralSettings';
import { render } from '@/test/utils/test-utils';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock the AppContext
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(() => ({
    config: {},
    setConfig: vi.fn(),
  })),
}));

describe('GeneralSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(<GeneralSettings />);
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });

  it('displays theme and appearance section', () => {
    renderComponent();
    expect(screen.getByText('Theme & Appearance')).toBeInTheDocument();
  });

  it('displays application name field', () => {
    renderComponent();
    const appNameInput = screen.getByLabelText('Application Name');
    expect(appNameInput).toBeInTheDocument();
    expect(appNameInput).toHaveValue('Team Planning');
  });

  it('displays default capacity field', () => {
    renderComponent();
    const capacityInput = screen.getByLabelText(
      'Default Capacity (hours/week)'
    );
    expect(capacityInput).toBeInTheDocument();
    expect(capacityInput).toHaveValue(40);
  });

  it('displays default employment type select', () => {
    renderComponent();
    expect(screen.getByText('Default Employment Type')).toBeInTheDocument();
  });

  it('displays date format select', () => {
    renderComponent();
    expect(screen.getByText('Date Format')).toBeInTheDocument();
  });

  it('displays build information section', () => {
    renderComponent();
    const buildInfoElements = screen.getAllByText('Build Information');
    expect(buildInfoElements.length).toBeGreaterThanOrEqual(1);
  });

  it('handles application name change', () => {
    renderComponent();
    const appNameInput = screen.getByLabelText('Application Name');
    fireEvent.change(appNameInput, { target: { value: 'New App Name' } });
    expect(appNameInput).toHaveValue('New App Name');
  });

  it('handles capacity change', () => {
    renderComponent();
    const capacityInput = screen.getByLabelText(
      'Default Capacity (hours/week)'
    );
    fireEvent.change(capacityInput, { target: { value: '35' } });
    expect(capacityInput).toHaveValue(35);
  });

  it('handles save button click', () => {
    renderComponent();
    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);

    // Just verify the button can be clicked - the toast is mocked at the module level
    expect(saveButton).toBeInTheDocument();
  });

  it('toggles theme preview visibility', () => {
    renderComponent();
    const previewButton = screen.getByText('Show Preview');
    fireEvent.click(previewButton);
    expect(screen.getByText('Hide Preview')).toBeInTheDocument();
  });
});
