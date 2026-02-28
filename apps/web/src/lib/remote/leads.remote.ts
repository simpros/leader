import { form, getRequestEvent, query } from "$app/server";
import { env } from "$env/dynamic/private";
import { randomUUID } from "node:crypto";
import {
  and,
  db,
  eq,
  leadIdSchema,
  schema,
  sql,
  type Id,
} from "@leader/db";
import { error } from "@sveltejs/kit";
import type { Lead, LeadResponse } from "$lib/leads/types";
import {
  createManualLeadInputSchema,
  createProjectCustomFieldInputSchema,
  deleteLeadInputSchema,
  leadRequestSchema,
  updateLeadCoreInputSchema,
  upsertLeadCustomFieldValueInputSchema,
} from "$lib/schemas";
import { addRequestLogContext } from "$lib/server/request-logging";
import { enrichEmail } from "$lib/server/leads/email";
import {
  googlePlaceDetails,
  googleTextSearch,
} from "$lib/server/leads/google";
import { getOpenRouterAudienceQueries } from "$lib/server/leads/openrouter";
import { uniqueStrings } from "$lib/server/leads/utils";
import { normalize, parseTypes } from "$lib/server/utils/data";

const GOOGLE_PLACES_API_KEY = env.GOOGLE_PLACES_API_KEY ?? "";
const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY ?? "";
const OPENROUTER_MODEL = env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
const BRAVE_API_KEY = env.BRAVE_API_KEY ?? "";

type LeadFormResponse = LeadResponse & { message?: string };

/**
 * Returns which AI-powered discovery features are available
 * based on configured environment variables.
 */
export const getDiscoveryCapabilities = query(async () => {
  addRequestLogContext({ action: "getDiscoveryCapabilities" });
  return {
    openRouterAvailable: !!OPENROUTER_API_KEY,
  };
});

const ensureUserCanAccessLead = async (
  organizationId: string,
  leadId: Id<"lead">,
  tx?: Parameters<Parameters<typeof db.transaction>[0]>[0]
) => {
  const dbClient = tx ?? db;
  const [lead] = await dbClient
    .select({
      id: schema.lead.id,
      placeId: schema.lead.placeId,
      name: schema.lead.name,
      address: schema.lead.address,
      types: schema.lead.types,
      website: schema.lead.website,
      email: schema.lead.email,
      emailSource: schema.lead.emailSource,
      phone: schema.lead.phone,
      rating: schema.lead.rating,
      ratingsTotal: schema.lead.ratingsTotal,
      googleMapsUrl: schema.lead.googleMapsUrl,
      businessStatus: schema.lead.businessStatus,
      createdAt: schema.lead.createdAt,
    })
    .from(schema.lead)
    .where(
      and(
        eq(schema.lead.organizationId, organizationId),
        eq(schema.lead.id, leadId)
      )
    )
    .limit(1);

  if (!lead) {
    throw new Error("Lead not found");
  }

  return {
    ...lead,
    types: parseTypes(lead.types),
  };
};

/**
 * Discovers potential leads based on a product idea and location.
 * Uses Google Places API and optionally OpenRouter AI to generate search queries.
 * Enriches results with email addresses when possible.
 *
 * @param idea - Description of the product or service
 * @param location - Geographic location to search in
 * @param maxResults - Maximum number of results to return (capped at MAX_RESULTS_CAP)
 * @returns Array of leads with contact information and metadata
 */
