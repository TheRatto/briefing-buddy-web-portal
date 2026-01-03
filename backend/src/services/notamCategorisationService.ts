/**
 * NOTAM Categorisation Service
 * 
 * Assigns NOTAMs to operational groups based on Q-code mapping and keyword analysis.
 * Matches Dart implementation from lib/models/notam.dart and lib/services/notam_grouping_service.dart
 */

/**
 * NOTAM Group Enum
 * Single source of truth matching lib/models/notam.dart
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
 * Group metadata with keywords and weights for text-based classification
 * Based on lib/services/notam_grouping_service.dart
 */
interface GroupMetadata {
  group: NotamGroup;
  priority: number; // Lower number = higher priority
  keywords: string[];
  weights: Record<string, number>;
}

const GROUP_METADATA: GroupMetadata[] = [
  {
    group: NotamGroup.runways,
    priority: 1,
    keywords: [
      "RWY",
      "RWY CLOSED",
      "RUNWAY CLOSED",
      "RWY U/S",
      "RUNWAY U/S",
      "RUNWAY UNSERVICEABLE",
      "RWY UNSERVICEABLE",
      "DISPLACED",
      "MISSING",
      "BRAKING ACTION",
      "CONTAMINANTS",
      "TORA",
      "TODA",
      "ASDA",
      "LDA",
      "DECLARED DISTANCE",
      "THRESHOLD",
      "DISPLACED THRESHOLD",
      "RUNWAY LENGTH",
      "RUNWAY WIDTH",
      "RUNWAY LIGHTING",
      "RUNWAY LIGHTS",
      "HIRL",
      "HIGH INTENSITY RUNWAY LIGHTING",
      "REIL",
      "PAPI",
      "PRECISION APPROACH PATH INDICATOR",
      "VASI",
      "VASIS",
      "RUNWAY END IDENTIFIER LIGHTS",
      "THRESHOLD LIGHTS",
      "TOUCHDOWN ZONE LIGHTS",
      "ACR",
      "PCR",
      "AIRCRAFT CLASSIFICATION RATING",
      "PAVEMENT CLASSIFICATION RATING",
    ],
    weights: {
      RWY: 5.0,
      "RWY CLOSED": 10.0,
      "RUNWAY CLOSED": 10.0,
      "RWY U/S": 8.0,
      "RUNWAY U/S": 8.0,
      "RWY UNSERVICEABLE": 8.0,
      "RUNWAY UNSERVICEABLE": 8.0,
      HIRL: 4.0,
      PAPI: 4.0,
      VASI: 4.0,
      ACR: 3.0,
      PCR: 3.0,
      LIGHTING: 0.5,
      LIGHTS: 0.5,
    },
  },
  {
    group: NotamGroup.taxiways,
    priority: 2,
    keywords: [
      "TAXIWAY",
      "TWY",
      "TAXIWAY CLOSED",
      "TAXIWAY U/S",
      "TAXIWAY UNSERVICEABLE",
      "APRON",
      "PARKING",
      "AIRCRAFT STAND",
      "STAND",
      "GATE",
      "PARKING AREA",
      "APRON CLOSED",
      "PARKING CLOSED",
      "STAND CLOSED",
      "GATE CLOSED",
      "TAXIWAY LIGHTING",
      "TAXIWAY LIGHTS",
      "TAXIWAY CENTERLINE",
      "TAXIWAY EDGE",
      "MOVEMENT AREA",
      "MANOEUVRING AREA",
      "OPERATIONAL AREA",
      "ACR",
      "PCR",
      "AIRCRAFT CLASSIFICATION RATING",
      "PAVEMENT CLASSIFICATION RATING",
    ],
    weights: {
      TAXIWAY: 5.0,
      TWY: 5.0,
      "TAXIWAY CLOSED": 8.0,
      "TAXIWAY U/S": 6.0,
      "TAXIWAY UNSERVICEABLE": 6.0,
      APRON: 5.0,
      PARKING: 5.0,
      "AIRCRAFT STAND": 5.0,
      "APRON CLOSED": 8.0,
      "PARKING CLOSED": 8.0,
      "STAND CLOSED": 8.0,
      "GATE CLOSED": 8.0,
      ACR: 3.0,
      PCR: 3.0,
      LIGHTING: 0.5,
      LIGHTS: 0.5,
    },
  },
  {
    group: NotamGroup.instrumentProcedures,
    priority: 3,
    keywords: [
      "ILS",
      "INSTRUMENT LANDING SYSTEM",
      "LOCALIZER",
      "GLIDE PATH",
      "GLIDEPATH",
      "INNER MARKER",
      "MIDDLE MARKER",
      "OUTER MARKER",
      "MARKER",
      "VOR",
      "NDB",
      "NON-DIRECTIONAL BEACON",
      "DME",
      "DISTANCE MEASURING EQUIPMENT",
      "TACAN",
      "VORTAC",
      "OMEGA",
      "DECCA",
      "INSTRUMENT APPROACH",
      "MINIMA",
      "DA",
      "MDA",
      "DECISION ALTITUDE",
      "MINIMUM DESCENT ALTITUDE",
      "MINIMUMS",
      "MINIMUM",
      "CATEGORY",
      "CAT I",
      "CAT II",
      "CAT III",
      "MLS",
      "MICROWAVE LANDING SYSTEM",
      "NAVAID",
      "NAVIGATION AID",
      "RADIO NAVIGATION",
      "SID",
      "STANDARD INSTRUMENT DEPARTURE",
      "STAR",
      "STANDARD ARRIVAL",
      "DEPARTURE PROCEDURE",
      "ARRIVAL PROCEDURE",
      "INSTRUMENT PROCEDURE",
      "VISUAL PROCEDURE",
      "MISSED APPROACH",
      "HOLDING PROCEDURE",
      "HOLDING PATTERN",
      "TRANSITION",
      "TRANSITION PROCEDURE",
      "RNAV",
      "RNP",
      "PBN",
      "PRECISION",
      "NON-PRECISION",
      "CIRCLING",
      "VISUAL APPROACH",
      "CONTACT APPROACH",
      "RESTRICTED",
      "PROHIBITED",
      "DANGER AREA",
      "RESTRICTED AREA",
      "PROHIBITED AREA",
      "TEMPORARY",
      "TRA",
      "TEMPORARY RESERVED AIRSPACE",
      "MILITARY",
      "MIL",
      "MOA",
      "MILITARY OPERATING AREA",
      "EXERCISE",
      "TRAINING",
      "PRACTICE",
      "AEROBATICS",
      "AEROBATIC",
      "GPS",
      "GNSS",
      "GLOBAL POSITIONING SYSTEM",
      "SATELLITE",
      "SATELLITES",
      "POSITIONING",
      "AIRSPACE",
      "CONTROL AREA",
      "CONTROL ZONE",
      "FLIGHT INFORMATION REGION",
      "UPPER CONTROL AREA",
      "TERMINAL CONTROL AREA",
      "ATZ",
      "AERODROME TRAFFIC ZONE",
      "AIRSPACE RESERVATION",
      "AIRSPACE ACTIVATION",
      "AIRSPACE DEACTIVATION",
      "PAPI UNAVAILABLE",
      "RNAV NOT AVAILABLE",
    ],
    weights: {
      ILS: 5.0,
      VOR: 3.0,
      NDB: 3.0,
      DME: 3.0,
      LOCALIZER: 3.0,
      "GLIDE PATH": 3.0,
      SID: 3.0,
      STAR: 3.0,
      RNAV: 3.0,
      GPS: 3.0,
      RESTRICTED: 4.0,
      PROHIBITED: 4.0,
      MILITARY: 4.0,
      MOA: 4.0,
      AIRSPACE: 3.0,
      MINIMUMS: 2.0,
      MINIMUM: 2.0,
      "INSTRUMENT LANDING SYSTEM": 5.0,
      "INSTRUMENT APPROACH": 4.0,
      "NAVIGATION AID": 3.0,
      NAVAID: 3.0,
      UNSERVICEABLE: 0.1,
    },
  },
  {
    group: NotamGroup.airportServices,
    priority: 4,
    keywords: [
      "AIRPORT CLOSED",
      "AERODROME CLOSED",
      "NOT AVBL",
      "NOT AVAILABLE",
      "AVAILABLE",
      "AVBL",
      "OPERATIONAL",
      "OPR",
      "OPERATING",
      "OPERATION",
      "ATC",
      "AIR TRAFFIC CONTROL",
      "TWR",
      "TOWER",
      "GND",
      "GROUND",
      "APP",
      "ATIS",
      "AUTOMATIC TERMINAL INFORMATION SERVICE",
      "FIS",
      "FLIGHT INFORMATION SERVICE",
      "FUEL",
      "FUEL NOT AVAILABLE",
      "FUEL UNAVAILABLE",
      "AVGAS",
      "JET A1",
      "FIRE",
      "FIRE FIGHTING",
      "RESCUE",
      "FIRE CATEGORY",
      "FIRE SERVICE",
      "DRONE",
      "DRONES",
      "DRONE HAZARD",
      "BIRD HAZARD",
      "FACILITY",
      "FACILITIES",
      "LIGHTING",
      "LIGHTS",
      "AERODROME BEACON",
      "APPROACH LIGHTING",
      "APPROACH LIGHTS",
      "ALS",
      "APPROACH LIGHTING SYSTEM",
      "CENTERLINE",
      "CENTER LINE",
      "EDGE LIGHTS",
      "SEQUENCED FLASHING",
      "PILOT CONTROLLED",
      "HIGH INTENSITY",
      "MEDIUM INTENSITY",
      "LOW INTENSITY",
      "HELICOPTER",
      "HELIPORT",
      "HELIPORT LIGHTING",
      "HELICOPTER APPROACH",
      "PPR",
      "PRIOR PERMISSION REQUIRED",
      "CURFEW",
      "NOISE ABATEMENT",
    ],
    weights: {
      "AIRPORT CLOSED": 10.0,
      "AERODROME CLOSED": 10.0,
      FUEL: 5.0,
      FIRE: 4.0,
      ATC: 3.0,
      TWR: 3.0,
      TOWER: 3.0,
      GROUND: 3.0,
      ATIS: 1.0,
      "AERODROME BEACON": 3.0,
      "APPROACH LIGHTING": 3.0,
      "APPROACH LIGHTING SYSTEM": 3.0,
      CENTERLINE: 2.0,
      "CENTER LINE": 2.0,
      "EDGE LIGHTS": 2.0,
      "SEQUENCED FLASHING": 2.0,
      "PILOT CONTROLLED": 2.0,
      "HIGH INTENSITY": 2.0,
      "MEDIUM INTENSITY": 2.0,
      "LOW INTENSITY": 2.0,
      LIGHTING: 0.5,
      LIGHTS: 0.5,
      UNSERVICEABLE: 0.1,
    },
  },
  {
    group: NotamGroup.lighting,
    priority: 5,
    keywords: [
      "LIGHTING",
      "LIGHTS",
      "LIGHT",
      "LGT",
      "LGT U/S",
      "LIGHT U/S",
      "LIGHTING U/S",
      "RUNWAY LIGHTING",
      "RUNWAY LIGHTS",
      "HIRL",
      "HIGH INTENSITY RUNWAY LIGHTING",
      "REIL",
      "RUNWAY END IDENTIFIER LIGHTS",
      "THRESHOLD LIGHTS",
      "TOUCHDOWN ZONE LIGHTS",
      "PAPI",
      "PRECISION APPROACH PATH INDICATOR",
      "VASI",
      "VASIS",
      "APPROACH LIGHTING",
      "APPROACH LIGHTS",
      "ALS",
      "APPROACH LIGHTING SYSTEM",
      "TAXIWAY LIGHTING",
      "TAXIWAY LIGHTS",
      "CENTERLINE LIGHTS",
      "EDGE LIGHTS",
      "CENTER LINE LIGHTS",
      "CENTERLINE LIGHTING",
      "EDGE LIGHTING",
      "STOPWAY LIGHTS",
      "STOPWAY LIGHTING",
      "STOP LIGHTS",
      "AERODROME BEACON",
      "BEACON",
      "ROTATING BEACON",
      "PILOT CONTROLLED LIGHTING",
      "PCL",
      "PILOT CONTROLLED",
      "SEQUENCED FLASHING LIGHTS",
      "SFL",
      "SEQUENCED FLASHING",
      "LANDING DIRECTION INDICATOR",
      "LDI",
      "LANDING DIRECTION",
      "RUNWAY ALIGNMENT INDICATOR",
      "RAI",
      "RUNWAY ALIGNMENT",
      "HELICOPTER APPROACH PATH INDICATOR",
      "HAPI",
      "HELICOPTER APPROACH",
      "HELIPORT LIGHTING",
      "HELIPORT LIGHTS",
      "LOW INTENSITY",
      "MEDIUM INTENSITY",
      "HIGH INTENSITY",
      "CAT II",
      "CAT III",
      "CATEGORY II",
      "CATEGORY III",
      "LIGHT FAILURE",
      "LIGHT OUT",
      "LIGHTS OUT",
      "LIGHTING FAILURE",
      "TEMPORARY LIGHTING",
      "TEMP LIGHTING",
      "TEMP LIGHTS",
      "BLUE LIGHTS",
      "BLUE LIGHTING",
      "YELLOW LIGHTS",
      "YELLOW LIGHTING",
      "WHITE LIGHTS",
      "WHITE LIGHTING",
      "RED LIGHTS",
      "RED LIGHTING",
      "GREEN LIGHTS",
      "GREEN LIGHTING",
      "AMBER LIGHTS",
      "AMBER LIGHTING",
    ],
    weights: {
      "RUNWAY LIGHTING": 8.0,
      "RUNWAY LIGHTS": 8.0,
      HIRL: 7.0,
      "HIGH INTENSITY RUNWAY LIGHTING": 7.0,
      PAPI: 6.0,
      "PRECISION APPROACH PATH INDICATOR": 6.0,
      VASI: 6.0,
      VASIS: 6.0,
      REIL: 6.0,
      "RUNWAY END IDENTIFIER LIGHTS": 6.0,
      "APPROACH LIGHTING": 5.0,
      "APPROACH LIGHTS": 5.0,
      ALS: 5.0,
      "APPROACH LIGHTING SYSTEM": 5.0,
      "TAXIWAY LIGHTING": 4.0,
      "TAXIWAY LIGHTS": 4.0,
      "CENTERLINE LIGHTS": 4.0,
      "CENTER LINE LIGHTS": 4.0,
      "EDGE LIGHTS": 4.0,
      "AERODROME BEACON": 3.0,
      BEACON: 3.0,
      "ROTATING BEACON": 3.0,
      "PILOT CONTROLLED LIGHTING": 3.0,
      PCL: 3.0,
      "SEQUENCED FLASHING LIGHTS": 3.0,
      SFL: 3.0,
      "LANDING DIRECTION INDICATOR": 3.0,
      LDI: 3.0,
      "RUNWAY ALIGNMENT INDICATOR": 3.0,
      RAI: 3.0,
      "HELICOPTER APPROACH PATH INDICATOR": 3.0,
      HAPI: 3.0,
      "HELIPORT LIGHTING": 3.0,
      "HELIPORT LIGHTS": 3.0,
      "LIGHT FAILURE": 2.0,
      "LIGHT OUT": 2.0,
      "LIGHTS OUT": 2.0,
      "LIGHTING FAILURE": 2.0,
      "TEMPORARY LIGHTING": 2.0,
      "TEMP LIGHTING": 2.0,
      "TEMP LIGHTS": 2.0,
      "HIGH INTENSITY": 2.0,
      "MEDIUM INTENSITY": 2.0,
      "LOW INTENSITY": 2.0,
      LIGHTING: 0.5,
      LIGHTS: 0.5,
      LIGHT: 0.5,
      LGT: 0.5,
      UNSERVICEABLE: 0.1,
    },
  },
  {
    group: NotamGroup.hazards,
    priority: 6,
    keywords: [
      "OBSTACLE",
      "OBSTACLES",
      "CRANE",
      "CRANES",
      "CONSTRUCTION",
      "BUILDING",
      "TOWER",
      "TOWERS",
      "MAST",
      "MASTS",
      "ANTENNA",
      "ANTENNAE",
      "UNLIT",
      "UNLIGHTED",
      "LIGHT FAILURE",
      "OBSTACLE LIGHT",
      "OBSTACLE LIGHTS",
      "HAZARD",
      "HAZARDS",
      "DANGER",
      "DANGEROUS",
      "WILDLIFE",
      "BIRD STRIKE",
      "BIRD STRIKES",
      "ANIMAL",
      "ANIMALS",
      "WORK",
      "WORKING",
      "REPAIR",
      "REPAIRS",
      "BIRD HAZARD",
    ],
    weights: {
      CRANE: 5.0,
      CRANES: 5.0,
      OBSTACLE: 3.0,
      OBSTACLES: 3.0,
      HAZARD: 2.0,
      HAZARDS: 2.0,
      "BIRD STRIKE": 4.0,
      "BIRD HAZARD": 4.0,
      WILDLIFE: 3.0,
      CONSTRUCTION: 3.0,
      WORK: 2.0,
      WORKING: 2.0,
      REPAIR: 2.0,
      REPAIRS: 2.0,
      MAINTENANCE: 2.0,
      UNSERVICEABLE: 0.1,
    },
  },
  {
    group: NotamGroup.admin,
    priority: 7,
    keywords: [
      "CURFEW",
      "NOISE ABATEMENT",
      "NOISE RESTRICTION",
      "PPR",
      "PRIOR PERMISSION REQUIRED",
      "SLOT",
      "SLOTS",
      "SLOT RESTRICTION",
      "RESTRICTION",
      "RESTRICTIONS",
      "LIMITATION",
      "LIMITATIONS",
      "ADMINISTRATION",
      "ADMINISTRATIVE",
      "ADMINISTRATIVE PROCEDURE",
      "FREQUENCY",
      "FREQUENCIES",
      "ATIS",
      "INFORMATION SERVICE",
      "PROCEDURAL",
      "OIP",
      "AIP",
      "AERONAUTICAL INFORMATION PUBLICATION",
    ],
    weights: {
      CURFEW: 3.0,
      PPR: 3.0,
      "PRIOR PERMISSION REQUIRED": 3.0,
      SLOT: 3.0,
      "SLOT RESTRICTION": 3.0,
      "NOISE ABATEMENT": 2.0,
      "NOISE RESTRICTION": 2.0,
      ADMINISTRATION: 2.0,
      ADMINISTRATIVE: 2.0,
      "ADMINISTRATIVE PROCEDURE": 3.0,
      FREQUENCY: 5.0,
      FREQUENCIES: 5.0,
      ATIS: 5.0,
      OIP: 2.0,
      AIP: 2.0,
      "AERONAUTICAL INFORMATION PUBLICATION": 2.0,
      PROCEDURAL: 2.0,
      "INFORMATION SERVICE": 2.0,
      RESTRICTION: 0.1,
      RESTRICTIONS: 0.1,
      LIMITATION: 0.1,
      LIMITATIONS: 0.1,
    },
  },
  {
    group: NotamGroup.other,
    priority: 8,
    keywords: [],
    weights: {},
  },
];

