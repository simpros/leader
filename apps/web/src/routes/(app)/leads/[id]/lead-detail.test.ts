import { describe, it, expect, mock, beforeEach } from "bun:test";
import { render, screen, waitFor } from "@testing-library/svelte";
import {
  createFormMock,
  createQueryMock,
} from "../../../../test-helpers/sveltekit-mocks";

const mockLeadData = {
  lead: {
    id: "lead-1",
    name: "Acme Corp",
    placeId: "place_123",
    email: "hello@acme.com",
    phone: "+1234567890",
    website: "https://acme.com",
    address: "123 Main St",
    googleMapsUrl: "https://maps.google.com/?cid=123",
    types: ["restaurant"],
    rating: 4.5,
    ratingsTotal: 100,
    businessStatus: "OPERATIONAL",
    createdAt: new Date("2024-01-01"),
  },
  customFieldSections: [
    {
      projectId: "proj-1",
      projectName: "Test Project",
      fields: [],
    },
  ],
};

const mockGetLeadData = createQueryMock(mockLeadData);
const mockDeleteLead = createFormMock({ ok: true });
const mockUpdateLeadCore = createFormMock({ ok: true });
const mockCreateProjectCustomField = createFormMock({ ok: true });
const mockUpsertLeadCustomFieldValue = createFormMock({ ok: true });

const mockGoto = mock(() => Promise.resolve());
const mockResolve = mock((path: string) => path);

mock.module("$lib/remote/leads.remote.js", () => ({
  getLeadData: mockGetLeadData,
  deleteLead: mockDeleteLead,
  updateLeadCore: mockUpdateLeadCore,
  createProjectCustomField: mockCreateProjectCustomField,
  upsertLeadCustomFieldValue: mockUpsertLeadCustomFieldValue,
  getLeads: createQueryMock([]),
  createManualLead: createFormMock(),
  getDiscoveryCapabilities: createQueryMock({ hasOpenRouter: false }),
  discoverLeads: createFormMock(),
}));

mock.module("$app/navigation", () => ({
  goto: mockGoto,
}));

mock.module("$app/paths", () => ({
  resolve: mockResolve,
}));

mock.module("$app/server", () => ({
  query: (fn: (...args: unknown[]) => unknown) => fn,
  form: () => createFormMock(),
  getRequestEvent: () => ({}),
}));

const { default: LeadDetailPage } = await import("./+page.svelte");

describe("Lead detail page", () => {
  beforeEach(() => {
    mockGetLeadData.mockClear();
    mockGoto.mockClear();
    mockResolve.mockClear();
    mockGetLeadData.mockImplementation(() => Promise.resolve(mockLeadData));
    mockResolve.mockImplementation((path: string) => path);
  });

  it("renders the lead name in heading", async () => {
    render(LeadDetailPage, { params: { id: "lead-1" } });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Acme Corp" }),
      ).toBeTruthy();
    });
  });

  it("renders breadcrumbs with Leads link", async () => {
    render(LeadDetailPage, { params: { id: "lead-1" } });
    await waitFor(() => {
      expect(screen.getByText("Leads")).toBeTruthy();
    });
  });

  it("renders the Google Maps link", async () => {
    render(LeadDetailPage, { params: { id: "lead-1" } });
    await waitFor(() => {
      expect(screen.getByText(/Open in Google Maps/)).toBeTruthy();
    });
  });

  it("renders the delete button", async () => {
    render(LeadDetailPage, { params: { id: "lead-1" } });
    await waitFor(() => {
      expect(screen.getByText("Delete")).toBeTruthy();
    });
  });

  describe("delete lead", () => {
    it("uses submit().updates() to prevent auto-invalidation", async () => {
      render(LeadDetailPage, { params: { id: "lead-1" } });

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Acme Corp" })).toBeTruthy();
      });

      // The component calls deleteLead.enhance(callback) during script execution.
      // Our mock captures this callback in _enhanceCallback.
      const enhanceCallback = (mockDeleteLead as any)._enhanceCallback;
      expect(enhanceCallback).not.toBeNull();

      // Create a mock submit that returns a Promise with .updates() method
      const mockUpdates = mock(() => Promise.resolve({ ok: true }));
      const mockSubmit = mock(() => {
        const p = Promise.resolve({ ok: true });
        (p as any).updates = mockUpdates;
        return p;
      });

      await enhanceCallback({ submit: mockSubmit });

      // submit() must be called
      expect(mockSubmit).toHaveBeenCalledTimes(1);
      // .updates() must be called on the submit result (single-flight mutation)
      // This prevents SvelteKit from auto-invalidating getLeadData for the deleted lead
      expect(mockUpdates).toHaveBeenCalledTimes(1);
    });

    it("navigates to /leads after successful delete", async () => {
      render(LeadDetailPage, { params: { id: "lead-1" } });

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Acme Corp" })).toBeTruthy();
      });

      const enhanceCallback = (mockDeleteLead as any)._enhanceCallback;

      const mockUpdates = mock(() => Promise.resolve({ ok: true }));
      const mockSubmit = mock(() => {
        const p = Promise.resolve({ ok: true });
        (p as any).updates = mockUpdates;
        return p;
      });

      await enhanceCallback({ submit: mockSubmit });

      expect(mockGoto).toHaveBeenCalledTimes(1);
      expect(mockGoto).toHaveBeenCalledWith("/leads");
    });

    it("shows error message when delete fails", async () => {
      render(LeadDetailPage, { params: { id: "lead-1" } });

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Acme Corp" })).toBeTruthy();
      });

      const enhanceCallback = (mockDeleteLead as any)._enhanceCallback;

      const mockSubmit = mock(() => {
        const p = Promise.reject(new Error("Server error"));
        (p as any).updates = () => p;
        return p;
      });

      await enhanceCallback({ submit: mockSubmit });

      expect(mockGoto).not.toHaveBeenCalled();
    });
  });
});
