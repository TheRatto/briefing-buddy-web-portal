/**
 * Export Service
 * 
 * Handles exporting briefings in various formats:
 * - Raw NOTAMs (plain text)
 * - Categorised view (grouped by location and category)
 * - AI summary (if present)
 */

import { BriefingWithNotams } from "./briefingStorageService";

export type ExportFormat = "raw" | "categorized" | "summary";

/**
 * Export briefing as raw NOTAM text
 * Returns the original raw text that was submitted
 */
export function exportRaw(briefing: BriefingWithNotams): string {
  return briefing.rawText;
}

/**
 * Export briefing as categorized view
 * Groups NOTAMs by location and category, similar to UI display
 */
export function exportCategorized(briefing: BriefingWithNotams): string {
  // Group NOTAMs by location (fieldA) and then by category
  const grouped: Record<string, Record<string, typeof briefing.notams>> = {};
  
  for (const notam of briefing.notams) {
    const location = notam.fieldA || "UNKNOWN";
    const category = notam.groupName;
    
    if (!grouped[location]) {
      grouped[location] = {};
    }
    if (!grouped[location][category]) {
      grouped[location][category] = [];
    }
    
    grouped[location][category].push(notam);
  }
  
  // Build export text
  let output = `Briefing Export - Categorized View\n`;
  output += `Generated: ${new Date().toISOString()}\n`;
  output += `Briefing ID: ${briefing.id}\n`;
  output += `Total NOTAMs: ${briefing.notams.length}\n\n`;
  output += `${"=".repeat(80)}\n\n`;
  
  // Sort locations alphabetically
  const locations = Object.keys(grouped).sort();
  
  for (const location of locations) {
    output += `\n${"=".repeat(80)}\n`;
    output += `LOCATION: ${location}\n`;
    output += `${"=".repeat(80)}\n\n`;
    
    const categories = Object.keys(grouped[location]).sort();
    
    for (const category of categories) {
      const notams = grouped[location][category];
      output += `\n--- ${category} (${notams.length} NOTAM${notams.length !== 1 ? "s" : ""}) ---\n\n`;
      
      // Sort NOTAMs by validFrom date
      const sortedNotams = [...notams].sort((a, b) => {
        const dateA = a.validFrom ? new Date(a.validFrom).getTime() : 0;
        const dateB = b.validFrom ? new Date(b.validFrom).getTime() : 0;
        return dateA - dateB;
      });
      
      for (const notam of sortedNotams) {
        output += `NOTAM ID: ${notam.notamId}\n`;
        if (notam.qCode) {
          output += `Q-Code: ${notam.qCode}\n`;
        }
        if (notam.validFrom) {
          output += `Valid From: ${new Date(notam.validFrom).toISOString()}\n`;
        }
        if (notam.validTo) {
          output += `Valid To: ${new Date(notam.validTo).toISOString()}\n`;
        }
        if (notam.isPermanent) {
          output += `Permanent: Yes\n`;
        }
        if (notam.warnings && notam.warnings.length > 0) {
          output += `Warnings: ${notam.warnings.join(", ")}\n`;
        }
        output += `\n${notam.rawText}\n\n`;
        output += `${"-".repeat(80)}\n\n`;
      }
    }
  }
  
  return output;
}

/**
 * Export briefing as AI summary
 * Returns AI-generated summary if present, otherwise returns a message
 * 
 * Note: AI summary functionality is part of F-011 (not yet implemented)
 * This function is a placeholder that will be extended when F-011 is implemented
 */
export function exportSummary(briefing: BriefingWithNotams): string {
  // TODO: When F-011 is implemented, retrieve AI summary from database
  // For now, return a message indicating summary is not available
  return `AI Summary Export\n\nAI-generated summary is not yet available for this briefing.\n\nThis feature will be available in a future update.`;
}

/**
 * Export briefing in the specified format
 */
export function exportBriefing(
  briefing: BriefingWithNotams,
  format: ExportFormat
): string {
  switch (format) {
    case "raw":
      return exportRaw(briefing);
    case "categorized":
      return exportCategorized(briefing);
    case "summary":
      return exportSummary(briefing);
    default:
      throw new Error(`Unknown export format: ${format}`);
  }
}

