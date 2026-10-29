import 'dotenv/config';

import { DataSource } from 'typeorm';

import { Retailer } from '../retailers/entities/retailer.entity.js';
import { RetailerProduct } from '../products/entities/retailer-product.entity.js';
import { PriceObservation } from '../prices/entities/price-observation.entity.js';
import { RawSupermarketRow } from '../ingestion/entities/raw-supermarket-row.entity.js';

export default new DataSource({
  type: 'postgres',

  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),

  username: process.env.DB_USERNAME ?? 'pokemart',
  password: process.env.DB_PASSWORD ?? 'pokemart',
  database: process.env.DB_NAME ?? 'pokemart',

  entities: [
    Retailer,
    RetailerProduct,
    PriceObservation,
    RawSupermarketRow,
  ],

  migrations: [
    'src/database/migrations/*{.ts,.js}',
  ],

  migrationsTableName: 'migrations',

  synchronize: false,
});
