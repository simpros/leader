import { APIError } from "better-auth";
import { db, eq, runMigrations, schema } from "@leader/db";
import { auth } from "@leader/auth";

type SeedUser = {
  name: string;
  email: string;
  password: string;
  role?: "user" | "admin";
};

const ensureUser = async (user: SeedUser) => {
  try {
    await auth.api.createUser({
      body: {
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
      },
    });

    return { email: user.email, status: "created" } as const;
  } catch (error) {
    if (
      error instanceof APIError &&
      (error.body as { code?: string })?.code ===
        "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
    ) {
      return { email: user.email, status: "exists" } as const;
    }

    throw error;
  }
};

const ensureOrganization = async (name: string, slug: string) => {
  const [existing] = await db
    .select({ id: schema.organization.id })
    .from(schema.organization)
    .where(eq(schema.organization.slug, slug))
    .limit(1);

  if (existing) {
    console.info(`exists: organization '${slug}'`);
    return existing.id;
  }

  const [org] = await db
    .insert(schema.organization)
    .values({
      id: crypto.randomUUID(),
      name,
      slug,
      createdAt: new Date(),
    })
    .returning({ id: schema.organization.id });

  console.info(`created: organization '${slug}'`);
  return org.id;
};

const ensureMember = async (
  userId: string,
  organizationId: string,
  role: "owner" | "admin" | "member" = "member"
) => {
  const [existing] = await db
    .select({ id: schema.member.id })
    .from(schema.member)
    .where(eq(schema.member.userId, userId))
    .limit(1);

  if (existing) {
    console.info(`exists: member ${userId} in org ${organizationId}`);
    return;
  }

  await db.insert(schema.member).values({
    id: crypto.randomUUID(),
    organizationId,
    userId,
    role,
    createdAt: new Date(),
  });

  console.info(`created: member ${userId} in org ${organizationId}`);
};

const run = async () => {
  const users: SeedUser[] = [
    {
      name: "Admin",
      email: "admin@leader.local",
      password: "Test@1234",
      role: "admin",
    },
    {
      name: "User",
      email: "user@leader.local",
      password: "Test@1234",
      role: "user",
    },
  ];

  await runMigrations();

  const orgId = await ensureOrganization("Leader", "leader");

  for (const user of users) {
    const result = await ensureUser(user);
    console.info(`${result.status}: ${result.email}`);

    const [dbUser] = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.email, user.email))
      .limit(1);

    if (dbUser) {
      const role = user.role === "admin" ? "owner" : "member";
      await ensureMember(dbUser.id, orgId, role);
    }
  }
};

run().catch((error) => {
  console.error("Failed to seed users.");
  console.error(error);
  process.exitCode = 1;
});
