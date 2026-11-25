import dataSource from '../database/data-source.js';
import { ProductNormalizerService } from '../normalization/product-normalizer.service.js';
import { RawSupermarketRow } from './entities/raw-supermarket-row.entity.js';
import { StagingTransformService } from './staging-transform.service.js';

async function bootstrap() {
  const limit = Number(process.argv[2] ?? 10);

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('Transform limit must be a positive integer');
  }

  dataSource.setOptions({
    migrations: [],
  });

  await dataSource.initialize();

  try {
    const rawRepository = dataSource.getRepository(RawSupermarketRow);
    const normalizer = new ProductNormalizerService();

    const transformService = new StagingTransformService(
      rawRepository,
      dataSource,
      normalizer,
    );

    const summary = await transformService.transformPending(limit);

    console.log('Staging transform summary:', summary);
  } finally {
    await dataSource.destroy();
  }
}

bootstrap().catch((error) => {
  console.error('Staging transform failed:', error);
  process.exitCode = 1;
});
