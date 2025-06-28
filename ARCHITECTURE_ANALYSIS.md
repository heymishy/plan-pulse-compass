# Plan Pulse Compass - Architecture Analysis & Core Flows

## Executive Summary

Plan Pulse Compass is a comprehensive team planning and resource management application designed for organizations managing complex project portfolios, team allocations, and financial tracking. The application provides a unified platform for strategic planning, execution tracking, and financial analysis across multiple teams, projects, and time horizons.

## System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React App] --> B[App Context]
        B --> C[Theme Context]
        A --> D[Pages]
        A --> E[Components]
        A --> F[UI Components]
    end

    subgraph "Business Logic Layer"
        G[Financial Calculations] --> H[Planning Engine]
        H --> I[Tracking System]
        I --> J[Scenario Analysis]
        J --> K[Budget Optimization]
    end

    subgraph "Data Layer"
        L[Encrypted Storage] --> M[Local Storage]
        M --> N[Data Loader]
        N --> O[CSV Import/Export]
    end

    subgraph "Visualization Layer"
        P[Canvas Views] --> Q[React Flow]
        Q --> R[Charts & Reports]
    end

    B --> G
    D --> H
    E --> I
    F --> P
    G --> L
    H --> M
    I --> N
    P --> O
```

## Core Data Model & Relationships

```mermaid
erDiagram
    Division ||--o{ Team : contains
    Team ||--o{ Person : employs
    Team ||--o{ Allocation : has
    Person ||--o{ PersonSkill : has
    Person ||--|| Role : assigned
    Project ||--o{ Epic : contains
    Project ||--o{ Milestone : has
    Project ||--o{ ProjectSkill : requires
    Project ||--o{ ProjectSolution : uses
    Epic ||--o{ Allocation : allocated
    Cycle ||--o{ Allocation : contains
    Skill ||--o{ PersonSkill : possessed_by
    Skill ||--o{ ProjectSkill : required_by
    Solution ||--o{ ProjectSolution : used_by
    Solution ||--o{ Skill : requires
    RunWorkCategory ||--o{ Allocation : categorized_as
    ActualAllocation ||--o{ IterationReview : tracked_in

    Division {
        string id PK
        string name
        string description
        string productOwnerId
        number budget
    }

    Team {
        string id PK
        string name
        string divisionId FK
        string productOwnerId FK
        number capacity
    }

    Person {
        string id PK
        string name
        string email
        string roleId FK
        string teamId FK
        boolean isActive
        string employmentType
        number annualSalary
        object contractDetails
        string startDate
        string endDate
    }

    Role {
        string id PK
        string name
        string rateType
        number defaultRate
        number defaultAnnualSalary
        number defaultHourlyRate
        number defaultDailyRate
    }

    Project {
        string id PK
        string name
        string description
        string status
        string startDate
        string endDate
        number budget
        number ranking
    }

    Epic {
        string id PK
        string projectId FK
        string name
        string description
        number estimatedEffort
        string status
        string assignedTeamId FK
        string startDate
        string targetEndDate
        string actualEndDate
    }

    Allocation {
        string id PK
        string teamId FK
        string cycleId FK
        number iterationNumber
        string epicId FK
        string runWorkCategoryId FK
        number percentage
        string notes
    }

    Cycle {
        string id PK
        string type
        string name
        string startDate
        string endDate
        string parentCycleId FK
        string status
    }

    Skill {
        string id PK
        string name
        string category
        string description
        string createdDate
    }

    Solution {
        string id PK
        string name
        string description
        string category
        string[] skillIds
        string createdDate
    }
```

## Core Business Flows

### 1. Financial Calculation Flow

```mermaid
flowchart TD
    A[Person Data] --> B{Employment Type?}
    B -->|Permanent| C[Check Individual Salary]
    B -->|Contractor| D[Check Contract Rates]

    C --> E{Individual Salary?}
    E -->|Yes| F[Use Individual Salary]
    E -->|No| G[Check Role Default Annual]
    G -->|Yes| H[Use Role Default Annual]
    G -->|No| I[Use Legacy Fallback]

    D --> J{Individual Rates?}
    J -->|Hourly| K[Use Individual Hourly]
    J -->|Daily| L[Use Individual Daily]
    J -->|No| M[Check Role Defaults]
    M -->|Hourly| N[Use Role Default Hourly]
    M -->|Daily| O[Use Role Default Daily]
    M -->|No| P[Use Legacy Fallback]

    F --> Q[Calculate Hourly Rate]
    H --> Q
    I --> Q
    K --> Q
    L --> Q
    N --> Q
    O --> Q
    P --> Q

    Q --> R[Calculate Daily Cost]
    Q --> S[Calculate Weekly Cost]
    Q --> T[Calculate Monthly Cost]
    Q --> U[Calculate Annual Cost]

    R --> V[Person Cost Calculation]
    S --> V
    T --> V
    U --> V

    V --> W[Project Cost Calculation]
    V --> X[Team Cost Analysis]
    V --> Y[Budget Impact Analysis]
```

### 2. Planning & Allocation Flow

```mermaid
flowchart TD
    A[Project Planning] --> B[Epic Breakdown]
    B --> C[Skill Requirements Analysis]
    C --> D[Team Availability Check]
    D --> E[Capacity Planning]
    E --> F[Allocation Matrix Creation]

    F --> G{Capacity Available?}
    G -->|Yes| H[Create Allocations]
    G -->|No| I[Optimization Required]

    I --> J[Scenario Analysis]
    J --> K[Budget Impact Assessment]
    K --> L[Risk Assessment]
    L --> M[Feasibility Score Calculation]

    M --> N{Feasible?}
    N -->|Yes| O[Proceed with Planning]
    N -->|No| P[Adjust Scope/Timeline]

    O --> Q[Iteration Planning]
    P --> Q
    H --> Q

    Q --> R[Allocation Validation]
    R --> S[Conflict Detection]
    S --> T[Final Allocation Matrix]

    T --> U[Progress Tracking Setup]
    U --> V[Monitoring & Reporting]
```

### 3. Progress Tracking & Variance Analysis Flow

```mermaid
flowchart TD
    A[Import Actual Data] --> B[Data Validation]
    B --> C[Match with Planned Allocations]
    C --> D[Calculate Variances]

    D --> E{Variance Detected?}
    E -->|No| F[Update Progress]
    E -->|Yes| G[Variance Analysis]

    G --> H[Calculate Variance Percentage]
    H --> I[Determine Variance Type]
    I --> J[Assess Impact Level]

    J --> K[Record Variance Reason]
    K --> L[Update Iteration Review]

    L --> M[Generate Variance Report]
    M --> N[Update Project Status]
    N --> O[Trigger Alerts]

    F --> P[Update Milestones]
    P --> Q[Update Epic Status]
    Q --> R[Generate Progress Report]

    O --> S[Executive Dashboard Update]
    R --> S
    S --> T[Stakeholder Notification]
```

### 4. Data Import/Export Flow

```mermaid
flowchart TD
    A[CSV File Upload] --> B[File Validation]
    B --> C[Parse CSV Content]
    C --> D[Data Type Detection]

    D --> E{Data Type?}
    E -->|People| F[People Import]
    E -->|Projects| G[Projects Import]
    E -->|Allocations| H[Allocations Import]
    E -->|Tracking| I[Tracking Import]
    E -->|Skills| J[Skills Import]

    F --> K[Validate People Data]
    G --> L[Validate Projects Data]
    H --> M[Validate Allocations Data]
    I --> N[Validate Tracking Data]
    J --> O[Validate Skills Data]

    K --> P[Check Team References]
    L --> Q[Check Epic References]
    M --> R[Check Team/Cycle References]
    N --> S[Check Allocation References]
    O --> T[Check Person References]

    P --> U[Apply Data]
    Q --> U
    R --> U
    S --> U
    T --> U

    U --> V[Update Context]
    V --> W[Persist to Storage]
    W --> X[Generate Import Report]
    X --> Y[Display Results]
```

### 5. Canvas Visualization Flow

```mermaid
flowchart TD
    A[Select View Type] --> B[Apply Filters]
    B --> C[Generate Nodes]
    C --> D[Generate Edges]

    D --> E[Apply Layout Algorithm]
    E --> F[Calculate Node Positions]
    F --> G[Render Canvas]

    G --> H[Add Interactive Features]
    H --> I[Enable Drag & Drop]
    I --> J[Add Zoom Controls]
    J --> K[Add Mini-map]

    K --> L[Apply Styling]
    L --> M[Add Tooltips]
    M --> N[Enable Node Selection]
    N --> O[Enable Edge Highlighting]

    O --> P[Add Export Options]
    P --> Q[Generate Image/PDF]
    Q --> R[Download Visualization]
```

## Component Architecture

### Main Application Structure

```mermaid
graph TB
    subgraph "App.tsx"
        A[ThemeProvider] --> B[AppProvider]
        B --> C[Router]
        C --> D[Navigation]
        C --> E[Main Content]
        C --> F[Footer]
        C --> G[Toaster]
    end

    subgraph "Pages"
        H[Dashboard] --> I[Teams]
        I --> J[People]
        J --> K[Projects]
        K --> L[Epics]
        L --> M[Planning]
        M --> N[Allocations]
        N --> O[Tracking]
        O --> P[Financials]
        P --> Q[Reports]
        Q --> R[Settings]
        R --> S[Canvas]
    end

    subgraph "Context"
        T[AppContext] --> U[ThemeContext]
        T --> V[Data Management]
        T --> W[State Management]
    end

    E --> H
    E --> I
    E --> J
    E --> K
    E --> L
    E --> M
    E --> N
    E --> O
    E --> P
    E --> Q
    E --> R
    E --> S
```

### Data Flow Architecture

```mermaid
flowchart LR
    subgraph "User Interface"
        A[Pages] --> B[Components]
        B --> C[Forms]
        B --> D[Tables]
        B --> E[Charts]
        B --> F[Canvas]
    end

    subgraph "State Management"
        G[AppContext] --> H[Local Storage]
        G --> I[Encrypted Storage]
        G --> J[Data Validation]
    end

    subgraph "Business Logic"
        K[Financial Calculations] --> L[Planning Engine]
        L --> M[Tracking System]
        M --> N[Scenario Analysis]
        N --> O[Budget Optimization]
    end

    subgraph "Data Layer"
        P[Data Loader] --> Q[CSV Utils]
        Q --> R[Import/Export]
        R --> S[Sample Data]
    end

    A --> G
    G --> K
    K --> P
    P --> A
```

## Key Business Rules & Calculations

### 1. Financial Calculation Rules

```mermaid
flowchart TD
    A[Person Cost Calculation] --> B{Employment Type}
    B -->|Permanent| C[Annual Salary Based]
    B -->|Contractor| D[Rate Based]

    C --> E[Priority: Individual > Role Default > Legacy]
    D --> F[Priority: Individual > Role Default > Legacy]

    E --> G[Convert to Hourly Rate]
    F --> G

    G --> H[Calculate Time Periods]
    H --> I[Daily: Hourly × 8]
    H --> J[Weekly: Daily × 5]
    H --> K[Monthly: Daily × 22]
    H --> L[Annual: Daily × 260]

    I --> M[Project Cost Calculation]
    J --> M
    K --> M
    L --> M

    M --> N[Allocation × Duration × Team Cost]
    N --> O[Budget Impact Analysis]
```

### 2. Planning Validation Rules

```mermaid
flowchart TD
    A[Allocation Validation] --> B[Capacity Check]
    B --> C{Team Capacity Available?}
    C -->|No| D[Capacity Exceeded Error]
    C -->|Yes| E[Iteration Validation]

    E --> F{Valid Iteration?}
    F -->|No| G[Invalid Iteration Error]
    F -->|Yes| H[Conflict Detection]

    H --> I{Conflicts Found?}
    I -->|Yes| J[Conflict Resolution]
    I -->|No| K[Allocation Approved]

    J --> L[Manual Resolution Required]
    L --> M[User Decision]
    M --> N{Resolved?}
    N -->|Yes| K
    N -->|No| O[Allocation Rejected]
```

### 3. Progress Tracking Rules

```mermaid
flowchart TD
    A[Variance Calculation] --> B[Actual - Planned]
    B --> C{Variance > 0?}
    C -->|Yes| D[Over Allocation]
    C -->|No| E[Under Allocation]

    D --> F[Variance Type: Over]
    E --> G[Variance Type: Under]

    F --> H[Impact Assessment]
    G --> H

    H --> I{Variance > 20%?}
    I -->|Yes| J[High Impact]
    I -->|No| K{Variance > 10%?}
    K -->|Yes| L[Medium Impact]
    K -->|No| M[Low Impact]

    J --> N[Immediate Attention Required]
    L --> O[Monitor Closely]
    M --> P[Standard Tracking]

    N --> Q[Alert Stakeholders]
    O --> R[Weekly Review]
    P --> S[Monthly Review]
```

## Security & Data Privacy

```mermaid
flowchart TD
    A[Data Classification] --> B{Sensitive Data?}
    B -->|Yes| C[Encrypted Storage]
    B -->|No| D[Local Storage]

    C --> E[AES Encryption]
    E --> F[People Data]
    E --> G[Project Data]

    D --> H[Configuration Data]
    D --> I[Operational Data]

    F --> J[No Server Transmission]
    G --> J
    H --> K[Local Processing Only]
    I --> K

    J --> L[Privacy Compliance]
    K --> L
    L --> M[User Control]
    M --> N[Export Controls]
```

## Performance Optimization

```mermaid
flowchart TD
    A[Performance Strategy] --> B[React Optimization]
    B --> C[useMemo for Calculations]
    B --> D[useCallback for Functions]
    B --> E[React.memo for Components]

    A --> F[Data Optimization]
    F --> G[Lazy Loading]
    F --> H[Virtual Scrolling]
    F --> I[Pagination]

    A --> J[Storage Optimization]
    J --> K[Efficient Data Structures]
    J --> L[Minimal Re-renders]
    J --> M[Smart Caching]

    A --> N[Build Optimization]
    N --> O[Code Splitting]
    N --> P[Tree Shaking]
    N --> Q[Bundle Analysis]
```

## Integration Points

```mermaid
flowchart LR
    subgraph "Current System"
        A[Local Storage] --> B[CSV Import/Export]
        B --> C[Data Validation]
        C --> D[Business Logic]
    end

    subgraph "Future Integrations"
        E[API Layer] --> F[External Systems]
        F --> G[Jira]
        F --> H[Azure DevOps]
        F --> I[Slack]
        F --> J[Email]
    end

    subgraph "Data Exchange"
        K[Standard Formats] --> L[JSON API]
        K --> M[Webhooks]
        K --> N[Real-time Sync]
    end

    D --> E
    E --> K
```

## Deployment Architecture

```mermaid
flowchart TD
    A[Source Code] --> B[Build Process]
    B --> C[Vite Build]
    C --> D[Static Assets]
    D --> E[CDN Deployment]

    E --> F[Vercel/Netlify]
    F --> G[Production Environment]

    A --> H[CI/CD Pipeline]
    H --> I[GitHub Actions]
    I --> J[Lint & Test]
    J --> K[Build & Deploy]
    K --> L[Version Management]

    L --> M[Version Info Injection]
    M --> N[Build Artifacts]
    N --> O[Deployment]
```

## Conclusion

Plan Pulse Compass represents a sophisticated resource planning and management system with:

1. **Comprehensive Data Model**: Hierarchical organization structure with complex relationships
2. **Advanced Financial Engine**: Multi-tier cost calculation with support for different employment types
3. **Flexible Planning System**: Scenario-based planning with feasibility analysis
4. **Real-time Tracking**: Variance analysis and progress monitoring
5. **Rich Visualizations**: Interactive canvas views for complex data relationships
6. **Data Privacy**: Local-first architecture with encrypted sensitive data
7. **Performance Optimized**: React-based with efficient data structures and caching

The system is designed to scale from small teams to large enterprises while maintaining data privacy and providing powerful planning and tracking capabilities.
