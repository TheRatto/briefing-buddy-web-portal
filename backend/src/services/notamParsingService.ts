/**
 * NOTAM Parsing Service
 * 
 * Parses ICAO NOTAM fields from raw text using strict-first strategy.
 * Based on BriefingBuddy NOTAM Logic Agent Digest and Dart reference implementation.
 * 
 * Feature F-014: Pre-validates NOTAM blocks before parsing to filter non-NOTAM content.
 */

import { assignGroup, NotamGroup } from "./notamCategorisationService";
import { validateNotamBlock, ValidationStats } from "./notamBlockValidationService";

export interface ParsedNotam {
  qCode: string | null;
  fieldA: string; // ICAO location code
  fieldB: string; // Start date/time (raw text)
  fieldC: string; // End date/time (raw text)
  fieldD: string; // Schedule (limited support)
  fieldE: string; // NOTAM body/description
  fieldF: string; // Lower limit
  fieldG: string; // Upper limit
  validFrom: Date | null; // Parsed from fieldB
  validTo: Date | null; // Parsed from fieldC
  isPermanent: boolean;
  rawText: string; // Original raw text (always preserved)
  warnings: string[]; // Parsing warnings
  group: NotamGroup; // Operational group category
  notamId: string; // NOTAM identifier (extracted from raw text or generated)
}

export interface ParseResult {
  notams: ParsedNotam[];
  warnings: string[]; // Global warnings
  validationStats?: ValidationStats; // Statistics about block validation (F-014)
}

/**
 * Extract Q code from NOTAM text using regex
 * Matches Dart implementation: extractQCode()
 */
export function extractQCode(text: string): string | null {
  // Q codes are 5 letters total: Q + 4 letters (e.g., QMRLC, QOLCC)
  const qCodeRegex = /\bQ[A-Z]{4}\b/i;
  const match = text.toUpperCase().match(qCodeRegex);
  return match ? match[0] : null;
}

/**
 * Parse ICAO date/time field (B or C)
 * ICAO format: YYMMDDHHMM (e.g., 2501151200 = 2025-01-15 12:00 UTC)
 * Also handles PERM/PERMANENT for field C
 */
function parseIcaoDateTime(fieldValue: string, isEndDate: boolean = false): { date: Date | null; isPermanent: boolean } {
  const trimmed = fieldValue.trim().toUpperCase();
  
  // Handle PERM/PERMANENT
  if (isEndDate && (trimmed === "PERM" || trimmed === "PERMANENT")) {
    return {
      date: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // now + 10 years
      isPermanent: true,
    };
  }
  
  // ICAO date format: YYMMDDHHMM (10 digits)
  // Example: 2501151200 = 2025-01-15 12:00 UTC
  const icaoDateRegex = /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/;
  const match = trimmed.match(icaoDateRegex);
  
  if (!match) {
    return { date: null, isPermanent: false };
  }
  
  try {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // JavaScript months are 0-indexed
    const day = parseInt(match[3], 10);
    const hour = parseInt(match[4], 10);
    const minute = parseInt(match[5], 10);
    
    // Handle year: assume 20XX for years 00-99, but adjust if year seems to be in past
    // For strict parsing, assume current century
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    let fullYear = currentCentury + year;
    
    // If the date is more than 50 years in the future, assume previous century
    // This handles edge cases near century boundaries
    const parsedDate = new Date(Date.UTC(fullYear, month, day, hour, minute));
    const now = new Date();
    const yearsDiff = parsedDate.getFullYear() - now.getFullYear();
    
    if (yearsDiff > 50) {
      fullYear = currentCentury - 100 + year;
    } else if (yearsDiff < -50) {
      fullYear = currentCentury + 100 + year;
    }
    
    const finalDate = new Date(Date.UTC(fullYear, month, day, hour, minute));
    
    // Validate the date is reasonable
    if (isNaN(finalDate.getTime())) {
      return { date: null, isPermanent: false };
    }
    
    return { date: finalDate, isPermanent: false };
  } catch (error) {
    return { date: null, isPermanent: false };
  }
}

/**
 * Extract NOTAM identifier from raw text
 * NOTAM IDs typically appear at the start or in format like "A1234/24" or "E3201/25"
 */
function extractNotamId(rawText: string): string {
  // Try to find NOTAM ID pattern at the start: letter(s) followed by numbers, slash, year
  const idMatch = rawText.match(/^([A-Z]+\d+\/\d+)/i);
  if (idMatch) {
    return idMatch[1];
  }
  
  // Try to find any NOTAM ID pattern in the text
  const anyIdMatch = rawText.match(/\b([A-Z]+\d+\/\d+)\b/i);
  if (anyIdMatch) {
    return anyIdMatch[1];
  }
  
  // Fallback: extract from Field A if present, or generate from Q-code
  const aMatch = rawText.match(/A\)(.*?)(?=\n[B-Z]\)|$)/s);
  if (aMatch && aMatch[1]) {
    return aMatch[1].trim().split(/\s+/)[0]; // Take first word from Field A
  }
  
  // Last resort: use a default identifier
  return "UNKNOWN";
}

