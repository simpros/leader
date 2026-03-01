// Stub for the `bun` built-in module so vitest (Node.js) can resolve imports
// that transitively depend on it (e.g. @leader/db/client → drizzle-orm/bun-sql).
export class SQL {
  constructor() {
    // no-op stub
  }
}
