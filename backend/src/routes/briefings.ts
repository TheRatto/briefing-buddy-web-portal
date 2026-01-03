import { Router, Request, Response } from "express";
import { optionalAuth, requireAuth } from "../middleware/authMiddleware";
import { upload } from "../middleware/fileUpload";
import { uploadRateLimiter } from "../middleware/rateLimiter";
import { extractTextFromPdf } from "../services/pdfExtractionService";
import { extractNotamSections } from "../services/notamSectionDetectionService";
import { parseNotams, ParsedNotam } from "../services/notamParsingService";
import { storeBriefing, getBriefingById, listUserBriefings } from "../services/briefingStorageService";
import { runCleanupJob } from "../services/cleanupService";
import { createShareLink, getBriefingByShareToken, revokeShareLink } from "../services/shareLinkService";
import { exportBriefing, ExportFormat } from "../services/exportService";
import { v4 as uuidv4 } from "uuid";

const router = Router();

/**
 * POST /api/briefings/upload
 * Upload a PDF file and extract NOTAM text
 * Supports both authenticated and anonymous users
 */
router.post(
  "/upload",
  uploadRateLimiter,
  optionalAuth,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Extract text from PDF
      const rawText = await extractTextFromPdf(req.file.buffer);

      // F-015: Extract NOTAM sections from PDF text (filters non-NOTAM content)
      const notamText = extractNotamSections(rawText);

      // Parse NOTAMs from extracted text
      const parseResult = parseNotams(notamText);

      // Generate UUID for file storage
      const fileId = uuidv4();

      // Store briefing if user is authenticated
      const user = (req as any).user;
      let briefingId: string | undefined;
      
      if (user) {
        try {
          briefingId = await storeBriefing(
            user.id,
            notamText, // Store filtered NOTAM text (F-015)
            parseResult.notams,
            fileId
          );
        } catch (error) {
          // Log error but don't fail the request
          // User still gets the parsed NOTAMs
          console.error("Failed to store briefing:", error);
        }
      }

      // Return the extracted text and parsed NOTAMs
      const response: {
        success: boolean;
        fileId?: string;
        briefingId?: string;
        rawText: string;
        notams: ParsedNotam[];
        warnings: string[];
        userId?: string;
      } = {
        success: true,
        fileId,
        rawText: notamText, // Return filtered NOTAM text (F-015)
        notams: parseResult.notams,
        warnings: parseResult.warnings,
      };

      // Include user ID and briefing ID if authenticated
      if (user) {
        response.userId = user.id;
        if (briefingId) {
          response.briefingId = briefingId;
        }
      }

      res.json(response);
    } catch (error) {
      // Return generic error message to client (detailed error logged server-side)
      console.error("PDF upload error:", error);
      
      if (error instanceof Error) {
        if (error.message.includes("File size exceeds")) {
          return res.status(400).json({ error: "File size exceeds maximum allowed size" });
        }
        if (error.message.includes("Invalid PDF") || error.message.includes("Only PDF")) {
          return res.status(400).json({ error: "Invalid PDF file" });
        }
        if (error.message.includes("timeout") || error.message.includes("too long")) {
          return res.status(408).json({ error: "PDF processing took too long" });
        }
      }
      
      res.status(500).json({ error: "Failed to process PDF" });
    }
  }
);

/**
 * POST /api/briefings/paste
 * Accept pasted NOTAM text
 * Supports both authenticated and anonymous users
 */
router.post(
  "/paste",
  uploadRateLimiter,
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "Text is required" });
      }

      // Validate text length (reasonable limit to prevent abuse)
      const MAX_TEXT_LENGTH = 10 * 1024 * 1024; // 10MB of text
      if (text.length > MAX_TEXT_LENGTH) {
        return res.status(400).json({ error: "Text exceeds maximum allowed length" });
      }

      const trimmedText = text.trim();

      // Parse NOTAMs from pasted text
      const parseResult = parseNotams(trimmedText);

      // Store briefing if user is authenticated
      const user = (req as any).user;
      let briefingId: string | undefined;
      
      if (user) {
        try {
          briefingId = await storeBriefing(
            user.id,
            trimmedText,
            parseResult.notams
          );
        } catch (error) {
          // Log error but don't fail the request
          // User still gets the parsed NOTAMs
          console.error("Failed to store briefing:", error);
        }
      }

      // Return the text and parsed NOTAMs
      const response: {
        success: boolean;
        briefingId?: string;
        rawText: string;
        notams: ParsedNotam[];
        warnings: string[];
        userId?: string;
      } = {
        success: true,
        rawText: trimmedText,
        notams: parseResult.notams,
        warnings: parseResult.warnings,
      };

      // Include user ID and briefing ID if authenticated
      if (user) {
        response.userId = user.id;
        if (briefingId) {
          response.briefingId = briefingId;
        }
      }

      res.json(response);
    } catch (error) {
      // Return generic error message to client
      console.error("Text paste error:", error);
      res.status(500).json({ error: "Failed to process text" });
    }
  }
);