/**
 * Extract ICAO fields from text using regex patterns
 * Matches Dart implementation: _extractIcaoFields()
 * Fields are marked with letter followed by ) (e.g., "E)", "F)", "G)")
 */
function extractIcaoFields(icaoText: string): {
  fieldA: string;
  fieldB: string;
  fieldC: string;
  fieldD: string;
  fieldE: string;
  fieldF: string;
  fieldG: string;
} {
  const fields = {
    fieldA: "",
    fieldB: "",
    fieldC: "",
    fieldD: "",
    fieldE: "",
    fieldF: "",
    fieldG: "",
  };
  
  // Pattern: field letter followed by ) then content until next field or end
  // Using dotAll flag to match across newlines
  // Field E: until F) or G) or end
  const eMatch = icaoText.match(/E\)(.*?)(?=\n[F-G]\)|$)/s);
  if (eMatch && eMatch[1]) {
    fields.fieldE = eMatch[1].trim();
  }
  
  // Field F: until G) or end
  const fMatch = icaoText.match(/F\)(.*?)(?=\n[G]\)|$)/s);
  if (fMatch && fMatch[1]) {
    fields.fieldF = fMatch[1].trim();
  }
  
  // Field G: until next letter field or end
  const gMatch = icaoText.match(/G\)(.*?)(?=\n[A-Z]\)|$)/s);
  if (gMatch && gMatch[1]) {
    fields.fieldG = gMatch[1].trim();
  }
  
  // Field A: ICAO location code
  const aMatch = icaoText.match(/A\)(.*?)(?=\n[B-Z]\)|$)/s);
  if (aMatch && aMatch[1]) {
    fields.fieldA = aMatch[1].trim();
  }
  
  // Field B: Start date/time
  const bMatch = icaoText.match(/B\)(.*?)(?=\n[C-Z]\)|$)/s);
  if (bMatch && bMatch[1]) {
    fields.fieldB = bMatch[1].trim();
  }
  
  // Field C: End date/time
  const cMatch = icaoText.match(/C\)(.*?)(?=\n[D-Z]\)|$)/s);
  if (cMatch && cMatch[1]) {
    fields.fieldC = cMatch[1].trim();
  }
  
  // Field D: Schedule (limited support - stored as raw text)
  const dMatch = icaoText.match(/D\)(.*?)(?=\n[E-Z]\)|$)/s);
  if (dMatch && dMatch[1]) {
    fields.fieldD = dMatch[1].trim();
  }
  
  return fields;
}

/**
 * Parse a single NOTAM from raw text
 * Uses strict-first parsing strategy: parse what we can, flag what we can't
 */
export function parseNotam(rawText: string): ParsedNotam {
  const warnings: string[] = [];
  
  // Always preserve raw text
  const raw = rawText.trim();
  
  // Extract Q code
  const qCode = extractQCode(raw);
  
  // Extract ICAO fields
  const fields = extractIcaoFields(raw);
  
  // Parse dates from fields B and C
  let validFrom: Date | null = null;
  let validTo: Date | null = null;
  let isPermanent = false;
  
  if (fields.fieldB) {
    const bResult = parseIcaoDateTime(fields.fieldB, false);
    if (bResult.date) {
      validFrom = bResult.date;
    } else {
      warnings.push(`Could not parse Field B (start date/time): "${fields.fieldB}"`);
    }
  } else {
    warnings.push("Field B (start date/time) missing");
  }
  
  if (fields.fieldC) {
    const cResult = parseIcaoDateTime(fields.fieldC, true);
    if (cResult.date) {
      validTo = cResult.date;
      isPermanent = cResult.isPermanent;
    } else if (!cResult.isPermanent) {
      warnings.push(`Could not parse Field C (end date/time): "${fields.fieldC}"`);
    }
  } else {
    warnings.push("Field C (end date/time) missing");
  }
  
  // Validate required fields
  if (!fields.fieldE) {
    warnings.push("Field E (NOTAM body) missing");
  }
  
  // Extract NOTAM ID
  const notamId = extractNotamId(raw);
  
  // Assign group based on Q-code or text analysis
  const group = assignGroup(qCode, notamId, fields.fieldE, raw);
  
  return {
    qCode,
    fieldA: fields.fieldA,
    fieldB: fields.fieldB,
    fieldC: fields.fieldC,
    fieldD: fields.fieldD,
    fieldE: fields.fieldE,
    fieldF: fields.fieldF,
    fieldG: fields.fieldG,
    validFrom,
    validTo,
    isPermanent,
    rawText: raw,
    warnings,
    group,
    notamId,
  };
}

/**
 * Clean page footers and markers from text lines
 * Removes: "NOTAMs X of Y", "-- X of Y --", standalone page numbers
 */
function cleanPageFooters(line: string): string | null {
  const trimmed = line.trim();
  
  // Remove page footers: "NOTAMs 7 of 9"
  if (/^NOTAMs?\s+\d+\s+of\s+\d+$/i.test(trimmed)) {
    return null;
  }
  
  // Remove footer markers: "-- 22 of 24 --"
  if (/^--\s*\d+\s+of\s+\d+\s*--$/i.test(trimmed)) {
    return null;
  }
  
  // Remove standalone page numbers at end of pages
  if (/^\d+$/.test(trimmed) && trimmed.length <= 3) {
    return null;
  }
  
  return line;
}

