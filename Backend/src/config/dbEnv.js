import dotenv from 'dotenv';
dotenv.config();

// Ensure Neon PgBouncer pooler compatibility for Prisma query execution
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('-pooler') && !process.env.DATABASE_URL.includes('pgbouncer=true')) {
  process.env.DATABASE_URL += (process.env.DATABASE_URL.includes('?') ? '&' : '?') + 'pgbouncer=true';
}

if (!process.env.DATABASE_URL_UNPOOLED && process.env.DATABASE_URL) {
  process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL.replace('-pooler', '').replace(/[\?&]pgbouncer=true/g, '');
}
