import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { IngestionModule } from './ingestion/ingestion.module.js';
import { NormalizationModule } from './normalization/normalization.module.js';
import { MatchingModule } from './matching/matching.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    AuthModule,
    IngestionModule,
    NormalizationModule,
    MatchingModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
