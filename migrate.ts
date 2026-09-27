import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.execute(sql`ALTER TABLE games DROP COLUMN IF EXISTS player1_hand CASCADE;`);
    await db.execute(sql`ALTER TABLE games DROP COLUMN IF EXISTS player2_hand CASCADE;`);
    await db.execute(sql`ALTER TABLE games ADD COLUMN IF NOT EXISTS player1_score integer DEFAULT 0 NOT NULL;`);
    await db.execute(sql`ALTER TABLE games ADD COLUMN IF NOT EXISTS player2_score integer DEFAULT 0 NOT NULL;`);
    console.log("Migration successful");
  } catch(e) {
    console.error(e);
  }
}
main();
