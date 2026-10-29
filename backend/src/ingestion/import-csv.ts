import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module.js';
import { IngestionService } from './ingestion.service.js';

const filePath = process.argv[2];
const retailer = process.argv[3];
const limitArgument = process.argv[4];

if (!filePath || !retailer) {
  console.error(
    'Usage: npm run import:csv -- <file> <retailer> [limit]',
  );

  process.exit(1);
}

const limit = limitArgument
  ? Number(limitArgument)
  : undefined;

const app = await NestFactory.createApplicationContext(
  AppModule,
);

try {
  const ingestionService =
    app.get(IngestionService);

  const count =
    await ingestionService.importCsv(
      filePath,
      retailer,
      limit,
    );

  console.log(
    `Imported ${count} raw rows for ${retailer}.`,
  );
} finally {
  await app.close();
}
