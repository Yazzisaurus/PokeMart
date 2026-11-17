export const MATCH_NEUTRAL_SIMILARITY = 0.5;
export const MATCH_NAME_JACCARD_WEIGHT = 0.6;
export const MATCH_NAME_EDIT_WEIGHT = 0.4;
export const MATCH_SCORE_NAME_WEIGHT = 0.65;
export const MATCH_SCORE_CATEGORY_WEIGHT = 0.15;
export const MATCH_SCORE_QUANTITY_WEIGHT = 0.2;
export const MATCH_SCORE_AUTOMATIC_THRESHOLD = 0.8;
export const MATCH_SCORE_REVIEW_THRESHOLD = 0.68;

export const MATCH_METHODS = {
  automatic: 'automatic',
  review: 'review',
  new: 'new',
} as const;

export type MatchMethod = (typeof MATCH_METHODS)[keyof typeof MATCH_METHODS];

export const PREVIEW_MATCH_DEFAULT_SEARCH_TERM = 'milk';
export const PREVIEW_MATCH_DEFAULT_PER_RETAILER_LIMIT = 100;
export const PREVIEW_MATCH_TOP_RESULTS = 25;
export const PREVIEW_MATCH_SCORE_FRACTION_DIGITS = 3;
