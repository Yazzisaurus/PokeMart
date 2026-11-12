import { Injectable } from '@nestjs/common';

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
  method: 'automatic' | 'review' | 'new';
}

@Injectable()
export class ProductMatcherService {

  tokenize(value: string): Set<string> {
    return new Set(
      value
        .toLowerCase()
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean),
    );
  }

  jaccardSimilarity(
    left: string,
    right: string,
  ): number {

    const leftTokens =
      this.tokenize(left);

    const rightTokens =
      this.tokenize(right);

    if (
      leftTokens.size === 0 &&
      rightTokens.size === 0
    ) {
      return 1;
    }

    const intersection =
      new Set(
        [...leftTokens].filter(
          (token) =>
            rightTokens.has(token),
        ),
      );

    const union =
      new Set([
        ...leftTokens,
        ...rightTokens,
      ]);

    if (union.size === 0) {
      return 0;
    }

    return (
      intersection.size /
      union.size
    );
  }

  levenshteinDistance(
    left: string,
    right: string,
  ): number {

    const rows =
      left.length + 1;

    const columns =
      right.length + 1;

    const matrix: number[][] =
      Array.from(
        { length: rows },
        () =>
          Array(columns).fill(0),
      );

    for (
      let row = 0;
      row < rows;
      row++
    ) {
      matrix[row][0] = row;
    }

    for (
      let column = 0;
      column < columns;
      column++
    ) {
      matrix[0][column] =
        column;
    }

    for (
      let row = 1;
      row < rows;
      row++
    ) {
      for (
        let column = 1;
        column < columns;
        column++
      ) {

        const substitutionCost =
          left[row - 1] ===
          right[column - 1]
            ? 0
            : 1;

        matrix[row][column] =
          Math.min(
            matrix[row - 1][column] + 1,
            matrix[row][column - 1] + 1,
            matrix[row - 1][column - 1] +
              substitutionCost,
          );
      }
    }

    return matrix[
      rows - 1
    ][
      columns - 1
    ];
  }

  editSimilarity(
    left: string,
    right: string,
  ): number {

    if (
      left.length === 0 &&
      right.length === 0
    ) {
      return 1;
    }

    const maxLength =
      Math.max(
        left.length,
        right.length,
      );

    if (maxLength === 0) {
      return 0;
    }

    const distance =
      this.levenshteinDistance(
        left,
        right,
      );

    return (
      1 -
      distance / maxLength
    );
  }

  categorySimilarity(
    left?: string | null,
    right?: string | null,
  ): number {

    if (!left || !right) {
      return 0.5;
    }

    return left === right
      ? 1
      : 0;
  }

  quantitySimilarity(
    left: MatchableProduct,
    right: MatchableProduct,
  ): number {

    if (
      left.quantityValue == null ||
      right.quantityValue == null ||
      !left.quantityUnit ||
      !right.quantityUnit
    ) {
      return 0.5;
    }

    if (
      left.quantityUnit !==
      right.quantityUnit
    ) {
      return 0;
    }

    if (
      left.quantityValue ===
      right.quantityValue
    ) {
      return 1;
    }

    const larger =
      Math.max(
        left.quantityValue,
        right.quantityValue,
      );

    const smaller =
      Math.min(
        left.quantityValue,
        right.quantityValue,
      );

    return smaller / larger;
  }

  compare(
    left: MatchableProduct,
    right: MatchableProduct,
  ): ProductMatchResult {

    const jaccardScore =
      this.jaccardSimilarity(
        left.normalizedName,
        right.normalizedName,
      );

    const editScore =
      this.editSimilarity(
        left.normalizedName,
        right.normalizedName,
      );

    const nameScore =
      (
        jaccardScore * 0.6 +
        editScore * 0.4
      );

    const categoryScore =
      this.categorySimilarity(
        left.category,
        right.category,
      );

    const quantityScore =
      this.quantitySimilarity(
        left,
        right,
      );

    const score =
      (
        nameScore * 0.65 +
        categoryScore * 0.15 +
        quantityScore * 0.20
      );

    let method:
      ProductMatchResult['method'];

    if (score >= 0.80) {
 	method = 'automatic';
	} else if (score >= 0.68) {
	 method = 'review';
	} else {
	method = 'new';
	}

    return {
      score,
      nameScore,
      jaccardScore,
      editScore,
      categoryScore,
      quantityScore,
      method,
    };
  }
}
