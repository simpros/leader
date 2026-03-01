import { describe, it, expect, mock, beforeEach } from "bun:test";
import { render, screen, waitFor } from "@testing-library/svelte";
import {
  createFormMock,
  createQueryMock,
  createCommandMock,
  mockSvelteKitModules,
} from "../../../../test-helpers/sveltekit-mocks";

const mockProject = {
  project: {
    id: "proj-1",
    name: "Test Project",
    description: "A test project description",
  },
  leads: [
    {
      id: "lead-1",
      name: "Acme Corp",
      placeId: "place_123",
      email: "hello@acme.com",
      phone: "+1234567890",
      website: "https://acme.com",
      types: ["restaurant"],
    },
    {
      id: "lead-2",
      name: "Beta Inc",
      placeId: "place_456",
      email: null,
      phone: null,
      website: null,
      types: [],
    },
  ],
};

const mockInitiatives = [
  {
    id: "init-1",
    title: "Welcome Email",
    subject: "Welcome to our service",
    htmlBody: "<p>Hello</p>",
    sentAt: null,
    createdAt: new Date("2024-01-01"),
    leads: [],
  },
];

mockSvelteKitModules();

const mockGetProjectData = createQueryMock(mockProject);
const mockGetProjectInitiatives = createQueryMock(mockInitiatives);
const mockDeleteProject = createFormMock();
const mockUpdateProject = createFormMock();
const mockUnlinkLead = createFormMock();
const mockSendInitiative = createFormMock();
const mockRetryInitiativeLead = createFormMock();

mock.module("$lib/remote/projects.remote.js", () => ({
  getProjectData: mockGetProjectData,
  deleteProject: mockDeleteProject,
  updateProject: mockUpdateProject,
  unlinkLeadFromProject: mockUnlinkLead,
  getProjects: createQueryMock([]),
  addLeadsToProject: createFormMock(),
  createProject: createFormMock(),
}));

mock.module("$lib/remote/initiatives.remote.js", () => ({
  getProjectInitiatives: mockGetProjectInitiatives,
  sendInitiative: mockSendInitiative,
  retryInitiativeLead: mockRetryInitiativeLead,
  getInitiativeCapabilities: createQueryMock({ hasOpenRouter: false }),
  generateInitiativeEmail: createCommandMock(),
  createInitiativeEmail: createFormMock(),
  updateInitiativeEmail: createFormMock(),
  sendInitiativeTestEmail: createFormMock(),
  getInitiative: createQueryMock(null),
}));

mock.module("$lib/remote/leads.remote", () => ({
  getLeads: createQueryMock([]),
  createManualLead: createFormMock(),
}));

mock.module("runed/kit", () => ({
  createSearchParamsSchema: (schema: unknown) => schema,
  useSearchParams: (_schema: unknown) => ({ initiative: "" }),
}));

mock.module("svelte/transition", () => ({
  fade: () => ({ duration: 0 }),
  fly: () => ({ duration: 0 }),
}));

const { default: ProjectPage } = await import("./+page.svelte");

describe("Project page", () => {
  beforeEach(() => {
    mockGetProjectData.mockClear();
    mockGetProjectInitiatives.mockClear();
    mockGetProjectData.mockImplementation(() => Promise.resolve(mockProject));
    mockGetProjectInitiatives.mockImplementation(() =>
      Promise.resolve(mockInitiatives),
    );
  });

  it("renders the project name in heading", async () => {
    render(ProjectPage, {
      params: { id: "proj-1" },
      data: { locale: "en-US" },
    });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Test Project" }),
      ).toBeTruthy();
    });
  });

  it("renders the project description", async () => {
    render(ProjectPage, {
      params: { id: "proj-1" },
      data: { locale: "en-US" },
    });
    await waitFor(() => {
      expect(
        screen.getByText("A test project description"),
      ).toBeTruthy();
    });
  });

  it("renders initiative titles", async () => {
    render(ProjectPage, {
      params: { id: "proj-1" },
      data: { locale: "en-US" },
    });
    await waitFor(() => {
      expect(screen.getByText("Welcome Email")).toBeTruthy();
    });
  });

  it("renders lead count in leads tab", async () => {
    render(ProjectPage, {
      params: { id: "proj-1" },
      data: { locale: "en-US" },
    });
    await waitFor(() => {
      expect(screen.getByText("Leads")).toBeTruthy();
    });
  });

  it("renders breadcrumbs with Projects link", async () => {
    render(ProjectPage, {
      params: { id: "proj-1" },
      data: { locale: "en-US" },
    });
    await waitFor(() => {
      expect(screen.getByText("Projects")).toBeTruthy();
    });
  });
});
