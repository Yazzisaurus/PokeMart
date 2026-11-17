import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const require = createRequire(path.join(repoRoot, 'backend', 'package.json'));
const { Client } = require('pg');

const databaseUrl = await readDatabaseUrl();
const client = new Client({ connectionString: databaseUrl });
await client.connect();

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(here))
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => migrationNumber(a) - migrationNumber(b));

  for (const filename of files) {
    const applied = await client.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [filename],
    );
    if (applied.rowCount > 0) {
      console.log(`skip ${filename}`);
      continue;
    }

    const sql = await readFile(path.join(here, filename), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [filename],
      );
      await client.query('COMMIT');
      console.log(`applied ${filename}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
} finally {
  await client.end();
}

function migrationNumber(filename) {
  const match = filename.match(/^(\d+)/);
  if (!match) {
    throw new Error(`Migration filename must start with a number: ${filename}`);
  }
  return Number(match[1]);
}

async function readDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const envFile = await readFile(path.join(repoRoot, 'backend', '.env'), 'utf8');
  const match = envFile.match(/^DATABASE_URL\s*=\s*(.*)$/m);
  if (!match) {
    throw new Error('DATABASE_URL is not set and backend/.env does not define it');
  }

  return match[1].trim().replace(/^["']|["']$/g, '');
}
