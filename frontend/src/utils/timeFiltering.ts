/**
 * Time Filtering Utility
 * 
 * Filters NOTAMs by time window and computes visibility states.
 * Matches backend implementation: backend/src/services/timeFilteringService.ts
 */

import { ParsedNotam } from "../types/notam";

/**
 * Time window filter options
 */
export type TimeWindow = "6h" | "12h" | "24h" | "All";

/**
 * Visibility state for a NOTAM
 */
export enum NotamVisibilityState {
  active_now = "active_now", // Currently active (validFrom <= now < validTo)
  future_in_window = "future_in_window", // Will become active within the time window
  future_outside_window = "future_outside_window", // Will become active but outside the time window
  expired = "expired", // Already expired (validTo <= now)
}

/**
 * Result of filtering NOTAMs with visibility states
 */
export interface FilteredNotamResult {
  notam: ParsedNotam;
  visibilityState: NotamVisibilityState;
}

/**
 * Filter NOTAMs by time window using interval overlap rule
 * Matches backend implementation
 * 
 * Rule: NOTAM is included if validFrom < windowEnd AND validTo > now
 * 
 * @param notams - List of NOTAMs to filter
 * @param timeWindow - Time window filter (6h, 12h, 24h, or All)
 * @param includeExpired - Whether to include expired NOTAMs
 * @param now - Current time (defaults to Date.now())
 * @returns Filtered NOTAMs with visibility states
 */
export function filterNotamsByTimeWindow(
  notams: ParsedNotam[],
  timeWindow: TimeWindow,
  includeExpired: boolean = false,
  now: Date = new Date()
): FilteredNotamResult[] {
  // Filter out CNL (Cancellation) NOTAMs - they don't provide useful operational information
  const activeNotams = notams.filter(
    (notam) => !notam.rawText.toUpperCase().includes("CNL NOTAM")
  );

  // If "All" is selected, return all active NOTAMs with their visibility states
  if (timeWindow === "All") {
    const results = activeNotams.map((notam) => ({
      notam,
      visibilityState: computeVisibilityState(notam, timeWindow, now),
    }));

    // Filter out expired if not including them
    if (!includeExpired) {
      return results.filter(
        (result) => result.visibilityState !== NotamVisibilityState.expired
      );
    }

    return results;
  }

  // Calculate window end time
  const hours = getHoursFromWindow(timeWindow);
  const windowEnd = new Date(now.getTime() + hours * 60 * 60 * 1000);

  // Filter using interval overlap rule: validFrom < windowEnd AND validTo > now
  const filtered = activeNotams.filter((notam) => {
    // Handle PERM NOTAMs: they have isPermanent flag and validTo is set to far future
    if (notam.isPermanent) {
      // PERM NOTAMs are included if they are currently active or will become active
      return notam.validFrom && new Date(notam.validFrom) < windowEnd;
    }

    // Regular NOTAMs: must have both validFrom and validTo
    if (!notam.validFrom || !notam.validTo) {
      return false;
    }

    const validFromDate = new Date(notam.validFrom);
    const validToDate = new Date(notam.validTo);

    // Interval overlap rule: validFrom < windowEnd AND validTo > now
    return validFromDate < windowEnd && validToDate > now;
  });

  // Compute visibility states for filtered NOTAMs
  const results = filtered.map((notam) => ({
    notam,
    visibilityState: computeVisibilityState(notam, timeWindow, now),
  }));

  // If includeExpired is true, also add expired NOTAMs that were in the original list
  if (includeExpired) {
    const expiredNotams = activeNotams.filter((notam) => {
      if (!notam.validTo) return false;
      return new Date(notam.validTo) <= now;
    });

    const expiredResults = expiredNotams.map((notam) => ({
      notam,
      visibilityState: NotamVisibilityState.expired,
    }));

    return [...results, ...expiredResults];
  }

  return results;
}

/**
 * Compute visibility state for a NOTAM
 * 
 * @param notam - NOTAM to compute state for
 * @param timeWindow - Time window filter
 * @param now - Current time
 * @returns Visibility state
 */
export function computeVisibilityState(
  notam: ParsedNotam,
  timeWindow: TimeWindow,
  now: Date = new Date()
): NotamVisibilityState {
  // Handle missing dates
  if (!notam.validFrom || !notam.validTo) {
    return NotamVisibilityState.expired;
  }

  const validFromDate = new Date(notam.validFrom);
  const validToDate = new Date(notam.validTo);

  // Check if expired
  if (validToDate <= now) {
    return NotamVisibilityState.expired;
  }

  // Check if currently active
  if (validFromDate <= now && validToDate > now) {
    return NotamVisibilityState.active_now;
  }

  // If "All" is selected, future NOTAMs are "future_in_window"
  if (timeWindow === "All") {
    return NotamVisibilityState.future_in_window;
  }

  // Calculate window end time
  const hours = getHoursFromWindow(timeWindow);
  const windowEnd = new Date(now.getTime() + hours * 60 * 60 * 1000);

  // Check if future NOTAM is within the time window
  if (validFromDate > now && validFromDate < windowEnd) {
    return NotamVisibilityState.future_in_window;
  }

  // Future NOTAM outside the time window
  return NotamVisibilityState.future_outside_window;
}

/**
 * Get hours from time window string
 * 
 * @param timeWindow - Time window filter
 * @returns Number of hours
 */
function getHoursFromWindow(timeWindow: TimeWindow): number {
  switch (timeWindow) {
    case "6h":
      return 6;
    case "12h":
      return 12;
    case "24h":
      return 24;
    case "All":
      return Infinity; // Not used, but defined for completeness
    default:
      return 24; // Default to 24 hours
  }
}

/**
 * Get color for a visibility state
 * 
 * @param visibilityState - Visibility state
 * @param isPermanent - Whether the NOTAM is permanent
 * @returns Color string
 */
export function getVisibilityColor(
  visibilityState: NotamVisibilityState,
  isPermanent: boolean
): string {
  // PERM NOTAMs get special handling
  if (isPermanent) {
    return "#6c5ce7"; // Purple for permanent NOTAMs
  }

  switch (visibilityState) {
    case NotamVisibilityState.active_now:
      return "#ffa502"; // Amber for active
    case NotamVisibilityState.future_in_window:
      return "#ff6348"; // Orange for future in window
    case NotamVisibilityState.expired:
      return "#ff4757"; // Red for expired
    case NotamVisibilityState.future_outside_window:
      return "#747d8c"; // Gray for future outside window
    default:
      return "#747d8c"; // Default gray
  }
}

