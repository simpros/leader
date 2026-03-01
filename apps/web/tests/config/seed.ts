import type { AppDatabase } from "@leader/db";

export const TEST_USER = {
  name: "Test User",
  email: "test@leader.local",
  password: "Test@123456",
};

export const TEST_ADMIN = {
  name: "Test Admin",
  email: "testadmin@leader.local",
  password: "Admin@123456",
};

/**
 * Create test users and organization using better-auth API + direct DB.
 * Mirrors the pattern from apps/web/src/seed.ts.
 */
export async function createTestUsers(): Promise<void> {
  const { auth } = await import("@leader/auth");
  const { db, eq, schema } = await import("@leader/db");

  console.log("👤 Creating test users...");

  // Create regular test user
  try {
    await auth.api.createUser({
      body: {
        name: TEST_USER.name,
        email: TEST_USER.email,
        password: TEST_USER.password,
        role: "user",
      },
    });
  } catch (error: unknown) {
    const body = (error as { body?: { code?: string } })?.body;
    if (body?.code !== "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") throw error;
  }

  // Create admin test user
  try {
    await auth.api.createUser({
      body: {
        name: TEST_ADMIN.name,
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password,
        role: "admin",
      },
    });
  } catch (error: unknown) {
    const body = (error as { body?: { code?: string } })?.body;
    if (body?.code !== "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") throw error;
  }

  console.log("✅ Test users created");

  // Ensure organization exists
  console.log("🏢 Ensuring organization...");

  const [existingOrg] = await db
    .select({ id: schema.organization.id })
    .from(schema.organization)
    .where(eq(schema.organization.slug, "leader"))
    .limit(1);

  const orgId =
    existingOrg?.id ??
    (
      await db
        .insert(schema.organization)
        .values({
          id: crypto.randomUUID(),
          name: "Leader",
          slug: "leader",
          createdAt: new Date(),
        })
        .returning({ id: schema.organization.id })
    )[0].id;

  // Add both users as members
  for (const u of [
    { ...TEST_USER, role: "member" as const },
    { ...TEST_ADMIN, role: "owner" as const },
  ]) {
    const [dbUser] = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.email, u.email))
      .limit(1);

    if (!dbUser) continue;

    const [existing] = await db
      .select({ id: schema.member.id })
      .from(schema.member)
      .where(eq(schema.member.userId, dbUser.id))
      .limit(1);

    if (!existing) {
      await db.insert(schema.member).values({
        id: crypto.randomUUID(),
        organizationId: orgId,
        userId: dbUser.id,
        role: u.role,
        createdAt: new Date(),
      });
    }
  }

  console.log("✅ Organization & memberships ready");
}
