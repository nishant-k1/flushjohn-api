import createError from "http-errors";
import express, { json, urlencoded } from "express";
import { config } from "dotenv";
import debug from "debug";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import { createServer } from "http";

import dbConnect from "./lib/dbConnect/index.js";
import socketConnect from "./lib/socketConnect/index.js";
import { schedulePDFCleanup, runCleanupOnStartup } from "./jobs/pdfCleanup.js";
// Cross-cutting routes
import indexRouter from "./routes/index.js";
import fileUploadRouter from "./routes/file-upload.js";
import pdfAccessRouter from "./routes/pdfAccess.js";
import pdfCleanupRouter from "./routes/pdfCleanup.js";

// Feature-based imports
import leadsFeature from "./features/leads/index.js";
import quotesFeature from "./features/quotes/index.js";
import customersFeature from "./features/customers/index.js";
import salesOrdersFeature from "./features/salesOrders/index.js";
import vendorsFeature from "./features/vendors/index.js";
import jobOrdersFeature from "./features/jobOrders/index.js";
import blogsFeature from "./features/blogs/index.js";
import authFeature from "./features/auth/index.js";

// Extract routes from features
const authRouter = authFeature.routes.auth;
const usersRouter = authFeature.routes.users;
const leadsRouter = leadsFeature.routes;
const blogsRouter = blogsFeature.routes;
const vendorsRouter = vendorsFeature.routes;
const customersRouter = customersFeature.routes;
const quotesRouter = quotesFeature.routes;
const salesOrdersRouter = salesOrdersFeature.routes;
const jobOrdersRouter = jobOrdersFeature.routes;

// Load environment variables
config({ path: "./.env" });

// Verify AWS credentials are loaded
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn("⚠️ AWS credentials not found in environment variables");
  console.warn(
    "AWS_ACCESS_KEY_ID:",
    process.env.AWS_ACCESS_KEY_ID ? "Present" : "Missing"
  );
  console.warn(
    "AWS_SECRET_ACCESS_KEY:",
    process.env.AWS_SECRET_ACCESS_KEY ? "Present" : "Missing"
  );
}

const app = express();
const log = debug("flushjohn-api:server");

const port = normalizePort(process.env.PORT || "8080");
app.set("port", port);

// CORS configuration - Single environment setup
const getAllowedOrigins = () => {
  // Get origins from single ORIGINS environment variable
  const origins = process.env.ORIGINS
    ? process.env.ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

  return origins;
};

const corsOptionsAPI = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like desktop apps, mobile apps, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],
  exposedHeaders: ["Content-Length", "Content-Type"],
  credentials: true,
  maxAge: 0, // Force no cache in development
  optionsSuccessStatus: 204,
  preflightContinue: false,
};

// Create HTTP server
const server = createServer(app);
socketConnect(server);

// Manual CORS handling - more aggressive approach
app.use((req, res, next) => {
  // Ultra-aggressive cache busting
  res.header(
    "Cache-Control",
    "no-cache, no-store, must-revalidate, private, max-age=0"
  );
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  res.header("Access-Control-Max-Age", "0");
  res.header(
    "Vary",
    "Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
  );

  // Allow all origins for development
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,OPTIONS,PATCH,HEAD"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers, X-CORS-Bust, X-Request-ID, X-Timestamp"
  );
  res.header(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Type, X-CORS-Timestamp"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    // Add unique timestamp to prevent any caching
    res.header("X-CORS-Timestamp", Date.now().toString());
    res.header("X-CORS-Request-ID", Math.random().toString(36).substr(2, 9));
    console.log(
      `🔧 CORS Preflight: ${req.method} ${req.url} - Origin: ${origin}`
    );
    res.status(200).end();
    return;
  }

  // Log all requests for debugging
  if (req.method === "PUT" || req.method === "POST") {
    console.log(`🔧 ${req.method} Request: ${req.url} - Origin: ${origin}`);
  }

  next();
});

app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());

// Serve static files from public directory
app.use("/logos", express.static("public/logos"));

// Serve temp PDFs with no-cache headers to prevent stale PDFs
app.use(
  "/temp",
  (req, res, next) => {
    // Set no-cache headers to prevent browser caching
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  },
  express.static("public/temp", {
    etag: false,
    lastModified: false,
    cacheControl: false,
  })
);

// Secure PDF access routes (replaces public static serving)
app.use("/pdf", pdfAccessRouter);

// PDF cleanup routes (for managing local PDFs)
app.use("/pdf-cleanup", pdfCleanupRouter);

// CORS debugging endpoint
app.get("/cors-debug", (req, res) => {
  res.json({
    message: "CORS Debug Info",
    origin: req.headers.origin,
    allowedOrigins: getAllowedOrigins(),
    userAgent: req.headers["user-agent"],
    method: req.method,
    headers: req.headers,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Routes
app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/file-upload", fileUploadRouter);
app.use("/users", usersRouter);
app.use("/leads", leadsRouter);
app.use("/blogs", blogsRouter);
app.use("/vendors", vendorsRouter);
app.use("/customers", customersRouter);
app.use("/quotes", quotesRouter);
app.use("/salesOrders", salesOrdersRouter);
app.use("/jobOrders", jobOrdersRouter);

// ✅ STANDARDIZED: Connect Database with enhanced error handling
dbConnect().catch((error) => {
  console.error("❌ Failed to connect to database:", error.message);
  process.exit(1);
});

// ✅ Schedule automatic PDF cleanup (runs daily at 2 AM by default)
schedulePDFCleanup();

// ✅ Optionally run cleanup on startup
runCleanupOnStartup();

// Handle 404 errors
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // CORS error handling
  if (err.message && err.message.includes("CORS")) {
    res.status(403).json({
      success: false,
      message: "CORS Error: Request blocked by CORS policy",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "CORS policy violation",
      allowedOrigins: getAllowedOrigins(),
      origin: req.headers.origin,
    });
    return;
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error:
      process.env.NODE_ENV === "development" ? err : "Something went wrong",
  });
});

// Start Server
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

// Normalize port function
function normalizePort(val) {
  const port = parseInt(val, 10);
  return isNaN(port) ? val : port >= 0 ? port : false;
}

// Handle server errors
function onError(error) {
  if (error.syscall !== "listen") throw error;
  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
    default:
      throw error;
  }
}

// Log when server is listening
function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  console.log("🚀 Listening on " + bind);
  log("Listening on " + bind);
}

export default app;
