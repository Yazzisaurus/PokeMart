# PokéMart Database Development

This document describes the current PokéMart database/backend architecture, ingestion pipeline, product-normalization and matching logic, staging transformation process, canonical assignment, product-search and price-comparison API, basket-comparison API, and final verified backend state.

PokéMart is being developed as a grocery price-comparison system capable of ingesting supermarket pricing data, preserving historical prices, matching equivalent products across retailers, comparing current prices, and determining the cheapest complete single-store grocery basket for the current MVP.

_Last updated: 21 November 2026_

---

## Current Architecture

```text
Angular Frontend
       │
       ▼
NestJS Backend
       │
       ▼
TypeORM
       │
       ▼
PostgreSQL + pgvector
       │
       ▼
Supermarket Pricing Data
```

The backend uses:

- NestJS
- TypeORM
- PostgreSQL
- pgvector
- Docker
- Vitest
- csv-parse

Database schema changes are managed through TypeORM migrations.

```typescript
synchronize: false;
```

Automatic schema synchronization is intentionally disabled.

Following backend integration work, Prisma was removed and authentication persistence was migrated onto TypeORM so that the NestJS backend uses a single ORM/database architecture.

_Last updated: 19 November 2026_

---

# Development Branch

Current database development branch:

```text
feature/database
```

Verify with:

```bash
git branch --show-current
```

The database work is currently being integrated into:

```text
dev
```

_Last updated: 20 November 2026_

---

# PostgreSQL and Docker

The development database runs through Docker Compose.

From `PokeMart/backend`:

```bash
sudo docker compose -f ../docker-compose.yml up -d
```

Check container status:

```bash
sudo docker compose -f ../docker-compose.yml ps
```

The PostgreSQL container should report:

```text
healthy
```

Connect directly to PostgreSQL:

```bash
sudo docker compose -f ../docker-compose.yml exec postgres \
  psql -U pokemart -d pokemart
```

Exit PostgreSQL with:

```text
\q
```

The PostgreSQL container and persisted database were re-verified successfully after a system restart on 20 November 2026.

_Last updated: 20 November 2026_

---

# Environment Variables

The backend uses:

```text
backend/.env
```

Development database configuration:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=pokemart
DB_PASSWORD=pokemart
DB_NAME=pokemart
```

The `.env` file must not be committed to Git.

_Last updated: 28 October 2026_

---

# Database Model

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
id
name
```

`name` is unique.

_Last updated: 28 October 2026_

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
canonical_product_id
match_method
match_confidence
```

Relationship:

```text
Retailer
   │
   │ 1 : many
   ▼
RetailerProduct
```

`canonical_product_id` remains nullable until canonical matching has been performed.

_Last updated: 14 November 2026_

---

## PriceObservation

Represents a historical price observation for a retailer product.

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
       │
       │ 1 : many
       ▼
PriceObservation
```

Money is stored in integer minor units.

Example:

```text
£1.49 → 149
£0.40 → 40
```

This avoids floating-point errors when performing basket calculations.

Historical observations are stored separately instead of overwriting previous prices.

_Last updated: 28 October 2026_

---

## RawSupermarketRow

Represents imported source data before production transformation.

Table:

```text
raw_supermarket_rows
```

The staging table stores both extracted fields and the complete original CSV row in JSONB.

```text
CSV
 │
 ▼
RawSupermarketRow
 │
 ├── extracted fields
 │
 └── original JSONB source row
```

Important staging fields include:

```text
retailer
product_name
category
price_raw
unit_price_raw
unit_label
own_brand_raw
observed_date_raw
raw
imported_at
processed_at
processing_error
```

Preserving the raw source data allows source-data problems to be investigated without losing the original values.

The `processed_at` and `processing_error` fields were added to support safe incremental staging transformation.

_Last updated: 14 November 2026_

---

## CanonicalProduct

Represents a shared product concept that can be linked to equivalent retailer-specific listings.

Table:

```text
canonical_products
```

Core fields:

```text
id
display_name
normalized_name
category
quantity_value
quantity_unit
created_at
```

Conceptually:

```text
Tesco Whole Milk 2L
Aldi Whole Milk 2L
ASDA British Whole Milk 2L
        │
        ▼
CanonicalProduct
Whole Milk 2L
```

Canonical relationships will allow PokéMart to compare equivalent products across retailers.

_Last updated: 14 November 2026_

---

# Current TypeORM Migrations

Six TypeORM migrations are currently applied:

```text
1. CreateRetailers
2. CreateRetailerProducts
3. CreatePriceObservations
4. CreateRawSupermarketRows
5. CreateCanonicalProducts
6. AddRawProcessingStatus
```

Check migration status:

```bash
cd backend
npm run migration:show
```

All six should show:

```text
[X]
```

Migration commands:

```bash
npm run migration:show
npm run migration:run
npm run migration:revert
```

All six migrations were re-verified as applied on 21 November 2026.

_Last updated: 21 November 2026_

---

# Authentication ORM Consolidation

Authentication had been introduced using Prisma while the existing database architecture was already based on TypeORM.

The duplicate persistence approaches were consolidated so that the NestJS backend now uses TypeORM consistently.

The consolidation included:

