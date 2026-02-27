import { createOrganizationPolicy } from "./shared.policy";

type OrgScopedTable = {
  organizationId: unknown;
};

export const initiativePolicies = {
  initiative: (table: OrgScopedTable) => [
    createOrganizationPolicy(
      "initiative_org_policy",
      table.organizationId
    ),
  ],
  initiativeLead: (table: OrgScopedTable) => [
    createOrganizationPolicy(
      "initiativeLead_org_policy",
      table.organizationId
    ),
  ],
  initiativeConversation: (table: OrgScopedTable) => [
    createOrganizationPolicy(
      "initiativeConversation_org_policy",
      table.organizationId
    ),
  ],
};
