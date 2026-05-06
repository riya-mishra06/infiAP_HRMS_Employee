const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

dotenv.config({
  path: "./.env",
});

const compression = require("compression");

const app = express();

app.get("/health", (req, res) => {
  const mongoose = require("mongoose");
  const dbState = mongoose.connection.readyState;

  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? "ok" : "degraded",
    db: dbState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
  });
});

// 1. Gzip Compression for performance
app.use(compression());

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
}));

// 301 Redirect Middleware (Example: force https/www if needed)
app.use((req, res, next) => {
  // if (req.headers['x-forwarded-proto'] !== 'https') {
  //   return res.redirect(301, `https://${req.headers.host}${req.url}`);
  // }
  next();
});

// 2. Caching Headers for performance
app.use((req, res, next) => {
  if (req.method === 'GET') {
    if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.set('Cache-Control', 'no-store');
    }
  }
  next();
});

app.use(express.json({ limit: "6mb" }));
app.use(express.urlencoded({ extended: true, limit: "6mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Import Routes
const authRouter = require("./routes/auth.routes");
const mainAdminRouter = require("./routes/mainAdmin.routes");
const employeeRouter = require("./routes/employee.routes");
const leaveRouter = require("./routes/leave.routes");
const hrRouter = require("./routes/hr.routes");
const adminDashboardRouter = require("./routes/adminDashboard.routes");
const mainAdminDashboardRouter = require("./routes/mainAdminDashboard.routes");
const wfhRouter = require("./routes/wfh.routes");
const eventRouter = require("./routes/event.routes");
const notificationsRouter = require("./routes/notifications.routes");

// Routes Declaration
app.use("/api/v1/auth", authRouter);
app.use("/api/auth", authRouter);
app.use("/api/v1/main-admin", mainAdminRouter);
app.use("/api/v1", employeeRouter);
app.use("/api/v1", leaveRouter);
app.use("/api/v1/hr", hrRouter);
app.use("/api/v1/admin-dashboard", adminDashboardRouter);
app.use("/api/v1/main-admin-dashboard", mainAdminDashboardRouter);
app.use("/api/v1/wfh", wfhRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/notifications", notificationsRouter);

// Basic health check
app.get("/", (req, res) => {
  res.json({ message: "InfiAP Tech Solution API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

module.exports = app;
