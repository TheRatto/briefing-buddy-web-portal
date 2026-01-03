/**
 * NOTAM Section Detection Service Tests
 * 
 * Tests for Feature F-015: NOTAM section boundary detection for PDF extraction
 */

import { describe, it, expect } from "vitest";
import {
  detectNotamSections,
  extractNotamSections,
  SectionBoundary,
} from "../services/notamSectionDetectionService";

describe("NOTAM Section Detection Service", () => {
  describe("detectNotamSections - ForeFlight format", () => {
    it("should detect ForeFlight NOTAM section with standalone 'NOTAMs' heading", () => {
      const text = `Flight Plan Summary
Some flight plan data here

NOTAMs

C4621/25 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) RWY 01/19 CLSD DUE TO MAINT

C4627/25 NOTAMN
Q) YMMM/QMRLC/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) PERM
E) TWY A CLSD

End of document`;

      const result = detectNotamSections(text);

      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.sections[0].sectionType).toBe("notams");
      expect(result.sections[0].heading).toContain("NOTAMs");
      
      // Extracted text should contain NOTAMs but not flight plan
      expect(result.extractedText).toContain("C4621/25");
      expect(result.extractedText).toContain("C4627/25");
      expect(result.extractedText).not.toContain("Flight Plan Summary");
      
      // Stats should be reasonable
      expect(result.stats.notamSections).toBe(1);
      expect(result.stats.extractedTextLength).toBeLessThan(result.stats.fullTextLength);
    });

    it("should ignore page footers (NOTAMs X of Y) - they are NOT section headings", () => {
      const text = `Flight Plan Summary
Some flight plan data here

NOTAMs

OBSTACLE ERECTED
C0820/25 NOTAMN
Q) YMMM/QRRCD/IV/BO/W/000/045/3336S15048E013
A) RIX
B) 2512152100 C) 2601112100
E) R470 DEACTIVATED (RA1)
F) SFC G) 4500FT AMSL

NOTAMs 1 of 9

TAXIWAY
C0744/25 NOTAMR C0645/25
Q) YMMM/QWULW/IV/BO/AW/000/004/3459S15035E005
A) YSNW
B) 2512112356 C) 2603050500 EST
E) UA OPS (MULTI-ROTOR BLW 25KG) WILL TAKE PLACE
F) SFC G) 400FT AGL

NOTAMs 2 of 9

End of document`;

      const result = detectNotamSections(text);

      // Should find ONE section starting at "NOTAMs" heading
      // Should NOT treat "NOTAMs 1 of 9" and "NOTAMs 2 of 9" as section boundaries (they're page footers)
      expect(result.sections.length).toBe(1);
      expect(result.extractedText).toContain("C0820/25");
      expect(result.extractedText).toContain("C0744/25");
      expect(result.extractedText).toContain("R470 DEACTIVATED");
      expect(result.extractedText).toContain("UA OPS");
      expect(result.extractedText).not.toContain("Flight Plan Summary");
      
      // The extracted text should be large (contains both NOTAMs)
      expect(result.extractedText.length).toBeGreaterThan(200);
      
      // Page footers should NOT appear in extracted text (filtered during parsing)
      // Note: They're filtered at the splitting stage, not section detection stage
    });

    it("should detect multiple NOTAM sections in multi-section documents", () => {
      const text = `Flight Plan Data
Some data

NOTAMs

A1234/24 NOTAMN
E) First NOTAM

FLIGHT PLAN

Some flight plan info

NOTAMs

B5678/24 NOTAMN
E) Second NOTAM

End`;

      const result = detectNotamSections(text);

      expect(result.sections.length).toBe(2);
      expect(result.sections[0].sectionType).toBe("notams");
      expect(result.sections[1].sectionType).toBe("notams");
      
      expect(result.extractedText).toContain("First NOTAM");
      expect(result.extractedText).toContain("Second NOTAM");
      expect(result.extractedText).not.toContain("Flight Plan Data");
      expect(result.extractedText).not.toContain("Some flight plan info");
    });
  });

  describe("detectNotamSections - various heading formats", () => {
    it("should detect 'NOTAM' standalone heading", () => {
      const text = `Some header

NOTAM

A1234/24 NOTAMN
E) NOTAM content here`;

      const result = detectNotamSections(text);

      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.extractedText).toContain("A1234/24");
      expect(result.extractedText).not.toContain("Some header");
    });

    it("should detect 'NOTAMs' standalone heading", () => {
      const text = `Header

NOTAMs

A1234/24 NOTAMN
E) NOTAM content`;

      const result = detectNotamSections(text);

      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.extractedText).toContain("A1234/24");
    });

    it("should detect 'NOTICES TO AIRMEN' heading", () => {
      const text = `Header

NOTICES TO AIRMEN

A1234/24 NOTAMN
E) NOTAM content`;

      const result = detectNotamSections(text);

      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.extractedText).toContain("A1234/24");
    });

    it("should detect 'NOTAM Information' heading (Garmin format)", () => {
      const text = `Header

NOTAM Information

A1234/24 NOTAMN
E) NOTAM content`;

      const result = detectNotamSections(text);

      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.extractedText).toContain("A1234/24");
    });

    it("should detect decorated NOTAM heading '--- NOTAMs ---'", () => {
      const text = `Header

--- NOTAMs ---

A1234/24 NOTAMN
E) NOTAM content`;

      const result = detectNotamSections(text);

      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.extractedText).toContain("A1234/24");
    });
  });

  describe("detectNotamSections - section end detection", () => {
    it("should stop at FLIGHT PLAN heading", () => {
      const text = `NOTAMs

A1234/24 NOTAMN
E) NOTAM content

FLIGHT PLAN

FPL-ABC123-IS
Some flight plan data`;

      const result = detectNotamSections(text);

      expect(result.extractedText).toContain("A1234/24");
      expect(result.extractedText).not.toContain("FPL-ABC123");
      expect(result.extractedText).not.toContain("FLIGHT PLAN");
    });

    it("should stop at WEATHER heading", () => {
      const text = `NOTAMs

A1234/24 NOTAMN
E) NOTAM content

WEATHER

METAR YBBN 151200Z...`;

      const result = detectNotamSections(text);

      expect(result.extractedText).toContain("A1234/24");
      expect(result.extractedText).not.toContain("METAR");
      expect(result.extractedText).not.toContain("WEATHER");
    });

    it("should stop at FUEL PLANNING heading", () => {
      const text = `NOTAMs

A1234/24 NOTAMN
E) NOTAM content

FUEL PLANNING

Reserve: 45 gallons`;

      const result = detectNotamSections(text);

      expect(result.extractedText).toContain("A1234/24");
      expect(result.extractedText).not.toContain("Reserve");
      expect(result.extractedText).not.toContain("FUEL PLANNING");
    });

    it("should continue to end if no section marker found", () => {
      const text = `NOTAMs

A1234/24 NOTAMN
E) NOTAM content

A5678/24 NOTAMN
E) Another NOTAM

End of document`;

      const result = detectNotamSections(text);

      expect(result.extractedText).toContain("A1234/24");
      expect(result.extractedText).toContain("A5678/24");
      expect(result.extractedText).toContain("End of document");
    });
  });

  describe("detectNotamSections - backwards compatibility", () => {
    it("should return entire text if no NOTAM section heading found", () => {
      const text = `A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) RWY 01/19 CLSD DUE TO MAINT

A5678/24 NOTAMN
Q) YMMM/QMRLC/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) PERM
E) TWY A CLSD`;

      const result = detectNotamSections(text);

      // No sections detected (no heading)
      expect(result.sections.length).toBe(0);
      
      // But entire text should be returned for backwards compatibility
      expect(result.extractedText).toBe(text);
      expect(result.extractedText).toContain("A1234/24");
      expect(result.extractedText).toContain("A5678/24");
      
      expect(result.stats.fullTextLength).toBe(result.stats.extractedTextLength);
    });

    it("should handle empty text gracefully", () => {
      const result = detectNotamSections("");

      expect(result.sections.length).toBe(0);
      expect(result.extractedText).toBe("");
      expect(result.stats.fullTextLength).toBe(0);
      expect(result.stats.extractedTextLength).toBe(0);
    });

    it("should handle text with only whitespace", () => {
      const result = detectNotamSections("   \n\n   ");

      expect(result.sections.length).toBe(0);
      expect(result.extractedText.trim()).toBe("");
    });
  });

  describe("extractNotamSections - convenience wrapper", () => {
    it("should extract NOTAM sections and return just the text", () => {
      const text = `Flight Plan

NOTAMs

A1234/24 NOTAMN
E) NOTAM content

FUEL

Reserve fuel data`;

      const extracted = extractNotamSections(text);

      expect(extracted).toContain("A1234/24");
      expect(extracted).not.toContain("Flight Plan");
      expect(extracted).not.toContain("Reserve fuel");
    });

    it("should return full text if no sections detected", () => {
      const text = `A1234/24 NOTAMN
E) NOTAM content`;

      const extracted = extractNotamSections(text);

      expect(extracted).toBe(text);
    });
  });

  describe("detectNotamSections - edge cases", () => {
    it("should handle case-insensitive heading detection", () => {
      const text = `notams

A1234/24 NOTAMN
E) NOTAM content`;

      const result = detectNotamSections(text);

      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.extractedText).toContain("A1234/24");
    });

    it("should handle headings with extra whitespace", () => {
      const text = `   NOTAMs    

A1234/24 NOTAMN
E) NOTAM content`;

      const result = detectNotamSections(text);

      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.extractedText).toContain("A1234/24");
    });

    it("should handle NOTAM heading followed immediately by content", () => {
      const text = `NOTAMs
A1234/24 NOTAMN
E) NOTAM content`;

      const result = detectNotamSections(text);

      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.extractedText).toContain("A1234/24");
    });

    it("should not be confused by 'NOTAM' word in regular text", () => {
      const text = `Flight Plan
This flight plan references NOTAM A1234/24

NOTAMs

A1234/24 NOTAMN
E) NOTAM content`;

      const result = detectNotamSections(text);

      // Should find the actual NOTAM section, not the reference
      expect(result.sections.length).toBe(1);
      expect(result.extractedText).toContain("A1234/24 NOTAMN");
      expect(result.extractedText).not.toContain("This flight plan");
    });
  });

  describe("detectNotamSections - real-world scenarios", () => {
    it("should handle ForeFlight-style multi-page briefing", () => {
      const text = `BRIEFING
Aircraft: N12345
Pilot: John Doe
Route: YBBN-YSSY

FLIGHT PLAN
FPL-ABC123-IS
-H25B/M-SDFGHIRWY/LB1
DEP/YBBN DEST/YSSY

FUEL PLANNING
Reserve: 45 min
Alternate: YSBK

NAVIGATION LOG
YBBN - WPT1 - WPT2 - YSSY

NOTAMs

!YBBN A1234/24 NOTAMN
Q) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) 2501151800
E) RWY 01/19 CLSD DUE TO MAINT

!YBBN A5678/24 NOTAMN
Q) YMMM/QMRLC/IV/NBO/A/000/999/2714S15302E005
A) YBBN
B) 2501151200
C) PERM
E) TWY A CLSD

WEATHER
METAR YBBN 151200Z...

End of briefing`;

      const result = detectNotamSections(text);

      // Should extract only NOTAM section
      expect(result.sections.length).toBe(1);
      expect(result.extractedText).toContain("A1234/24");
      expect(result.extractedText).toContain("A5678/24");
      
      // Should not include other sections
      expect(result.extractedText).not.toContain("FLIGHT PLAN");
      expect(result.extractedText).not.toContain("FPL-ABC123");
      expect(result.extractedText).not.toContain("FUEL PLANNING");
      expect(result.extractedText).not.toContain("NAVIGATION LOG");
      expect(result.extractedText).not.toContain("METAR");
      expect(result.extractedText).not.toContain("Aircraft: N12345");
      
      // Should be significantly shorter than original
      expect(result.stats.extractedTextLength).toBeLessThan(result.stats.fullTextLength * 0.5);
    });

    it("should handle document with NOTAM section at the end", () => {
      const text = `BRIEFING HEADER

FLIGHT PLAN
Some flight plan data

WEATHER
Some weather data

NOTAMs

A1234/24 NOTAMN
E) NOTAM content`;

      const result = detectNotamSections(text);

      expect(result.sections.length).toBe(1);
      expect(result.extractedText).toContain("A1234/24");
      expect(result.extractedText).not.toContain("FLIGHT PLAN");
      expect(result.extractedText).not.toContain("WEATHER");
    });
  });

  describe("detectNotamSections - statistics", () => {
    it("should provide accurate statistics", () => {
      const text = `Header

NOTAMs

A1234/24 NOTAMN
E) First NOTAM

FLIGHT PLAN

Some flight plan

NOTAMs

B5678/24 NOTAMN
E) Second NOTAM

Footer`;

      const result = detectNotamSections(text);

      expect(result.stats.totalSections).toBe(2);
      expect(result.stats.notamSections).toBe(2);
      expect(result.stats.fullTextLength).toBe(text.length);
      expect(result.stats.extractedTextLength).toBeGreaterThan(0);
      expect(result.stats.extractedTextLength).toBeLessThan(result.stats.fullTextLength);
    });

    it("should report zero sections when none found", () => {
      const text = `Just some plain text`;

      const result = detectNotamSections(text);

      expect(result.stats.totalSections).toBe(0);
      expect(result.stats.notamSections).toBe(0);
      expect(result.stats.fullTextLength).toBe(text.length);
      expect(result.stats.extractedTextLength).toBe(text.length); // Full text returned
    });
  });
});

