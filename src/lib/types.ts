export type PricePoint = {
  t: string; // ISO date yyyy-mm-dd
  c: number; // close
};

export type AssetSeries = {
  symbol: string;
  name: string;
  currency: string;
  source: string;
  fetchedAt: string;
  points: PricePoint[];
};

export type CpiPoint = {
  t: string; // yyyy-mm-01
  v: number;
};

export type CpiSeries = {
  series: string;
  name: string;
  source: string;
  fetchedAt: string;
  points: CpiPoint[];
};

export type Timeframe = "1M" | "3M" | "6M" | "1Y" | "5Y" | "10Y" | "20Y" | "ALL";

export const TIMEFRAMES: Timeframe[] = ["1M", "3M", "6M", "1Y", "5Y", "10Y", "20Y", "ALL"];

// Subset of AssetSeries passed client-side for the compare view (drops
// server-only metadata like fetchedAt).
export type AssetSeriesLite = {
  symbol: string;
  name: string;
  shortName: string;
  category: string;
  currency: string;
  unit?: string;
  points: PricePoint[];
};
