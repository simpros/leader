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

const realProjectsRemote = await import("$lib/remote/projects.remote.js");
const realLeadsRemote = await import("$lib/remote/leads.remote.js");

const mockedProjectsRemote = {
  ...realProjectsRemote,
  getProjects: mockGetProjects,
  addLeadsToProject: createFormMock(),
};

const mockedLeadsRemote = {
  ...realLeadsRemote,
  getLeads: mockGetLeads,
  createManualLead: createFormMock(),
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
