import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { sql } from "drizzle-orm";
import { setupTestDb, teardownTestDb } from "./__tests__/setup";
import { organization } from "./auth-schema";
import type { Id } from "./id";
import { project } from "./schemas/projects.schema";
import { lead } from "./schemas/leads.schema";

type TestDb = Awaited<ReturnType<typeof setupTestDb>>["db"];
let db: TestDb;

const ORG_A_ID = "org-a-test";
const ORG_B_ID = "org-b-test";
const USER_ID = "user-test-1";

// Inline withRLS for tests using postgres.js driver (avoids importing bun-sql client)
async function testWithRLS<T>(
  database: TestDb,
  organizationId: string,
  callback: (tx: Parameters<Parameters<typeof database.transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  return await database.transaction(async (tx) => {
    // Switch to non-superuser role so RLS policies are enforced
    await tx.execute(sql`SET LOCAL ROLE app_user`);
    await tx.execute(
      sql`select set_config('app.current_org_id', ${organizationId}, true)`
    );
    return await callback(tx);
  });
}

beforeAll(async () => {
  const setup = await setupTestDb();
  db = setup.db;

  // Enable RLS on the tables and force it for table owner (superuser)
  await db.execute(sql`ALTER TABLE project ENABLE ROW LEVEL SECURITY`);
  await db.execute(sql`ALTER TABLE project FORCE ROW LEVEL SECURITY`);
  await db.execute(sql`ALTER TABLE lead ENABLE ROW LEVEL SECURITY`);
  await db.execute(sql`ALTER TABLE lead FORCE ROW LEVEL SECURITY`);
  await db.execute(sql`ALTER TABLE project_lead ENABLE ROW LEVEL SECURITY`);
  await db.execute(sql`ALTER TABLE project_lead FORCE ROW LEVEL SECURITY`);

  // Create a non-superuser role (superusers bypass RLS entirely)
  await db.execute(sql`CREATE ROLE app_user WITH LOGIN PASSWORD 'app_user'`);
  await db.execute(
    sql`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user`
  );

  // Seed organizations
  await db.insert(organization).values([
    {
      id: ORG_A_ID,
      name: "Org A",
      slug: "org-a",
      createdAt: new Date(),
    },
    {
      id: ORG_B_ID,
      name: "Org B",
      slug: "org-b",
      createdAt: new Date(),
    },
  ]);

  // Seed a user (needed for project FK)
  await db.execute(sql`
    INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
    VALUES (${USER_ID}, 'Test User', 'test@test.com', true, NOW(), NOW())
  `);
}, 120_000);

afterAll(async () => {
  await teardownTestDb();
});

describe("withRLS", () => {
  it("sets current_org_id config within transaction", async () => {
    const result = await testWithRLS(db, ORG_A_ID, async (tx) => {
      const rows = await tx.execute(
        sql`SELECT current_setting('app.current_org_id', true) as org_id`
      );
      return rows;
    });

    expect(result).toHaveLength(1);
    expect(result[0].org_id).toBe(ORG_A_ID);
  });

  it("filters projects by organization via RLS", async () => {
    // Insert projects for both orgs (bypasses RLS since no SET is applied)
    await db.insert(project).values([
      {
        id: "prj_org_a_test_00001" as Id<"project">,
        organizationId: ORG_A_ID,
        name: "Project A",
        userId: USER_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prj_org_b_test_00001" as Id<"project">,
        organizationId: ORG_B_ID,
        name: "Project B",
        userId: USER_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Query as Org A - should only see Org A's project
    const orgAProjects = await testWithRLS(db, ORG_A_ID, async (tx) => {
      return tx.select().from(project);
    });

    expect(orgAProjects).toHaveLength(1);
    expect(orgAProjects[0].name).toBe("Project A");
    expect(orgAProjects[0].organizationId).toBe(ORG_A_ID);

    // Query as Org B - should only see Org B's project
    const orgBProjects = await testWithRLS(db, ORG_B_ID, async (tx) => {
      return tx.select().from(project);
    });

    expect(orgBProjects).toHaveLength(1);
    expect(orgBProjects[0].name).toBe("Project B");
    expect(orgBProjects[0].organizationId).toBe(ORG_B_ID);
  });

  it("prevents cross-org data access for leads", async () => {
    await db.insert(lead).values([
      {
        id: "led_org_a_test_0001" as Id<"lead">,
        organizationId: ORG_A_ID,
        placeId: "place-a-1",
        name: "Lead A",
        createdAt: new Date(),
      },
      {
        id: "led_org_b_test_0001" as Id<"lead">,
        organizationId: ORG_B_ID,
        placeId: "place-b-1",
        name: "Lead B",
        createdAt: new Date(),
      },
    ]);

    const orgALeads = await testWithRLS(db, ORG_A_ID, async (tx) => {
      return tx.select().from(lead);
    });

    expect(orgALeads).toHaveLength(1);
    expect(orgALeads[0].name).toBe("Lead A");

    const orgBLeads = await testWithRLS(db, ORG_B_ID, async (tx) => {
      return tx.select().from(lead);
    });

    expect(orgBLeads).toHaveLength(1);
    expect(orgBLeads[0].name).toBe("Lead B");
  });

  it("allows insert within correct org context", async () => {
    const newLead = await testWithRLS(db, ORG_A_ID, async (tx) => {
      return tx
        .insert(lead)
        .values({
          id: "led_rls_insert_001" as Id<"lead">,
          organizationId: ORG_A_ID,
          placeId: "place-rls-test",
          name: "RLS Insert Test",
          createdAt: new Date(),
        })
        .returning();
    });

    expect(newLead).toHaveLength(1);
    expect(newLead[0].name).toBe("RLS Insert Test");
  });
});
