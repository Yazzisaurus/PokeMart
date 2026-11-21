import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';

import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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
}