- adding a TypeORM `User` entity
- registering `User` through `TypeOrmModule`
- migrating `UserRepository` from Prisma to TypeORM
- preserving the existing authentication/JWT logic
- removing `PrismaModule`
- removing `PrismaService`
- removing the Prisma schema and configuration
- removing generated Prisma client code
- removing Prisma npm dependencies
- removing automatic Prisma generation hooks

The resulting backend passed:

```text
Nest build
0 lint warnings
0 lint errors
18 / 18 automated tests
```

_Last updated: 19 November 2026_

---

# Supermarket Dataset

PokéMart currently uses development data from the:

```text
Time Series UK Supermarket Data
```

dataset.

The development database contains:

```text
50,000 raw supermarket rows
```

with:

```text
10,000 Aldi
10,000 ASDA
10,000 Morrisons
10,000 Sainsbury's
10,000 Tesco
```

The dataset is UK-based and therefore currently uses GBP pricing.

It is representative development data and should not be interpreted as live Irish supermarket pricing.

Large raw source files are excluded from Git.

_Last updated: 14 November 2026_

---

# CSV Ingestion

The ingestion pipeline supports the source dataset's real column names:

```text
names
prices_(£)
prices_unit_(£)
unit
category
own_brand
date
supermarket
```

Relevant backend components:

```text
src/ingestion/
├── entities/
│   └── raw-supermarket-row.entity.ts
├── ingestion.module.ts
├── ingestion.service.ts
└── import-csv.ts
```

The importer stores:

- extracted values
- retailer
- product name
- raw price
- unit price
- unit
- category
- own-brand value
- source date
- complete source record as JSONB

Example import:

```bash
npm run import:csv -- ./data/raw/All_Data_Tesco.csv Tesco 10000
```

_Last updated: 14 November 2026_

---

# Raw Data Validation

The ingestion pipeline has been validated across all five retailers.

Current raw dataset:

```text
50,000 rows
```

All product prices were successfully mapped.

Two ASDA records have missing unit-price values in the original source dataset.

These missing values are intentionally preserved rather than fabricated.

Source dates use:

```text
YYYYMMDD
```

Example:

```text
20240413
```

The normalization layer converts this to:

```text
2024-04-13
```

_Last updated: 14 November 2026_

---

# Product Normalization

PokéMart includes:

```text
ProductNormalizerService
```

The service handles:

- retailer-name removal
- lowercase normalization
- punctuation cleanup
- category normalization
- GBP price conversion into minor units
- Boolean parsing
- date conversion
- unit normalization
- quantity extraction
- litre-to-millilitre conversion
- kilogram-to-gram conversion
- explicit product counts
- leading counts
- trailing counts
- multipacks
- compact `x8`, `x30`, etc. counts

Examples:

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

Automated normalizer tests:

```text
11 passing
```

_Last updated: 14 November 2026_

---

# Cross-Retailer Product Matching

PokéMart includes:

```text
ProductMatcherService
```

The matcher considers:

- normalized product-name similarity
- Jaccard token similarity
- Levenshtein edit similarity
- category compatibility
- quantity compatibility

Current matching thresholds:

```text
score >= 0.80
→ automatic candidate

score >= 0.68 and < 0.80
→ review candidate

score < 0.68
→ different/new product
```

These are prototype thresholds and may be refined using real supermarket data.

Automated matcher tests:

```text
6 passing
```

_Last updated: 14 November 2026_

---

# Real-Data Matching Preview

A read-only matching preview is available for evaluating matching behaviour before canonical relationships are written.

The preview:

- samples retailers separately
- balances retailer representation
- compares only products from different retailers
- removes duplicate time-series representations
- reports automatic candidates
- reports review candidates
- exposes Jaccard score
- exposes edit-distance score
- exposes category score
- exposes quantity score
- exposes final confidence

Example ambiguous matches are intentionally sent for review instead of automatically merging them.

_Last updated: 14 November 2026_

---

# Canonical Product Assignment

Canonical-product assignment has now been executed for all 1,001 retailer products in the current production sample.

The assignment process uses `ProductMatcherService` to compare normalized retailer products against existing canonical products.

Final assignment results:

```text
Automatic matches:         34
New canonical products:   818
Review candidates:        149
Failed assignments:         0
Still unassigned:           0
```

A total of 818 canonical products currently exist.

Assignment behavior:

```text
score >= 0.80
→ automatic canonical match

score >= 0.68 and < 0.80
→ review candidate

score < 0.68
→ create new canonical product
```

Review candidates retain the proposed canonical relationship and confidence score, but the API does not expose them as confirmed product equivalences.

This prevents uncertain matches from being treated as verified cross-retailer comparisons.

_Last updated: 21 November 2026_

---

# Staging Transformation

PokéMart now includes:

```text
StagingTransformService
```

This transforms validated staging records into production database records.

Pipeline:

```text
RawSupermarketRow
        │
        ▼
Validation + Normalization
        │
        ├────────► Retailer
        │
        ├────────► RetailerProduct
        │
        └────────► PriceObservation
        │
        ▼
processed_at / processing_error
```

For each staging row, the transformation process:

1. validates the retailer name
2. validates and normalizes the product name
3. converts the raw price to integer minor units
4. parses the source date
5. parses and validates the unit price
6. normalizes the unit
7. parses the own-brand value
8. finds or creates the retailer
9. finds or creates the retailer product
10. avoids duplicate product/date observations
11. creates the price observation
12. marks the staging row as processed

