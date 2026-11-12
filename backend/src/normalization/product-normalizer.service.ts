import { Injectable } from '@nestjs/common';

export interface NormalizedQuantity {
  value: number;
  unit: 'g' | 'ml' | 'count';
}

@Injectable()
export class ProductNormalizerService {

  normalizeName(input: string): string {
    let value = input
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    // Remove retailer names so equivalent products
    // can be compared across different supermarkets.
    value = value
      .replace(/\bsainsbury'?s\b/g, ' ')
      .replace(/\bmorrisons?\b/g, ' ')
      .replace(/\btesco\b/g, ' ')
      .replace(/\basda\b/g, ' ')
      .replace(/\baldi\b/g, ' ');

    // Standardize common measurements.
    value = value
      .replace(
        /(\d+(?:\.\d+)?)\s*(kilograms?|kgs?)\b/g,
        '$1kg',
      )
      .replace(
        /(\d+(?:\.\d+)?)\s*(grams?|g)\b/g,
        '$1g',
      )
      .replace(
        /(\d+(?:\.\d+)?)\s*(litres?|liters?|l)\b/g,
        '$1l',
      )
      .replace(
        /(\d+(?:\.\d+)?)\s*(millilitres?|milliliters?|ml)\b/g,
        '$1ml',
      );

    // Remove punctuation and duplicate whitespace.
    value = value
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9.]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return value;
  }

  parsePriceMinor(
    input?: string,
  ): number | undefined {

    if (!input) {
      return undefined;
    }

    const cleaned = input
      .replace(/[£€,]/g, '')
      .trim();

    const value = Number(cleaned);

    if (!Number.isFinite(value)) {
      return undefined;
    }

    return Math.round(value * 100);
  }

  normalizeUnit(
    input?: string,
  ): string | undefined {

    if (!input) {
      return undefined;
    }

    const value = input
      .toLowerCase()
      .trim();

    const map: Record<string, string> = {
      kilogram: 'kg',
      kilograms: 'kg',
      kg: 'kg',

      litre: 'l',
      litres: 'l',
      liter: 'l',
      liters: 'l',
      l: 'l',

      gram: 'g',
      grams: 'g',
      g: 'g',

      millilitre: 'ml',
      millilitres: 'ml',
      milliliter: 'ml',
      milliliters: 'ml',
      ml: 'ml',

      unit: 'unit',
      each: 'each',
      '100g': '100g',
    };

    return map[value] ?? value;
  }

  normalizeCategory(
    input?: string,
  ): string | undefined {

    if (!input) {
      return undefined;
    }

    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  parseBoolean(
    input?: string,
  ): boolean | undefined {

    if (!input) {
      return undefined;
    }

    const value = input
      .toLowerCase()
      .trim();

    if (
      ['true', '1', 'yes', 'y'].includes(value)
    ) {
      return true;
    }

    if (
      ['false', '0', 'no', 'n'].includes(value)
    ) {
      return false;
    }

    return undefined;
  }

  parseDate(
    input?: string,
  ): string | undefined {

    if (!input) {
      return undefined;
    }

    const value = input.trim();

    // Kaggle supermarket dataset format: YYYYMMDD
    if (/^\d{8}$/.test(value)) {
      const year = value.slice(0, 4);
      const month = value.slice(4, 6);
      const day = value.slice(6, 8);

      const formatted = `${year}-${month}-${day}`;

      const date = new Date(
        `${formatted}T00:00:00Z`,
      );

      if (Number.isNaN(date.getTime())) {
        return undefined;
      }

      return formatted;
    }

    // Already-normalized YYYY-MM-DD.
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      const date = new Date(
        `${value}T00:00:00Z`,
      );

      if (Number.isNaN(date.getTime())) {
        return undefined;
      }

      return value;
    }

    // Fallback for other valid date formats.
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    return date
      .toISOString()
      .slice(0, 10);
  }

  extractQuantity(
    normalizedName: string,
  ): NormalizedQuantity | undefined {

    // Multipacks such as:
    // 6x25g
    // 4 x 500ml
    // 2x1l
    const multiPackMatch =
      normalizedName.match(
        /\b(\d+)\s*x\s*(\d+(?:\.\d+)?)(kg|g|l|ml)\b/,
      );

    if (multiPackMatch) {
      const count =
        Number(multiPackMatch[1]);

      const amount =
        Number(multiPackMatch[2]);

      const unit =
        multiPackMatch[3];

      if (unit === 'kg') {
        return {
          value: Math.round(
            count * amount * 1000,
          ),
          unit: 'g',
        };
      }

      if (unit === 'l') {
        return {
          value: Math.round(
            count * amount * 1000,
          ),
          unit: 'ml',
        };
      }

      if (unit === 'g') {
        return {
          value: Math.round(
            count * amount,
          ),
          unit: 'g',
        };
      }

      if (unit === 'ml') {
        return {
          value: Math.round(
            count * amount,
          ),
          unit: 'ml',
        };
      }
    }

    // Standard measurements:
    // 200g, 2l, 750ml
    const measurementMatch =
      normalizedName.match(
        /\b(\d+(?:\.\d+)?)(kg|g|l|ml)\b/,
      );

    if (measurementMatch) {
      const amount =
        Number(measurementMatch[1]);

      const unit =
        measurementMatch[2];

      if (unit === 'kg') {
        return {
          value: Math.round(
            amount * 1000,
          ),
          unit: 'g',
        };
      }

      if (unit === 'l') {
        return {
          value: Math.round(
            amount * 1000,
          ),
          unit: 'ml',
        };
      }

      if (unit === 'g') {
        return {
          value: Math.round(amount),
          unit: 'g',
        };
      }

      if (unit === 'ml') {
        return {
          value: Math.round(amount),
          unit: 'ml',
        };
      }
    }

    // Explicit count descriptions:
    // 22 pack
    // 1 box
    // 60 wipes
    const explicitCountMatch =
      normalizedName.match(
        /\b(\d+)\s*(?:pack|packs|pk|box|boxes|wipes|nappies|bags|rolls|pods|capsules|tablets|pieces|pcs)\b/,
      );

    if (explicitCountMatch) {
      return {
        value:
          Number(explicitCountMatch[1]),
        unit: 'count',
      };
    }

// Compact count notation:
// x8
// x30
const compactCountMatch =
  normalizedName.match(
    /\bx(\d+)\b/,
  );

if (compactCountMatch) {
  return {
    value:
      Number(compactCountMatch[1]),
    unit: 'count',
  };
}
    // Quantity at the end:
    // "nappy bags 300"
    const trailingCountMatch =
      normalizedName.match(
        /\b(\d+)\s*$/,
      );

    if (trailingCountMatch) {
      return {
        value:
          Number(trailingCountMatch[1]),
        unit: 'count',
      };
    }

    // Quantity at the beginning for
    // known countable products:
    // "200 cotton buds"
    const leadingCountMatch =
      normalizedName.match(
        /^(\d+)\s+(?=(?:cotton buds|wipes|nappies|bags|capsules|tablets|pods|matches)\b)/,
      );

    if (leadingCountMatch) {
      return {
        value:
          Number(leadingCountMatch[1]),
        unit: 'count',
      };
    }

    return undefined;
  }
}