/**
 * Determine NOTAM group based on Q-code
 * Matches Dart implementation: determineGroupFromQCode()
 */
export function determineGroupFromQCode(qCode: string | null): NotamGroup {
  if (!qCode || qCode.length !== 5 || !qCode.startsWith("Q")) {
    return NotamGroup.other;
  }

  const subject = qCode.substring(1, 3);

  // Runways (Group 1) - Critical runway operations
  if (["MR", "MS", "MT", "MU", "MW", "MD"].includes(subject)) {
    return NotamGroup.runways;
  }

  // Taxiways (Group 2) - Ground movement areas
  if (["MX", "MY", "MK", "MN", "MP"].includes(subject)) {
    return NotamGroup.taxiways;
  }

  // Instrument Procedures (Group 3) - Navigation and procedures
  if (
    [
      "IC",
      "ID",
      "IG",
      "II",
      "IL",
      "IM",
      "IN",
      "IO",
      "IS",
      "IT",
      "IU",
      "IW",
      "IX",
      "IY",
      "NA",
      "NB",
      "NC",
      "ND",
      "NF",
      "NL",
      "NM",
      "NN",
      "NO",
      "NT",
      "NV",
      "PA",
      "PB",
      "PC",
      "PD",
      "PE",
      "PH",
      "PI",
      "PK",
      "PU",
      "AA",
      "AC",
      "AD",
      "AE",
      "AF",
      "AH",
      "AL",
      "AN",
      "AO",
      "AP",
      "AR",
      "AT",
      "AU",
      "AV",
      "AX",
      "AZ",
      "RA",
      "RD",
      "RM",
      "RO",
      "RP",
      "RR",
      "RT",
      "GA",
      "GW",
    ].includes(subject)
  ) {
    return NotamGroup.instrumentProcedures;
  }

  // Airport Services (Group 4) - ATC, facilities, fuel, etc.
  if (["FA", "FF", "FU", "FM"].includes(subject)) {
    return NotamGroup.airportServices;
  }

  // Lighting Facilities (Group 5) - All lighting-related NOTAMs
  if (
    [
      "LA",
      "LB",
      "LC",
      "LD",
      "LE",
      "LF",
      "LG",
      "LH",
      "LI",
      "LJ",
      "LK",
      "LL",
      "LM",
      "LP",
      "LR",
      "LS",
      "LT",
      "LU",
      "LV",
      "LW",
      "LX",
      "LY",
      "LZ",
    ].includes(subject)
  ) {
    return NotamGroup.lighting;
  }

  // Hazards (Group 6) - Obstacles, safety issues, warnings
  if (
    [
      "OB",
      "OL",
      "WA",
      "WB",
      "WC",
      "WD",
      "WE",
      "WF",
      "WG",
      "WH",
      "WJ",
      "WL",
      "WM",
      "WP",
      "WR",
      "WS",
      "WT",
      "WU",
      "WV",
      "WW",
      "WY",
      "WZ",
    ].includes(subject)
  ) {
    return NotamGroup.hazards;
  }

  // Admin (Group 7) - Administrative procedures
  if (["PF", "PL", "PN", "PO", "PR", "PT", "PX", "PZ"].includes(subject)) {
    return NotamGroup.admin;
  }

  // Default to other for unmapped codes
  return NotamGroup.other;
}

