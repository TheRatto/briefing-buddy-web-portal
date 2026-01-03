/**
 * NOTAM Block Validation Service
 * 
 * Pre-validates text blocks to identify valid NOTAM structure before parsing.
 * Filters out non-NOTAM content like flight plans, waypoint tables, procedures.
 * 
 * Feature F-014: NOTAM block pre-validation and identification
 */

export interface ValidationResult {
  isValid: boolean;
  reason?: string; // Why the block was rejected (for debugging/logging)
  confidence: number; // 0-1 confidence score
}

export interface ValidationStats {
  totalBlocks: number;
  acceptedBlocks: number;
  rejectedBlocks: number;
  rejectionReasons: Map<string, number>;
}

/**
 * Check if text contains a Q-code (5 letters: Q + 4 letters)
 * Example: QMRLC, QOLCC, QFAAH
 */
function hasQCode(text: string): boolean {
  const qCodeRegex = /\bQ[A-Z]{4}\b/i;
  return qCodeRegex.test(text);
}

/**
 * Check if text contains ICAO field markers
 * Field markers are: A), B), C), D), E), F), G)
 * Returns object indicating which fields are present
 */
function detectFieldMarkers(text: string): {
  hasA: boolean;
  hasB: boolean;
  hasC: boolean;
  hasE: boolean;
  hasF: boolean;
  hasG: boolean;
  fieldCount: number;
} {
  // Field markers: letter followed by )
  // Can appear anywhere in text, but typically at start of line
  // Using word boundary to avoid matching field markers within words
  const fieldARegex = /\bA\)/;
  const fieldBRegex = /\bB\)/;
  const fieldCRegex = /\bC\)/;
  const fieldERegex = /\bE\)/;
  const fieldFRegex = /\bF\)/;
  const fieldGRegex = /\bG\)/;

  const hasA = fieldARegex.test(text);
  const hasB = fieldBRegex.test(text);
  const hasC = fieldCRegex.test(text);
  const hasE = fieldERegex.test(text);
  const hasF = fieldFRegex.test(text);
  const hasG = fieldGRegex.test(text);

  const fieldCount = [hasA, hasB, hasC, hasE, hasF, hasG].filter(Boolean).length;

  return { hasA, hasB, hasC, hasE, hasF, hasG, fieldCount };
}

/**
 * Check if text looks like a NOTAM ID pattern
 * Pattern: letter(s) + digits + "/" + year + optional NOTAM type
 * Examples: A1234/24, E3201/25 NOTAMN, B0042/24 NOTAMC
 */
function hasNotamIdPattern(text: string): boolean {
  // Look for NOTAM ID at start of text or on its own line
  const notamIdRegex = /(?:^|\n)\s*[A-Z]+\d+\/\d+(?:\s+NOTAM[NRC])?/im;
  return notamIdRegex.test(text);
}

/**
 * Check if text looks like flight plan format (ICAO FPL)
 * Flight plans have distinctive patterns:
 * - FPL-<callsign>-<type>
 * - Fields like DEP/, DEST/, EET/, OPR/
 * - Route strings with waypoints
 */
function looksLikeFlightPlan(text: string): boolean {
  const flightPlanIndicators = [
    /FPL-[A-Z0-9]+-[A-Z]/i, // ICAO FPL format
    /\bDEP\/[A-Z]{4}\b/i, // Departure field
    /\bDEST\/[A-Z]{4}\b/i, // Destination field
    /\bEET\/[A-Z]{4}\b/i, // Estimated elapsed time
    /\bOPR\/[A-Z]/i, // Operator field
    /\bRMK\/[A-Z]/i, // Remarks field
    /\bREG\/[A-Z0-9-]+/i, // Registration
  ];

  return flightPlanIndicators.some((pattern) => pattern.test(text));
}

/**
 * Check if text looks like waypoint/navigation data
 * Characteristics:
 * - Multiple coordinate pairs (lat/lon)
 * - Waypoint names (5-letter codes)
 * - Distance/bearing data
 * - Track/altitude tables
 */
function looksLikeWaypointData(text: string): boolean {
  const lines = text.split("\n");
  
  // Count lines that look like waypoint/coordinate data
  let dataLines = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (trimmed.length === 0) continue;
    
    // Waypoint tables often have:
    // - Multiple numbers (distances, coordinates)
    // - Track/heading values (3 digits)
    // - Time/fuel values
    const numberCount = (trimmed.match(/\b\d+\b/g) || []).length;
    const hasMultipleNumbers = numberCount >= 3;
    
    // Coordinate patterns (lat/lon in various formats)
    const hasCoordinates = /\d{2,4}[NS]\s*\d{2,5}[EW]/i.test(trimmed);
    
    // Track/heading patterns (3 digits followed by degree symbol or alone)
    const hasTrack = /\b\d{3}°?\b/.test(trimmed);
    
    if (hasMultipleNumbers || hasCoordinates || hasTrack) {
      dataLines++;
    }
  }
  
  // If more than 50% of non-empty lines look like data, probably waypoint table
  const nonEmptyLines = lines.filter((l) => l.trim().length > 0).length;
  return nonEmptyLines > 0 && dataLines / nonEmptyLines > 0.5;
}

/**
 * Check if text looks like instrument procedure
 * Characteristics:
 * - Procedure names (SID, STAR, IAP, APCH)
 * - Altitude/speed restrictions
 * - Fix/waypoint sequences
 * - "Transition" keyword
 * 
 * NOTE: Must not trigger on normal NOTAM text that happens to contain these words
 */