export const discoverLeads = form(
  leadRequestSchema,
  async ({
    searchTerm,
    projectDescription,
    location,
    maxResults,
  }): Promise<LeadFormResponse> => {
    addRequestLogContext({ action: "discoverLeads", location, max_results: maxResults });
    let source: LeadResponse["source"] = "google-places";
    let message: string | undefined;

    if (!GOOGLE_PLACES_API_KEY) {
      return {
        leads: [],
        queriesUsed: [],
        source,
        message: "Missing GOOGLE_PLACES_API_KEY",
      };
    }

    if (!searchTerm && !projectDescription) {
      return {
        leads: [],
        queriesUsed: [],
        source,
        message: "Provide either a search term or what your project does.",
      };
    }

    const queries = searchTerm
      ? [searchTerm]
      : await getOpenRouterAudienceQueries({
          projectDescription: projectDescription ?? "",
          location,
          apiKey: OPENROUTER_API_KEY,
          model: OPENROUTER_MODEL,
        });

    if (!searchTerm && OPENROUTER_API_KEY) {
      source = "google-places+openrouter";
    } else if (!searchTerm && !OPENROUTER_API_KEY) {
      message =
        "OPENROUTER_API_KEY not set, using fallback audience extraction.";
    }

    const queriesUsed = uniqueStrings(
      queries.map((query) =>
        location ? `${query} in ${location}` : query
      )
    );

    const maxCount = maxResults ?? Number.POSITIVE_INFINITY;
    const placesByQuery = await Promise.all(
      queriesUsed.map((query) =>
        googleTextSearch(GOOGLE_PLACES_API_KEY, query)
      )
    );

    const seen = new Set<string>();
    const uniquePlaces = placesByQuery
      .flat()
      .filter((place) => {
        if (!place.place_id || seen.has(place.place_id)) {
          return false;
        }

        seen.add(place.place_id);
        return true;
      })
      .slice(0, maxCount);

    const detailsByPlace = await Promise.all(
      uniquePlaces.map((place) =>
        googlePlaceDetails(GOOGLE_PLACES_API_KEY, place.place_id)
      )
    );

    const baseResults: Lead[] = uniquePlaces.map((place, index) => {
      const details = detailsByPlace[index];
      return {
        name: details?.name ?? place.name,
        address: details?.formattedAddress ?? place.formatted_address,
        types: details?.types ?? place.types,
        website: details?.websiteUri ?? place.website ?? null,
        email: null,
        emailSource: null,
        phone:
          details?.nationalPhoneNumber ??
          details?.internationalPhoneNumber ??
          null,
        rating: details?.rating ?? place.rating,
        ratingsTotal: details?.userRatingCount ?? place.user_ratings_total,
        placeId: place.place_id,
        googleMapsUrl: details?.googleMapsUri ?? null,
        businessStatus: details?.businessStatus ?? null,
      };
    });

    const results = await Promise.all(
      baseResults.map(async (lead) => {
        if (!lead.website && !lead.name) {
          return lead;
        }

        const enrichment = await enrichEmail({
          website: lead.website,
          name: lead.name,
          location,
          braveApiKey: BRAVE_API_KEY,
        });

        return {
          ...lead,
          email: enrichment.email,
          emailSource: enrichment.source,
        };
      })
    );

    return {
      leads: results,
      queriesUsed,
      source,
      message,
    };
  }
);

/**
 * Retrieves all leads accessible by the current user.
 * Returns leads with basic information and project count.
 *
 * @returns Array of leads with project associations
 */
export const getLeads = query(async () => {
  addRequestLogContext({ action: "getLeads" });
  const { locals } = getRequestEvent();
  const organizationId = locals.session?.activeOrganizationId;

  if (!organizationId) return [];

  return locals.db(async (tx) => {
    return tx
      .select({
        id: schema.lead.id,
        placeId: schema.lead.placeId,
        name: schema.lead.name,
        email: schema.lead.email,
        phone: schema.lead.phone,
        website: schema.lead.website,
        rating: schema.lead.rating,
        createdAt: schema.lead.createdAt,
        projectCount: sql<number>`cast(count(distinct ${schema.projectLead.projectId}) as integer)`,
      })
      .from(schema.lead)
      .leftJoin(
        schema.projectLead,
        eq(schema.projectLead.leadId, schema.lead.id)
      )
      .where(eq(schema.lead.organizationId, organizationId))
      .groupBy(
        schema.lead.id,
        schema.lead.placeId,
        schema.lead.name,
        schema.lead.email,
        schema.lead.phone,
        schema.lead.website,
        schema.lead.rating,
        schema.lead.createdAt
      )
      .orderBy(schema.lead.createdAt);
  });
});

export const createManualLead = form(
  createManualLeadInputSchema,
  async (input) => {
    addRequestLogContext({ action: "createManualLead", project_id: input.projectId });
    const { locals } = getRequestEvent();
    const userId = locals.user?.id;
    const organizationId = locals.session?.activeOrganizationId;

    if (!userId || !organizationId) throw error(401, "Unauthorized");

    return locals.db(async (tx) => {
      const [project] = await tx
        .select({ id: schema.project.id })
        .from(schema.project)
        .where(
          and(
            eq(schema.project.id, input.projectId),
            eq(schema.project.userId, userId)
          )
        )
        .limit(1);

      if (!project) {
        throw error(404, "Project not found");
      }

      const now = new Date();
      const [lead] = await tx
        .insert(schema.lead)
        .values({
          organizationId,
          placeId: `manual:${randomUUID()}`,
          name: input.name.trim(),
          address: normalize(input.address),
          website: normalize(input.website),
          email: normalize(input.email),
          phone: normalize(input.phone),
          createdAt: now,
        })
        .returning({ id: schema.lead.id });

      await tx.insert(schema.projectLead).values({
        organizationId,
        projectId: input.projectId,
        leadId: lead.id,
        createdAt: now,
      });

      return { ok: true, leadId: lead.id };
    });
  }
);

/**
 * Retrieves detailed information for a specific lead.
 * Includes core lead data, associated projects, and custom field values.
 *
 * @param leadId - ID of the lead to retrieve
 * @returns Lead details with custom fields organized by project
 * @throws 401 if user is not authenticated
 * @throws 404 if lead is not found or user doesn't have access
 */
