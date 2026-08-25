export type StoreService =
  "mobile" | "internet" | "payment" | "support" | "data_transfer";

export interface Store {
  id: string;
  code: string;
  name: string;
  region: string;
  district: string;
  address: string;
  phone: string | null;
  hours: {
    weekday: string;
    saturday: string | null;
    sunday: string | null;
  };
  services: StoreService[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
  isDirect: boolean;
  distanceKm: number | null;
}

export interface StoreListResponse {
  stores: Store[];
  regions: string[];
}