function looksLikeProcedure(text: string): boolean {
  const procedureIndicators = [
    /\b(?:SID|STAR|IAP)\b/i,  // Standard instrument departure/arrival/approach
    /\bTransition\b/i,
    /\bInitial\s+(?:Approach|Fix)\b/i,
    /\bFinal\s+Approach\s+(?:Fix|Course)\b/i,
    /\bMissed\s+Approach\s+(?:Point|Procedure)\b/i,
  ];

  // Count how many procedure indicators are present
  let indicatorCount = 0;
  for (const pattern of procedureIndicators) {
    if (pattern.test(text)) {
      indicatorCount++;
    }
  }

  // Require at least 2 procedure indicators to be confident it's a procedure
  // This avoids false positives on NOTAMs that mention approach/departure
  return indicatorCount >= 2;
}

/**
 * Check if text looks like fuel/performance table
 * Characteristics:
 * - "FUEL" keyword
 * - Multiple numeric columns
 * - Time/distance/fuel values
 */
function looksLikeFuelTable(text: string): boolean {
  const fuelIndicators = [
    /\bFUEL\b/i,
    /\bGALLONS?\b/i,
    /\bLITRE?S?\b/i,
    /\bENDURANCE\b/i,
  ];

  const hasFuelKeyword = fuelIndicators.some((pattern) => pattern.test(text));
  
  // Check for table structure (multiple numbers in consistent columns)
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const linesWithMultipleNumbers = lines.filter((line) => {
    const numbers = line.match(/\b\d+\b/g);
    return numbers && numbers.length >= 3;
  });

  const looksLikeTable = linesWithMultipleNumbers.length >= 3;

  return hasFuelKeyword && looksLikeTable;
}

/**
 * Validate if a text block has NOTAM structural characteristics
 * 
 * Acceptance criteria (from F-014):
 * - Q-code OR (Field A AND Field E) required
 * - Reject flight plans, waypoint data, procedures, fuel tables
 * 
 * Returns validation result with confidence score
 */
export function validateNotamBlock(text: string): ValidationResult {
  const trimmed = text.trim();
  
  // Empty or very short text is not a NOTAM
  if (trimmed.length < 20) {
    return {
      isValid: false,
      reason: "Text too short (< 20 chars)",
      confidence: 1.0,
    };
  }
  
  // Check for obvious non-NOTAM content first (fast rejection)
  if (looksLikeFlightPlan(trimmed)) {
    return {
      isValid: false,
      reason: "Flight plan format detected",
      confidence: 0.9,
    };
  }
  
  if (looksLikeFuelTable(trimmed)) {
    return {
      isValid: false,
      reason: "Fuel/performance table detected",
      confidence: 0.9,
    };
  }
  
  if (looksLikeWaypointData(trimmed)) {
    return {
      isValid: false,
      reason: "Waypoint/navigation data detected",
      confidence: 0.85,
    };
  }
  
  if (looksLikeProcedure(trimmed)) {
    return {
      isValid: false,
      reason: "Instrument procedure detected",
      confidence: 0.85,
    };
  }
  
  // Now check for NOTAM structural markers
  const qCode = hasQCode(trimmed);
  const fields = detectFieldMarkers(trimmed);
  const notamId = hasNotamIdPattern(trimmed);
  
  // Primary acceptance criteria: Q-code OR (Field A AND Field E)
  const hasRequiredStructure = qCode || (fields.hasA && fields.hasE);
  
  if (!hasRequiredStructure) {
    return {
      isValid: false,
      reason: `Missing required structure (Q-code: ${qCode}, Field A: ${fields.hasA}, Field E: ${fields.hasE})`,
      confidence: 0.95,
    };
  }
  
  // Calculate confidence score based on NOTAM indicators
  let confidence = 0.5; // Base confidence if minimum structure present
  
  if (qCode) confidence += 0.2;
  if (notamId) confidence += 0.15;
  if (fields.hasA) confidence += 0.05;
  if (fields.hasB) confidence += 0.05;
  if (fields.hasC) confidence += 0.05;
  if (fields.hasE) confidence += 0.1;
  if (fields.fieldCount >= 3) confidence += 0.1;
  
  confidence = Math.min(confidence, 1.0);
  
  // Accept if we have required structure and no strong anti-indicators
  return {
    isValid: true,
    confidence,
  };
}

/**
 * Validate multiple blocks and return statistics
 * Useful for debugging and monitoring
 */
export function validateBlocks(blocks: string[]): {
  validBlocks: string[];
  invalidBlocks: Array<{ block: string; reason: string }>;
  stats: ValidationStats;
} {
  const validBlocks: string[] = [];
  const invalidBlocks: Array<{ block: string; reason: string }> = [];
  const rejectionReasons = new Map<string, number>();
  
  for (const block of blocks) {
    const result = validateNotamBlock(block);
    
    if (result.isValid) {
      validBlocks.push(block);
    } else {
      invalidBlocks.push({
        block,
        reason: result.reason || "Unknown",
      });
      
      const reason = result.reason || "Unknown";
      rejectionReasons.set(reason, (rejectionReasons.get(reason) || 0) + 1);
    }
  }
  
  const stats: ValidationStats = {
    totalBlocks: blocks.length,
    acceptedBlocks: validBlocks.length,
    rejectedBlocks: invalidBlocks.length,
    rejectionReasons,
  };
  
  return { validBlocks, invalidBlocks, stats };
}

