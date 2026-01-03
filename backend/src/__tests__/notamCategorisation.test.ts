/**
 * NOTAM Categorisation Service Tests
 * 
 * Tests for Feature F-006: NOTAM categorisation (airport & FIR)
 * Validates Q-code mapping, keyword scoring, and FIR grouping
 */

import { describe, it, expect } from "vitest";
import {
  NotamGroup,
  determineGroupFromQCode,
  assignGroup,
  groupFIRNotam,
  isFIRNotam,
} from "../services/notamCategorisationService";
import { parseNotam } from "../services/notamParsingService";

describe("NOTAM Categorisation Service", () => {
  describe("NotamGroup enum", () => {
    it("should have all expected airport groups", () => {
      expect(NotamGroup.runways).toBe("runways");
      expect(NotamGroup.taxiways).toBe("taxiways");
      expect(NotamGroup.instrumentProcedures).toBe("instrumentProcedures");
      expect(NotamGroup.airportServices).toBe("airportServices");
      expect(NotamGroup.lighting).toBe("lighting");
      expect(NotamGroup.hazards).toBe("hazards");
      expect(NotamGroup.admin).toBe("admin");
      expect(NotamGroup.other).toBe("other");
    });

    it("should have all expected FIR groups", () => {
      expect(NotamGroup.firAirspaceRestrictions).toBe("firAirspaceRestrictions");
      expect(NotamGroup.firAtcNavigation).toBe("firAtcNavigation");
      expect(NotamGroup.firObstaclesCharts).toBe("firObstaclesCharts");
      expect(NotamGroup.firInfrastructure).toBe("firInfrastructure");
      expect(NotamGroup.firDroneOperations).toBe("firDroneOperations");
      expect(NotamGroup.firAdministrative).toBe("firAdministrative");
    });
  });

  describe("determineGroupFromQCode", () => {
    it("should map runway Q-codes to runways group", () => {
      expect(determineGroupFromQCode("QMRLC")).toBe(NotamGroup.runways); // MR = Runway
      expect(determineGroupFromQCode("QMSLC")).toBe(NotamGroup.runways); // MS = Stopway
      expect(determineGroupFromQCode("QMTLC")).toBe(NotamGroup.runways); // MT = Threshold
      expect(determineGroupFromQCode("QMULC")).toBe(NotamGroup.runways); // MU = Runway Turning Bay
      expect(determineGroupFromQCode("QMWLC")).toBe(NotamGroup.runways); // MW = Strip/Shoulder
      expect(determineGroupFromQCode("QMDLC")).toBe(NotamGroup.runways); // MD = Declared Distances
    });

    it("should map taxiway Q-codes to taxiways group", () => {
      expect(determineGroupFromQCode("QMXLC")).toBe(NotamGroup.taxiways); // MX = Taxiway
      expect(determineGroupFromQCode("QMYLC")).toBe(NotamGroup.taxiways); // MY = Rapid Exit Taxiway
      expect(determineGroupFromQCode("QMKLC")).toBe(NotamGroup.taxiways); // MK = Parking Area
      expect(determineGroupFromQCode("QMNLC")).toBe(NotamGroup.taxiways); // MN = Apron
      expect(determineGroupFromQCode("QMPLC")).toBe(NotamGroup.taxiways); // MP = Aircraft Stands
    });

    it("should map ILS/navaid Q-codes to instrumentProcedures group", () => {
      expect(determineGroupFromQCode("QICLC")).toBe(NotamGroup.instrumentProcedures); // IC = ILS
      expect(determineGroupFromQCode("QIDLC")).toBe(NotamGroup.instrumentProcedures); // ID = ILS DME
      expect(determineGroupFromQCode("QNVLC")).toBe(NotamGroup.instrumentProcedures); // NV = VOR
      expect(determineGroupFromQCode("QNBLC")).toBe(NotamGroup.instrumentProcedures); // NB = NDB
    });

    it("should map procedure Q-codes to instrumentProcedures group", () => {
      expect(determineGroupFromQCode("QPALC")).toBe(NotamGroup.instrumentProcedures); // PA = SID
      expect(determineGroupFromQCode("QPDLC")).toBe(NotamGroup.instrumentProcedures); // PD = STAR
      expect(determineGroupFromQCode("QPILC")).toBe(NotamGroup.instrumentProcedures); // PI = Instrument Approach
    });

    it("should map airspace Q-codes to instrumentProcedures group", () => {
      expect(determineGroupFromQCode("QAALC")).toBe(NotamGroup.instrumentProcedures); // AA = Minimum Altitude
      expect(determineGroupFromQCode("QRRLC")).toBe(NotamGroup.instrumentProcedures); // RR = Restricted Area
      expect(determineGroupFromQCode("QRPLC")).toBe(NotamGroup.instrumentProcedures); // RP = Prohibited Area
    });

    it("should map airport services Q-codes to airportServices group", () => {
      expect(determineGroupFromQCode("QFALC")).toBe(NotamGroup.airportServices); // FA = Aerodrome
      expect(determineGroupFromQCode("QFFLC")).toBe(NotamGroup.airportServices); // FF = Fire Fighting
      expect(determineGroupFromQCode("QFULC")).toBe(NotamGroup.airportServices); // FU = Fuel
      expect(determineGroupFromQCode("QFMLC")).toBe(NotamGroup.airportServices); // FM = Meteorological Service
    });

    it("should map lighting Q-codes to lighting group", () => {
      expect(determineGroupFromQCode("QLALC")).toBe(NotamGroup.lighting); // LA = Approach Lighting
      expect(determineGroupFromQCode("QLLLC")).toBe(NotamGroup.lighting); // LL = Low Intensity Runway Lights
      expect(determineGroupFromQCode("QLPLC")).toBe(NotamGroup.lighting); // LP = PAPI
      expect(determineGroupFromQCode("QLXLC")).toBe(NotamGroup.lighting); // LX = Taxiway Centerline Lights
    });

    it("should map hazard Q-codes to hazards group", () => {
      expect(determineGroupFromQCode("QOBLC")).toBe(NotamGroup.hazards); // OB = Obstacle
      expect(determineGroupFromQCode("QOLLC")).toBe(NotamGroup.hazards); // OL = Obstacle Lights
      expect(determineGroupFromQCode("QWALC")).toBe(NotamGroup.hazards); // WA = Air Display
      expect(determineGroupFromQCode("QWULC")).toBe(NotamGroup.hazards); // WU = Unmanned Aircraft
    });

    it("should map admin Q-codes to admin group", () => {
      expect(determineGroupFromQCode("QPFLC")).toBe(NotamGroup.admin); // PF = Flow Control Procedure
      expect(determineGroupFromQCode("QPRLC")).toBe(NotamGroup.admin); // PR = Radio Failure Procedures
      expect(determineGroupFromQCode("QPTLC")).toBe(NotamGroup.admin); // PT = Transition Altitude
    });

    it("should return other for invalid or unmapped Q-codes", () => {
      expect(determineGroupFromQCode(null)).toBe(NotamGroup.other);
      expect(determineGroupFromQCode("")).toBe(NotamGroup.other);
      expect(determineGroupFromQCode("INVALID")).toBe(NotamGroup.other);
      expect(determineGroupFromQCode("Q1234")).toBe(NotamGroup.other); // Too short
      expect(determineGroupFromQCode("QABCDE")).toBe(NotamGroup.other); // Too long
      expect(determineGroupFromQCode("12345")).toBe(NotamGroup.other); // Doesn't start with Q
    });
  });

  describe("assignGroup - airport NOTAMs with Q-code", () => {
    it("should use Q-code for airport NOTAMs", () => {
      const group = assignGroup("QMRLC", "A1234/24", "RWY 01/19 CLSD", "Full text");
      expect(group).toBe(NotamGroup.runways);
    });

    it("should use Q-code even when text suggests different group", () => {
      // Q-code should take precedence
      const group = assignGroup("QMRLC", "A1234/24", "TAXIWAY CLOSED", "TAXIWAY CLOSED");
      expect(group).toBe(NotamGroup.runways); // Q-code MR = runways, not taxiways
    });
  });

  describe("assignGroup - airport NOTAMs without Q-code (keyword fallback)", () => {
    it("should classify runways by keywords", () => {
      const group = assignGroup(null, "A1234/24", "RWY 01/19 CLOSED", "RWY 01/19 CLOSED");
      expect(group).toBe(NotamGroup.runways);

      const group2 = assignGroup(null, "A1234/24", "RUNWAY UNSERVICEABLE", "RUNWAY UNSERVICEABLE");
      expect(group2).toBe(NotamGroup.runways);
    });

    it("should classify taxiways by keywords", () => {
      const group = assignGroup(null, "A1234/24", "TAXIWAY CLOSED", "TAXIWAY CLOSED");
      expect(group).toBe(NotamGroup.taxiways);

      const group2 = assignGroup(null, "A1234/24", "APRON CLOSED", "APRON CLOSED");
      expect(group2).toBe(NotamGroup.taxiways);
    });

    it("should classify instrument procedures by keywords", () => {
      const group = assignGroup(null, "A1234/24", "ILS UNAVAILABLE", "ILS UNAVAILABLE");
      expect(group).toBe(NotamGroup.instrumentProcedures);

      const group2 = assignGroup(null, "A1234/24", "VOR OUT OF SERVICE", "VOR OUT OF SERVICE");
      expect(group2).toBe(NotamGroup.instrumentProcedures);
    });

    it("should classify airport services by keywords", () => {
      const group = assignGroup(null, "A1234/24", "AIRPORT CLOSED", "AIRPORT CLOSED");
      expect(group).toBe(NotamGroup.airportServices);

      const group2 = assignGroup(null, "A1234/24", "FUEL NOT AVAILABLE", "FUEL NOT AVAILABLE");
      expect(group2).toBe(NotamGroup.airportServices);
    });

    it("should classify lighting by keywords", () => {
      const group = assignGroup(null, "A1234/24", "RUNWAY LIGHTING UNAVAILABLE", "RUNWAY LIGHTING UNAVAILABLE");
      expect(group).toBe(NotamGroup.lighting);

      const group2 = assignGroup(null, "A1234/24", "PAPI UNSERVICEABLE", "PAPI UNSERVICEABLE");
      expect(group2).toBe(NotamGroup.lighting);
    });

    it("should classify hazards by keywords", () => {
      const group = assignGroup(null, "A1234/24", "CRANE ON AIRFIELD", "CRANE ON AIRFIELD");
      expect(group).toBe(NotamGroup.hazards);

      const group2 = assignGroup(null, "A1234/24", "BIRD HAZARD", "BIRD HAZARD");
      expect(group2).toBe(NotamGroup.hazards);
    });

    it("should classify admin by keywords", () => {
      const group = assignGroup(null, "A1234/24", "PPR REQUIRED", "PPR REQUIRED");
      expect(group).toBe(NotamGroup.admin);

      const group2 = assignGroup(null, "A1234/24", "CURFEW IN EFFECT", "CURFEW IN EFFECT");
      expect(group2).toBe(NotamGroup.admin);
    });

    it("should return other for unmapped content", () => {
      const group = assignGroup(null, "A1234/24", "UNRELATED MESSAGE", "UNRELATED MESSAGE");
      expect(group).toBe(NotamGroup.other);
    });
  });

  describe("isFIRNotam", () => {
    it("should identify FIR NOTAMs by letter prefix", () => {
      expect(isFIRNotam("E1234/25")).toBe(true);
      expect(isFIRNotam("L5678/25")).toBe(true);
      expect(isFIRNotam("F9012/25")).toBe(true);
      expect(isFIRNotam("H3456/25")).toBe(true);
      expect(isFIRNotam("G7890/25")).toBe(true);
      expect(isFIRNotam("W2345/25")).toBe(true);
    });

    it("should identify airport NOTAMs (no letter prefix)", () => {
      expect(isFIRNotam("A1234/24")).toBe(false);
      expect(isFIRNotam("1234/24")).toBe(false);
      expect(isFIRNotam("YBBN/24")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(isFIRNotam("")).toBe(false);
      expect(isFIRNotam("E")).toBe(true); // Single letter is valid
    });
  });

  describe("groupFIRNotam", () => {
    it("should group E-series with airspace keywords to firAirspaceRestrictions", () => {
      const group = groupFIRNotam("E1234/25", "MILITARY EXERCISE IN PROGRESS", "MILITARY EXERCISE IN PROGRESS");
      expect(group).toBe(NotamGroup.firAirspaceRestrictions);

      const group2 = groupFIRNotam("E5678/25", "RESTRICTED AREA ACTIVATED", "RESTRICTED AREA ACTIVATED");
      expect(group2).toBe(NotamGroup.firAirspaceRestrictions);
    });

    it("should group L-series with ATC keywords to firAtcNavigation", () => {
      const group = groupFIRNotam("L1234/25", "RADAR COVERAGE REDUCED", "RADAR COVERAGE REDUCED");
      expect(group).toBe(NotamGroup.firAtcNavigation);

      const group2 = groupFIRNotam("L5678/25", "ATC FREQUENCY CHANGED", "ATC FREQUENCY CHANGED");
      expect(group2).toBe(NotamGroup.firAtcNavigation);
    });

    it("should group F-series with obstacle keywords to firObstaclesCharts", () => {
      const group = groupFIRNotam("F1234/25", "NEW OBSTACLE MAST ERECTED", "NEW OBSTACLE MAST ERECTED");
      expect(group).toBe(NotamGroup.firObstaclesCharts);

      const group2 = groupFIRNotam("F5678/25", "CHART AMENDMENT", "CHART AMENDMENT");
      expect(group2).toBe(NotamGroup.firObstaclesCharts);
    });

    it("should group H-series with infrastructure keywords to firInfrastructure", () => {
      const group = groupFIRNotam("H1234/25", "AIRPORT FACILITY CLOSED", "AIRPORT FACILITY CLOSED");
      expect(group).toBe(NotamGroup.firInfrastructure);

      const group2 = groupFIRNotam("H5678/25", "RUNWAY EXTENDED", "RUNWAY EXTENDED");
      expect(group2).toBe(NotamGroup.firInfrastructure);
    });

    it("should group G/W-series to firAdministrative", () => {
      const group = groupFIRNotam("G1234/25", "GENERAL WARNING", "GENERAL WARNING");
      expect(group).toBe(NotamGroup.firAdministrative);

      const group2 = groupFIRNotam("W5678/25", "ADMINISTRATIVE NOTICE", "ADMINISTRATIVE NOTICE");
      expect(group2).toBe(NotamGroup.firAdministrative);
    });

    it("should use content keywords for FIR NOTAMs when prefix doesn't match", () => {
      const group = groupFIRNotam("X1234/25", "UA OPS IN PROGRESS", "UA OPS IN PROGRESS");
      expect(group).toBe(NotamGroup.firDroneOperations);

      const group2 = groupFIRNotam("Y5678/25", "DRONE OPERATIONS", "DRONE OPERATIONS");
      expect(group2).toBe(NotamGroup.firDroneOperations);
    });

    it("should default to other for unclassified FIR NOTAMs", () => {
      const group = groupFIRNotam("Z1234/25", "UNRELATED MESSAGE", "UNRELATED MESSAGE");
      expect(group).toBe(NotamGroup.other);
    });
  });

  describe("assignGroup - FIR NOTAMs", () => {
    it("should use FIR grouping for FIR NOTAMs", () => {
      const group = assignGroup(null, "E1234/25", "MILITARY EXERCISE", "MILITARY EXERCISE");
      expect(group).toBe(NotamGroup.firAirspaceRestrictions);

      const group2 = assignGroup("QOBLC", "E5678/25", "OBSTACLE", "OBSTACLE");
      // Even with Q-code, FIR NOTAMs use FIR grouping
      // E-series with obstacle content (no airspace keywords) falls through to content-based classification
      expect(group2).toBe(NotamGroup.firObstaclesCharts);
    });

    it("should prefer FIR grouping over Q-code for FIR NOTAMs", () => {
      // FIR NOTAM with Q-code - should use FIR grouping, not Q-code grouping
      const group = assignGroup("QMRLC", "E1234/25", "MILITARY EXERCISE", "MILITARY EXERCISE");
      expect(group).toBe(NotamGroup.firAirspaceRestrictions); // Not runways
    });
  });

  describe("keyword scoring - priority and weights", () => {
    it("should prefer higher-priority groups when scores tie", () => {
      // This tests the priority tie-breaker logic
      // In practice, runways (priority 1) should beat other groups with same score
      const group1 = assignGroup(null, "A1234/24", "RWY CLOSED", "RWY CLOSED");
      expect(group1).toBe(NotamGroup.runways); // Priority 1

      const group2 = assignGroup(null, "A1234/24", "TAXIWAY CLOSED", "TAXIWAY CLOSED");
      expect(group2).toBe(NotamGroup.taxiways); // Priority 2
    });

    it("should use weighted keywords correctly", () => {
      // "RUNWAY CLOSED" has high weight (10.0) for runways
      const group = assignGroup(null, "A1234/24", "RUNWAY CLOSED", "RUNWAY CLOSED");
      expect(group).toBe(NotamGroup.runways);

      // "AIRPORT CLOSED" has very high weight (10.0) for airportServices
      const group2 = assignGroup(null, "A1234/24", "AIRPORT CLOSED", "AIRPORT CLOSED");
      expect(group2).toBe(NotamGroup.airportServices);
    });
  });

  describe("integration with parsing service", () => {
    it("should assign correct groups to parsed NOTAMs", () => {
      const notamText = `A1234/24 NOTAMN
Q) YMMM/QMRLC/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) RWY 01/19 CLSD`;

      const result = parseNotam(notamText);

      expect(result.group).toBe(NotamGroup.runways);
      expect(result.qCode).toBe("QMRLC");
    });
  });
});

