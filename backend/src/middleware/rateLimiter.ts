import rateLimit from "express-rate-limit";

/**
 * Rate limiter for upload endpoints
 * Limits: 10 requests per 15 minutes per IP
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: "Too many upload requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

