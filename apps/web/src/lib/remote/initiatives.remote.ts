import { command, form, getRequestEvent, query } from "$app/server";
import { env } from "$env/dynamic/private";
import {
  and,
  db,
  desc,
  eq,
  inArray,
  initiativeIdSchema,
  initiativeLeadIdSchema,
  projectIdSchema,
  schema,
  type Id,
} from "@leader/db";
import { error } from "@sveltejs/kit";
import * as v from "valibot";
import {
  createInitiativeEmailInputSchema,
  generateInitiativeEmailInputSchema,
  sendInitiativeTestEmailInputSchema,
} from "$lib/schemas";
import { sendEmail } from "$lib/server/email";
import {
  CORE_LEAD_VARIABLES,
  customFieldToken,
  resolveTemplate,
} from "$lib/components/template-variables";

const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY ?? "";
const OPENROUTER_MODEL = env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

const ensureProjectAccess = async (
  projectId: Id<"project">,
  userId: string,
  tx?: Parameters<Parameters<typeof db.transaction>[0]>[0]
) => {
  const dbClient = tx ?? db;
  const [project] = await dbClient
    .select({ id: schema.project.id })
    .from(schema.project)
    .where(
      and(
        eq(schema.project.id, projectId),
        eq(schema.project.userId, userId)
      )
    )
    .limit(1);

  if (!project) {
    throw error(404, "Project not found");
  }
};

export const getInitiativeCapabilities = query(async () => {
  return {
    aiGenerationAvailable: !!OPENROUTER_API_KEY,
  };
});

export const generateInitiativeEmail = command(
  generateInitiativeEmailInputSchema,
  async (input) => {
    const { locals } = getRequestEvent();
    const userId = locals.user?.id;
    const organizationId = locals.session?.activeOrganizationId;
    if (!userId || !organizationId) throw error(401, "Unauthorized");
    if (!OPENROUTER_API_KEY)
      throw error(400, "AI generation is not configured");

    const prompt = input.prompt.trim();
    if (!prompt) throw error(400, "Prompt is required");

    // DB work: access check + project/custom field read (short transaction)
    const { projectDescription, customFields } = await locals.db(
      async (tx) => {
        await ensureProjectAccess(input.projectId, userId, tx);

        const [project] = await tx
          .select({ description: schema.project.description })
          .from(schema.project)
          .where(eq(schema.project.id, input.projectId))
          .limit(1);

        const fields = await tx
          .select({ name: schema.projectCustomField.name })
          .from(schema.projectCustomField)
          .where(eq(schema.projectCustomField.projectId, input.projectId));

        return {
          projectDescription: project?.description ?? null,
          customFields: fields,
        };
      }
    );

    const availableVars = [
      ...CORE_LEAD_VARIABLES.map((v) => `${v.token} — ${v.description}`),
      ...customFields.map(
        (f) => `${customFieldToken(f.name)} — Custom field`
      ),
    ];

    const systemPrompt = [
      "You are an expert email copywriter for B2B outreach.",
      ...(projectDescription
        ? [
            `The sender's project/business is described as: "${projectDescription}". Use this context to tailor the email tone, value proposition, and relevance to the recipient.`,
          ]
        : []),
      "Write a professional, concise outreach email based on the user's instructions.",
      'Return JSON only in this exact format: {"subject":"...","htmlBody":"..."}',
      "The htmlBody must be valid HTML using <p>, <ul>, <li>, <strong>, <br> tags.",
      "You MUST use these template variables where appropriate (they will be replaced with real lead data):",
      ...availableVars.map((v) => `  - ${v}`),
      "If it makes sense, use {{lead.name}} to address the recipient.",
      "Keep the email under 200 words.",
      "Do not include placeholder text like [Your Name] — the user will fill those in.",
    ].join("\n");

    // Network call outside the transaction with a timeout
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(30_000),
      }
    );

    if (!response.ok) {
      throw error(502, "AI service returned an error. Try again.");
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw error(502, "AI returned an unexpected response");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw error(502, "AI response did not contain valid JSON");
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        subject?: string;
        htmlBody?: string;
      };

      if (!parsed.subject || !parsed.htmlBody) {
        throw error(502, "AI response missing subject or htmlBody");
      }

      return {
        subject: parsed.subject,
        htmlBody: parsed.htmlBody,
      };
    } catch (e) {
      if (e && typeof e === "object" && "status" in e) throw e;
      throw error(502, "Failed to parse AI response");
    }
  }
);

