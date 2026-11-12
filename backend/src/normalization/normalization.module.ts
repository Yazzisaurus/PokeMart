import { Module } from '@nestjs/common';

import {
  ProductNormalizerService,
} from './product-normalizer.service.js';

@Module({
  providers: [
    ProductNormalizerService,
  ],

  exports: [
    ProductNormalizerService,
  ],
})
export class NormalizationModule {}
