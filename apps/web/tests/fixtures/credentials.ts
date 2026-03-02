// Single source of truth for E2E test credentials.
// Used by both the DB seed (tests/config/seed.ts) and test fixtures.
export const TEST_USER = {
  name: "Test User",
  email: "test@leader.local",
  password: "Test@123456",
};

export const TEST_ADMIN = {
  name: "Test Admin",
  email: "testadmin@leader.local",
  password: "Admin@123456",
};
