import { TEST_USER, TEST_ADMIN, TEST_INVITATION, TEST_SECOND_ORG } from "../fixtures/credentials";

export { TEST_USER, TEST_ADMIN, TEST_INVITATION, TEST_SECOND_ORG };

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

  // Create a pending invitation for E2E testing
  console.log("📧 Ensuring pending invitation...");

  const [adminUser] = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.email, TEST_ADMIN.email))
    .limit(1);

  if (adminUser) {
    const [existingInvitation] = await db
      .select({ id: schema.invitation.id })
      .from(schema.invitation)
      .where(eq(schema.invitation.id, TEST_INVITATION.id))
      .limit(1);

    if (!existingInvitation) {
      await db.insert(schema.invitation).values({
        id: TEST_INVITATION.id,
        organizationId: orgId,
        email: TEST_INVITATION.email,
        role: "member",
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        inviterId: adminUser.id,
      });
    }
  }

  console.log("✅ Pending invitation ready");

  // Create second organization for multi-org testing (org switcher)
  console.log("🏢 Ensuring second organization...");

  const [existingSecondOrg] = await db
    .select({ id: schema.organization.id })
    .from(schema.organization)
    .where(eq(schema.organization.slug, TEST_SECOND_ORG.slug))
    .limit(1);

  const secondOrgId =
    existingSecondOrg?.id ??
    (
      await db
        .insert(schema.organization)
        .values({
          id: crypto.randomUUID(),
          name: TEST_SECOND_ORG.name,
          slug: TEST_SECOND_ORG.slug,
          createdAt: new Date(),
        })
        .returning({ id: schema.organization.id })
    )[0].id;

  // Add admin as owner of the second org (so org switcher appears)
  if (adminUser) {
    const [existingMembership] = await db
      .select({ id: schema.member.id })
      .from(schema.member)
      .where(
        eq(schema.member.userId, adminUser.id),
      )
      .limit(2);

    // Only add if admin doesn't already have a membership in the second org
    const adminMemberships = await db
      .select({ id: schema.member.id, organizationId: schema.member.organizationId })
      .from(schema.member)
      .where(eq(schema.member.userId, adminUser.id));

    const hasSecondOrg = adminMemberships.some(
      (m) => m.organizationId === secondOrgId
    );

    if (!hasSecondOrg) {
      await db.insert(schema.member).values({
        id: crypto.randomUUID(),
        organizationId: secondOrgId,
        userId: adminUser.id,
        role: "owner",
        createdAt: new Date(),
      });
    }
  }

  console.log("✅ Second organization & admin membership ready");
}