If processing fails:

```text
processed_at = NULL
processing_error = failure reason
```

If processing succeeds:

```text
processed_at = current timestamp
processing_error = NULL
```

Transactions are used so that partially transformed records are not left in the production tables if a transformation fails.

_Last updated: 21 November 2026_

---

# Unit Price Handling

Non-positive source unit prices are treated as unavailable rather than legitimate zero-cost prices.

For example:

```text
prices_unit_(£) = 0.0
```

is stored as:

```text
NULL
```

for the production unit price.

Actual product prices must be valid and greater than zero.

_Last updated: 20 November 2026_

---

# Staging Transform Command

The transform can be run with:

```bash
npm run transform:staging -- <limit>
```

Examples:

```bash
npm run transform:staging -- 10
```

```bash
npm run transform:staging -- 100
```

The command builds the backend before executing the compiled transformation runner.

The transformation runner uses the TypeORM data source directly and disables migration loading for the transform process because schema migrations are managed separately.

_Last updated: 20 November 2026_

---

# Incremental Validation

The staging transformation was deliberately validated incrementally instead of immediately processing all 50,000 source records.

Validation sequence:

```text
10 rows
   ↓
100 total rows
   ↓
1,000 total rows
   ↓
1,001 total rows
```

Final verified staging state:

```text
Raw staging rows:          50,000
Processed staging rows:     1,001
Processing errors:              0
Retailer products:          1,001
Price observations:         1,001
```

All 1,001 transformed production records completed successfully with zero staging-processing failures.

The current production sample consists of the first 1,001 transformed records and currently represents Tesco data. The raw staging layer contains data from all five supermarket sources.

The transformed records were manually inspected to verify retailer values, product names, normalized names, own-brand values, prices, unit-price handling, currency, and observation dates.

_Last updated: 21 November 2026_

# Product Search and Price Comparison API

The backend now exposes product-search and price-comparison endpoints.

Product search:

```text
GET /products/search?q=<query>
```

Example:

```text
GET /products/search?q=7up&limit=5
```

Search results include:

- retailer product ID
- source product name
- normalized product name
- own-brand status
- canonical product
- review candidate, when applicable
- match method
- match confidence
- retailer
- current/latest price
- unit price
- currency
- observation date

Review relationships are returned separately from confirmed canonical products so uncertain matches are not presented to the frontend as verified equivalents.

Canonical price lookup:

```text
GET /products/:canonicalId/prices
```

The endpoint retrieves the latest available retailer prices associated with a confirmed canonical product.

Invalid canonical UUIDs are rejected with HTTP `400 Bad Request` rather than producing an internal server error.

Both endpoints were successfully smoke-tested against the development PostgreSQL database.

_Last updated: 21 November 2026_

---

# Basket Comparison API

A minimum viable single-store basket-comparison endpoint has been implemented.

Endpoint:

```text
POST /products/basket/compare
```

Example request:

```json
{
  "canonicalProductIds": ["canonical-product-id-1", "canonical-product-id-2"]
}
```

The basket service:

- retrieves the latest confirmed retailer price for each requested canonical product
- groups available products by retailer
- selects the cheapest retailer listing when duplicate retailer matches exist
- calculates the retailer basket total
- records products missing from each retailer
- marks whether each retailer can satisfy the complete basket
- identifies the cheapest complete single-store basket

A two-product smoke test successfully returned:

```text
Retailer: Tesco
Requested products: 2
Matched products: 2
Complete basket: true
Missing products: 0
Total: £9.89
```

Advanced split-store optimization, routing, and distance-aware optimization are intentionally outside the current MVP scope.

_Last updated: 21 November 2026_

---

# Current Data Architecture

```text
External Supermarket CSV
          │
          ▼
RawSupermarketRow
          │
          │ staging transformation
          ▼
RetailerProduct ─────────────► PriceObservation
          │
          │ canonical matching / assignment
          ▼
CanonicalProduct
          │
          ├────────────► Product Search / Price API
          │
          └────────────► Basket Comparison API
```

The staging layer preserves original source information.

The production layer now supports:

- normalized retailer products
- historical prices
- canonical product matching and assignment
- product search
- canonical price lookup
- review-candidate separation
- single-store basket comparison

_Last updated: 21 November 2026_

# Current Backend Validation

The backend currently passes:

```text
Nest build: successful
```

```text
Lint warnings: 0
Lint errors:   0
```

Automated tests:

```text
18 passing
```

Current test groups include:

```text
ProductNormalizerService: 11 tests
ProductMatcherService:      6 tests
AppController:              1 test
```

Formatting and whitespace were verified with:

```bash
git diff --check
```

The final feature smoke tests also verified:

- product search against the development database
- canonical price lookup
- HTTP 400 validation for malformed canonical UUIDs
- one-product basket comparison
- two-product basket comparison
- review candidates are not exposed as confirmed canonical products

_Last updated: 21 November 2026_

# Current Database Pipeline Status

## Completed

