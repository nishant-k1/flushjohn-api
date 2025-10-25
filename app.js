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
import { initializeCronJobs } from "./features/blogs/services/cronScheduler.js";
import indexRouter from "./routes/index.js";
import fileUploadRouter from "./routes/file-upload.js";
import pdfAccessRouter from "./routes/pdfAccess.js";
import s3CorsRouter from "./routes/s3-cors.js";
import blogAutomationRouter from "./features/blogs/routes/blog-automation.js";

import leadsFeature from "./features/leads/index.js";
import quotesFeature from "./features/quotes/index.js";
import customersFeature from "./features/customers/index.js";
import salesOrdersFeature from "./features/salesOrders/index.js";
import vendorsFeature from "./features/vendors/index.js";
import jobOrdersFeature from "./features/jobOrders/index.js";
import blogsFeature from "./features/blogs/index.js";
import authFeature from "./features/auth/index.js";
import commonFeature from "./features/common/index.js";
const authRouter = authFeature.routes.auth;
const usersRouter = authFeature.routes.users;
const leadsRouter = leadsFeature.routes;
const blogsRouter = blogsFeature.routes.blogs;
const vendorsRouter = vendorsFeature.routes;
const dashboardRouter = commonFeature.routes.dashboard;
const customersRouter = customersFeature.routes;
const quotesRouter = quotesFeature.routes;
const salesOrdersRouter = salesOrdersFeature.routes;
const jobOrdersRouter = jobOrdersFeature.routes;

config({ path: "./.env" });

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  // AWS credentials not configured
}

const app = express();
const log = debug("flushjohn-api:server");

const port = normalizePort(process.env.PORT || "8080");
app.set("port", port);

const getAllowedOrigins = () => {
  return process.env.ORIGINS
    ? process.env.ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];
};

const server = createServer(app);
socketConnect(server);

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-HTTP-Method-Override",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
    "X-Custom-Header",
    "X-Access-Token",
  ],
  exposedHeaders: ["Content-Length", "X-Request-ID"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 600, // 10 minutes (in seconds)
};

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

app.use(logger("dev"));
app.use(json({ limit: "50mb" }));
app.use(urlencoded({ extended: false, limit: "50mb" }));
app.use(cookieParser());

app.use((req, res, next) => {
  if (req.headers["x-http-method-override"]) {
    req.method = req.headers["x-http-method-override"].toUpperCase();
  }
  next();
});

app.use((req, res, next) => {
  next();
});

app.use((req, res, next) => {
  if (req.method !== "OPTIONS") {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
  }

  res.setHeader(
    "Vary",
    "Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");

  res.setHeader("X-Timestamp", Date.now().toString());
  res.setHeader("X-Request-ID", Math.random().toString(36).substring(7));

  next();
});

app.use("/logos", express.static("public/logos"));

app.use(
  "/temp",
  (req, res, next) => {
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

app.use("/pdf", pdfAccessRouter);
app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/file-upload", fileUploadRouter);
app.use("/s3-cors", s3CorsRouter);
app.use("/users", usersRouter);
app.use("/leads", leadsRouter);
app.use("/blogs", blogsRouter);
app.use("/vendors", vendorsRouter);
app.use("/customers", customersRouter);
app.use("/quotes", quotesRouter);
app.use("/salesOrders", salesOrdersRouter);
app.use("/jobOrders", jobOrdersRouter);
app.use("/blog-automation", blogAutomationRouter);
app.use("/dashboard", dashboardRouter);

dbConnect().catch((error) => {
  process.exit(1);
});

let cronJobs;
try {
  cronJobs = initializeCronJobs();
} catch (error) {
  // Failed to initialize cron jobs
}

app.use((req, res, next) => {
  next(createError(404));
});

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

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

function normalizePort(val) {
  const port = parseInt(val, 10);
  return isNaN(port) ? val : port >= 0 ? port : false;
}

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

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  log("Listening on " + bind);
}

export default app;
