# PokeMart Database Development Log

This file documents the ongoing database/backend work for the `feature/database` branch of PokeMart.

The current goal is to build a NestJS + PostgreSQL backend that can ingest supermarket pricing data, preserve historical prices, normalize retailer products, and eventually support grocery price comparison and basket optimization.

---

## Current Architecture

```text
Angular frontend
      |
      v
NestJS backend
      |
      v
Prisma
      |
      v
PostgreSQL / pgvector
      |
      v
Supermarket pricing data
```

---

## Branch

Current development branch:

```text
feature/database
```

Verify with:

```bash
git branch --show-current
```

---

## Repository Structure

Relevant structure:

```text
PokeMart/
├── docker-compose.yml
├── .gitignore
├── DATABASE_READ.md
├── migrations/
│   ├── run.mjs
│   └── *.sql
├── frontend/
└── backend/
    ├── package.json
    ├── package-lock.json
    ├── .env
    ├── data/
    │   └── samples/
    │       └── tesco-sample.csv
    └── src/
        ├── app.module.ts
        ├── ingestion/
        ├── prices/
        ├── products/
        └── retailers/
```

---

## Node.js and npm

Node.js/npm were installed because `npm` was initially unavailable.

Verify:

```bash
node -v
npm -v
```

---

## Backend Dependencies

Installed from:

```text
PokeMart/backend
```

The backend database packages are Prisma and `pg`:

- `@prisma/client`
- `@prisma/adapter-pg`
- `prisma` (dev)
- `pg`
- `@nestjs/config`
- `csv-parse`
- `dotenv`
- `reflect-metadata`

The first install also added TypeORM and `ts-node`. Those packages are not dependencies and must not be installed again. Schema changes stay in `/migrations`.

---

## npm Audit Note

The backend install reported dependency vulnerabilities.

Do not automatically run:

```bash
npm audit fix --force
```

because that can introduce breaking dependency changes.

Safer review commands:

```bash
npm audit
npm audit fix --dry-run
```

---

## PostgreSQL and Docker

The repository already included:

```text
PokeMart/docker-compose.yml
```

The existing database image is:

```text
pgvector/pgvector:0.8.7-pg18
```

This provides PostgreSQL plus pgvector support.

Potential future uses of pgvector:

- semantic product matching
- embedding similarity
- fuzzy retailer-product matching

Start PostgreSQL from `PokeMart/backend`:

```bash
sudo docker compose -f ../docker-compose.yml up -d
```

Check status:

```bash
sudo docker compose -f ../docker-compose.yml ps
```

Expected status:

```text
healthy
```

Connect directly:

```bash
sudo docker compose -f ../docker-compose.yml exec postgres   psql -U pokemart -d pokemart
```

Exit PostgreSQL:

```text
\q
```

---

## Environment Variables

Created:

```text
backend/.env
```

Contents:

```env
DATABASE_URL=postgresql://pokemart:pokemart@localhost:5432/pokemart
```

Prisma and the SQL migration runner read `DATABASE_URL`. Older `.env` files may still contain `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_NAME` from TypeORM. Nothing in the backend reads them.

The `.env` file is ignored by Git.

Current `.gitignore` includes:

```text
node_modules/
.env
dist/
*.tsbuildinfo
```

---

## NestJS Database Connection

NestJS connects to PostgreSQL through Prisma. `PrismaService` reads `DATABASE_URL`. There is no schema sync from the ORM. Schema changes belong in numbered SQL files under `/migrations`, applied with `node migrations/run.mjs`.

The connection was successfully tested with:

```bash
npm run start:dev
```

Successful output included:

```text
Found 0 errors.
Nest application successfully started
```

---

# Database Schema

## Retailer

Represents a supermarket.

Examples:

```text
Tesco
ASDA
Aldi
Morrisons
Sainsbury's
```

Table:

```text
retailers
```

Core fields:

```text
id   UUID PRIMARY KEY
name VARCHAR(100) UNIQUE NOT NULL
```

---

## RetailerProduct

Represents a retailer-specific product listing.

Table:

```text
retailer_products
```

Core fields:

```text
id
retailer_id
source_name
normalized_name
own_brand
source_product_id
```

Relationship:

```text
Retailer
   |
   | 1 : many
   v
RetailerProduct
```

Foreign key:

```text
retailer_products.retailer_id
    -> retailers.id
```

Delete behavior:

```text
ON DELETE CASCADE
```

---

## PriceObservation