- [x] PostgreSQL + pgvector Docker environment
- [x] NestJS TypeORM integration
- [x] TypeORM migration system
- [x] Retailer model
- [x] retailer-product model
- [x] historical price-observation model
- [x] raw supermarket staging model
- [x] 50,000-row supermarket dataset ingestion
- [x] real source-column mapping
- [x] raw JSONB preservation
- [x] product normalization
- [x] quantity normalization
- [x] date normalization
- [x] price normalization
- [x] canonical-product database model
- [x] retailer-product canonical relationship
- [x] cross-retailer product matcher
- [x] real-data matching preview
- [x] staging processing-status fields
- [x] Prisma/TypeORM consolidation
- [x] TypeORM authentication persistence
- [x] staging-to-production transformation service
- [x] staging transformation CLI
- [x] incremental transformation validation through 1,001 rows
- [x] zero staging-transformation failures
- [x] canonical assignment service
- [x] canonical assignment CLI
- [x] canonical evaluation of all 1,001 production products
- [x] product search API
- [x] canonical price-comparison API
- [x] malformed UUID validation
- [x] minimum viable basket-comparison API
- [x] one-product basket smoke test
- [x] two-product basket smoke test
- [x] build validation
- [x] lint validation
- [x] automated backend tests
- [x] final migration verification
- [x] final database-state verification

_Last updated: 21 November 2026_

# Remaining Database / Backend Roadmap

The database/backend MVP planned for this development phase is complete.

## Completed in this phase

### Canonical Product Assignment

All 1,001 current production `RetailerProduct` records were evaluated.

Final assignment results:

```text
Automatic matches:        34
New canonical products:  818
Review candidates:       149
Failed assignments:        0
Still unassigned:          0
```

Review candidates retain the proposed canonical relationship and confidence score, but the API does not expose them as confirmed product equivalences.

### Product Search and Price Comparison API

Implemented endpoints:

```text
GET /products/search?q=<query>
GET /products/:canonicalId/prices
```

Search results include retailer-product details, canonical-product status, review-candidate status, retailer information, latest price, unit price, currency, and observation date.

Malformed canonical UUIDs return HTTP `400 Bad Request`.

### Basket Comparison

Implemented endpoint:

```text
POST /products/basket/compare
```

The MVP basket service:

- accepts canonical product IDs
- retrieves the latest confirmed retailer prices
- groups results by retailer
- selects the lowest retailer price for duplicate matches
- identifies missing products
- marks whether a retailer can satisfy the complete basket
- calculates the complete basket total
- identifies the cheapest complete single-store basket

A two-product smoke test returned a complete Tesco basket totaling £9.89.

## Remaining team-level work

The remaining work is outside the database/backend implementation completed here:

- connect the Angular frontend to the implemented API
- prepare the team demo / recording
- merge reviewed work into the team integration branch
- optionally expand the production transformation beyond the validated 1,001-row sample if needed later

Advanced split-store optimization, routing, distance-aware optimization, and additional optional features are intentionally outside the current MVP scope.

_Last updated: 21 November 2026_

# Current Development Priority

The database/backend feature work for the current MVP is complete.

The immediate priority is now:

```text
Final documentation
        ↓
Team integration / review
        ↓
Demo and recording preparation
        ↓
Angular integration as required by the team
```

No additional optional backend features should be added unless required for team integration or the demo.

_Last updated: 21 November 2026_

# Useful Commands

From:

```text
PokeMart/backend
```

Start Docker:

```bash
sudo docker compose -f ../docker-compose.yml up -d
```

Check Docker:

```bash
sudo docker compose -f ../docker-compose.yml ps
```

Show migrations:

```bash
npm run migration:show
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Test:

```bash
npm test
```

Import supermarket CSV data:

```bash
npm run import:csv -- <csv-file> <retailer> <limit>
```

Transform staging data:

```bash
npm run transform:staging -- <limit>
```

Assign canonical products:

```bash
npm run assign:canonical -- <limit>
```

Start the development backend:

```bash
JWT_SECRET=pokemart-local-dev-secret npm run start:dev
```

Product search:

```text
GET /products/search?q=<query>
```

Canonical price lookup:

```text
GET /products/:canonicalId/prices
```

Basket comparison:

```text
POST /products/basket/compare
```

Check Git whitespace:

```bash
git diff --check
```

Check Git status:

```bash
git status
```

_Last updated: 21 November 2026_

# Current Project Snapshot

```text
Raw supermarket records:          50,000
Retailers in raw dataset:              5
Processed production records:      1,001
Current production retailers:          1

Retailer products:                 1,001
Price observations:                1,001
Canonical products:                  818

Automatic canonical matches:          34
New canonical assignments:           818
Review candidates:                   149
Unassigned products:                   0

Staging processing failures:            0

TypeORM migrations:                     6
Normalizer tests:                      11
Matcher tests:                          6
Total automated tests:                 18
```

Current backend capabilities:

- supermarket CSV ingestion# PokéMart Database Development

This document describes the current PokéMart database/backend architecture, ingestion pipeline, product-normalization and matching logic, staging transformation process, and remaining backend development work.

PokéMart is being developed as a grocery price-comparison system capable of ingesting supermarket pricing data, preserving historical prices, matching equivalent products across retailers, comparing current prices, and eventually determining the cheapest grocery basket.

_Last updated: 20 November 2026_

---

## Current Architecture

```text
Angular Frontend
       │
       ▼
