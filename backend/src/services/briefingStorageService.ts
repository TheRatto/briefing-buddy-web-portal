/**
 * Briefing Storage Service
 * 
 * Handles database operations for storing and retrieving briefings and NOTAMs.
 * Uses parameterized queries to prevent SQL injection.
 */

import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import { ParsedNotam } from "./notamParsingService";

// Get database connection from auth.ts (shared pool)
// We'll need to export the pool from auth.ts or create a shared connection module
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

export interface BriefingRecord {
  id: string;
  userId: string;
  rawText: string;
  pdfFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotamRecord {
  id: string;
  briefingId: string;
  notamId: string;
  qCode: string | null;
  fieldA: string;
  fieldB: string;
  fieldC: string;
  fieldD: string;
  fieldE: string;
  fieldF: string;
  fieldG: string;
  validFrom: Date | null;
  validTo: Date | null;
  isPermanent: boolean;
  rawText: string;
  groupName: string;
  warnings: string[];
  createdAt: Date;
}

export interface BriefingWithNotams extends BriefingRecord {
  notams: NotamRecord[];
}

/**
 * Store a briefing and its NOTAMs in the database
 * Only stores for authenticated users (userId must be provided)
 */
export async function storeBriefing(
  userId: string,
  rawText: string,
  notams: ParsedNotam[],
  pdfFileId?: string
): Promise<string> {
  const dbPool = getPool();
  const client = await dbPool.connect();
  
  try {
    await client.query("BEGIN");
    
    // Insert briefing record using parameterized query
    const briefingId = uuidv4();
    const insertBriefingQuery = `
      INSERT INTO briefings (id, user_id, raw_text, pdf_file_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, raw_text, pdf_file_id, created_at, updated_at
    `;
    const briefingResult = await client.query(insertBriefingQuery, [
      briefingId,
      userId,
      rawText,
      pdfFileId || null,
    ]);
    
    // Insert NOTAM records using parameterized queries
    for (const notam of notams) {
      const notamDbId = uuidv4();
      const insertNotamQuery = `
        INSERT INTO notams (
          id, briefing_id, notam_id, q_code, field_a, field_b, field_c, field_d,
          field_e, field_f, field_g, valid_from, valid_to, is_permanent,
          raw_text, group_name, warnings
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `;
      
      await client.query(insertNotamQuery, [
        notamDbId,
        briefingId,
        notam.notamId,
        notam.qCode || null,
        notam.fieldA || "",
        notam.fieldB || "",
        notam.fieldC || "",
        notam.fieldD || "",
        notam.fieldE || "",
        notam.fieldF || "",
        notam.fieldG || "",
        notam.validFrom || null,
        notam.validTo || null,
        notam.isPermanent || false,
        notam.rawText,
        notam.group,
        notam.warnings || [],
      ]);
    }
    
    await client.query("COMMIT");
    return briefingId;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Retrieve a briefing by ID with authorization check
 * Returns null if briefing doesn't exist or user doesn't have access
 */
export async function getBriefingById(
  briefingId: string,
  userId: string
): Promise<BriefingWithNotams | null> {
  const dbPool = getPool();
  
  // Use parameterized query with user_id check for authorization
  const briefingQuery = `
    SELECT id, user_id, raw_text, pdf_file_id, created_at, updated_at
    FROM briefings
    WHERE id = $1 AND user_id = $2
  `;
  const briefingResult = await dbPool.query(briefingQuery, [briefingId, userId]);
  
  if (briefingResult.rows.length === 0) {
    return null;
  }
  
  const briefingRow = briefingResult.rows[0];
  
  // Fetch associated NOTAMs using parameterized query
  const notamsQuery = `
    SELECT id, briefing_id, notam_id, q_code, field_a, field_b, field_c, field_d,
           field_e, field_f, field_g, valid_from, valid_to, is_permanent,
           raw_text, group_name, warnings, created_at
    FROM notams
    WHERE briefing_id = $1
    ORDER BY created_at ASC
  `;
  const notamsResult = await dbPool.query(notamsQuery, [briefingId]);
  
  const notams: NotamRecord[] = notamsResult.rows.map((row) => ({
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
    id: briefingRow.id,
    userId: briefingRow.user_id,
    rawText: briefingRow.raw_text,
    pdfFileId: briefingRow.pdf_file_id,
    createdAt: new Date(briefingRow.created_at),
    updatedAt: new Date(briefingRow.updated_at),
    notams,
  };
}

/**
 * List all briefings for a user (within retention period)
 * Returns briefings ordered by creation date (newest first)
 */
export async function listUserBriefings(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<BriefingRecord[]> {
  const dbPool = getPool();
  
  // Use parameterized query with user_id check for authorization
  // Only return briefings within 90-day retention period
  const query = `
    SELECT id, user_id, raw_text, pdf_file_id, created_at, updated_at
    FROM briefings
    WHERE user_id = $1
      AND created_at >= CURRENT_TIMESTAMP - INTERVAL '90 days'
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const result = await dbPool.query(query, [userId, limit, offset]);
  
  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    rawText: row.raw_text,
    pdfFileId: row.pdf_file_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

/**
 * Delete expired briefings (older than 90 days)
 * Returns count of deleted briefings
 * This is used by the cleanup job
 */
export async function deleteExpiredBriefings(): Promise<number> {
  const dbPool = getPool();
  
  // Use parameterized query for date comparison
  const query = `
    DELETE FROM briefings
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days'
    RETURNING id
  `;
  const result = await dbPool.query(query);
  
  // NOTAMs are automatically deleted via CASCADE foreign key
  return result.rowCount || 0;
}

/**
 * Get count of briefings that will be deleted in next cleanup
 * Useful for monitoring and logging
 */
export async function getExpiredBriefingsCount(): Promise<number> {
  const dbPool = getPool();
  
  const query = `
    SELECT COUNT(*) as count
    FROM briefings
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days'
  `;
  const result = await dbPool.query(query);
  
  return parseInt(result.rows[0].count, 10);
}

