import { describe, it, expect, mock, beforeEach } from "bun:test";
import { render, screen, waitFor } from "@testing-library/svelte";
import {
  createCommandMock,
  createFormMock,
  createQueryMock,
  createQueryResult,
} from "../../../test-helpers/sveltekit-mocks";

const mockLeads = [
  {
    id: "lead-1",
    name: "Acme Corp",
    placeId: "place_123",
    email: "hello@acme.com",
    phone: "+1234567890",
    website: "https://acme.com",
    rating: 4.5,
    projectCount: 2,
  },
  {
    id: "lead-2",
    name: "Beta Inc",
    placeId: "place_456",
    email: null,
    phone: null,
    website: null,
    rating: 3.0,
    projectCount: 0,
  },
];

const mockGetLeads = createQueryMock(mockLeads);
const mockGetProjects = createQueryMock([]);
const mockResolve = mock((path: string) => path);

const mockedLeadsRemote = {
  getLeads: mockGetLeads,
  createManualLead: createFormMock(),
  getDiscoveryCapabilities: createQueryMock({ hasOpenRouter: false }),
  discoverLeads: createFormMock(),
  getLeadData: createQueryMock(null),
  updateLeadCore: createFormMock(),
  createProjectCustomField: createFormMock(),
  upsertLeadCustomFieldValue: createFormMock(),
  deleteLead: createFormMock(),
};

const mockedProjectsRemote = {
  getProjects: mockGetProjects,
  addLeadsToProject: createFormMock(),
  createProject: createFormMock(),
  updateProject: createFormMock(),
  deleteProject: createFormMock(),
  unlinkLeadFromProject: createFormMock(),
  createProjectWithLeads: createFormMock(),
  getProjectCustomFields: createQueryMock([]),
  getProjectData: createQueryMock(null),
};

mock.module("$lib/remote/leads.remote", () => mockedLeadsRemote);
mock.module("$lib/remote/leads.remote.js", () => mockedLeadsRemote);

mock.module("$lib/remote/projects.remote", () => mockedProjectsRemote);
mock.module("$lib/remote/projects.remote.js", () => mockedProjectsRemote);

mock.module("$app/paths", () => ({
  resolve: mockResolve,
}));

mock.module("$app/server", () => ({
  query: (fn: (...args: unknown[]) => unknown) => fn,
  form: () => createFormMock(),
  command: () => createCommandMock(),
  getRequestEvent: () => ({}),
}));

const { default: LeadsPage } = await import("./+page.svelte");

describe("Leads page", () => {
  beforeEach(() => {
    mockGetLeads.mockClear();
    mockGetLeads.mockImplementation(() => createQueryResult(mockLeads));
  });

  it("renders the page heading", async () => {
    render(LeadsPage);
    await waitFor(() => {
      expect(screen.getByText("All Leads")).toBeTruthy();
    });
  });

  it("renders the page description", async () => {
    render(LeadsPage);
    await waitFor(() => {
      expect(screen.getByText(/Review every saved lead/)).toBeTruthy();
    });
  });

  it("renders lead names", async () => {
    render(LeadsPage);
    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeTruthy();
      expect(screen.getByText("Beta Inc")).toBeTruthy();
    });
  });

  it("renders lead place IDs", async () => {
    render(LeadsPage);
    await waitFor(() => {
      expect(screen.getByText("place_123")).toBeTruthy();
      expect(screen.getByText("place_456")).toBeTruthy();
    });
  });

  it("renders contact details for leads that have them", async () => {
    render(LeadsPage);
    await waitFor(() => {
      expect(screen.getByText("hello@acme.com")).toBeTruthy();
      expect(screen.getByText("+1234567890")).toBeTruthy();
    });
  });

  it("shows no contact message for leads without details", async () => {
    render(LeadsPage);
    await waitFor(() => {
      expect(screen.getByText("No contact details yet")).toBeTruthy();
    });
  });

  it("renders project count badges", async () => {
    render(LeadsPage);
    await waitFor(() => {
      expect(screen.getByText("2 projects")).toBeTruthy();
      expect(screen.getByText("0 projects")).toBeTruthy();
    });
  });

  it("shows empty state when there are no leads", async () => {
    mockGetLeads.mockImplementation(() =>
      createQueryResult<typeof mockLeads>([])
    );
    render(LeadsPage);
    await waitFor(() => {
      expect(screen.getByText("No leads yet")).toBeTruthy();
      expect(screen.getByText(/Discover leads and add them/)).toBeTruthy();
    });
  });
});
