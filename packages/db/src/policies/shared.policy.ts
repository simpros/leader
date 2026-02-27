import { sql } from "drizzle-orm";
import { pgPolicy } from "drizzle-orm/pg-core";

export const createOrganizationPolicy = (
  policyName: string,
  organizationIdColumn: unknown
) =>
  pgPolicy(policyName, {
    as: "permissive",
    for: "all",
    using: sql`${organizationIdColumn} = current_setting('app.current_org_id', true)`,
  });
