export const INGESTION_BATCH_SIZE = 500;

export const INGESTION_CSV_PRODUCT_NAME_COLUMNS = [
  'product_name',
  'names',
  'name',
  'product',
] as const;

export const INGESTION_CSV_CATEGORY_COLUMNS = ['category'] as const;
export const INGESTION_CSV_UNIT_COLUMNS = ['unit'] as const;
export const INGESTION_CSV_OWN_BRAND_COLUMNS = ['own_brand'] as const;
export const INGESTION_CSV_OBSERVED_DATE_COLUMNS = ['date', 'observed_date'] as const;
export const INGESTION_CSV_PRICE_COLUMNS = ['price', 'prices', 'prices_(£)'] as const;
export const INGESTION_CSV_UNIT_PRICE_COLUMNS = [
  'unit_price',
  'prices_unit',
  'prices_unit_(£)',
] as const;
