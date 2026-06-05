import "@testing-library/jest-dom";

process.env.SESSION_SECRET ??= "jest-session-secret-minimum-32-chars-long";
process.env.DATABASE_URL ??= "postgresql://localhost:5432/niloora_test";
