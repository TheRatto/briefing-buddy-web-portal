import { Request, Response, NextFunction } from "express";
import { auth } from "../auth";

/**
 * Middleware to verify authentication token from Better Auth
 * Allows anonymous access (no auth required) but attaches session if present
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Better Auth session will be available via cookies
    // If no session exists, req.user will be undefined (anonymous access)
    const session = await auth.api.getSession({ headers: req.headers });
    
    if (session) {
      (req as any).user = session.user;
      (req as any).session = session;
    }
    
    next();
  } catch (error) {
    // If session check fails, continue as anonymous
    next();
  }
}

/**
 * Middleware to require authentication
 * Returns 401 if no valid session
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    
    if (!session) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    (req as any).user = session.user;
    (req as any).session = session;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Authentication required" });
  }
}

