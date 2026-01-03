/**
 * NOTAM Section Detection Service
 * 
 * Detects NOTAM section boundaries in extracted PDF text.
 * Filters out non-NOTAM sections (flight plans, fuel, waypoints, etc.).
 * 
 * Feature F-015: NOTAM section boundary detection for PDF extraction
 */

export interface SectionBoundary {
  startIndex: number;
  endIndex: number;
  sectionType: "notams" | "unknown";
  heading?: string; // The heading text that identified this section
}

export interface DetectionResult {
  sections: SectionBoundary[];
  extractedText: string; // Combined text from all NOTAM sections
  stats: {
    totalSections: number;
    notamSections: number;
    fullTextLength: number;
    extractedTextLength: number;
  };
}

/**
 * Common NOTAM section heading patterns
 * ForeFlight: "NOTAMs" (at top), NOT "NOTAMs X of Y" (footer/page counter)
 * Garmin Pilot: "NOTAM Information", "NOTAMs"
 * Generic: Any heading with "NOTAM" in it
 * 
 * Note: These patterns match against a single line, not the whole document
 * IMPORTANT: "NOTAMs X of Y" is typically a FOOTER/page counter, not a section heading!
 */
const NOTAM_HEADING_PATTERNS = [
  /^NOTAMs?$/i, // "NOTAM" or "NOTAMs" standalone (most common)
  /^NOTICES?\s+TO\s+(?:AIR)?MEN$/i, // "NOTICES TO AIRMEN" or "NOTICE TO AIRMEN"
  /^NOTAM\s+INFORMATION$/i, // "NOTAM Information" (Garmin)
  /-+\s*NOTAMs?\s*-+/i, // "--- NOTAMs ---"
  // Note: Explicitly NOT matching "NOTAMs X of Y" - that's a page counter!
];

/**
 * Section end markers (headings that indicate end of NOTAM section)
 * These help identify where NOTAM section ends
 * Note: These patterns match against a single line, not the whole document
 * IMPORTANT: Be conservative - only end on very clear non-NOTAM sections
 */
const SECTION_END_MARKERS = [
  /^FLIGHT\s+PLAN$/i,
  /^WEATHER$/i,
  /^METEOROLOGICAL\s+INFORMATION$/i,
  /^WINDS?\s+ALOFT$/i,
  /^FUEL\s+PLANNING$/i,
  /^FUEL$/i, // Added: standalone "FUEL" heading
  /^WEIGHT\s+AND\s+BALANCE$/i,
  /^NAVIGATION\s+LOG$/i,
  /^ROUTE\s+(?:OF\s+)?FLIGHT$/i,
];

/**
 * Detect if a line looks like a section heading
 * Headings are typically:
 * - Short (< 100 chars)
 * - On their own line
 * - May be in uppercase
 * - May have decorative characters (dashes, equals)
 * - Usually specific keywords (FLIGHT PLAN, WEATHER, NOTAM, etc.)
 * 
 * Excludes NOTAM ID lines, Q-code lines, and page counters from being considered headings
 */
function looksLikeHeading(line: string): boolean {
  const trimmed = line.trim();
  
  if (trimmed.length === 0 || trimmed.length > 100) {
    return false;
  }
  
  // Exclude NOTAM ID patterns (e.g., "A1234/24 NOTAMN", "!YBBN A1234/24")
  if (/[A-Z]+\d+\/\d+/.test(trimmed)) {
    return false;
  }
  
  // Exclude Q-code lines (e.g., "Q) YMMM/QFAAH/...")
  if (/Q\)\s*[A-Z]{4}\/Q[A-Z]{4}/.test(trimmed)) {
    return false;
  }
  
  // Exclude ICAO field markers (e.g., "A) YBBN", "E) RWY CLOSED")
  if (/^[A-G]\)\s/.test(trimmed)) {
    return false;
  }
  
  // Exclude page counters (e.g., "NOTAMs 1 of 9", "-- 16 of 24 --")
  if (/\d+\s+of\s+\d+/.test(trimmed)) {
    return false;
  }
  
  // Check if line is mostly uppercase letters (headings are often capitalized)
  // This catches section headings like "FLIGHT PLAN", "WEATHER", etc.
  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  const uppercaseCount = (trimmed.match(/[A-Z]/g) || []).length;
  
  // If mostly uppercase (>60%) and has reasonable length, it's probably a heading
  // Lowered threshold to 60% to catch mixed-case headings like "NOTAM Information"
  if (letterCount > 3 && uppercaseCount / letterCount > 0.6) {
    return true;
  }
  
  // Check for decorative characters (headings often have dashes/equals)
  if (/^[-=*]{3,}|[-=*]{3,}$/.test(trimmed)) {
    return true;
  }
  
  return false;
}

/**
 * Check if a line matches any NOTAM heading pattern
 */