NestJS Backend
       │
       ▼
TypeORM
       │
       ▼
PostgreSQL + pgvector
       │
       ▼
Supermarket Pricing Data
```

The backend uses:

- NestJS
- TypeORM
- PostgreSQL
- pgvector
- Docker
- Vitest
- csv-parse

Database schema changes are managed through TypeORM migrations.

```typescript
synchronize: false;
```

Automatic schema synchronization is intentionally disabled.

Following backend integration work, Prisma was removed and authentication persistence was migrated onto TypeORM so that the NestJS backend uses a single ORM/database architecture.

_Last updated: 19 November 2026_

---

# Development Branch

Current database development branch:

```text
feature/database
```

Verify with:

```bash
git branch --show-current
```

The database work is currently being integrated into:

```text
dev
```

_Last updated: 20 November 2026_

---

# PostgreSQL and Docker

The development database runs through Docker Compose.

From `PokeMart/backend`:

```bash
sudo docker compose -f ../docker-compose.yml up -d
```

Check container status:

```bash
sudo docker compose -f ../docker-compose.yml ps
```

The PostgreSQL container should report:

```text
healthy
```

Connect directly to PostgreSQL:

```bash
sudo docker compose -f ../docker-compose.yml exec postgres \
  psql -U pokemart -d pokemart
```

Exit PostgreSQL with:

```text
\q
```

The PostgreSQL container and persisted database were re-verified successfully after a system restart on 20 November 2026.

_Last updated: 20 November 2026_

---

# Environment Variables

The backend uses:

```text
backend/.env
```

Development database configuration:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=pokemart
DB_PASSWORD=pokemart
DB_NAME=pokemart
```

The `.env` file must not be committed to Git.

_Last updated: 28 October 2026_

---

# Database Model

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
id
name
```

`name` is unique.

_Last updated: 28 October 2026_

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
canonical_product_id
match_method
match_confidence
```

Relationship:

```text
Retailer
   │
   │ 1 : many
   ▼
RetailerProduct
```

`canonical_product_id` remains nullable until canonical matching has been performed.

_Last updated: 14 November 2026_

---

## PriceObservation

Represents a historical price observation for a retailer product.

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
       │
       │ 1 : many
       ▼
PriceObservation
```

Money is stored in integer minor units.

Example:

```text
£1.49 → 149
£0.40 → 40
```

This avoids floating-point errors when performing basket calculations.

Historical observations are stored separately instead of overwriting previous prices.

_Last updated: 28 October 2026_

---

## RawSupermarketRow

Represents imported source data before production transformation.

Table:

```text
raw_supermarket_rows
```

The staging table stores both extracted fields and the complete original CSV row in JSONB.

```text
CSV
 │
 ▼
RawSupermarketRow
 │
 ├── extracted fields
 │
 └── original JSONB source row
```

Important staging fields include:

```text
retailer
product_name
category
price_raw
unit_price_raw
unit_label
own_brand_raw
observed_date_raw
raw
imported_at
processed_at
processing_error
```

Preserving the raw source data allows source-data problems to be investigated without losing the original values.

The `processed_at` and `processing_error` fields were added to support safe incremental staging transformation.

_Last updated: 14 November 2026_

---

## CanonicalProduct

Represents a shared product concept that can be linked to equivalent retailer-specific listings.

Table:

```text
canonical_products
```

Core fields:

```text
id
display_name
normalized_name
category
quantity_value
quantity_unit
created_at
```

Conceptually:

```text
Tesco Whole Milk 2L
Aldi Whole Milk 2L
ASDA British Whole Milk 2L
        │
        ▼
