/**
 * Share Link Routes
 * 
 * Public routes for accessing briefings via share links
 * No authentication required (share links are self-authenticating)
 */

import { Router, Request, Response } from "express";
import { getBriefingByShareToken } from "../services/shareLinkService";

const router = Router();

/**
 * GET /api/share/:token
 * Access a briefing via share link token
 * No authentication required (token is self-authenticating)
 */
router.get(
  "/:token",
  async (req: Request, res: Response) => {
    try {
      const token = req.params.token;

      // Validate and retrieve briefing via share token
      const result = await getBriefingByShareToken(token);

      if (!result) {
        return res.status(404).json({ error: "Share link not found or expired" });
      }

      // Return briefing data (read-only access)
      res.json({
        success: true,
        briefing: result.briefing,
        expiresAt: result.expiresAt.toISOString(),
      });
    } catch (error) {
      console.error("Error accessing share link:", error);
      res.status(500).json({ error: "Failed to access share link" });
    }
  }
);

export default router;

