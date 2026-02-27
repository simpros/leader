import { APIError } from "better-auth";
import { getLogger } from "@leader/logging";
import { auth } from "@leader/auth";
import { and, db, eq, schema } from "@leader/db";
import { env } from "$env/dynamic/private";

const logger = getLogger(["leader", "web", "bootstrap"]);

const BOOTSTRAP_USER_NAME = env.BOOTSTRAP_USER_NAME ?? "Admin";
const BOOTSTRAP_USER_EMAIL =
  env.BOOTSTRAP_USER_EMAIL ?? "admin@leader.local";
const BOOTSTRAP_ORGANIZATION_NAME =
  env.BOOTSTRAP_ORGANIZATION_NAME ?? "Leader";
const BOOTSTRAP_ORGANIZATION_SLUG =
  env.BOOTSTRAP_ORGANIZATION_SLUG ?? "leader";

export const ensureInitialUserWithOrganization = async () => {
  const [existingOrganization] = await db
    .select({ id: schema.organization.id })
    .from(schema.organization)
    .where(eq(schema.organization.slug, BOOTSTRAP_ORGANIZATION_SLUG))
    .limit(1);

  const organizationId =
    existingOrganization?.id ??
    (
      await db
        .insert(schema.organization)
        .values({
          id: crypto.randomUUID(),
          name: BOOTSTRAP_ORGANIZATION_NAME,
          slug: BOOTSTRAP_ORGANIZATION_SLUG,
          createdAt: new Date(),
        })
        .returning({ id: schema.organization.id })
    )[0].id;

  let [bootstrapUser] = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.email, BOOTSTRAP_USER_EMAIL))
    .limit(1);

  if (!bootstrapUser) {
    const password = `${crypto.randomUUID()}!Aa1`;
    try {
      await auth.api.createUser({
        body: {
          name: BOOTSTRAP_USER_NAME,
          email: BOOTSTRAP_USER_EMAIL,
          password,
          role: "admin",
        },
      });
      console.info(
        `[bootstrap] Initial user created for organization '${BOOTSTRAP_ORGANIZATION_SLUG}': ${BOOTSTRAP_USER_EMAIL}`
      );
      console.info(`[bootstrap] Initial user password: ${password}`);
      logger.info(
        "Initial user created for organization '{slug}': {email}",
        {
          slug: BOOTSTRAP_ORGANIZATION_SLUG,
          email: BOOTSTRAP_USER_EMAIL,
        }
      );
    } catch (error) {
      if (
        !(
          error instanceof APIError &&
          (error.body as { code?: string })?.code ===
            "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
        )
      ) {
        throw error;
      }
    }

    [bootstrapUser] = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.email, BOOTSTRAP_USER_EMAIL))
      .limit(1);
  }

  if (!bootstrapUser) {
    throw new Error("Bootstrap user could not be created.");
  }

  const [existingMembership] = await db
    .select({ id: schema.member.id })
    .from(schema.member)
    .where(
      and(
        eq(schema.member.userId, bootstrapUser.id),
        eq(schema.member.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!existingMembership) {
    await db.insert(schema.member).values({
      id: crypto.randomUUID(),
      organizationId,
      userId: bootstrapUser.id,
      role: "owner",
      createdAt: new Date(),
    });
  }
};