Represents one historical price observation for a retailer product.

Table:

```text
price_observations
```

Core fields:

```text
id
retailer_product_id
price_minor
unit_price_minor
unit_label
currency
observed_date
```

Relationship:

```text
RetailerProduct
   |
   | 1 : many
   v
PriceObservation
```

Foreign key:

```text
price_observations.retailer_product_id
    -> retailer_products.id
```

Index:

```text
(retailer_product_id, observed_date)
```

Money is stored in minor units.

Example:

```text
£1.49 -> 149
```

This avoids floating-point money errors.

Historical values are inserted as separate observations rather than overwritten.

---

## RawSupermarketRow

Represents raw imported CSV data before normalization.

Table:

```text
raw_supermarket_rows
```

Purpose:

```text
CSV
 |
 v
RawSupermarketRow
 |
 +-- extracted useful fields
 |
 +-- complete original row stored in JSONB
```

Raw text is preserved intentionally so unusual source values do not cause import failures or data loss.

---

# SQL Migrations

Schema changes are SQL files in `/migrations`. `migrations/run.mjs` applies each unapplied file in numeric order, inside its own transaction, and records the filename in `schema_migrations`. There is no down migration. Do not edit a file after it has been applied; add a new numbered file.

Apply from the repo root, or from `backend` with `npm run db:migrate`:

```bash
node migrations/run.mjs
```

The runner reads `DATABASE_URL` from the environment, or from `backend/.env`.

Files:

```text
0_add_users.sql
1_create_retailers.sql
2_create_retailer_products.sql
3_create_price_observations.sql
4_create_raw_supermarket_rows.sql
5_create_canonical_products.sql
6_add_raw_processing_status.sql
```

`1_create_retailers.sql` also creates the `uuid-ossp` extension, because the uuid primary keys default to `uuid_generate_v4()`.

These six product files replace the old TypeORM migration classes. A fresh database can run the runner directly. A database that already has these tables from TypeORM must not run the `CREATE TABLE` statements again. After checking that the tables and columns are already present, create the runner's ledger if needed, record the files as applied, and then run the runner so only new files, such as `0_add_users.sql`, execute:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO schema_migrations (filename) VALUES
    ('1_create_retailers.sql'),
    ('2_create_retailer_products.sql'),
    ('3_create_price_observations.sql'),
    ('4_create_raw_supermarket_rows.sql'),
    ('5_create_canonical_products.sql'),
    ('6_add_raw_processing_status.sql')
ON CONFLICT DO NOTHING;
```

The old TypeORM ledger table, `migrations`, is left in place on those databases. New databases do not create it.

---

# Current PostgreSQL Tables

Verified with:

```sql
\dt
```

Tables present at that point:

```text
migrations
retailers
retailer_products
price_observations
raw_supermarket_rows
```

Later schema added `canonical_products`, `users`, and `schema_migrations`. Databases created from the SQL files do not have the TypeORM `migrations` table.

---

# CSV Ingestion

The ingestion pipeline currently uses:

```text
backend/src/ingestion/
```

Main components:

```text
IngestionModule
IngestionService
RawSupermarketRow
import-csv.ts
```

The CSV command builds the NestJS project and executes the compiled importer.

Example:

```bash
npm run import:csv -- ./data/samples/tesco-sample.csv Tesco 10
```

Successful result:

```text
Imported 3 raw rows for Tesco.
```

---

## Sample Tesco Data

Current sample file:

```text
backend/data/samples/tesco-sample.csv
```

Rows:

```text
Tesco Whole Milk 2L
Coca Cola Zero 2L
Tesco White Bread 800g
```

The rows were successfully imported and verified in PostgreSQL.

Verification query:

```sql
SELECT
    id,
    retailer,
    product_name,
    price_raw,
    unit_price_raw,
    category,
    observed_date_raw
FROM raw_supermarket_rows
ORDER BY id;
```

Result:

```text
3 rows
```

The complete original source row is also preserved as JSONB.

---

# Current Data Flow

```text
Supermarket CSV
      |
      v
NestJS import command
      |
      v
IngestionService
      |
      v
raw_supermarket_rows
      |
      v
Future normalization pipeline
      |
      v
RetailerProduct
      |
      v
