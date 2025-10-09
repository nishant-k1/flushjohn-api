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
import indexRouter from "./routes/index.js";
import authRouter from "./routes/auth.js";
import fileUploadRouter from "./routes/file-upload.js";
import usersRouter from "./routes/users.js";
import leadsRouter from "./routes/leads.js";
import blogsRouter from "./routes/blogs.js";
import vendorsRouter from "./routes/vendors.js";
import customersRouter from "./routes/customers.js";
import quotesRouter from "./routes/quotes.js";
import salesOrdersRouter from "./routes/salesOrders.js";
import jobOrdersRouter from "./routes/jobOrders.js";
import pdfAccessRouter from "./routes/pdfAccess.js";
import pdfCleanupRouter from "./routes/pdfCleanup.js";

config();

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
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],
  credentials: process.env.CORS_CREDENTIALS === "false" ? false : true,
  optionsSuccessStatus: 200, // For legacy browser support
  preflightContinue: false,
};

// Create HTTP server
const server = createServer(app);
socketConnect(server);

// Middleware
app.use(cors(corsOptionsAPI));

// CORS error handling middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,OPTIONS,PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
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
