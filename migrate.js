const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    await pool.query('ALTER TABLE games DROP COLUMN IF EXISTS player1_hand CASCADE;');
    await pool.query('ALTER TABLE games DROP COLUMN IF EXISTS player2_hand CASCADE;');
    await pool.query('ALTER TABLE games ADD COLUMN IF NOT EXISTS player1_score integer DEFAULT 0 NOT NULL;');
    await pool.query('ALTER TABLE games ADD COLUMN IF NOT EXISTS player2_score integer DEFAULT 0 NOT NULL;');
    console.log("Migration successful");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
main();
