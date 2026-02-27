import { createOrganizationPolicy } from "./shared.policy";

type OrgScopedTable = {
  organizationId: unknown;
};

export const projectPolicies = {
  project: (table: OrgScopedTable) => [
    createOrganizationPolicy("project_org_policy", table.organizationId),
  ],
  projectCustomField: (table: OrgScopedTable) => [
    createOrganizationPolicy(
      "projectCustomField_org_policy",
      table.organizationId
    ),
  ],
};
