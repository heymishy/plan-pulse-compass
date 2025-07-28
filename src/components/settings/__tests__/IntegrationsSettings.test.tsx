import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import IntegrationsSettings from '../IntegrationsSettings';
import { AppConfig } from '@/types';

// Mock dependencies
vi.mock('@/context/SettingsContext');
vi.mock('@/hooks/use-toast');

const mockUseSettings = vi.mocked(useSettings);
const mockUseToast = vi.mocked(useToast);

const mockToast = vi.fn();

const mockConfig: AppConfig = {
  financialYear: {
    id: 'fy-2024',
    name: 'FY 2024',
    startDate: '2023-10-01',
    endDate: '2024-09-30',
  },
  iterationLength: 'fortnightly',
  quarters: [],
  workingDaysPerWeek: 5,
  workingHoursPerDay: 8,
  workingDaysPerYear: 260,
  workingDaysPerMonth: 22,
  currencySymbol: '$',
  integrations: {
    o365: {
      clientId: 'test-client-id',
      tenantId: 'test-tenant-id',
      redirectUri: 'http://localhost:3000/auth/callback',
      enabled: true,
    },
  },
};

const mockSetConfig = vi.fn();

describe('IntegrationsSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseToast.mockReturnValue({
      toast: mockToast,
    });

    mockUseSettings.mockReturnValue({
      config: mockConfig,
      setConfig: mockSetConfig,
      isSetupComplete: true,
      setIsSetupComplete: vi.fn(),
    });
  });

  describe('when rendering with O365 configuration', () => {
    it('should display O365 integration section', () => {
      render(<IntegrationsSettings />);

      expect(screen.getByText('Office 365 Integration')).toBeInTheDocument();
      expect(
        screen.getByText('Configure Office 365 credentials for employee import')
      ).toBeInTheDocument();
    });

    it('should show current O365 configuration values', () => {
      render(<IntegrationsSettings />);

      expect(screen.getByDisplayValue('test-client-id')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test-tenant-id')).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('http://localhost:3000/auth/callback')
      ).toBeInTheDocument();
    });

    it('should show O365 integration as enabled', () => {
      render(<IntegrationsSettings />);

      const enabledCheckbox = screen.getByRole('checkbox', {
        name: /enable o365 integration/i,
      });
      expect(enabledCheckbox).toBeChecked();
    });
  });

  describe('when rendering without O365 configuration', () => {
    beforeEach(() => {
      const configWithoutO365 = { ...mockConfig };
      delete configWithoutO365.integrations;

      mockUseSettings.mockReturnValue({
        config: configWithoutO365,
        setConfig: mockSetConfig,
        isSetupComplete: true,
        setIsSetupComplete: vi.fn(),
      });
    });

    it('should show empty form fields', () => {
      render(<IntegrationsSettings />);

      const clientIdInput = screen.getByLabelText(/client id/i);
      const tenantIdInput = screen.getByLabelText(/tenant id/i);
      const redirectUriInput = screen.getByLabelText(/redirect uri/i);

      expect(clientIdInput).toHaveValue('');
      expect(tenantIdInput).toHaveValue('');
      expect(redirectUriInput).toHaveValue(
        'http://localhost:3000/auth/callback'
      );
    });

    it('should show O365 integration as disabled', () => {
      render(<IntegrationsSettings />);

      const enabledCheckbox = screen.getByRole('checkbox', {
        name: /enable o365 integration/i,
      });
      expect(enabledCheckbox).not.toBeChecked();
    });
  });

  describe('when updating O365 configuration', () => {
    it('should update client ID field', async () => {
      const user = userEvent.setup();
      render(<IntegrationsSettings />);

      const clientIdInput = screen.getByLabelText(/client id/i);
      await user.clear(clientIdInput);
      await user.type(clientIdInput, 'new-client-id');

      expect(clientIdInput).toHaveValue('new-client-id');
    });

    it('should update tenant ID field', async () => {
      const user = userEvent.setup();
      render(<IntegrationsSettings />);

      const tenantIdInput = screen.getByLabelText(/tenant id/i);
      await user.clear(tenantIdInput);
      await user.type(tenantIdInput, 'new-tenant-id');

      expect(tenantIdInput).toHaveValue('new-tenant-id');
    });

    it('should update redirect URI field', async () => {
      const user = userEvent.setup();
      render(<IntegrationsSettings />);

      const redirectUriInput = screen.getByLabelText(/redirect uri/i);
      await user.clear(redirectUriInput);
      await user.type(redirectUriInput, 'https://myapp.com/callback');

      expect(redirectUriInput).toHaveValue('https://myapp.com/callback');
    });

    it('should toggle enabled state', async () => {
      const user = userEvent.setup();
      render(<IntegrationsSettings />);

      const enabledCheckbox = screen.getByRole('checkbox', {
        name: /enable o365 integration/i,
      });
      await user.click(enabledCheckbox);

      expect(enabledCheckbox).not.toBeChecked();
    });
  });

  describe('when saving O365 configuration', () => {
    it('should save configuration with valid data', async () => {
      const user = userEvent.setup();
      render(<IntegrationsSettings />);

      const clientIdInput = screen.getByLabelText(/client id/i);
      await user.clear(clientIdInput);
      await user.type(clientIdInput, 'updated-client-id');

      const saveButton = screen.getByRole('button', {
        name: /save o365 settings/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockSetConfig).toHaveBeenCalledWith(
          expect.objectContaining({
            integrations: {
              o365: {
                clientId: 'updated-client-id',
                tenantId: 'test-tenant-id',
                redirectUri: 'http://localhost:3000/auth/callback',
                enabled: true,
              },
            },
          })
        );
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Settings Saved',
        description:
          'O365 integration settings have been updated successfully.',
      });
    });

    it('should show error when client ID is missing', async () => {
      const user = userEvent.setup();
      render(<IntegrationsSettings />);

      const clientIdInput = screen.getByLabelText(/client id/i);
      await user.clear(clientIdInput);

      const saveButton = screen.getByRole('button', {
        name: /save o365 settings/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Client ID is required for O365 integration.',
          variant: 'destructive',
        });
      });

      expect(mockSetConfig).not.toHaveBeenCalled();
    });
  });

  describe('when testing O365 connection', () => {
    it('should show test connection button', () => {
      render(<IntegrationsSettings />);

      expect(
        screen.getByRole('button', { name: /test connection/i })
      ).toBeInTheDocument();
    });

    it('should attempt connection test when clicked', async () => {
      const user = userEvent.setup();
      render(<IntegrationsSettings />);

      const testButton = screen.getByRole('button', {
        name: /test connection/i,
      });
      await user.click(testButton);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Connection Test',
        description: 'Testing O365 connection configuration...',
      });
    });
  });

  describe('when resetting O365 configuration', () => {
    it('should show reset button', () => {
      render(<IntegrationsSettings />);

      expect(
        screen.getByRole('button', { name: /reset to defaults/i })
      ).toBeInTheDocument();
    });

    it('should reset to default values when clicked', async () => {
      const user = userEvent.setup();
      render(<IntegrationsSettings />);

      const resetButton = screen.getByRole('button', {
        name: /reset to defaults/i,
      });
      await user.click(resetButton);

      await waitFor(() => {
        expect(
          screen.getByDisplayValue('http://localhost:3000/auth/callback')
        ).toBeInTheDocument();
      });
    });
  });
});