PriceObservation
```

---

# Original Milestone Status

These items record the first database milestone. The TypeORM entities and migration classes named below were later replaced by Prisma models and the SQL files in `/migrations`.

## Completed

- [x] Node.js/npm installed
- [x] Backend NestJS dependencies installed
- [x] Docker installed
- [x] PostgreSQL container started
- [x] PostgreSQL health verified
- [x] NestJS connected to PostgreSQL
- [x] `.env` created
- [x] `.env` ignored by Git
- [x] TypeORM migration configuration created (later replaced by `/migrations` SQL files)
- [x] `Retailer` entity created
- [x] `CreateRetailers` migration executed
- [x] `RetailerProduct` entity created
- [x] `CreateRetailerProducts` migration executed
- [x] `PriceObservation` entity created
- [x] `CreatePriceObservations` migration executed
- [x] `RawSupermarketRow` entity created
- [x] raw supermarket staging migration executed
- [x] CSV ingestion service created
- [x] CSV import CLI created
- [x] sample Tesco CSV created
- [x] sample CSV imported successfully
- [x] imported rows verified in PostgreSQL
- [x] root-level accidental npm files cleaned up
- [x] generated/local files added to `.gitignore`

---

# Git Status At The First Database Commit

This list is the status from that commit, not the current tree. `backend/src/database/` was removed when those TypeORM migrations moved to `/migrations`.

Expected intentional changes:

```text
M  .gitignore
M  backend/package-lock.json
M  backend/package.json
M  backend/src/app.module.ts

?? backend/data/
?? backend/src/database/
?? backend/src/ingestion/
?? backend/src/prices/
?? backend/src/products/
?? backend/src/retailers/
?? DATABASE_READ.md
```

Files that must NOT be committed:

```text
backend/.env
backend/node_modules/
backend/dist/
backend/tsconfig.tsbuildinfo
node_modules/
```

---

# First GitHub Push Checklist

Before staging:

```bash
git status --short
```

Confirm `.env` is ignored:

```bash
git check-ignore -v backend/.env
```

Confirm `.env` is not tracked:

```bash
git ls-files backend/.env
```

The second command should print nothing.

Stage intended changes:

```bash
git add   .gitignore   DATABASE_READ.md   backend/package.json   backend/package-lock.json   backend/src   backend/data/samples/tesco-sample.csv
```

Inspect staged changes:

```bash
git status
```

Optional summary:

```bash
git diff --cached --stat
```

Optional full diff:

```bash
git diff --cached
```

Commit:

```bash
git commit -m "feat(database): add supermarket pricing database foundation"
```

Push the branch:

```bash
git push -u origin feature/database
```

Future pushes from this branch can normally use:

```bash
git push
```

---

# Next Development Phase

After the first GitHub push:

1. Normalize retailer product names.
2. Parse raw prices into integer minor units.
3. Normalize units and quantities.
4. Create canonical products.
5. Match retailer listings to canonical products.
6. Move validated prices into `price_observations`.
7. Add product-search endpoints.
8. Add retailer price-comparison endpoints.
9. Add basket comparison.
10. Connect Angular frontend.

---

_Last updated: 28 October 2026_

## Current Development Status

The PokéMart backend database foundation now supports ingestion, normalization, cross-retailer product modelling, and preliminary product matching using real supermarket data.

### Real Supermarket Dataset Integration

The development database currently contains **50,000 raw supermarket records**, using a 10,000-row sample from each of the following retailers:

- Aldi
- ASDA
- Morrisons
- Sainsbury's
- Tesco

The source dataset is the *Time Series UK Supermarket Data* dataset. It is being used as representative prototype data while the PokéMart system and comparison pipeline are developed.

The dataset is UK-based and therefore currently uses GBP pricing. It should not be interpreted as live or current Cork supermarket pricing.

The raw source files are excluded from Git because of their size.

### CSV Ingestion

The CSV ingestion pipeline now supports the source dataset's real column structure, including:

- `names`
- `prices_(£)`
- `prices_unit_(£)`
- `unit`
- `category`
- `own_brand`
- `date`
- `supermarket`

All original source records are also retained in the `raw` JSONB field of `raw_supermarket_rows`.

This staging approach allows source-data problems to be investigated without losing the original imported values.

### Raw Data Validation

The ingestion pipeline was validated across all five retailers.

Current staging status:

- 50,000 raw rows imported
- 10,000 rows per retailer
- All product prices successfully mapped
- Two ASDA records contain missing unit prices in the original dataset
- These missing values are intentionally preserved rather than fabricated

Dates in the source dataset use `YYYYMMDD` format, for example:

```text
20240413
```

The normalization layer converts these to:

```text
2024-04-13
```

### Product Normalization

A `ProductNormalizerService` has been implemented and tested.

The normalization layer currently handles:

- retailer-name removal
- lowercase and punctuation normalization
- measurement normalization
- GBP price conversion to integer minor units
- category normalization
- own-brand Boolean parsing
- `YYYYMMDD` date conversion
- already-normalized ISO dates
- litre-to-millilitre conversion
- kilogram-to-gram conversion
- explicit product counts
- leading and trailing counts
- multipacks such as `6x25g`
- compact counts such as `x8` and `x30`

Examples include:

```text
Tesco 200 Cotton Buds
→ 200 cotton buds
→ quantity: 200 count
```

```text
Mamia Organic Oaty Bars 6x25g
→ quantity: 150 g
```

```text
Tassimo Hot Chocolate Pods x8
→ quantity: 8 count
```

The normalization service currently has **11 passing automated tests**.

### Canonical Product Model

PokéMart now includes a `canonical_products` table.

The purpose of a canonical product is to represent the shared product concept behind retailer-specific listings.

For example:

```text
Tesco Whole Milk 2L
Aldi Whole Milk 2L
ASDA British Whole Milk 2L
        ↓
