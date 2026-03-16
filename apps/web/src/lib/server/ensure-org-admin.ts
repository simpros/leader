import { db, eq, and, schema } from "@leader/db";
import { error } from "@sveltejs/kit";

export const ensureOrgAdmin = async (locals: App.Locals) => {
  const userId = locals.user?.id;
  const organizationId = locals.session?.activeOrganizationId;
  if (!userId || !organizationId) throw error(401, "Unauthorized");

  const [membership] = await db
    .select({ role: schema.member.role })
    .from(schema.member)
    .where(
      and(
        eq(schema.member.userId, userId),
        eq(schema.member.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!membership || (membership.role !== "admin" && membership.role !== "owner"))
    throw error(403, "You must be an organization admin to perform this action");

  return { userId, organizationId };
};
