import type { LayoutServerLoad } from "./$types";
import { db, eq, and, schema } from "@leader/db";

export const load: LayoutServerLoad = async ({ locals }) => {
  let memberRole: string | null = null;

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

  return {
    session: locals.session,
    user: locals.user,
    requestLocale: locals.requestLocale,
    memberRole,
  };
};
