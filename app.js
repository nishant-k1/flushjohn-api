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
  // AWS credentials not found in environment variables
}

const app = express();
const log = debug("flushjohn-api:server");

const port = normalizePort(process.env.PORT || "8080");
app.set("port", port);

// CORS configuration
const getAllowedOrigins = () => {
  const origins = process.env.ORIGINS
    ? process.env.ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

  // Add some default origins for production
  const defaultOrigins = [
    "https://crm.flushjohn.com",
    "https://www.flushjohn.com",
    "http://localhost:3000",
    "http://localhost:3001",
  ];

  const allOrigins = [...origins, ...defaultOrigins];
  const uniqueOrigins = [...new Set(allOrigins)];

  return uniqueOrigins;
};

// Create HTTP server
const server = createServer(app);
socketConnect(server);

// CORS middleware with enhanced debugging
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        console.log(`🔍 CORS check - No origin (non-browser request)`);
        return callback(null, true);
      }
      const allowedOrigins = getAllowedOrigins();

      // Enhanced debug logging
      console.log(`🔍 CORS check - Origin: ${origin}`);
      console.log(`🔍 CORS check - Allowed origins:`, allowedOrigins);

      if (allowedOrigins.includes(origin)) {
        console.log(`✅ CORS check - Origin allowed: ${origin}`);
        return callback(null, true);
      }

      console.log(`❌ CORS check - Origin blocked: ${origin}`);
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
      "X-Custom-Header",
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 0, // Disable CORS preflight caching completely to prevent browser cache issues
  })
);

app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());

// Method override middleware to handle X-HTTP-Method-Override
app.use((req, res, next) => {
  if (req.headers["x-http-method-override"]) {
    req.method = req.headers["x-http-method-override"].toUpperCase();
    console.log(`🔄 Method overridden to: ${req.method}`);
  }
  next();
});

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(
    `📥 ${req.method} ${req.url} - Origin: ${req.headers.origin || "none"}`
  );
  next();
});

// Add cache control headers for API responses to prevent aggressive caching
app.use((req, res, next) => {
  // Don't apply no-cache headers to OPTIONS requests (CORS preflight)
  if (req.method !== "OPTIONS") {
    // Set cache control headers for API responses (but not CORS preflight)
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
  }

  // Additional headers to prevent CDN/proxy caching issues
  res.setHeader(
    "Vary",
    "Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");

  // Add unique headers to force fresh CORS responses
  res.setHeader("X-Timestamp", Date.now().toString());
  res.setHeader("X-Request-ID", Math.random().toString(36).substring(7));

  next();
});

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
      process.exit(1);
    case "EADDRINUSE":
      process.exit(1);
    default:
      throw error;
  }
}

// Log when server is listening
function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  log("Listening on " + bind);
}

export default app;
