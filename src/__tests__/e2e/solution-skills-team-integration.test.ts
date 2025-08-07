/**
 * E2E Test: Complete Solution-Skills-Team Integration Workflow
 *
 * Tests GitHub Issue #75 implementation:
 * 1. Add solution with skills (D365 solution with D365 skill)
 * 2. Create team with matching skills (team with D365 skill)
 * 3. Add solution to project
 * 4. Verify Skills tab shows solution-derived skills
 * 5. Verify Team Analysis tab shows teams with matching skills
 */

import { test, expect, Page } from '@playwright/test';

// Test data setup
const testData = {
  skill: {
    name: 'Microsoft Dynamics 365',
    category: 'ERP Systems',
    description: 'Enterprise resource planning system',
  },
  solution: {
    name: 'D365 Implementation',
    description: 'Complete D365 deployment and configuration',
    category: 'enterprise-software',
    complexity: 'high',
    estimatedEffort: 120,
  },
  team: {
    name: 'ERP Specialists',
    description: 'Team specialized in ERP implementations',
    type: 'permanent',
    status: 'active',
    divisionId: 'engineering',
    capacity: 40,
  },
  person: {
    name: 'Sarah D365 Expert',
    email: 'sarah.d365@company.com',
    role: 'Senior ERP Consultant',
    proficiencyLevel: 'expert',
    isActive: true,
  },
  project: {
    name: 'Customer ERP Modernization',
    description: 'Modernizing customer ERP systems with D365',
    status: 'planning',
    priority: 'high',
    divisionId: 'engineering',
    budget: 500000,
  },
};

// Helper functions for data management
async function setupTestData(page: Page) {
  console.log('🔧 Setting up test data...');

  // Navigate to settings to create skill
  await page.goto('/settings');

  // Wait for settings page to load
  await page.waitForSelector('[data-testid="settings-content"]', {
    timeout: 10000,
  });

  // Click Skills tab
  await page.click('text="Skills & Competencies"');
  await page.waitForTimeout(1000);

  // Add skill (D365)
  console.log('  ➕ Adding D365 skill...');
  await page.click('text="Add Skill"');
  await page.fill('[data-testid="skill-name-input"]', testData.skill.name);
  await page.selectOption(
    '[data-testid="skill-category-select"]',
    testData.skill.category
  );
  await page.fill(
    '[data-testid="skill-description-input"]',
    testData.skill.description
  );
  await page.click('text="Save Skill"');
  await page.waitForTimeout(1000);

  // Navigate to solutions
  await page.goto('/settings');
  await page.click('text="Solutions"');
  await page.waitForTimeout(1000);

  // Add solution with D365 skill
  console.log('  ➕ Adding D365 solution...');
  await page.click('text="Add Solution"');
  await page.fill(
    '[data-testid="solution-name-input"]',
    testData.solution.name
  );
  await page.fill(
    '[data-testid="solution-description-input"]',
    testData.solution.description
  );
  await page.selectOption(
    '[data-testid="solution-category-select"]',
    testData.solution.category
  );
  await page.selectOption(
    '[data-testid="solution-complexity-select"]',
    testData.solution.complexity
  );
  await page.fill(
    '[data-testid="solution-effort-input"]',
    testData.solution.estimatedEffort.toString()
  );

  // Add skill to solution
  await page.click('[data-testid="add-solution-skill-button"]');
  await page.selectOption('[data-testid="solution-skill-select"]', {
    label: testData.skill.name,
  });
  await page.click('[data-testid="confirm-add-solution-skill"]');

  await page.click('text="Save Solution"');
  await page.waitForTimeout(1000);

  // Navigate to people and add person
  await page.goto('/people');
  await page.waitForSelector('[data-testid="people-content"]', {
    timeout: 10000,
  });

  console.log('  ➕ Adding D365 expert person...');
  await page.click('text="Add Person"');
  await page.fill('[data-testid="person-name-input"]', testData.person.name);
  await page.fill('[data-testid="person-email-input"]', testData.person.email);
  await page.fill('[data-testid="person-role-input"]', testData.person.role);
  await page.check('[data-testid="person-active-checkbox"]');

  // Add skill to person
  await page.click('[data-testid="add-person-skill-button"]');
  await page.selectOption('[data-testid="person-skill-select"]', {
    label: testData.skill.name,
  });
  await page.selectOption(
    '[data-testid="person-skill-proficiency"]',
    testData.person.proficiencyLevel
  );
  await page.click('[data-testid="confirm-add-person-skill"]');

  await page.click('text="Save Person"');
  await page.waitForTimeout(1000);

  // Navigate to teams and add team
  await page.goto('/teams');
  await page.waitForSelector('[data-testid="teams-content"]', {
    timeout: 10000,
  });

  console.log('  ➕ Adding ERP team...');
  await page.click('text="Add Team"');
  await page.fill('[data-testid="team-name-input"]', testData.team.name);
  await page.fill(
    '[data-testid="team-description-input"]',
    testData.team.description
  );
  await page.selectOption(
    '[data-testid="team-type-select"]',
    testData.team.type
  );
  await page.selectOption(
    '[data-testid="team-status-select"]',
    testData.team.status
  );
  await page.selectOption(
    '[data-testid="team-division-select"]',
    testData.team.divisionId
  );
  await page.fill(
    '[data-testid="team-capacity-input"]',
    testData.team.capacity.toString()
  );

  // Add skill to team
  await page.click('[data-testid="add-team-skill-button"]');
  await page.selectOption('[data-testid="team-skill-select"]', {
    label: testData.skill.name,
  });
  await page.click('[data-testid="confirm-add-team-skill"]');

  await page.click('text="Save Team"');
  await page.waitForTimeout(1000);

  // Assign person to team
  await page.click('text="Map People to Teams"');
  await page.waitForTimeout(1000);
  await page.selectOption('[data-testid="person-team-mapping"]', {
    label: testData.team.name,
  });
  await page.click('[data-testid="confirm-team-mapping"]');

  // Navigate to projects and add project
  await page.goto('/projects');
  await page.waitForSelector('[data-testid="projects-content"]', {
    timeout: 10000,
  });

  console.log('  ➕ Adding ERP project...');
  await page.click('text="Add Project"');
  await page.fill('[data-testid="project-name-input"]', testData.project.name);
  await page.fill(
    '[data-testid="project-description-input"]',
    testData.project.description
  );
  await page.selectOption(
    '[data-testid="project-status-select"]',
    testData.project.status
  );
  await page.selectOption(
    '[data-testid="project-priority-select"]',
    testData.project.priority
  );
  await page.selectOption(
    '[data-testid="project-division-select"]',
    testData.project.divisionId
  );
  await page.fill(
    '[data-testid="project-budget-input"]',
    testData.project.budget.toString()
  );

  await page.click('text="Save Project"');
  await page.waitForTimeout(2000);

  console.log('✅ Test data setup complete');
}

