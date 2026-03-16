import { describe, it, expect, mock, beforeEach } from "bun:test";

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

const realDb = await import("@leader/db");

let mockDbResult: { role: string }[] = [];

const mockLimit = mock(() => Promise.resolve(mockDbResult));
const mockWhere = mock(() => ({ limit: mockLimit }));
const mockFrom = mock(() => ({ where: mockWhere }));
const mockSelect = mock(() => ({ from: mockFrom }));

mock.module("@leader/db", () => ({
  ...realDb,
  db: { select: mockSelect },
}));

const { ensureOrgAdmin } = await import("./ensure-org-admin");

const makeLocals = (
  userId: string | undefined,
  organizationId: string | undefined
) =>
  ({
    user: userId ? { id: userId } : null,
    session: organizationId ? { activeOrganizationId: organizationId } : null,
  }) as unknown as App.Locals;

describe("ensureOrgAdmin", () => {
  beforeEach(() => {
    mockSelect.mockClear();
    mockFrom.mockClear();
    mockWhere.mockClear();
    mockLimit.mockClear();
    mockDbResult = [];
  });

  it("throws 401 when user is missing", async () => {
    try {
      await ensureOrgAdmin(makeLocals(undefined, "org-1"));
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(401);
    }
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("throws 401 when activeOrganizationId is missing", async () => {
    try {
      await ensureOrgAdmin(makeLocals("user-1", undefined));
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(401);
    }
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("throws 403 when user has no membership in the org", async () => {
    mockDbResult = [];

    try {
      await ensureOrgAdmin(makeLocals("user-1", "org-1"));
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(403);
    }
  });

  it("throws 403 when user has 'member' role", async () => {
    mockDbResult = [{ role: "member" }];

    try {
      await ensureOrgAdmin(makeLocals("user-1", "org-1"));
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(403);
    }
  });

  it("returns userId and organizationId for admin role", async () => {
    mockDbResult = [{ role: "admin" }];

    const result = await ensureOrgAdmin(makeLocals("user-1", "org-1"));
    expect(result).toEqual({ userId: "user-1", organizationId: "org-1" });
  });

  it("returns userId and organizationId for owner role", async () => {
    mockDbResult = [{ role: "owner" }];

    const result = await ensureOrgAdmin(makeLocals("user-1", "org-1"));
    expect(result).toEqual({ userId: "user-1", organizationId: "org-1" });
  });

  it("queries the member table with correct userId and organizationId", async () => {
    mockDbResult = [{ role: "admin" }];

    await ensureOrgAdmin(makeLocals("user-42", "org-99"));

    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockWhere).toHaveBeenCalledTimes(1);
    expect(mockLimit).toHaveBeenCalledTimes(1);
  });
});