Canonical Product:
Whole Milk 2L
```

The canonical product model currently stores:

- `id`
- `display_name`
- `normalized_name`
- `category`
- `quantity_value`
- `quantity_unit`
- `created_at`

`retailer_products` now additionally contains:

- `canonical_product_id`
- `match_method`
- `match_confidence`

The canonical product relationship is nullable while matching is being performed.

### Cross-Retailer Product Matching

A preliminary `ProductMatcherService` has been implemented.

Matching currently considers:

- normalized product-name similarity
- Jaccard token similarity
- Levenshtein edit similarity
- category compatibility
- quantity compatibility

The current weighted score is based primarily on product-name similarity, with category and quantity information used as additional evidence.

Initial matching decisions are:

```text
score >= 0.80
→ automatic candidate

score >= 0.68 and < 0.80
→ review candidate

score < 0.68
→ treated as a new/different product
```

These thresholds are prototype values and are being evaluated against real supermarket listings rather than treated as fixed constants.

The matcher has **6 passing automated tests**.

### Real-Data Matching Preview

A read-only matching preview has been created to evaluate the matcher against real supermarket records before canonical-product relationships are written to the database.

The preview:

- searches each retailer separately
- balances the number of records sampled per retailer
- compares only products from different retailers
- removes duplicate time-series representations
- reports automatic and review candidates
- exposes Jaccard, edit-distance, category, quantity, and final scores

Queries including products such as eggs, milk, bread, butter, and cola can be used to evaluate matching behaviour.

Ambiguous matches are intentionally classified for review rather than automatically merged.

### Staging Processing Status

Two processing-control fields have been added to `raw_supermarket_rows`:

```text
processed_at
processing_error
```

These fields allow staging records to be transformed safely while retaining information about rows that fail processing.

Current status:

```text
Raw staging rows: 50,000
Processed rows: 0
```

The staging-to-production transformation has not yet been executed.

### Current Migration History

Product schema now lives in the manual SQL migrations:

```text
1_create_retailers.sql
2_create_retailer_products.sql
3_create_price_observations.sql
4_create_raw_supermarket_rows.sql
5_create_canonical_products.sql
6_add_raw_processing_status.sql
```

`0_add_users.sql` is separate and creates the auth user table. Apply everything with `node migrations/run.mjs`. The Nest app reads and writes through Prisma models in `backend/prisma/schema.prisma`. Services call `PrismaService` directly for now.

### Current Data Architecture

```text
External Supermarket CSV
          │
          ▼
RawSupermarketRow
          │
          │ normalization
          ▼
RetailerProduct
          │
          ├──────────────► PriceObservation
          │
          │ matching
          ▼
CanonicalProduct
```

The raw staging layer preserves source data, while the production layer is intended to support retailer comparison, historical pricing, product search, and basket optimization.

### Next Development Phase

The next major development tasks are:

1. Transform staging rows into production `RetailerProduct` and `PriceObservation` records.
2. Apply canonical-product matching to retailer products.
3. Process the dataset incrementally and validate transformation failures.
4. Build the product search and price-comparison API.
5. Build the basket-comparison engine.
6. Connect the Angular frontend to the PokéMart API.
7. Expand from development samples to larger portions of the supermarket dataset.

Last update: 11/14/2026
