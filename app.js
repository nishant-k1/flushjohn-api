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

// CORS configuration
const corsOptionsAPI = {
  origin: [
    "http://localhost:8080",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://www.flushjohn.com",
    "http://www.flushjohn.com",
    /\.flushjohn\.com$/,
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Create HTTP server
const server = createServer(app);
socketConnect(server);

// Middleware
app.use(cors(corsOptionsAPI));
app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());

// Routes
app.use("/", indexRouter);
app.use("/leads", leadsRouter);
app.use("/blogs", blogsRouter);

// Connect Database
dbConnect();

// Handle 404 errors
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
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