CanonicalProduct
Whole Milk 2L
```

Canonical relationships will allow PokéMart to compare equivalent products across retailers.

_Last updated: 14 November 2026_

---

# Current TypeORM Migrations

Six TypeORM migrations are currently applied:

```text
1. CreateRetailers
2. CreateRetailerProducts
3. CreatePriceObservations
4. CreateRawSupermarketRows
5. CreateCanonicalProducts
6. AddRawProcessingStatus
```

Check migration status:

```bash
cd backend
npm run migration:show
```

All six should show:

```text
[X]
```

Migration commands:

```bash
npm run migration:show
npm run migration:run
npm run migration:revert
```

All six migrations were re-verified as applied on 20 November 2026.

_Last updated: 20 November 2026_

---

# Authentication ORM Consolidation

Authentication had been introduced using Prisma while the existing database architecture was already based on TypeORM.

The duplicate persistence approaches were consolidated so that the NestJS backend now uses TypeORM consistently.

The consolidation included:

- adding a TypeORM `User` entity
- registering `User` through `TypeOrmModule`
- migrating `UserRepository` from Prisma to TypeORM
- preserving the existing authentication/JWT logic
- removing `PrismaModule`
- removing `PrismaService`
- removing the Prisma schema and configuration
- removing generated Prisma client code
- removing Prisma npm dependencies
- removing automatic Prisma generation hooks

The resulting backend passed:

```text
Nest build
0 lint warnings
0 lint errors
18 / 18 automated tests
```

_Last updated: 19 November 2026_

---

# Supermarket Dataset

PokéMart currently uses development data from the:

```text
Time Series UK Supermarket Data
```

dataset.

The development database contains:

```text
50,000 raw supermarket rows
```

with:

```text
10,000 Aldi
10,000 ASDA
10,000 Morrisons
10,000 Sainsbury's
10,000 Tesco
```

The dataset is UK-based and therefore currently uses GBP pricing.

It is representative development data and should not be interpreted as live Irish supermarket pricing.

Large raw source files are excluded from Git.

_Last updated: 14 November 2026_

---

# CSV Ingestion

The ingestion pipeline supports the source dataset's real column names:

```text
names
prices_(£)
prices_unit_(£)
unit
category
own_brand
date
supermarket
```

Relevant backend components:

```text
src/ingestion/
├── entities/
│   └── raw-supermarket-row.entity.ts
├── ingestion.module.ts
├── ingestion.service.ts
└── import-csv.ts
```

The importer stores:

- extracted values
- retailer
- product name
- raw price
- unit price
- unit
- category
- own-brand value
- source date
- complete source record as JSONB

Example import:

```bash
npm run import:csv -- ./data/raw/All_Data_Tesco.csv Tesco 10000
```

_Last updated: 14 November 2026_

---

# Raw Data Validation

The ingestion pipeline has been validated across all five retailers.

Current raw dataset:

```text
50,000 rows
```

All product prices were successfully mapped.

Two ASDA records have missing unit-price values in the original source dataset.

These missing values are intentionally preserved rather than fabricated.

Source dates use:

```text
YYYYMMDD
```

Example:

```text
20240413
```

The normalization layer converts this to:

```text
2024-04-13
```

_Last updated: 14 November 2026_

---

# Product Normalization

PokéMart includes:

```text
ProductNormalizerService
```

The service handles:

- retailer-name removal
- lowercase normalization
- punctuation cleanup
- category normalization
- GBP price conversion into minor units
- Boolean parsing
- date conversion
- unit normalization
- quantity extraction
- litre-to-millilitre conversion
- kilogram-to-gram conversion
- explicit product counts
- leading counts
- trailing counts
- multipacks
- compact `x8`, `x30`, etc. counts

Examples:

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

Automated normalizer tests:

```text
11 passing
```

_Last updated: 14 November 2026_

---

# Cross-Retailer Product Matching

PokéMart includes:

```text
ProductMatcherService
```

The matcher considers:

- normalized product-name similarity
- Jaccard token similarity
- Levenshtein edit similarity
- category compatibility
- quantity compatibility

Current matching thresholds:

```text
score >= 0.80
→ automatic candidate

score >= 0.68 and < 0.80
→ review candidate

score < 0.68
→ different/new product
```

These are prototype thresholds and may be refined using real supermarket data.

Automated matcher tests:

```text
6 passing
```

_Last updated: 14 November 2026_

---

# Real-Data Matching Preview

A read-only matching preview is available for evaluating matching behaviour before canonical relationships are written.

The preview:

- samples retailers separately
- balances retailer representation
- compares only products from different retailers
- removes duplicate time-series representations
- reports automatic candidates
- reports review candidates
- exposes Jaccard score
- exposes edit-distance score
- exposes category score
- exposes quantity score
- exposes final confidence

Example ambiguous matches are intentionally sent for review instead of automatically merging them.

_Last updated: 14 November 2026_

---

# Staging Transformation

PokéMart now includes:

```text
StagingTransformService
```

This transforms validated staging records into production database records.

Pipeline:

```text
RawSupermarketRow
        │
        ▼
Validation + Normalization
        │
        ├────────► Retailer
        │
        ├────────► RetailerProduct
        │
        └────────► PriceObservation
        │
        ▼
processed_at / processing_error
```

For each staging row, the transformation process:

1. validates the retailer name
2. validates and normalizes the product name
3. converts the raw price to integer minor units
4. parses the source date
5. parses and validates the unit price
6. normalizes the unit
7. parses the own-brand value
8. finds or creates the retailer
9. finds or creates the retailer product
10. avoids duplicate product/date observations
11. creates the price observation
12. marks the staging row as processed

If processing fails:

```text
processed_at = NULL
processing_error = failure reason
```

If processing succeeds:

```text
processed_at = current timestamp
processing_error = NULL
```

Transactions are used so that partially transformed records are not left in the production tables if a transformation fails.

_Last updated: 20 November 2026_

---

# Unit Price Handling

Non-positive source unit prices are treated as unavailable rather than legitimate zero-cost prices.

For example:

```text
prices_unit_(£) = 0.0
```

is stored as:

```text
NULL
```

for the production unit price.

Actual product prices must be valid and greater than zero.

_Last updated: 20 November 2026_

---

# Staging Transform Command

The transform can be run with:

```bash
npm run transform:staging -- <limit>
```

Examples:

```bash
npm run transform:staging -- 10
```

```bash
npm run transform:staging -- 100
```

The command builds the backend before executing the compiled transformation runner.

The transformation runner uses the TypeORM data source directly and disables migration loading for the transform process because schema migrations are managed separately.

_Last updated: 20 November 2026_

---

# Incremental Validation

The staging transformation was deliberately tested incrementally instead of immediately processing all 50,000 records.

Validation sequence:

```text
10 rows
   ↓
100 total rows
   ↓
1,000 total rows
   ↓
