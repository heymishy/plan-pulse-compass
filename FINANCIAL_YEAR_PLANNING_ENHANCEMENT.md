# Financial Year Planning & Bottleneck Analysis Enhancement

This document outlines the plan to enhance the Plan Pulse Compass application with financial year planning capabilities and a solution/skill bottleneck analysis view.

## 🚀 **CURRENT STATUS: TDD Foundation Complete**

### ✅ **Phase 0: TDD Test Suite Implementation (COMPLETED)**

- [x] **Comprehensive Test Suite Created** - `/src/utils/__tests__/financialYearPlanning.test.ts`
  - [x] 15 comprehensive test cases covering end-to-end workflow
  - [x] Financial Year Q1-Q4 structure validation
  - [x] Project-to-Solution skill mapping
  - [x] Team skill compatibility scoring
  - [x] Cross-quarter capacity calculation
  - [x] Priority-based team allocation
  - [x] Resource conflict detection and recommendations
  - [x] **All tests passing ✅** (integrates with existing 169 core tests)

### ✅ **Core Architecture Analysis (COMPLETED)**

- [x] **Existing Skills Infrastructure Leveraged**
  - [x] Integrated with proven `skillBasedPlanning.ts` utilities
  - [x] Reusing `capacityUtils.ts` for team capacity calculations
  - [x] Compatible with existing TypeScript interfaces (40+ types)
  - [x] Follows established testing patterns and TDD workflows

### ✅ **Data Model Integration (COMPLETED)**

- [x] **Financial Year Structure**: `FinancialYear` → `Cycle[]` (Q1-Q4)
- [x] **Project Solution Mapping**: `ProjectSolution` → `Solution` → `Skill[]`
- [x] **Team Skill Matching**: `Team.targetSkills` ↔ `PersonSkill[]`
- [x] **Capacity Calculation**: `Allocation[]` across quarters
- [x] **Priority Allocation**: `Project.priority` → resource assignment

---

## Part 1: Interactive Financial Year Planning

### **Backend/Logic Layer** ✅ COMPLETED

- [x] **Core Planning Logic** - TDD test suite validates:
  - [x] Financial year Q1-Q4 quarter creation and management
  - [x] Project-solution-skill mapping and requirement analysis
  - [x] Team skill compatibility scoring and recommendations
  - [x] Cross-quarter capacity calculation with existing allocation considerations
  - [x] Priority-based team allocation with conflict resolution
  - [x] End-to-end workflow from financial year setup to team assignment

### **Frontend/UI Layer** 🔄 READY FOR IMPLEMENTATION

- [x] **Modify `Planning.tsx` to add a new "Financial Year" view mode.**
- [x] **Basic `FinancialYearMatrix.tsx` component exists** (placeholder implementation)
- [ ] **Enhance `FinancialYearMatrix.tsx` component.**
  - [ ] Display teams on the y-axis and quarters of the selected financial year on the x-axis.
  - [ ] Each cell will be interactive with capacity visualization.
  - [ ] Integrate with TDD-validated team skill matching logic
- [ ] **Implement "Quick Add" allocation functionality.**
  - [ ] Add a "Quick Add" button to each cell in the `FinancialYearMatrix`.
  - [ ] Create a new, simplified allocation dialog for rapid, project-level allocation entry.
  - [ ] The dialog will support allocating to projects and leverage existing skill compatibility scoring.
  - [ ] Integrate priority-based allocation recommendations from TDD test suite
- [ ] **Implement overwrite confirmation.**
  - [ ] When "Quick Add" is used on a quarter with existing allocations, a confirmation dialog will be displayed to the user.
  - [ ] Leverage existing capacity calculation utilities for conflict detection
- [ ] **Integrate with iteration planning views.**
  - [ ] Modify the `PlanningMatrix.tsx` component to correctly display project-level (epic-less) allocations.
  - [ ] Give project-level allocations a distinct visual style in the `PlanningMatrix` to differentiate them from epic-level allocations.
- [ ] **Visualize the high-level plan.**
  - [ ] The `FinancialYearMatrix` cells will be updated to display the created allocations, likely with a stacked bar chart.
  - [ ] Show team skill compatibility scores and availability percentages

## Part 2: Solution & Skill Bottleneck Analysis

