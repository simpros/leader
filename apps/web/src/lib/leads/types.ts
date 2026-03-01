export type LeadSearchSource =
  | "google-places"
  | "google-places+openrouter";

export interface Lead {
  id?: string;
  placeId: string;
  name: string;
  address?: string | null;
  types?: string[] | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  rating?: number | null;
  ratingsTotal?: number | null;
  googleMapsUrl?: string | null;
  businessStatus?: string | null;
  addedAt?: Date | string | number;
}

export interface LeadResponse {
  leads: Lead[];
  queriesUsed: string[];
  source: LeadSearchSource;
}
