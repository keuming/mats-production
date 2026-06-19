import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../src/router.js";
import { createContext } from "../src/trpc.js";

const app = express();

// ── Trust proxy (Vercel / Cloudflare) ──────────────────────────────────────
app.set("trust proxy", 1);

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "https://matstransport.com",
  "https://www.matstransport.com",
  "https://admin.matstransport.com",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req: express.Request, res: express.Response) =>
  res.json({ status: "ok", ts: new Date().toISOString() })
);

// ── tRPC ──────────────────────────────────────────────────────────────────────
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(`[tRPC] Error on ${path}:`, error);
      }
    },
  })
);

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_req: express.Request, res: express.Response) => res.status(404).json({ error: "Not found" }));

export default app;
