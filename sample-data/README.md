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
- **Projects**: 20 projects matching allocation data (Digital Mortgage Platform, Payment Integration Platform, etc.)
- **Data**: Name, description, status, dates, budgets, domains, priorities
- **Consistency**: All projects referenced in planning-allocations-sample.csv are included

### 5. **epics-enhanced-sample.csv**

- **Purpose**: Epic/work item definitions linked to projects
- **Epics**: 30 epics with project associations and team assignments
- **Data**: Epic names, project linkage, effort estimates, team assignments, dates
- **Consistency**: All epics referenced in planning-allocations-sample.csv are included

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
- **Projects**: 20 projects with full consistency
- **Epics**: 30 epics linked to projects and teams
- **Allocations**: 143 allocation records
- **Realistic**: Banking/financial services domain data

## Project/Epic Consistency Verification

✅ **All project names** in planning-allocations-sample.csv exist in projects-enhanced-sample.csv
✅ **All epic names** in planning-allocations-sample.csv exist in epics-enhanced-sample.csv  
✅ **E2E test data** uses consistent project and epic names
✅ **Team assignments** in epics match team structure
