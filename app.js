var createError = require("http-errors");
var express = require("express");
require("dotenv").config();
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const dbConnect = require("./lib/dbConnect");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const leadsRouter = require("./routes/leads.js");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/leads", leadsRouter);

// Connect DB

const handleDbConnect = () => {
  dbConnect();
};

handleDbConnect();
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