/**
 * Calculate score for a group based on keyword matches
 * Matches Dart implementation: _calculateGroupScore()
 */
function calculateGroupScore(
  text: string,
  metadata: GroupMetadata
): number {
  let totalScore = 0.0;
  let remainingText = text.toUpperCase();

  // Special regex-based phrase matching for runways
  if (metadata.group === NotamGroup.runways) {
    const regexes = [
      /RUNWAY [0-9/ ]+UNSERVICEABLE/gi,
      /RUNWAY [0-9/ ]+U\/S/gi,
      /DECLARED DISTANCE(S)? .*RUNWAY/gi,
    ];
    for (const regex of regexes) {
      if (regex.test(remainingText)) {
        totalScore += 8.0;
        remainingText = remainingText.replace(regex, "");
      }
    }
  }

  // Sort keywords by length descending (phrase-first matching)
  const sortedKeywords = [...metadata.keywords].sort(
    (a, b) => b.length - a.length
  );

  for (const keyword of sortedKeywords) {
    // Use regex with word boundaries for whole word matching
    // Escape special regex characters in the keyword
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b${escapedKeyword}\\b`, "i");
    
    // Create a test copy to check for matches
    if (pattern.test(remainingText)) {
      // Get weight for this keyword (default to 1.0 if not specified)
      const weight = metadata.weights[keyword] ?? 1.0;
      totalScore += weight;
      // Remove matched keyword from text to avoid double-counting
      // Replace all occurrences (case-insensitive)
      const replacePattern = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      remainingText = remainingText.replace(replacePattern, "");
    }
  }

  return totalScore;
}

/**
 * Classify NOTAM by text analysis using scoring system
 * Matches Dart implementation: _classifyByTextScoring()
 */
function classifyByTextScoring(text: string): NotamGroup {
  const upperText = text.toUpperCase();
  let bestGroup: NotamGroup | null = null;
  let bestScore = 0.0;
  let bestPriority = 999; // Lower priority = higher importance

  for (const metadata of GROUP_METADATA) {
    const score = calculateGroupScore(upperText, metadata);
    if (score > bestScore || (score === bestScore && metadata.priority < bestPriority)) {
      bestScore = score;
      bestPriority = metadata.priority;
      bestGroup = metadata.group;
    }
  }

  // Only assign a group if score > 0, else Other
  if (bestScore > 0.0 && bestGroup !== null) {
    return bestGroup;
  }
  return NotamGroup.other;
}

/**
 * FIR NOTAM grouping based on ID prefix and keywords
 * Matches Dart implementation: groupFIRNotam() in fir_notam_grouping_service.dart
 */
export function groupFIRNotam(
  notamId: string,
  fieldE: string,
  rawText: string
): NotamGroup {
  const upperId = notamId.toUpperCase();
  const idPrefix = upperId.length > 0 ? upperId[0] : "";
  const content = (fieldE || rawText).toUpperCase();

  // Group by NOTAM ID prefix patterns (primary classification)
  switch (idPrefix) {
    case "E":
      // E-series: Airspace restrictions, military areas
      if (containsAirspaceKeywords(content)) {
        return NotamGroup.firAirspaceRestrictions;
      }
      break;

    case "L":
      // L-series: ATC services, radar, navigation
      if (containsATCKeywords(content)) {
        return NotamGroup.firAtcNavigation;
      }
      break;

    case "F":
      // F-series: Charts, obstacles, infrastructure
      if (containsObstacleKeywords(content)) {
        return NotamGroup.firObstaclesCharts;
      }
      break;

    case "H":
      // H-series: Airport infrastructure, facilities
      if (containsInfrastructureKeywords(content)) {
        return NotamGroup.firInfrastructure;
      }
      break;

    case "G":
    case "W":
      // G/W-series: General warnings, administrative
      return NotamGroup.firAdministrative;
  }

  // Secondary classification by content keywords (if prefix didn't match)
  if (containsDroneKeywords(content)) {
    return NotamGroup.firDroneOperations;
  }

  if (containsAirspaceKeywords(content)) {
    return NotamGroup.firAirspaceRestrictions;
  }

  if (containsATCKeywords(content)) {
    return NotamGroup.firAtcNavigation;
  }

  if (containsObstacleKeywords(content)) {
    return NotamGroup.firObstaclesCharts;
  }

  // Default to "Other" for unclassified FIR NOTAMs
  return NotamGroup.other;
}

/**
 * Check for airspace-related keywords
 */
function containsAirspaceKeywords(content: string): boolean {
  const airspaceKeywords = [
    "AIRSPACE",
    "RESTRICTED",
    "MILITARY FLYING",
    "MIL FLYING",
    "DANGER AREA",
    "PROHIBITED AREA",
    "SPECIAL USE AIRSPACE",
    "RESTRICTED AREA",
    "MILITARY EXERCISE",
    "MIL NON-FLYING",
    "TEMPO RESTRICTED AREA",
    "EMERGENCY EXERCIS",
  ];
  return airspaceKeywords.some((keyword) => content.includes(keyword));
}

/**
 * Check for ATC/Navigation-related keywords
 */
function containsATCKeywords(content: string): boolean {
  const atcKeywords = [
    "RADAR COVERAGE",
    "A/G FAC",
    "ATC",
    "NAVIGATION",
    "FREQUENCY",
    "MELBOURNE CENTRE",
    "APPROACH",
    "DEPARTURE",
    "CONTROL",
    "TOWER",
  ];
  return atcKeywords.some((keyword) => content.includes(keyword));
}

/**
 * Check for obstacle-related keywords
 */
function containsObstacleKeywords(content: string): boolean {
  const obstacleKeywords = [
    "MAST",
    "WIND TURBINE",
    "OBST",
    "OBSTACLE",
    "AIP CHARTS AMD",
    "CHART",
    "UNLIT",
    "LIT",
    "MET MAST",
    "COMMUNICATION TOWER",
    "BLDG",
    "GRID LOWEST SAFE ALTITUDE",
    "LSALT",
  ];
  return obstacleKeywords.some((keyword) => content.includes(keyword));
}

/**
 * Check for infrastructure-related keywords
 */
function containsInfrastructureKeywords(content: string): boolean {
  const infrastructureKeywords = [
    "AIRPORT",
    "AERODROME",
    "RUNWAY",
    "TAXIWAY",
    "INTEGRATED AIP",
    "IAIP",
    "FACILITY",
    "TERMINAL",
    "WESTERN SYDNEY INTERNATIONAL",
    "NANCY-BIRD WALTON",
  ];
  return infrastructureKeywords.some((keyword) => content.includes(keyword));
}

/**
 * Check for drone operation keywords
 */
function containsDroneKeywords(content: string): boolean {
  const droneKeywords = [
    "UA OPS",
    "MULTI-ROTOR",
    "FIXED-WING",
    "UNMANNED AIRCRAFT",
    "DRONE",
    "UAS",
    "RPAS",
  ];
  return droneKeywords.some((keyword) => content.includes(keyword));
}

/**
 * Determine if a NOTAM is a FIR NOTAM based on ID pattern
 * FIR NOTAMs typically have specific letter prefixes: E, L, F, H, G, W
 * Airport NOTAMs may have series letters like A, B, C but are identified differently
 */
export function isFIRNotam(notamId: string): boolean {
  const upperId = notamId.toUpperCase().trim();
  if (upperId.length === 0) return false;
  
  // FIR NOTAMs start with specific prefixes: E, L, F, H, G, W
  // Airport NOTAMs typically have numeric or location-based IDs
  const firstChar = upperId[0];
  return ["E", "L", "F", "H", "G", "W"].includes(firstChar);
}

/**
 * Assign a group to a NOTAM based on Q-code or text analysis
 * Matches Dart implementation: assignGroup()
 */
/**
 * Extract type heading from raw text if present
 * Type headings are marked with [TYPE: ...] by the splitting logic (F-015 enhancement)
 */
function extractTypeHeading(rawText: string): string | null {
  const match = rawText.match(/^\[TYPE:\s*([^\]]+)\]/);
  return match ? match[1].trim() : null;
}

/**
 * Map type heading to NOTAM group
 * These are the section headings that appear in ForeFlight PDFs
 * Provides better categorization than text scoring alone
 */
function groupFromTypeHeading(typeHeading: string): NotamGroup | null {
  const heading = typeHeading.toUpperCase();
  
  // Direct mappings from ForeFlight section headers
  // Map to the correct NotamGroup enum values
  if (heading.includes('RUNWAY') || heading.includes('RWY')) return NotamGroup.runways;
  if (heading.includes('TAXIWAY') || heading.includes('TWY')) return NotamGroup.taxiways;
  if (heading.includes('LIGHTING') || heading.includes('LIGHTS')) return NotamGroup.lighting;
  if (heading.includes('OBSTACLE')) return NotamGroup.hazards;
  if (heading.includes('AERIAL') || heading.includes('SURVEY')) return NotamGroup.hazards;
  if (heading.includes('UNMANNED') || heading.includes('DRONE') || heading.includes('UA ')) return NotamGroup.hazards;
  
  // Instrument procedures
  if (heading.includes('PROCEDURE')) return NotamGroup.instrumentProcedures;
  if (heading.includes('AIRSPACE')) return NotamGroup.instrumentProcedures;
  if (heading.includes('NAVIGATION') || heading.includes('NAV')) return NotamGroup.instrumentProcedures;
  
  // Airport services
  if (heading.includes('AERODROME')) return NotamGroup.airportServices;
  if (heading.includes('APRON')) return NotamGroup.airportServices;
  if (heading.includes('COMMUNICATION') || heading.includes('COM')) return NotamGroup.airportServices;
  
  return null; // No match
}

export function assignGroup(
  qCode: string | null,
  notamId: string,
  fieldE: string,
  rawText: string
): NotamGroup {
  // Check for type heading first (ForeFlight PDF enhancement - F-015)
  const typeHeading = extractTypeHeading(rawText);
  if (typeHeading) {
    const typeGroup = groupFromTypeHeading(typeHeading);
    if (typeGroup) {
      return typeGroup;
    }
  }
  
  // First, check if this is a FIR NOTAM
  if (isFIRNotam(notamId)) {
    return groupFIRNotam(notamId, fieldE, rawText);
  }

  // For airport NOTAMs, try Q-code classification first
  if (qCode) {
    return determineGroupFromQCode(qCode);
  }

  // Fallback to text-based classification using scoring
  return classifyByTextScoring(fieldE || rawText);
}