export const getLeadData = query(leadIdSchema, async (leadId) => {
  addRequestLogContext({ action: "getLeadData", lead_id: leadId });
  const { locals } = getRequestEvent();
  const userId = locals.user?.id;
  const organizationId = locals.session?.activeOrganizationId;
  if (!userId || !organizationId) throw error(401, "Unauthorized");

  return locals.db(async (tx) => {
    let lead;
    try {
      lead = await ensureUserCanAccessLead(organizationId, leadId, tx);
    } catch {
      throw error(404, "Lead not found");
    }

    const projects = await tx
      .select({
        id: schema.project.id,
        name: schema.project.name,
        linkedAt: schema.projectLead.createdAt,
      })
      .from(schema.projectLead)
      .innerJoin(
        schema.project,
        eq(schema.project.id, schema.projectLead.projectId)
      )
      .where(
        and(
          eq(schema.projectLead.leadId, leadId),
          eq(schema.project.userId, userId)
        )
      )
      .orderBy(schema.projectLead.createdAt);

    const fields = await tx
      .select({
        id: schema.projectCustomField.id,
        projectId: schema.projectCustomField.projectId,
        projectName: schema.project.name,
        name: schema.projectCustomField.name,
        createdAt: schema.projectCustomField.createdAt,
      })
      .from(schema.projectCustomField)
      .innerJoin(
        schema.project,
        eq(schema.project.id, schema.projectCustomField.projectId)
      )
      .innerJoin(
        schema.projectLead,
        and(
          eq(
            schema.projectLead.projectId,
            schema.projectCustomField.projectId
          ),
          eq(schema.projectLead.leadId, leadId)
        )
      )
      .where(eq(schema.project.userId, userId))
      .orderBy(schema.projectCustomField.createdAt);

    const values = await tx
      .select({
        fieldId: schema.leadCustomFieldValue.projectCustomFieldId,
        value: schema.leadCustomFieldValue.value,
      })
      .from(schema.leadCustomFieldValue)
      .innerJoin(
        schema.projectCustomField,
        eq(
          schema.projectCustomField.id,
          schema.leadCustomFieldValue.projectCustomFieldId
        )
      )
      .innerJoin(
        schema.project,
        eq(schema.project.id, schema.projectCustomField.projectId)
      )
      .where(
        and(
          eq(schema.leadCustomFieldValue.leadId, leadId),
          eq(schema.project.userId, userId)
        )
      );

    const valueByFieldId = new Map(
      values.map((item) => [item.fieldId, item.value])
    );

    const customFieldSections = projects.map((project) => ({
      projectId: project.id,
      projectName: project.name,
      fields: fields
        .filter((field) => field.projectId === project.id)
        .map((field) => ({
          id: field.id,
          name: field.name,
          value: valueByFieldId.get(field.id) ?? null,
        })),
    }));

    return {
      lead,
      customFieldSections,
    };
  });
});

/**
 * Updates core fields of a lead (name, address, contact info).
 * Changes apply globally across all projects using this lead.
 *
 * @param input - Lead ID and updated field values
 * @returns Success indicator
 * @throws 401 if user is not authenticated
 * @throws 404 if lead is not found or user doesn't have access
 */
export const updateLeadCore = form(
  updateLeadCoreInputSchema,
  async (input) => {
    addRequestLogContext({ action: "updateLeadCore", lead_id: input.leadId });
    const { locals } = getRequestEvent();
    const userId = locals.user?.id;
    const organizationId = locals.session?.activeOrganizationId;
    if (!userId || !organizationId) throw error(401, "Unauthorized");

    return locals.db(async (tx) => {
      await ensureUserCanAccessLead(organizationId, input.leadId, tx);

      await tx
        .update(schema.lead)
        .set({
          name: input.name.trim(),
          address: normalize(input.address),
          website: normalize(input.website),
          email: normalize(input.email),
          emailSource: normalize(input.emailSource),
          phone: normalize(input.phone),
        })
        .where(eq(schema.lead.id, input.leadId))
        .returning({ id: schema.lead.id });

      return { ok: true };
    });
  }
);

/**
 * Creates a new custom field for a project.
 * If a field with the same name already exists, returns the existing field.
 *
 * @param input - Lead ID, project ID, and field name
 * @returns Created or existing custom field
 * @throws 401 if user is not authenticated
 * @throws 400 if field name is empty or lead is not linked to project
 */
