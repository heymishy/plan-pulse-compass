# Sample Data Documentation

This document describes the comprehensive sample data available for the Plan Pulse Compass application, including how to use it for development, testing, and CI/CD.

## Overview

The application includes a comprehensive sample dataset with **50 teams across 4 divisions** for a banking/financial services organization. Each team has between 7-10 people with realistic role distributions.

## Data Structure

### Divisions (4 total)

1. **Consumer Lending** - Personal loans, mortgages, and consumer credit products
2. **Business Lending** - Commercial loans, business credit, and corporate financing
3. **Cards & Payments** - Credit cards, debit cards, and payment processing
4. **Everyday Banking** - Retail banking, digital banking, and customer experience

### Teams (50 total)

- **Consumer Lending**: 12 teams (e.g., Mortgage Origination, Personal Loans Platform, Credit Assessment Engine)
- **Business Lending**: 15 teams (e.g., Commercial Lending Platform, Business Credit Assessment, Corporate Finance Solutions)
- **Cards & Payments**: 10 teams (e.g., Credit Card Platform, Payment Processing Engine, Digital Wallet Solutions)
- **Everyday Banking**: 13 teams (e.g., Digital Banking Platform, Mobile Banking App, Customer Onboarding)

### Roles (4 types)

1. **Product Owner** - Product strategy and backlog management
2. **Software Engineer** - Full-stack development and software delivery
3. **Quality Engineer** - Testing, automation, and quality assurance
4. **Platform Engineer** - Infrastructure, DevOps, and platform services

### Team Composition

Each team follows this structure:

- 1 Product Owner (required)
- 50% Software Engineers
- 30% Quality Engineers
- 20% Platform Engineers

Team sizes vary between 7-10 people per team.

## Files and Locations

### Core Sample Data

- **`src/data/sampleData.ts`** - Complete sample dataset with 50 teams
- **`src/utils/dataLoader.ts`** - Data loading utilities and validation
- **`src/components/settings/DataInitialization.tsx`** - UI component for loading sample data

### Test Data

- **`src/test/data/testData.ts`** - Smaller, consistent test dataset (4 teams, 16 people)
- **`src/test/utils/testDataLoader.ts`** - Test data loading utilities for CI

## Usage

### 1. Loading Sample Data in the Application

#### Via UI Component

1. Navigate to Settings → Data Initialization
2. Click "Load Full Sample Data" to load all 50 teams
3. Or click "Load Test Data" for a smaller subset

#### Via Code

```typescript
import { loadSampleData } from '@/utils/dataLoader';

// Load complete sample data
const data = loadSampleData({
  loadSampleData: true,
  includeSkills: true,
  includeSolutions: true,
  includeCycles: true,
  includeRunWorkCategories: true,
});

// Apply to context
setDivisions(data.divisions);
setTeams(data.teams);
setPeople(data.people);
setRoles(data.roles);
// ... etc
```

### 2. Using Test Data in CI/Unit Tests

#### Basic Test Data

```typescript
import { loadMinimalTestData } from '@/test/utils/testDataLoader';

const testData = loadMinimalTestData();
// Contains: 2 divisions, 4 teams, 0 people, 4 roles
```

#### People-Focused Test Data

```typescript
import { loadPeopleTestData } from '@/test/utils/testDataLoader';

const testData = loadPeopleTestData();
// Contains: 2 divisions, 4 teams, 16 people, 4 roles, skills, person skills
```

#### Full Test Data

```typescript
import { loadFullTestData } from '@/test/utils/testDataLoader';

const testData = loadFullTestData();
// Contains: Complete test dataset with all entities
```

#### Test Fixtures

```typescript
import { createTestFixture } from '@/test/utils/testDataLoader';

const testData = createTestFixture('people'); // 'minimal' | 'people' | 'full'
```

### 3. Data Validation

#### Validate Sample Data

```typescript
import { validateLoadedData } from '@/utils/dataLoader';

const validation = validateLoadedData(data);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
```

#### Validate Test Data

```typescript
import { validateTestData } from '@/test/utils/testDataLoader';

const validation = validateTestData(testData);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
```

### 4. Helper Functions

#### Sample Data Helpers

```typescript
import {
  getTeamById,
  getDivisionById,
  getPeopleByTeamId,
  getTeamsByDivisionId,
  getRoleById,
} from '@/data/sampleData';

const team = getTeamById('team-001');
const division = getDivisionById('div-001');
const teamPeople = getPeopleByTeamId('team-001');
const divisionTeams = getTeamsByDivisionId('div-001');
const role = getRoleById('role-po');
```

#### Test Data Helpers

