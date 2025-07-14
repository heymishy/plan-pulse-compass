# CRITICAL ARCHITECTURAL ISSUE: Squad vs Team Entity Duplication

## 🚨 Problem Summary

The recently merged "advanced people to squad mapping" feature **incorrectly implemented a separate Squad entity** when it should have enhanced the existing **Team entity**. This violates the PRD specification and creates significant architectural duplication that needs immediate resolution.

## 📋 PRD Specification Violation

The PRD **clearly defines Teams as the core organizational entity**:

- **Line 52**: "Hierarchical Team Organization: Multi-level team structure"
- **Line 69**: "Team: id, name, divisionId, capacity, productOwnerId, skills summary"
- **Line 427**: "People Management: People → Roles → **Teams** → Divisions"
- **Line 437**: "One-to-Many: Division → **Teams** → People"

**❌ No mention of "Squad" exists anywhere in the PRD specification.**

## 🔍 Duplication Analysis

### Data Structure Overlap

| Feature                   | Team        | Squad        | Duplication Level      |
| ------------------------- | ----------- | ------------ | ---------------------- |
| Basic identity (id, name) | ✅          | ✅           | **100% Overlap**       |
| Capacity tracking         | ✅ (hours)  | ✅ (people)  | **Conceptual Overlap** |
| Division association      | ✅          | ✅           | **100% Overlap**       |
| People assignment         | ✅ (simple) | ✅ (complex) | **Conceptual Overlap** |

### Component Duplication

- `TeamDialog.tsx` ↔ `SquadBuilder.tsx` (CRUD operations)
- `TeamTable.tsx` ↔ `SquadManagement.tsx` (List views)
- `TeamCards.tsx` ↔ `SquadCanvas.tsx` (Visual displays)
- `EnterpriseTeamAnalytics.tsx` ↔ `SquadSkillsAnalyzer.tsx` (Analytics)

### Navigation Duplication

- `/teams` route ↔ `/squad-management` route
- Teams page (8 tabs) ↔ Squad Management page (6 tabs)

## 🎯 Consolidation Plan

### Phase 1: Enhance Team Entity (High Priority - 6 hours)

**1.1 Extend Team Interface** (`src/types/index.ts`)

```typescript
export interface Team {
  id: string;
  name: string;
  description?: string;
  type: 'permanent' | 'project' | 'initiative' | 'workstream' | 'feature-team';
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  divisionId?: string;
  divisionName?: string;
  productOwnerId?: string;
  capacity: number; // weekly capacity in hours
  targetSkills: string[]; // Required skill IDs
  projectIds?: string[]; // Associated projects
  duration?: { start: string; end: string };
  createdDate: string;
  lastModified: string;
}
```

**1.2 Create TeamMember Join Table**

```typescript
export interface TeamMember {
  id: string;
  teamId: string;
  personId: string;
  role: 'lead' | 'member' | 'advisor' | 'consultant' | 'product-owner';
  allocation: number; // percentage (0-100)
  startDate: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
}
```

### Phase 2: Context Integration (High Priority - 4 hours)

**2.1 Update AppContext** (`src/context/AppContext.tsx`)

- Extend team CRUD operations with Squad functionality
- Add `getTeamMembers`, `addTeamMember`, `removeTeamMember`
- Add skills analysis functions for teams
- Migrate squad-specific methods to team equivalents

**2.2 Data Migration**

- Create migration utility to convert existing Squad data to enhanced Team format
- Map SquadMember records to TeamMember records

### Phase 3: Component Consolidation (High Priority - 10 hours)

**3.1 Enhance Existing Team Components**

- Upgrade `TeamDialog.tsx` with Squad Builder advanced features
- Add visual canvas mode to Team management
- Integrate skills analysis into Team components
- Add import/export capabilities to Team management

**3.2 Component Migration Map**

```
SquadBuilder.tsx → Enhance TeamDialog.tsx
SquadCanvas.tsx → Add canvas mode to TeamCards.tsx
SquadSkillsAnalyzer.tsx → Integrate into EnterpriseTeamAnalytics.tsx
SquadImportSystem.tsx → Add to Teams.tsx as new tab
UnmappedPeople.tsx → Integrate into Teams.tsx people management
```