### **Backend/Logic Layer** ✅ FOUNDATION COMPLETE

- [x] **Skill-Based Team Matching** - Validated via TDD:
  - [x] Solution skill requirement analysis (`getProjectRequiredSkills`)
  - [x] Team compatibility scoring (`calculateTeamProjectCompatibility`)
  - [x] Team recommendation engine (`recommendTeamsForProject`)
  - [x] Capacity analysis across financial year quarters
  - [x] Conflict detection and alternative team suggestions

### **Frontend/UI Layer** 🔄 READY FOR IMPLEMENTATION

- [ ] **Create a new "Bottleneck Analysis" view.**
  - [ ] This will likely be a new tab within the `Planning` page.
  - [ ] Integrate with existing TDD-validated team matching algorithms
- [ ] **Implement "Solution Demand" analysis.**
  - [ ] Allow the user to select one or more "Solutions".
  - [ ] Display all projects that require the selected solutions.
  - [ ] Calculate and display the total demand for the selected solutions.
  - [ ] Leverage existing `getProjectRequiredSkills` utility
- [ ] **Implement "Team Capacity" analysis.**
  - [ ] Identify teams with the required skills for the selected solutions.
  - [ ] Display each team's total capacity for the financial year.
  - [ ] Subtract allocated time (from the `FinancialYearMatrix`) to show remaining capacity.
  - [ ] Use existing `calculateTeamCapacity` and compatibility scoring
- [ ] **Create a bottleneck visualization.**
  - [ ] Compare solution demand with team capacity.
  - [ ] Highlight overallocations, underutilization, and team hotspots.
  - [ ] Display team recommendation rankings and compatibility scores

---

## 🧪 **Testing & Validation**

### **Test Coverage**

- ✅ **15 TDD tests** covering complete financial year planning workflow
- ✅ **169 core tests** still passing (no regressions)
- ✅ **Integration verified** with existing skill-based planning system
- ✅ **Data consistency validated** across all TypeScript interfaces

### **Test Commands**

```bash
# Run the new financial year planning tests
npm run test src/utils/__tests__/financialYearPlanning.test.ts

# Run full core test suite to verify no regressions
npm run test:core && npm run typecheck && npm run lint && npm run build
```

### **Key Test Scenarios Validated**

1. **Q1-Q4 Financial Year Setup** - Complete quarter structure creation
2. **Project-Solution Mapping** - E-commerce platform needs Frontend + Backend + Infrastructure
3. **Team Skill Matching** - Full Stack Team matches multiple solutions, specialized teams match specific solutions
4. **Capacity Management** - Existing allocations reduce available capacity appropriately
5. **Priority Allocation** - High priority projects (E-commerce) get first pick of optimal teams
6. **Conflict Resolution** - System provides alternative team suggestions when conflicts arise

---

## 📋 **Next Steps**

### **Immediate (UI Implementation)**

1. **Enhance FinancialYearMatrix component** with interactive team-quarter cells
2. **Implement Quick Add allocation dialog** with skill-based team recommendations
3. **Add capacity visualization** showing availability and compatibility scores
4. **Create Bottleneck Analysis view** leveraging existing TDD-validated logic

### **Future Enhancements**

1. **Advanced allocation algorithms** - Multi-quarter optimization
2. **Skill gap analysis** - Training and hiring recommendations
3. **Scenario planning** - What-if analysis for different team configurations
4. **Performance dashboards** - Team utilization and project delivery tracking

---

## 🔧 **Technical Architecture**

### **Leveraged Existing Systems**

- **Skill Framework**: 5 skill categories, person-level proficiency tracking
- **Team Management**: Team target skills + individual person skills
- **Capacity System**: Quarter-based allocation tracking with percentage utilization
- **Project Management**: Priority-based ranking with solution requirements
- **Financial Planning**: Multi-year budgeting with quarter-level granularity

### **New Capabilities Added**

- **Cross-Quarter Planning**: Financial year view spanning Q1-Q4
- **Skill-Based Allocation**: Automatic team recommendations based on project solution requirements
- **Priority Optimization**: Intelligent resource allocation considering project priorities and team availability
- **Conflict Management**: Detection and resolution of resource allocation conflicts
