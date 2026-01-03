import "dotenv/config";
import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Initialize PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const pool = new Pool({
  connectionString: connectionString,
});

// Test database connection
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Better Auth requires a secret for JWT signing
const secret = process.env.BETTER_AUTH_SECRET;
if (!secret || secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET environment variable is required (minimum 32 characters)");
}

export const auth = betterAuth({
  secret: secret, // Required: JWT signing secret
  database: pool, // Better Auth auto-detects Pool and creates Kysely internally
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3005",
  trustedOrigins: [
    process.env.FRONTEND_URL || "http://localhost:3004",
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // MVP: no email verification required
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24, // 24 hours in seconds
    updateAge: 60 * 60 * 24, // 24 hours
  },
});

