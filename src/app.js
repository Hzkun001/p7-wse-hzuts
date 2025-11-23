import express from "express";
import morgan from "morgan";
import helmet from "helmet";                 // NEW
import cors from "cors";                     // NEW
import rateLimit from "express-rate-limit";  // NEW

import membersRoutes from "./routes/members.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { env } from "./config/env.js";       // NEW

const app = express();

/** Security middleware **/
app.disable("x-powered-by");
app.use(helmet({
  // Dev: izinkan semua, tanpa CSP ketat dulu biar gampang test.
  contentSecurityPolicy: false
}));
app.use(cors({ origin: env.corsOrigin }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

/** Rate limiter global **/
const limiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "fail", message: "Terlalu banyak request, coba lagi nanti." }
});
app.use(limiter);

/** Body parser (JSON only) **/
app.use(express.json());

/** Health & uptime monitoring **/
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),            // detik
    now: new Date().toISOString(),
    env: env.nodeEnv
  });
});
app.get("/uptime", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

/** Info endpoint (syarat tugas) **/
app.get("/api/info", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Service info",
    data: {
      name: "UTS-WSE Members API",
      version: "v1",
      time: new Date().toISOString(),
      resources: ["/api/members"],
      principles7: [
        "Resource-based URI: /api/members, /api/members/:id",
        "HTTP methods semantics: GET/POST/PUT/PATCH/DELETE",
        "Stateless: tidak pakai session server",
        "Proper status codes: 200/201/400/404/500/304",
        "Consistent JSON structure: {status,message,data|errors}",
        "Caching hints: ETag + 304 untuk GET list",
        "HATEOAS ringan: links self & collection pada POST"
      ]
    }
  });
});

// === HEALTH CHECK & MONITORING ===
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    now: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || "development",
    memory: process.memoryUsage()
  });
});

/** Routes utama **/
app.use("/api/members", membersRoutes);

/** 404 fallback **/
app.use((req, res) => {
  res.status(404).json({ status: "fail", message: "Endpoint tidak ditemukan" });
});

/** Global error handler **/
app.use(errorHandler);

/** Start **/
app.listen(env.port, () => {
  console.log(`Members API running on http://localhost:${env.port}`);
});

export default app;
