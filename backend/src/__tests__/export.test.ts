/**
 * Export Service Tests
 * 
 * Tests for exporting briefings in various formats
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";
import { auth, pool } from "../auth";
import { setDatabasePool } from "../services/briefingStorageService";
import { storeBriefing, getBriefingById } from "../services/briefingStorageService";
import { parseNotams } from "../services/notamParsingService";
import { exportBriefing, exportRaw, exportCategorized, exportSummary } from "../services/exportService";

// Initialize database pool
setDatabasePool(pool);

describe("Export Service", () => {
  let testUserId: string;
  let testBriefingId: string;
  const testRawText = `A1234/24 NOTAMN
Q) EGTT/QFAA/IV/NBO/A/000/999/5123N00016W005
A) EGLL B) 2401011200 C) 2401011800
E) RUNWAY 09L/27R CLOSED FOR MAINTENANCE

A5678/24 NOTAMN
Q) EGTT/QMXLC/IV/NBO/A/000/999/5123N00016W005
A) EGLL B) 2401011200 C) 2401011800
E) TAXIWAY A CLOSED`;

  beforeAll(async () => {
    // Create a test user
    const email = `test-export-${Date.now()}@example.com`;
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

  afterAll(async () => {
    // Clean up test user and briefings
    await pool.query("DELETE FROM briefings WHERE user_id = $1", [testUserId]);
    await pool.query('DELETE FROM "user" WHERE id = $1', [testUserId]);
  });

  describe("exportRaw", () => {
    it("should export raw NOTAM text", async () => {
      const briefing = await getBriefingById(testBriefingId, testUserId);
      expect(briefing).not.toBeNull();
      
      const exported = exportRaw(briefing!);
      expect(exported).toBe(testRawText);
    });
  });

  describe("exportCategorized", () => {
    it("should export categorized view with location and category grouping", async () => {
      const briefing = await getBriefingById(testBriefingId, testUserId);
      expect(briefing).not.toBeNull();
      
      const exported = exportCategorized(briefing!);
      
      // Should include header information
      expect(exported).toContain("Briefing Export - Categorized View");
      expect(exported).toContain(testBriefingId);
      expect(exported).toContain("Total NOTAMs");
      
      // Should include location grouping
      expect(exported).toContain("LOCATION: EGLL");
      
      // Should include category sections
      expect(exported).toContain("runways");
      expect(exported).toContain("taxiways");
      
      // Should include NOTAM raw text
      expect(exported).toContain("RUNWAY 09L/27R CLOSED");
      expect(exported).toContain("TAXIWAY A CLOSED");
    });

    it("should include NOTAM metadata in categorized export", async () => {
      const briefing = await getBriefingById(testBriefingId, testUserId);
      expect(briefing).not.toBeNull();
      
      const exported = exportCategorized(briefing!);
      
      // Should include NOTAM IDs
      expect(exported).toMatch(/NOTAM ID:/);
      
      // Should include Q-codes if present
      if (briefing!.notams.some(n => n.qCode)) {
        expect(exported).toContain("Q-Code:");
      }
    });
  });

  describe("exportSummary", () => {
    it("should export placeholder message for AI summary", async () => {
      const briefing = await getBriefingById(testBriefingId, testUserId);
      expect(briefing).not.toBeNull();
      
      const exported = exportSummary(briefing!);
      
      expect(exported).toContain("AI Summary Export");
      expect(exported).toContain("not yet available");
    });
  });

  describe("exportBriefing", () => {
    it("should export raw format", async () => {
      const briefing = await getBriefingById(testBriefingId, testUserId);
      expect(briefing).not.toBeNull();
      
      const exported = exportBriefing(briefing!, "raw");
      expect(exported).toBe(testRawText);
    });

    it("should export categorized format", async () => {
      const briefing = await getBriefingById(testBriefingId, testUserId);
      expect(briefing).not.toBeNull();
      
      const exported = exportBriefing(briefing!, "categorized");
      expect(exported).toContain("Categorized View");
      expect(exported).toContain("LOCATION:");
    });

    it("should export summary format", async () => {
      const briefing = await getBriefingById(testBriefingId, testUserId);
      expect(briefing).not.toBeNull();
      
      const exported = exportBriefing(briefing!, "summary");
      expect(exported).toContain("AI Summary Export");
    });

    it("should throw error for invalid format", async () => {
      const briefing = await getBriefingById(testBriefingId, testUserId);
      expect(briefing).not.toBeNull();
      
      expect(() => {
        exportBriefing(briefing!, "invalid" as any);
      }).toThrow("Unknown export format");
    });
  });
});

