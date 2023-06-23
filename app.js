var createError = require("http-errors");
var express = require("express");

var app = express();
require("dotenv").config();
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const dbConnect = require("./lib/dbConnect");
var indexRouter = require("./routes/index");
const leadsRouter = require("./routes/leads.js");
const cors = require("cors");

var debug = require("debug")("crm-rp-socket:server");
var http = require("http");

var port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

const corsOptions = {
  origin: [
    "http://localhost:8080",
    "http://localhost:3000",
    "https://www.reliableportable.com",
    "http://www.reliableportable.com",
    /\.reliableportable\.com$/,
  ],
  methods: ["GET", "POST", "PUT", "DELETE"], // Specify the allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Specify the allowed headers
  credentials: true,
};
var server = http.createServer(app);
const io = require("socket.io")(server, { cors: corsOptions });
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

// Apply CORS middleware
app.use(cors(corsOptions));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/", indexRouter);

// Attach io to the response object using middleware
app.use(function (req, res, next) {
  res.io = io; // Attach io to the response object
  next();
});

app.use("/leads", leadsRouter);

// Connect DB
dbConnect();

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
});

module.exports = app;
