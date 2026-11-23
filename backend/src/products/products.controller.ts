import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('basket/compare')
  compareBasket(
    @Body()
    body: {
      canonicalProductIds?: unknown;
    },
  ) {
    if (
      !Array.isArray(body.canonicalProductIds) ||
      body.canonicalProductIds.length === 0
    ) {
      throw new BadRequestException(
        '"canonicalProductIds" must be a non-empty array',
      );
    }

    if (body.canonicalProductIds.length > 50) {
      throw new BadRequestException('A basket may contain at most 50 products');
    }

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    const canonicalProductIds = body.canonicalProductIds.map((value) => {
      if (typeof value !== 'string' || !uuidPattern.test(value)) {
        throw new BadRequestException(
          'Every canonical product ID must be a valid UUID',
        );
      }

      return value;
    });

    return this.productsService.compareBasket(canonicalProductIds);
  }

  @Get('search')
  search(@Query('q') query?: string, @Query('limit') rawLimit?: string) {
    const value = query?.trim();

    if (!value) {
      throw new BadRequestException('Query parameter "q" is required');
    }

    const parsedLimit = Number(rawLimit ?? 25);

    const limit =
      Number.isInteger(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 100)
        : 25;

    return this.productsService.search(value, limit);
  }

  @Get(':canonicalId/prices')
  prices(
    @Param('canonicalId', ParseUUIDPipe)
    canonicalId: string,
  ) {
    return this.productsService.pricesForCanonical(canonicalId);
  }

  @Get('retailer/:productId/history')
  history(
    @Param('productId', ParseUUIDPipe)
    productId: string,
  ) {
    return this.productsService.historyForProduct(productId);
  }
}
