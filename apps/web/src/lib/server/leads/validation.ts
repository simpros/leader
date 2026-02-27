export type ParsedLeadRequest = {
  searchTerm?: string;
  projectDescription?: string;
  location: string;
  maxResults: number;
};

export { leadRequestSchema as LeadRequestSchema } from "$lib/schemas";
