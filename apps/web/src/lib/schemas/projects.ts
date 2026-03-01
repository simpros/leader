import { leadIdSchema, projectIdSchema } from "@leader/db";
import * as v from "valibot";
import { optionalNumberSchema, optionalStringSchema } from "./common";

export const projectLeadInputSchema = v.object({
  placeId: v.string(),
  name: v.string(),
  address: optionalStringSchema,
  types: v.optional(v.array(v.string())),
  website: optionalStringSchema,
  email: optionalStringSchema,
  phone: optionalStringSchema,
  rating: optionalNumberSchema,
  ratingsTotal: optionalNumberSchema,
  googleMapsUrl: optionalStringSchema,
  businessStatus: optionalStringSchema,
});

export const createProjectInputSchema = v.object({
  name: v.pipe(
    v.string("Project name is required"),
    v.trim(),
    v.minLength(1, "Project name cannot be empty"),
    v.maxLength(200, "Project name must be less than 200 characters")
  ),
  description: optionalStringSchema,
});

export const addLeadsToProjectInputSchema = v.object({
  projectId: projectIdSchema,
  leads: v.array(projectLeadInputSchema),
});

export const createProjectWithLeadsInputSchema = v.object({
  name: v.pipe(
    v.string("Project name is required"),
    v.trim(),
    v.minLength(1, "Project name cannot be empty"),
    v.maxLength(200, "Project name must be less than 200 characters")
  ),
  description: optionalStringSchema,
  leads: v.array(projectLeadInputSchema),
});

export const unlinkLeadFromProjectInputSchema = v.object({
  projectId: projectIdSchema,
  leadId: leadIdSchema,
});

export const updateProjectInputSchema = v.object({
  projectId: projectIdSchema,
  name: v.pipe(
    v.string("Project name is required"),
    v.trim(),
    v.minLength(1, "Project name cannot be empty"),
    v.maxLength(200, "Project name must be less than 200 characters")
  ),
  description: optionalStringSchema,
});

export const deleteProjectInputSchema = v.object({
  projectId: projectIdSchema,
});
