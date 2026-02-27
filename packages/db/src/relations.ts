import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session({
      from: r.user.id,
      to: r.session.userId,
    }),
    accounts: r.many.account({
      from: r.user.id,
      to: r.account.userId,
    }),
    members: r.many.member({
      from: r.user.id,
      to: r.member.userId,
    }),
    invitations: r.many.invitation({
      from: r.user.id,
      to: r.invitation.inviterId,
    }),
    projects: r.many.project({
      from: r.user.id,
      to: r.project.userId,
    }),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },
  organization: {
    members: r.many.member({
      from: r.organization.id,
      to: r.member.organizationId,
    }),
    invitations: r.many.invitation({
      from: r.organization.id,
      to: r.invitation.organizationId,
    }),
    projects: r.many.project({
      from: r.organization.id,
      to: r.project.organizationId,
    }),
    projectCustomFields: r.many.projectCustomField({
      from: r.organization.id,
      to: r.projectCustomField.organizationId,
    }),
    leads: r.many.lead({
      from: r.organization.id,
      to: r.lead.organizationId,
    }),
    projectLeads: r.many.projectLead({
      from: r.organization.id,
      to: r.projectLead.organizationId,
    }),
    leadCustomFieldValues: r.many.leadCustomFieldValue({
      from: r.organization.id,
      to: r.leadCustomFieldValue.organizationId,
    }),
    initiatives: r.many.initiative({
      from: r.organization.id,
      to: r.initiative.organizationId,
    }),
    initiativeLeads: r.many.initiativeLead({
      from: r.organization.id,
      to: r.initiativeLead.organizationId,
    }),
    initiativeConversations: r.many.initiativeConversation({
      from: r.organization.id,
      to: r.initiativeConversation.organizationId,
    }),
  },
  member: {
    organization: r.one.organization({
      from: r.member.organizationId,
      to: r.organization.id,
    }),
    user: r.one.user({
      from: r.member.userId,
      to: r.user.id,
    }),
  },
  invitation: {
    organization: r.one.organization({
      from: r.invitation.organizationId,
      to: r.organization.id,
    }),
    user: r.one.user({
      from: r.invitation.inviterId,
      to: r.user.id,
    }),
  },
  project: {
    organization: r.one.organization({
      from: r.project.organizationId,
      to: r.organization.id,
    }),
    user: r.one.user({
      from: r.project.userId,
      to: r.user.id,
    }),
    projectLeads: r.many.projectLead({
      from: r.project.id,
      to: r.projectLead.projectId,
    }),
    customFields: r.many.projectCustomField({
      from: r.project.id,
      to: r.projectCustomField.projectId,
    }),
    initiatives: r.many.initiative({
      from: r.project.id,
      to: r.initiative.projectId,
    }),
  },
  lead: {
    organization: r.one.organization({
      from: r.lead.organizationId,
      to: r.organization.id,
    }),
    projectLeads: r.many.projectLead({
      from: r.lead.id,
      to: r.projectLead.leadId,
    }),
    customFieldValues: r.many.leadCustomFieldValue({
      from: r.lead.id,
      to: r.leadCustomFieldValue.leadId,
    }),
    initiativeLeads: r.many.initiativeLead({
      from: r.lead.id,
      to: r.initiativeLead.leadId,
    }),
  },
  projectLead: {
    organization: r.one.organization({
      from: r.projectLead.organizationId,
      to: r.organization.id,
    }),
    project: r.one.project({
      from: r.projectLead.projectId,
      to: r.project.id,
    }),
    lead: r.one.lead({
      from: r.projectLead.leadId,
      to: r.lead.id,
    }),
  },
  projectCustomField: {
    organization: r.one.organization({
      from: r.projectCustomField.organizationId,
      to: r.organization.id,
    }),
    project: r.one.project({
      from: r.projectCustomField.projectId,
      to: r.project.id,
    }),
    values: r.many.leadCustomFieldValue({
      from: r.projectCustomField.id,
      to: r.leadCustomFieldValue.projectCustomFieldId,
    }),
  },
  leadCustomFieldValue: {
    organization: r.one.organization({
      from: r.leadCustomFieldValue.organizationId,
      to: r.organization.id,
    }),
    lead: r.one.lead({
      from: r.leadCustomFieldValue.leadId,
      to: r.lead.id,
    }),
    field: r.one.projectCustomField({
      from: r.leadCustomFieldValue.projectCustomFieldId,
      to: r.projectCustomField.id,
    }),
  },
  initiative: {
    organization: r.one.organization({
      from: r.initiative.organizationId,
      to: r.organization.id,
    }),
    project: r.one.project({
      from: r.initiative.projectId,
      to: r.project.id,
    }),
    initiativeLeads: r.many.initiativeLead({
      from: r.initiative.id,
      to: r.initiativeLead.initiativeId,
    }),
  },
  initiativeLead: {
    organization: r.one.organization({
      from: r.initiativeLead.organizationId,
      to: r.organization.id,
    }),
    initiative: r.one.initiative({
      from: r.initiativeLead.initiativeId,
      to: r.initiative.id,
    }),
    lead: r.one.lead({
      from: r.initiativeLead.leadId,
      to: r.lead.id,
    }),
    conversations: r.many.initiativeConversation({
      from: r.initiativeLead.id,
      to: r.initiativeConversation.initiativeLeadId,
    }),
  },
  initiativeConversation: {
    organization: r.one.organization({
      from: r.initiativeConversation.organizationId,
      to: r.organization.id,
    }),
    initiativeLead: r.one.initiativeLead({
      from: r.initiativeConversation.initiativeLeadId,
      to: r.initiativeLead.id,
    }),
  },
}));
