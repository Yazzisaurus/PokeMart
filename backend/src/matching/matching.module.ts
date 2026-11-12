import { Module } from '@nestjs/common';

import {
  ProductMatcherService,
} from './product-matcher.service.js';

@Module({
  providers: [
    ProductMatcherService,
  ],

  exports: [
    ProductMatcherService,
  ],
})
export class MatchingModule {}
