/**
 * NOTAM Block Validation Service Tests
 * 
 * Tests for Feature F-014: NOTAM block pre-validation and identification
 */

import { describe, it, expect } from "vitest";
import {
  validateNotamBlock,
  validateBlocks,
  ValidationResult,
} from "../services/notamBlockValidationService";

describe("NOTAM Block Validation Service", () => {
  describe("validateNotamBlock - valid NOTAMs", () => {
    it("should accept NOTAM with Q-code and full fields", () => {
      const validNotam = `A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) RWY 01/19 CLSD DUE TO MAINT`;

      const result = validateNotamBlock(validNotam);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it("should accept NOTAM with Q-code only (minimal structure)", () => {
      const minimalNotam = `Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
Some NOTAM text without full field structure`;

      const result = validateNotamBlock(minimalNotam);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should accept NOTAM with Field A and Field E (no Q-code)", () => {
      const notamWithoutQCode = `A1234/24 NOTAMN
A) YBBN
B) 2501151200
C) 2501151800
E) RWY 01/19 CLSD DUE TO MAINT`;

      const result = validateNotamBlock(notamWithoutQCode);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should accept NOTAM with PERM and all fields", () => {
      const permNotam = `A5678/24 NOTAMN
Q) YMMM/QMRLC/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) PERM
D) DAILY 1200-1800
E) TWY A CLSD
F) GND
G) 500FT AGL`;

      const result = validateNotamBlock(permNotam);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it("should accept multi-line NOTAM with proper field structure", () => {
      const multiLineNotam = `E3201/25 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) RWY 01/19 CLSD DUE TO MAINTENANCE WORK.
   EXPECT DELAYS DURING PEAK HOURS.
   CONTACT TOWER FOR ALTERNATIVE RUNWAY.`;

      const result = validateNotamBlock(multiLineNotam);

      expect(result.isValid).toBe(true);
    });
  });

  describe("validateNotamBlock - reject non-NOTAM content", () => {
    it("should reject empty or very short text", () => {
      expect(validateNotamBlock("").isValid).toBe(false);
      expect(validateNotamBlock("   ").isValid).toBe(false);
      expect(validateNotamBlock("Short").isValid).toBe(false);
      expect(validateNotamBlock("A bit longer").isValid).toBe(false);
    });

    it("should reject ICAO flight plan format", () => {
      const flightPlan = `FPL-VJT534-IS
-H25B/M-SDFGHIRWY/LB1
-YMML1200
-N0410F350 KEPPA Y59 RAZZI DCT LIZZI Q29 ARBEY DCT
-YSSY0145 YMML
-PBN/A1B1C1D1L1O1S1 NAV/GBAS SBAS DOF/250115 REG/VHVJE
-EET/YMMM0015 YBBB0030 YSSY0125
DEP/YMML DEST/YSSY`;

      const result = validateNotamBlock(flightPlan);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("Flight plan");
    });

    it("should reject waypoint/navigation table", () => {
      const waypointTable = `Route Waypoints:
KEPPA  145  12  1200  8500
RAZZI  180  25  1225  10000
LIZZI  170  48  1248  12000
ARBEY  165  72  1312  14000
SYSSY  160  95  1335  15000`;

      const result = validateNotamBlock(waypointTable);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("Waypoint");
    });

    it("should reject fuel/performance table", () => {
      const fuelTable = `FUEL PLANNING
Fuel Required: 1250 lbs
Reserve: 450 lbs
Alternate: 300 lbs
Total: 2000 lbs
Endurance: 3:45`;

      const result = validateNotamBlock(fuelTable);

      expect(result.isValid).toBe(false);
      // Fuel table is rejected (either by fuel detection or structure check)
      expect(result.reason).toBeDefined();
    });

    it("should reject instrument procedure text", () => {
      const procedure = `YMML ILS RWY 16 (IAP)
Initial Approach Fix: KEPPA
Transition: RAZZI to KEPPA
Final Approach Course: 164°
Missed Approach: Climb to 3000 on runway heading`;

      const result = validateNotamBlock(procedure);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("procedure");
    });

    it("should reject text without required NOTAM structure", () => {
      const noStructure = `This is some random text that does not have
any NOTAM field markers or Q-codes in it at all.
It should be rejected by the validation logic
because it lacks the required structural elements.`;

      const result = validateNotamBlock(noStructure);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("Missing required structure");
    });

    it("should reject text with only Field A but no Field E or Q-code", () => {
      const incompleteNotam = `A) YBBN
B) 2501151200
C) 2501151800`;

      const result = validateNotamBlock(incompleteNotam);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("Missing required structure");
    });

    it("should reject coordinate data with numeric columns", () => {
      const coordinates = `3345S 15115E  25  120
3350S 15120E  30  145
3355S 15125E  35  170
3400S 15130E  40  195`;

      const result = validateNotamBlock(coordinates);

      expect(result.isValid).toBe(false);
    });
  });

  describe("validateNotamBlock - edge cases", () => {
    it("should handle mixed case Q-codes", () => {
      const mixedCase = `qfaah in lowercase
E) Some NOTAM text here`;

      const result = validateNotamBlock(mixedCase);

      expect(result.isValid).toBe(true);
    });

    it("should handle Q-code in middle of text", () => {
      const qCodeInMiddle = `A) YBBN
This NOTAM has QFAAH somewhere in the text
E) RWY 01/19 CLSD`;

      const result = validateNotamBlock(qCodeInMiddle);

      expect(result.isValid).toBe(true);
    });

    it("should not be confused by field-like markers in non-NOTAM text", () => {
      const falseMarkers = `A) This looks like a field marker
But it's in flight plan context with FPL-ABC123-IS
And has no other NOTAM structure`;

      const result = validateNotamBlock(falseMarkers);

      // Should reject due to flight plan format
      expect(result.isValid).toBe(false);
    });

    it("should handle NOTAM with Field E containing numbers (not waypoint data)", () => {
      const notamWithNumbers = `A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) RWY 01/19 CLSD. LENGTH REDUCED TO 1500M. ELEVATION 12FT.`;

      const result = validateNotamBlock(notamWithNumbers);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe("validateBlocks - batch validation", () => {
    it("should validate multiple blocks and return statistics", () => {
      const blocks = [
        // Valid NOTAM 1
        `A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) RWY 01/19 CLSD`,
        // Flight plan (invalid)
        `FPL-VJT534-IS
-H25B/M-SDFGHIRWY/LB1
-YMML1200
-N0410F350 KEPPA Y59 RAZZI`,
        // Valid NOTAM 2
        `E5678/24 NOTAMN
A) YSSY
B) 2501151400
C) 2501152000
E) TWY A CLSD`,
        // Waypoint table (invalid)
        `KEPPA  145  12  1200  8500
RAZZI  180  25  1225  10000
LIZZI  170  48  1248  12000`,
      ];

      const result = validateBlocks(blocks);

      expect(result.stats.totalBlocks).toBe(4);
      expect(result.stats.acceptedBlocks).toBe(2);
      expect(result.stats.rejectedBlocks).toBe(2);
      expect(result.validBlocks).toHaveLength(2);
      expect(result.invalidBlocks).toHaveLength(2);
      expect(result.stats.rejectionReasons.size).toBeGreaterThan(0);
    });

    it("should handle all valid blocks", () => {
      const blocks = [
        `Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
E) First NOTAM`,
        `Q) YMMM/QOLCC/IV/NBO/A/000/999/2714S15302E005
E) Second NOTAM`,
      ];

      const result = validateBlocks(blocks);

      expect(result.stats.totalBlocks).toBe(2);
      expect(result.stats.acceptedBlocks).toBe(2);
      expect(result.stats.rejectedBlocks).toBe(0);
      expect(result.validBlocks).toHaveLength(2);
    });

    it("should handle all invalid blocks", () => {
      const blocks = [
        "Too short",
        "FPL-ABC123-IS flight plan format",
        `FUEL PLANNING
Fuel: 1250 lbs`,
      ];

      const result = validateBlocks(blocks);

      expect(result.stats.totalBlocks).toBe(3);
      expect(result.stats.acceptedBlocks).toBe(0);
      expect(result.stats.rejectedBlocks).toBe(3);
      expect(result.invalidBlocks).toHaveLength(3);
    });

    it("should collect rejection reasons in statistics", () => {
      const blocks = [
        "Short",
        "",
        "   ",
        `FPL-ABC123-IS
-YMML1200`,
      ];

      const result = validateBlocks(blocks);

      expect(result.stats.rejectionReasons.size).toBeGreaterThan(0);
      expect(result.stats.rejectionReasons.get("Text too short (< 20 chars)")).toBe(3);
    });
  });

  describe("confidence scoring", () => {
    it("should give higher confidence to NOTAMs with more fields", () => {
      const minimalNotam = `Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
E) RWY CLSD`;

      const fullNotam = `A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
D) DAILY 1200-1800
E) RWY 01/19 CLSD
F) GND
G) 500FT AGL`;

      const minimalResult = validateNotamBlock(minimalNotam);
      const fullResult = validateNotamBlock(fullNotam);

      expect(minimalResult.isValid).toBe(true);
      expect(fullResult.isValid).toBe(true);
      expect(fullResult.confidence).toBeGreaterThan(minimalResult.confidence);
    });

    it("should give high confidence when NOTAM ID is present", () => {
      const withId = `A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
E) RWY CLSD`;

      const withoutId = `Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
E) RWY CLSD`;

      const withIdResult = validateNotamBlock(withId);
      const withoutIdResult = validateNotamBlock(withoutId);

      expect(withIdResult.confidence).toBeGreaterThan(withoutIdResult.confidence);
    });
  });
});

