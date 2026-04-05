import { describe, it, expect, mock, beforeEach, spyOn } from "bun:test";
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
    mockDeleteLead.mockClear();
    mockGetLeadData.mockImplementation(() =>
      Promise.resolve(mockLeadData)
    );
    mockDeleteLead.mockImplementation(() => Promise.resolve({ ok: true }));
    mockResolve.mockImplementation((path: string) => path);
  });

  it("renders the lead name in heading", async () => {
    render(LeadDetailPage, { params: { id: "lead-1" } });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Acme Corp" })
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
    it("shows confirmation when Delete is clicked", async () => {
      render(LeadDetailPage, { params: { id: "lead-1" } });

      await waitFor(() => {
        expect(screen.getByText("Delete")).toBeTruthy();
      });

      screen.getByText("Delete").click();

      await waitFor(() => {
        expect(screen.getByText("Confirm Delete")).toBeTruthy();
        expect(
          screen.getByText("Delete this lead from all projects?")
        ).toBeTruthy();
      });
    });

    it("navigates to /leads after successful delete", async () => {
      render(LeadDetailPage, { params: { id: "lead-1" } });

      await waitFor(() => {
        expect(screen.getByText("Delete")).toBeTruthy();
      });

      screen.getByText("Delete").click();

      await waitFor(() => {
        expect(screen.getByText("Confirm Delete")).toBeTruthy();
      });

      const confirmButton = screen.getByText("Confirm Delete");
      const form = confirmButton.closest("form")!;
      form.dispatchEvent(new Event("submit", { bubbles: true }));

      await waitFor(() => {
        expect(mockGoto).toHaveBeenCalledTimes(1);
        expect(mockGoto).toHaveBeenCalledWith("/leads");
      });
    });

    it("shows error message when delete fails", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(
        () => {}
      );
      mockDeleteLead.mockImplementation(() =>
        Promise.reject(new Error("Server error"))
      );

      render(LeadDetailPage, { params: { id: "lead-1" } });

      await waitFor(() => {
        expect(screen.getByText("Delete")).toBeTruthy();
      });

      screen.getByText("Delete").click();

      await waitFor(() => {
        expect(screen.getByText("Confirm Delete")).toBeTruthy();
      });

      const confirmButton = screen.getByText("Confirm Delete");
      const form = confirmButton.closest("form")!;
      form.dispatchEvent(new Event("submit", { bubbles: true }));

      await waitFor(() => {
        expect(
          screen.getByText("Failed to delete lead. Please try again.")
        ).toBeTruthy();
      });

      expect(mockGoto).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
