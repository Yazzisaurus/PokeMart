import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RetailersModule } from './retailers/retailers.module.js';
import { ProductsModule } from './products/products.module.js';
import { PricesModule } from './prices/prices.module.js';
import { IngestionModule } from './ingestion/ingestion.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string>('DB_PORT')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),

        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    RetailersModule,
    ProductsModule,
    PricesModule,
    IngestionModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
