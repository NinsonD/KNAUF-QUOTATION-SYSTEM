const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');
const onVercel = Boolean(process.env.VERCEL);
for (const file of ['.env.production.local', '.env.local', '.env.production', '.env']) { try { process.loadEnvFile(file); } catch {} }
const url = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.PRISMA_DATABASE_URL;
if (!url) throw new Error('Set DATABASE_URL before building.');
process.env.DATABASE_URL = url;
const postgres = !url.startsWith('file:');
if (onVercel && !postgres) throw new Error('Vercel requires a persistent PostgreSQL DATABASE_URL.');
const schema = postgres ? 'prisma/schema.postgresql.prisma' : 'prisma/schema.prisma';
const cli = resolve('node_modules/prisma/build/index.js');
execFileSync(process.execPath, [cli, 'generate', '--schema', schema], { stdio: 'inherit' });
if (onVercel || process.env.INITIALIZE_DATABASE === '1') {
  // db push never receives --accept-data-loss or --force-reset. Existing records stay intact.
  const original = process.env.DATABASE_URL;
  if (postgres && process.env.DIRECT_URL) process.env.DATABASE_URL = process.env.DIRECT_URL;
  execFileSync(process.execPath, [cli, 'db', 'push', '--schema', schema, '--skip-generate'], { stdio: 'inherit' });
  process.env.DATABASE_URL = original;
  execFileSync(process.execPath, [resolve('node_modules/tsx/dist/cli.mjs'), 'scripts/initialize-catalog.ts'], { stdio: 'inherit' });
}
