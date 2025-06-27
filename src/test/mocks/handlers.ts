
import { http, HttpResponse } from "msw";

// Mock data
const mockPeople = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    roleId: "1",
    teamId: "1",
    employmentType: "permanent",
    salary: 80000,
    startDate: "2023-01-01",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    roleId: "2",
    teamId: "1",
    employmentType: "contractor",
    hourlyRate: 100,
    startDate: "2023-02-01",
  },
];

const mockTeams = [
  {
    id: "1",
    name: "Engineering Team",
    divisionId: "1",
    capacity: 100,
    productOwnerId: "1",
  },
  {
    id: "2",
    name: "Design Team",
    divisionId: "1",
    capacity: 80,
    productOwnerId: "2",
  },
];

const mockProjects = [
  {
    id: "1",
    name: "Project Alpha",
    description: "A revolutionary new product",
    status: "active",
    priority: 100,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
  },
  {
    id: "2",
    name: "Project Beta",
    description: "Platform modernization",
    status: "planning",
    priority: 200,
    startDate: "2024-03-01",
    endDate: "2024-08-31",
  },
];

const mockEpics = [
  {
    id: "1",
    projectId: "1",
    name: "User Authentication",
    description: "Implement secure user authentication",
    status: "in-progress",
    priority: 1,
  },
  {
    id: "2",
    projectId: "1",
    name: "Dashboard UI",
    description: "Create responsive dashboard interface",
    status: "planned",
    priority: 2,
  },
];

export const handlers = [
  // People endpoints
  http.get("/api/people", () => {
    return HttpResponse.json(mockPeople);
  }),

  http.post("/api/people", async ({ request }) => {
    const newPerson = (await request.json()) as Record<string, any>;
    return HttpResponse.json({ ...newPerson, id: Date.now().toString() });
  }),

  http.put("/api/people/:id", async ({ request }) => {
    const updatedPerson = (await request.json()) as Record<string, any>;
    return HttpResponse.json(updatedPerson);
  }),

  http.delete("/api/people/:id", () => {
    return HttpResponse.json({ success: true });
  }),

  // Teams endpoints
  http.get("/api/teams", () => {
    return HttpResponse.json(mockTeams);
  }),

  http.post("/api/teams", async ({ request }) => {
    const newTeam = (await request.json()) as Record<string, any>;
    return HttpResponse.json({ ...newTeam, id: Date.now().toString() });
  }),

  // Projects endpoints
  http.get("/api/projects", () => {
    return HttpResponse.json(mockProjects);
  }),

  http.post("/api/projects", async ({ request }) => {
    const newProject = (await request.json()) as Record<string, any>;
    return HttpResponse.json({ ...newProject, id: Date.now().toString() });
  }),

  // Epics endpoints
  http.get("/api/epics", () => {
    return HttpResponse.json(mockEpics);
  }),

  http.get("/api/epics/:projectId", ({ params }) => {
    const projectEpics = mockEpics.filter(
      (epic) => epic.projectId === params.projectId
    );
    return HttpResponse.json(projectEpics);
  }),

  // Dashboard data
  http.get("/api/dashboard", () => {
    return HttpResponse.json({
      metrics: {
        totalProjects: mockProjects.length,
        activeProjects: mockProjects.filter((p) => p.status === "active")
          .length,
        totalPeople: mockPeople.length,
        totalTeams: mockTeams.length,
      },
      recentActivity: [
        {
          id: "1",
          type: "project_created",
          message: "Project Alpha created",
          timestamp: new Date().toISOString(),
        },
        {
          id: "2",
          type: "epic_completed",
          message: "User Authentication completed",
          timestamp: new Date().toISOString(),
        },
      ],
    });
  }),

  // Financial data
  http.get("/api/financials", () => {
    return HttpResponse.json({
      totalBudget: 1000000,
      spent: 650000,
      remaining: 350000,
      burnRate: 50000,
    });
  }),
];
