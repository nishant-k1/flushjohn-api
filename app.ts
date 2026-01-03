import createError, { HttpError } from "http-errors";
import express, { json, urlencoded, Request, Response, NextFunction, Application } from "express";
import { config } from "dotenv";
import debug from "debug";

import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import compression from "compression";
import { createServer, Server } from "http";

import dbConnect from "./lib/dbConnect.js";
import socketConnect from "./lib/socketConnect.js";
import { initializeCronJobs } from "./features/blogs/services/cronScheduler.js";
import indexRouter from "./routes/index.js";
import fileUploadRouter from "./routes/file-upload.js";
import pdfAccessRouter from "./routes/pdfAccess.js";
import s3CorsRouter from "./routes/s3-cors.js";
import contactRouter from "./routes/contact.js";
import blogAutomationRouter from "./features/blogs/routes/blog-automation.js";

import leadsRouter from "./features/leads/routes/leads.js";
import quotesRouter from "./features/quotes/routes/quotes.js";
import customersRouter from "./features/customers/routes/customers.js";
import salesOrdersRouter from "./features/salesOrders/routes/salesOrders.js";
import vendorsRouter from "./features/vendors/routes/vendors.js";
import jobOrdersRouter from "./features/jobOrders/routes/jobOrders.js";
import blogsRouter from "./features/blogs/routes/blogs.js";
import authRouter from "./features/auth/routes/auth.js";
import usersRouter from "./features/auth/routes/users.js";
import notesRouter from "./features/notes/routes/notes.js";
import contactsRouter from "./features/contacts/routes/contacts.js";
import salesAssistRouter from "./features/salesAssist/routes/salesAssist.js";
import speechRecognitionRouter from "./features/salesAssist/routes/speechRecognition.js";
import notificationsRouter from "./features/notifications/routes/notifications.js";
import paymentsRouter from "./features/payments/routes/payments.js";
import {
  authenticateToken,
  authorizeRoles,
} from "./features/auth/middleware/auth.js";
import {
  strictLimiter,
  uploadLimiter,
  publicLimiter,
} from "./middleware/rateLimiter.js";

// All routers are now directly imported above

config({ path: "./.env" });

// Validate critical environment variables
if (!process.env.SECRET_KEY) {
  console.error(
    "ERROR: SECRET_KEY environment variable is required for JWT authentication"
  );
  process.exit(1);
}

if (!process.env.MONGO_DB_URI) {
  console.error(
    "ERROR: MONGO_DB_URI environment variable is required for database connection"
  );
  process.exit(1);
}

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  // AWS credentials not configured
}

const app: Application = express();
const log = debug("flushjohn-api:server");

const port = normalizePort(process.env.PORT || "8080");
app.set("port", port);

const getAllowedOrigins = (): string[] => {
  return process.env.ORIGINS
    ? process.env.ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];
};

const server: Server = createServer(app);
socketConnect(server);

const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
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

// ✅ PERFORMANCE: Add compression middleware (50-80% smaller responses)
app.use(compression());

app.use(logger("dev"));

// Stripe webhook needs raw body - register BEFORE json() middleware affects it
// We need to use express.raw() for this specific route
app.use(
  "/payments/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const paymentsFeature = await import("./features/payments.js");
      const webhookRouter = paymentsFeature.default.routes.webhook;
      return webhookRouter(req, res, next);
    } catch (error: any) {
      next(error);
    }
  }
);