/**
 * GET /api/briefings
 * List all briefings for the authenticated user
 * Requires authentication
 */
router.get(
  "/",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const briefings = await listUserBriefings(user.id, limit, offset);

      res.json({
        success: true,
        briefings,
        count: briefings.length,
      });
    } catch (error) {
      console.error("Error listing briefings:", error);
      res.status(500).json({ error: "Failed to retrieve briefings" });
    }
  }
);

/**
 * GET /api/briefings/:id
 * Get a specific briefing by ID
 * Requires authentication and authorization (user can only access their own briefings)
 */
router.get(
  "/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const briefingId = req.params.id;

      // Authorization check is performed in getBriefingById
      const briefing = await getBriefingById(briefingId, user.id);

      if (!briefing) {
        return res.status(404).json({ error: "Briefing not found" });
      }

      res.json({
        success: true,
        briefing,
      });
    } catch (error) {
      console.error("Error retrieving briefing:", error);
      res.status(500).json({ error: "Failed to retrieve briefing" });
    }
  }
);

/**
 * POST /api/briefings/cleanup
 * Manually trigger cleanup job (for testing/admin purposes)
 * Requires authentication
 * Note: In production, this should be restricted to admin users or removed
 */
router.post(
  "/cleanup",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const result = await runCleanupJob();
      
      if (result.success) {
        res.json({
          success: true,
          deletedCount: result.deletedCount,
          timestamp: result.timestamp,
        });
      } else {
        res.status(500).json({
          success: false,
          errors: result.errors,
          timestamp: result.timestamp,
        });
      }
    } catch (error) {
      console.error("Error running cleanup:", error);
      res.status(500).json({ error: "Failed to run cleanup job" });
    }
  }
);

/**
 * POST /api/briefings/:id/share
 * Generate a share link for a briefing
 * Requires authentication and authorization (user must own the briefing)
 */
router.post(
  "/:id/share",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const briefingId = req.params.id;
      const expiresInDays = parseInt(req.body.expiresInDays as string) || 7;

      // Validate expiresInDays (reasonable range: 1-30 days)
      if (expiresInDays < 1 || expiresInDays > 30) {
        return res.status(400).json({ error: "Expiration must be between 1 and 30 days" });
      }

      const shareLink = await createShareLink(briefingId, user.id, expiresInDays);

      res.json({
        success: true,
        token: shareLink.token,
        shareUrl: shareLink.shareUrl,
        expiresAt: shareLink.expiresAt.toISOString(),
      });
    } catch (error) {
      console.error("Error creating share link:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: "Briefing not found or access denied" });
      }
      res.status(500).json({ error: "Failed to create share link" });
    }
  }
);

/**
 * DELETE /api/briefings/share/:token
 * Revoke a share link
 * Requires authentication and authorization (user must own the briefing)
 */
router.delete(
  "/share/:token",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const token = req.params.token;
      const revoked = await revokeShareLink(token, user.id);

      if (!revoked) {
        return res.status(404).json({ error: "Share link not found or access denied" });
      }

      res.json({
        success: true,
        message: "Share link revoked",
      });
    } catch (error) {
      console.error("Error revoking share link:", error);
      res.status(500).json({ error: "Failed to revoke share link" });
    }
  }
);

/**
 * GET /api/briefings/:id/export
 * Export a briefing in the specified format
 * Requires authentication and authorization (user must own the briefing)
 */
router.get(
  "/:id/export",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const briefingId = req.params.id;
      const format = (req.query.format as string) || "raw";

      // Validate format
      if (!["raw", "categorized", "summary"].includes(format)) {
        return res.status(400).json({ error: "Invalid export format. Must be: raw, categorized, or summary" });
      }

      // Get briefing with authorization check
      const briefing = await getBriefingById(briefingId, user.id);
      if (!briefing) {
        return res.status(404).json({ error: "Briefing not found" });
      }

      // Export briefing
      const exportContent = exportBriefing(briefing, format as ExportFormat);

      // Set appropriate headers for download
      const filename = `briefing-${briefingId}-${format}-${new Date().toISOString().split("T")[0]}.txt`;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      res.send(exportContent);
    } catch (error) {
      console.error("Error exporting briefing:", error);
      res.status(500).json({ error: "Failed to export briefing" });
    }
  }
);

export default router;

