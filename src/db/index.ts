import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Disable prefetch as it is not supported for "Transaction" pool mode in pooling solutions sometimes, but standard local postgres is fine.
const client = postgres(process.env.DATABASE_URL, { prepare: false });
export const db = drizzle(client, { schema });
