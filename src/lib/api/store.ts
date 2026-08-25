import { apiFetch } from "./client";

import type { Store, StoreListResponse, StoreService } from "@/types/store";

interface StoreQuery {
  keyword?: string;
  region?: string;
  service?: StoreService;
  latitude?: number;
  longitude?: number;
}

export function getStores(query: StoreQuery) {
  const params = new URLSearchParams();
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.region) params.set("region", query.region);
  if (query.service) params.set("service", query.service);
  if (query.latitude !== undefined) {
    params.set("latitude", String(query.latitude));
  }
  if (query.longitude !== undefined) {
    params.set("longitude", String(query.longitude));
  }

  const search = params.toString();
  return apiFetch<StoreListResponse>(
    `/api/stores${search ? `?${search}` : ""}`,
  );
}

export function getStore(code: string) {
  return apiFetch<Store>(`/api/stores/${encodeURIComponent(code)}`);
}
