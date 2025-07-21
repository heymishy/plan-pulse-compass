import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider } from '@/context/AppContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { TeamProvider } from '@/context/TeamContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { PlanningProvider } from '@/context/PlanningContext';
import { GoalProvider } from '@/context/GoalContext';
import { ScenarioProvider } from '@/context/ScenarioContext';
import { ThemeProvider } from '@/context/ThemeContext';
import SteerCoOCR from '../SteerCoOCR';
import { promises as fs } from 'fs';
import path from 'path';

vi.unmock('pptx2json'); // Ensure the real library is used

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <TeamProvider>
          <ProjectProvider>
            <PlanningProvider>
              <GoalProvider>
                <AppProvider>
                  <ScenarioProvider>{children}</ScenarioProvider>
                </AppProvider>
              </GoalProvider>
            </PlanningProvider>
          </ProjectProvider>
        </TeamProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
};

const customRender = (ui: React.ReactElement, options?: any) =>
  render(ui, { wrapper: AllTheProviders, ...options });

describe('SteerCoOCR Component with real files', () => {
  it('should process a real PPTX file', async () => {
    const filePath = path.resolve(
      __dirname,
      '../../../../sample-data/steerco-deck.pptx'
    );
    const fileContent = await fs.readFile(filePath);
    const file = new File([fileContent], 'steerco-deck.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });

    customRender(<SteerCoOCR />);

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    const processButton = screen.getByText('Process Document');
    fireEvent.click(processButton);

    await waitFor(() => {
      const result = screen.getByTestId('ocr-result');
      expect(result).toHaveTextContent(/Project Phoenix/i);
      expect(result).toHaveTextContent(/Project Titan/i);
    });
  }, 30000);
});
