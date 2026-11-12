import { ProductNormalizerService } from './product-normalizer.service.js';

describe('ProductNormalizerService', () => {
  const service = new ProductNormalizerService();

  it('normalizes a retailer product name', () => {
    expect(
      service.normalizeName(
        'Tesco Irish Whole Milk 2 Litre',
      ),
    ).toBe(
      'irish whole milk 2l',
    );
  });

  it('converts pounds to minor units', () => {
    expect(
      service.parsePriceMinor('£1.65'),
    ).toBe(165);
  });

  it('extracts litre quantities as ml', () => {
    expect(
      service.extractQuantity(
        'irish whole milk 2l',
      ),
    ).toEqual({
      value: 2000,
      unit: 'ml',
    });
  });

  it('normalizes category names', () => {
    expect(
      service.normalizeCategory(
        'Fresh Food',
      ),
    ).toBe(
      'fresh_food',
    );
  });

  it('parses Kaggle YYYYMMDD dates', () => {
    expect(
      service.parseDate(
        '20240413',
      ),
    ).toBe(
      '2024-04-13',
    );
  });

it('calculates total quantity for multipacks', () => {
  expect(
    service.extractQuantity(
      'organic strawberry oaty bars 6x25g',
    ),
  ).toEqual({
    value: 150,
    unit: 'g',
  });
});

it('extracts explicit box counts', () => {
  expect(
    service.extractQuantity(
      'swan vesta matches 1 box',
    ),
  ).toEqual({
    value: 1,
    unit: 'count',
  });
});

it('extracts trailing product counts', () => {
  expect(
    service.extractQuantity(
      'nappy bags 300',
    ),
  ).toEqual({
    value: 300,
    unit: 'count',
  });
});

it('extracts leading counts for known countable products', () => {
  expect(
    service.extractQuantity(
      '200 cotton buds',
    ),
  ).toEqual({
    value: 200,
    unit: 'count',
  });
});

it('extracts compact x-count quantities', () => {
  expect(
    service.extractQuantity(
      'tassimo cadbury hot chocolate pods x8',
    ),
  ).toEqual({
    value: 8,
    unit: 'count',
  });

  expect(
    service.extractQuantity(
      'bassetts vitamins soft chewies x30',
    ),
  ).toEqual({
    value: 30,
    unit: 'count',
  });
});

  it('accepts already-normalized dates', () => {
    expect(
      service.parseDate(
        '2024-04-13',
      ),
    ).toBe(
      '2024-04-13',
    );
  });
});
