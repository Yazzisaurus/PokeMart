import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import type { RawSupermarketRowInsert } from './ingestion.types.js';

@Injectable()
export class RawSupermarketRowRepository {
  constructor(private readonly prisma: PrismaService) {}

  createMany(rows: RawSupermarketRowInsert[]) {
    return this.prisma.rawSupermarketRow.createMany({ data: rows });
  }

  findByRetailer(retailer: string, take: number) {
    return this.prisma.rawSupermarketRow.findMany({
      where: { retailer },
      orderBy: { id: 'asc' },
      take,
    });
  }

  findByRetailerWhereProductNameContains(
    retailer: string,
    productName: string,
    take: number,
  ) {
    return this.prisma.rawSupermarketRow.findMany({
      where: {
        retailer,
        productName: {
          contains: productName,
          mode: 'insensitive',
        },
      },
      orderBy: { id: 'asc' },
      take,
    });
  }
}
