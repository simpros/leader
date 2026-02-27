import type { Lead } from "$lib/leads/types";
import type { Id } from "@leader/db";

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
  leadCount?: number;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface CreateProjectWithLeadsInput extends CreateProjectInput {
  leads: Lead[];
}

export interface AddLeadsToProjectInput {
  projectId: Id<"project">;
  leads: Lead[];
}