1,001 total rows
```

Current verified state:

```text
Raw staging rows:      50,000
Processed rows:         1,001
Processing errors:          0
Retailer products:       1,001
Price observations:      1,001
```

The first 1,001 rows were transformed successfully with:

```text
0 processing failures
```

The initial transformed records were inspected manually to verify:

- retailer values
- product names
- normalized product names
- own-brand values
- prices
- unit-price handling
- currency
- observed dates

The transformation will continue to be scaled incrementally.

_Last updated: 20 November 2026_

---

# Current Data Architecture

```text
External Supermarket CSV
          │
          ▼
RawSupermarketRow
          │
          │ staging transformation
          ▼
RetailerProduct ─────────────► PriceObservation
          │
          │ canonical matching
          ▼
CanonicalProduct
```

The staging layer preserves original source information.

The production layer supports:

- product search
- retailer comparison
- historical prices
- canonical product matching
- future basket optimization

_Last updated: 20 November 2026_

---

# Current Backend Validation

The backend currently passes:

```text
Nest build
```

```text
0 lint warnings
0 lint errors
```

Automated tests:

```text
18 passing
```

Current test groups include:

```text
ProductNormalizerService: 11 tests
ProductMatcherService:      6 tests
AppController:              1 test
```

Formatting and whitespace are checked with:

```bash
git diff --check
```

_Last updated: 20 November 2026_

---

# Current Database Pipeline Status

## Completed

- [x] PostgreSQL + pgvector Docker environment
- [x] NestJS TypeORM integration
- [x] TypeORM migration system
- [x] Retailer model
- [x] Retailer-product model
- [x] historical price-observation model
- [x] raw supermarket staging model
- [x] 50,000-row supermarket dataset ingestion
- [x] real source-column mapping
- [x] raw JSONB preservation
- [x] product normalization
- [x] quantity normalization
- [x] date normalization
- [x] price normalization
- [x] canonical-product database model
- [x] retailer-product canonical relationship
- [x] cross-retailer product matcher
- [x] real-data matching preview
- [x] staging processing-status fields
- [x] Prisma/TypeORM consolidation
- [x] TypeORM authentication persistence
- [x] staging-to-production transformation service
- [x] staging transformation CLI
- [x] incremental transformation validation through 1,001 rows
- [x] zero transformation failures through current validation sample
- [x] build validation
- [x] lint validation
- [x] automated backend tests

_Last updated: 20 November 2026_

---

# Remaining Database / Backend Roadmap

## 1. Canonical Product Assignment

Production `RetailerProduct` records must next be connected to `CanonicalProduct` records.

This phase will:

- evaluate existing canonical products
- use `ProductMatcherService`
- automatically link high-confidence matches
- create canonical products for new products
- store `canonical_product_id`
- store `match_method`
- store `match_confidence`
- preserve ambiguous matches for review

_Last updated: 20 November 2026_

---

## 2. Complete Staging Transformation

Continue processing larger portions of:

```text
50,000 raw rows
```

while monitoring:

```text
processed_at
processing_error
```

_Last updated: 20 November 2026_

---

## 3. Product Search and Price Comparison API

Planned backend capabilities include:

```text
GET /products/search?q=<query>
```

The API should return comparable retailer listings including:

- canonical product
- retailer
- retailer-specific product
- current price
- unit price
- currency
- observation date

_Last updated: 20 November 2026_

---

## 4. Basket Comparison

The basket comparison engine will accept a set of grocery products and calculate totals across retailers.

Initial MVP goal:

```text
basket
   │
   ├── Tesco total
   ├── Aldi total
   ├── ASDA total
   ├── Morrisons total
   └── Sainsbury's total
          │
          ▼
cheapest single-store basket
```

More advanced split-store optimization may be added later.

_Last updated: 20 November 2026_

---

## 5. Angular Integration

Once the backend search and comparison API is stable, the Angular frontend will consume the PokéMart API for:

- grocery search
- retailer price results
- basket construction
- basket comparison
- historical price information

_Last updated: 20 November 2026_

---

# Current Development Priority

The immediate backend priority is:

```text
Canonical Product Assignment
        ↓
Product Search / Price Comparison API
        ↓
Basket Comparison
        ↓
Angular Integration
```

Major database architecture changes should be avoided unless required by an identified defect.

_Last updated: 20 November 2026_

---

# Useful Commands

From:

```text
PokeMart/backend
```

Start Docker:

```bash
sudo docker compose -f ../docker-compose.yml up -d
```

Check Docker:

```bash
sudo docker compose -f ../docker-compose.yml ps
```

Show migrations:

```bash
npm run migration:show
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Test:

```bash
npm test
```

Import supermarket CSV data:

```bash
npm run import:csv -- <csv-file> <retailer> <limit>
```

Transform staging data:

```bash
npm run transform:staging -- <limit>
```

Check Git whitespace:

```bash
git diff --check
```

Check Git status:

```bash
git status
```

_Last updated: 20 November 2026_

---

# Current Project Snapshot

```text
Raw supermarket records:     50,000
Retailers represented:            5
TypeORM migrations:               6
Normalizer tests:                11
Matcher tests:                    6
Total automated tests:           18

Verified transformed rows:     1,001
Transformation failures:          0
Retailer products created:     1,001
Price observations created:    1,001
```

