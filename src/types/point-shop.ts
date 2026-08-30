import type { PointWallet } from "./reward";

export interface PointProduct {
  code: string;
  title: string;
  summary: string;
  value: string;
  brand: string | null;
  partner: string | null;
  exchangePoints: number;
  validityDays: number;
  stock: number | null;
  soldOut: boolean;
  exchangeable: boolean;
}

export interface PointProductsResponse {
  balance: number;
  products: PointProduct[];
}

export interface PointExchangeResponse {
  message: string;
  couponId: string;
  wallet: PointWallet;
}
