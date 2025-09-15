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
import indexRouter from "./routes/index.js";
import leadsRouter from "./routes/leads.js";
import blogsRouter from "./routes/blogs.js";

config();

const app = express();
const log = debug("flushjohn-api:server");

const port = normalizePort(process.env.PORT || "8080");
app.set("port", port);

// CORS configuration - Environment-based
const getAllowedOrigins = () => {
  // Get origins from environment variables
  const devOrigins = process.env.DEV_ORIGINS
    ? process.env.DEV_ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [
        "http://localhost:8080",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
      ];

  const prodOrigins = process.env.PROD_ORIGINS
    ? process.env.PROD_ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [
        "https://www.flushjohn.com",
        "http://www.flushjohn.com",
        /\.flushjohn\.com$/,
      ];

  // Log configuration for debugging
  if (process.env.NODE_ENV === "development") {
    console.log("🔧 CORS Configuration:");
    console.log("  Environment:", process.env.NODE_ENV);
    console.log("  Dev Origins:", devOrigins);
    console.log("  Prod Origins:", prodOrigins);
  }

  // In production, only allow production domains
  if (process.env.NODE_ENV === "production") {
    if (prodOrigins.length === 0) {
      console.warn("⚠️  No production origins configured! Using fallback.");
      return ["https://www.flushjohn.com"];
    }
    return prodOrigins;
  }

  // In development, allow development origins + production origins
  const allOrigins = [...devOrigins, ...prodOrigins];

  if (allOrigins.length === 0) {
    console.warn("⚠️  No origins configured! Using fallback.");
    return [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ];
  }

  return allOrigins;
};

const corsOptionsAPI = {
  origin: getAllowedOrigins(),
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

// CORS debugging endpoint (only in development)
if (process.env.NODE_ENV !== "production") {
  app.get("/cors-debug", (req, res) => {
    res.json({
      message: "CORS Debug Info",
      origin: req.headers.origin,
      allowedOrigins: getAllowedOrigins(),
      userAgent: req.headers["user-agent"],
      method: req.method,
      headers: req.headers,
      timestamp: new Date().toISOString(),
    });
  });
}

// Routes
app.use("/", indexRouter);
app.use("/leads", leadsRouter);
app.use("/blogs", blogsRouter);

// ✅ STANDARDIZED: Connect Database with enhanced error handling
dbConnect().catch((error) => {
  console.error("❌ Failed to connect to database:", error.message);
  process.exit(1);
});

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
      allowedOrigins:
        process.env.NODE_ENV === "development"
          ? getAllowedOrigins()
          : undefined,
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
