import {
  ProductMatcherService,
} from './product-matcher.service.js';

describe(
  'ProductMatcherService',
  () => {

    const service =
      new ProductMatcherService();

    it(
      'calculates Jaccard similarity',
      () => {

        const score =
          service.jaccardSimilarity(
            'whole milk 2l',
            'british whole milk 2l',
          );

        expect(score)
          .toBeGreaterThan(0.7);
      },
    );

    it(
      'gives identical names maximum edit similarity',
      () => {

        expect(
          service.editSimilarity(
            'whole milk 2l',
            'whole milk 2l',
          ),
        ).toBe(1);
      },
    );

    it(
      'gives matching quantities maximum similarity',
      () => {

        const score =
          service.quantitySimilarity(
            {
              normalizedName:
                'whole milk 2l',
              quantityValue: 2000,
              quantityUnit: 'ml',
            },
            {
              normalizedName:
                'british whole milk 2l',
              quantityValue: 2000,
              quantityUnit: 'ml',
            },
          );

        expect(score).toBe(1);
      },
    );

    it(
      'rejects incompatible quantity units',
      () => {

        const score =
          service.quantitySimilarity(
            {
              normalizedName:
                'milk',
              quantityValue: 2000,
              quantityUnit: 'ml',
            },
            {
              normalizedName:
                'milk',
              quantityValue: 2000,
              quantityUnit: 'g',
            },
          );

        expect(score).toBe(0);
      },
    );

    it(
      'automatically matches very similar products',
      () => {

        const result =
          service.compare(
            {
              normalizedName:
                'whole milk 2l',
              category:
                'milk',
              quantityValue: 2000,
              quantityUnit: 'ml',
            },
            {
              normalizedName:
                'british whole milk 2l',
              category:
                'milk',
              quantityValue: 2000,
              quantityUnit: 'ml',
            },
          );

        expect(result.method)
          .toBe('automatic');

        expect(result.score)
          .toBeGreaterThanOrEqual(
            0.80,
          );
      },
    );

    it(
      'does not match clearly different products',
      () => {

        const result =
          service.compare(
            {
              normalizedName:
                'whole milk 2l',
              category:
                'milk',
              quantityValue: 2000,
              quantityUnit: 'ml',
            },
            {
              normalizedName:
                'chocolate biscuits 300g',
              category:
                'biscuits',
              quantityValue: 300,
              quantityUnit: 'g',
            },
          );

        expect(result.method)
          .toBe('new');
      },
    );

  },
);
