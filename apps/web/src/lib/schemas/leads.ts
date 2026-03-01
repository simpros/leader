import {
  leadIdSchema,
  projectIdSchema,
  projectCustomFieldIdSchema,
} from "@leader/db";
import * as v from "valibot";
import { MAX_RESULTS_CAP } from "$lib/server/leads/constants";
import { optionalStringSchema } from "./common";

export const leadRequestSchema = v.object({
  searchTerm: v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.maxLength(200, "Search term must be less than 200 characters"),
      v.transform((value) => (value === "" ? undefined : value))
    )
  ),
  projectDescription: v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.maxLength(
        500,
        "Project description must be less than 500 characters"
      ),
      v.transform((value) => (value === "" ? undefined : value))
    )
  ),
  location: v.pipe(
    v.string("Location is required"),
    v.trim(),
    v.minLength(1, "Location cannot be empty"),
    v.maxLength(200, "Location must be less than 200 characters")
  ),
  maxResults: v.pipe(
    v.number("Max results must be a number"),
    v.integer("Max results must be a whole number"),
    v.minValue(1, "Max results must be at least 1"),
    v.maxValue(
      MAX_RESULTS_CAP,
      `Max results cannot exceed ${MAX_RESULTS_CAP}`
    )
  ),
});

export const createManualLeadInputSchema = v.object({
  projectId: projectIdSchema,
  name: v.pipe(
    v.string("Name is required"),
    v.trim(),
    v.minLength(1, "Name cannot be empty"),
    v.maxLength(200, "Name must be less than 200 characters")
  ),
  address: optionalStringSchema,
  website: optionalStringSchema,
  email: optionalStringSchema,
  phone: optionalStringSchema,
});

export const updateLeadCoreInputSchema = v.object({
  leadId: leadIdSchema,
  name: v.pipe(
    v.string("Name is required"),
    v.trim(),
    v.minLength(1, "Name cannot be empty"),
    v.maxLength(200, "Name must be less than 200 characters")
  ),
  address: optionalStringSchema,
  website: optionalStringSchema,
  email: optionalStringSchema,
  phone: optionalStringSchema,
});

export const createProjectCustomFieldInputSchema = v.object({
  leadId: leadIdSchema,
  projectId: projectIdSchema,
  name: v.pipe(
    v.string("Field name is required"),
    v.trim(),
    v.minLength(1, "Field name cannot be empty"),
    v.maxLength(100, "Field name must be less than 100 characters")
  ),
});

export const upsertLeadCustomFieldValueInputSchema = v.object({
  leadId: leadIdSchema,
  projectCustomFieldId: projectCustomFieldIdSchema,
  value: optionalStringSchema,
});

export const deleteLeadInputSchema = v.object({
  leadId: leadIdSchema,
});