export const createProjectCustomField = form(
  createProjectCustomFieldInputSchema,
  async (input) => {
    addRequestLogContext({ action: "createProjectCustomField", project_id: input.projectId });
    const { locals } = getRequestEvent();
    const userId = locals.user?.id;
    const organizationId = locals.session?.activeOrganizationId;
    if (!userId || !organizationId) throw error(401, "Unauthorized");

    const fieldName = input.name.trim();
    if (!fieldName) {
      throw error(400, "Field name is required");
    }

    return locals.db(async (tx) => {
      const [leadProject] = await tx
        .select({ projectId: schema.projectLead.projectId })
        .from(schema.projectLead)
        .innerJoin(
          schema.project,
          eq(schema.project.id, schema.projectLead.projectId)
        )
        .where(
          and(
            eq(schema.projectLead.leadId, input.leadId),
            eq(schema.projectLead.projectId, input.projectId),
            eq(schema.project.userId, userId)
          )
        )
        .limit(1);

      if (!leadProject) {
        throw error(400, "Lead is not linked to the selected project");
      }

      const [existingFieldByName] = await tx
        .select({
          id: schema.projectCustomField.id,
          projectId: schema.projectCustomField.projectId,
          name: schema.projectCustomField.name,
        })
        .from(schema.projectCustomField)
        .where(
          and(
            eq(schema.projectCustomField.projectId, input.projectId),
            eq(schema.projectCustomField.name, fieldName)
          )
        )
        .limit(1);

      if (existingFieldByName) {
        return {
          ok: true,
          field: existingFieldByName,
        };
      }

      const now = new Date();

      const [field] = await tx
        .insert(schema.projectCustomField)
        .values({
          organizationId,
          projectId: input.projectId,
          name: fieldName,
          createdAt: now,
          updatedAt: now,
        })
        .returning({
          id: schema.projectCustomField.id,
          projectId: schema.projectCustomField.projectId,
          name: schema.projectCustomField.name,
        });

      return {
        ok: true,
        field,
      };
    });
  }
);

/**
 * Creates or updates a custom field value for a lead.
 * Uses upsert logic to handle both new and existing values.
 *
 * @param input - Lead ID, custom field ID, and value
 * @returns Success indicator
 * @throws 401 if user is not authenticated
 * @throws 400 if custom field is not found or user doesn't have access
 */
export const upsertLeadCustomFieldValue = form(
  upsertLeadCustomFieldValueInputSchema,
  async (input) => {
    addRequestLogContext({ action: "upsertLeadCustomFieldValue", lead_id: input.leadId, field_id: input.projectCustomFieldId });
    const { locals } = getRequestEvent();
    const userId = locals.user?.id;
    const organizationId = locals.session?.activeOrganizationId;
    if (!userId || !organizationId) throw error(401, "Unauthorized");

    return locals.db(async (tx) => {
      const [field] = await tx
        .select({
          id: schema.projectCustomField.id,
          projectId: schema.projectCustomField.projectId,
        })
        .from(schema.projectCustomField)
        .innerJoin(
          schema.project,
          eq(schema.project.id, schema.projectCustomField.projectId)
        )
        .innerJoin(
          schema.projectLead,
          and(
            eq(
              schema.projectLead.projectId,
              schema.projectCustomField.projectId
            ),
            eq(schema.projectLead.leadId, input.leadId)
          )
        )
        .where(
          and(
            eq(schema.projectCustomField.id, input.projectCustomFieldId),
            eq(schema.project.userId, userId)
          )
        );

      if (!field) {
        throw error(400, "Custom field not found");
      }

      const now = new Date();
      const value = normalize(input.value);

      await tx
        .insert(schema.leadCustomFieldValue)
        .values({
          organizationId,
          leadId: input.leadId,
          projectCustomFieldId: input.projectCustomFieldId,
          value,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            schema.leadCustomFieldValue.leadId,
            schema.leadCustomFieldValue.projectCustomFieldId,
          ],
          set: {
            value,
            updatedAt: now,
          },
        });

      return { ok: true };
    });
  }
);

/**
 * Deletes a lead and all associated data (project links, custom field values, initiative records).
 * Uses database cascade deletes.
 *
 * @param input - Lead ID to delete
 * @returns Success indicator
 * @throws 401 if user is not authenticated
 * @throws 404 if lead is not found or user doesn't have access
 */
export const deleteLead = form(deleteLeadInputSchema, async (input) => {
  addRequestLogContext({ action: "deleteLead", lead_id: input.leadId });
  const { locals } = getRequestEvent();
  const userId = locals.user?.id;
  const organizationId = locals.session?.activeOrganizationId;
  if (!userId || !organizationId) throw error(401, "Unauthorized");

  return locals.db(async (tx) => {
    const deleted = await tx
      .delete(schema.lead)
      .where(
        and(
          eq(schema.lead.id, input.leadId),
          eq(schema.lead.organizationId, organizationId)
        )
      )
      .returning({ id: schema.lead.id });

    if (deleted.length === 0) throw error(404, "Lead not found");

    return { ok: true };
  });
});
