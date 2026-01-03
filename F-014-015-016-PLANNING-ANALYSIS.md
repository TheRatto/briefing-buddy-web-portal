# NOTAM Parsing Improvements — Planning Analysis

**Features:** F-014, F-015, F-016  
**Planner:** Agent  
**Date:** 2025-01-02  
**Status:** Planning Complete

---

## Problem Statement

The current NOTAM parsing implementation incorrectly treats non-NOTAM content from ForeFlight PDFs as NOTAMs. Analysis of the provided ForeFlight PDF ("2. EVY72 - YSSY-YSCB.pdf") shows:

- **Actual NOTAMs start at page 16** (marked with heading "NOTAMs 1 of 9")
- **Pages 1-15 contain flight planning data:**
  - Flight plan summary (waypoints, route, fuel)
  - ICAO FPL format text
  - Instrument procedures
  - Altitude/fuel tables
  - Departure/arrival data

The current `parseNotams()` function in `notamParsingService.ts` splits extracted PDF text on blank lines and attempts to parse each block as a NOTAM without first validating whether the text is actually NOTAM content.

---

## Root Cause Analysis

1. **No section boundary detection**: The PDF extraction service (`pdfExtractionService.ts`) extracts all text from the PDF without identifying NOTAM sections.

2. **No block pre-validation**: The `parseNotams()` function does not validate whether a text block has NOTAM structural characteristics before attempting to parse it.

3. **Simple splitting logic**: The current splitting logic (`split(/\n\s*\n/)`) is too permissive and does not distinguish between NOTAM boundaries and general formatting.

---

## Solution Architecture

Three complementary features addressing different layers of the problem:

### Layer 1: Section Boundary Detection (F-015)
**Purpose:** Extract only NOTAM sections from multi-section PDFs  
**Scope:** PDF text processing before parsing  
**Impact:** Eliminates pages 1-15 of ForeFlight PDF from parsing pipeline

**Approach:**
- Detect section headings ("NOTAMs", "NOTAM X of Y", "NOTICES TO AIRMEN")
- Extract text between NOTAM section start and end (or EOF)
- Support multi-location briefings with multiple NOTAM sections
- Backwards compatible: if no section detected, pass entire text to parser

### Layer 2: Block Pre-Validation (F-014)
**Purpose:** Validate NOTAM structure before parsing  
**Scope:** Text block validation within NOTAM sections  
**Impact:** Filters out any remaining non-NOTAM text (tables, procedures, etc.)

**Approach:**
- Check for NOTAM structural markers: Q-code, Field A), Field E)
- Minimum requirements: Q-code OR (Field A AND Field E)
- Reject blocks lacking required structure
- Log rejection statistics for debugging (not exposed to user)

### Layer 3: Enhanced Splitting (F-016)
**Purpose:** Improve multi-NOTAM separation  
**Scope:** NOTAM block boundary detection  
**Impact:** Better handling of consecutive NOTAMs with minimal spacing

**Approach:**
- Detect NOTAM ID patterns (e.g., "A1234/24 NOTAMN")
- Support NOTAM type markers (NOTAMN, NOTAMC, NOTAMR)
- Preserve backwards compatibility with blank-line splitting
- Avoid false splits within Field E content

---

## Implementation Order

**Recommended order:**

1. **F-014 first** — Foundational validation logic, provides immediate value
   - Can be implemented independently
   - Provides debugging capability (rejected block logging)
   - Reduces noise in parsing output immediately

2. **F-015 second** — Section detection builds on F-014
   - Uses F-014's validation to confirm section boundaries
   - Provides major quality improvement for ForeFlight PDFs
   - May discover additional validation requirements

3. **F-016 last** — Refinement of splitting logic
   - Depends on F-014 for validation
   - Can leverage lessons learned from F-014/F-015
   - Lower priority (existing blank-line splitting works for many cases)

**Alternative:** F-015 and F-014 could be implemented in parallel by different developers if desired.

---

## Coordination with F-004

F-004 (NOTAM ingestion & raw extraction) is currently marked as "doing". Coordination points:

- F-015 should be integrated into the PDF extraction pipeline (possibly in `pdfExtractionService.ts` or as a separate post-processing step)
- F-014 should be integrated into `parseNotams()` function before `parseNotam()` is called
- F-016 modifies the splitting logic within `parseNotams()`

**Recommendation:** 
- If F-004 implementation is in early stages, integrate F-014/F-015/F-016 during F-004 implementation
- If F-004 is nearly complete, implement F-014/F-015/F-016 as enhancements after F-004 is done

---

## Testing Strategy

### Golden Fixture
Create test fixture from provided ForeFlight PDF:
- **Input:** Full PDF text extraction
- **Expected output:** Only NOTAMs from pages 16+ (count: 9 NOTAMs based on "NOTAMs 1 of 9" heading)
- **Rejected blocks:** Pages 1-15 content should be rejected by F-014 or excluded by F-015

### Negative Test Cases
Create fixtures from pages 1-15 content:
- ICAO FPL format text → should be rejected
- Waypoint summary table → should be rejected
- Instrument procedures → should be rejected
- Fuel/altitude tables → should be rejected

### Regression Tests
Ensure existing valid NOTAM parsing continues to work:
- Simple NOTAM text (no sections) → should parse correctly
- Multiple NOTAMs with blank-line separation → should parse correctly
- NOTAMs with Q-codes and all fields → should parse correctly

---

## Open Questions

1. **Other briefing formats:** Should we test with Garmin Pilot, Jeppesen, or other PDF formats?
   - Decision: Start with ForeFlight (most common), add others if requested

2. **Section heading variations:** What are all possible NOTAM section heading formats?
   - Decision: Implement common patterns first, add others based on real-world examples

3. **Strict vs permissive validation:** How strict should F-014's validation be?
   - Decision: Strict enough to reject obvious non-NOTAMs, permissive enough to handle format variations
   - Use real-world fixtures to tune threshold

4. **Performance impact:** Does section detection/validation significantly impact processing time?
   - Decision: Measure performance with large PDFs, optimize if needed (unlikely to be issue)

---

## Success Criteria

These features are successful if:

1. ForeFlight PDF example (provided) parses only 9 NOTAMs (from pages 16+), not flight plan data
2. Existing valid NOTAM parsing continues to work without regression
3. Parsing warnings decrease (fewer false positives being flagged as "malformed NOTAMs")
4. User experience improves (no non-NOTAM content shown in briefing view)

---

## Reference Materials

- **Provided PDF:** "2. EVY72 - YSSY-YSCB.pdf" (ForeFlight briefing example)
- **ICAO Annex 15:** NOTAM format specification
- **Existing services:**
  - `backend/src/services/pdfExtractionService.ts`
  - `backend/src/services/notamParsingService.ts`
- **Dart reference implementation:** `lib/models/notam.dart` (NOTAM structure)

---

## Next Steps

1. **Coder:** Implement F-014 (NOTAM block pre-validation)
   - Create `notamBlockValidationService.ts`
   - Integrate into `parseNotams()` function
   - Add unit tests for validation logic

2. **Tester:** Create golden fixture from ForeFlight PDF
   - Extract expected NOTAMs from pages 16+
   - Create negative test cases from pages 1-15
   - Validate F-014 correctly rejects non-NOTAM blocks

3. **Coder:** Implement F-015 (Section boundary detection)
   - Create `notamSectionDetectionService.ts`
   - Integrate into PDF extraction pipeline
   - Add unit tests for section detection

4. **Tester:** Validate F-015 with ForeFlight PDF
   - Confirm pages 1-15 excluded
   - Confirm pages 16+ included
   - Test with multi-location briefings

5. **Coder:** Implement F-016 (Enhanced splitting)
   - Modify `parseNotams()` splitting logic
   - Add NOTAM ID pattern detection
   - Add unit tests for splitting variations

6. **Tester:** Validate F-016 with dense NOTAM text
   - Test NOTAMs with minimal spacing
   - Test NOTAM ID boundary detection
   - Ensure no false splits within Field E

---

## Planner Sign-Off

Features F-014, F-015, and F-016 are well-defined, independently testable, and address the reported parsing issue comprehensively. They follow the framework's principles of small, focused features with clear acceptance criteria and explicit dependencies.

Ready for implementation.

