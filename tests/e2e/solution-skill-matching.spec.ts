import { test, expect } from '@playwright/test';
import { ensureSetupComplete, setLocalStorage } from './test-helpers';
import { Skill, Solution, Team, Project, ProjectSolution } from '@/types';

test.describe('Solution-Skill-Team Matching E2E Test', () => {
  test.beforeEach(async ({ page }) => {
    await ensureSetupComplete(page);

    // 1. Setup initial data
    const testSkill: Skill = {
      id: 'skill-d365',
      name: 'D365 Development',
      category: 'business-apps',
      createdDate: new Date().toISOString(),
    };

    const testSolution: Solution = {
      id: 'sol-d365',
      name: 'Dynamics 365 Integration',
      description: 'Solution for integrating with D365',
      category: 'integration',
      skills: ['skill-d365'],
      createdDate: new Date().toISOString(),
    };

    const testTeam: Team = {
      id: 'team-d365-experts',
      name: 'Dynamics Experts',
      description: 'Team with D365 skills',
      type: 'permanent',
      status: 'active',
      capacity: 40,
      targetSkills: ['skill-d365'],
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    const testProject: Project = {
      id: 'proj-crm-impl',
      name: 'CRM Implementation',
      description: 'New CRM system implementation',
      status: 'planning',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      milestones: [],
      priority: 1,
      ranking: 1,
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    await setLocalStorage(page, 'planning-skills', [testSkill]);
    await setLocalStorage(page, 'planning-solutions', [testSolution]);
    await setLocalStorage(page, 'planning-teams', [testTeam]);
    await setLocalStorage(page, 'planning-projects', [testProject]);
  });

  test('should match a team to a project via a solution skill', async ({
    page,
  }) => {
    // 2. Navigate to the projects page and open the command center
    await page.goto('/projects');
    await page.click(`button:has-text("${testProject.name}")`);
    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // 3. Navigate to the Solutions & Skills tab
    await modal.locator('[data-testid="solutions-skills-tab"]').click();

    // 4. Add the solution to the project
    await modal.locator('button:has-text("Add Solution")').click();
    await modal.locator('#solution-select').click();
    await modal.locator(`text=${testSolution.name}`).click();
    await modal.locator('button:has-text("Add Solution")').last().click();

    // Wait for the solution to appear in the list
    await expect(modal.locator(`text=${testSolution.name}`)).toBeVisible();

    // 5. Navigate to the Team Analysis tab
    await modal.locator('[data-testid="allocated-teams-tab"]').click();

    // 6. Verify the team is recommended
    const recommendations = modal.locator(
      '[data-testid="team-recommendations"]'
    );
    await expect(recommendations).toBeVisible();

    const teamCard = recommendations.locator(`:text("${testTeam.name}")`);
    await expect(teamCard).toBeVisible();

    const compatibilityScore = await teamCard
      .locator('[data-testid="compatibility-score"]')
      .textContent();
    expect(parseInt(compatibilityScore || '0')).toBeGreaterThan(90);

    const matchingSkill = teamCard.locator(`:text("${testSkill.name}")`);
    await expect(matchingSkill).toBeVisible();

    console.log(
      '✅ E2E test passed: Team successfully matched to project via solution skill.'
    );
  });
});