function isNotamHeading(line: string): string | null {
  const trimmed = line.trim();
  for (const pattern of NOTAM_HEADING_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return match[0]; // Return the matched heading text
    }
  }
  return null;
}

/**
 * Check if a line matches any section end marker
 */
function isSectionEndMarker(line: string): boolean {
  const trimmed = line.trim();
  return SECTION_END_MARKERS.some((pattern) => pattern.test(trimmed));
}

/**
 * Find the start of a NOTAM section using heading detection
 * Returns the line index where the NOTAM section starts, or -1 if not found
 */
function findNotamSectionStart(lines: string[], startFrom: number = 0): {
  lineIndex: number;
  heading: string | null;
} {
  for (let i = startFrom; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for NOTAM-specific patterns FIRST (even if not typical heading format)
    // This ensures case-insensitive patterns like "notams" are caught
    const heading = isNotamHeading(line);
    if (heading) {
      return { lineIndex: i, heading };
    }
    
    // Fallback: check if it looks like a heading (for future extension)
    if (looksLikeHeading(line)) {
      const heading2 = isNotamHeading(line);
      if (heading2) {
        return { lineIndex: i, heading: heading2 };
      }
    }
  }
  
  return { lineIndex: -1, heading: null };
}

/**
 * Find the end of a NOTAM section
 * Section ends when:
 * 1. Another NOTAM section heading is encountered (for multi-section docs)
 * 2. A non-NOTAM section heading is encountered
 * 3. A known section end marker is found
 * 4. End of document
 */
function findNotamSectionEnd(lines: string[], startFrom: number): number {
  // Start searching from the line after the heading
  // Skip immediate decorative separators (e.g., "---" right after heading)
  let searchStart = startFrom + 1;
  
  // Skip decorative lines immediately following the heading
  while (searchStart < lines.length) {
    const line = lines[searchStart].trim();
    if (line.length > 0 && /^[-=*]{3,}$/.test(line)) {
      searchStart++; // Skip this decorative line
    } else {
      break;
    }
  }
  
  for (let i = searchStart; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this is a new NOTAM section heading
    if (looksLikeHeading(line) && isNotamHeading(line)) {
      // Another NOTAM section starts here
      return i;
    }
    
    // Check if this is a known end marker
    if (isSectionEndMarker(line)) {
      return i;
    }
  }
  
  // No end marker found, section goes to end of document
  return lines.length;
}

/**
 * Detect NOTAM section boundaries in extracted text
 * 
 * Algorithm:
 * 1. Split text into lines
 * 2. Look for NOTAM section headings
 * 3. Find section end boundaries
 * 4. Extract text from identified sections
 * 5. If no sections found, return entire text (backwards compatible)
 */
export function detectNotamSections(text: string): DetectionResult {
  const lines = text.split("\n");
  const sections: SectionBoundary[] = [];
  
  let currentSearchIndex = 0;
  
  // Search for all NOTAM sections in the document
  while (currentSearchIndex < lines.length) {
    const { lineIndex, heading } = findNotamSectionStart(lines, currentSearchIndex);
    
    if (lineIndex === -1) {
      // No more NOTAM sections found
      break;
    }
    
    // Find where this section ends
    const endLineIndex = findNotamSectionEnd(lines, lineIndex);
    
    // Calculate character indices for extraction
    // Start from the line AFTER the heading (skip the heading itself)
    const contentStartLine = lineIndex + 1;
    const startCharIndex = lines.slice(0, contentStartLine).join("\n").length + (contentStartLine > 0 ? 1 : 0);
    const endCharIndex = lines.slice(0, endLineIndex).join("\n").length + (endLineIndex > 0 ? 1 : 0);
    
    sections.push({
      startIndex: startCharIndex,
      endIndex: endCharIndex,
      sectionType: "notams",
      heading: heading || undefined,
    });
    
    // Continue searching after this section
    currentSearchIndex = endLineIndex;
  }
  
  // Extract text from all NOTAM sections
  let extractedText = "";
  
  if (sections.length > 0) {
    // Concatenate all NOTAM sections
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionText = text.substring(section.startIndex, section.endIndex);
      extractedText += sectionText.trim() + "\n\n";
    }
    extractedText = extractedText.trim();
  } else {
    // No NOTAM sections detected - return entire text (backwards compatible)
    extractedText = text;
  }
  
  return {
    sections,
    extractedText,
    stats: {
      totalSections: sections.length,
      notamSections: sections.filter((s) => s.sectionType === "notams").length,
      fullTextLength: text.length,
      extractedTextLength: extractedText.length,
    },
  };
}

/**
 * Extract only NOTAM sections from text (convenience wrapper)
 * This is the main function to use in the briefing pipeline
 */
export function extractNotamSections(text: string): string {
  const result = detectNotamSections(text);
  return result.extractedText;
}

