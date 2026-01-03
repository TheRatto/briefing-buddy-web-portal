/**
 * Tests for GroupedNotamsDisplay component
 * 
 * Tests XSS prevention and correct rendering of grouped NOTAMs
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import GroupedNotamsDisplay from "../components/GroupedNotamsDisplay";
import { ParsedNotam, NotamGroup } from "../types/notam";

describe("GroupedNotamsDisplay", () => {
  // Use relative dates based on current time to ensure tests work regardless of execution time
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const createMockNotam = (
    notamId: string,
    fieldA: string,
    group: NotamGroup,
    rawText: string,
    validFrom?: Date,
    validTo?: Date
  ): ParsedNotam => ({
    notamId,
    fieldA,
    group,
    rawText,
    qCode: null,
    fieldB: "2501151200",
    fieldC: "2501161200",
    fieldD: "",
    fieldE: "",
    fieldF: "",
    fieldG: "",
    validFrom: (validFrom || oneHourAgo).toISOString(),
    validTo: (validTo || twentyFourHoursFromNow).toISOString(),
    isPermanent: false,
    warnings: [],
  });

  it("should render empty message when no NOTAMs", () => {
    render(<GroupedNotamsDisplay notams={[]} />);
    expect(screen.getByText("No NOTAMs to display")).toBeInTheDocument();
  });

  it("should group NOTAMs by location and category", () => {
    const notams: ParsedNotam[] = [
      createMockNotam("A001", "KJFK", NotamGroup.runways, "Runway closure"),
      createMockNotam("A002", "KJFK", NotamGroup.runways, "Runway lighting"),
      createMockNotam("A003", "KLAX", NotamGroup.runways, "Runway closure"),
    ];

    render(<GroupedNotamsDisplay notams={notams} />);

    // Check location headers
    expect(screen.getByText("KJFK")).toBeInTheDocument();
    expect(screen.getByText("KLAX")).toBeInTheDocument();

    // Check category labels
    expect(screen.getAllByText(/Runways/).length).toBeGreaterThan(0);

    // Check NOTAM IDs
    expect(screen.getByText("A001")).toBeInTheDocument();
    expect(screen.getByText("A002")).toBeInTheDocument();
    expect(screen.getByText("A003")).toBeInTheDocument();
  });

  it("should display raw NOTAM text", () => {
    const rawText = "A001/24 NOTAM TEXT HERE";
    const notams: ParsedNotam[] = [
      createMockNotam("A001", "KJFK", NotamGroup.runways, rawText),
    ];

    render(<GroupedNotamsDisplay notams={notams} />);
    expect(screen.getByText(rawText)).toBeInTheDocument();
  });

  it("should prevent XSS attacks by escaping HTML in raw text", () => {
    // Attempt XSS attack via raw text
    const maliciousText = '<script>alert("XSS")</script>';
    const notams: ParsedNotam[] = [
      createMockNotam("A001", "KJFK", NotamGroup.runways, maliciousText),
    ];

    const { container } = render(<GroupedNotamsDisplay notams={notams} />);
    
    // The text should be present but escaped (React escapes by default)
    expect(screen.getByText(maliciousText)).toBeInTheDocument();
    
    // Verify no script tags are rendered as actual script elements
    const scripts = container.querySelectorAll("script");
    expect(scripts.length).toBe(0);
    
    // The text should be rendered as plain text, not as HTML
    const textContent = container.textContent || "";
    expect(textContent).toContain(maliciousText);
  });

  it("should display multiple locations correctly", () => {
    const notams: ParsedNotam[] = [
      createMockNotam("A001", "KJFK", NotamGroup.runways, "NOTAM 1"),
      createMockNotam("A002", "KLAX", NotamGroup.taxiways, "NOTAM 2"),
      createMockNotam("A003", "KORD", NotamGroup.lighting, "NOTAM 3"),
    ];

    render(<GroupedNotamsDisplay notams={notams} />);

    expect(screen.getByText("KJFK")).toBeInTheDocument();
    expect(screen.getByText("KLAX")).toBeInTheDocument();
    expect(screen.getByText("KORD")).toBeInTheDocument();
  });

  it("should display category counts", () => {
    const notams: ParsedNotam[] = [
      createMockNotam("A001", "KJFK", NotamGroup.runways, "NOTAM 1"),
      createMockNotam("A002", "KJFK", NotamGroup.runways, "NOTAM 2"),
      createMockNotam("A003", "KJFK", NotamGroup.runways, "NOTAM 3"),
    ];

    render(<GroupedNotamsDisplay notams={notams} />);
    
    // Should show count of 3 for runways
    // Text is split across elements: <h3>Runways</h3><span>(3)</span>
    expect(screen.getByText("Runways")).toBeInTheDocument();
    expect(screen.getByText("(3)")).toBeInTheDocument();
  });

  it("should display Q-code when present", () => {
    const notam = createMockNotam("A001", "KJFK", NotamGroup.runways, "NOTAM 1");
    notam.qCode = "QMRLC";
    const notams: ParsedNotam[] = [notam];

    render(<GroupedNotamsDisplay notams={notams} />);
    expect(screen.getByText("QMRLC")).toBeInTheDocument();
  });

  it("should display warnings when present", () => {
    const notam = createMockNotam("A001", "KJFK", NotamGroup.runways, "NOTAM 1");
    notam.warnings = ["Warning 1", "Warning 2"];
    const notams: ParsedNotam[] = [notam];

    render(<GroupedNotamsDisplay notams={notams} />);
    expect(screen.getByText(/Warnings:/)).toBeInTheDocument();
    expect(screen.getByText(/Warning 1.*Warning 2/)).toBeInTheDocument();
  });

  describe("Filter combinations", () => {
    beforeEach(() => {
      // Use selective fake timers - only mock Date, leave setTimeout/setInterval real for waitFor()
      vi.useFakeTimers({ toFake: ['Date'] });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const createTimeBasedNotam = (
      notamId: string,
      hoursFromNow: number, // Hours relative to now (negative = past, positive = future)
      durationHours: number, // Duration in hours
      fieldA: string = "KJFK",
      group: NotamGroup = NotamGroup.runways
    ): ParsedNotam => {
      const now = new Date();
      const validFrom = new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000);
      const validTo = new Date(validFrom.getTime() + durationHours * 60 * 60 * 1000);
      return {
        notamId,
        fieldA,
        group,
        rawText: `NOTAM ${notamId}`,
        qCode: null,
        fieldB: "2501151200",
        fieldC: "2501161200",
        fieldD: "",
        fieldE: "",
        fieldF: "",
        fieldG: "",
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        isPermanent: false,
        warnings: [],
      };
    };

    it("should filter NOTAMs by 6h time window", async () => {
      const baseTime = new Date("2025-01-15T12:00:00Z");
      vi.setSystemTime(baseTime);

      const notams: ParsedNotam[] = [
        // Active now (within 6h window) - started 2h ago, ends 6h from now
        createTimeBasedNotam("A001", -2, 8),
        // Future outside window - starts 8h from now (outside 6h window)
        createTimeBasedNotam("A002", 8, 4),
      ];

      render(<GroupedNotamsDisplay notams={notams} />);

      // Should show filter bar
      expect(screen.getByText("Time Window:")).toBeInTheDocument();
      expect(screen.getByText("6h")).toBeInTheDocument();
      expect(screen.getByText("12h")).toBeInTheDocument();
      expect(screen.getByText("24h")).toBeInTheDocument();
      expect(screen.getByText("All")).toBeInTheDocument();

      // Initially 24h window (default) - should show both
      expect(screen.getByText("A001")).toBeInTheDocument();
      expect(screen.getByText("A002")).toBeInTheDocument();

      // Click "6h" button to filter to 6h window
      const button6h = screen.getByText("6h");
      button6h.click();

      // Wait for React to update and re-filter
      await waitFor(() => {
        expect(screen.getByText("A001")).toBeInTheDocument();
        expect(screen.queryByText("A002")).not.toBeInTheDocument();
      });
    });

    it("should show expired NOTAMs when toggle is enabled", async () => {
      const baseTime = new Date("2025-01-15T12:00:00Z");
      vi.setSystemTime(baseTime);

      // Create active NOTAM (started 2h ago, ends 6h from now)
      const activeNotam = createTimeBasedNotam("A001", -2, 8);
      
      // Create expired NOTAM (started 4h ago, ended 2h ago)
      // validFrom = baseTime - 4h = 08:00
      // validTo = baseTime - 2h = 10:00 (expired)
      const expiredNotam: ParsedNotam = {
        ...createTimeBasedNotam("A002", -4, 2),
        validTo: new Date(baseTime.getTime() - 2 * 60 * 60 * 1000).toISOString(), // Explicitly set to 2h ago
      };

      const notams: ParsedNotam[] = [activeNotam, expiredNotam];

      render(<GroupedNotamsDisplay notams={notams} />);

      // Initially should not show expired
      expect(screen.getByText("A001")).toBeInTheDocument();
      expect(screen.queryByText("A002")).not.toBeInTheDocument();

      // Click "Show Expired" checkbox
      const checkbox = screen.getByLabelText("Show Expired");
      checkbox.click();

      // Wait for React to update and show expired NOTAMs
      await waitFor(() => {
        // After enabling, expired should appear
        expect(screen.getByText("A001")).toBeInTheDocument();
        expect(screen.getByText("A002")).toBeInTheDocument();
      });
    });

    it("should change time window when button is clicked", async () => {
      const baseTime = new Date("2025-01-15T12:00:00Z");
      vi.setSystemTime(baseTime);

      const notams: ParsedNotam[] = [
        // Active NOTAM
        createTimeBasedNotam("A001", -2, 8),
        // Future NOTAM - starts 8h from now
        createTimeBasedNotam("A002", 8, 4),
      ];

      render(<GroupedNotamsDisplay notams={notams} />);

      // Initially 24h window (default) - should show both
      expect(screen.getByText("A001")).toBeInTheDocument();
      expect(screen.getByText("A002")).toBeInTheDocument();

      // Click "12h" button
      const button12h = screen.getByText("12h");
      button12h.click();

      // Should still show both (both within 12h window)
      expect(screen.getByText("A001")).toBeInTheDocument();
      expect(screen.getByText("A002")).toBeInTheDocument();

      // Click "6h" button
      const button6h = screen.getByText("6h");
      button6h.click();

      // Wait for React to update and re-filter
      await waitFor(() => {
        // Should only show A001 (A002 is outside 6h window)
        expect(screen.getByText("A001")).toBeInTheDocument();
        expect(screen.queryByText("A002")).not.toBeInTheDocument();
      });
    });

    it("should show 'No NOTAMs match' message when filters exclude all", async () => {
      const baseTime = new Date("2025-01-15T12:00:00Z");
      vi.setSystemTime(baseTime);

      const notams: ParsedNotam[] = [
        // Future NOTAM - starts 8h from now (outside 6h window)
        createTimeBasedNotam("A001", 8, 4),
      ];

      render(<GroupedNotamsDisplay notams={notams} />);

      // Click "6h" button to filter to 6h window
      const button6h = screen.getByText("6h");
      button6h.click();

      // Wait for React to update and show empty state
      await waitFor(() => {
        // Should show "No NOTAMs match" message
        expect(
          screen.getByText("No NOTAMs match the current filter settings")
        ).toBeInTheDocument();
      });
    });
  });
});

