import "dotenv/config";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth, pool } from "./auth";
import cors from "cors";
import briefingsRouter from "./routes/briefings";
import shareRouter from "./routes/share";
import { setDatabasePool } from "./services/briefingStorageService";
import { setDatabasePool as setShareLinkDatabasePool } from "./services/shareLinkService";

// Initialize database pool for briefing storage service
setDatabasePool(pool);
// Initialize database pool for share link service
setShareLinkDatabasePool(pool);

const app = express();
const PORT = process.env.PORT || 3005;

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3004",
  credentials: true,
}));

// Better Auth handler - MUST be before express.json()
// Better Auth handles JSON parsing internally
app.all("/api/auth/*", toNodeHandler(auth));

// Express JSON middleware for other routes
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Briefings routes
app.use("/api/briefings", briefingsRouter);

// Share link routes (public, no authentication required)
app.use("/api/share", shareRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