app.use(json({ limit: "10mb" }));
app.use(urlencoded({ extended: false, limit: "10mb" }));
app.use(cookieParser());

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.headers["x-http-method-override"]) {
    req.method = (req.headers["x-http-method-override"] as string).toUpperCase();
  }
  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method !== "OPTIONS") {
    // ✅ PERFORMANCE: Allow caching for GET requests (will be overridden by cache middleware where needed)
    if (req.method === "GET") {
      // Cache middleware will set appropriate headers
    } else {
      // No cache for non-GET requests
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");
    }
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

app.use("/pdf", pdfAccessRouter);
app.use("/", indexRouter);
app.use("/auth", authRouter);
// ✅ PERFORMANCE: Add rate limiting to public and expensive endpoints
app.use("/contact", publicLimiter, contactRouter);
app.use("/file-upload", authenticateToken, uploadLimiter, fileUploadRouter);
app.use("/s3-cors", s3CorsRouter);
// Public lead submission endpoint (POST /leads - no auth required)
// ✅ PERFORMANCE: Add rate limiting to prevent abuse
app.post("/leads", publicLimiter, async (req: Request, res: Response) => {
  try {
    console.log("📥 Received public lead submission");
    const leadData = req.body;

    // Basic validation
    if (!leadData.email || !leadData.fName || !leadData.phone) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: email, fName, and phone are required",
        error: "VALIDATION_ERROR",
      });
    }

    // Use the service to create the lead
    const { createLead } = await import(
      "./features/leads/services/leadsService.js"
    );
    const lead = await createLead(leadData);

    // Emit socket event if namespace is available
    // OPTIMIZATION: Emit only the new lead instead of fetching all leads
    if (global.leadsNamespace) {
      try {
        const payload = {
          lead: (lead as any).toObject ? (lead as any).toObject() : lead,
          action: "add",
        };
        global.leadsNamespace.emit("leadCreated", payload);
        console.log("📢 Emitted leadCreated event to socket clients");
      } catch (emitError) {
        console.error("❌ Error emitting leadCreated event:", emitError);
      }
    }

    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error: any) {
    console.error("❌ Error creating lead via public endpoint:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: "VALIDATION_ERROR",
        details: error.errors
          ? Object.values(error.errors).map((err: any) => err.message)
          : [error.message],
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Lead already exists",
        error: "DUPLICATE_LEAD",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create lead",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && {
        details: error.message,
      }),
    });
  }
});
app.use("/users", authenticateToken, authorizeRoles("admin"), usersRouter); // Only admins can manage users
// Other lead routes (GET, PUT, DELETE) require authentication
app.use("/leads", authenticateToken, leadsRouter);
app.use("/blogs", blogsRouter); // Keep public for marketing
app.use("/vendors", authenticateToken, vendorsRouter);
app.use("/customers", authenticateToken, customersRouter);
app.use("/quotes", authenticateToken, quotesRouter);
app.use("/salesOrders", authenticateToken, salesOrdersRouter);
app.use("/jobOrders", authenticateToken, jobOrdersRouter);
app.use("/payments", authenticateToken, paymentsRouter);
// app.use("/phone", phoneRouter); // Commented out - will be enabled in future
app.use(
  "/blog-automation",
  authenticateToken,
  authorizeRoles("admin"),
  blogAutomationRouter
); // Only admins can automate blogs
// ✅ PERFORMANCE: Add strict rate limiting to dashboard (expensive queries)
// app.use("/dashboard", authenticateToken, strictLimiter, dashboardRouter); // TODO: dashboardRouter not found
app.use("/notes", authenticateToken, notesRouter);
app.use("/notifications", authenticateToken, notificationsRouter);
app.use("/contacts", authenticateToken, contactsRouter);
app.use("/sales-assist", salesAssistRouter);
app.use("/sales-assist", speechRecognitionRouter);

dbConnect()
  .then(() => {
    console.log("✅ Database connected successfully");
  })
  .catch((error: Error) => {
    console.error("❌ Database connection failed:", error.message);
    console.error("Please check your MONGO_DB_URI in .env file");
  process.exit(1);
});

try {
  initializeCronJobs();
} catch {
  // Failed to initialize cron jobs
}

app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
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

function normalizePort(val: string): string | number | false {
  const port = parseInt(val, 10);
  return isNaN(port) ? val : port >= 0 ? port : false;
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== "listen") throw error;
  const _bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  switch (error.code) {
    case "EACCES":
      process.exit(1);
      break;
    case "EADDRINUSE":
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening(): void {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + (addr?.port || port);
  console.log("🚀 Server started successfully!");
  console.log(`🌐 Listening on ${bind}`);
  console.log(`📡 API ready at http://localhost:${typeof addr === "object" && addr ? addr.port : port}`);
  log("Listening on " + bind);
}

export default app;
