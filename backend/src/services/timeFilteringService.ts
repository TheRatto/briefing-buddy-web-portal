/**
 * Time Filtering Service
 * 
 * Filters NOTAMs by time window and computes visibility states.
 * Matches Dart implementation: lib/providers/flight_provider.dart filterNotamsByTimeAndAirport()
 */

import { ParsedNotam } from "./notamParsingService";

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
 * Matches Dart implementation: filterNotamsByTimeAndAirport()
 * 
 * Rule: NOTAM is included if validFrom < windowEnd AND validTo > now
 * 
 * @param notams - List of NOTAMs to filter
 * @param timeWindow - Time window filter (6h, 12h, 24h, or All)
 * @param now - Current time (defaults to Date.now())
 * @returns Filtered NOTAMs with visibility states
 */
export function filterNotamsByTimeWindow(
  notams: ParsedNotam[],
  timeWindow: TimeWindow,
  now: Date = new Date()
): FilteredNotamResult[] {
  // Filter out CNL (Cancellation) NOTAMs - they don't provide useful operational information
  const activeNotams = notams.filter(
    (notam) => !notam.rawText.toUpperCase().includes("CNL NOTAM")
  );

  // If "All" is selected, return all active NOTAMs with their visibility states
  if (timeWindow === "All") {
    return activeNotams.map((notam) => ({
      notam,
      visibilityState: computeVisibilityState(notam, timeWindow, now),
    }));
  }

  // Calculate window end time
  const hours = getHoursFromWindow(timeWindow);
  const windowEnd = new Date(now.getTime() + hours * 60 * 60 * 1000);

  // Filter using interval overlap rule: validFrom < windowEnd AND validTo > now
  const filtered = activeNotams.filter((notam) => {
    // Handle PERM NOTAMs: they have isPermanent flag and validTo is set to far future
    if (notam.isPermanent) {
      // PERM NOTAMs are included if they are currently active or will become active
      return notam.validFrom && notam.validFrom < windowEnd;
    }

    // Regular NOTAMs: must have both validFrom and validTo
    if (!notam.validFrom || !notam.validTo) {
      return false;
    }

    // Interval overlap rule: validFrom < windowEnd AND validTo > now
    return notam.validFrom < windowEnd && notam.validTo > now;
  });

  // Compute visibility states for filtered NOTAMs
  return filtered.map((notam) => ({
    notam,
    visibilityState: computeVisibilityState(notam, timeWindow, now),
  }));
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

  // Check if expired
  if (notam.validTo <= now) {
    return NotamVisibilityState.expired;
  }

  // Check if currently active
  if (notam.validFrom <= now && notam.validTo > now) {
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
  if (notam.validFrom > now && notam.validFrom < windowEnd) {
    return NotamVisibilityState.future_in_window;
  }

  // Future NOTAM outside the time window
  return NotamVisibilityState.future_outside_window;
}

/**
 * Get hours from time window string
 * Matches Dart implementation: _getHoursFromFilter()
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
 * Filter NOTAMs by time window and return only included NOTAMs (excluding expired by default)
 * This is a convenience function that filters out expired NOTAMs
 * 
 * @param notams - List of NOTAMs to filter
 * @param timeWindow - Time window filter
 * @param includeExpired - Whether to include expired NOTAMs (default: false)
 * @param now - Current time (defaults to Date.now())
 * @returns Filtered NOTAMs (without visibility states)
 */
export function filterNotams(
  notams: ParsedNotam[],
  timeWindow: TimeWindow,
  includeExpired: boolean = false,
  now: Date = new Date()
): ParsedNotam[] {
  // Filter out CNL (Cancellation) NOTAMs
  const activeNotams = notams.filter(
    (notam) => !notam.rawText.toUpperCase().includes("CNL NOTAM")
  );

  // If "All" is selected, return all active NOTAMs (optionally including expired)
  if (timeWindow === "All") {
    if (includeExpired) {
      return activeNotams;
    }
    return activeNotams.filter((notam) => {
      if (!notam.validTo) return false;
      return notam.validTo > now;
    });
  }

  // Calculate window end time
  const hours = getHoursFromWindow(timeWindow);
  const windowEnd = new Date(now.getTime() + hours * 60 * 60 * 1000);

  // Filter using interval overlap rule: validFrom < windowEnd AND validTo > now
  const filtered = activeNotams.filter((notam) => {
    // Handle PERM NOTAMs: they have isPermanent flag and validTo is set to far future
    if (notam.isPermanent) {
      // PERM NOTAMs are included if they are currently active or will become active
      return notam.validFrom && notam.validFrom < windowEnd;
    }

    // Regular NOTAMs: must have both validFrom and validTo
    if (!notam.validFrom || !notam.validTo) {
      return false;
    }

    // Interval overlap rule: validFrom < windowEnd AND validTo > now
    return notam.validFrom < windowEnd && notam.validTo > now;
  });

  // If includeExpired is true, also add expired NOTAMs that were in the original list
  if (includeExpired) {
    const expiredNotams = activeNotams.filter((notam) => {
      if (!notam.validTo) return false;
      return notam.validTo <= now;
    });
    return [...filtered, ...expiredNotams];
  }

  return filtered;
}

