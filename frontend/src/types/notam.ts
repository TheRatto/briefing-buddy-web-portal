/**
 * NOTAM Types
 * 
 * Types matching backend services/notamParsingService.ts and services/notamCategorisationService.ts
 */

/**
 * NOTAM Group Enum
 * Single source of truth matching backend NotamGroup enum
 */
export enum NotamGroup {
  // Airport-specific groups (Groups 1-8)
  runways = "runways", // Group 1: Runways (Critical)
  taxiways = "taxiways", // Group 2: Taxiways
  instrumentProcedures = "instrumentProcedures", // Group 3: Navaids, SIDs, STARs, approaches, airspace
  airportServices = "airportServices", // Group 4: ATC, fire, parking, PPR, curfew, fuel
  lighting = "lighting", // Group 5: All lighting facilities
  hazards = "hazards", // Group 6: Obstacles, birds, warnings
  admin = "admin", // Group 7: OIP/AIP updates, administrative
  other = "other", // Group 8: Unmapped items

  // FIR-specific groups (Groups 9-14)
  firAirspaceRestrictions = "firAirspaceRestrictions", // Group 9: E-series - Military airspace, restricted areas
  firAtcNavigation = "firAtcNavigation", // Group 10: L-series - Radar coverage, ATC services, navigation aids
  firObstaclesCharts = "firObstaclesCharts", // Group 11: F-series - New obstacles, chart amendments, LSALT updates
  firInfrastructure = "firInfrastructure", // Group 12: H-series - Airport infrastructure, facility changes
  firDroneOperations = "firDroneOperations", // Group 13: UA OPS - Unmanned aircraft operations
  firAdministrative = "firAdministrative", // Group 14: G/W-series - General warnings, administrative notices
}

/**
 * Parsed NOTAM interface
 * Matches backend ParsedNotam interface (as received from JSON)
 */
export interface ParsedNotam {
  qCode: string | null;
  fieldA: string; // ICAO location code
  fieldB: string; // Start date/time (raw text)
  fieldC: string; // End date/time (raw text)
  fieldD: string; // Schedule (limited support)
  fieldE: string; // NOTAM body/description
  fieldF: string; // Lower limit
  fieldG: string; // Upper limit
  validFrom: string; // ISO 8601 date string (parsed from fieldB)
  validTo: string; // ISO 8601 date string (parsed from fieldC)
  isPermanent: boolean;
  rawText: string; // Original raw text (always preserved)
  warnings: string[]; // Parsing warnings
  group: NotamGroup; // Operational group category
  notamId: string; // NOTAM identifier (extracted from raw text or generated)
}

/**
 * Grouped NOTAM structure
 * Location -> Category -> NOTAMs
 */
export interface GroupedNotams {
  [location: string]: {
    [category in NotamGroup]?: ParsedNotam[];
  };
}

