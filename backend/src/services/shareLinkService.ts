/**
 * Share Link Service
 * 
 * Handles generation and validation of secure, expiring share links for briefings.
 * Implements security requirements from SECURITY_REVIEW.md (M-8, M-10).
 */

import { Pool } from "pg";
import { randomBytes } from "crypto";
import { getBriefingById } from "./briefingStorageService";

let pool: Pool | null = null;

export function setDatabasePool(dbPool: Pool) {
  pool = dbPool;
}

function getPool(): Pool {
  if (!pool) {
    throw new Error("Database pool not initialized. Call setDatabasePool() first.");
  }
  return pool;
}

export interface ShareLinkRecord {
  id: string;
  briefingId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Generate a cryptographically secure, non-guessable token
 * Uses 32 bytes (256 bits) of random data, base64url encoded
 * This provides sufficient entropy to prevent guessing attacks
 */
function generateSecureToken(): string {
  // Generate 32 bytes (256 bits) of cryptographically secure random data
  const randomBytesBuffer = randomBytes(32);
  // Convert to base64url encoding (URL-safe, no padding)
  return randomBytesBuffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Create a share link for a briefing
 * Validates that the user owns the briefing before creating the link
 * 
 * @param briefingId - UUID of the briefing to share
 * @param userId - ID of the user creating the share link (must own the briefing)
 * @param expiresInDays - Number of days until expiration (default: 7)
 * @returns Share link token and expiration date
 */
export async function createShareLink(
  briefingId: string,
  userId: string,
  expiresInDays: number = 7
): Promise<{ token: string; expiresAt: Date; shareUrl: string }> {
  const dbPool = getPool();
  
  // First, verify that the user owns the briefing (authorization check)
  const briefing = await getBriefingById(briefingId, userId);
  if (!briefing) {
    throw new Error("Briefing not found or access denied");
  }
  
  // Generate cryptographically secure token
  const token = generateSecureToken();
  
  // Calculate expiration timestamp
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  
  // Insert share link record using parameterized query
  const insertQuery = `
    INSERT INTO share_links (briefing_id, token, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id, briefing_id, token, expires_at, created_at
  `;
  const result = await dbPool.query(insertQuery, [
    briefingId,
    token,
    expiresAt.toISOString(),
  ]);
  
  const shareLink = result.rows[0];
  
  // Construct share URL (frontend will handle the full URL construction)
  const shareUrl = `/share/${token}`;
  
  return {
    token: shareLink.token,
    expiresAt: new Date(shareLink.expires_at),
    shareUrl,
  };
}

/**
 * Validate and retrieve a briefing via share link token
 * Checks expiration and returns briefing data if valid
 * 
 * @param token - Share link token
 * @returns Briefing data if token is valid and not expired, null otherwise
 */
export async function getBriefingByShareToken(
  token: string
): Promise<{ briefing: any; expiresAt: Date } | null> {
  const dbPool = getPool();
  
  // Query share link with expiration check using parameterized query
  const query = `
    SELECT sl.briefing_id, sl.expires_at, sl.created_at
    FROM share_links sl
    WHERE sl.token = $1
      AND sl.expires_at > CURRENT_TIMESTAMP
  `;
  const result = await dbPool.query(query, [token]);
  
  if (result.rows.length === 0) {
    return null; // Token not found or expired
  }
  
  const shareLink = result.rows[0];
  const briefingId = shareLink.briefing_id;
  
  // Get briefing data (without user_id check since this is a share link)
  // We need to query the briefing directly
  const briefingQuery = `
    SELECT id, user_id, raw_text, pdf_file_id, created_at, updated_at
    FROM briefings
    WHERE id = $1
  `;
  const briefingResult = await dbPool.query(briefingQuery, [briefingId]);
  
  if (briefingResult.rows.length === 0) {
    return null; // Briefing was deleted
  }
  
  const briefingRow = briefingResult.rows[0];
  
  // Fetch associated NOTAMs
  const notamsQuery = `
    SELECT id, briefing_id, notam_id, q_code, field_a, field_b, field_c, field_d,
           field_e, field_f, field_g, valid_from, valid_to, is_permanent,
           raw_text, group_name, warnings, created_at
    FROM notams
    WHERE briefing_id = $1
    ORDER BY created_at ASC
  `;
  const notamsResult = await dbPool.query(notamsQuery, [briefingId]);
  
  const notams = notamsResult.rows.map((row) => ({
    id: row.id,
    briefingId: row.briefing_id,
    notamId: row.notam_id,
    qCode: row.q_code,
    fieldA: row.field_a || "",
    fieldB: row.field_b || "",
    fieldC: row.field_c || "",
    fieldD: row.field_d || "",
    fieldE: row.field_e || "",
    fieldF: row.field_f || "",
    fieldG: row.field_g || "",
    validFrom: row.valid_from ? new Date(row.valid_from) : null,
    validTo: row.valid_to ? new Date(row.valid_to) : null,
    isPermanent: row.is_permanent || false,
    rawText: row.raw_text,
    groupName: row.group_name,
    warnings: row.warnings || [],
    createdAt: new Date(row.created_at),
  }));
  
  return {
    briefing: {
      id: briefingRow.id,
      userId: briefingRow.user_id,
      rawText: briefingRow.raw_text,
      pdfFileId: briefingRow.pdf_file_id,
      createdAt: new Date(briefingRow.created_at),
      updatedAt: new Date(briefingRow.updated_at),
      notams,
    },
    expiresAt: new Date(shareLink.expires_at),
  };
}

/**
 * Delete expired share links from the database
 * This should be called periodically by cleanup jobs
 * 
 * @returns Number of deleted share links
 */
export async function deleteExpiredShareLinks(): Promise<number> {
  const dbPool = getPool();
  
  // Use the database function to delete expired links
  const result = await dbPool.query("SELECT delete_expired_share_links() as deleted_count");
  return parseInt(result.rows[0].deleted_count, 10);
}

/**
 * Revoke a share link (delete it)
 * Only the briefing owner can revoke their share links
 * 
 * @param token - Share link token to revoke
 * @param userId - ID of the user revoking the link (must own the briefing)
 * @returns true if link was revoked, false if not found or access denied
 */
export async function revokeShareLink(
  token: string,
  userId: string
): Promise<boolean> {
  const dbPool = getPool();
  
  // First verify that the user owns the briefing associated with this token
  const shareLinkQuery = `
    SELECT sl.briefing_id
    FROM share_links sl
    JOIN briefings b ON b.id = sl.briefing_id
    WHERE sl.token = $1 AND b.user_id = $2
  `;
  const shareLinkResult = await dbPool.query(shareLinkQuery, [token, userId]);
  
  if (shareLinkResult.rows.length === 0) {
    return false; // Token not found or user doesn't own the briefing
  }
  
  // Delete the share link
  const deleteQuery = `
    DELETE FROM share_links
    WHERE token = $1
  `;
  const deleteResult = await dbPool.query(deleteQuery, [token]);
  
  return (deleteResult.rowCount || 0) > 0;
}

