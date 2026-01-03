/**
 * Cleanup Service
 * 
 * Handles automated cleanup of expired briefings (90-day retention policy).
 * Coordinates database and object storage cleanup with error handling and logging.
 */

import { deleteExpiredBriefings, getExpiredBriefingsCount } from "./briefingStorageService";
import { deleteExpiredShareLinks } from "./shareLinkService";

export interface CleanupResult {
  success: boolean;
  deletedCount: number;
  errors: string[];
  timestamp: Date;
}

/**
 * Run cleanup job to delete briefings older than 90 days
 * Handles errors gracefully and logs execution
 * 
 * Note: Object storage cleanup would be implemented here if PDFs were stored.
 * For MVP, we only clean up database records.
 */
export async function runCleanupJob(): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: false,
    deletedCount: 0,
    errors: [],
    timestamp: new Date(),
  };

  try {
    // Get count before deletion for logging
    const expiredCount = await getExpiredBriefingsCount();
    console.log(`[Cleanup] Found ${expiredCount} expired briefings to delete`);

    // Delete expired briefings
    // NOTAMs are automatically deleted via CASCADE foreign key
    const deletedCount = await deleteExpiredBriefings();
    result.deletedCount = deletedCount;

    // Delete expired share links
    try {
      const deletedShareLinks = await deleteExpiredShareLinks();
      console.log(`[Cleanup] Deleted ${deletedShareLinks} expired share links`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Share link cleanup failed: ${errorMessage}`);
      console.error("[Cleanup] Error deleting expired share links:", error);
    }

    // TODO: If PDFs are stored in object storage, delete them here
    // For now, we only handle database cleanup
    // Example:
    // try {
    //   await deleteExpiredPdfFiles(deletedBriefingIds);
    // } catch (error) {
    //   result.errors.push(`Object storage cleanup failed: ${error}`);
    // }

    result.success = true;
    console.log(`[Cleanup] Successfully deleted ${deletedCount} expired briefings`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Cleanup job failed: ${errorMessage}`);
    console.error("[Cleanup] Error during cleanup:", error);
  }

  return result;
}

/**
 * Schedule cleanup job to run periodically
 * Can be called from a cron job or scheduled task runner
 * 
 * Example usage:
 * - Set up a cron job: `0 2 * * *` (daily at 2 AM)
 * - Or use a task scheduler like node-cron
 */
export function scheduleCleanupJob(intervalMs: number = 24 * 60 * 60 * 1000): NodeJS.Timeout {
  console.log(`[Cleanup] Scheduling cleanup job to run every ${intervalMs}ms`);
  
  // Run immediately on startup
  runCleanupJob().catch((error) => {
    console.error("[Cleanup] Initial cleanup job failed:", error);
  });

  // Schedule periodic runs
  return setInterval(async () => {
    await runCleanupJob();
  }, intervalMs);
}

