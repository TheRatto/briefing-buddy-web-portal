/**
 * Tests for time filtering utility
 * 
 * Tests time window filtering and visibility state computation.
 * Matches backend tests: backend/src/__tests__/timeFiltering.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  filterNotamsByTimeWindow,
  computeVisibilityState,
  NotamVisibilityState,
  TimeWindow,
  getVisibilityColor,
} from "../utils/timeFiltering";
import { ParsedNotam } from "../types/notam";

describe("timeFiltering", () => {
  const baseTime = new Date("2025-01-15T12:00:00Z");

  const createMockNotam = (
    notamId: string,
    validFrom: string,
    validTo: string,
    isPermanent: boolean = false
  ): ParsedNotam => ({
    notamId,
    fieldA: "KJFK",
    group: "runways" as any,
    rawText: `NOTAM ${notamId}`,
    qCode: null,
    fieldB: "2501151200",
    fieldC: "2501161200",
    fieldD: "",
    fieldE: "",
    fieldF: "",
    fieldG: "",
    validFrom,
    validTo,
    isPermanent,
    warnings: [],
  });

  describe("filterNotamsByTimeWindow", () => {
    it("should filter NOTAMs by 6h time window", () => {
      const notams: ParsedNotam[] = [
        // Active now (within 6h window)
        createMockNotam(
          "A001",
          "2025-01-15T10:00:00Z", // 2h ago
          "2025-01-15T18:00:00Z" // 6h from now
        ),
        // Future within window
        createMockNotam(
          "A002",
          "2025-01-15T15:00:00Z", // 3h from now
          "2025-01-15T20:00:00Z" // 8h from now
        ),
        // Future outside window
        createMockNotam(
          "A003",
          "2025-01-15T20:00:00Z", // 8h from now (outside 6h window)
          "2025-01-16T12:00:00Z"
        ),
        // Expired
        createMockNotam(
          "A004",
          "2025-01-15T08:00:00Z",
          "2025-01-15T10:00:00Z" // 2h ago (expired)
        ),
      ];

      const results = filterNotamsByTimeWindow(notams, "6h", false, baseTime);

      // Should include active and future within window, but not expired or future outside
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.notam.notamId)).toContain("A001");
      expect(results.map((r) => r.notam.notamId)).toContain("A002");
      expect(results.map((r) => r.notam.notamId)).not.toContain("A003");
      expect(results.map((r) => r.notam.notamId)).not.toContain("A004");
    });

    it("should include expired NOTAMs when showExpired is true", () => {
      const notams: ParsedNotam[] = [
        createMockNotam(
          "A001",
          "2025-01-15T10:00:00Z",
          "2025-01-15T18:00:00Z"
        ),
        createMockNotam(
          "A002",
          "2025-01-15T08:00:00Z",
          "2025-01-15T10:00:00Z" // Expired
        ),
      ];

      const results = filterNotamsByTimeWindow(notams, "6h", true, baseTime);

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.notam.notamId)).toContain("A001");
      expect(results.map((r) => r.notam.notamId)).toContain("A002");
    });

    it("should filter NOTAMs by 12h time window", () => {
      const notams: ParsedNotam[] = [
        createMockNotam(
          "A001",
          "2025-01-15T10:00:00Z",
          "2025-01-16T00:00:00Z" // Within 12h window
        ),
        createMockNotam(
          "A002",
          "2025-01-16T02:00:00Z", // 14h from now (outside 12h window)
          "2025-01-16T12:00:00Z"
        ),
      ];

      const results = filterNotamsByTimeWindow(notams, "12h", false, baseTime);

      expect(results).toHaveLength(1);
      expect(results[0].notam.notamId).toBe("A001");
    });

    it("should filter NOTAMs by 24h time window", () => {
      const notams: ParsedNotam[] = [
        createMockNotam(
          "A001",
          "2025-01-15T10:00:00Z",
          "2025-01-16T10:00:00Z" // Within 24h window
        ),
        createMockNotam(
          "A002",
          "2025-01-16T14:00:00Z", // 26h from now (outside 24h window)
          "2025-01-17T12:00:00Z"
        ),
      ];

      const results = filterNotamsByTimeWindow(notams, "24h", false, baseTime);

      expect(results).toHaveLength(1);
      expect(results[0].notam.notamId).toBe("A001");
    });

    it("should return all active NOTAMs when time window is All", () => {
      const notams: ParsedNotam[] = [
        createMockNotam(
          "A001",
          "2025-01-15T10:00:00Z",
          "2025-01-16T12:00:00Z"
        ),
        createMockNotam(
          "A002",
          "2025-01-16T14:00:00Z",
          "2025-01-17T12:00:00Z"
        ),
        createMockNotam(
          "A003",
          "2025-01-15T08:00:00Z",
          "2025-01-15T10:00:00Z" // Expired
        ),
      ];

      const results = filterNotamsByTimeWindow(notams, "All", false, baseTime);

      // Should include all non-expired NOTAMs
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.notam.notamId)).toContain("A001");
      expect(results.map((r) => r.notam.notamId)).toContain("A002");
      expect(results.map((r) => r.notam.notamId)).not.toContain("A003");
    });

    it("should filter out CNL (Cancellation) NOTAMs", () => {
      const notam1 = createMockNotam(
        "A001",
        "2025-01-15T10:00:00Z",
        "2025-01-16T12:00:00Z"
      );
      notam1.rawText = "CNL NOTAM A001";

      const notam2 = createMockNotam(
        "A002",
        "2025-01-15T10:00:00Z",
        "2025-01-16T12:00:00Z"
      );

      const results = filterNotamsByTimeWindow(
        [notam1, notam2],
        "24h",
        false,
        baseTime
      );

      expect(results).toHaveLength(1);
      expect(results[0].notam.notamId).toBe("A002");
    });

    it("should handle PERM NOTAMs correctly", () => {
      const permNotam = createMockNotam(
        "A001",
        "2025-01-15T10:00:00Z",
        "2035-01-15T12:00:00Z", // Far future
        true // isPermanent
      );

      const results = filterNotamsByTimeWindow(
        [permNotam],
        "24h",
        false,
        baseTime
      );

      expect(results).toHaveLength(1);
      expect(results[0].notam.isPermanent).toBe(true);
    });
  });

  describe("computeVisibilityState", () => {
    it("should return active_now for currently active NOTAM", () => {
      const notam = createMockNotam(
        "A001",
        "2025-01-15T10:00:00Z", // 2h ago
        "2025-01-15T18:00:00Z" // 6h from now
      );

      const state = computeVisibilityState(notam, "24h", baseTime);
      expect(state).toBe(NotamVisibilityState.active_now);
    });

    it("should return expired for expired NOTAM", () => {
      const notam = createMockNotam(
        "A001",
        "2025-01-15T08:00:00Z",
        "2025-01-15T10:00:00Z" // 2h ago (expired)
      );

      const state = computeVisibilityState(notam, "24h", baseTime);
      expect(state).toBe(NotamVisibilityState.expired);
    });

    it("should return future_in_window for future NOTAM within window", () => {
      const notam = createMockNotam(
        "A001",
        "2025-01-15T15:00:00Z", // 3h from now (within 24h window)
        "2025-01-16T12:00:00Z"
      );

      const state = computeVisibilityState(notam, "24h", baseTime);
      expect(state).toBe(NotamVisibilityState.future_in_window);
    });

    it("should return future_outside_window for future NOTAM outside window", () => {
      const notam = createMockNotam(
        "A001",
        "2025-01-16T14:00:00Z", // 26h from now (outside 24h window)
        "2025-01-17T12:00:00Z"
      );

      const state = computeVisibilityState(notam, "24h", baseTime);
      expect(state).toBe(NotamVisibilityState.future_outside_window);
    });

    it("should return future_in_window for All time window", () => {
      const notam = createMockNotam(
        "A001",
        "2025-01-16T14:00:00Z", // Future
        "2025-01-17T12:00:00Z"
      );

      const state = computeVisibilityState(notam, "All", baseTime);
      expect(state).toBe(NotamVisibilityState.future_in_window);
    });

    it("should return expired for NOTAM with missing dates", () => {
      const notam = createMockNotam("A001", "", "");

      const state = computeVisibilityState(notam, "24h", baseTime);
      expect(state).toBe(NotamVisibilityState.expired);
    });

    it("should handle PERM NOTAMs correctly", () => {
      const permActive = createMockNotam(
        "A001",
        "2025-01-15T10:00:00Z", // 2h ago (active)
        "2035-01-15T12:00:00Z", // Far future
        true
      );

      const state = computeVisibilityState(permActive, "24h", baseTime);
      expect(state).toBe(NotamVisibilityState.active_now);
    });
  });

  describe("getVisibilityColor", () => {
    it("should return correct color for active_now", () => {
      const color = getVisibilityColor(NotamVisibilityState.active_now, false);
      expect(color).toBe("#ffa502"); // Amber
    });

    it("should return correct color for future_in_window", () => {
      const color = getVisibilityColor(
        NotamVisibilityState.future_in_window,
        false
      );
      expect(color).toBe("#ff6348"); // Orange
    });

    it("should return correct color for expired", () => {
      const color = getVisibilityColor(NotamVisibilityState.expired, false);
      expect(color).toBe("#ff4757"); // Red
    });

    it("should return correct color for future_outside_window", () => {
      const color = getVisibilityColor(
        NotamVisibilityState.future_outside_window,
        false
      );
      expect(color).toBe("#747d8c"); // Gray
    });

    it("should return purple for permanent NOTAMs", () => {
      const color = getVisibilityColor(
        NotamVisibilityState.active_now,
        true
      );
      expect(color).toBe("#6c5ce7"); // Purple
    });
  });
});

