import type { LayoutServerLoad } from "./$types";
import { db, eq, and, schema } from "@leader/db";

export const load: LayoutServerLoad = async ({ locals }) => {
  let memberRole: string | null = null;
  let organizations: { id: string; name: string; slug: string }[] = [];

  if (locals.session?.activeOrganizationId && locals.user) {
    const [membership] = await db
      .select({ role: schema.member.role })
      .from(schema.member)
      .where(
        and(
          eq(schema.member.userId, locals.user.id),
          eq(
            schema.member.organizationId,
            locals.session.activeOrganizationId
          )
        )
      )
      .limit(1);
    memberRole = membership?.role ?? null;
  }

  if (locals.user) {
    const memberships = await db
      .select({
        orgId: schema.organization.id,
        orgName: schema.organization.name,
        orgSlug: schema.organization.slug,
      })
      .from(schema.member)
      .innerJoin(
        schema.organization,
        eq(schema.member.organizationId, schema.organization.id)
      )
      .where(eq(schema.member.userId, locals.user.id));

    organizations = memberships.map((m) => ({
      id: m.orgId,
      name: m.orgName,
      slug: m.orgSlug,
    }));
  }

  return {
    session: locals.session,
    user: locals.user,
    requestLocale: locals.requestLocale,
    memberRole,
    organizations,
  };
};
