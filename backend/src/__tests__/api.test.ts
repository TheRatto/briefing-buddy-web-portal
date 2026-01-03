import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { toNodeHandlerSync } from "../__mocks__/better-auth-node";
import { auth } from "../auth";
import cors from "cors";

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

describe("Authentication API", () => {
  describe("Signup", () => {
    it("should reject signup with password less than 8 characters", async () => {
      const email = "test@example.com";
      const response = await request(app)
        .post("/api/auth/sign-up/email")
        .send({
          name: generateNameFromEmail(email),
          email,
          password: "short", // Less than 8 characters
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should accept valid signup request", async () => {
      const email = `test-${Date.now()}@example.com`;
      const response = await request(app)
        .post("/api/auth/sign-up/email")
        .send({
          name: generateNameFromEmail(email),
          email,
          password: "testpassword123",
        });

      // Better Auth may return 200 or 201 on success
      expect([200, 201]).toContain(response.status);
    });

    it("should reject duplicate email signup", async () => {
      const email = `test-${Date.now()}@example.com`;
      
      // First signup (frontend generates name from email)
      await request(app)
        .post("/api/auth/sign-up/email")
        .send({
          name: generateNameFromEmail(email),
          email,
          password: "testpassword123",
        });

      // Duplicate signup
      const response = await request(app)
        .post("/api/auth/sign-up/email")
        .send({
          name: generateNameFromEmail(email),
          email,
          password: "testpassword123",
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Login", () => {
    it("should reject login with invalid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/sign-in/email")
        .send({
          email: "nonexistent@example.com",
          password: "wrongpassword",
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should accept valid login request", async () => {
      const email = `test-${Date.now()}@example.com`;
      const password = "testpassword123";

      // Signup first (frontend generates name from email)
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
      // cookies can be string or array, normalize to array
      const cookieArray = Array.isArray(cookies) ? cookies : (cookies ? [cookies] : []);
      const sessionCookie = cookieArray.find((cookie: string) => 
        cookie.includes("better-auth.session_token") || cookie.includes("better-auth")
      );
      expect(sessionCookie).toBeDefined();
    });
  });

  describe("Session Persistence", () => {
    it("should return session on valid request with cookie", async () => {
      const email = `test-${Date.now()}@example.com`;
      const password = "testpassword123";

      // Signup (frontend generates name from email)
      const signupResponse = await request(app)
        .post("/api/auth/sign-up/email")
        .send({
          name: generateNameFromEmail(email),
          email,
          password,
        });

      const cookies = signupResponse.headers["set-cookie"];

      // Get session - need to extract cookie string, not array
      const cookieHeader = Array.isArray(cookies) ? cookies.join("; ") : cookies;
      const sessionResponse = await request(app)
        .get("/api/auth/get-session")
        .set("Cookie", cookieHeader || "");

      expect([200, 201]).toContain(sessionResponse.status);
    });
  });
});

