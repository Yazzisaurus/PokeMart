import type { MatchMethod } from './matching.constants.js';

export interface MatchableProduct {
  normalizedName: string;
  category?: string | null;
  quantityValue?: number | null;
  quantityUnit?: string | null;
}

export interface ProductMatchResult {
  score: number;
  nameScore: number;
  jaccardScore: number;
  editScore: number;
  categoryScore: number;
  quantityScore: number;
  method: MatchMethod;
}

export interface PreparedProduct {
  id: number;
  retailer: string;
  originalName: string;
  normalizedName: string;
  category: string | null;
  quantityValue: number | null;
  quantityUnit: string | null;
}

export interface PreviewMatchResult {
  left: PreparedProduct;
  right: PreparedProduct;
  score: number;
  method: string;
  nameScore: number;
  jaccardScore: number;
  editScore: number;
  categoryScore: number;
  quantityScore: number;
}
