/**
 * Tests for Time Filtering Service
 * 
 * Tests time window filtering and visibility state computation.
 * Matches Dart implementation: lib/providers/flight_provider.dart filterNotamsByTimeAndAirport()
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  filterNotamsByTimeWindow,
  filterNotams,
  computeVisibilityState,
  NotamVisibilityState,
  TimeWindow,
} from "../services/timeFilteringService";
import { ParsedNotam } from "../services/notamParsingService";
import { NotamGroup } from "../services/notamCategorisationService";

describe("Time Filtering Service", () => {
  let baseTime: Date;
  let notamBase: Omit<ParsedNotam, "validFrom" | "validTo">;

  beforeEach(() => {
    // Use a fixed base time for consistent testing
    baseTime = new Date("2025-01-15T12:00:00Z");
    
    notamBase = {
      qCode: "QMRLC",
      fieldA: "KJFK",
      fieldB: "2501151200",
      fieldC: "2501151800",
      fieldD: "",
      fieldE: "RWY 13L/31R CLSD",
      fieldF: "",
      fieldG: "",
      isPermanent: false,
      rawText: "A) KJFK\nB) 2501151200\nC) 2501151800\nE) RWY 13L/31R CLSD",
      warnings: [],
      group: NotamGroup.runways,
      notamId: "A1234/25",
    };
  });

  describe("filterNotamsByTimeWindow", () => {
    it("should filter out CNL (Cancellation) NOTAMs", () => {
      const cnlNotam: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(baseTime.getTime() - 1000),
        validTo: new Date(baseTime.getTime() + 1000),
        rawText: "CNL NOTAM A1234/25",
      };

      const regularNotam: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(baseTime.getTime() - 1000),
        validTo: new Date(baseTime.getTime() + 1000),
      };

      const results = filterNotamsByTimeWindow(
        [cnlNotam, regularNotam],
        "24h",
        baseTime
      );

      expect(results).toHaveLength(1);
      expect(results[0].notam).toEqual(regularNotam);
    });

    it("should return all active NOTAMs when timeWindow is 'All'", () => {
      const notam1: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(baseTime.getTime() - 1000),
        validTo: new Date(baseTime.getTime() + 1000),
      };

      const notam2: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(baseTime.getTime() + 1000),
        validTo: new Date(baseTime.getTime() + 2000),
      };

      const results = filterNotamsByTimeWindow([notam1, notam2], "All", baseTime);

      expect(results).toHaveLength(2);
    });

    it("should apply interval overlap rule: validFrom < windowEnd AND validTo > now", () => {
      const now = baseTime;
      const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h from now

      // Currently active NOTAM (should be included)
      const activeNotam: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(now.getTime() - 1000),
        validTo: new Date(now.getTime() + 1000),
      };

      // Future NOTAM within window (should be included)
      const futureInWindow: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(now.getTime() + 12 * 60 * 60 * 1000), // 12h from now
        validTo: new Date(now.getTime() + 36 * 60 * 60 * 1000), // 36h from now
      };

      // Future NOTAM outside window (should NOT be included)
      const futureOutsideWindow: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(now.getTime() + 25 * 60 * 60 * 1000), // 25h from now
        validTo: new Date(now.getTime() + 30 * 60 * 60 * 1000), // 30h from now
      };

      // Expired NOTAM (should NOT be included)
      const expiredNotam: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(now.getTime() - 2000),
        validTo: new Date(now.getTime() - 1000),
      };

      const results = filterNotamsByTimeWindow(
        [activeNotam, futureInWindow, futureOutsideWindow, expiredNotam],
        "24h",
        now
      );

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.notam)).toContainEqual(activeNotam);
      expect(results.map((r) => r.notam)).toContainEqual(futureInWindow);
    });

    it("should handle PERM NOTAMs correctly", () => {
      const now = baseTime;
      
      // PERM NOTAM that is currently active
      const permActive: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(now.getTime() - 1000),
        validTo: new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 years from now
        isPermanent: true,
      };

      // PERM NOTAM that will become active within window
      const permFuture: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(now.getTime() + 12 * 60 * 60 * 1000), // 12h from now
        validTo: new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 years from now
        isPermanent: true,
      };

      // PERM NOTAM outside window
      const permOutside: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(now.getTime() + 25 * 60 * 60 * 1000), // 25h from now
        validTo: new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 years from now
        isPermanent: true,
      };

      const results = filterNotamsByTimeWindow(
        [permActive, permFuture, permOutside],
        "24h",
        now
      );

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.notam)).toContainEqual(permActive);
      expect(results.map((r) => r.notam)).toContainEqual(permFuture);
    });

    it("should handle edge cases around window boundaries", () => {
      const now = baseTime;
      const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // NOTAM that starts exactly at windowEnd (should NOT be included)
      const atWindowEnd: ParsedNotam = {
        ...notamBase,
        validFrom: windowEnd,
        validTo: new Date(windowEnd.getTime() + 1000),
      };

      // NOTAM that ends exactly at now (should NOT be included)
      const endsAtNow: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(now.getTime() - 1000),
        validTo: now,
      };

      // NOTAM that starts just before windowEnd (should be included)
      const justBeforeWindowEnd: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(windowEnd.getTime() - 1),
        validTo: new Date(windowEnd.getTime() + 1000),
      };

      // NOTAM that ends just after now (should be included)
      const endsJustAfterNow: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(now.getTime() - 1000),
        validTo: new Date(now.getTime() + 1),
      };

      const results = filterNotamsByTimeWindow(
        [atWindowEnd, endsAtNow, justBeforeWindowEnd, endsJustAfterNow],
        "24h",
        now
      );

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.notam)).toContainEqual(justBeforeWindowEnd);
      expect(results.map((r) => r.notam)).toContainEqual(endsJustAfterNow);
    });

    it("should handle NOTAMs with missing dates", () => {
      const notamWithMissingDates: ParsedNotam = {
        ...notamBase,
        validFrom: null,
        validTo: null,
      };

      const results = filterNotamsByTimeWindow(
        [notamWithMissingDates],
        "24h",
        baseTime
      );

      expect(results).toHaveLength(0);
    });
  });

  describe("computeVisibilityState", () => {
    it("should return active_now for currently active NOTAMs", () => {
      const notam: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(baseTime.getTime() - 1000),
        validTo: new Date(baseTime.getTime() + 1000),
      };

      const state = computeVisibilityState(notam, "24h", baseTime);
      expect(state).toBe(NotamVisibilityState.active_now);
    });

    it("should return expired for NOTAMs that have ended", () => {
      const notam: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(baseTime.getTime() - 2000),
        validTo: new Date(baseTime.getTime() - 1000),
      };

      const state = computeVisibilityState(notam, "24h", baseTime);
      expect(state).toBe(NotamVisibilityState.expired);
    });

    it("should return future_in_window for future NOTAMs within window", () => {
      const notam: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(baseTime.getTime() + 12 * 60 * 60 * 1000), // 12h from now
        validTo: new Date(baseTime.getTime() + 36 * 60 * 60 * 1000), // 36h from now
      };

      const state = computeVisibilityState(notam, "24h", baseTime);
      expect(state).toBe(NotamVisibilityState.future_in_window);
    });

    it("should return future_outside_window for future NOTAMs outside window", () => {
      const notam: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(baseTime.getTime() + 25 * 60 * 60 * 1000), // 25h from now
        validTo: new Date(baseTime.getTime() + 30 * 60 * 60 * 1000), // 30h from now
      };

      const state = computeVisibilityState(notam, "24h", baseTime);
      expect(state).toBe(NotamVisibilityState.future_outside_window);
    });

    it("should return future_in_window for all future NOTAMs when timeWindow is 'All'", () => {
      const notam: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(baseTime.getTime() + 100 * 60 * 60 * 1000), // 100h from now
        validTo: new Date(baseTime.getTime() + 200 * 60 * 60 * 1000), // 200h from now
      };

      const state = computeVisibilityState(notam, "All", baseTime);
      expect(state).toBe(NotamVisibilityState.future_in_window);
    });

    it("should return expired for NOTAMs with missing dates", () => {
      const notam: ParsedNotam = {
        ...notamBase,
        validFrom: null,
        validTo: null,
      };

      const state = computeVisibilityState(notam, "24h", baseTime);
      expect(state).toBe(NotamVisibilityState.expired);
    });

    it("should handle PERM NOTAMs correctly", () => {
      const permActive: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(baseTime.getTime() - 1000),
        validTo: new Date(baseTime.getTime() + 10 * 365 * 24 * 60 * 60 * 1000),
        isPermanent: true,
      };

      const state = computeVisibilityState(permActive, "24h", baseTime);
      expect(state).toBe(NotamVisibilityState.active_now);
    });
  });

  describe("filterNotams", () => {
    it("should exclude expired NOTAMs by default", () => {
      const activeNotam: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(baseTime.getTime() - 1000),
        validTo: new Date(baseTime.getTime() + 1000),
      };

      const expiredNotam: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(baseTime.getTime() - 2000),
        validTo: new Date(baseTime.getTime() - 1000),
      };

      const results = filterNotams([activeNotam, expiredNotam], "24h", false, baseTime);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(activeNotam);
    });

    it("should include expired NOTAMs when includeExpired is true", () => {
      const activeNotam: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(baseTime.getTime() - 1000),
        validTo: new Date(baseTime.getTime() + 1000),
      };

      const expiredNotam: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(baseTime.getTime() - 2000),
        validTo: new Date(baseTime.getTime() - 1000),
      };

      const results = filterNotams([activeNotam, expiredNotam], "24h", true, baseTime);

      expect(results).toHaveLength(2);
    });

    it("should work with different time windows", () => {
      const now = baseTime;

      // NOTAM active for 8 hours (should be in 6h and 12h windows, but not 24h if we check differently)
      const notam: ParsedNotam = {
        ...notamBase,
        validFrom: new Date(now.getTime() - 1000),
        validTo: new Date(now.getTime() + 8 * 60 * 60 * 1000),
      };

      const results6h = filterNotams([notam], "6h", false, now);
      const results12h = filterNotams([notam], "12h", false, now);
      const results24h = filterNotams([notam], "24h", false, now);

      expect(results6h).toHaveLength(1);
      expect(results12h).toHaveLength(1);
      expect(results24h).toHaveLength(1);
    });
  });
});

