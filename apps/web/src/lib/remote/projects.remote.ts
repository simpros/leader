import { form, getRequestEvent, query } from "$app/server";
import { and, count, eq, projectIdSchema, schema } from "@leader/db";
import { error } from "@sveltejs/kit";
import {
  addLeadsToProjectInputSchema,
  createProjectInputSchema,
  createProjectWithLeadsInputSchema,
  deleteProjectInputSchema,
  unlinkLeadFromProjectInputSchema,
  updateProjectInputSchema,
} from "$lib/schemas";
import { addRequestLogContext } from "$lib/server/request-logging";
import { parseTypes } from "$lib/server/utils/data";

/**
 * Retrieves all projects for the current user.
 * Includes lead count for each project.
 *
 * @returns Array of projects with lead counts
 */
export const getProjects = query(async () => {
  addRequestLogContext({ action: "getProjects" });
  const { locals } = getRequestEvent();
  const userId = locals.user?.id;
  const organizationId = locals.session?.activeOrganizationId;

  if (!userId || !organizationId) return [];

  return locals.db(async (tx) => {
    return tx
      .select({
        id: schema.project.id,
        name: schema.project.name,
        description: schema.project.description,
        createdAt: schema.project.createdAt,
        leadCount: count(schema.projectLead.id),
      })
      .from(schema.project)
      .leftJoin(
        schema.projectLead,
        eq(schema.project.id, schema.projectLead.projectId)
      )
      .where(eq(schema.project.userId, userId))
      .groupBy(schema.project.id)
      .orderBy(schema.project.createdAt);
  });
});

/**
 * Creates a new project for the current user.
 *
 * @param input - Project name and optional description
 * @returns Created project
 * @throws 401 if user is not authenticated
 */
