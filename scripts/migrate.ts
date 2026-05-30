import "dotenv/config";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to database. Running migrations...");

  const sql = readFileSync(join(__dirname, "../drizzle/0001_init.sql"), "utf-8");
  await client.query(sql);

  console.log("Migration complete.");
  await client.end();
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
