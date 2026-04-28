import { describe, it, expect, mock, beforeEach } from "bun:test";
import { render, screen, waitFor } from "@testing-library/svelte";
import {
  createFormMock,
  createQueryMock,
  createQueryResult,
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

const { mockGoto, mockInvalidate } = mockSvelteKitModules();
const mockToastSuccess = mock(() => {});

const mockGetProjectData = createQueryMock(mockProject);
const mockGetProjectInitiatives = createQueryMock(mockInitiatives);
const mockDeleteProject = createFormMock();
const mockUpdateProject = createFormMock();
const mockUnlinkLead = createFormMock();
const mockSendInitiative = createFormMock();
const mockRetryInitiativeLead = createFormMock();

const mockedProjectsRemote = {
  getProjectData: mockGetProjectData,
  deleteProject: mockDeleteProject,
  updateProject: mockUpdateProject,
  unlinkLeadFromProject: mockUnlinkLead,
  getProjects: createQueryMock([]),
  addLeadsToProject: createFormMock(),
  createProject: createFormMock(),
  createProjectWithLeads: createFormMock(),
  getProjectCustomFields: createQueryMock([]),
};

const mockedInitiativesRemote = {
  getProjectInitiatives: mockGetProjectInitiatives,
  sendInitiative: mockSendInitiative,
  retryInitiativeLead: mockRetryInitiativeLead,
  getInitiativeCapabilities: createQueryMock({ hasOpenRouter: false }),
  generateInitiativeEmail: createCommandMock(),
  createInitiativeEmail: createFormMock(),
  updateInitiativeEmail: createFormMock(),
  sendInitiativeTestEmail: createFormMock(),
  getInitiative: createQueryMock(null),
};

const mockedLeadsRemote = {
  getLeads: createQueryMock([]),
  createManualLead: createFormMock(),
  getDiscoveryCapabilities: createQueryMock({ hasOpenRouter: false }),
  discoverLeads: createFormMock(),
  getLeadData: createQueryMock(null),
  updateLeadCore: createFormMock(),
  createProjectCustomField: createFormMock(),
  upsertLeadCustomFieldValue: createFormMock(),
  deleteLead: createFormMock(),
};

mock.module("$lib/remote/projects.remote", () => mockedProjectsRemote);
mock.module("$lib/remote/projects.remote.js", () => mockedProjectsRemote);

mock.module(
  "$lib/remote/initiatives.remote",
  () => mockedInitiativesRemote
);
mock.module(
  "$lib/remote/initiatives.remote.js",
  () => mockedInitiativesRemote
);

mock.module("$lib/remote/leads.remote", () => mockedLeadsRemote);
mock.module("$lib/remote/leads.remote.js", () => mockedLeadsRemote);

mock.module("runed/kit", () => ({
  createSearchParamsSchema: (schema: unknown) => schema,
  useSearchParams: () => ({ initiative: "" }),
}));

mock.module("svelte/transition", () => ({
  fade: () => ({ duration: 0 }),
  fly: () => ({ duration: 0 }),
}));

mock.module("svelte-sonner", () => ({
  toast: {
    success: mockToastSuccess,
  },
}));

const { default: ProjectPage } = await import("./+page.svelte");

describe("Project page", () => {
  const mockData = {
    locale: "en-US",
    allowSignUp: false,
    user: {
      id: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      email: "test@example.com",
      emailVerified: true,
      name: "Test User",
      image: null,
      banned: null,
      role: "user",
      banReason: null,
      banExpires: null,
    },
    memberRole: "admin" as string | null,
    session: {
      activeOrganizationId: "org-1",
    },
    organizations: [
      { id: "org-1", name: "Test Org", slug: "test-org" },
    ] as { id: string; name: string; slug: string }[],
  } as const;

  beforeEach(() => {
    mockGetProjectData.mockClear();
    mockGetProjectInitiatives.mockClear();
    mockDeleteProject.mockClear();
    mockUpdateProject.mockClear();
    mockGoto.mockClear();
    mockInvalidate.mockClear();
    mockToastSuccess.mockClear();
    mockGetProjectData.mockImplementation(() =>
      createQueryResult(mockProject)
    );
    mockGetProjectInitiatives.mockImplementation(() =>
      createQueryResult(mockInitiatives)
    );
  });

  it("renders the project name in heading", async () => {
    render(ProjectPage, {
      params: { id: "proj-1" },
      data: mockData,
    });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Test Project" })
      ).toBeTruthy();
    });
  });

  it("renders the project description", async () => {
    render(ProjectPage, {
      params: { id: "proj-1" },
      data: mockData,
    });
    await waitFor(() => {
      expect(screen.getByText("A test project description")).toBeTruthy();
    });
  });

  it("renders initiative titles", async () => {
    render(ProjectPage, {
      params: { id: "proj-1" },
      data: mockData,
    });
    await waitFor(() => {
      expect(screen.getByText("Welcome Email")).toBeTruthy();
    });
  });

  it("renders lead count in leads tab", async () => {
    render(ProjectPage, {
      params: { id: "proj-1" },
      data: mockData,
    });
    await waitFor(() => {
      expect(screen.getByText("Leads")).toBeTruthy();
    });
  });

  it("renders breadcrumbs with Projects link", async () => {
    render(ProjectPage, {
      params: { id: "proj-1" },
      data: mockData,
    });
    await waitFor(() => {
      expect(screen.getByText("Projects")).toBeTruthy();
    });
  });

  it("submits project edits without invalidating route data", async () => {
    render(ProjectPage, {
      params: { id: "proj-1" },
      data: mockData,
    });

    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeTruthy();
    });

    screen.getByText("Edit").click();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
    });

    const saveButton = screen.getByRole("button", { name: "Save" });
    const form = saveButton.closest("form");

    expect(form).toBeTruthy();

    form!.dispatchEvent(new Event("submit", { bubbles: true }));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    });

    expect(mockUpdateProject).toHaveBeenCalledTimes(1);
    expect(mockInvalidate).not.toHaveBeenCalled();
  });

  it("navigates to projects after successful delete", async () => {
    render(ProjectPage, {
      params: { id: "proj-1" },
      data: mockData,
    });

    await waitFor(() => {
      expect(screen.getByText("Delete")).toBeTruthy();
    });

    screen.getByText("Delete").click();

    await waitFor(() => {
      expect(screen.getByText("Confirm Delete")).toBeTruthy();
    });

    const confirmButton = screen.getByText("Confirm Delete");
    const form = confirmButton.closest("form");

    expect(form).toBeTruthy();

    form!.dispatchEvent(new Event("submit", { bubbles: true }));

    await waitFor(() => {
      expect(mockDeleteProject).toHaveBeenCalledTimes(1);
      expect(mockToastSuccess).toHaveBeenCalledWith("Project deleted");
      expect(mockGoto).toHaveBeenCalledWith("/projects");
    });
  });
});
