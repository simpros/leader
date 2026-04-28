import { beforeEach, describe, expect, it, mock } from "bun:test";

class HttpError {
  constructor(
    public status: number,
    public body: { message: string }
  ) {}
}

mock.module("@sveltejs/kit", () => ({
  error: (status: number, message: string) => {
    throw new HttpError(status, { message });
  },
}));

mock.module("$lib/server/request-logging", () => ({
  addRequestLogContext: mock(() => {}),
}));

const realDb = await import("@leader/db");

const mockReturning = mock(() => Promise.resolve([{ id: "proj-1" }]));
const mockWhere = mock(() => ({ returning: mockReturning }));
const mockDelete = mock(() => ({ where: mockWhere }));
const mockLocalsDb = mock(
  async (callback: (tx: { delete: typeof mockDelete }) => unknown) =>
    callback({ delete: mockDelete })
);

let requestEvent = {
  locals: {
    user: { id: "user-1" },
    session: { activeOrganizationId: "org-1" },
    wideEvent: {},
    db: mockLocalsDb,
  },
};

mock.module("$app/server", () => ({
  query: (...args: unknown[]) => args.at(-1),
  command: (...args: unknown[]) => args.at(-1),
  form: (...args: unknown[]) => args.at(-1),
  getRequestEvent: () => requestEvent,
}));

mock.module("@leader/db", () => ({
  ...realDb,
  and: mock((...conditions: unknown[]) => ({ conditions })),
  eq: mock((column: unknown, value: unknown) => ({ column, value })),
  count: mock(() => 0),
  schema: {
    ...realDb.schema,
    project: {
      ...realDb.schema.project,
      id: "project.id",
      userId: "project.userId",
    },
  },
}));

const { deleteProject } = await import("./projects.remote");

describe("deleteProject", () => {
  beforeEach(() => {
    mockDelete.mockClear();
    mockWhere.mockClear();
    mockReturning.mockClear();
    mockLocalsDb.mockClear();
    requestEvent.locals.user = { id: "user-1" };
    requestEvent.locals.session = { activeOrganizationId: "org-1" };
    requestEvent.locals.wideEvent = {};
    mockReturning.mockImplementation(() =>
      Promise.resolve([{ id: "proj-1" }])
    );
  });

  it("returns success after deleting the project", async () => {
    const result = await deleteProject({ projectId: "proj-1" });

    expect(result).toEqual({ ok: true });
    expect(mockLocalsDb).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockReturning).toHaveBeenCalledTimes(1);
  });

  it("throws 404 when the project is not found", async () => {
    mockReturning.mockImplementation(() => Promise.resolve([]));

    await expect(
      deleteProject({ projectId: "proj-missing" })
    ).rejects.toMatchObject({ status: 404 });
  });
});
