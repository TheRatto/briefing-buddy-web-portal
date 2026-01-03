/**
 * NOTAM Grouping Utilities
 * 
 * Groups NOTAMs by location (fieldA/ICAO) and then by operational category (group)
 */

import { ParsedNotam, NotamGroup, GroupedNotams } from "../types/notam";

/**
 * Group NOTAMs by location, then by category
 * 
 * @param notams - Array of NOTAMs to group
 * @returns Grouped structure: Location -> Category -> NOTAMs[]
 */
export function groupNotamsByLocationAndCategory(
  notams: ParsedNotam[]
): GroupedNotams {
  const grouped: GroupedNotams = {};

  for (const notam of notams) {
    // Use fieldA (ICAO location code) as the location key
    const location = notam.fieldA || "UNKNOWN";
    const category = notam.group;

    // Initialize location if needed
    if (!grouped[location]) {
      grouped[location] = {};
    }

    // Initialize category within location if needed
    if (!grouped[location][category]) {
      grouped[location][category] = [];
    }

    // Add NOTAM to the appropriate group
    grouped[location][category]!.push(notam);
  }

  // Sort NOTAMs within each category by validFrom date (earliest first)
  for (const location of Object.keys(grouped)) {
    for (const category of Object.keys(grouped[location])) {
      const notamsInCategory = grouped[location][category as NotamGroup]!;
      notamsInCategory.sort((a, b) => {
        const dateA = new Date(a.validFrom).getTime();
        const dateB = new Date(b.validFrom).getTime();
        return dateA - dateB;
      });
    }
  }

  return grouped;
}

/**
 * Get display label for a NOTAM group category
 * 
 * @param group - NOTAM group category
 * @returns Human-readable label
 */
export function getCategoryLabel(group: NotamGroup): string {
  const labels: Record<NotamGroup, string> = {
    [NotamGroup.runways]: "Runways",
    [NotamGroup.taxiways]: "Taxiways",
    [NotamGroup.instrumentProcedures]: "Instrument Procedures",
    [NotamGroup.airportServices]: "Airport Services",
    [NotamGroup.lighting]: "Lighting",
    [NotamGroup.hazards]: "Hazards",
    [NotamGroup.admin]: "Administrative",
    [NotamGroup.other]: "Other",
    [NotamGroup.firAirspaceRestrictions]: "FIR Airspace Restrictions",
    [NotamGroup.firAtcNavigation]: "FIR ATC/Navigation",
    [NotamGroup.firObstaclesCharts]: "FIR Obstacles/Charts",
    [NotamGroup.firInfrastructure]: "FIR Infrastructure",
    [NotamGroup.firDroneOperations]: "FIR Drone Operations",
    [NotamGroup.firAdministrative]: "FIR Administrative",
  };

  return labels[group] || group;
}

/**
 * Get sorted list of locations from grouped NOTAMs
 * 
 * @param grouped - Grouped NOTAMs structure
 * @returns Sorted array of location codes
 */
export function getSortedLocations(grouped: GroupedNotams): string[] {
  return Object.keys(grouped).sort();
}

/**
 * Get sorted list of categories for a location
 * 
 * @param locationCategories - Categories for a location
 * @returns Sorted array of category keys
 */
export function getSortedCategories(
  locationCategories: Partial<Record<NotamGroup, ParsedNotam[]>>
): NotamGroup[] {
  // Define priority order for categories (airport groups first, then FIR groups)
  const categoryOrder: NotamGroup[] = [
    NotamGroup.runways,
    NotamGroup.taxiways,
    NotamGroup.instrumentProcedures,
    NotamGroup.airportServices,
    NotamGroup.lighting,
    NotamGroup.hazards,
    NotamGroup.admin,
    NotamGroup.other,
    NotamGroup.firAirspaceRestrictions,
    NotamGroup.firAtcNavigation,
    NotamGroup.firObstaclesCharts,
    NotamGroup.firInfrastructure,
    NotamGroup.firDroneOperations,
    NotamGroup.firAdministrative,
  ];

  // Filter to only categories that exist, maintaining order
  return categoryOrder.filter(
    (cat) => locationCategories[cat] && locationCategories[cat]!.length > 0
  );
}