```typescript
import {
  getTestTeamById,
  getTestDivisionById,
  getTestPeopleByTeamId,
  getTestTeamsByDivisionId,
  getTestRoleById,
} from '@/test/data/testData';

const team = getTestTeamById('team-test-001');
const division = getTestDivisionById('div-test-001');
const teamPeople = getTestPeopleByTeamId('team-test-001');
const divisionTeams = getTestTeamsByDivisionId('div-test-001');
const role = getTestRoleById('role-test-po');
```

## Data Summary

### Full Sample Data

- **Divisions**: 4
- **Teams**: 50
- **People**: ~400-500 (varies due to random team sizes)
- **Roles**: 4
- **Skills**: 25+ (programming languages, frameworks, platforms, domain knowledge)
- **Solutions**: 5+ (architecture patterns, framework stacks, methodologies)

### Test Data

- **Divisions**: 2
- **Teams**: 4
- **People**: 16
- **Roles**: 4
- **Skills**: 5
- **Solutions**: 2

## Team Names by Division

### Consumer Lending (12 teams)

1. Mortgage Origination
2. Personal Loans Platform
3. Credit Assessment Engine
4. Loan Servicing
5. Collections & Recovery
6. Mortgage Underwriting
7. Consumer Risk Analytics
8. Loan Origination Platform
9. Mortgage Processing
10. Consumer Compliance
11. Loan Pricing Engine
12. Mortgage Analytics

### Business Lending (15 teams)

1. Commercial Lending Platform
2. Business Credit Assessment
3. Corporate Finance Solutions
4. SME Banking Platform
5. Trade Finance
6. Business Risk Management
7. Commercial Underwriting
8. Business Analytics Platform
9. Corporate Banking Solutions
10. Business Compliance
11. Commercial Pricing Engine
12. Business Loan Servicing
13. Supply Chain Finance
14. Business Collections
15. Commercial Analytics

### Cards & Payments (10 teams)

1. Credit Card Platform
2. Payment Processing Engine
3. Digital Wallet Solutions
4. Card Fraud Detection
5. Payment Analytics
6. Card Issuing Platform
7. Merchant Services
8. Payment Compliance
9. Card Rewards Platform
10. Payment Security

### Everyday Banking (13 teams)

1. Digital Banking Platform
2. Mobile Banking App
3. Customer Onboarding
4. Account Management
5. Customer Service Platform
6. Branch Technology
7. ATM & Self-Service
8. Customer Analytics
9. Digital Identity
10. Retail Banking Platform
11. Customer Experience
12. Banking Operations
13. Retail Compliance

## Skills Included

### Programming Languages

- JavaScript/TypeScript
- Java
- Python
- SQL
- C#

### Frameworks

- React
- Spring Boot
- Node.js
- Angular

### Platforms

- AWS
- Azure
- Kubernetes
- Docker

### Domain Knowledge

- Lending & Credit
- Payments Processing
- Banking Compliance
- Fraud Detection

### Methodologies

- Agile/Scrum
- DevOps
- TDD/BDD

### Tools

- Git
- Jenkins
- Jira

## Solutions Included

1. **Microservices Architecture** - Distributed microservices for scalable banking applications
2. **React Single Page Application** - Modern React-based frontend
3. **Cloud-Native Platform** - AWS/Azure cloud-native banking platform
4. **DevOps CI/CD Pipeline** - Automated deployment and testing pipeline
5. **API Gateway Pattern** - Centralized API management and security

## CI/CD Integration

The sample data is designed to work seamlessly with the CI/CD pipeline:

1. **Unit Tests**: Use `loadMinimalTestData()` for fast unit tests
2. **Integration Tests**: Use `loadPeopleTestData()` for integration scenarios
3. **E2E Tests**: Use `loadFullTestData()` for comprehensive testing
4. **Data Validation**: All data is validated before use in tests

## Best Practices

1. **Use Test Data for CI**: Always use the test data files for automated testing
2. **Validate Data**: Always validate data before using it in production scenarios
3. **Consistent IDs**: Test data uses predictable IDs (e.g., `team-test-001`)
4. **Realistic Scenarios**: Sample data represents realistic banking team structures
5. **Extensible**: Easy to extend with additional teams, skills, or solutions

## Future Enhancements

The sample data structure is designed to be easily extensible:

- Add more divisions (e.g., Investment Banking, Wealth Management)
- Include more specialized roles (e.g., Data Scientist, UX Designer)
- Add more domain-specific skills
- Include project templates and common epics
- Add historical data for trend analysis

## Support

For questions about the sample data or help extending it, refer to:

- The data files themselves for structure examples
- The test files for usage patterns
- The validation functions for data integrity checks