export const createProject = form(
  createProjectInputSchema,
  async (input) => {
    addRequestLogContext({ action: "createProject" });
    const { locals } = getRequestEvent();
    const userId = locals.user?.id;
    const organizationId = locals.session?.activeOrganizationId;

    if (!userId || !organizationId) throw error(401, "Unauthorized");

    const now = new Date();

    return locals.db(async (tx) => {
      const [project] = await tx
        .insert(schema.project)
        .values({
          organizationId,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return project;
    });
  }
);

/**
 * Updates a project's name and description.
 *
 * @param input - Project ID, new name, and optional description
 * @returns Updated project
 * @throws 401 if user is not authenticated
 * @throws 404 if project is not found
 */
export const updateProject = form(
  updateProjectInputSchema,
  async (input) => {
    addRequestLogContext({ action: "updateProject", project_id: input.projectId });
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

      if (!project) throw error(404, "Project not found");

      const [updated] = await tx
        .update(schema.project)
        .set({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(schema.project.id, input.projectId))
        .returning();

      return updated;
    });
  }
);

/**
 * Deletes a project and all associated data (leads links, custom fields, initiatives).
 * Uses database cascade deletes.
 *
 * @param input - Project ID to delete
 * @returns Success indicator
 * @throws 401 if user is not authenticated
 * @throws 404 if project is not found
 */
export const deleteProject = form(
  deleteProjectInputSchema,
  async (input) => {
    addRequestLogContext({ action: "deleteProject", project_id: input.projectId });
    const { locals } = getRequestEvent();
    const userId = locals.user?.id;
    const organizationId = locals.session?.activeOrganizationId;

    if (!userId || !organizationId) throw error(401, "Unauthorized");

    return locals.db(async (tx) => {
      const deleted = await tx
        .delete(schema.project)
        .where(
          and(
            eq(schema.project.id, input.projectId),
            eq(schema.project.userId, userId)
          )
        )
        .returning({ id: schema.project.id });

      if (deleted.length === 0) throw error(404, "Project not found");

      return { ok: true };
    });
  }
);

/**
 * Adds leads to an existing project.
 * Deduplicates leads by placeId and skips leads already in the project.
 *
 * @param input - Project ID and array of leads to add
 * @returns Count of leads successfully added
 * @throws 401 if user is not authenticated
 * @throws 404 if project is not found
 */
export const addLeadsToProject = form(
  addLeadsToProjectInputSchema,
  async (input) => {
    addRequestLogContext({ action: "addLeadsToProject", project_id: input.projectId, lead_count: input.leads.length });
    const { locals } = getRequestEvent();
    const userId = locals.user?.id;
    const organizationId = locals.session?.activeOrganizationId;

    if (!userId || !organizationId) throw error(401, "Unauthorized");

    const { projectId, leads } = input;
    const uniqueLeads = new Map<string, (typeof leads)[number]>();

    for (const leadData of leads) {
      if (!leadData.placeId || !leadData.name) continue;
      if (!uniqueLeads.has(leadData.placeId)) {
        uniqueLeads.set(leadData.placeId, leadData);
      }
    }

    return locals.db(async (tx) => {
      const [project] = await tx
        .select({ id: schema.project.id })
        .from(schema.project)
        .where(
          and(
            eq(schema.project.id, projectId),
            eq(schema.project.userId, userId)
          )
        );

      if (!project) {
        throw error(404, "Project not found");
      }

      const now = new Date();
      let addedCount = 0;

      for (const leadData of uniqueLeads.values()) {
        await tx
          .insert(schema.lead)
          .values({
            organizationId,
            placeId: leadData.placeId,
            name: leadData.name,
            address: leadData.address || null,
            types:
              leadData.types && leadData.types.length
                ? JSON.stringify(leadData.types)
                : null,
            website: leadData.website || null,
            email: leadData.email || null,
            phone: leadData.phone || null,
            rating: leadData.rating ?? null,
            ratingsTotal: leadData.ratingsTotal ?? null,
            googleMapsUrl: leadData.googleMapsUrl || null,
            businessStatus: leadData.businessStatus || null,
            createdAt: now,
          })
          .onConflictDoNothing({
            target: [schema.lead.organizationId, schema.lead.placeId],
          });

        const [existingLead] = await tx
          .select({ id: schema.lead.id })
          .from(schema.lead)
          .where(eq(schema.lead.placeId, leadData.placeId));

        if (!existingLead) continue;

        const inserted = await tx
          .insert(schema.projectLead)
          .values({
            organizationId,
            projectId,
            leadId: existingLead.id,
            createdAt: now,
          })
          .onConflictDoNothing()
          .returning({ id: schema.projectLead.id });

        if (inserted.length > 0) {
          addedCount += 1;
        }
      }

      return { count: addedCount };
    });
  }
);

/**
 * Unlinks a lead from a project.
 *
 * @param input - Project ID and lead ID to unlink
 * @returns Success indicator
 * @throws 401 if user is not authenticated
 * @throws 404 if project is not found or lead is not linked
 */
export const unlinkLeadFromProject = form(
  unlinkLeadFromProjectInputSchema,
  async (input) => {
    addRequestLogContext({ action: "unlinkLeadFromProject", project_id: input.projectId, lead_id: input.leadId });
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

      const deleted = await tx
        .delete(schema.projectLead)
        .where(
          and(
            eq(schema.projectLead.projectId, input.projectId),
            eq(schema.projectLead.leadId, input.leadId),
            eq(schema.projectLead.organizationId, organizationId)
          )
        )
        .returning({ id: schema.projectLead.id });

      if (deleted.length === 0) {
        throw error(404, "Lead is not linked to project");
      }

      return { ok: true };
    });
  }
);

/**
 * Creates a new project and adds leads to it in a single transaction.
 * Deduplicates leads by placeId.
 *
 * @param input - Project details and array of leads
 * @returns Created project and count of leads added
 * @throws 401 if user is not authenticated
 */
