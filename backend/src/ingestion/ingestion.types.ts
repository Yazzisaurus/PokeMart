export interface RawSupermarketRowInsert {
  retailer: string;
  productName: string;
  category?: string;
  priceRaw: string | null;
  unitPriceRaw: string | null;
  unitLabel?: string;
  ownBrandRaw?: string;
  observedDateRaw?: string;
  raw: Record<string, string>;
}
