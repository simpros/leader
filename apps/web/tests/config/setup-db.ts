/**
 * Database setup script — run with bun (not Node.js).
 * Called from global.setup.ts via execSync.
 *
 * Usage: DATABASE_URL=... bun run tests/config/setup-db.ts
 */
import { runMigrations } from "@leader/db";
import { createTestUsers } from "./seed";

console.log("📊 Running database migrations...");
await runMigrations();
console.log("✅ Migrations complete\n");

await createTestUsers();

console.log("\n🎉 Database setup complete!");
process.exit(0);