export const createProjectWithLeads = form(
  createProjectWithLeadsInputSchema,
  async (input) => {
    addRequestLogContext({ action: "createProjectWithLeads", lead_count: input.leads.length });
    const { locals } = getRequestEvent();
    const userId = locals.user?.id;
    const organizationId = locals.session?.activeOrganizationId;

    if (!userId || !organizationId) throw error(401, "Unauthorized");

    const uniqueLeads = new Map<string, (typeof input.leads)[number]>();

    for (const leadData of input.leads) {
      if (!leadData.placeId || !leadData.name) continue;
      if (!uniqueLeads.has(leadData.placeId)) {
        uniqueLeads.set(leadData.placeId, leadData);
      }
    }

    return locals.db(async (tx) => {
      const now = new Date();

      const [project] = await tx
        .insert(schema.project)
        .values({
          organizationId,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      let addedCount = 0;

      for (const leadData of uniqueLeads.values()) {
        await tx
          .insert(schema.lead)
          .values({
            organizationId,
            placeId: leadData.placeId,
            name: leadData.name,
            address: leadData.address || null,
            types:
              leadData.types && leadData.types.length
                ? JSON.stringify(leadData.types)
                : null,
            website: leadData.website || null,
            email: leadData.email || null,
            phone: leadData.phone || null,
            rating: leadData.rating ?? null,
            ratingsTotal: leadData.ratingsTotal ?? null,
            googleMapsUrl: leadData.googleMapsUrl || null,
            businessStatus: leadData.businessStatus || null,
            createdAt: now,
          })
          .onConflictDoNothing({
            target: [schema.lead.organizationId, schema.lead.placeId],
          });

        const [existingLead] = await tx
          .select({ id: schema.lead.id })
          .from(schema.lead)
          .where(eq(schema.lead.placeId, leadData.placeId));

        if (!existingLead) continue;

        const inserted = await tx
          .insert(schema.projectLead)
          .values({
            organizationId,
            projectId: project.id,
            leadId: existingLead.id,
            createdAt: now,
          })
          .onConflictDoNothing()
          .returning({ id: schema.projectLead.id });

        if (inserted.length > 0) {
          addedCount += 1;
        }
      }

      return {
        project,
        count: addedCount,
      };
    });
  }
);

/**
 * Retrieves detailed information for a specific project.
 * Includes project details and all associated leads.
 *
 * @param projectId - ID of the project to retrieve
 * @returns Project details with leads
 * @throws 401 if user is not authenticated
 * @throws 404 if project is not found or user doesn't have access
 */
export const getProjectCustomFields = query(
  projectIdSchema,
  async (projectId) => {
    addRequestLogContext({ action: "getProjectCustomFields", project_id: projectId });
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
            eq(schema.project.id, projectId),
            eq(schema.project.userId, userId)
          )
        );

      if (!project) throw error(404, "Project not found");

      return tx
        .select({
          id: schema.projectCustomField.id,
          name: schema.projectCustomField.name,
        })
        .from(schema.projectCustomField)
        .where(eq(schema.projectCustomField.projectId, projectId))
        .orderBy(schema.projectCustomField.createdAt);
    });
  }
);

export const getProjectData = query(projectIdSchema, async (projectId) => {
  addRequestLogContext({ action: "getProjectData", project_id: projectId });
  const { locals } = getRequestEvent();
  const userId = locals.user?.id;
  const organizationId = locals.session?.activeOrganizationId;

  if (!userId || !organizationId) throw error(401, "Unauthorized");

  return locals.db(async (tx) => {
    const [project] = await tx
      .select()
      .from(schema.project)
      .where(
        and(
          eq(schema.project.id, projectId),
          eq(schema.project.userId, userId)
        )
      );

    if (!project) throw error(404, "Project not found");

    const projectLeads = await tx
      .select({
        id: schema.lead.id,
        placeId: schema.lead.placeId,
        name: schema.lead.name,
        address: schema.lead.address,
        types: schema.lead.types,
        website: schema.lead.website,
        email: schema.lead.email,
        phone: schema.lead.phone,
        rating: schema.lead.rating,
        ratingsTotal: schema.lead.ratingsTotal,
        googleMapsUrl: schema.lead.googleMapsUrl,
        businessStatus: schema.lead.businessStatus,
        addedAt: schema.projectLead.createdAt,
      })
      .from(schema.projectLead)
      .innerJoin(
        schema.lead,
        eq(schema.projectLead.leadId, schema.lead.id)
      )
      .where(eq(schema.projectLead.projectId, projectId))
      .orderBy(schema.projectLead.createdAt);

    const leads = projectLeads.map((lead) => ({
      ...lead,
      types: parseTypes(lead.types),
    }));

    return { project, leads };
  });
});
