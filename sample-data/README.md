# Sample Data Files

This directory contains all the **actively used** sample data files for the Plan Pulse Compass application. These files are consistently formatted and have verified team name consistency across e2e tests.

## Core Sample Files

### 1. **teams-divisions-sample.csv**

- **Purpose**: Defines organizational structure with teams and divisions
- **Teams**: 35 teams across 4 divisions
- **Key Teams**: Frontend Team, Backend Team, Platform Team, Data Team, QA Team, Design Team (used in allocation data)
- **Each team**: 320h capacity to support 6-8 people per team

### 2. **enhanced-people-sample.csv**

- **Purpose**: Comprehensive people data with skills, roles, and certifications
- **People**: 80 people across 16 teams (6-8 people per team)
- **Data**: Full employee profiles with skills, salaries, roles, experience
- **Team Distribution**: All major teams have proper role distribution

### 3. **planning-allocations-sample.csv**

- **Purpose**: Primary allocation data for planning functionality
- **Teams Used**: Frontend Team, Backend Team, Platform Team, Data Team, QA Team, Design Team
- **Data**: 143 allocation records across Q4 2024 iterations
- **Format**: Team, Quarter, Iteration, Epic, Project, Percentage, Notes

### 4. **projects-enhanced-sample.csv**

- **Purpose**: Project definitions with budgets, dates, and status
- **Projects**: 10 banking projects (Digital Lending, Mobile Banking, etc.)
- **Data**: Name, description, status, dates, budgets

### 5. **epics-enhanced-sample.csv**

- **Purpose**: Epic/work item definitions linked to projects
- **Epics**: Work breakdown structure for projects
- **Data**: Epic names, project associations, effort estimates

### 6. **roles-enhanced-sample.csv**

- **Purpose**: Role definitions with salary bands and responsibilities
- **Roles**: Product Owner, Software Engineer, Quality Engineer, Platform Engineer, etc.
- **Data**: Role descriptions, salary ranges, responsibilities

## Team Name Consistency

All files use consistent team naming that matches:

- ✅ E2E test data in `tests/e2e/people-import.spec.ts`
- ✅ E2E test data in `tests/e2e/allocations-import.spec.ts`
- ✅ Application import functionality
- ✅ Planning allocation workflows

## Usage

These files can be imported through:

1. **Settings > Import/Export** - Enhanced Import & Export section
2. **E2E Tests** - Automated testing with consistent data
3. **Manual Testing** - Load realistic sample data for development

## File Relationships

```
Teams & Divisions (teams-divisions-sample.csv)
    ↓
People (enhanced-people-sample.csv)
    ↓
Roles (roles-enhanced-sample.csv)
    ↓
Projects (projects-enhanced-sample.csv)
    ↓
Epics (epics-enhanced-sample.csv)
    ↓
Allocations (planning-allocations-sample.csv)
```

## Archived Files

Unused, duplicate, and inconsistent files have been moved to `archive/sample-data/` directory.

## Data Scale

- **Teams**: 35 teams (6 core + 29 banking-specific)
- **People**: 80 people (5-8 per team)
- **Projects**: 10 projects
- **Epics**: Multiple epics per project
- **Allocations**: 143 allocation records
- **Realistic**: Banking/financial services domain data
