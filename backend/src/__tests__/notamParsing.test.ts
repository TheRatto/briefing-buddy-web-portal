/**
 * NOTAM Parsing Service Tests
 * 
 * Tests for Feature F-005: Deterministic NOTAM parsing (strict-first)
 * Tests for Feature F-014: NOTAM block pre-validation and identification
 */

import { describe, it, expect } from "vitest";
import {
  parseNotam,
  parseNotams,
  extractQCode,
  ParsedNotam,
} from "../services/notamParsingService";

describe("NOTAM Parsing Service", () => {
  describe("extractQCode", () => {
    it("should extract Q code from text", () => {
      expect(extractQCode("QMRLC")).toBe("QMRLC");
      expect(extractQCode("QOLCC")).toBe("QOLCC");
      expect(extractQCode("Text with QMRLC in it")).toBe("QMRLC");
      expect(extractQCode("Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005")).toBe("QFAAH");
    });

    it("should return null if no Q code found", () => {
      expect(extractQCode("No Q code here")).toBeNull();
      expect(extractQCode("")).toBeNull();
    });

    it("should be case-insensitive", () => {
      expect(extractQCode("qmrlc")).toBe("QMRLC");
      expect(extractQCode("QmRlC")).toBe("QMRLC");
    });
  });

  describe("parseNotam - valid NOTAM", () => {
    it("should parse a valid NOTAM without warnings", () => {
      const validNotam = `A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) RWY 01/19 CLSD DUE TO MAINT`;


      const result = parseNotam(validNotam);

      expect(result.qCode).toBe("QFAAH");
      expect(result.fieldA).toBe("YBBN");
      expect(result.fieldB).toBe("2501151200");
      expect(result.fieldC).toBe("2501151800");
      expect(result.fieldE).toBe("RWY 01/19 CLSD DUE TO MAINT");
      expect(result.validFrom).not.toBeNull();
      expect(result.validTo).not.toBeNull();
      expect(result.isPermanent).toBe(false);
      expect(result.rawText).toBe(validNotam.trim());
      expect(result.warnings).toHaveLength(0);
      expect(result.group).toBeDefined();
      expect(result.notamId).toBeDefined();
    });

    it("should parse NOTAM with all fields including F and G", () => {
      const notamWithAllFields = `A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
D) DAILY 1200-1800
E) RWY 01/19 CLSD
F) GND
G) 500FT AGL`;

      const result = parseNotam(notamWithAllFields);

      expect(result.fieldA).toBe("YBBN");
      expect(result.fieldB).toBe("2501151200");
      expect(result.fieldC).toBe("2501151800");
      expect(result.fieldD).toBe("DAILY 1200-1800");
      expect(result.fieldE).toBe("RWY 01/19 CLSD");
      expect(result.fieldF).toBe("GND");
      expect(result.fieldG).toBe("500FT AGL");
      expect(result.warnings).toHaveLength(0);
    });

    it("should handle PERM/PERMANENT in field C", () => {
      const permNotam = `A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) PERM
E) RWY 01/19 PERMANENTLY CLSD`;

      const result = parseNotam(permNotam);

      expect(result.fieldC).toBe("PERM");
      expect(result.isPermanent).toBe(true);
      expect(result.validTo).not.toBeNull();
      if (result.validTo) {
        // Should be approximately 10 years in the future
        const now = new Date();
        const tenYearsFromNow = new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);
        const diff = Math.abs(result.validTo.getTime() - tenYearsFromNow.getTime());
        expect(diff).toBeLessThan(24 * 60 * 60 * 1000); // Within 1 day
      }
      expect(result.warnings).toHaveLength(0);
    });

    it("should parse dates in ICAO format correctly", () => {
      const notam = `A) YBBN
B) 2501151200
C) 2501151800
E) Test NOTAM`;

      const result = parseNotam(notam);

      expect(result.validFrom).not.toBeNull();
      expect(result.validTo).not.toBeNull();

      if (result.validFrom) {
        // 2501151200 = 2025-01-15 12:00 UTC
        expect(result.validFrom.getUTCFullYear()).toBe(2025);
        expect(result.validFrom.getUTCMonth()).toBe(0); // January (0-indexed)
        expect(result.validFrom.getUTCDate()).toBe(15);
        expect(result.validFrom.getUTCHours()).toBe(12);
        expect(result.validFrom.getUTCMinutes()).toBe(0);
      }

      if (result.validTo) {
        // 2501151800 = 2025-01-15 18:00 UTC
        expect(result.validTo.getUTCFullYear()).toBe(2025);
        expect(result.validTo.getUTCMonth()).toBe(0);
        expect(result.validTo.getUTCDate()).toBe(15);
        expect(result.validTo.getUTCHours()).toBe(18);
        expect(result.validTo.getUTCMinutes()).toBe(0);
      }
    });
  });

  describe("parseNotam - invalid/malformed NOTAM", () => {
    it("should produce warnings for missing required fields", () => {
      const incompleteNotam = `A) YBBN
B) 2501151200
C) 2501151800`;

      const result = parseNotam(incompleteNotam);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes("Field E"))).toBe(true);
    });

    it("should produce warnings for missing date fields", () => {
      const noDatesNotam = `A) YBBN
E) RWY 01/19 CLSD`;

      const result = parseNotam(noDatesNotam);

      expect(result.warnings.length).toBeGreaterThanOrEqual(2);
      expect(result.warnings.some((w) => w.includes("Field B"))).toBe(true);
      expect(result.warnings.some((w) => w.includes("Field C"))).toBe(true);
    });

    it("should produce warnings for invalid date formats", () => {
      const invalidDateNotam = `A) YBBN
B) INVALID_DATE
C) ALSO_INVALID
E) RWY 01/19 CLSD`;

      const result = parseNotam(invalidDateNotam);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes("Could not parse Field B"))).toBe(true);
      expect(result.warnings.some((w) => w.includes("Could not parse Field C"))).toBe(true);
      expect(result.validFrom).toBeNull();
      expect(result.validTo).toBeNull();
    });

    it("should preserve raw text even when parsing fails", () => {
      const malformedNotam = `This is not a valid NOTAM format at all`;

      const result = parseNotam(malformedNotam);

      expect(result.rawText).toBe(malformedNotam);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should handle empty input", () => {
      const result = parseNotam("");

      expect(result.rawText).toBe("");
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("parseNotams - multiple NOTAMs", () => {
    it("should parse multiple NOTAMs separated by blank lines", () => {
      const multipleNotams = `A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) First NOTAM

A5678/24 NOTAMN
Q) YMMM/QOLCC/IV/NBO/A/000/999/2714S15302E005
A) YSSY
B) 2501151400
C) 2501152000
E) Second NOTAM`;

      const result = parseNotams(multipleNotams);

      expect(result.notams).toHaveLength(2);
      expect(result.notams[0].fieldE).toBe("First NOTAM");
      expect(result.notams[1].fieldE).toBe("Second NOTAM");
      expect(result.notams[0].fieldA).toBe("YBBN");
      expect(result.notams[1].fieldA).toBe("YSSY");
    });

    it("should handle single NOTAM", () => {
      const singleNotam = `A) YBBN
B) 2501151200
C) 2501151800
E) Single NOTAM`;

      const result = parseNotams(singleNotam);

      expect(result.notams).toHaveLength(1);
      expect(result.notams[0].fieldE).toBe("Single NOTAM");
    });

    it("should return warnings for empty input", () => {
      const result = parseNotams("");

      expect(result.notams).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("strict-first parsing strategy", () => {
    it("should parse what it can and flag what it cannot", () => {
      const partialNotam = `A) YBBN
B) 2501151200
C) INVALID_DATE_FORMAT
E) Valid description text`;

      const result = parseNotam(partialNotam);

      // Should parse successfully what it can
      expect(result.fieldA).toBe("YBBN");
      expect(result.fieldB).toBe("2501151200");
      expect(result.fieldE).toBe("Valid description text");
      expect(result.validFrom).not.toBeNull();

      // Should flag what it cannot parse
      expect(result.validTo).toBeNull();
      expect(result.warnings.some((w) => w.includes("Could not parse Field C"))).toBe(true);
    });

    it("should never silently fail - all failures produce warnings", () => {
      const completelyInvalid = `This is not a NOTAM at all, just random text`;

      const result = parseNotam(completelyInvalid);

      // Should have warnings for missing required fields
      expect(result.warnings.length).toBeGreaterThan(0);
      // Raw text should always be preserved
      expect(result.rawText).toBe(completelyInvalid);
    });
  });

  describe("F-014: Block pre-validation integration", () => {
    it("should filter out flight plan text before parsing", () => {
      const mixedContent = `FPL-VJT534-IS
-H25B/M-SDFGHIRWY/LB1
-YMML1200
-N0410F350 KEPPA Y59 RAZZI DCT
DEP/YMML DEST/YSSY

A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) RWY 01/19 CLSD`;

      const result = parseNotams(mixedContent);

      // Should only parse the valid NOTAM, not the flight plan
      expect(result.notams).toHaveLength(1);
      expect(result.notams[0].fieldE).toBe("RWY 01/19 CLSD");
      expect(result.validationStats).toBeDefined();
      expect(result.validationStats?.totalBlocks).toBe(2);
      expect(result.validationStats?.acceptedBlocks).toBe(1);
      expect(result.validationStats?.rejectedBlocks).toBe(1);
    });

    it("should filter out waypoint tables before parsing", () => {
      const waypointAndNotam = `Waypoint Summary:
KEPPA  145  12  1200  8500
RAZZI  180  25  1225  10000
LIZZI  170  48  1248  12000

A5678/24 NOTAMN
A) YSSY
B) 2501151400
C) 2501152000
E) TWY A CLSD`;

      const result = parseNotams(waypointAndNotam);

      expect(result.notams).toHaveLength(1);
      expect(result.notams[0].fieldE).toBe("TWY A CLSD");
      expect(result.validationStats?.rejectedBlocks).toBe(1);
    });

    it("should filter out fuel tables before parsing", () => {
      const fuelAndNotam = `FUEL PLANNING
Fuel Required: 1250 lbs
Reserve: 450 lbs
Total: 2000 lbs
Endurance: 3:45

Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
E) RWY 01/19 CLSD`;

      const result = parseNotams(fuelAndNotam);

      expect(result.notams).toHaveLength(1);
      expect(result.notams[0].qCode).toBe("QFAAH");
      expect(result.validationStats?.rejectedBlocks).toBe(1);
    });

    it("should filter out procedure text before parsing", () => {
      const procedureAndNotam = `YMML ILS RWY 16 (IAP)
Initial Approach: KEPPA
Transition: RAZZI to KEPPA
Missed Approach: Climb to 3000

A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YMML
B) 2501151200
C) 2501151800
E) ILS RWY 16 U/S`;

      const result = parseNotams(procedureAndNotam);

      expect(result.notams).toHaveLength(1);
      expect(result.notams[0].fieldE).toBe("ILS RWY 16 U/S");
      expect(result.validationStats?.rejectedBlocks).toBe(1);
    });

    it("should handle ForeFlight-like mixed content", () => {
      // Simulates ForeFlight PDF with flight plan, waypoints, fuel, and NOTAMs
      const foreFlightLike = `FPL-VJT534-IS
-H25B/M-SDFGHIRWY/LB1
-YMML1200
DEP/YMML DEST/YSSY

Route Waypoints:
KEPPA  145  12  1200  8500
RAZZI  180  25  1225  10000

FUEL PLANNING
Total: 2000 lbs

A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) RWY 01/19 CLSD

A5678/24 NOTAMN
Q) YMMM/QOLCC/IV/NBO/A/000/999/2714S15302E005
A) YSSY
B) 2501151400
C) 2501152000
E) TWY A CLSD`;

      const result = parseNotams(foreFlightLike);

      // Should only parse the 2 valid NOTAMs, filtering out flight plan, waypoints, fuel
      expect(result.notams).toHaveLength(2);
      expect(result.notams[0].fieldE).toBe("RWY 01/19 CLSD");
      expect(result.notams[1].fieldE).toBe("TWY A CLSD");
      expect(result.validationStats?.totalBlocks).toBe(5);
      expect(result.validationStats?.acceptedBlocks).toBe(2);
      expect(result.validationStats?.rejectedBlocks).toBe(3);
    });

    it("should not break existing valid NOTAM parsing (regression test)", () => {
      const validNotams = `A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) First NOTAM

A5678/24 NOTAMN
Q) YMMM/QOLCC/IV/NBO/A/000/999/2714S15302E005
A) YSSY
B) 2501151400
C) 2501152000
E) Second NOTAM`;

      const result = parseNotams(validNotams);

      // All valid NOTAMs should still parse successfully
      expect(result.notams).toHaveLength(2);
      expect(result.notams[0].fieldE).toBe("First NOTAM");
      expect(result.notams[1].fieldE).toBe("Second NOTAM");
      expect(result.validationStats?.acceptedBlocks).toBe(2);
      expect(result.validationStats?.rejectedBlocks).toBe(0);
    });

    it("should provide validation statistics", () => {
      const content = `Short text

Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
E) Valid NOTAM

Another short block`;

      const result = parseNotams(content);

      expect(result.validationStats).toBeDefined();
      expect(result.validationStats?.totalBlocks).toBe(3);
      expect(result.validationStats?.acceptedBlocks).toBe(1);
      expect(result.validationStats?.rejectedBlocks).toBe(2);
      expect(result.validationStats?.rejectionReasons).toBeDefined();
      expect(result.validationStats?.rejectionReasons.size).toBeGreaterThan(0);
    });

    it("should not generate parsing warnings for rejected blocks", () => {
      const content = `FPL-ABC123-IS flight plan text

A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) Valid NOTAM`;

      const result = parseNotams(content);

      // Should only have the valid NOTAM
      expect(result.notams).toHaveLength(1);
      
      // The valid NOTAM now has all required fields, so it should have no warnings
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("F-016: Enhanced NOTAM splitting logic", () => {
    describe("Blank line splitting (backwards compatibility)", () => {
      it("should split NOTAMs separated by blank lines (existing behavior)", () => {
        const blankLineSeparated = `A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) RWY 01/19 CLSD

A5678/24 NOTAMN
Q) YMMM/QOLCC/IV/NBO/A/000/999/2714S15302E005
A) YSSY
B) 2501151400
C) 2501152000
E) TWY A CLSD`;

        const result = parseNotams(blankLineSeparated);

        expect(result.notams).toHaveLength(2);
        expect(result.notams[0].notamId).toBe("A1234/24");
        expect(result.notams[0].fieldE).toBe("RWY 01/19 CLSD");
        expect(result.notams[1].notamId).toBe("A5678/24");
        expect(result.notams[1].fieldE).toBe("TWY A CLSD");
      });
    });

    describe("ID-based splitting (no blank lines)", () => {
      it("should split consecutive NOTAMs with ID headers but no blank lines", () => {
        const denseFormat = `A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) RWY 01/19 CLSD
A5678/24 NOTAMN
Q) YMMM/QOLCC/IV/NBO/A/000/999/2714S15302E005
A) YSSY
B) 2501151400
C) 2501152000
E) TWY A CLSD`;

        const result = parseNotams(denseFormat);

        expect(result.notams).toHaveLength(2);
        expect(result.notams[0].notamId).toBe("A1234/24");
        expect(result.notams[0].fieldE).toBe("RWY 01/19 CLSD");
        expect(result.notams[1].notamId).toBe("A5678/24");
        expect(result.notams[1].fieldE).toBe("TWY A CLSD");
      });

      it("should split multiple consecutive NOTAMs in dense format", () => {
        const threeDenseNotams = `C4621/25 NOTAMN
Q) YBBB/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) First dense NOTAM
D3201/25 NOTAMR
Q) YSSS/QOLCC/IV/NBO/A/000/999/3349S15113E005
A) YSSY
B) 2501151400
C) 2501152000
E) Second dense NOTAM replacement
E0042/25 NOTAMC
Q) YMML/QFAAH/IV/NBO/A/000/999/3753S14502E005
A) YMML
B) 2501151600
C) 2501152200
E) Third dense NOTAM cancellation`;

        const result = parseNotams(threeDenseNotams);

        expect(result.notams).toHaveLength(3);
        expect(result.notams[0].notamId).toBe("C4621/25");
        expect(result.notams[0].fieldE).toBe("First dense NOTAM");
        expect(result.notams[1].notamId).toBe("D3201/25");
        expect(result.notams[1].fieldE).toBe("Second dense NOTAM replacement");
        expect(result.notams[2].notamId).toBe("E0042/25");
        expect(result.notams[2].fieldE).toBe("Third dense NOTAM cancellation");
      });
    });

    describe("NOTAM ID pattern recognition", () => {
      it("should recognize standard NOTAM ID patterns", () => {
        const patterns = [
          "A1234/24 NOTAMN",
          "B0042/25 NOTAMC",
          "C4621/24 NOTAMR",
          "D3201/25 NOTAM",
          "E0001/24 NOTAMN",
        ];

        for (const pattern of patterns) {
          const notam = `${pattern}
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) Test NOTAM`;

          const result = parseNotams(notam);
          expect(result.notams).toHaveLength(1);
          expect(result.notams[0].rawText).toContain(pattern);
        }
      });

      it("should recognize multi-letter prefix NOTAM IDs", () => {
        const multiLetterPattern = `ABC1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) Multi-letter prefix NOTAM`;

        const result = parseNotams(multiLetterPattern);

        expect(result.notams).toHaveLength(1);
        expect(result.notams[0].notamId).toBe("ABC1234/24");
      });
    });

    describe("NOTAM type markers", () => {
      it("should recognize NOTAMN (new)", () => {
        const newNotam = `A1234/24 NOTAMN
A) YBBN
B) 2501151200
C) 2501151800
E) New NOTAM`;

        const result = parseNotams(newNotam);
        expect(result.notams).toHaveLength(1);
      });

      it("should recognize NOTAMC (cancel)", () => {
        const cancelNotam = `B5678/24 NOTAMC
A) YSSY
B) 2501151400
C) 2501152000
E) Cancellation NOTAM`;

        const result = parseNotams(cancelNotam);
        expect(result.notams).toHaveLength(1);
      });

      it("should recognize NOTAMR (replace)", () => {
        const replaceNotam = `C9012/24 NOTAMR
A) YMML
B) 2501151600
C) 2501152200
E) Replacement NOTAM`;

        const result = parseNotams(replaceNotam);
        expect(result.notams).toHaveLength(1);
      });

      it("should recognize generic NOTAM marker without specific type", () => {
        const genericNotam = `D3456/24 NOTAM
A) YBBN
B) 2501151200
C) 2501151800
E) Generic NOTAM`;

        const result = parseNotams(genericNotam);
        expect(result.notams).toHaveLength(1);
      });
    });

    describe("Edge case: ID patterns in Field E", () => {
      it("should not split mid-NOTAM if Field E contains ID-like text", () => {
        const notamWithEmbeddedId = `A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) RWY 01/19 CLSD. REPLACES A0999/24 NOTAMN. SEE ALSO B1111/24 NOTAMR FOR RELATED INFO.`;

        const result = parseNotams(notamWithEmbeddedId);

        // Should parse as single NOTAM (not split on embedded IDs within Field E)
        expect(result.notams).toHaveLength(1);
        expect(result.notams[0].notamId).toBe("A1234/24");
        expect(result.notams[0].fieldE).toContain("REPLACES A0999/24");
        expect(result.notams[0].fieldE).toContain("B1111/24");
      });

      it("should not split on ID patterns that appear mid-line", () => {
        const midLineId = `A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) RWY 01/19 CLSD. Contact tower on 123.45 or see A5678/24 NOTAMN for details.`;

        const result = parseNotams(midLineId);

        expect(result.notams).toHaveLength(1);
        expect(result.notams[0].fieldE).toContain("A5678/24");
      });
    });

    describe("Mixed splitting strategies", () => {
      it("should handle mix of blank-line and ID-based splitting", () => {
        const mixedFormat = `A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) First NOTAM

B5678/24 NOTAMN
Q) YMMM/QOLCC/IV/NBO/A/000/999/3349S15113E005
A) YSSY
B) 2501151400
C) 2501152000
E) Second NOTAM
C9012/24 NOTAMN
Q) YMML/QFAAH/IV/NBO/A/000/999/3753S14502E005
A) YMML
B) 2501151600
C) 2501152200
E) Third NOTAM`;

        const result = parseNotams(mixedFormat);

        expect(result.notams).toHaveLength(3);
        expect(result.notams[0].notamId).toBe("A1234/24");
        expect(result.notams[1].notamId).toBe("B5678/24");
        expect(result.notams[2].notamId).toBe("C9012/24");
      });
    });

    describe("Page footer handling", () => {
      it("should skip page footers during splitting", () => {
        const withFooters = `A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) First NOTAM
NOTAMs 1 of 9
-- 16 of 24 --
B5678/24 NOTAMN
Q) YMMM/QOLCC/IV/NBO/A/000/999/3349S15113E005
A) YSSY
B) 2501151400
C) 2501152000
E) Second NOTAM
NOTAMs 2 of 9`;

        const result = parseNotams(withFooters);

        expect(result.notams).toHaveLength(2);
        expect(result.notams[0].fieldE).toBe("First NOTAM");
        expect(result.notams[1].fieldE).toBe("Second NOTAM");
        // Ensure footers are not included in raw text
        expect(result.notams[0].rawText).not.toContain("NOTAMs 1 of 9");
        expect(result.notams[0].rawText).not.toContain("16 of 24");
      });
    });

    describe("ForeFlight dense format", () => {
      it("should handle ForeFlight-style consecutive NOTAMs without blank lines", () => {
        // Simulates typical ForeFlight PDF NOTAM page format
        const foreFlightDense = `C4621/25 NOTAMN
Q) YBBB/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) RWY 01/19 CLSD WEF 1200 TO 1800 FOR MAINT
NOTAMs 1 of 9
D3201/25 NOTAMR
Q) YSSS/QOLCC/IV/NBO/A/000/999/3349S15113E005
A) YSSY
B) 2501151400
C) 2501152000
E) TWY A CLSD BTN TWY B AND TWY C. ALT ROUTING AVBL VIA TWY D.
-- 17 of 24 --
E0042/25 NOTAMN
Q) YMML/QFAAH/IV/NBO/A/000/999/3753S14502E005
A) YMML
B) 2501151600
C) PERM
E) ILS RWY 16 U/S
NOTAMs 2 of 9`;

        const result = parseNotams(foreFlightDense);

        expect(result.notams).toHaveLength(3);
        expect(result.notams[0].notamId).toBe("C4621/25");
        expect(result.notams[0].fieldA).toBe("YBBN");
        expect(result.notams[1].notamId).toBe("D3201/25");
        expect(result.notams[1].fieldA).toBe("YSSY");
        expect(result.notams[2].notamId).toBe("E0042/25");
        expect(result.notams[2].fieldA).toBe("YMML");
        expect(result.notams[2].isPermanent).toBe(true);

        // Verify footers are removed
        expect(result.notams[0].rawText).not.toContain("NOTAMs");
        expect(result.notams[1].rawText).not.toContain("of 24");
      });
    });

    describe("Regression: single NOTAM should not be split", () => {
      it("should keep single NOTAM as one block", () => {
        const singleNotam = `A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
D) DAILY 1200-1800
E) RWY 01/19 CLSD. BIRDS REPORTED IN VICINITY.
F) GND
G) 500FT AGL`;

        const result = parseNotams(singleNotam);

        expect(result.notams).toHaveLength(1);
        expect(result.notams[0].notamId).toBe("A1234/24");
        expect(result.notams[0].fieldE).toContain("BIRDS REPORTED");
      });
    });

    describe("Empty and invalid input", () => {
      it("should handle empty input gracefully", () => {
        const result = parseNotams("");

        expect(result.notams).toHaveLength(0);
        expect(result.warnings.length).toBeGreaterThan(0);
      });

      it("should handle input with no valid NOTAM structure", () => {
        const noNotams = `This is just random text
without any NOTAM structure
or valid fields`;

        const result = parseNotams(noNotams);

        // Block validation should reject this
        expect(result.notams).toHaveLength(0);
      });
    });

    describe("Integration with F-014 validation", () => {
      it("should split then validate blocks separately", () => {
        const mixedValidInvalid = `FPL-ABC123-IS
Flight plan content
A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) Valid NOTAM
Random invalid text block`;

        const result = parseNotams(mixedValidInvalid);

        // Should only include valid NOTAM
        expect(result.notams).toHaveLength(1);
        expect(result.notams[0].notamId).toBe("A1234/24");
        expect(result.validationStats?.rejectedBlocks).toBeGreaterThan(0);
      });
    });
  });
});

