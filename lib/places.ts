import { apiRequest } from "@/lib/api";

export interface PlaceSubmission {
  id: number;
  name: string;
  region: string;
  sub_region: string;
  area: string;
  lat: string;
  lng: string;
  agent: number;
  agent_name: string;
  created_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** page_size=1 -- we only need `count` for the dashboard stat, not the rows. */
export function getPlaceCount() {
  return apiRequest<PaginatedResponse<PlaceSubmission>>("/place-submissions/?page_size=1").then(
    (r) => r.count
  );
}

export function listRecentPlaces(pageSize = 10) {
  return apiRequest<PaginatedResponse<PlaceSubmission>>(
    `/place-submissions/?page_size=${pageSize}`
  ).then((r) => r.results);
}

export interface NewPlaceSubmission {
  name: string;
  region: string;
  sub_region: string;
  area: string;
  lat: number;
  lng: number;
}

export function createPlaceSubmission(data: NewPlaceSubmission) {
  return apiRequest<PlaceSubmission>("/place-submissions/", { method: "POST", body: data });
}
