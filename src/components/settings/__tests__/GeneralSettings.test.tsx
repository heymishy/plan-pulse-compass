import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GeneralSettings from '../GeneralSettings';
import { render } from '@/test/utils/test-utils';
import { useSettings } from '@/context/SettingsContext';
import { useApp } from '@/context/AppContext';

// Mock the contexts
vi.mock('@/context/SettingsContext', () => ({
  useSettings: vi.fn(),
}));

vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

const mockUpdateConfig = vi.fn();
const mockConfig = {
  organizationName: 'Test Organization',
  fiscalYearStart: '2024-01-01',
  defaultCurrency: 'USD',
  timeZone: 'UTC',
  workingDaysPerWeek: 5,
  workingHoursPerDay: 8,
  enableNotifications: true,
  enableDarkMode: false,
  enableAdvancedFeatures: true,
  iterationLength: 14,
  planningHorizon: 365,
};

describe('GeneralSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSettings).mockReturnValue({
      config: mockConfig,
      updateConfig: mockUpdateConfig,
      isSetupComplete: true,
    });
    vi.mocked(useApp).mockReturnValue({
      teams: [],
      people: [],
      divisions: [],
      skills: [],
      roles: [],
      projects: [],
      allocations: [],
    } as any);
  });

  const renderComponent = () => {
    return render(<GeneralSettings />);
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });

  it('displays organization name field', () => {
    renderComponent();

    const orgNameInput = screen.getByLabelText('Organization Name');
    expect(orgNameInput).toBeInTheDocument();
    expect(orgNameInput).toHaveValue('Test Organization');
  });

  it('displays fiscal year start field', () => {
    renderComponent();

    const fiscalYearInput = screen.getByLabelText('Fiscal Year Start');
    expect(fiscalYearInput).toBeInTheDocument();
    expect(fiscalYearInput).toHaveValue('2024-01-01');
  });

  it('displays default currency field', () => {
    renderComponent();

    const currencySelect = screen.getByLabelText('Default Currency');
    expect(currencySelect).toBeInTheDocument();
    expect(currencySelect).toHaveValue('USD');
  });

  it('displays time zone field', () => {
    renderComponent();

    const timeZoneSelect = screen.getByLabelText('Time Zone');
    expect(timeZoneSelect).toBeInTheDocument();
    expect(timeZoneSelect).toHaveValue('UTC');
  });

  it('displays working days per week field', () => {
    renderComponent();

    const workingDaysInput = screen.getByLabelText('Working Days per Week');
    expect(workingDaysInput).toBeInTheDocument();
    expect(workingDaysInput).toHaveValue('5');
  });

  it('displays working hours per day field', () => {
    renderComponent();

    const workingHoursInput = screen.getByLabelText('Working Hours per Day');
    expect(workingHoursInput).toBeInTheDocument();
    expect(workingHoursInput).toHaveValue('8');
  });

  it('displays iteration length field', () => {
    renderComponent();

    const iterationLengthInput = screen.getByLabelText(
      'Iteration Length (days)'
    );
    expect(iterationLengthInput).toBeInTheDocument();
    expect(iterationLengthInput).toHaveValue('14');
  });

  it('displays planning horizon field', () => {
    renderComponent();

    const planningHorizonInput = screen.getByLabelText(
      'Planning Horizon (days)'
    );
    expect(planningHorizonInput).toBeInTheDocument();
    expect(planningHorizonInput).toHaveValue('365');
  });

  it('displays enable notifications toggle', () => {
    renderComponent();

    const notificationsToggle = screen.getByLabelText('Enable Notifications');
    expect(notificationsToggle).toBeInTheDocument();
    expect(notificationsToggle).toBeChecked();
  });

  it('displays enable dark mode toggle', () => {
    renderComponent();

    const darkModeToggle = screen.getByLabelText('Enable Dark Mode');
    expect(darkModeToggle).toBeInTheDocument();
    expect(darkModeToggle).not.toBeChecked();
  });

  it('displays enable advanced features toggle', () => {
    renderComponent();

    const advancedFeaturesToggle = screen.getByLabelText(
      'Enable Advanced Features'
    );
    expect(advancedFeaturesToggle).toBeInTheDocument();
    expect(advancedFeaturesToggle).toBeChecked();
  });

  it('handles organization name change', async () => {
    renderComponent();

    const orgNameInput = screen.getByLabelText('Organization Name');
    fireEvent.change(orgNameInput, { target: { value: 'New Organization' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith({
        ...mockConfig,
        organizationName: 'New Organization',
      });
    });
  });

  it('handles fiscal year start change', async () => {
    renderComponent();

    const fiscalYearInput = screen.getByLabelText('Fiscal Year Start');
    fireEvent.change(fiscalYearInput, { target: { value: '2025-01-01' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith({
        ...mockConfig,
        fiscalYearStart: '2025-01-01',
      });
    });
  });

  it('handles currency change', async () => {
    renderComponent();

    const currencySelect = screen.getByLabelText('Default Currency');
    fireEvent.change(currencySelect, { target: { value: 'EUR' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith({
        ...mockConfig,
        defaultCurrency: 'EUR',
      });
    });
  });

  it('handles time zone change', async () => {
    renderComponent();

    const timeZoneSelect = screen.getByLabelText('Time Zone');
    fireEvent.change(timeZoneSelect, { target: { value: 'America/New_York' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith({
        ...mockConfig,
        timeZone: 'America/New_York',
      });
    });
  });

  it('handles working days per week change', async () => {
    renderComponent();

    const workingDaysInput = screen.getByLabelText('Working Days per Week');
    fireEvent.change(workingDaysInput, { target: { value: '4' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith({
        ...mockConfig,
        workingDaysPerWeek: 4,
      });
    });
  });

  it('handles working hours per day change', async () => {
    renderComponent();

    const workingHoursInput = screen.getByLabelText('Working Hours per Day');
    fireEvent.change(workingHoursInput, { target: { value: '7' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith({
        ...mockConfig,
        workingHoursPerDay: 7,
      });
    });
  });

  it('handles iteration length change', async () => {
    renderComponent();

    const iterationLengthInput = screen.getByLabelText(
      'Iteration Length (days)'
    );
    fireEvent.change(iterationLengthInput, { target: { value: '21' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith({
        ...mockConfig,
        iterationLength: 21,
      });
    });
  });

  it('handles planning horizon change', async () => {
    renderComponent();

    const planningHorizonInput = screen.getByLabelText(
      'Planning Horizon (days)'
    );
    fireEvent.change(planningHorizonInput, { target: { value: '180' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith({
        ...mockConfig,
        planningHorizon: 180,
      });
    });
  });

  it('handles notifications toggle', async () => {
    renderComponent();

    const notificationsToggle = screen.getByLabelText('Enable Notifications');
    fireEvent.click(notificationsToggle);

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith({
        ...mockConfig,
        enableNotifications: false,
      });
    });
  });

  it('handles dark mode toggle', async () => {
    renderComponent();

    const darkModeToggle = screen.getByLabelText('Enable Dark Mode');
    fireEvent.click(darkModeToggle);

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith({
        ...mockConfig,
        enableDarkMode: true,
      });
    });
  });

  it('handles advanced features toggle', async () => {
    renderComponent();

    const advancedFeaturesToggle = screen.getByLabelText(
      'Enable Advanced Features'
    );
    fireEvent.click(advancedFeaturesToggle);

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith({
        ...mockConfig,
        enableAdvancedFeatures: false,
      });
    });
  });

  it('validates required fields', async () => {
    renderComponent();

    const orgNameInput = screen.getByLabelText('Organization Name');
    fireEvent.change(orgNameInput, { target: { value: '' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText('Organization name is required')
      ).toBeInTheDocument();
    });

    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it('validates numeric fields', async () => {
    renderComponent();

    const workingDaysInput = screen.getByLabelText('Working Days per Week');
    fireEvent.change(workingDaysInput, { target: { value: '0' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText('Working days must be between 1 and 7')
      ).toBeInTheDocument();
    });

    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it('validates working hours range', async () => {
    renderComponent();

    const workingHoursInput = screen.getByLabelText('Working Hours per Day');
    fireEvent.change(workingHoursInput, { target: { value: '25' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText('Working hours must be between 1 and 24')
      ).toBeInTheDocument();
    });

    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it('validates iteration length range', async () => {
    renderComponent();

    const iterationLengthInput = screen.getByLabelText(
      'Iteration Length (days)'
    );
    fireEvent.change(iterationLengthInput, { target: { value: '0' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText('Iteration length must be between 1 and 90 days')
      ).toBeInTheDocument();
    });

    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it('validates planning horizon range', async () => {
    renderComponent();

    const planningHorizonInput = screen.getByLabelText(
      'Planning Horizon (days)'
    );
    fireEvent.change(planningHorizonInput, { target: { value: '0' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText('Planning horizon must be between 30 and 1095 days')
      ).toBeInTheDocument();
    });

    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it('shows success message after successful save', async () => {
    const mockToast = vi.fn();
    vi.mocked(require('@/hooks/use-toast').useToast).mockReturnValue({
      toast: mockToast,
    });

    renderComponent();

    const orgNameInput = screen.getByLabelText('Organization Name');
    fireEvent.change(orgNameInput, {
      target: { value: 'Updated Organization' },
    });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Settings saved',
        description: 'Your general settings have been updated successfully.',
      });
    });
  });

  it('handles save error gracefully', async () => {
    const mockToast = vi.fn();
    vi.mocked(require('@/hooks/use-toast').useToast).mockReturnValue({
      toast: mockToast,
    });

    mockUpdateConfig.mockRejectedValueOnce(new Error('Save failed'));

    renderComponent();

    const orgNameInput = screen.getByLabelText('Organization Name');
    fireEvent.change(orgNameInput, {
      target: { value: 'Updated Organization' },
    });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    });
  });

  it('resets form to original values', async () => {
    renderComponent();

    const orgNameInput = screen.getByLabelText('Organization Name');
    fireEvent.change(orgNameInput, {
      target: { value: 'Modified Organization' },
    });

    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(orgNameInput).toHaveValue('Test Organization');
    });
  });

  it('disables form when not setup complete', () => {
    vi.mocked(useSettings).mockReturnValue({
      config: mockConfig,
      updateConfig: mockUpdateConfig,
      isSetupComplete: false,
    });

    renderComponent();

    const orgNameInput = screen.getByLabelText('Organization Name');
    expect(orgNameInput).toBeDisabled();

    const saveButton = screen.getByText('Save Changes');
    expect(saveButton).toBeDisabled();
  });
});
