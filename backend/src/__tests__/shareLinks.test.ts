/**
 * Share Link Service Tests
 * 
 * Tests for share link generation, validation, expiration, and authorization
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";
import { auth, pool } from "../auth";
import { setDatabasePool } from "../services/briefingStorageService";
import { setDatabasePool as setShareLinkDatabasePool } from "../services/shareLinkService";
import {
  createShareLink,
  getBriefingByShareToken,
  revokeShareLink,
  deleteExpiredShareLinks,
} from "../services/shareLinkService";
import { storeBriefing, getBriefingById } from "../services/briefingStorageService";
import { parseNotams } from "../services/notamParsingService";

// Initialize database pools
setDatabasePool(pool);
setShareLinkDatabasePool(pool);

describe("Share Link Service", () => {
  let testUserId: string;
  let testBriefingId: string;
  const testRawText = "A1234/24 NOTAMN\nQ) EGTT/QFAA/IV/NBO/A/000/999/5123N00016W005\nA) EGLL B) 2401011200 C) 2401011800\nE) TEST NOTAM";

  beforeAll(async () => {
    // Create a test user
    const email = `test-share-${Date.now()}@example.com`;
    const password = "TestPassword123!";
    
    const signupResponse = await fetch("http://localhost:3005/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: "Test User" }),
    });
    
    if (!signupResponse.ok) {
      throw new Error("Failed to create test user");
    }
    
    const signupData = await signupResponse.json();
    testUserId = signupData.user.id;
  });

  beforeEach(async () => {
    // Create a test briefing
    const parseResult = parseNotams(testRawText);
    testBriefingId = await storeBriefing(testUserId, testRawText, parseResult.notams);
  });

  afterEach(async () => {
    // Clean up share links
    await pool.query("DELETE FROM share_links WHERE briefing_id = $1", [testBriefingId]);
  });

  afterAll(async () => {
    // Clean up test user and briefings
    await pool.query("DELETE FROM briefings WHERE user_id = $1", [testUserId]);
    await pool.query('DELETE FROM "user" WHERE id = $1', [testUserId]);
  });

  describe("createShareLink", () => {
    it("should create a share link with valid token", async () => {
      const result = await createShareLink(testBriefingId, testUserId, 7);
      
      expect(result.token).toBeDefined();
      expect(result.token.length).toBeGreaterThan(32); // Base64url encoded 32 bytes should be ~43 chars
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.shareUrl).toBe(`/share/${result.token}`);
      
      // Verify token is stored in database
      const dbResult = await pool.query(
        "SELECT * FROM share_links WHERE token = $1",
        [result.token]
      );
      expect(dbResult.rows.length).toBe(1);
      expect(dbResult.rows[0].briefing_id).toBe(testBriefingId);
    });

    it("should generate cryptographically secure, non-guessable tokens", async () => {
      const result1 = await createShareLink(testBriefingId, testUserId, 7);
      const result2 = await createShareLink(testBriefingId, testUserId, 7);
      
      // Tokens should be different
      expect(result1.token).not.toBe(result2.token);
      
      // Tokens should be base64url encoded (no +, /, or = characters)
      expect(result1.token).not.toMatch(/[+/=]/);
      expect(result2.token).not.toMatch(/[+/=]/);
    });

    it("should set expiration date correctly", async () => {
      const expiresInDays = 14;
      const result = await createShareLink(testBriefingId, testUserId, expiresInDays);
      
      const now = new Date();
      const expectedExpiresAt = new Date(now);
      expectedExpiresAt.setDate(expectedExpiresAt.getDate() + expiresInDays);
      
      // Allow 1 second tolerance for timing
      const diff = Math.abs(result.expiresAt.getTime() - expectedExpiresAt.getTime());
      expect(diff).toBeLessThan(1000);
    });

    it("should reject share link creation for non-existent briefing", async () => {
      const fakeBriefingId = "00000000-0000-0000-0000-000000000000";
      await expect(
        createShareLink(fakeBriefingId, testUserId, 7)
      ).rejects.toThrow("not found");
    });

    it("should reject share link creation if user doesn't own briefing", async () => {
      // Create another user
      const email2 = `test-share-2-${Date.now()}@example.com`;
      const signupResponse = await fetch("http://localhost:3005/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email2, password: "TestPassword123!", name: "Test User 2" }),
      });
      const signupData = await signupResponse.json();
      const otherUserId = signupData.user.id;
      
      await expect(
        createShareLink(testBriefingId, otherUserId, 7)
      ).rejects.toThrow("not found");
      
      // Clean up
      await pool.query('DELETE FROM "user" WHERE id = $1', [otherUserId]);
    });
  });

  describe("getBriefingByShareToken", () => {
    it("should retrieve briefing with valid, non-expired token", async () => {
      const shareLink = await createShareLink(testBriefingId, testUserId, 7);
      const result = await getBriefingByShareToken(shareLink.token);
      
      expect(result).not.toBeNull();
      expect(result!.briefing.id).toBe(testBriefingId);
      expect(result!.briefing.rawText).toBe(testRawText);
      expect(result!.briefing.notams.length).toBeGreaterThan(0);
      expect(result!.expiresAt).toBeInstanceOf(Date);
    });

    it("should return null for non-existent token", async () => {
      const result = await getBriefingByShareToken("invalid-token-12345");
      expect(result).toBeNull();
    });

    it("should return null for expired token", async () => {
      // Create a share link with expiration in the past
      const token = "test-expired-token";
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);
      
      await pool.query(
        "INSERT INTO share_links (briefing_id, token, expires_at) VALUES ($1, $2, $3)",
        [testBriefingId, token, expiredDate.toISOString()]
      );
      
      const result = await getBriefingByShareToken(token);
      expect(result).toBeNull();
    });

    it("should return null if briefing was deleted", async () => {
      const shareLink = await createShareLink(testBriefingId, testUserId, 7);
      
      // Delete the briefing
      await pool.query("DELETE FROM briefings WHERE id = $1", [testBriefingId]);
      
      const result = await getBriefingByShareToken(shareLink.token);
      expect(result).toBeNull();
    });
  });

  describe("revokeShareLink", () => {
    it("should revoke share link if user owns briefing", async () => {
      const shareLink = await createShareLink(testBriefingId, testUserId, 7);
      const revoked = await revokeShareLink(shareLink.token, testUserId);
      
      expect(revoked).toBe(true);
      
      // Verify link is deleted
      const dbResult = await pool.query(
        "SELECT * FROM share_links WHERE token = $1",
        [shareLink.token]
      );
      expect(dbResult.rows.length).toBe(0);
    });

    it("should return false if user doesn't own briefing", async () => {
      const shareLink = await createShareLink(testBriefingId, testUserId, 7);
      
      // Create another user
      const email2 = `test-share-3-${Date.now()}@example.com`;
      const signupResponse = await fetch("http://localhost:3005/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email2, password: "TestPassword123!", name: "Test User 3" }),
      });
      const signupData = await signupResponse.json();
      const otherUserId = signupData.user.id;
      
      const revoked = await revokeShareLink(shareLink.token, otherUserId);
      expect(revoked).toBe(false);
      
      // Verify link still exists
      const dbResult = await pool.query(
        "SELECT * FROM share_links WHERE token = $1",
        [shareLink.token]
      );
      expect(dbResult.rows.length).toBe(1);
      
      // Clean up
      await pool.query('DELETE FROM "user" WHERE id = $1', [otherUserId]);
    });

    it("should return false for non-existent token", async () => {
      const revoked = await revokeShareLink("invalid-token", testUserId);
      expect(revoked).toBe(false);
    });
  });

  describe("deleteExpiredShareLinks", () => {
    it("should delete expired share links", async () => {
      // Create expired share link
      const expiredToken = "expired-token";
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);
      
      await pool.query(
        "INSERT INTO share_links (briefing_id, token, expires_at) VALUES ($1, $2, $3)",
        [testBriefingId, expiredToken, expiredDate.toISOString()]
      );
      
      // Create non-expired share link
      const validShareLink = await createShareLink(testBriefingId, testUserId, 7);
      
      const deletedCount = await deleteExpiredShareLinks();
      
      expect(deletedCount).toBeGreaterThanOrEqual(1);
      
      // Verify expired link is deleted
      const expiredResult = await pool.query(
        "SELECT * FROM share_links WHERE token = $1",
        [expiredToken]
      );
      expect(expiredResult.rows.length).toBe(0);
      
      // Verify valid link still exists
      const validResult = await pool.query(
        "SELECT * FROM share_links WHERE token = $1",
        [validShareLink.token]
      );
      expect(validResult.rows.length).toBe(1);
    });
  });
});