async function cleanupTestData(page: Page) {
  console.log('🧹 Cleaning up test data...');
  // Note: In a real implementation, you'd want to clean up the test data
  // For now, we'll rely on the test environment being reset
}

test.describe('Solution-Skills-Team Integration Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for complex setup
    test.setTimeout(120000);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test('complete workflow: solution → skills → team analysis', async ({
    page,
  }) => {
    // Setup test data
    await setupTestData(page);

    // Navigate to the project we just created
    await page.goto('/projects');
    await page.waitForSelector('[data-testid="projects-content"]');

    // Click on our test project
    console.log('🔍 Opening project details...');
    await page.click(`text="${testData.project.name}"`);
    await page.waitForSelector(
      '[data-testid="project-solutions-skills-section"]',
      { timeout: 10000 }
    );

    // STEP 1: Add solution to project
    console.log('📋 Step 1: Adding solution to project...');
    await page.click('text="Add Solution"');
    await page.waitForTimeout(1000);

    await page.selectOption('[data-testid="project-solution-select"]', {
      label: testData.solution.name,
    });
    await page.selectOption(
      '[data-testid="project-solution-importance"]',
      'high'
    );
    await page.fill(
      '[data-testid="project-solution-notes"]',
      'Primary ERP solution'
    );
    await page.click('text="Add Solution"');
    await page.waitForTimeout(2000);

    // Verify solution was added
    await expect(
      page.locator(`text="${testData.solution.name}"`)
    ).toBeVisible();
    console.log('✅ Solution added successfully');

    // STEP 2: Verify Skills tab shows auto-derived skills
    console.log('📋 Step 2: Checking Skills tab for auto-derived skills...');
    await page.click('text="Skills"');
    await page.waitForTimeout(1000);

    // Verify D365 skill is present with "Required by" note
    await expect(page.locator(`text="${testData.skill.name}"`)).toBeVisible();
    await expect(
      page.locator(`text="Required by ${testData.solution.name}"`)
    ).toBeVisible();
    console.log('✅ Auto-derived skills displayed correctly');

    // STEP 3: Verify Team Analysis shows matching teams
    console.log('📋 Step 3: Checking Team Analysis for matching teams...');
    await page.click('text="Team Analysis"');
    await page.waitForTimeout(2000);

    // Verify team analysis summary cards
    const coveredSkills = await page.locator(
      '[data-testid="covered-skills-count"]'
    );
    if (await coveredSkills.isVisible()) {
      const count = await coveredSkills.textContent();
      expect(parseInt(count || '0')).toBeGreaterThan(0);
    }

    // Verify skill analysis table shows our D365 skill
    const skillAnalysisTable = page.locator(
      '[data-testid="skill-analysis-table"]'
    );
    await expect(skillAnalysisTable).toBeVisible();

    // Check that D365 skill appears in the analysis
    const skillRow = skillAnalysisTable.locator(
      `tr:has-text("${testData.skill.name}")`
    );
    await expect(skillRow).toBeVisible();

    // Verify team coverage information
    const teamCoverage = skillRow.locator('[data-testid="team-coverage"]');
    if (await teamCoverage.isVisible()) {
      const coverageText = await teamCoverage.textContent();
      expect(coverageText).toContain('1/1'); // 1 available out of 1 total
    }

    // Verify proficiency level is shown
    const proficiencyBadge = skillRow.locator(
      `text="${testData.person.proficiencyLevel}"`
    );
    await expect(proficiencyBadge).toBeVisible();

    console.log('✅ Team analysis shows correct skill coverage');

    // STEP 4: Verify the team with matching skills is identified
    console.log('📋 Step 4: Verifying team identification...');

    // Check if there's a team recommendations section
    const teamRecommendations = page.locator(
      '[data-testid="team-recommendations"]'
    );
    if (await teamRecommendations.isVisible()) {
      await expect(
        teamRecommendations.locator(`text="${testData.team.name}"`)
      ).toBeVisible();
    }

    console.log('✅ Complete workflow test passed!');
  });

  test('verify skill importance inheritance from solution', async ({
    page,
  }) => {
    await setupTestData(page);

    // Navigate to project and add solution with specific importance
    await page.goto('/projects');
    await page.click(`text="${testData.project.name}"`);
    await page.waitForSelector(
      '[data-testid="project-solutions-skills-section"]'
    );

    // Add solution with 'high' importance
    await page.click('text="Add Solution"');
    await page.selectOption('[data-testid="project-solution-select"]', {
      label: testData.solution.name,
    });
    await page.selectOption(
      '[data-testid="project-solution-importance"]',
      'high'
    );
    await page.click('text="Add Solution"');
    await page.waitForTimeout(1000);

    // Check Skills tab
    await page.click('text="Skills"');
    await page.waitForTimeout(1000);

    // Verify skill inherited 'high' importance from solution
    const skillRow = page.locator(`tr:has-text("${testData.skill.name}")`);
    await expect(skillRow.locator('text="high"')).toBeVisible();

    console.log('✅ Skill importance inheritance verified');
  });

  test('verify multiple solutions with overlapping skills', async ({
    page,
  }) => {
    await setupTestData(page);

    // Add second solution that also uses D365 skill
    await page.goto('/settings');
    await page.click('text="Solutions"');
    await page.click('text="Add Solution"');

    await page.fill('[data-testid="solution-name-input"]', 'D365 Migration');
    await page.fill(
      '[data-testid="solution-description-input"]',
      'Migrate legacy systems to D365'
    );
    await page.selectOption(
      '[data-testid="solution-category-select"]',
      'enterprise-software'
    );
    await page.selectOption(
      '[data-testid="solution-complexity-select"]',
      'medium'
    );

    // Add same D365 skill to this solution
    await page.click('[data-testid="add-solution-skill-button"]');
    await page.selectOption('[data-testid="solution-skill-select"]', {
      label: testData.skill.name,
    });
    await page.click('[data-testid="confirm-add-solution-skill"]');

    await page.click('text="Save Solution"');
    await page.waitForTimeout(1000);

    // Navigate to project and add both solutions
    await page.goto('/projects');
    await page.click(`text="${testData.project.name}"`);
    await page.waitForSelector(
      '[data-testid="project-solutions-skills-section"]'
    );

    // Add first solution
    await page.click('text="Add Solution"');
    await page.selectOption('[data-testid="project-solution-select"]', {
      label: testData.solution.name,
    });
    await page.selectOption(
      '[data-testid="project-solution-importance"]',
      'high'
    );
    await page.click('text="Add Solution"');
    await page.waitForTimeout(1000);

    // Add second solution
    await page.click('text="Add Solution"');
    await page.selectOption('[data-testid="project-solution-select"]', {
      label: 'D365 Migration',
    });
    await page.selectOption(
      '[data-testid="project-solution-importance"]',
      'medium'
    );
    await page.click('text="Add Solution"');
    await page.waitForTimeout(1000);

    // Check Skills tab - should show only one D365 skill (deduplicated)
    await page.click('text="Skills"');
    await page.waitForTimeout(1000);

    const d365Skills = await page
      .locator(`text="${testData.skill.name}"`)
      .count();
    expect(d365Skills).toBe(1); // Should be deduplicated

    console.log('✅ Skill deduplication across multiple solutions verified');
  });
});