_Last updated: 20 November 2026_

---

_Last overall documentation update: 20 November 2026_

- raw staging preservation
- normalization
- staging-to-production transformation
- canonical-product modelling
- automated and review-based product matching
- canonical assignment
- product search
- canonical price lookup
- review-candidate safety handling
- single-store basket comparison

Final verified basket smoke test:

```text
Retailer: Tesco
Requested products: 2
Matched products: 2
Complete basket: true
Missing products: 0
Total: £9.89
```

_Last updated: 21 November 2026_

## Final Backend and Frontend Integration Status

As of 22 November 2026, the PokéMart database, backend API, and Angular frontend have been integrated into a working end-to-end prototype.

### Supermarket Data Processing

The development database contains **50,000 raw supermarket records**, with 10,000 source rows from each of:

- Aldi
- ASDA
- Morrisons
- Sainsbury's
- Tesco

All 50,000 staging rows have now been transformed successfully into production records.

Final staging status:

- 50,000 raw staging rows
- 50,000 processed staging rows
- 0 staging processing errors
- 5 retailers represented

The transformed data produced **45,186 unique retailer products** after repeated observations of the same retailer listing were consolidated.

Unique retailer-product totals are:

- Aldi: 5,187
- ASDA: 9,999
- Morrisons: 10,000
- Sainsbury's: 10,000
- Tesco: 10,000

### Canonical Product Evaluation

All **45,186 retailer products** have now been evaluated by the canonical-product matching pipeline.

Final status:

- 45,186 total retailer products
- 45,186 evaluated products
- 0 products awaiting matching evaluation

Matching decisions are recorded using the existing prototype categories:

- `automatic` — sufficiently confident match to an existing canonical product
- `review` — plausible match requiring review before canonical assignment
- `new` — treated as a new canonical product

A `review` result is intentionally not treated as a confirmed canonical relationship. The frontend therefore displays a disabled **Review** state instead of allowing uncertain products to be added to basket comparison.

### Product Search API

PokéMart now exposes a working product-search API:

```text
GET /products/search?q=<query>&limit=<limit>
```

Search results include:

- retailer product ID
- source product name
- normalized name
- retailer
- current price
- unit price
- observation date
- canonical product when confirmed
- review candidate when applicable
- matching method and confidence

The Angular search interface is connected to this API and can display real records from all five loaded retailers.

### Retailer Price Comparison

Confirmed canonical products can be queried across retailers using:

```text
GET /products/:canonicalId/prices
```

The endpoint returns available retailer listings and their latest observed prices for the requested canonical product.

Prices are represented internally in integer minor units and exposed to the frontend as GBP amounts.

### Basket Comparison

PokéMart now supports basket-level retailer comparison using:

```text
POST /products/basket/compare
```

The request accepts canonical product IDs and evaluates which retailers can supply the requested basket.

The response includes:

- requested products
- matched products
- missing canonical product IDs
- retailer basket totals
- whether each retailer can provide the complete basket
- cheapest complete retailer when available

The Angular cart is connected to this endpoint and displays basket-comparison results using products added from real search results.

### Historical Price Support

Historical prices are retained in the `price_observations` table.

Historical pricing is exposed for an exact retailer listing using:

```text
GET /products/retailer/:productId/history
```

Retailer-product history is used instead of canonical-product history so that price observations for different products are not incorrectly combined when prototype matching groups similar products too broadly.

The endpoint returns:

- retailer product ID
- source product name
- retailer
- historical price
- historical unit price when available
- currency
- observation date

The Angular product-result component includes an expandable **Price history** section displaying the dated historical observations for that exact retailer listing.

### Frontend Integration

The Angular frontend is now connected to the NestJS backend for the core prototype workflow.

Implemented functionality includes:

- API-backed product search
- retailer-specific search results
- GBP price display
- Aldi, ASDA, Morrisons, Sainsbury's, and Tesco retailer identification
- add-to-cart functionality for confirmed canonical products
- explicit Review state for uncertain canonical matches
- shopping-cart state
- basket comparison
- cheapest complete retailer display
- historical-price display

### Validation

Backend validation currently passes:

```text
Build: successful
Lint: 0 warnings, 0 errors
Tests: 18 / 18 passed
```

The Angular production build also completes successfully.

Angular currently reports a bundle-size warning because the initial bundle exceeds the configured 500 kB budget. This is a warning rather than a build failure and has not been treated as a required prototype feature change.

### Prototype Data Limitation

The current supermarket dataset is UK-based and uses GBP pricing.

It is representative prototype data and should not be interpreted as live or current supermarket pricing for Cork or Ireland.

The current product-matching thresholds and canonical groupings are also prototype results. Some similarity matches are intentionally flagged for review rather than automatically accepted.

### Current End-to-End Flow

```text
Raw supermarket CSV data
        |
        v
raw_supermarket_rows
        |
        v
Normalization and staging transformation
        |
        v
Retailer products + price observations
        |
        v
Canonical-product evaluation
        |
        v
NestJS product/search/price/basket/history APIs
        |
        v
Angular search and cart interface
```

The core PokéMart database/backend/frontend prototype is now operational end to end.

---

_Last overall documentation update: 22 November 2026_
