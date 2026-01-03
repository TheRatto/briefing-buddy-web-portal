/**
 * Tests for NOTAM grouping utilities
 */

import { describe, it, expect } from "vitest";
import {
  groupNotamsByLocationAndCategory,
  getCategoryLabel,
  getSortedLocations,
  getSortedCategories,
} from "../utils/notamGrouping";
import { ParsedNotam, NotamGroup } from "../types/notam";

describe("notamGrouping", () => {
  const createMockNotam = (
    notamId: string,
    fieldA: string,
    group: NotamGroup,
    rawText: string = `NOTAM ${notamId}`
  ): ParsedNotam => ({
    notamId,
    fieldA,
    group,
    rawText,
    qCode: null,
    fieldB: "2501151200",
    fieldC: "2501161200",
    fieldD: "",
    fieldE: "",
    fieldF: "",
    fieldG: "",
    validFrom: "2025-01-15T12:00:00Z",
    validTo: "2025-01-16T12:00:00Z",
    isPermanent: false,
    warnings: [],
  });

  describe("groupNotamsByLocationAndCategory", () => {
    it("should group NOTAMs by location and category", () => {
      const notams: ParsedNotam[] = [
        createMockNotam("A001", "KJFK", NotamGroup.runways, "Runway closure"),
        createMockNotam("A002", "KJFK", NotamGroup.runways, "Runway lighting"),
        createMockNotam("A003", "KJFK", NotamGroup.taxiways, "Taxiway closure"),
        createMockNotam("A004", "KLAX", NotamGroup.runways, "Runway closure"),
      ];

      const grouped = groupNotamsByLocationAndCategory(notams);

      expect(grouped).toHaveProperty("KJFK");
      expect(grouped).toHaveProperty("KLAX");
      expect(grouped.KJFK).toHaveProperty(NotamGroup.runways);
      expect(grouped.KJFK).toHaveProperty(NotamGroup.taxiways);
      expect(grouped.KJFK[NotamGroup.runways]).toHaveLength(2);
      expect(grouped.KJFK[NotamGroup.taxiways]).toHaveLength(1);
      expect(grouped.KLAX[NotamGroup.runways]).toHaveLength(1);
    });

    it("should handle NOTAMs with missing fieldA", () => {
      const notams: ParsedNotam[] = [
        createMockNotam("A001", "", NotamGroup.runways, "NOTAM without location"),
      ];

      const grouped = groupNotamsByLocationAndCategory(notams);

      expect(grouped).toHaveProperty("UNKNOWN");
      expect(grouped.UNKNOWN[NotamGroup.runways]).toHaveLength(1);
    });

    it("should sort NOTAMs within categories by validFrom date", () => {
      const notam1 = createMockNotam("A001", "KJFK", NotamGroup.runways);
      notam1.validFrom = "2025-01-20T12:00:00Z";
      const notam2 = createMockNotam("A002", "KJFK", NotamGroup.runways);
      notam2.validFrom = "2025-01-15T12:00:00Z";
      const notam3 = createMockNotam("A003", "KJFK", NotamGroup.runways);
      notam3.validFrom = "2025-01-18T12:00:00Z";

      const grouped = groupNotamsByLocationAndCategory([notam1, notam2, notam3]);

      const runways = grouped.KJFK[NotamGroup.runways]!;
      expect(runways).toHaveLength(3);
      expect(runways[0].notamId).toBe("A002"); // Earliest
      expect(runways[1].notamId).toBe("A003");
      expect(runways[2].notamId).toBe("A001"); // Latest
    });

    it("should handle empty array", () => {
      const grouped = groupNotamsByLocationAndCategory([]);
      expect(grouped).toEqual({});
    });
  });

  describe("getCategoryLabel", () => {
    it("should return correct label for each category", () => {
      expect(getCategoryLabel(NotamGroup.runways)).toBe("Runways");
      expect(getCategoryLabel(NotamGroup.taxiways)).toBe("Taxiways");
      expect(getCategoryLabel(NotamGroup.instrumentProcedures)).toBe("Instrument Procedures");
      expect(getCategoryLabel(NotamGroup.firAirspaceRestrictions)).toBe("FIR Airspace Restrictions");
    });
  });

  describe("getSortedLocations", () => {
    it("should return sorted list of locations", () => {
      const grouped = {
        KLAX: {},
        KJFK: {},
        KORD: {},
      };
      const locations = getSortedLocations(grouped);
      expect(locations).toEqual(["KJFK", "KLAX", "KORD"]);
    });
  });

  describe("getSortedCategories", () => {
    it("should return categories in priority order", () => {
      const locationCategories = {
        [NotamGroup.taxiways]: [createMockNotam("A001", "KJFK", NotamGroup.taxiways)],
        [NotamGroup.runways]: [createMockNotam("A002", "KJFK", NotamGroup.runways)],
        [NotamGroup.admin]: [createMockNotam("A003", "KJFK", NotamGroup.admin)],
      };

      const categories = getSortedCategories(locationCategories);
      
      // Should be in priority order: runways first, then taxiways, then admin
      expect(categories[0]).toBe(NotamGroup.runways);
      expect(categories[1]).toBe(NotamGroup.taxiways);
      expect(categories[2]).toBe(NotamGroup.admin);
    });

    it("should filter out empty categories", () => {
      const locationCategories = {
        [NotamGroup.runways]: [createMockNotam("A001", "KJFK", NotamGroup.runways)],
        [NotamGroup.taxiways]: [],
      };

      const categories = getSortedCategories(locationCategories);
      expect(categories).toEqual([NotamGroup.runways]);
      expect(categories).not.toContain(NotamGroup.taxiways);
    });
  });
});

