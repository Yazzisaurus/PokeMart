import dataSource from '../database/data-source.js';
import { ProductNormalizerService } from '../normalization/product-normalizer.service.js';
import { CanonicalProduct } from '../products/entities/canonical-product.entity.js';
import { RetailerProduct } from '../products/entities/retailer-product.entity.js';
import { CanonicalAssignmentService } from './canonical-assignment.service.js';
import { ProductMatcherService } from './product-matcher.service.js';

async function bootstrap() {
  const limit = Number(process.argv[2] ?? 10);

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('Assignment limit must be a positive integer');
  }

  dataSource.setOptions({
    migrations: [],
  });

  await dataSource.initialize();

  try {
    const retailerProductRepository = dataSource.getRepository(RetailerProduct);

    const canonicalProductRepository =
      dataSource.getRepository(CanonicalProduct);

    const matcher = new ProductMatcherService();
    const normalizer = new ProductNormalizerService();

    const assignmentService = new CanonicalAssignmentService(
      retailerProductRepository,
      canonicalProductRepository,
      matcher,
      normalizer,
    );

    const summary = await assignmentService.assignPending(limit);

    console.log('Canonical assignment summary:', summary);
  } finally {
    await dataSource.destroy();
  }
}

bootstrap().catch((error) => {
  console.error('Canonical assignment failed:', error);
  process.exitCode = 1;
});
