import { beforeEach, describe, expect, it, mock } from "bun:test";
import { render } from "@testing-library/svelte";
import {
  createCommandMock,
  createFormMock,
  createQueryMock,
} from "../../test-helpers/sveltekit-mocks";

const mockGetProjects = createQueryMock([]);
const mockGetLeads = createQueryMock([]);

mock.module("$env/dynamic/private", () => ({ env: {} }));

mock.module("$app/server", () => ({
  query: (fn: (...args: unknown[]) => unknown) => fn,
  form: () => createFormMock(),
  command: () => createCommandMock(),
  getRequestEvent: () => ({}),
}));

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

mock.module("$lib/remote/projects.remote", () => mockedProjectsRemote);
mock.module("$lib/remote/projects.remote.js", () => mockedProjectsRemote);

mock.module("$lib/remote/leads.remote", () => mockedLeadsRemote);
mock.module("$lib/remote/leads.remote.js", () => mockedLeadsRemote);

const { default: LeadManualCreateForm } =
  await import("./lead-manual-create-form.svelte");

describe("LeadManualCreateForm", () => {
  beforeEach(() => {
    mockGetProjects.mockClear();
    mockGetLeads.mockClear();
  });

  it("creates both query resources when the form renders", () => {
    render(LeadManualCreateForm);

    expect(mockGetProjects).toHaveBeenCalledTimes(1);
    expect(mockGetLeads).toHaveBeenCalledTimes(1);
  });
});