/**
 * Split text into NOTAM blocks based on NOTAM ID structure
 * NOTAMs start with: C4621/25 NOTAMN (or NOTAMR, NOTAMC)
 * This is more reliable than splitting on blank lines
 */
function splitIntoNotamBlocks(text: string): string[] {
  const lines = text.split('\n');
  const blocks: string[] = [];
  let currentBlock: string[] = [];
  let lastTypeHeading: string | null = null; // Track type heading for categorization
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cleaned = cleanPageFooters(line);
    
    // Skip page footers
    if (cleaned === null) {
      continue;
    }
    
    const trimmed = cleaned.trim();
    
    // Check if this line starts a new NOTAM: pattern like "C4621/25 NOTAMN"
    // NOTAM ID: [A-Z]+\d+/\d+ followed by space and NOTAM type
    const isNotamStart = /^[A-Z!]+\d+\/\d+\s+NOTAM[NRC]?\b/i.test(trimmed);
    
    if (isNotamStart && currentBlock.length > 0) {
      // Save previous block and start new one
      const blockText = currentBlock.join('\n').trim();
      blocks.push(blockText);
      currentBlock = [];
      
      // If there's a type heading before this NOTAM, include it
      if (lastTypeHeading) {
        currentBlock.push(`[TYPE: ${lastTypeHeading}]`); // Mark type for categorization
      }
      currentBlock.push(cleaned);
      lastTypeHeading = null;
    } else if (isNotamStart) {
      // First NOTAM
      if (lastTypeHeading) {
        currentBlock.push(`[TYPE: ${lastTypeHeading}]`);
      }
      currentBlock.push(cleaned);
      lastTypeHeading = null;
    } else {
      // Check if this is a type heading (all caps, < 100 chars, appears before NOTAM)
      const looksLikeTypeHeading = trimmed.length > 0 && 
                                   trimmed.length < 100 && 
                                   /^[A-Z\s]+$/.test(trimmed) &&
                                   currentBlock.length === 0;
      
      if (looksLikeTypeHeading) {
        lastTypeHeading = trimmed; // Store for next NOTAM
      } else {
        currentBlock.push(cleaned);
      }
    }
  }
  
  // Don't forget the last block
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n').trim());
  }
  
  return blocks;
}

/**
 * Parse multiple NOTAMs from raw text
 * NOTAMs are typically separated by blank lines or NOTAM identifiers
 * 
 * Feature F-014: Pre-validates blocks before parsing to filter non-NOTAM content
 * Feature F-016: Enhanced splitting based on NOTAM ID structure
 */
export function parseNotams(rawText: string): ParseResult {
  const globalWarnings: string[] = [];
  const notams: ParsedNotam[] = [];
  
  // Try smart splitting first (based on NOTAM ID structure)
  let blocks = splitIntoNotamBlocks(rawText);
  
  // Fallback to blank line splitting if smart splitting finds nothing
  if (blocks.length === 0 || (blocks.length === 1 && blocks[0].length === rawText.length)) {
    blocks = rawText
      .split(/\n\s*\n/) // Split on blank lines
      .map((block) => block.trim())
      .filter((block) => block.length > 0);
  }
  
  if (blocks.length === 0) {
    globalWarnings.push("No NOTAM content found in input");
    return { 
      notams: [], 
      warnings: globalWarnings,
      validationStats: {
        totalBlocks: 0,
        acceptedBlocks: 0,
        rejectedBlocks: 0,
        rejectionReasons: new Map(),
      },
    };
  }
  
  // F-014: Pre-validate blocks before parsing
  // This filters out non-NOTAM content (flight plans, waypoints, procedures, etc.)
  const validationStats: ValidationStats = {
    totalBlocks: blocks.length,
    acceptedBlocks: 0,
    rejectedBlocks: 0,
    rejectionReasons: new Map(),
  };
  
  for (const block of blocks) {
    // Validate block structure before parsing
    const validationResult = validateNotamBlock(block);
    
    if (!validationResult.isValid) {
      // Block rejected - log for debugging but don't expose to user
      validationStats.rejectedBlocks++;
      const reason = validationResult.reason || "Unknown";
      validationStats.rejectionReasons.set(
        reason,
        (validationStats.rejectionReasons.get(reason) || 0) + 1
      );
      
      // Don't generate parsing warnings for rejected blocks
      // They are intentionally filtered out
      continue;
    }
    
    // Block accepted - proceed with parsing
    validationStats.acceptedBlocks++;
    
    try {
      const notam = parseNotam(block);
      notams.push(notam);
      // Collect warnings from individual NOTAM parsing
      if (notam.warnings.length > 0) {
        globalWarnings.push(...notam.warnings.map((w) => `NOTAM parsing: ${w}`));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      globalWarnings.push(`Failed to parse NOTAM block: ${errorMessage}`);
    }
  }
  
  return {
    notams,
    warnings: globalWarnings,
    validationStats,
  };
}

