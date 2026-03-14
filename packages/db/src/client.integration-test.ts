import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { sql } from "drizzle-orm";
import { setupTestDb, teardownTestDb } from "./__tests__/setup";
import { organization } from "./auth-schema";
import type { Id } from "./id";
import { project, projectCustomField } from "./schemas/projects.schema";
import {
  lead,
  projectLead,
  leadCustomFieldValue,
} from "./schemas/leads.schema";
import {
  initiative,
  initiativeLead,
  initiativeConversation,
} from "./schemas/initiatives.schema";

type TestDb = Awaited<ReturnType<typeof setupTestDb>>["db"];
let db: TestDb;

const ORG_A_ID = "org-a-test";
const ORG_B_ID = "org-b-test";
const USER_ID = "user-test-1";

// All tables that have RLS enabled via pgTable.withRLS
const RLS_TABLES = [
  "project",
  "project_custom_field",
  "lead",
  "project_lead",
  "lead_custom_field_value",
  "initiative",
  "initiative_lead",
  "initiative_conversation",
] as const;

// Inline withRLS for tests using postgres.js driver (avoids importing bun-sql client)
async function testWithRLS<T>(
  database: TestDb,
  organizationId: string,
  callback: (
    tx: Parameters<Parameters<typeof database.transaction>[0]>[0]
  ) => Promise<T>
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

// Run as app_user without setting any org context (fail-closed test)
async function testWithoutOrgContext<T>(
  database: TestDb,
  callback: (
    tx: Parameters<Parameters<typeof database.transaction>[0]>[0]
  ) => Promise<T>
): Promise<T> {
  return await database.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL ROLE app_user`);
    return await callback(tx);
  });
}

// Integration tests require Docker (testcontainers) and only run via test:integration
const runIntegration = process.env.INTEGRATION === "1";

if (runIntegration) {
  describe("withRLS (integration)", () => {
    beforeAll(async () => {
      const setup = await setupTestDb();
      db = setup.db;

      // Enable and force RLS on all tenant-scoped tables
      for (const table of RLS_TABLES) {
        await db.execute(
          sql.raw(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`)
        );
        await db.execute(
          sql.raw(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`)
        );
      }

      // Create a non-superuser role (superusers bypass RLS entirely)
      await db.execute(
        sql`CREATE ROLE app_user WITH LOGIN PASSWORD 'app_user'`
      );
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

      // Seed projects for both orgs (bypasses RLS since superuser, no SET applied)
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

      // Seed leads for both orgs
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
    }, 120_000);

    afterAll(async () => {
      await teardownTestDb();
    });

    // ── Core mechanism ────────────────────────────────────────────────

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

    // ── Project isolation ─────────────────────────────────────────────

    it("filters projects by organization via RLS", async () => {
      const orgAProjects = await testWithRLS(db, ORG_A_ID, async (tx) => {
        return tx.select().from(project);
      });

      expect(orgAProjects).toHaveLength(1);
      expect(orgAProjects[0].name).toBe("Project A");
      expect(orgAProjects[0].organizationId).toBe(ORG_A_ID);

      const orgBProjects = await testWithRLS(db, ORG_B_ID, async (tx) => {
        return tx.select().from(project);
      });

      expect(orgBProjects).toHaveLength(1);
      expect(orgBProjects[0].name).toBe("Project B");
      expect(orgBProjects[0].organizationId).toBe(ORG_B_ID);
    });

    // ── Lead isolation ────────────────────────────────────────────────

    it("prevents cross-org data access for leads", async () => {
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

    // ── Project-lead join isolation ───────────────────────────────────

    it("isolates project_lead associations by organization", async () => {
      await db.insert(projectLead).values([
        {
          id: "pl_org_a_test_0001" as Id<"projectLead">,
          organizationId: ORG_A_ID,
          projectId: "prj_org_a_test_00001" as Id<"project">,
          leadId: "led_org_a_test_0001" as Id<"lead">,
          createdAt: new Date(),
        },
        {
          id: "pl_org_b_test_0001" as Id<"projectLead">,
          organizationId: ORG_B_ID,
          projectId: "prj_org_b_test_00001" as Id<"project">,
          leadId: "led_org_b_test_0001" as Id<"lead">,
          createdAt: new Date(),
        },
      ]);

      const orgALinks = await testWithRLS(db, ORG_A_ID, async (tx) => {
        return tx.select().from(projectLead);
      });

      expect(orgALinks).toHaveLength(1);
      expect(orgALinks[0].organizationId).toBe(ORG_A_ID);

      const orgBLinks = await testWithRLS(db, ORG_B_ID, async (tx) => {
        return tx.select().from(projectLead);
      });

      expect(orgBLinks).toHaveLength(1);
      expect(orgBLinks[0].organizationId).toBe(ORG_B_ID);
    });

    // ── Project custom field isolation ────────────────────────────────

    it("isolates project custom fields by organization", async () => {
      await db.insert(projectCustomField).values([
        {
          id: "pcf_org_a_test_001" as Id<"projectCustomField">,
          organizationId: ORG_A_ID,
          projectId: "prj_org_a_test_00001" as Id<"project">,
          name: "Field A",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "pcf_org_b_test_001" as Id<"projectCustomField">,
          organizationId: ORG_B_ID,
          projectId: "prj_org_b_test_00001" as Id<"project">,
          name: "Field B",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const orgAFields = await testWithRLS(db, ORG_A_ID, async (tx) => {
        return tx.select().from(projectCustomField);
      });

      expect(orgAFields).toHaveLength(1);
      expect(orgAFields[0].name).toBe("Field A");

      const orgBFields = await testWithRLS(db, ORG_B_ID, async (tx) => {
        return tx.select().from(projectCustomField);
      });

      expect(orgBFields).toHaveLength(1);
      expect(orgBFields[0].name).toBe("Field B");
    });

    // ── Lead custom field value isolation ─────────────────────────────

    it("isolates lead custom field values by organization", async () => {
      await db.insert(leadCustomFieldValue).values([
        {
          id: "lcfv_org_a_test_01" as Id<"leadCustomFieldValue">,
          organizationId: ORG_A_ID,
          leadId: "led_org_a_test_0001" as Id<"lead">,
          projectCustomFieldId: "pcf_org_a_test_001" as Id<"projectCustomField">,
          value: "Value A",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "lcfv_org_b_test_01" as Id<"leadCustomFieldValue">,
          organizationId: ORG_B_ID,
          leadId: "led_org_b_test_0001" as Id<"lead">,
          projectCustomFieldId: "pcf_org_b_test_001" as Id<"projectCustomField">,
          value: "Value B",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const orgAValues = await testWithRLS(db, ORG_A_ID, async (tx) => {
        return tx.select().from(leadCustomFieldValue);
      });

      expect(orgAValues).toHaveLength(1);
      expect(orgAValues[0].value).toBe("Value A");

      const orgBValues = await testWithRLS(db, ORG_B_ID, async (tx) => {
        return tx.select().from(leadCustomFieldValue);
      });

      expect(orgBValues).toHaveLength(1);
      expect(orgBValues[0].value).toBe("Value B");
    });

    // ── Initiative isolation ──────────────────────────────────────────

    it("isolates initiatives by organization", async () => {
      await db.insert(initiative).values([
        {
          id: "ini_org_a_test_0001" as Id<"initiative">,
          organizationId: ORG_A_ID,
          projectId: "prj_org_a_test_00001" as Id<"project">,
          type: "email",
          title: "Initiative A",
          subject: "Subject A",
          htmlBody: "<p>Body A</p>",
          status: "draft",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "ini_org_b_test_0001" as Id<"initiative">,
          organizationId: ORG_B_ID,
          projectId: "prj_org_b_test_00001" as Id<"project">,
          type: "email",
          title: "Initiative B",
          subject: "Subject B",
          htmlBody: "<p>Body B</p>",
          status: "draft",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const orgAInitiatives = await testWithRLS(db, ORG_A_ID, async (tx) => {
        return tx.select().from(initiative);
      });

      expect(orgAInitiatives).toHaveLength(1);
      expect(orgAInitiatives[0].title).toBe("Initiative A");

      const orgBInitiatives = await testWithRLS(db, ORG_B_ID, async (tx) => {
        return tx.select().from(initiative);
      });

      expect(orgBInitiatives).toHaveLength(1);
      expect(orgBInitiatives[0].title).toBe("Initiative B");
    });

    // ── Initiative-lead isolation ─────────────────────────────────────

    it("isolates initiative_lead by organization", async () => {
      await db.insert(initiativeLead).values([
        {
          id: "il_org_a_test_00001" as Id<"initiativeLead">,
          organizationId: ORG_A_ID,
          initiativeId: "ini_org_a_test_0001" as Id<"initiative">,
          leadId: "led_org_a_test_0001" as Id<"lead">,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "il_org_b_test_00001" as Id<"initiativeLead">,
          organizationId: ORG_B_ID,
          initiativeId: "ini_org_b_test_0001" as Id<"initiative">,
          leadId: "led_org_b_test_0001" as Id<"lead">,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const orgALinks = await testWithRLS(db, ORG_A_ID, async (tx) => {
        return tx.select().from(initiativeLead);
      });

      expect(orgALinks).toHaveLength(1);
      expect(orgALinks[0].organizationId).toBe(ORG_A_ID);

      const orgBLinks = await testWithRLS(db, ORG_B_ID, async (tx) => {
        return tx.select().from(initiativeLead);
      });

      expect(orgBLinks).toHaveLength(1);
      expect(orgBLinks[0].organizationId).toBe(ORG_B_ID);
    });

    // ── Initiative conversation isolation ─────────────────────────────

    it("isolates initiative_conversation by organization", async () => {
      await db.insert(initiativeConversation).values([
        {
          id: "ic_org_a_test_00001" as Id<"initiativeConversation">,
          organizationId: ORG_A_ID,
          initiativeLeadId: "il_org_a_test_00001" as Id<"initiativeLead">,
          direction: "outbound",
          subject: "Convo A",
          htmlBody: "<p>Message A</p>",
          createdAt: new Date(),
        },
        {
          id: "ic_org_b_test_00001" as Id<"initiativeConversation">,
          organizationId: ORG_B_ID,
          initiativeLeadId: "il_org_b_test_00001" as Id<"initiativeLead">,
          direction: "outbound",
          subject: "Convo B",
          htmlBody: "<p>Message B</p>",
          createdAt: new Date(),
        },
      ]);

      const orgAConvos = await testWithRLS(db, ORG_A_ID, async (tx) => {
        return tx.select().from(initiativeConversation);
      });

      expect(orgAConvos).toHaveLength(1);
      expect(orgAConvos[0].subject).toBe("Convo A");

      const orgBConvos = await testWithRLS(db, ORG_B_ID, async (tx) => {
        return tx.select().from(initiativeConversation);
      });

      expect(orgBConvos).toHaveLength(1);
      expect(orgBConvos[0].subject).toBe("Convo B");
    });

    // ── Insert tests ──────────────────────────────────────────────────

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

    it("rejects insert for a different organization", async () => {
      // Org A context trying to insert a lead belonging to Org B
      expect(
        testWithRLS(db, ORG_A_ID, async (tx) => {
          return tx
            .insert(lead)
            .values({
              id: "led_cross_org_0001" as Id<"lead">,
              organizationId: ORG_B_ID,
              placeId: "place-cross-org",
              name: "Cross Org Lead",
              createdAt: new Date(),
            })
            .returning();
        })
      ).rejects.toThrow();
    });

    // ── Fail-closed: no org context ───────────────────────────────────

    it("returns no rows when org context is not set (fail-closed)", async () => {
      const projects = await testWithoutOrgContext(db, async (tx) => {
        return tx.select().from(project);
      });
      expect(projects).toHaveLength(0);

      const leads = await testWithoutOrgContext(db, async (tx) => {
        return tx.select().from(lead);
      });
      expect(leads).toHaveLength(0);

      const initiatives = await testWithoutOrgContext(db, async (tx) => {
        return tx.select().from(initiative);
      });
      expect(initiatives).toHaveLength(0);
    });
  });
}
