import { createOrganizationPolicy } from "./shared.policy";

type OrgScopedTable = {
  organizationId: unknown;
};

export const organizationSmtpConfigPolicies = {
  organizationSmtpConfig: (table: OrgScopedTable) => [
    createOrganizationPolicy(
      "organizationSmtpConfig_org_policy",
      table.organizationId
    ),
  ],
};