### Phase 4: Navigation & Page Updates (Medium Priority - 4 hours)

**4.1 Consolidate Pages**

- Remove `/squad-management` route
- Enhance `/teams` page with Squad Management features
- Add tabs for: Canvas View, Skills Analysis, Import/Export, People Mapping

**4.2 Updated Teams Page Structure**

```
Teams.tsx tabs:
1. Overview (existing)
2. Team Builder (enhanced TeamDialog features)
3. Canvas View (from SquadCanvas)
4. Skills Analysis (from SquadSkillsAnalyzer)
5. People Mapping (from UnmappedPeople)
6. Import/Export (from SquadImportSystem)
7. Analytics (existing)
8. Settings (existing)
```

### Phase 5: Cleanup & Testing (Medium Priority - 6 hours)

**5.1 Remove Squad Code**

- Delete all `src/components/squad/` files
- Remove `src/pages/SquadManagement.tsx`
- Remove Squad types from `src/types/index.ts`
- Remove Squad-related tests

**5.2 Update Tests**

- Migrate valuable Squad tests to Team tests
- Update test files to use enhanced Team entity

## 📊 Implementation Priority Matrix

| Component              | Priority | Effort  | Dependencies |
| ---------------------- | -------- | ------- | ------------ |
| Type definitions       | **High** | 2 hours | None         |
| AppContext updates     | **High** | 4 hours | Types        |
| TeamDialog enhancement | **High** | 6 hours | Context      |
| Page consolidation     | **High** | 4 hours | Components   |
| Component migration    | Medium   | 8 hours | All above    |
| Testing updates        | Medium   | 4 hours | Components   |
| Code cleanup           | Medium   | 2 hours | All above    |

**Total Effort Estimate: 30 hours**

## 🎯 Migration Strategy

**Recommended: Big Bang Migration**

- Complete migration in single PR
- Minimizes ongoing confusion
- Cleaner git history
- Preserves all Squad functionality within Team framework

## 💼 Business Impact

**Benefits of Consolidation:**

- ✅ **Eliminates architectural confusion**
- ✅ **Reduces maintenance overhead** by 50%
- ✅ **Aligns with PRD specification**
- ✅ **Consolidates user experience** under single Teams concept
- ✅ **Preserves all Squad functionality** within Team framework
- ✅ **Simplifies navigation** and reduces cognitive load

**Risks:**

- ⚠️ **Development time investment** (~30 hours)
- ⚠️ **Potential introduction of bugs** during migration
- ⚠️ **User retraining** for consolidated interface

## 🚀 Immediate Next Steps

1. **Create enhanced Team types** (2 hours)
2. **Update AppContext with Team enhancements** (4 hours)
3. **Enhance TeamDialog with Squad Builder features** (6 hours)
4. **Test enhanced Team functionality** (2 hours)
5. **Plan component migration sequence** (1 hour)

## 🎯 Acceptance Criteria

- [ ] All Squad functionality integrated into Team entity
- [ ] Single `/teams` route with enhanced capabilities
- [ ] All Squad components removed from codebase
- [ ] Enhanced Team types support all Squad features
- [ ] TeamMember join table enables complex relationships
- [ ] All existing Team functionality preserved
- [ ] All tests updated and passing
- [ ] Navigation simplified to single Teams entry
- [ ] Data migration utility created and tested
- [ ] Documentation updated to reflect new architecture

## ⚡ Priority

**CRITICAL** - This architectural duplication will compound technical debt over time. The 30-hour investment will prevent significantly larger problems in the future and align the codebase with the PRD specification.

---

**Recommendation:** Proceed with immediate consolidation to restore architectural integrity and align with the original product vision.

## 📝 Issue Creation Instructions

To create this issue on GitHub:

1. Go to https://github.com/heymishy/plan-pulse-compass/issues/new
2. **Title**: `CRITICAL: Consolidate Squad entity into Team entity to eliminate architectural duplication`
3. **Labels**: `critical`, `architecture`, `refactor`, `technical-debt`
4. **Assignees**: Assign to yourself or relevant team members
5. **Copy and paste** the content above into the issue description
