import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";
import request from "supertest";
import express from "express";
import { toNodeHandlerSync } from "../__mocks__/better-auth-node";
import { auth } from "../auth";
import cors from "cors";

// Mock environment variables
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/briefing_buddy_test";
process.env.BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || "test-secret-key-minimum-32-characters-long-for-testing";
process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || "http://localhost:3005";

const app = express();
app.use(cors({ origin: "http://localhost:3004", credentials: true }));
// Better Auth handler - MUST be before express.json()
// Use sync wrapper that handles async import
app.all("/api/auth/*", toNodeHandlerSync(auth));
app.use(express.json());

// Helper function to generate name from email (matches frontend behavior)
const generateNameFromEmail = (email: string): string => {
  return email.split("@")[0] || "User";
};

describe("Authentication Configuration", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("Password Security", () => {
    it("should reject passwords less than 8 characters", async () => {
      const email = `test-${Date.now()}@example.com`;
      const response = await request(app)
        .post("/api/auth/sign-up/email")
        .send({
          name: generateNameFromEmail(email),
          email,
          password: "short", // Less than 8 characters
        });

      // Better Auth should reject short passwords
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should accept passwords 8 or more characters", async () => {
      const email = `test-${Date.now()}@example.com`;
      const response = await request(app)
        .post("/api/auth/sign-up/email")
        .send({
          name: generateNameFromEmail(email),
          email,
          password: "password123", // 8+ characters
        });

      // Should accept valid password length
      expect([200, 201]).toContain(response.status);
    });

    it("should not store plaintext passwords", async () => {
      const email = `test-${Date.now()}@example.com`;
      const password = "testpassword123";

      // Sign up a user (frontend generates name from email)
      await request(app)
        .post("/api/auth/sign-up/email")
        .send({
          name: generateNameFromEmail(email),
          email,
          password,
        });

      // Query database to verify password is hashed
      // Better Auth stores passwords in the "account" table, not "user" table
      const result = await pool.query(
        `SELECT a.password FROM "account" a 
         JOIN "user" u ON a."userId" = u.id 
         WHERE u.email = $1 AND a."providerId" = 'credential'`,
        [email]
      );

      expect(result.rows.length).toBe(1);
      const storedPassword = result.rows[0].password;
      
      // Password should be hashed (not plaintext)
      expect(storedPassword).not.toBe(password);
      expect(storedPassword.length).toBeGreaterThan(20); // Hashed passwords are longer
    });
  });

  describe("Session Configuration", () => {
    it("should set session cookie on successful login", async () => {
      const email = `test-${Date.now()}@example.com`;
      const password = "testpassword123";

      // Sign up (frontend generates name from email)
      await request(app)
        .post("/api/auth/sign-up/email")
        .send({
          name: generateNameFromEmail(email),
          email,
          password,
        });

      // Login
      const response = await request(app)
        .post("/api/auth/sign-in/email")
        .send({ email, password });

      expect([200, 201]).toContain(response.status);
      
      // Check for session cookie
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      
      // Better Auth uses better-auth.session_token cookie name
      // cookies can be string or array, normalize to array
      const cookieArray = Array.isArray(cookies) ? cookies : (cookies ? [cookies] : []);
      const sessionCookie = cookieArray.find((cookie: string) => 
        cookie.includes("better-auth.session_token") || cookie.includes("better-auth")
      );
      expect(sessionCookie).toBeDefined();
      
      // Verify cookie has httpOnly flag (security requirement)
      expect(sessionCookie).toContain("HttpOnly");
    });
  });
});

