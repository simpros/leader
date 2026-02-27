import { createOrganizationPolicy } from "./shared.policy";

type OrgScopedTable = {
  organizationId: unknown;
};

export const leadPolicies = {
  lead: (table: OrgScopedTable) => [
    createOrganizationPolicy("lead_org_policy", table.organizationId),
  ],
  projectLead: (table: OrgScopedTable) => [
    createOrganizationPolicy(
      "projectLead_org_policy",
      table.organizationId
    ),
  ],
  leadCustomFieldValue: (table: OrgScopedTable) => [
    createOrganizationPolicy(
      "leadCustomFieldValue_org_policy",
      table.organizationId
    ),
  ],
};
