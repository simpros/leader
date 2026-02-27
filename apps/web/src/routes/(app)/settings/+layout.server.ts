import type { LayoutServerLoad } from "./$types";
import { db, eq, schema } from "@leader/db";

export const load: LayoutServerLoad = async ({ parent }) => {
  const { session } = await parent();

  let organization = null;
  if (session?.activeOrganizationId) {
    const [org] = await db
      .select()
      .from(schema.organization)
      .where(eq(schema.organization.id, session.activeOrganizationId))
      .limit(1);
    organization = org ?? null;
  }

  return { organization };
};