export const createInitiativeEmail = form(
  createInitiativeEmailInputSchema,
  async (input) => {
    const { locals } = getRequestEvent();
    const userId = locals.user?.id;
    const organizationId = locals.session?.activeOrganizationId;
    if (!userId || !organizationId) throw error(401, "Unauthorized");

    const title = input.title.trim();
    const subject = input.subject.trim();
    const htmlBody = input.htmlBody.trim();

    if (!title) throw error(400, "Initiative title is required");
    if (!subject) throw error(400, "Email subject is required");
    if (!htmlBody) throw error(400, "Email body is required");

    return locals.db(async (tx) => {
      await ensureProjectAccess(input.projectId, userId, tx);

      const now = new Date();

      const [initiative] = await tx
        .insert(schema.initiative)
        .values({
          organizationId,
          projectId: input.projectId,
          type: "email",
          title,
          subject,
          htmlBody,
          status: "draft",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return {
        initiativeId: initiative.id,
      };
    });
  }
);

export const sendInitiativeTestEmail = form(
  sendInitiativeTestEmailInputSchema,
  async (input) => {
    const { locals } = getRequestEvent();
    const userId = locals.user?.id;
    const userEmail = locals.user?.email?.trim();
    const organizationId = locals.session?.activeOrganizationId;
    if (!userId || !organizationId) throw error(401, "Unauthorized");
    if (!userEmail)
      throw error(400, "Signed-in user does not have an email address");

    const subject = input.subject.trim();
    const htmlBody = input.htmlBody.trim();

    if (!subject) throw error(400, "Email subject is required");
    if (!htmlBody) throw error(400, "Email body is required");

    return locals.db(async (tx) => {
      await ensureProjectAccess(input.projectId, userId, tx);

      const [lead] = await tx
        .select({
          id: schema.lead.id,
          placeId: schema.lead.placeId,
          email: schema.lead.email,
          name: schema.lead.name,
          phone: schema.lead.phone,
          website: schema.lead.website,
          address: schema.lead.address,
          rating: schema.lead.rating,
          googleMapsUrl: schema.lead.googleMapsUrl,
        })
        .from(schema.projectLead)
        .innerJoin(
          schema.lead,
          eq(schema.lead.id, schema.projectLead.leadId)
        )
        .where(
          and(
            eq(schema.projectLead.projectId, input.projectId),
            eq(schema.projectLead.leadId, input.leadId)
          )
        )
        .limit(1);

      if (!lead) {
        throw error(404, "Selected lead not found in this project");
      }

      const resolvedSubject = resolveTemplate(subject, lead, []);
      const resolvedHtmlBody = resolveTemplate(htmlBody, lead, []);
      await sendEmail(userEmail, resolvedSubject, resolvedHtmlBody);

      return {
        sentTo: userEmail,
      };
    });
  }
);

export const sendInitiative = form(
  v.object({ initiativeId: initiativeIdSchema }),
  async (input) => {
    const { locals } = getRequestEvent();
    const userId = locals.user?.id;
    const organizationId = locals.session?.activeOrganizationId;
    if (!userId || !organizationId) throw error(401, "Unauthorized");

    return locals.db(async (tx) => {
      const [initiative] = await tx
        .select({
          id: schema.initiative.id,
          projectId: schema.initiative.projectId,
          title: schema.initiative.title,
          subject: schema.initiative.subject,
          htmlBody: schema.initiative.htmlBody,
          status: schema.initiative.status,
        })
        .from(schema.initiative)
        .where(eq(schema.initiative.id, input.initiativeId))
        .limit(1);

      if (!initiative) {
        throw error(404, "Initiative not found");
      }

      await ensureProjectAccess(initiative.projectId, userId, tx);

      if (initiative.status === "sent") {
        throw error(400, "Initiative already sent");
      }

      const now = new Date();

      const leads = await tx
        .select({
          id: schema.lead.id,
          placeId: schema.lead.placeId,
          email: schema.lead.email,
          name: schema.lead.name,
          phone: schema.lead.phone,
          website: schema.lead.website,
          address: schema.lead.address,
          rating: schema.lead.rating,
          googleMapsUrl: schema.lead.googleMapsUrl,
        })
        .from(schema.projectLead)
        .innerJoin(
          schema.lead,
          eq(schema.lead.id, schema.projectLead.leadId)
        )
        .where(eq(schema.projectLead.projectId, initiative.projectId));

      let sentCount = 0;
      let missingEmailCount = 0;
      let errorCount = 0;

      for (const lead of leads) {
        const hasEmail = Boolean(lead.email?.trim());

        const resolvedSubject = resolveTemplate(
          initiative.subject,
          lead,
          []
        );
        const resolvedHtmlBody = resolveTemplate(
          initiative.htmlBody,
          lead,
          []
        );

        let sendStatus: string;
        let emailSentAt: Date | null = null;

        if (hasEmail) {
          try {
            await sendEmail(
              lead.email!,
              resolvedSubject,
              resolvedHtmlBody
            );
            sendStatus = "sent";
            emailSentAt = now;
          } catch {
            sendStatus = "error";
          }
        } else {
          sendStatus = "missing-email";
        }

        const [initiativeLead] = await tx
          .insert(schema.initiativeLead)
          .values({
            organizationId,
            initiativeId: initiative.id,
            leadId: lead.id,
            status: sendStatus,
            lastEmailSentAt: emailSentAt,
            createdAt: now,
            updatedAt: now,
          })
          .returning({
            id: schema.initiativeLead.id,
          });

        if (!initiativeLead) {
          continue;
        }

        if (sendStatus === "sent") {
          sentCount += 1;

          await tx.insert(schema.initiativeConversation).values({
            organizationId,
            initiativeLeadId: initiativeLead.id,
            direction: "outbound",
            subject: resolvedSubject,
            htmlBody: resolvedHtmlBody,
            sentAt: now,
            createdAt: now,
          });
        } else if (sendStatus === "missing-email") {
          missingEmailCount += 1;
        } else {
          errorCount += 1;
        }
      }

      await tx
        .update(schema.initiative)
        .set({
          status: "sent",
          sentAt: now,
          updatedAt: now,
        })
        .where(eq(schema.initiative.id, initiative.id));

      return {
        initiativeId: initiative.id,
        sentCount,
        missingEmailCount,
        errorCount,
        totalLeads: leads.length,
      };
    });
  }
);

export const retryInitiativeLead = form(
  v.object({ initiativeLeadId: initiativeLeadIdSchema }),
  async (input) => {
    const { locals } = getRequestEvent();
    const userId = locals.user?.id;
    const organizationId = locals.session?.activeOrganizationId;
    if (!userId || !organizationId) throw error(401, "Unauthorized");

    return locals.db(async (tx) => {
      const [initiativeLead] = await tx
        .select({
          id: schema.initiativeLead.id,
          initiativeId: schema.initiativeLead.initiativeId,
          leadId: schema.initiativeLead.leadId,
          status: schema.initiativeLead.status,
        })
        .from(schema.initiativeLead)
        .where(eq(schema.initiativeLead.id, input.initiativeLeadId))
        .limit(1);

      if (!initiativeLead) throw error(404, "Initiative lead not found");
      if (initiativeLead.status !== "error") {
        throw error(400, "Only failed emails can be retried");
      }

      const [initiative] = await tx
        .select({
          id: schema.initiative.id,
          projectId: schema.initiative.projectId,
          subject: schema.initiative.subject,
          htmlBody: schema.initiative.htmlBody,
          status: schema.initiative.status,
        })
        .from(schema.initiative)
        .where(eq(schema.initiative.id, initiativeLead.initiativeId))
        .limit(1);

      if (!initiative) throw error(404, "Initiative not found");
      await ensureProjectAccess(initiative.projectId, userId, tx);

      if (initiative.status !== "sent") {
        throw error(400, "Initiative has not been sent yet");
      }

      const [lead] = await tx
        .select({
          id: schema.lead.id,
          placeId: schema.lead.placeId,
          email: schema.lead.email,
          name: schema.lead.name,
          phone: schema.lead.phone,
          website: schema.lead.website,
          address: schema.lead.address,
          rating: schema.lead.rating,
          googleMapsUrl: schema.lead.googleMapsUrl,
        })
        .from(schema.lead)
        .where(eq(schema.lead.id, initiativeLead.leadId))
        .limit(1);

      if (!lead) throw error(404, "Lead not found");
      if (!lead.email?.trim())
        throw error(400, "Lead does not have an email");

      const resolvedSubject = resolveTemplate(
        initiative.subject,
        lead,
        []
      );
      const resolvedHtmlBody = resolveTemplate(
        initiative.htmlBody,
        lead,
        []
      );
      const now = new Date();

      try {
        await sendEmail(lead.email, resolvedSubject, resolvedHtmlBody);
      } catch (err) {
        console.log(err);

        throw error(500, "Failed to resend email");
      }

      await tx
        .update(schema.initiativeLead)
        .set({
          status: "sent",
          lastEmailSentAt: now,
          updatedAt: now,
        })
        .where(eq(schema.initiativeLead.id, initiativeLead.id));

      await tx.insert(schema.initiativeConversation).values({
        organizationId,
        initiativeLeadId: initiativeLead.id,
        direction: "outbound",
        subject: resolvedSubject,
        htmlBody: resolvedHtmlBody,
        sentAt: now,
        createdAt: now,
      });

      return {
        initiativeLeadId: initiativeLead.id,
      };
    });
  }
);

export const getProjectInitiatives = query(
  projectIdSchema,
  async (projectId) => {
    const { locals } = getRequestEvent();
    const userId = locals.user?.id;
    const organizationId = locals.session?.activeOrganizationId;
    if (!userId || !organizationId) throw error(401, "Unauthorized");

    return locals.db(async (tx) => {
      await ensureProjectAccess(projectId, userId, tx);

      const initiatives = await tx
        .select({
          id: schema.initiative.id,
          type: schema.initiative.type,
          title: schema.initiative.title,
          subject: schema.initiative.subject,
          htmlBody: schema.initiative.htmlBody,
          status: schema.initiative.status,
          sentAt: schema.initiative.sentAt,
          createdAt: schema.initiative.createdAt,
        })
        .from(schema.initiative)
        .where(eq(schema.initiative.projectId, projectId))
        .orderBy(desc(schema.initiative.createdAt));

      if (initiatives.length === 0) {
        return [];
      }

      const initiativeIds = initiatives.map((item) => item.id);

      const leadRows = await tx
        .select({
          initiativeLeadId: schema.initiativeLead.id,
          initiativeId: schema.initiativeLead.initiativeId,
          leadId: schema.lead.id,
          leadName: schema.lead.name,
          leadEmail: schema.lead.email,
          status: schema.initiativeLead.status,
          lastEmailSentAt: schema.initiativeLead.lastEmailSentAt,
        })
        .from(schema.initiativeLead)
        .innerJoin(
          schema.lead,
          eq(schema.lead.id, schema.initiativeLead.leadId)
        )
        .where(inArray(schema.initiativeLead.initiativeId, initiativeIds))
        .orderBy(schema.lead.name);

      const initiativeLeadIds = leadRows.map(
        (row) => row.initiativeLeadId
      );

      const conversationRows =
        initiativeLeadIds.length > 0
          ? await tx
              .select({
                id: schema.initiativeConversation.id,
                initiativeLeadId:
                  schema.initiativeConversation.initiativeLeadId,
                direction: schema.initiativeConversation.direction,
                subject: schema.initiativeConversation.subject,
                htmlBody: schema.initiativeConversation.htmlBody,
                sentAt: schema.initiativeConversation.sentAt,
                createdAt: schema.initiativeConversation.createdAt,
              })
              .from(schema.initiativeConversation)
              .where(
                inArray(
                  schema.initiativeConversation.initiativeLeadId,
                  initiativeLeadIds
                )
              )
              .orderBy(schema.initiativeConversation.createdAt)
          : [];

      const conversationsByLead = new Map<
        string,
        (typeof conversationRows)[number][]
      >();

      for (const conversation of conversationRows) {
        const existing = conversationsByLead.get(
          conversation.initiativeLeadId
        );
        if (existing) {
          existing.push(conversation);
          continue;
        }

        conversationsByLead.set(conversation.initiativeLeadId, [
          conversation,
        ]);
      }

      const leadRowsByInitiative = new Map<
        string,
        (typeof leadRows)[number][]
      >();

      for (const row of leadRows) {
        const existing = leadRowsByInitiative.get(row.initiativeId);
        if (existing) {
          existing.push(row);
          continue;
        }

        leadRowsByInitiative.set(row.initiativeId, [row]);
      }

      return initiatives.map((initiative) => ({
        ...initiative,
        leads: (leadRowsByInitiative.get(initiative.id) ?? []).map(
          (lead) => ({
            id: lead.initiativeLeadId,
            leadId: lead.leadId,
            leadName: lead.leadName,
            leadEmail: lead.leadEmail,
            status: lead.status,
            lastEmailSentAt: lead.lastEmailSentAt,
            conversation:
              conversationsByLead.get(lead.initiativeLeadId) ?? [],
          })
        ),
      }));
    });
  }
);
